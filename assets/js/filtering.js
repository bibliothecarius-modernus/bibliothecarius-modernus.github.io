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
      // Set up event listeners
      filterCenturySelect.addEventListener('change', handleFilterChange);
      filterAuthorSelect.addEventListener('change', handleFilterChange);
      resetButton.addEventListener('click', resetFilters);
      if (clearFiltersLink) clearFiltersLink.addEventListener('click', resetFilters);
      if (loadMoreButton) loadMoreButton.addEventListener('click', loadMorePosts);
      
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
            // Special handling for years ending in 00
            if (year % 100 === 0) {
              century = (year / 100).toString();
            } else {
              century = Math.ceil(year / 100).toString();
            }
            data.centuries.add(century);
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
            const match = originalDate.match(/\d+/);
            if (match) {
              const year = parseInt(match[0]);
              // Special handling for years ending in 00
              if (year % 100 === 0) {
                century = (year / 100).toString();
              } else {
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
  });