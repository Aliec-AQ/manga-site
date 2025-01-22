export default {
    template: `
        <div class="manga-container">
            <div class="background-container">
                <img :src="mangaDetails.coverArt" alt="Cover Art" loading="lazy" class="background-cover">
            </div>
<div class="manga-details">
    <div class="manga-details-container">
        <div class="image-container">
            <img :src="mangaDetails.coverArt" alt="Cover Art" loading="lazy" class="cover-art">
            <button @click="toggleFavorite(mangaDetails.id, !favoriteManga.includes(mangaDetails.id))" class="favorite-button">
                <i :class="favoriteManga.includes(mangaDetails.id) ? 'fas fa-star' : 'far fa-star'"></i>
            </button>
        </div>
        <div class="info">
            <h1>{{ mangaDetails.attributes.title.en }}</h1>
            <p><span class="label">Original Language:</span> {{ mangaDetails.attributes.originalLanguage }}</p>
            <p><span class="label">Auteur</span> {{ mangaDetails.authorDetails }}</p>
            <p><span class="label">Status:</span> {{ mangaDetails.attributes.status }}</p>
            <p><span class="label">Année:</span> {{ mangaDetails.attributes.year }}</p>
            <p><span class="label">Tags:</span>
                <span v-for="tag in mangaDetails.attributes.tags" :key="tag.id" class="tag">{{ tag.attributes.name.en }}</span>
            </p>
            <p><span class="label">Description:</span></p>
            <p>{{ mangaDetails.attributes.description.en }}</p>
        </div>
    </div>
</div>
            <h1 v-if="chapters.length == 0">Aucun chapitre disponible pour la langue {{language}}</h1>
            <h2 v-if="chapters.length > 0 ">Chapitres</h2>
            <ul class="chapter-list">
                <li v-for="chapter in chapters" :key="chapter.id" @click="loadChapterContent(chapter.id)" class="chapter-item">
                    <div class="chapter-header">
                        <span class="chapter-number">Chapter {{ chapter.attributes.chapter }}</span>
                        <span class="chapter-date">{{ new Date(chapter.attributes.publishAt).toLocaleDateString() }}</span>
                    </div>
                    <div class="chapter-details">
                        <span class="chapter-pages">{{ chapter.attributes.pages }} pages</span>
                        <span class="chapter-language">{{ chapter.attributes.translatedLanguage }}</span>
                    </div>
                </li>
            </ul>
        </div>
    `,
    props: ['mangaDetails', 'chapters', 'favoriteManga', 'language'],
    methods: {
        toggleFavorite(idManga, add) {
            this.$emit('toggle-favorite', idManga, add);
        },
        loadChapterContent(chapterId) {
            this.$emit('load-chapter-content', chapterId);
        }
    }
}