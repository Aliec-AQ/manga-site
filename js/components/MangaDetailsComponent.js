export default {
    template: `
        <div class="manga-container">
            <h1>{{ mangaDetails.attributes.title.en }}</h1>
            <div class="manga-details">
                <img :src="mangaDetails.coverArt" alt="Cover Art" loading="lazy">
                <div class="info">
                    <p><span class="label">Original Language:</span> {{ mangaDetails.attributes.originalLanguage }}</p>
                    <p><span class="label">Auteur</span> {{ mangaDetails.authorDetails }}</p>
                    <p><span class="label">Status:</span> {{ mangaDetails.attributes.status }}</p>
                    <p><span class="label">Année:</span> {{ mangaDetails.attributes.year }}</p>
                    <p><span class="label">Tags:</span>
                        <span v-for="tag in mangaDetails.attributes.tags" :key="tag.id" class="tag">{{ tag.attributes.name.en }}</span>
                    </p>
                    <p><span class="label">Description:</span></p>
                    <p>{{ mangaDetails.attributes.description.en }}</p>
                    <button @click="goToMenu" class="back-button">Back to Manga List</button>
                    <button @click="toggleFavorite(mangaDetails.id, !favoriteManga.includes(mangaDetails.id))" class="favorite-button">
                        {{ favoriteManga.includes(mangaDetails.id) ? 'Remove from Favorites' : 'Add to Favorites' }}
                    </button>
                </div>
            </div>
            <h1 v-if="chapters.length == 0">Aucun chapitre disponible pour la langue {{language}}</h1>
            <h2 v-if="chapters.length > 0 ">Chapitres</h2>
            <ul class="chapter-list">
                <li v-for="chapter in chapters" :key="chapter.id" @click="loadChapterContent(chapter.id)" class="chapter-item">
                    {{ chapter.chapter }}
                </li>
            </ul>
        </div>
    `,
    props: ['mangaDetails', 'chapters', 'favoriteManga', 'language'],
    methods: {
        goToMenu() {
            this.$emit('go-to-menu');
        },
        toggleFavorite(idManga, add) {
            this.$emit('toggle-favorite', idManga, add);
        },
        loadChapterContent(chapterId) {
            this.$emit('load-chapter-content', chapterId);
        }
    }
}