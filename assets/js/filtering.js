document.addEventListener('DOMContentLoaded', function() {
    // Get all relevant elements
    const posts = document.querySelectorAll('.post-item');
    const filterCenturySelect = document.getElementById('filter-century');
    const filterAuthorSelect = document.getElementById('filter-author');
    const resetButton = document.getElementById('reset-filters');
    const clearFiltersLink = document.getElementById('clear-filters');
    const postsCount = document.getElementById('posts-count');
    const noResults = document.getElementById('no-results');
    const loader = document.querySelector('.loader');
    const paginationContainer = document.getElementById('pagination-container');
    
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
      
      // Enhance the author filter with improved UI
      enhanceAuthorFilter();
      
      // Initial setup
      updatePostCount();
      refreshPosts();
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
      
      // Reset to first page when filters change
      currentPage = 1;
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
        // Apply filters
        filteredPosts = applyFilters();
        
        // Update DOM
        updatePostDisplay();
        updatePostCount();
        updatePagination();
        
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
        if (paginationContainer) paginationContainer.style.display = 'none';
      } else {
        if (noResults) noResults.style.display = 'none';
        if (paginationContainer) paginationContainer.style.display = 'flex';
        
        // Calculate start and end indices for current page
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
        const endIndex = startIndex + POSTS_PER_PAGE;
        
        // Show the filtered posts for current page
        const postsToShow = filteredPosts.slice(startIndex, endIndex);
        postsToShow.forEach(post => {
          post.style.display = 'flex';
        });
      }
    }
    
    function updatePagination() {
      if (!paginationContainer) return;
      
      // Clear existing pagination
      paginationContainer.innerHTML = '';
      
      // Don't show pagination if there's only one page
      if (filteredPosts.length <= POSTS_PER_PAGE) {
        paginationContainer.style.display = 'none';
        return;
      }
      
      // Calculate total pages
      const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
      
      // Create pagination structure
      const paginationList = document.createElement('ul');
      paginationList.className = 'pagination-list';
      
      // Previous button
      const prevItem = document.createElement('li');
      prevItem.className = 'pagination-item pagination-prev';
      const prevLink = document.createElement('a');
      prevLink.href = '#';
      prevLink.innerHTML = '&laquo;';
      prevLink.setAttribute('aria-label', 'Previous page');
      if (currentPage === 1) {
        prevItem.classList.add('disabled');
        prevLink.addEventListener('click', e => e.preventDefault());
      } else {
        prevLink.addEventListener('click', e => {
          e.preventDefault();
          goToPage(currentPage - 1);
        });
      }
      prevItem.appendChild(prevLink);
      paginationList.appendChild(prevItem);
      
      // Page numbers
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      
      // Adjust startPage if we're near the end
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }
      
      // First page link if needed
      if (startPage > 1) {
        const firstItem = document.createElement('li');
        firstItem.className = 'pagination-item';
        const firstLink = document.createElement('a');
        firstLink.href = '#';
        firstLink.textContent = '1';
        firstLink.addEventListener('click', e => {
          e.preventDefault();
          goToPage(1);
        });
        firstItem.appendChild(firstLink);
        paginationList.appendChild(firstItem);
        
        // Ellipsis if needed
        if (startPage > 2) {
          const ellipsisItem = document.createElement('li');
          ellipsisItem.className = 'pagination-item pagination-ellipsis';
          ellipsisItem.textContent = '...';
          paginationList.appendChild(ellipsisItem);
        }
      }
      
      // Page numbers
      for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'pagination-item';
        if (i === currentPage) {
          pageItem.classList.add('active');
        }
        
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', e => {
          e.preventDefault();
          goToPage(i);
        });
        
        pageItem.appendChild(pageLink);
        paginationList.appendChild(pageItem);
      }
      
      // Last page link if needed
      if (endPage < totalPages) {
        // Ellipsis if needed
        if (endPage < totalPages - 1) {
          const ellipsisItem = document.createElement('li');
          ellipsisItem.className = 'pagination-item pagination-ellipsis';
          ellipsisItem.textContent = '...';
          paginationList.appendChild(ellipsisItem);
        }
        
        const lastItem = document.createElement('li');
        lastItem.className = 'pagination-item';
        const lastLink = document.createElement('a');
        lastLink.href = '#';
        lastLink.textContent = totalPages;
        lastLink.addEventListener('click', e => {
          e.preventDefault();
          goToPage(totalPages);
        });
        lastItem.appendChild(lastLink);
        paginationList.appendChild(lastItem);
      }
      
      // Next button
      const nextItem = document.createElement('li');
      nextItem.className = 'pagination-item pagination-next';
      const nextLink = document.createElement('a');
      nextLink.href = '#';
      nextLink.innerHTML = '&raquo;';
      nextLink.setAttribute('aria-label', 'Next page');
      if (currentPage === totalPages) {
        nextItem.classList.add('disabled');
        nextLink.addEventListener('click', e => e.preventDefault());
      } else {
        nextLink.addEventListener('click', e => {
          e.preventDefault();
          goToPage(currentPage + 1);
        });
      }
      nextItem.appendChild(nextLink);
      paginationList.appendChild(nextItem);
      
      // Add pagination to container
      paginationContainer.appendChild(paginationList);
      paginationContainer.style.display = 'flex';
    }
    
    function goToPage(page) {
      // Don't do anything if it's already the current page
      if (page === currentPage) return;
      
      // Update page and refresh display
      currentPage = page;
      updatePostDisplay();
      updatePagination();
      updatePostCount();
      
      // Scroll to top of research section for better UX
      const researchSection = document.querySelector('.research-section');
      if (researchSection) {
        const offset = researchSection.offsetTop - 100; // Subtract header height + some padding
        window.scrollTo({
          top: offset,
          behavior: 'smooth'
        });
      }
    }
    
    function updatePostCount() {
      if (!postsCount) return;
      
      if (filteredPosts.length === 0) {
        postsCount.textContent = 'No posts match your filters';
      } else if (filteredPosts.length === posts.length) {
        const start = (currentPage - 1) * POSTS_PER_PAGE + 1;
        const end = Math.min(currentPage * POSTS_PER_PAGE, posts.length);
        postsCount.textContent = `Showing ${start}-${end} of ${posts.length} posts`;
      } else {
        const start = (currentPage - 1) * POSTS_PER_PAGE + 1;
        const end = Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length);
        postsCount.textContent = `Showing ${start}-${end} of ${filteredPosts.length} posts matching your filters`;
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
        return option.text.toLowerCase().includes(searchTerm.toLowerCase()); // Case-insensitive search
      });
      
      // Add filtered options
      filteredOptions.forEach(option => {
        const item = document.createElement('div');
        item.className = 'author-dropdown-item';
        item.dataset.value = option.value;
        
        // Highlight search term
        if (searchTerm && option.value !== 'all') {
          const regex = new RegExp(`(${searchTerm})`, 'gi');
          const highlightedText = option.text.replace(regex, '<strong>$1</strong>');
          item.innerHTML = highlightedText;
        } else {
          item.textContent = option.text;
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
        noResults.className = 'author-dropdown-item no-results';
        noResults.textContent = 'No authors found';
        dropdown.appendChild(noResults);
      }
    }
    
    function updateSelectedDisplay(element, text) {
      element.textContent = text;
    }
  });