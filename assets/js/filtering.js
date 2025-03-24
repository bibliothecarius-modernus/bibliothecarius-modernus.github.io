document.addEventListener('DOMContentLoaded', function() {
    // Get all relevant elements
    const posts = document.querySelectorAll('.post-item');
    const filterCenturySelect = document.getElementById('filter-century');
    const filterAuthorSelect = document.getElementById('filter-author');
    const resetButton = document.getElementById('reset-filters');
    const clearFiltersLink = document.getElementById('clear-filters');
    const loadMoreButton = document.getElementById('load-more');
    const postsCount = document.getElementById('posts-count');
    const noResults = document.getElementById('no-results');
    const loader = document.querySelector('.loader');
    
    // Constants
    const POSTS_PER_PAGE = 6;
    
    // State variables
    let currentFilters = {
      century: 'all',
      author: 'all'
    };
    let currentPage = 1;
    let filteredPosts = [...posts];
    
    // Store all available data for dynamic filtering
    const allPostsData = extractAllPostsData(posts);
    
    // Initialize
    init();
    
    function init() {
      // Log post data for debugging
      console.log('Posts data extracted:', allPostsData);
      
      // Set up event listeners
      filterCenturySelect.addEventListener('change', handleFilterChange);
      filterAuthorSelect.addEventListener('change', handleFilterChange);
      resetButton.addEventListener('click', resetFilters);
      if (clearFiltersLink) clearFiltersLink.addEventListener('click', resetFilters);
      if (loadMoreButton) loadMoreButton.addEventListener('click', loadMorePosts);
      
      // Enhance the author filter with improved UI
      enhanceAuthorFilter();
      
      // Initial setup
      updatePostCount();
      checkLoadMoreVisibility();
    }
    
    // Extract all data from posts for faster filtering and dynamic dropdowns
    function extractAllPostsData(posts) {
      const data = {
        authors: new Set(),
        centuries: new Set(),
        authorsByCentury: {},
        categoriesByAuthor: {}
      };
      
      posts.forEach(post => {
        // Extract author
        const author = post.dataset.author;
        if (author) data.authors.add(author);
        
        // Extract century
        let century = '';
        try {
          const originalDate = post.dataset.originalDate || '';
          // Extract first number from date string
          const match = originalDate.match(/\d+/);
          if (match) {
            const year = parseInt(match[0]);
            
            // Correct century calculation
            if (year % 100 === 0) {
              // For years like 100, 700, 1700
              century = ((year / 100) + 1).toString();
            } else {
              // For years like 105, 701, 1705
              century = Math.ceil(year / 100).toString();
            }
            
            data.centuries.add(century);
            
            // For debugging
            console.log(`Date: ${originalDate}, Year: ${year}, Century: ${century}`);
          }
        } catch (e) {
          console.log('Error parsing date:', e);
        }
        
        // Build relationship maps for interdependent filtering
        if (century) {
          // Authors by century
          if (!data.authorsByCentury[century]) data.authorsByCentury[century] = new Set();
          if (author) data.authorsByCentury[century].add(author);
        }
        
        if (author) {
          // Categories by author
          if (!data.categoriesByAuthor[author]) data.categoriesByAuthor[author] = new Set();
        }
      });
      
      return data;
    }
    
    function handleFilterChange(e) {
      const target = e.target;
      
      if (target.id === 'filter-century') {
        currentFilters.century = target.value;
        
        // Update author dropdown based on century selection
        updateAuthorDropdown();
      } else if (target.id === 'filter-author') {
        currentFilters.author = target.value;
      }
      
      refreshPosts();
    }
    
    function updateAuthorDropdown() {
      if (!filterAuthorSelect) return;
      
      // Save current selection
      const currentAuthor = filterAuthorSelect.value;
      
      // Clear dropdown except for "All" option
      while (filterAuthorSelect.options.length > 1) {
        filterAuthorSelect.remove(1);
      }
      
      // Get filtered authors based on century
      let availableAuthors = [];
      if (currentFilters.century === 'all') {
        availableAuthors = [...allPostsData.authors];
      } else if (allPostsData.authorsByCentury[currentFilters.century]) {
        availableAuthors = [...allPostsData.authorsByCentury[currentFilters.century]];
      }
      
      // Sort authors alphabetically
      availableAuthors.sort();
      
      // Add author options
      availableAuthors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        
        // Try to find a more readable author name from the DOM
        const authorPost = Array.from(posts).find(post => post.dataset.author === author);
        if (authorPost) {
          const authorElement = authorPost.querySelector('.post-author');
          if (authorElement) {
            option.textContent = authorElement.textContent.replace('by ', '');
          } else {
            option.textContent = author.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        } else {
          option.textContent = author.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
        filterAuthorSelect.appendChild(option);
      });
      
      // Try to restore previous selection if it exists in new options
      if (currentAuthor !== 'all') {
        const optionExists = Array.from(filterAuthorSelect.options).some(option => option.value === currentAuthor);
        if (optionExists) {
          filterAuthorSelect.value = currentAuthor;
        } else {
          filterAuthorSelect.value = 'all';
          currentFilters.author = 'all';
        }
      }
      
      // Update the enhanced author dropdown UI
      if (document.querySelector('.author-dropdown')) {
        const wrapper = filterAuthorSelect.closest('.search-select-wrapper');
        const dropdown = wrapper.querySelector('.author-dropdown');
        const selectedDisplay = wrapper.querySelector('.selected-author');
        
        // Update selected display
        const selectedOption = filterAuthorSelect.options[filterAuthorSelect.selectedIndex];
        updateSelectedDisplay(selectedDisplay, selectedOption.text);
        
        // Update wrapper class based on selection
        if (selectedOption.value === 'all') {
          wrapper.classList.remove('has-selected');
        } else {
          wrapper.classList.add('has-selected');
        }
        
        // Repopulate dropdown with new options
        const allOptions = Array.from(filterAuthorSelect.options);
        populateDropdown(dropdown, allOptions);
      }
    }
    
    function resetFilters(e) {
      if (e) e.preventDefault();
      
      // Reset all filter controls
      filterCenturySelect.value = 'all';
      filterAuthorSelect.value = 'all';
      
      // Reset state
      currentFilters = {
        century: 'all',
        author: 'all'
      };
      currentPage = 1;
      
      // Update author dropdown with all authors
      updateAuthorDropdown();
      
      // Update the enhanced author UI state
      const wrapper = filterAuthorSelect.closest('.search-select-wrapper');
      if (wrapper) {
        wrapper.classList.remove('has-selected');
        const searchInput = wrapper.querySelector('.author-search-input');
        if (searchInput) searchInput.value = '';
        wrapper.classList.remove('has-value');
      }
      
      refreshPosts();
    }
    
    function refreshPosts() {
      // Show loading indicator
      if (loader) loader.style.display = 'flex';
      
      // Debounce for performance
      if (window.refreshTimeout) {
        clearTimeout(window.refreshTimeout);
      }
      
      window.refreshTimeout = setTimeout(() => {
        // Reset to first page when filters change
        currentPage = 1;
        
        // Apply filters
        filteredPosts = applyFilters();
        
        // Update DOM
        updatePostDisplay();
        updatePostCount();
        checkLoadMoreVisibility();
        
        // Hide loading indicator
        if (loader) loader.style.display = 'none';
      }, 100);
    }
    
    function applyFilters() {
      // Performance optimization - early exit if no filters are applied
      if (currentFilters.century === 'all' && currentFilters.author === 'all') {
        return [...posts];
      }
      
      // Only filter what needs to be filtered
      return [...posts].filter(post => {
        // Century filter
        if (currentFilters.century !== 'all') {
          let century = '';
          try {
            const originalDate = post.dataset.originalDate || '';
            // Extract first number from date string
            const match = originalDate.match(/\d+/);
            if (match) {
              const year = parseInt(match[0]);
              
              // Correct century calculation
              if (year % 100 === 0) {
                // For years like 100, 700, 1700
                century = ((year / 100) + 1).toString();
              } else {
                // For years like 105, 701, 1705
                century = Math.ceil(year / 100).toString();
              }
            }
          } catch (e) {
            console.log('Error parsing date:', e);
          }
          
          if (century !== currentFilters.century) return false;
        }
        
        // Author filter
        if (currentFilters.author !== 'all' && 
            post.dataset.author !== currentFilters.author) {
          return false;
        }
        
        return true;
      });
    }
    
    function updatePostDisplay() {
      // First hide all posts for a clean slate
      posts.forEach(post => {
        post.style.display = 'none';
      });
      
      // Show no results message if needed
      if (filteredPosts.length === 0) {
        if (noResults) noResults.style.display = 'block';
        if (loadMoreButton) loadMoreButton.style.display = 'none';
      } else {
        if (noResults) noResults.style.display = 'none';
        
        // Show the filtered posts for current page
        const postsToShow = filteredPosts.slice(0, currentPage * POSTS_PER_PAGE);
        postsToShow.forEach(post => {
          post.style.display = 'flex';
        });
      }
    }
    
    function loadMorePosts() {
      currentPage++;
      updatePostDisplay();
      checkLoadMoreVisibility();
    }
    
    function checkLoadMoreVisibility() {
      if (!loadMoreButton) return;
      
      if (filteredPosts.length <= currentPage * POSTS_PER_PAGE) {
        loadMoreButton.style.display = 'none';
      } else {
        loadMoreButton.style.display = 'inline-block';
      }
    }
    
    function updatePostCount() {
      if (!postsCount) return;
      
      if (filteredPosts.length === posts.length) {
        postsCount.textContent = `Showing all ${posts.length} posts`;
      } else {
        postsCount.textContent = `Showing ${Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length)} of ${filteredPosts.length} posts matching your filters`;
      }
    }
    
    // Enhanced Author Filter Functionality
    function enhanceAuthorFilter() {
      const filterAuthorSelect = document.getElementById('filter-author');
      if (!filterAuthorSelect) return;
      
      // Store original options
      const allOptions = Array.from(filterAuthorSelect.options);
      
      // Set up enhanced UI
      setupEnhancedAuthorUI(filterAuthorSelect, allOptions);
      
      // Update classes to indicate we've enhanced the filter
      filterAuthorSelect.classList.add('author-select');
    }
    
    function setupEnhancedAuthorUI(filterAuthorSelect, allOptions) {
      // Get parent container
      const wrapper = filterAuthorSelect.closest('.search-select-wrapper') || 
        createWrapper(filterAuthorSelect);
      
      // Create or get search input
      let searchInput = wrapper.querySelector('.author-search-input');
      if (!searchInput) {
        searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search authors...';
        searchInput.className = 'author-search-input';
        wrapper.appendChild(searchInput);
      }
      
      // Create selected author display
      const selectedAuthor = document.createElement('div');
      selectedAuthor.className = 'selected-author';
      wrapper.appendChild(selectedAuthor);
      
      // Create clear button
      const clearButton = document.createElement('div');
      clearButton.className = 'clear-search';
      wrapper.appendChild(clearButton);
      
      // Create custom dropdown
      const dropdown = document.createElement('div');
      dropdown.className = 'author-dropdown';
      wrapper.appendChild(dropdown);
      
      // For mobile: create overlay and header
      const overlay = document.createElement('div');
      overlay.className = 'author-dropdown-overlay';
      document.body.appendChild(overlay);
      
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const header = document.createElement('div');
        header.className = 'author-dropdown-header';
        header.textContent = 'Select Author';
        
        const closeButton = document.createElement('div');
        closeButton.className = 'author-dropdown-close';
        header.appendChild(closeButton);
        
        dropdown.appendChild(header);
        
        // Close dropdown on overlay click
        overlay.addEventListener('click', () => {
          closeDropdown();
        });
        
        // Close dropdown on close button click
        closeButton.addEventListener('click', () => {
          closeDropdown();
        });
      }
      
      // Fill dropdown with options
      populateDropdown(dropdown, allOptions);
      
      // Event listeners
      searchInput.addEventListener('focus', () => {
        wrapper.classList.add('is-focused');
        openDropdown();
      });
      
      searchInput.addEventListener('blur', (e) => {
        // Delay to allow for dropdown click to register
        if (!isMobile) {
          setTimeout(() => {
            if (!dropdown.contains(document.activeElement)) {
              wrapper.classList.remove('is-focused');
              closeDropdown();
            }
          }, 150);
        }
      });
      
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        // Show/hide clear button
        if (searchTerm) {
          wrapper.classList.add('has-value');
        } else {
          wrapper.classList.remove('has-value');
        }
        
        // Filter dropdown options
        filterDropdownOptions(dropdown, allOptions, searchTerm);
        
        // Open dropdown if closed
        openDropdown();
      });
      
      clearButton.addEventListener('click', () => {
        searchInput.value = '';
        wrapper.classList.remove('has-value');
        filterAuthorSelect.value = 'all';
        updateSelectedDisplay(selectedAuthor, 'All Authors');
        wrapper.classList.remove('has-selected');
        
        // Trigger change event
        const event = new Event('change');
        filterAuthorSelect.dispatchEvent(event);
        
        // Close dropdown
        closeDropdown();
      });
      
      // Helper functions
      function openDropdown() {
        // Only show dropdown if we have options
        if (!dropdown.hasChildNodes()) return;
        
        dropdown.classList.add('active');
        if (isMobile) overlay.classList.add('active');
        
        // Scroll to selected item if any
        const selected = dropdown.querySelector('.author-dropdown-item.selected');
        if (selected) {
          selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
      
      function closeDropdown() {
        dropdown.classList.remove('active');
        if (isMobile) overlay.classList.remove('active');
      }
      
      // Set initial state based on default selection
      const defaultSelected = filterAuthorSelect.options[filterAuthorSelect.selectedIndex];
      if (defaultSelected && defaultSelected.value !== 'all') {
        updateSelectedDisplay(selectedAuthor, defaultSelected.text);
        wrapper.classList.add('has-selected');
      }
    }
    
    function createWrapper(selectElement) {
      const wrapper = document.createElement('div');
      wrapper.className = 'search-select-wrapper';
      selectElement.parentNode.insertBefore(wrapper, selectElement);
      wrapper.appendChild(selectElement);
      return wrapper;
    }
    
    function populateDropdown(dropdown, options) {
      // Clear existing items
      while (dropdown.firstChild) {
        dropdown.removeChild(dropdown.firstChild);
      }
      
      // Add header if mobile
      if (window.innerWidth <= 768) {
        const header = document.createElement('div');
        header.className = 'author-dropdown-header';
        header.textContent = 'Select Author';
        
        const closeButton = document.createElement('div');
        closeButton.className = 'author-dropdown-close';
        header.appendChild(closeButton);
        
        dropdown.appendChild(header);
      }
      
      // Add all options
      options.forEach(option => {
        const item = document.createElement('div');
        item.className = 'author-dropdown-item';
        item.dataset.value = option.value;
        item.textContent = option.text;
        
        if (option.selected) {
          item.classList.add('selected');
        }
        
        item.addEventListener('click', () => {
          // Update select element
          const select = dropdown.closest('.search-select-wrapper').querySelector('select');
          select.value = option.value;
          
          // Update UI
          const selectedDisplay = dropdown.closest('.search-select-wrapper').querySelector('.selected-author');
          updateSelectedDisplay(selectedDisplay, option.text);
          
          // Update wrapper state
          if (option.value === 'all') {
            dropdown.closest('.search-select-wrapper').classList.remove('has-selected');
          } else {
            dropdown.closest('.search-select-wrapper').classList.add('has-selected');
          }
          
          // Close dropdown
          dropdown.classList.remove('active');
          document.querySelector('.author-dropdown-overlay')?.classList.remove('active');
          
          // Trigger change event
          const event = new Event('change');
          select.dispatchEvent(event);
        });
        
        dropdown.appendChild(item);
      });
    }
    
    function filterDropdownOptions(dropdown, allOptions, searchTerm) {
      // Get header element if it exists (for mobile)
      const header = dropdown.querySelector('.author-dropdown-header');
      
      // Clear existing options
      while (dropdown.firstChild) {
        dropdown.removeChild(dropdown.firstChild);
      }
      
      // Re-add header if it exists
      if (header) {
        dropdown.appendChild(header);
      }
      
      // Filter options
      const filteredOptions = allOptions.filter(option => {
        if (option.value === 'all') return true; // Always include "All Authors"
        return option.text.toLowerCase().includes(searchTerm);
      });
      
      // Add filtered options
      filteredOptions.forEach(option => {
        const item = document.createElement('div');
        item.className = 'author-dropdown-item';
        item.dataset.value = option.value;
        item.textContent = option.text;
        
        // Highlight search term
        if (searchTerm && option.value !== 'all') {
          const highlightedText = option.text.replace(
            new RegExp(searchTerm, 'gi'),
            match => `<strong>${match}</strong>`
          );
          item.innerHTML = highlightedText;
        }
        
        // Mark selected option
        const select = dropdown.closest('.search-select-wrapper').querySelector('select');
        if (option.value === select.value) {
          item.classList.add('selected');
        }
        
        item.addEventListener('click', () => {
          // Update select element
          select.value = option.value;
          
          // Update UI
          const selectedDisplay = dropdown.closest('.search-select-wrapper').querySelector('.selected-author');
          updateSelectedDisplay(selectedDisplay, option.text);
          
          // Update wrapper state
          if (option.value === 'all') {
            dropdown.closest('.search-select-wrapper').classList.remove('has-selected');
          } else {
            dropdown.closest('.search-select-wrapper').classList.add('has-selected');
          }
          
          // Close dropdown
          dropdown.classList.remove('active');
          document.querySelector('.author-dropdown-overlay')?.classList.remove('active');
          
          // Trigger change event
          const event = new Event('change');
          select.dispatchEvent(event);
        });
        
        dropdown.appendChild(item);
      });
      
      // Add "No results" message if needed
      if (filteredOptions.length === 1 && filteredOptions[0].value === 'all' && searchTerm) {
        const noResults = document.createElement('div');
        noResults.className = 'author-dropdown-item';
        noResults.style.fontStyle = 'italic';
        noResults.style.color = 'var(--dark-gray)';
        noResults.textContent = 'No authors found';
        dropdown.appendChild(noResults);
      }
    }
    
    function updateSelectedDisplay(element, text) {
      element.textContent = text;
    }
  });