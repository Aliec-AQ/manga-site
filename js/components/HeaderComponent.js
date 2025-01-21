export default {
    template: `
        <header class="fixed-top">
            <div class="nav-bar">
                <div class="dropdown">
                    <i :class="{ fas: true, 'fa-bars': !dropdownOpen, 'fa-chevron-down': dropdownOpen }" @click="dropdownOpen = !dropdownOpen"></i>
                    <div class="dropdown-content" v-show="dropdownOpen">
                        <button @click="goToMenu" class="header-button">Home</button>
                        <button @click="loadFavorites" class="header-button">favoris</button>
                        <select v-model="selectedLanguage">
                            <option v-for="lang in availableLanguages" :key="lang" :value="lang">{{ lang }}</option>
                        </select>
                    </div>
                </div>

                <div class="search-container">
                    <div class="search-bar">
                        <input type="text" v-model="localSearchQuery" placeholder="Search manga..." @keyup.enter="searchManga">
                        <button @click="searchManga" class="icon-button" id="search-icon">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <button @click="toggleTagDropdown" class="icon-button">
                        <i class="fas fa-tags"></i>
                    </button>
                </div>
            </div>
            <div class="tag-select-container" v-if="showTagDropdown">
                <label>Tags:</label>
                <div class="tag-grid">
                    <div v-for="tag in availableTags" :key="tag.id" class="tag-item">
                        <label>{{ tag.attributes.name.en }}</label>
                        <div class="checkbox-group">
                            <i class="fas fa-check icon include" :class="{ activeInclude: includedTags.includes(tag.attributes.name.en) }" @click="updateTagSelection(tag.attributes.name.en, 'include')"></i>
                            <i class="fas fa-times icon exclude" :class="{ activeExclude: excludedTags.includes(tag.attributes.name.en) }" @click="updateTagSelection(tag.attributes.name.en, 'exclude')"></i>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    `,
    props: ['language', 'availableLanguages', 'showTagDropdown', 'availableTags', 'includedTags', 'excludedTags'],
    data() {
        return {
            selectedLanguage: this.language,
            localSearchQuery: '',
            dropdownOpen: false
        };
    },
    watch: {
        selectedLanguage(newVal) {
            this.$emit('update-language', newVal);
        },
    },
    methods: {
        goToMenu() {
            this.$emit('go-to-menu');
        },
        loadFavorites() {
            this.$emit('load-favorites');
        },
        searchManga() {
            this.$emit('search-manga', this.localSearchQuery);
        },
        toggleTagDropdown() {
            this.$emit('toggle-tag-dropdown');
        },
        updateTagSelection(tagName, type) {
            this.$emit('update-tag-selection', tagName, type);
        }
    }
}