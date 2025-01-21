export default {
    template: `
        <div>
            <h1>Recent Manga</h1>
            <ul class="manga-list">
                <li v-for="manga in mangaList" :key="manga.id" @click="loadSelectedManga(manga.id)" class="card">
                    <img :src="manga.coverArt" alt="Cover Art" class="manga-cover" loading="lazy">
                    <div class="manga-title">{{ manga.attributes.title.en }}</div>
                </li>
            </ul>
            <div class="pagination-controls">
                <button @click="prevPage" :disabled="pagination.offset === 0">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <button v-for="page in pageRange" :key="page" @click="goToPage(page)" :class="{ active: page === currentPage }">
                    {{ page }}
                </button>
                <button @click="nextPage" :disabled="pagination.offset + pagination.limit >= pagination.total">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `,
    props: ['mangaList', 'pagination', 'pageRange', 'currentPage'],
    methods: {
        loadSelectedManga(mangaId) {
            this.$emit('load-selected-manga', mangaId);
        },
        prevPage() {
            this.$emit('prev-page');
        },
        nextPage() {
            this.$emit('next-page');
        },
        goToPage(page) {
            this.$emit('go-to-page', page);
        }
    }
}