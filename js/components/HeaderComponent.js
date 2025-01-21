export default {
    template: `
        <header class="fixed-top">
            <div class="nav-bar">
                <button @click="goToMenu" class="header-button">Home</button>
                <select v-model="selectedLanguage">
                    <option v-for="lang in availableLanguages" :key="lang" :value="lang">{{ lang }}</option>
                </select>
                <button @click="loadFavorites" class="header-button">favoris</button>
                <div class="search-container">
                    <input type="text" v-model="searchQuery" placeholder="Search manga..." @keyup.enter="searchManga">
                    <button @click="searchManga" class="search-button">Search</button>
                    <button @click="toggleTagDropdown" class="search-button">Tags</button>
                </div>
            </div>
            <div class="tag-select-container" v-if="showTagDropdown">
                <label>Tags:</label>
                <div class="tag-grid">
                    <div v-for="tag in availableTags" :key="tag.id" class="tag-item">
                        <label>{{ tag.attributes.name.en }}</label>
                        <div class="checkbox-group">
                            <i class="fas fa-check icon include" :class="{ active: includedTags.includes(tag.attributes.name.en) }" @click="updateTagSelection(tag.attributes.name.en, 'include')"></i>
                            <i class="fas fa-times icon exclude" :class="{ active: excludedTags.includes(tag.attributes.name.en) }" @click="updateTagSelection(tag.attributes.name.en, 'exclude')"></i>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    `,
    props: ['language', 'availableLanguages', 'searchQuery', 'showTagDropdown', 'availableTags', 'includedTags', 'excludedTags'],
    data() {
        return {
            selectedLanguage: this.language
        };
    },
    watch: {
        selectedLanguage(newVal) {
            this.$emit('update-language', newVal);
        }
    },
    methods: {
        goToMenu() {
            this.$emit('go-to-menu');
        },
        loadFavorites() {
            this.$emit('load-favorites');
        },
        searchManga() {
            this.$emit('search-manga');
        },
        toggleTagDropdown() {
            this.$emit('toggle-tag-dropdown');
        },
        updateTagSelection(tagName, type) {
            this.$emit('update-tag-selection', tagName, type);
        }
    }
}