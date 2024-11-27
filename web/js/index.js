import config from './config.js'

window.addEventListener('load', () => {
    Vue.createApp({
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
            async loadManga(params = {}) {
                this.loading = true
                try {
                    const response = await axios.get(`${config.apiUrl}/manga`, { params: { ...params, limit: this.pagination.limit, offset: this.pagination.offset, includes: ['cover_art'], availableTranslatedLanguage : [this.language] } })
                    this.mangaList = response.data.data
                    this.mangaList.forEach(manga => {
                        manga.coverArt = config.coverUrl + manga.id + '/' + manga.relationships.find(relationship => relationship.type === 'cover_art').attributes.fileName
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
            async searchManga() {
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
                    if (this.searchQuery) {
                        params.title = this.searchQuery;
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
                try {
                    // Fetch manga aggregate data
                    const aggregateResponse = await axios.get(`${config.apiUrl}/manga/${mangaId}/aggregate`, {
                        params: { translatedLanguage: [this.language] }
                    });
                    const volumes = aggregateResponse.data.volumes;
                    this.chapters = Object.values(volumes).flatMap(volume => Object.values(volume.chapters));
            
                    // Fetch manga details
                    const detailsResponse = await axios.get(`${config.apiUrl}/manga/${mangaId}`, {
                        params: { includes: ['cover_art', 'author'] }
                    });
                    this.mangaDetails = detailsResponse.data.data;
                    this.mangaDetails.coverArt = config.coverUrl+this.mangaDetails.id + '/' + detailsResponse.data.data.relationships.find(relationship => relationship.type === 'cover_art').attributes.fileName;
                    this.mangaDetails.authorDetails = detailsResponse.data.data.relationships.find(relationship => relationship.type === 'author').attributes.name;

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
                this.selectedManga = null
                this.selectedChapter = null
                this.chapterImages = []
                this.chapters = []

                this.saveToLocalStorage();
            },

            // Affiche les détails du manga sélectionné
            goToDetail() {
                this.selectedChapter = null
                this.chapterImages = []

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
                console.log(this.showTagDropdown);
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
                console.log(this.includedTags, this.excludedTags);
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

        watch: {
            language() {
                if (this.selectedManga){
                    this.loadSelectedManga(this.selectedManga);
                }else {
                    this.loadManga();
                }
            }
        }
    }).mount('#app')
})
