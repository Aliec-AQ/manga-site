import config from './config.js'

window.addEventListener('load', () => {
    Vue.createApp({
        data() {
            return {
                showTagDropdown: false,
                mangaList: [],
                selectedManga: null,
                chapters: [],
                selectedChapter: null,
                chapterImages: [],
                loading: true,
                error: null,
                searchQuery: '',
                nextChapterId: null,
                prevChapterId: null,
                includedTags: [],
                excludedTags: [],
                availableTags: [],
                pagination: {
                    limit: 40,
                    offset: 0,
                    total: 0
                }
            }
        },

        methods: {

            /*********************
            *     LOAD DATA      *
            **********************/
            async loadManga(params = {}) {
                this.loading = true
                try {
                    const response = await axios.get(`${config.apiUrl}/manga`, { params: { ...params, limit: this.pagination.limit, offset: this.pagination.offset, includes: ['cover_art'] } })
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

            async fetchTags() {
                try {
                    const response = await axios.get(`${config.apiUrl}/manga/tag`)
                    this.availableTags = response.data.data.sort((a, b) => a.attributes.name.en.localeCompare(b.attributes.name.en))
                } catch (error) {
                    this.error = error
                }
            },

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

            async loadSelectedManga(mangaId) {
                this.loading = true;
                this.selectedManga = mangaId;
                try {
                    // Fetch manga aggregate data
                    const aggregateResponse = await axios.get(`${config.apiUrl}/manga/${mangaId}/aggregate`, {
                        params: { translatedLanguage: ['en'] }
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

            async loadChapterContent(chapterId) {
                this.loading = true
                this.selectedChapter = chapterId
                try {
                    const serverResponse = await axios.get(`${config.apiUrl}/at-home/server/${chapterId}`)
                    const baseUrl = serverResponse.data.baseUrl
                    const hash = serverResponse.data.chapter.hash
                    const data = serverResponse.data.chapter.data

                    this.chapterImages = data.map(image => `${baseUrl}/data/${hash}/${image}`)

                    // Find the next chapter ID
                    const currentChapterIndex = this.chapters.findIndex(chapter => chapter.id === chapterId)
                    if (currentChapterIndex !== -1 && currentChapterIndex < this.chapters.length - 1) {
                        this.nextChapterId = this.chapters[currentChapterIndex + 1].id
                    } else {
                        this.nextChapterId = null
                    }

                    // Find the previous chapter ID
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

            goToMenu() {
                this.selectedManga = null
                this.selectedChapter = null
                this.chapterImages = []
                this.chapters = []

                this.saveToLocalStorage();
            },

            goToDetail() {
                this.selectedChapter = null
                this.chapterImages = []

                this.saveToLocalStorage();
            },

            nextPage() {
                if (this.pagination.offset + this.pagination.limit < this.pagination.total) {
                    this.pagination.offset += this.pagination.limit
                    this.loadManga()
                }
            },

            prevPage() {
                if (this.pagination.offset > 0) {
                    this.pagination.offset -= this.pagination.limit
                    this.loadManga()
                }
            },

            /*********************
             *   TAG FILTER    *
             * *******************/

            toggleTagDropdown() {
                this.showTagDropdown = !this.showTagDropdown;
                console.log(this.showTagDropdown);
            },
            
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
            handleKeydown(event) {
                if (event.key === 'ArrowLeft' && this.prevChapterId) {
                    this.loadChapterContent(this.prevChapterId);
                } else if (event.key === 'ArrowRight' && this.nextChapterId) {
                    this.loadChapterContent(this.nextChapterId);
                }
            },

            /*********************
             *  LOCAL STORAGE   *
             * *******************/

            saveToLocalStorage(){
                const dataToStore = {
                    selectedManga: this.selectedManga,
                    chapters: this.chapters,
                    selectedChapter: this.selectedChapter,
                    chapterImages: this.chapterImages,
                    nextChapterId: this.nextChapterId,
                    prevChapterId: this.prevChapterId,
                };
                localStorage.setItem('mangaData', JSON.stringify(dataToStore));
            },
            loadLocalStorage(){
                const data = JSON.parse(localStorage.getItem('mangaData'));
                if (data) {
                    this.selectedManga = data.selectedManga;
                    this.chapters = data.chapters;
                    this.selectedChapter = data.selectedChapter;
                    this.chapterImages = data.chapterImages;
                    this.nextChapterId = data.nextChapterId;
                    this.prevChapterId = data.prevChapterId;
                }
            },
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
        }
    }).mount('#app')
})
