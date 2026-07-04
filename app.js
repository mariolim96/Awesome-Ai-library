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

    // Fetch data from local JSON database
    fetch('data/libraries.json')
        .then(response => response.json())
        .then(data => {
            libraries = data;
            initPortal();
        })
        .catch(err => {
            console.error('Error loading libraries:', err);
            libraryGrid.innerHTML = `
                <div class="empty-state">
                    An error occurred while loading the libraries database.<br>
                    Please check the console for more details.
                </div>
            `;
        });

    function initPortal() {
        totalCount.textContent = libraries.length;
        populateCategories();
        populateTags();
        renderLibraries();

        // Setup event listeners
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
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
                if (selectedTags.has(tag)) {
                    selectedTags.delete(tag);
                    btn.classList.remove('active');
                } else {
                    selectedTags.add(tag);
                    btn.classList.add('active');
                }
                renderLibraries();
            });

            tagsFilter.appendChild(btn);
        });
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
                
                // Toggle active state in selectedTags set
                if (selectedTags.has(tagValue)) {
                    selectedTags.delete(tagValue);
                } else {
                    selectedTags.add(tagValue);
                }

                // Synchronize tag buttons active state
                populateTags();
                renderLibraries();
            });
        });
    }
});
