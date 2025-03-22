// Enhanced Translation Features
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize when we have a translation viewer
  const translationViewer = document.getElementById('translation-viewer');
  if (!translationViewer) return;
  
  // ===== FEATURE 1: SMART SYNCHRONIZED SCROLLING =====
  function setupSynchronizedScrolling() {
    // We'll only set this up when the side-by-side view is active
    const sideByByside = document.getElementById('side-by-side');
    if (!sideByByside || !sideByByside.classList.contains('active')) return;
    
    const latinColumn = document.querySelector('.latin-column');
    const englishColumn = document.querySelector('.english-column');
    
    if (!latinColumn || !englishColumn) return;
    
    // Create sync controls
    const syncControls = document.createElement('div');
    syncControls.className = 'sync-controls';
    syncControls.innerHTML = `
      <div class="sync-toggle">
        <button id="sync-toggle-button" class="sync-button active" title="Toggle synchronized scrolling">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M4 11v2h16v-2H4zm0-7v2h16V4H4zm0 14v2h16v-2H4z" fill="currentColor" />
          </svg>
          <span>Sync Scrolling</span>
        </button>
      </div>
    `;
    
    // Add controls to the side-by-side container
    const columnsContainer = sideByByside.querySelector('.two-columns');
    sideByByside.insertBefore(syncControls, columnsContainer);
    
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .sync-controls {
        text-align: center;
        margin: 0 0 10px 0;
      }
      .sync-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 13px;
        color: #666;
      }
      .sync-button.active {
        background: #3E2C1B;
        color: white;
        border-color: #3E2C1B;
      }
      .column-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(184, 134, 11, 0.8);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
      }
      .latin-column:hover .column-indicator,
      .english-column:hover .column-indicator {
        opacity: 1;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Track scroll state
    let isScrollSynced = true;
    let isScrolling = false;
    let activeColumn = null;
    let inactivityTimer = null;
    
    // Add indicators to columns
    const latinIndicator = document.createElement('div');
    latinIndicator.className = 'column-indicator';
    latinIndicator.textContent = 'Latin Text';
    latinColumn.style.position = 'relative';
    latinColumn.appendChild(latinIndicator);
    
    const englishIndicator = document.createElement('div');
    englishIndicator.className = 'column-indicator';
    englishIndicator.textContent = 'English Translation';
    englishColumn.style.position = 'relative';
    englishColumn.appendChild(englishIndicator);
    
    // Chunk-based scrolling
    function findVisibleChunk(column) {
      const chunks = column.querySelectorAll('.chunk-section');
      const columnRect = column.getBoundingClientRect();
      let bestVisibility = 0;
      let bestChunk = null;
      
      chunks.forEach(chunk => {
        const chunkRect = chunk.getBoundingClientRect();
        const visibleTop = Math.max(chunkRect.top, columnRect.top);
        const visibleBottom = Math.min(chunkRect.bottom, columnRect.bottom);
        
        if (visibleBottom > visibleTop) {
          const visibleHeight = visibleBottom - visibleTop;
          const percentVisible = visibleHeight / chunkRect.height;
          
          if (percentVisible > bestVisibility) {
            bestVisibility = percentVisible;
            bestChunk = chunk;
          }
        }
      });
      
      return bestChunk;
    }
    
    function scrollToMatchingChunk(sourceColumn, targetColumn) {
      const visibleChunk = findVisibleChunk(sourceColumn);
      if (!visibleChunk) return;
      
      const chunkNumber = visibleChunk.querySelector('.chunk-number').textContent;
      const targetChunks = targetColumn.querySelectorAll('.chunk-section');
      
      for (const chunk of targetChunks) {
        const num = chunk.querySelector('.chunk-number').textContent;
        if (num === chunkNumber) {
          // Get relative position in source chunk
          const visibleChunkRect = visibleChunk.getBoundingClientRect();
          const sourceColumnRect = sourceColumn.getBoundingClientRect();
          const relativePosition = (visibleChunkRect.top - sourceColumnRect.top) / visibleChunk.offsetHeight;
          
          // Apply relative position to target chunk
          targetColumn.scrollTop = chunk.offsetTop + (chunk.offsetHeight * relativePosition);
          break;
        }
      }
    }
    
    // Handle scroll events
    function handleScroll(event) {
      if (!isScrollSynced || isScrolling) return;
      
      // Identify which column was scrolled
      const sourceColumn = event.currentTarget;
      const targetColumn = sourceColumn === latinColumn ? englishColumn : latinColumn;
      
      // Track which column the user is actively using
      activeColumn = sourceColumn;
      
      // Set scrolling flag to prevent loops
      isScrolling = true;
      
      // Scroll the other column to match the current chunk
      scrollToMatchingChunk(sourceColumn, targetColumn);
      
      // Reset scrolling flag after a short delay
      setTimeout(() => { isScrolling = false; }, 50);
      
      // Update column indicators
      updateColumnIndicators();
      
      // Reset inactivity timer
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        activeColumn = null;
        updateColumnIndicators();
      }, 2000);
    }
    
    // Update column indicators based on active column
    function updateColumnIndicators() {
      if (activeColumn === latinColumn) {
        latinIndicator.textContent = 'Scrolling Latin Text';
        latinIndicator.style.opacity = '1';
        englishIndicator.textContent = 'Following';
        englishIndicator.style.opacity = '1';
      } else if (activeColumn === englishColumn) {
        englishIndicator.textContent = 'Scrolling English Text';
        englishIndicator.style.opacity = '1';
        latinIndicator.textContent = 'Following';
        latinIndicator.style.opacity = '1';
      } else {
        latinIndicator.textContent = 'Latin Text';
        latinIndicator.style.opacity = '0';
        englishIndicator.textContent = 'English Translation';
        englishIndicator.style.opacity = '0';
      }
    }
    
    // Toggle sync state
    const syncToggleButton = document.getElementById('sync-toggle-button');
    syncToggleButton.addEventListener('click', function() {
      isScrollSynced = !isScrollSynced;
      this.classList.toggle('active', isScrollSynced);
      
      // Update text
      const textSpan = this.querySelector('span');
      textSpan.textContent = isScrollSynced ? 'Sync Scrolling' : 'Scrolling Independent';
      
      // Update indicators
      if (!isScrollSynced) {
        latinIndicator.textContent = 'Independent Scrolling';
        englishIndicator.textContent = 'Independent Scrolling';
        latinIndicator.style.opacity = '1';
        englishIndicator.style.opacity = '1';
        
        // Reset after a moment
        setTimeout(() => {
          latinIndicator.style.opacity = '0';
          englishIndicator.style.opacity = '0';
        }, 2000);
      } else {
        // Re-sync columns when enabling sync
        scrollToMatchingChunk(latinColumn, englishColumn);
        updateColumnIndicators();
      }
    });
    
    // Add event listeners for scroll
    latinColumn.addEventListener('scroll', handleScroll);
    englishColumn.addEventListener('scroll', handleScroll);
    
    // Initial sync
    setTimeout(() => {
      scrollToMatchingChunk(latinColumn, englishColumn);
    }, 100);
    
    console.log('Smart synchronized scrolling enabled');
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
        <div class="search-navigation">
          <button id="search-prev" title="Previous result" disabled>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" stroke-width="2"></polyline>
            </svg>
          </button>
          <span id="search-result-count"></span>
          <button id="search-next" title="Next result" disabled>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <polyline points="9 18 15 12 9 6" fill="none" stroke="currentColor" stroke-width="2"></polyline>
            </svg>
          </button>
        </div>
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
        align-items: center;
        flex-wrap: wrap;
      }
      .search-navigation {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #search-prev, #search-next {
        background: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      #search-prev:disabled, #search-next:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      #search-result-count {
        color: #666;
        min-width: 60px;
        text-align: center;
      }
      .search-highlight {
        background-color: #FFEB99;
        outline: 1px solid #B8860B;
      }
      .search-highlight.active {
        background-color: #FFD700;
      }
      
      /* Mobile-specific styles */
      @media (max-width: 768px) {
        .translation-search {
          padding: 8px 12px;
        }
        .search-options {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        .search-navigation {
          margin-left: 0;
          width: 100%;
          justify-content: space-between;
        }
        .search-mobile-notice {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
          font-style: italic;
        }
      }
    `;
    document.head.appendChild(styleElement);
    
    // Setup search functionality
    const searchInput = document.getElementById('translation-search-input');
    const searchButton = document.getElementById('translation-search-button');
    const searchLatin = document.getElementById('search-latin');
    const searchEnglish = document.getElementById('search-english');
    const resultCount = document.getElementById('search-result-count');
    const prevButton = document.getElementById('search-prev');
    const nextButton = document.getElementById('search-next');
    
    // Track search state
    let currentHighlights = [];
    let currentHighlightIndex = -1;
    const isMobile = window.innerWidth <= 768;
    
    function performSearch() {
      // Clear previous highlights
      clearHighlights();
      
      // Reset navigation state
      currentHighlightIndex = -1;
      prevButton.disabled = true;
      nextButton.disabled = true;
      
      const searchTerm = searchInput.value.trim();
      if (!searchTerm) {
        resultCount.textContent = '';
        return;
      }
      
      // Determine which text to search based on current view and options
      let textElements = [];
      
      // Handle mobile differently - search in active tab only
      if (isMobile) {
        const activeTab = document.querySelector('.tab-panel.active');
        if (activeTab) {
          if (activeTab.id === 'latin-only' && searchLatin.checked) {
            textElements = Array.from(activeTab.querySelectorAll('.latin-text'));
          } else if (activeTab.id === 'english-only' && searchEnglish.checked) {
            textElements = Array.from(activeTab.querySelectorAll('.english-text'));
          } else if (activeTab.id === 'side-by-side') {
            // This shouldn't happen on mobile, but just in case
            if (searchLatin.checked) {
              textElements = textElements.concat(Array.from(activeTab.querySelectorAll('.latin-text')));
            }
            if (searchEnglish.checked) {
              textElements = textElements.concat(Array.from(activeTab.querySelectorAll('.english-text')));
            }
          } else if (activeTab.id === 'analysis') {
            // Search in the analysis content
            textElements = Array.from(activeTab.querySelectorAll('.analysis-content'));
          }
        }
      } else {
        // Desktop - search in all available text elements based on options
        if (searchLatin.checked) {
          textElements = textElements.concat(Array.from(document.querySelectorAll('.latin-text')));
        }
        
        if (searchEnglish.checked) {
          textElements = textElements.concat(Array.from(document.querySelectorAll('.english-text')));
        }
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
          return `<span class="search-highlight" data-highlight-index="${totalMatches-1}">${match}</span>`;
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
      
      // Enable/disable navigation buttons
      nextButton.disabled = currentHighlights.length <= 0;
      
      // If results found, navigate to first one
      if (currentHighlights.length > 0) {
        navigateToResult(0);
      } else {
        // No results - show message based on context
        if (isMobile && (searchLatin.checked && searchEnglish.checked)) {
          resultCount.textContent = 'No results in current view';
          
          // Add mobile notice explaining search scope
          const mobileNotice = document.createElement('div');
          mobileNotice.className = 'search-mobile-notice';
          mobileNotice.textContent = 'Tip: Switch tabs to search in both Latin and English.';
          
          // Find a place to add this notice
          const searchOptions = document.querySelector('.search-options');
          if (searchOptions && !searchOptions.querySelector('.search-mobile-notice')) {
            searchOptions.appendChild(mobileNotice);
          }
        } else {
          resultCount.textContent = 'No results';
        }
      }
    }
    
    // Navigate to a specific search result
    function navigateToResult(index) {
      if (index < 0 || index >= currentHighlights.length) return;
      
      // Update current index
      currentHighlightIndex = index;
      
      // Update navigation buttons
      prevButton.disabled = currentHighlightIndex <= 0;
      nextButton.disabled = currentHighlightIndex >= currentHighlights.length - 1;
      
      // Update result count display
      resultCount.textContent = `${currentHighlightIndex + 1} of ${currentHighlights.length}`;
      
      // Remove active class from all highlights
      currentHighlights.forEach(highlight => highlight.classList.remove('active'));
      
      // Add active class to current highlight
      const currentHighlight = currentHighlights[currentHighlightIndex];
      currentHighlight.classList.add('active');
      
      // Get parent chunk for tab switching
      const chunk = currentHighlight.closest('.chunk-section');
      
      // Determine which language this highlight is in
      const isInLatin = !!currentHighlight.closest('.latin-text');
      const isInEnglish = !!currentHighlight.closest('.english-text');
      
      // Ensure correct tab is active before scrolling
      if (!isMobile) {
        // On desktop, we can switch to optimal view
        if (isInLatin && !isInEnglish) {
          if (!currentHighlight.closest('#side-by-side')) {
            document.querySelector('.tab-btn[data-target="latin-only"]').click();
          }
        } else if (isInEnglish && !isInLatin) {
          if (!currentHighlight.closest('#side-by-side')) {
            document.querySelector('.tab-btn[data-target="english-only"]').click();
          }
        } else if (window.innerWidth > 768) {
          // For mixed results on desktop, prefer side-by-side
          if (!currentHighlight.closest('#side-by-side')) {
            document.querySelector('.tab-btn[data-target="side-by-side"]').click();
          }
        }
      } else {
        // On mobile, switch tabs based on language
        if (isInLatin && searchLatin.checked) {
          document.querySelector('.tab-btn[data-target="latin-only"]').click();
        } else if (isInEnglish && searchEnglish.checked) {
          document.querySelector('.tab-btn[data-target="english-only"]').click();
        }
      }
      
      // Wait a bit for the tab switch to complete
      setTimeout(() => {
        // Scroll to current highlight
        currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    
    // Navigate to next result
    function goToNextResult() {
      if (currentHighlightIndex < currentHighlights.length - 1) {
        navigateToResult(currentHighlightIndex + 1);
      }
    }
    
    // Navigate to previous result
    function goToPreviousResult() {
      if (currentHighlightIndex > 0) {
        navigateToResult(currentHighlightIndex - 1);
      }
    }
    
    // Clear highlights
    function clearHighlights() {
      document.querySelectorAll('.search-highlight').forEach(highlight => {
        const parent = highlight.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
          parent.normalize();
        }
      });
      
      // Remove any mobile notice
      const mobileNotice = document.querySelector('.search-mobile-notice');
      if (mobileNotice) {
        mobileNotice.remove();
      }
      
      currentHighlights = [];
      currentHighlightIndex = -1;
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
    
    prevButton.addEventListener('click', goToPreviousResult);
    nextButton.addEventListener('click', goToNextResult);
    
    // For mobile, update search options based on active tab
    function updateMobileSearchOptions() {
      if (!isMobile) return;
      
      const activeTab = document.querySelector('.tab-panel.active');
      if (!activeTab) return;
      
      // Enable/disable checkboxes based on active tab
      if (activeTab.id === 'latin-only') {
        searchLatin.checked = true;
        searchEnglish.checked = false;
        searchEnglish.disabled = true;
        searchLatin.disabled = true;
      } else if (activeTab.id === 'english-only') {
        searchLatin.checked = false;
        searchEnglish.checked = true;
        searchLatin.disabled = true;
        searchEnglish.disabled = true;
      } else {
        searchLatin.disabled = false;
        searchEnglish.disabled = false;
      }
    }
    
    // Update on tab change
    document.addEventListener('tabChanged', function() {
      updateMobileSearchOptions();
      // Clear previous search when changing tabs on mobile
      if (isMobile) {
        clearHighlights();
        resultCount.textContent = '';
      }
    });
    
    // Initialize
    updateMobileSearchOptions();
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
  
  // Handle window resize
  window.addEventListener('resize', function() {
    const wasMobile = window.innerWidth <= 768;
    
    // If switching between mobile and desktop, reload the page
    // This is a simplistic approach; a more complex solution would
    // reinitialize the features without reloading
    if (wasMobile !== (window.innerWidth <= 768)) {
      // Instead of reload, we could re-run setup functions
      setupSimpleSearch();
      if (document.getElementById('side-by-side').classList.contains('active')) {
        setupSynchronizedScrolling();
      }
    }
  });
});