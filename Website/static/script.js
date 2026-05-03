console.log("JS is running");

const passwordInput = document.getElementById('password');
const strengthMessage = document.getElementById('strength-message');

// Only initialize password features if elements exist
if (passwordInput && strengthMessage) {
    // Disable autocomplete when user starts typing, re-enable when cleared
    passwordInput.addEventListener('input', () => {
    if (passwordInput.value !== '') {
        passwordInput.setAttribute('autocomplete', 'off');
    } else {
        passwordInput.setAttribute('autocomplete', 'new-password');
    }
    
    const val = passwordInput.value;

    // Immediately mark as weak if contains spaces
    if (/\s/.test(val)) {
        strengthMessage.textContent = "no spaces allowed";
        strengthMessage.style.color = "red";
        return;
    }

    let score = 0;

    if(val.length >= 8) score++;
    if(/[A-Z]/.test(val)) score++;
    if(/[0-9]/.test(val)) score++;
    if(/[^A-Za-z0-9]/.test(val)) score++; // special characters

    let strength = '';
    let color = '';

    switch(score){
        case 0:
        case 1:
            strength = 'weak';
            color = 'red';
            break;
        case 2:
            strength = 'medium';
            color = 'orange';
            break;
        case 3:
            strength = 'strong';
            color = 'blue';
            break;
        case 4:
            strength = 'very strong';
            color = 'green';
            break;
    }

    strengthMessage.textContent = strength;
    strengthMessage.style.color = color;
    });
}

// Password visibility toggle
function initPasswordToggle(inputId, toggleId) {
    const inputField = document.getElementById(inputId);
    const toggleButton = document.getElementById(toggleId);
    
    if (!inputField || !toggleButton) return;
    
    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        const isPassword = inputField.type === 'password';
        inputField.type = isPassword ? 'text' : 'password';
        toggleButton.classList.toggle('show-password', isPassword);
    });
}

initPasswordToggle('password', 'toggle-password');
initPasswordToggle('confirm-password', 'toggle-confirm-password');

// ========== Expandable Search Feature ==========

// Initialize search functionality only if elements exist
(function initSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');

    if (!searchToggle || !searchForm || !searchInput) {
        return; // Search elements not found on this page
    }

    let isSearchExpanded = false;
    let searchTimeout;

    // Toggle search expansion
    searchToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        isSearchExpanded = !isSearchExpanded;
        
        if (isSearchExpanded) {
            searchForm.classList.add('expanded');
            // Focus input with a small delay for better UX
            setTimeout(() => searchInput.focus(), 100);
            // Clear suggestions when opening
            searchSuggestions.classList.remove('show');
        } else {
            searchForm.classList.remove('expanded');
            searchInput.blur();
            hideSuggestions();
            searchInput.value = '';
        }
    });

    // Prevent closing when clicking inside search container
    searchForm.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Keep search expanded if input has focus or value
    searchInput.addEventListener('focus', () => {
        isSearchExpanded = true;
        searchForm.classList.add('expanded');
    });

    // Real-time search with debouncing
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Show suggestions as user types
        if (query.length > 0) {
            showSuggestions(query);
        } else {
            hideSuggestions();
        }
        
        // Debounced form submission (300ms delay)
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Prevent default form submission
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query.length > 0) {
            performSearch(query);
        }
    });

    // Function to perform search without page reload
    function performSearch(query) {
        // If query is empty, reload page to show all tasks
        if (!query || query.trim() === '') {
            window.location.href = searchForm.action;
            return;
        }

        const searchParams = new URLSearchParams();
        searchParams.append('search', query);

        fetch(searchForm.action + '?' + searchParams.toString())
            .then(response => response.text())
            .then(html => {
                // Parse the response HTML
                const parser = new DOMParser();
                const newDoc = parser.parseFromString(html, 'text/html');
                
                // Update task list
                const taskList = document.querySelector('.task-list');
                const emptyState = document.querySelector('.empty-state');
                const newTaskList = newDoc.querySelector('.task-list');
                const newEmptyState = newDoc.querySelector('.empty-state');
                
                if (newTaskList) {
                    if (taskList) {
                        taskList.innerHTML = newTaskList.innerHTML;
                        taskList.style.display = 'block';
                    }
                    if (emptyState) emptyState.style.display = 'none';
                } else if (newEmptyState) {
                    if (taskList) taskList.style.display = 'none';
                    if (emptyState) {
                        emptyState.style.display = 'block';
                        emptyState.innerHTML = newEmptyState.innerHTML;
                    }
                }
                
                // Keep focus on search input
                searchInput.focus();
            })
            .catch(error => {
                console.error('Search error:', error);
                // Fallback to normal form submission if fetch fails
                searchForm.submit();
            });
    }

    // Function to show suggestions
    function showSuggestions(query) {
        // Get all task elements if they exist
        const taskBoxes = document.querySelectorAll('.task-box');
        const suggestions = [];

        taskBoxes.forEach(box => {
            const taskContent = box.querySelector('.task-content');
            if (taskContent) {
                const taskText = taskContent.textContent.toLowerCase();
                // Match query with task content
                if (taskText.includes(query.toLowerCase())) {
                    suggestions.push(taskText);
                }
            }
        });

        if (suggestions.length > 0) {
            searchSuggestions.innerHTML = suggestions
                .slice(0, 5) // Limit to 5 suggestions
                .map(suggestion => `
                    <div class="suggestion-item" data-search="${suggestion}">
                        ${suggestion}
                    </div>
                `)
                .join('');
            searchSuggestions.classList.add('show');
        } else {
            hideSuggestions();
        }
    }

    // Function to hide suggestions
    function hideSuggestions() {
        searchSuggestions.classList.remove('show');
        searchSuggestions.innerHTML = '';
    }

    // Handle clicking on suggestions
    searchSuggestions.addEventListener('click', (e) => {
        const suggestionItem = e.target.closest('.suggestion-item');
        if (suggestionItem) {
            const searchText = suggestionItem.dataset.search;
            searchInput.value = searchText;
            performSearch(searchText);
            searchInput.focus();
        }
    });

    // Allow clicking on suggestions without losing focus
    searchSuggestions.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('suggestion-item')) {
            e.preventDefault();
        }
    });
})();

// ========================================