document.addEventListener('DOMContentLoaded', () => {
    let libraries = [];
    let currentCategory = 'all';
    let searchQuery = '';

    const libraryGrid = document.getElementById('library-grid');
    const categoriesFilter = document.getElementById('categories-filter');
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
            console.error('Errore nel caricamento delle librerie:', err);
            libraryGrid.innerHTML = `
                <div class="empty-state">
                    Si è verificato un errore nel caricamento del database delle librerie.<br>
                    Controlla la console per maggiori dettagli.
                </div>
            `;
        });

    function initPortal() {
        totalCount.textContent = libraries.length;
        populateCategories();
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
            btn.textContent = cat === 'all' ? 'Tutte' : cat;
            
            btn.addEventListener('click', (e) => {
                // Toggle active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                currentCategory = cat;
                renderLibraries();
            });

            categoriesFilter.appendChild(btn);
        });
    }

    function renderLibraries() {
        // Filter libraries based on category and search query
        const filtered = libraries.filter(lib => {
            const matchesCategory = currentCategory === 'all' || lib.category === currentCategory;
            
            const matchesSearch = searchQuery === '' || 
                lib.name.toLowerCase().includes(searchQuery) ||
                lib.owner.toLowerCase().includes(searchQuery) ||
                lib.description.toLowerCase().includes(searchQuery) ||
                lib.tags.some(tag => tag.toLowerCase().includes(searchQuery));

            return matchesCategory && matchesSearch;
        });

        // Update stats
        visibleCount.textContent = filtered.length;

        // Render to grid
        if (filtered.length === 0) {
            libraryGrid.innerHTML = `
                <div class="empty-state">
                    Nessuna libreria corrisponde ai criteri di ricerca selezionati.
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
                        ${lib.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="card-actions">
                    <a href="${lib.url}" target="_blank" rel="noopener noreferrer" class="repo-link">
                        Vedi Repository 
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                </div>
            </article>
        `).join('');
    }
});
