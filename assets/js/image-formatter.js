// Enhanced Translation Features
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize when we have a translation viewer
  const translationViewer = document.getElementById('translation-viewer');
  if (!translationViewer) return;
  
  // ===== FEATURE 1: SYNCHRONIZED SCROLLING =====
  function setupSynchronizedScrolling() {
    // We'll only set this up when the side-by-side view is active
    const sideByByside = document.getElementById('side-by-side');
    if (!sideByByside || !sideByByside.classList.contains('active')) return;
    
    const latinColumn = document.querySelector('.latin-column');
    const englishColumn = document.querySelector('.english-column');
    
    if (!latinColumn || !englishColumn) return;
    
    // Flag to prevent scroll loops
    let isScrolling = false;
    
    function handleScroll(sourceColumn, targetColumn) {
      if (isScrolling) return;
      isScrolling = true;
      
      // Calculate scroll percentage
      const scrollPercentage = sourceColumn.scrollTop / 
        (sourceColumn.scrollHeight - sourceColumn.clientHeight);
      
      // Apply to target column
      targetColumn.scrollTop = scrollPercentage * 
        (targetColumn.scrollHeight - targetColumn.clientHeight);
      
      // Reset flag after a short delay
      setTimeout(() => { isScrolling = false; }, 50);
    }
    
    // Add event listeners
    latinColumn.addEventListener('scroll', function() {
      handleScroll(latinColumn, englishColumn);
    });
    
    englishColumn.addEventListener('scroll', function() {
      handleScroll(englishColumn, latinColumn);
    });
    
    console.log('Synchronized scrolling enabled');
  }
  
  // ===== FEATURE 2: SIMPLE SEARCH =====
  function setupSimpleSearch() {
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'translation-search';
    searchContainer.innerHTML = `
      <div class="search-input-container">
        <input type="text" id="translation-search-input" placeholder="Search in text...">
        <button id="translation-search-button">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"></line>
          </svg>
        </button>
      </div>
      <div class="search-options">
        <label><input type="checkbox" id="search-latin" checked> Latin</label>
        <label><input type="checkbox" id="search-english" checked> English</label>
        <span id="search-result-count"></span>
      </div>
    `;
    
    // Add search to translation viewer
    const tabsContainer = translationViewer.querySelector('.translation-tabs');
    translationViewer.insertBefore(searchContainer, tabsContainer);
    
    // Add search styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .translation-search {
        margin: 0 auto 15px;
        max-width: 800px;
        padding: 10px 15px;
        background: #f8f4ea;
        border: 1px solid #B8860B;
        border-radius: 6px;
      }
      .search-input-container {
        display: flex;
        width: 100%;
      }
      #translation-search-input {
        flex: 1;
        padding: 8px 10px;
        border: 1px solid #ccc;
        border-radius: 4px 0 0 4px;
        font-size: 14px;
      }
      #translation-search-button {
        background: #3E2C1B;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        padding: 0 15px;
        cursor: pointer;
      }
      .search-options {
        display: flex;
        margin-top: 8px;
        gap: 15px;
        font-size: 14px;
      }
      #search-result-count {
        margin-left: auto;
        color: #666;
      }
      .search-highlight {
        background-color: #FFEB99;
        outline: 1px solid #B8860B;
      }
      .search-highlight.active {
        background-color: #FFD700;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Setup search functionality
    const searchInput = document.getElementById('translation-search-input');
    const searchButton = document.getElementById('translation-search-button');
    const searchLatin = document.getElementById('search-latin');
    const searchEnglish = document.getElementById('search-english');
    const resultCount = document.getElementById('search-result-count');
    
    let currentHighlights = [];
    
    function performSearch() {
      // Clear previous highlights
      clearHighlights();
      
      const searchTerm = searchInput.value.trim();
      if (!searchTerm) {
        resultCount.textContent = '';
        return;
      }
      
      let textElements = [];
      
      // Determine which text to search
      if (searchLatin.checked) {
        textElements = textElements.concat(Array.from(document.querySelectorAll('.latin-text')));
      }
      
      if (searchEnglish.checked) {
        textElements = textElements.concat(Array.from(document.querySelectorAll('.english-text')));
      }
      
      // Highlight matches
      let totalMatches = 0;
      
      textElements.forEach(el => {
        const html = el.innerHTML;
        // Simple case-insensitive matching
        const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
        
        // Replace with highlights
        const newHtml = html.replace(regex, match => {
          totalMatches++;
          return `<span class="search-highlight">${match}</span>`;
        });
        
        // Update if we found matches
        if (html !== newHtml) {
          el.innerHTML = newHtml;
        }
      });
      
      // Update result count
      resultCount.textContent = `${totalMatches} result${totalMatches !== 1 ? 's' : ''}`;
      
      // Save all highlights for navigation
      currentHighlights = Array.from(document.querySelectorAll('.search-highlight'));
      
      // Switch to appropriate tab if results found
      if (currentHighlights.length > 0) {
        // Find the first highlight
        const firstHighlight = currentHighlights[0];
        const isInLatin = !!firstHighlight.closest('.latin-text');
        const isInEnglish = !!firstHighlight.closest('.english-text');
        
        // Switch to appropriate view if needed
        if (isInLatin && !isInEnglish && !firstHighlight.closest('#side-by-side')) {
          document.querySelector('.tab-btn[data-target="latin-only"]').click();
        } else if (isInEnglish && !isInLatin && !firstHighlight.closest('#side-by-side')) {
          document.querySelector('.tab-btn[data-target="english-only"]').click();
        } else if (window.innerWidth > 768) {
          document.querySelector('.tab-btn[data-target="side-by-side"]').click();
        }
        
        // Scroll to first match
        setTimeout(() => {
          firstHighlight.classList.add('active');
          firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
    
    function clearHighlights() {
      document.querySelectorAll('.search-highlight').forEach(highlight => {
        const parent = highlight.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
          parent.normalize();
        }
      });
      currentHighlights = [];
    }
    
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Add event listeners
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    
    console.log('Search functionality enabled');
  }
  
  // ===== INITIALIZE FEATURES =====
  
  // Setup search immediately
  setupSimpleSearch();
  
  // Setup scrolling when side-by-side is active
  if (document.getElementById('side-by-side').classList.contains('active')) {
    setupSynchronizedScrolling();
  }
  
  // Listen for tab changes
  document.addEventListener('tabChanged', function(e) {
    if (e.detail && e.detail.tabId === 'side-by-side') {
      // Initialize scrolling when switching to side-by-side view
      setupSynchronizedScrolling();
    }
  });
});