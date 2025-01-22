import config from './config.js'
import HeaderComponent from './components/HeaderComponent.js'
import MangaListComponent from './components/MangaListComponent.js'
import MangaDetailsComponent from './components/MangaDetailsComponent.js'
import ChapterContentComponent from './components/ChapterContentComponent.js'

window.addEventListener('load', () => {
    Vue.createApp({
        components: {
            HeaderComponent,
            MangaListComponent,
            MangaDetailsComponent,
            ChapterContentComponent
        },
        data() {
            return {
                // Recherche de manga
                showTagDropdown: false,
                searchQuery: '',
                includedTags: [],
                excludedTags: [],
                availableTags: [],

                // Liste des mangas
                mangaList: [],
                pagination: {
                    limit: 40,
                    offset: 0,
                    total: 0
                },
                
                // Détail d'un manga
                selectedManga: null,
                chapters: [],
                
                // Détail d'un chapitre
                selectedChapter: null,
                chapterImages: [],
                nextChapterId: null,
                prevChapterId: null,

                // Autres
                page: 'home',
                loading: true,
                error: null,
                favoriteManga: [],
                availableLanguages: ['en', 'fr'],
                language: 'en',
            }
        },

        methods: {

            /*********************
            *     LOAD DATA      *
            **********************/
            // Charge la liste des mangas avec les paramètres donnés
            async loadManga(params = {}, pagination={limit: this.pagination.limit, offset: this.pagination.offset}) {
                this.loading = true
                try {
                    const response = await axios.get(`${config.apiUrl}/manga`, { params: { ...params, ...pagination, includes: ['cover_art'], availableTranslatedLanguage : [this.language] } })
                    this.mangaList = response.data.data
                    this.mangaList.forEach(manga => {
                        manga.coverArt = config.coverUrl + manga.id + '/' + manga.relationships.find(relationship => relationship.type === 'cover_art').attributes.fileName + ".256.jpg"
                    });
                    this.pagination.total = response.data.total

                    this.saveToLocalStorage();
                } catch (error) {
                    this.error = error
                } finally {
                    this.loading = false
                }
            },

            // Récupère les tags disponibles pour les mangas
            async fetchTags() {
                try {
                    const response = await axios.get(`${config.apiUrl}/manga/tag`)
                    this.availableTags = response.data.data.sort((a, b) => a.attributes.name.en.localeCompare(b.attributes.name.en))
                } catch (error) {
                    this.error = error
                }
            },

            // Recherche des mangas en fonction des tags et de la requête de recherche
            async searchManga(searchQuery) {
                this.goToMenu();
                this.loading = true;
                this.showTagDropdown = false;
                try {
                    const tagsResponse = await axios.get(`${config.apiUrl}/manga/tag`)
                    const includedTagIDs = tagsResponse.data.data
                        .filter(tag => this.includedTags.includes(tag.attributes.name.en))
                        .map(tag => tag.id)
                    const excludedTagIDs = tagsResponse.data.data
                        .filter(tag => this.excludedTags.includes(tag.attributes.name.en))
                        .map(tag => tag.id)


                    const params = {
                        includedTags: includedTagIDs,
                        excludedTags: excludedTagIDs,
                    }
                    if (searchQuery) {
                        params.title = searchQuery;
                    }

                    await this.loadManga(params)
                } catch (error) {
                    this.error = error
                } finally {
                    this.loading = false
                }
            },

            // Charge les détails du manga sélectionné
            async loadSelectedManga(mangaId) {
                this.loading = true;
                this.selectedManga = mangaId;
                this.chapters = [];
                let offset = 0;
                const limit = 100;
            
                try {
                    while (true) {
                        const response = await axios.get(`${config.apiUrl}/manga/${mangaId}/feed`, {
                            params: {
                                limit,
                                offset,
                                translatedLanguage: [this.language],
                                order: { chapter: 'asc' }
                            }
                        });
            
                        const newChapters = response.data.data;
                        this.chapters.push(...newChapters);
            
                        if (newChapters.length < limit) break;
                        offset += limit;
                    }

                    this.chapters.sort((a, b) => a.attributes.chapter - b.attributes.chapter);

                    // Fetch manga details
                    const detailsResponse = await axios.get(`${config.apiUrl}/manga/${mangaId}`, {
                        params: { includes: ['cover_art', 'author'] }
                    });
                    this.mangaDetails = detailsResponse.data.data;
                    this.mangaDetails.coverArt = config.coverUrl + this.mangaDetails.id + '/' + detailsResponse.data.data.relationships.find(relationship => relationship.type === 'cover_art').attributes.fileName + ".512.jpg";
                    this.mangaDetails.authorDetails = detailsResponse.data.data.relationships.find(relationship => relationship.type === 'author').attributes.name;
                    
                    console.log(this.mangaDetails);
                    
                    this.page = "detail";
            
                    this.saveToLocalStorage();
                } catch (error) {
                    this.error = error;
                } finally {
                    this.loading = false;
                }
            },

            // Charge le contenu du chapitre sélectionné
            async loadChapterContent(chapterId) {
                this.loading = true
                this.selectedChapter = chapterId
                try {
                    const serverResponse = await axios.get(`${config.apiUrl}/at-home/server/${chapterId}`)
                    const baseUrl = serverResponse.data.baseUrl
                    const hash = serverResponse.data.chapter.hash
                    const data = serverResponse.data.chapter.data

                    this.chapterImages = data.map(image => `${baseUrl}/data/${hash}/${image}`)

                    this.page="chapter"

                    // Trouve l'ID du chapitre suivant
                    const currentChapterIndex = this.chapters.findIndex(chapter => chapter.id === chapterId)
                    if (currentChapterIndex !== -1 && currentChapterIndex < this.chapters.length - 1) {
                        this.nextChapterId = this.chapters[currentChapterIndex + 1].id
                    } else {
                        this.nextChapterId = null
                    }

                    // Trouve l'ID du chapitre précédent
                    if (currentChapterIndex !== -1 && currentChapterIndex > 0) {
                        this.prevChapterId = this.chapters[currentChapterIndex - 1].id
                    } else {
                        this.prevChapterId = null
                    }

                    this.saveToLocalStorage();
                } catch (error) {
                    this.error = error
                } finally {
                    this.loading = false
                }
            },


            /*********************
             *    NAVIGATION    *
             * *******************/

            // Retourne au menu principal
            goToMenu() {
                this.selectedManga = null;
                this.selectedChapter = null;
                this.chapterImages = [];
                this.chapters = [];

                this.page = 'home';

                this.loadManga();
            },

            // Affiche les détails du manga sélectionné
            goToDetail() {
                this.selectedChapter = null;
                this.chapterImages = [];
                this.page = "detail"

                this.saveToLocalStorage();
            },

            // Passe à la page suivante de la liste des mangas
            nextPage() {
                if (this.pagination.offset + this.pagination.limit < this.pagination.total) {
                    this.pagination.offset += this.pagination.limit
                    this.loadManga()
                }
            },

            // Revient à la page précédente de la liste des mangas
            prevPage() {
                if (this.pagination.offset > 0) {
                    this.pagination.offset -= this.pagination.limit
                    this.loadManga()
                }
            },

            // Passe à la page donnée de la liste des mangas
            goToPage(page) {
                this.pagination.offset = (page - 1) * this.pagination.limit;
                this.loadManga();
            },

            /*********************
             *   TAG FILTER    *
             * *******************/

            // Affiche ou cache le menu déroulant des tags
            toggleTagDropdown() {
                this.showTagDropdown = !this.showTagDropdown;
            },
            
            // Met à jour la sélection des tags inclus et exclus
            updateTagSelection(tagName, type) {
                if (type === 'include') {
                    if (this.includedTags.includes(tagName)) {
                        this.includedTags = this.includedTags.filter(tag => tag !== tagName);
                    } else {
                        this.includedTags.push(tagName);
                        this.excludedTags = this.excludedTags.filter(tag => tag !== tagName);
                    }
                } else if (type === 'exclude') {
                    if (this.excludedTags.includes(tagName)) {
                        this.excludedTags = this.excludedTags.filter(tag => tag !== tagName);
                    } else {
                        this.excludedTags.push(tagName);
                        this.includedTags = this.includedTags.filter(tag => tag !== tagName);
                    }
                }
            },

            /*********************
             *  EVENT HANDLERS  *
             * *******************/
            // Gère les événements de pression des touches pour naviguer entre les chapitres
            handleKeydown(event) {
                if (this.loading) return;
                if (event.key === 'ArrowLeft' && this.prevChapterId) {
                    this.loadChapterContent(this.prevChapterId);
                } else if (event.key === 'ArrowRight' && this.nextChapterId) {
                    this.loadChapterContent(this.nextChapterId);
                }
            },

            updateLanguage(language) {
                this.language = language;
                this.loadManga();
            },

            /*********************
             *  GESTION FAvoris  *
             *********************/

            // Ajoute ou enlève un id de la liste des favoris
            toggleFavorite(idManga, add){
                if(add){
                    if (this.favoriteManga.length <= 100){
                        this.favoriteManga.push(idManga);
                    }
                }else{
                    this.favoriteManga = this.favoriteManga.filter(manga => manga !== idManga);
                }
                this.saveToLocalStorage();
            },

            // 
            loadFavorites(){
                if (this.favoriteManga.length > 0) {
                    const params = {
                        ids: this.favoriteManga.slice(0, 100)
                    };
                    this.page="favoris";
                    this.loadManga(params, {});
                }
            },

            /*********************
             *  LOCAL STORAGE   *
             * *******************/

            // Sauvegarde les données dans le localStorage
            saveToLocalStorage(){
                const dataToStore = {
                    selectedManga: this.selectedManga,
                    chapters: this.chapters,
                    selectedChapter: this.selectedChapter,
                    chapterImages: this.chapterImages,
                    nextChapterId: this.nextChapterId,
                    prevChapterId: this.prevChapterId,
                    favoriteManga: this.favoriteManga,
                    language: this.language,
                };
                localStorage.setItem('mangaData', JSON.stringify(dataToStore));
            },

            // Charge les données depuis le localStorage
            loadLocalStorage(){
                const data = JSON.parse(localStorage.getItem('mangaData'));
                if (data) {
                    this.selectedManga = data.selectedManga;
                    this.chapters = data.chapters;
                    this.selectedChapter = data.selectedChapter;
                    this.chapterImages = data.chapterImages;
                    this.nextChapterId = data.nextChapterId;
                    this.prevChapterId = data.prevChapterId;
                    this.favoriteManga = data.favoriteManga;
                    this.language = data.language;
                }
            },
        },

        computed: {
            pageCount() {
                return Math.ceil(this.pagination.total / this.pagination.limit);
            },
            
            currentPage() {
                return Math.floor(this.pagination.offset / this.pagination.limit) + 1;
            },

            pageRange() {
                const range = [];
                const start = Math.max(1, this.currentPage - 3);
                const end = Math.min(this.pageCount, this.currentPage + 3);
                for (let i = start; i <= end; i++) {
                    range.push(i);
                }
                return range;
            }
        },

        beforeMount() {
            this.loadLocalStorage();
        },

        async mounted() {

            if (this.mangaList.length === 0) {
                await this.fetchTags();
                await this.loadManga();
            }

            if(this.selectedManga){
                await this.loadSelectedManga(this.selectedManga);
            }

            if(this.selectedChapter){
                await this.loadChapterContent(this.selectedChapter);
            }

            window.addEventListener('keydown', this.handleKeydown)
        },
    }).mount('#app')
})