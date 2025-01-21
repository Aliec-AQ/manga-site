export default {
    template: `
        <div class="chapter">
            <h1>Chapter Content</h1>
            <div class="chapter-images">
                <div v-for="image in chapterImages" :key="image">
                    <img :src="image" loading="lazy" />
                </div>
            </div>
            <div class="navigation-controls">
                <button v-if="prevChapterId" @click="loadChapterContent(prevChapterId)">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <button @click="goToDetail">
                    <i class="fas fa-list"></i>
                </button>
                <button v-if="nextChapterId" @click="loadChapterContent(nextChapterId)">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `,
    props: ['chapterImages', 'prevChapterId', 'nextChapterId'],
    methods: {
        loadChapterContent(chapterId) {
            this.$emit('load-chapter-content', chapterId);
        },
        goToDetail() {
            this.$emit('go-to-detail');
        }
    }
}