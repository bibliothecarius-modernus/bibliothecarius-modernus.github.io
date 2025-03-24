document.addEventListener('DOMContentLoaded', function() {
    // Get all relevant elements
    const posts = document.querySelectorAll('.post-item');
    const sortBySelect = document.getElementById('sort-by');
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
    let currentSort = 'date-desc';
    let currentPage = 1;
    let filteredPosts = [...posts];
    
    // Initialize
    init();
    
    function init() {
      // Set up event listeners
      sortBySelect.addEventListener('change', handleSortChange);
      filterCenturySelect.addEventListener('change', handleFilterChange);
      filterAuthorSelect.addEventListener('change', handleFilterChange);
      resetButton.addEventListener('click', resetFilters);
      clearFiltersLink.addEventListener('click', resetFilters);
      loadMoreButton.addEventListener('click', loadMorePosts);
      
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
    
    function handleSortChange() {
      currentSort = sortBySelect.value;
      refreshPosts();
    }
    
    function handleFilterChange() {
      currentFilters.century = filterCenturySelect.value;
      currentFilters.author = filterAuthorSelect.value;
      refreshPosts();
    }
    
    function resetFilters(e) {
      if (e) e.preventDefault();
      
      // Reset all filter controls
      sortBySelect.value = 'date-desc';
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
      currentSort = 'date-desc';
      currentPage = 1;
      
      refreshPosts();
    }
    
    function refreshPosts() {
      // Show loading indicator
      if (loader) loader.style.display = 'flex';
      
      // Give time for the loader to appear before doing heavy operations
      setTimeout(() => {
        // Apply filters
        filteredPosts = [...posts].filter(post => {
          let passes = true;
          
          // Century filter
          if (currentFilters.century !== 'all') {
            const originalDate = post.dataset.originalDate;
            if (originalDate) {
              // Use the improved century extraction
              const century = extractCenturyFromYear(originalDate);
              passes = passes && (century.toString() === currentFilters.century);
            } else {
              passes = false;
            }
          }
          
          // Author filter
          if (currentFilters.author !== 'all') {
            passes = passes && (post.dataset.author === currentFilters.author);
          }
          
          // Category filter
          if (currentFilters.category !== 'all') {
            const categories = post.dataset.categories.split(',');
            passes = passes && categories.includes(currentFilters.category);
          }
          
          return passes;
        });
        
        // Apply sorting
        filteredPosts.sort((a, b) => {
          switch (currentSort) {
            case 'date-desc':
              return new Date(b.dataset.date) - new Date(a.dataset.date);
            case 'date-asc':
              return new Date(a.dataset.date) - new Date(b.dataset.date);
            case 'title':
              return a.dataset.title.localeCompare(b.dataset.title);
            case 'original-date':
              // Handle complex date formats: "c. 865", ranges, BCE/CE notations
              const aYear = extractYearFromDateString(a.dataset.originalDate);
              const bYear = extractYearFromDateString(b.dataset.originalDate);
              return aYear - bYear;
            default:
              return 0;
          }
        });
        
        // Update DOM
        updatePostDisplay();
        updatePostCount();
        checkLoadMoreVisibility();
        
        // Hide loading indicator
        if (loader) loader.style.display = 'none';
      }, 300); // Short delay for the loader to be visible
    }
    
    function updatePostDisplay() {
      // First, hide all posts
      posts.forEach(post => {
        post.style.display = 'none';
      });
      
      // Show no results message if needed
      if (filteredPosts.length === 0) {
        noResults.style.display = 'block';
        loadMoreButton.style.display = 'none';
      } else {
        noResults.style.display = 'none';
        
        // Show only the posts for the current page
        const startIndex = 0;
        const endIndex = Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length);
        
        // Add animation classes
        filteredPosts.forEach((post, index) => {
          if (index >= startIndex && index < endIndex) {
            // Add a staggered delay for fade-in animation
            setTimeout(() => {
              post.classList.add('showing');
              post.style.display = 'flex';
            }, (index - startIndex) * 50);
          }
        });
      }
    }
    
    function loadMorePosts() {
      currentPage++;
      updatePostDisplay();
      checkLoadMoreVisibility();
    }
    
    function checkLoadMoreVisibility() {
      if (filteredPosts.length <= currentPage * POSTS_PER_PAGE) {
        loadMoreButton.style.display = 'none';
      } else {
        loadMoreButton.style.display = 'inline-block';
      }
    }
    
    function updatePostCount() {
      if (postsCount) {
        if (filteredPosts.length === posts.length) {
          postsCount.textContent = `Showing all ${posts.length} posts`;
        } else {
          postsCount.textContent = `Showing ${Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length)} of ${filteredPosts.length} posts matching your filters`;
        }
      }
    }
    
    // Helper function to extract a numeric year from complex date strings
    function extractYearFromDateString(dateString) {
      if (!dateString) return 0;
      
      // Handle BCE/BC dates (make them negative for proper sorting)
      if (/BCE|BC/i.test(dateString)) {
        // Extract the number before BCE/BC and make negative
        const match = dateString.match(/(\d+)\s*(?:BCE|BC)/i);
        if (match) {
          return -parseInt(match[1]);
        }
      }
      
      // Remove "c." (circa), "ca.", and similar approximation markers
      let cleaned = dateString.replace(/^c\.\s*|^ca\.\s*|^circa\s*/i, '');
      
      // For date ranges (e.g., "865-870"), take the first year
      if (/-/.test(cleaned) && !/\d-\d{1,2}$/.test(cleaned)) { // Avoid interpreting "March 5-6" as a year range
        cleaned = cleaned.split('-')[0].trim();
      }
      
      // For dates like "9th century", approximate to the middle of the century
      const centuryMatch = cleaned.match(/(\d+)(?:st|nd|rd|th)\s*century/i);
      if (centuryMatch) {
        const century = parseInt(centuryMatch[1]);
        return (century - 1) * 100 + 50; // Middle of the century
      }
      
      // Extract the first 1-4 digit number sequence
      const numericMatch = cleaned.match(/\b(\d{1,4})\b/);
      if (numericMatch) {
        return parseInt(numericMatch[1]);
      }
      
      // Default to 0 if no valid year found
      return 0;
    }
    
    // Extract century from a year
    function extractCenturyFromYear(yearString) {
      const year = extractYearFromDateString(yearString);
      
      // Handle BCE/BC dates
      if (year < 0) {
        return Math.ceil(Math.abs(year) / 100) + " BCE";
      }
      
      // Handle CE/AD dates
      return Math.ceil(year / 100);
    }
  });