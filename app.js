document.addEventListener('DOMContentLoaded', () => {
    let libraries = [];
    let currentCategory = 'all';
    let selectedTags = new Set();
    let searchQuery = '';

    const libraryGrid = document.getElementById('library-grid');
    const categoriesFilter = document.getElementById('categories-filter');
    const tagsFilter = document.getElementById('tags-filter');
    const searchInput = document.getElementById('search-input');
    const visibleCount = document.getElementById('visible-count');
    const totalCount = document.getElementById('total-count');

    // Load data from global libraries.js script (bypasses local filesystem CORS issues)
    if (typeof LIBRARIES_DATA !== 'undefined') {
        libraries = LIBRARIES_DATA;
        initPortal();
    } else {
        console.error('Error: LIBRARIES_DATA is not defined.');
        libraryGrid.innerHTML = `
            <div class="empty-state">
                An error occurred: Database variable not found.
            </div>
        `;
    }

    function initPortal() {
        totalCount.textContent = libraries.length;
        populateCategories();
        populateTags();
        renderLibraries();

        // Setup event listeners with bi-directional tag sync
        searchInput.addEventListener('input', (e) => {
            const rawVal = e.target.value;
            
            // Extract hashtags (e.g. #Skills) from the input
            const hashTags = rawVal.match(/#[a-zA-Z0-9-_\s']+/gi) || [];
            
            selectedTags.clear();
            hashTags.forEach(hashTag => {
                // Remove '#' and trim to match tag format
                const tagVal = hashTag.substring(1).trim();
                selectedTags.add(tagVal);
            });

            // Update active states on tag buttons without full repopulation to preserve scroll position
            syncTagButtonsUI();
            
            // Save clean search query (removing hashtags from the text search query)
            searchQuery = rawVal.replace(/#[a-zA-Z0-9-_\s']+/gi, '').toLowerCase().trim();
            renderLibraries();
        });
    }

    function populateCategories() {
        // Extract unique categories
        const categories = ['all', ...new Set(libraries.map(lib => lib.category))];
        
        // Build buttons
        categoriesFilter.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${cat === 'all' ? 'active' : ''}`;
            btn.dataset.category = cat;
            btn.textContent = cat === 'all' ? 'All' : cat;
            
            btn.addEventListener('click', (e) => {
                // Toggle active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                currentCategory = cat;
                selectedTags.clear(); // Reset tag filters when switching category
                
                // Clear hashtags from search input
                searchInput.value = searchInput.value.replace(/#[a-zA-Z0-9-_\s']+/gi, '').trim();
                searchQuery = searchInput.value.toLowerCase().trim();
                
                populateTags();
                renderLibraries();
            });

            categoriesFilter.appendChild(btn);
        });
    }

    function populateTags() {
        // Extract unique tags from libraries in the current category
        const filteredForTags = libraries.filter(lib => currentCategory === 'all' || lib.category === currentCategory);
        const tags = [...new Set(filteredForTags.flatMap(lib => lib.tags))].sort();

        tagsFilter.innerHTML = '';
        
        if (tags.length === 0) {
            tagsFilter.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.85rem;">No tags available</span>';
            return;
        }

        tags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = `tag-btn ${selectedTags.has(tag) ? 'active' : ''}`;
            btn.textContent = `#${tag}`;
            
            btn.addEventListener('click', () => {
                handleTagToggle(tag);
            });

            tagsFilter.appendChild(btn);
        });
    }

    function syncTagButtonsUI() {
        document.querySelectorAll('.tags-filter-container .tag-btn').forEach(btn => {
            const tagVal = btn.textContent.replace('#', '');
            if (selectedTags.has(tagVal)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function handleTagToggle(tag) {
        if (selectedTags.has(tag)) {
            selectedTags.delete(tag);
        } else {
            selectedTags.add(tag);
        }

        // Update search input text with selected tags
        let textWithoutTags = searchInput.value.replace(/#[a-zA-Z0-9-_\s']+/gi, '').trim();
        const tagsString = [...selectedTags].map(t => `#${t}`).join(' ');
        searchInput.value = (textWithoutTags + (tagsString ? ' ' + tagsString : '')).trim();
        
        searchQuery = textWithoutTags.toLowerCase().trim();

        populateTags();
        renderLibraries();
    }

    function renderLibraries() {
        // Filter libraries based on category, search query, and selected tags
        const filtered = libraries.filter(lib => {
            const matchesCategory = currentCategory === 'all' || lib.category === currentCategory;
            
            const matchesTags = selectedTags.size === 0 || 
                [...selectedTags].every(tag => lib.tags.includes(tag));

            const matchesSearch = searchQuery === '' || 
                lib.name.toLowerCase().includes(searchQuery) ||
                lib.owner.toLowerCase().includes(searchQuery) ||
                lib.description.toLowerCase().includes(searchQuery) ||
                lib.tags.some(tag => tag.toLowerCase().includes(searchQuery));

            return matchesCategory && matchesTags && matchesSearch;
        });

        // Update stats
        visibleCount.textContent = filtered.length;

        // Render to grid
        if (filtered.length === 0) {
            libraryGrid.innerHTML = `
                <div class="empty-state">
                    No libraries match the selected search criteria.
                </div>
            `;
            return;
        }

        libraryGrid.innerHTML = filtered.map(lib => `
            <article class="library-card">
                <div class="card-header">
                    <span class="card-category">${lib.category}</span>
                    <h3 class="card-title">${lib.name}</h3>
                    <span class="card-owner">by ${lib.owner}</span>
                </div>
                <div class="card-body">
                    <p class="card-desc">${lib.description}</p>
                    <div class="card-tags">
                        ${lib.tags.map(tag => `<span class="tag" style="cursor: pointer;">#${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="card-actions">
                    <a href="${lib.url}" target="_blank" rel="noopener noreferrer" class="repo-link">
                        View Repository 
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                </div>
            </article>
        `).join('');

        // Add click events to tags in cards to filter directly
        document.querySelectorAll('.library-card .tag').forEach(tagEl => {
            tagEl.addEventListener('click', (e) => {
                const tagValue = e.target.textContent.replace('#', '');
                handleTagToggle(tagValue);
            });
        });
    }
});
