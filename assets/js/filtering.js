document.addEventListener('DOMContentLoaded', function() {
    // Get all relevant elements
    const posts = document.querySelectorAll('.post-item');
    const filterCenturySelect = document.getElementById('filter-century');
    const filterAuthorSelect = document.getElementById('filter-author');
    const categoryPills = document.querySelectorAll('.pill');
    const resetButton = document.getElementById('reset-filters');
    const clearFiltersLink = document.getElementById('clear-filters');
    const loadMoreButton = document.getElementById('load-more');
    const postsCount = document.getElementById('posts-count');
    const noResults = document.getElementById('no-results');
    const postsList = document.getElementById('filtered-posts');
    const loader = document.querySelector('.loader');
    
    // Constants
    const POSTS_PER_PAGE = 6;
    
    // State variables
    let currentFilters = {
      century: 'all',
      author: 'all',
      category: 'all'
    };
    let currentPage = 1;
    let filteredPosts = [...posts];
    
    // Initialize
    init();
    
    function init() {
      // Set up event listeners
      filterCenturySelect.addEventListener('change', handleFilterChange);
      filterAuthorSelect.addEventListener('change', handleFilterChange);
      resetButton.addEventListener('click', resetFilters);
      if (clearFiltersLink) clearFiltersLink.addEventListener('click', resetFilters);
      if (loadMoreButton) loadMoreButton.addEventListener('click', loadMorePosts);
      
      // Set up category pills
      categoryPills.forEach(pill => {
        pill.addEventListener('click', function() {
          // Remove active class from all pills
          categoryPills.forEach(p => p.classList.remove('active'));
          // Add active class to clicked pill
          this.classList.add('active');
          
          // Update filter and refresh
          currentFilters.category = this.dataset.category;
          refreshPosts();
        });
      });
      
      // Initial setup
      updatePostCount();
      checkLoadMoreVisibility();
    }
    
    function handleFilterChange() {
      currentFilters.century = filterCenturySelect.value;
      currentFilters.author = filterAuthorSelect.value;
      refreshPosts();
    }
    
    function resetFilters(e) {
      if (e) e.preventDefault();
      
      // Reset all filter controls
      filterCenturySelect.value = 'all';
      filterAuthorSelect.value = 'all';
      
      // Reset pills
      categoryPills.forEach(pill => {
        pill.classList.remove('active');
        if (pill.dataset.category === 'all') {
          pill.classList.add('active');
        }
      });
      
      // Reset state
      currentFilters = {
        century: 'all',
        author: 'all',
        category: 'all'
      };
      currentPage = 1;
      
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
        
        // Apply filters - using a more efficient approach for better performance
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
      if (currentFilters.century === 'all' && 
          currentFilters.author === 'all' && 
          currentFilters.category === 'all') {
        return [...posts];
      }
      
      // Only filter what needs to be filtered
      return [...posts].filter(post => {
        if (currentFilters.century !== 'all') {
          // Extract century from the data attribute using a simple approach
          let century = '';
          try {
            const originalDate = post.dataset.originalDate || '';
            // Extract first number from the date string
            const match = originalDate.match(/\d+/);
            if (match) {
              const year = parseInt(match[0]);
              century = Math.ceil(year / 100).toString();
            }
          } catch (e) {
            console.log('Error parsing date:', e);
          }
          
          if (century !== currentFilters.century) return false;
        }
        
        if (currentFilters.author !== 'all' && 
            post.dataset.author !== currentFilters.author) {
          return false;
        }
        
        if (currentFilters.category !== 'all') {
          const categories = (post.dataset.categories || '').split(',');
          if (!categories.includes(currentFilters.category)) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    function updatePostDisplay() {
      // Performance optimization - use document fragment for batch DOM updates
      const fragment = document.createDocumentFragment();
      const postsToShow = filteredPosts.slice(0, currentPage * POSTS_PER_PAGE);
      
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