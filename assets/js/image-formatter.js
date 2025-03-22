// Enhanced Translation Features
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize when we have a translation viewer
  const translationViewer = document.getElementById('translation-viewer');
  if (!translationViewer) return;
  
  // Global variables to track event listeners for cleanup
  let latinScrollListener = null;
  let englishScrollListener = null;
  let syncToggleListener = null;
  let searchInitialized = false;
  
  // ===== FEATURE 1: SMART SYNCHRONIZED SCROLLING =====
  function setupSynchronizedScrolling() {
    // We'll only set this up when the side-by-side view is active
    const sideByByside = document.getElementById('side-by-side');
    if (!sideByByside || !sideByByside.classList.contains('active')) return;
    
    const latinColumn = document.querySelector('.latin-column');
    const englishColumn = document.querySelector('.english-column');
    
    if (!latinColumn || !englishColumn) return;
    
    // Clean up existing elements and listeners
    cleanupSynchronizedScrolling();
    
    // Create sync controls
    const syncControls = document.createElement('div');
    syncControls.className = 'sync-controls';
    syncControls.innerHTML = `
      <div class="sync-toggle">
        <button id="sync-toggle-button" class="sync-button active" title="Toggle synchronized scrolling">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M4 11v2h16v-2H4zm0-7v2h16V4H4zm0 14v2h16v-2H4z" fill="currentColor" />
          </svg>
          <span>Linked Scrolling On</span>
        </button>
      </div>
    `;
    
    // Add controls to the side-by-side container
    const columnsContainer = sideByByside.querySelector('.two-columns');
    sideByByside.insertBefore(syncControls, columnsContainer);
    
    // Make column headers sticky but less tall
    const columnHeaders = sideByByside.querySelectorAll('.two-columns h3');
    columnHeaders.forEach(header => {
      header.style.padding = '5px 0';
      header.style.margin = '0';
      header.style.fontSize = '0.9rem';
      header.style.opacity = '0.8';
    });
    
    // Add styles
    const styleId = 'translation-enhancement-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `
        .sync-controls {
          text-align: center;
          margin: 0 0 5px 0;
        }
        .sync-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 12px;
          color: #666;
        }
        .sync-button.active {
          background: #3E2C1B;
          color: white;
          border-color: #3E2C1B;
        }
        .column-indicator {
          position: absolute;
          top: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(184, 134, 11, 0.85);
          color: white;
          padding: 3px 10px;
          border-radius: 3px;
          font-size: 11px;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          z-index: 10;
        }
        .two-columns h3 {
          background-color: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid #e6d7b8;
          z-index: 5;
        }
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
          justify-content: space-between;
        }
        .search-checkboxes {
          display: flex;
          gap: 12px;
        }
        .search-navigation {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #search-prev, #search-next {
          background: #3E2C1B;
          color: white;
          border: none;
          border-radius: 4px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        #search-prev:disabled, #search-next:disabled {
          background: #ccc;
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
          box-shadow: 0 0 0 2px rgba(184, 134, 11, 0.5);
        }
        #keyboard-hints {
          color: #777;
          font-size: 11px;
          margin-top: 4px;
          text-align: right;
          font-style: italic;
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
          .search-checkboxes {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
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
          #keyboard-hints {
            display: none;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    // Track scroll state
    let isScrollSynced = true;
    let isScrolling = false;
    let activeColumn = null;
    let inactivityTimer = null;
    
    // Add indicators to columns
    const latinIndicator = document.createElement('div');
    latinIndicator.className = 'column-indicator';
    latinIndicator.textContent = '';
    latinColumn.style.position = 'relative';
    latinColumn.appendChild(latinIndicator);
    
    const englishIndicator = document.createElement('div');
    englishIndicator.className = 'column-indicator';
    englishIndicator.textContent = '';
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
      
      const chunkNumber = visibleChunk.querySelector('.chunk-number')?.textContent;
      if (!chunkNumber) return;
      
      const targetChunks = targetColumn.querySelectorAll('.chunk-section');
      
      for (const chunk of targetChunks) {
        const numElement = chunk.querySelector('.chunk-number');
        if (!numElement) continue;
        
        const num = numElement.textContent;
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
      
      // Show indicator briefly
      updateColumnIndicators();
      
      // Reset inactivity timer
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        activeColumn = null;
        updateColumnIndicators();
      }, 1500);
    }
    
    // Update column indicators based on active column
    function updateColumnIndicators() {
      // Only show indicators when scrolling is not synced
      if (!isScrollSynced) {
        latinIndicator.textContent = 'Independent Scrolling';
        englishIndicator.textContent = 'Independent Scrolling';
        latinIndicator.style.opacity = '1';
        englishIndicator.style.opacity = '1';
      } else if (activeColumn === latinColumn) {
        // Only show indicator in the active column
        latinIndicator.textContent = 'Scrolling both columns';
        latinIndicator.style.opacity = '1';
        englishIndicator.style.opacity = '0';
      } else if (activeColumn === englishColumn) {
        englishIndicator.textContent = 'Scrolling both columns';
        englishIndicator.style.opacity = '1';
        latinIndicator.style.opacity = '0';
      } else {
        latinIndicator.style.opacity = '0';
        englishIndicator.style.opacity = '0';
      }
    }
    
    // Toggle sync state handler
    function toggleSyncState() {
      isScrollSynced = !isScrollSynced;
      this.classList.toggle('active', isScrollSynced);
      
      // Update text
      const textSpan = this.querySelector('span');
      textSpan.textContent = isScrollSynced ? 'Linked Scrolling On' : 'Independent Scrolling';
      
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
        
        // Show brief confirmation
        latinIndicator.textContent = 'Linking columns...';
        latinIndicator.style.opacity = '1';
        
        setTimeout(() => {
          latinIndicator.style.opacity = '0';
        }, 1500);
      }
    }
    
    // Setup event listeners
    latinScrollListener = handleScroll.bind(null);
    englishScrollListener = handleScroll.bind(null);
    
    latinColumn.addEventListener('scroll', latinScrollListener);
    englishColumn.addEventListener('scroll', englishScrollListener);
    
    const syncToggleButton = document.getElementById('sync-toggle-button');
    syncToggleListener = toggleSyncState.bind(syncToggleButton);
    syncToggleButton.addEventListener('click', syncToggleListener);
    
    // Initial sync
    setTimeout(() => {
      scrollToMatchingChunk(latinColumn, englishColumn);
    }, 100);
    
    console.log('Smart synchronized scrolling enabled');
  }
  
  // Function to clean up before re-initializing scroll sync
  function cleanupSynchronizedScrolling() {
    // Remove UI elements
    const existingSyncControls = document.querySelector('.sync-controls');
    if (existingSyncControls) {
      existingSyncControls.remove();
    }
    
    document.querySelectorAll('.column-indicator').forEach(indicator => {
      indicator.remove();
    });
    
    // Remove event listeners
    const latinColumn = document.querySelector('.latin-column');
    const englishColumn = document.querySelector('.english-column');
    
    if (latinColumn && latinScrollListener) {
      latinColumn.removeEventListener('scroll', latinScrollListener);
    }
    
    if (englishColumn && englishScrollListener) {
      englishColumn.removeEventListener('scroll', englishScrollListener);
    }
    
    const syncToggleButton = document.getElementById('sync-toggle-button');
    if (syncToggleButton && syncToggleListener) {
      syncToggleButton.removeEventListener('click', syncToggleListener);
    }
    
    // Reset global variables
    latinScrollListener = null;
    englishScrollListener = null;
    syncToggleListener = null;
  }
  
  // ===== FEATURE 2: SIMPLE SEARCH =====
  function setupSimpleSearch() {
    // Only initialize once
    if (searchInitialized) return;
    searchInitialized = true;
    
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
        <div class="search-checkboxes">
          <label><input type="checkbox" id="search-latin" checked> Latin</label>
          <label><input type="checkbox" id="search-english" checked> English</label>
        </div>
        <div class="search-navigation">
          <button id="search-prev" title="Previous result (Shift+Enter)" disabled>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" stroke-width="2"></polyline>
            </svg>
          </button>
          <span id="search-result-count"></span>
          <button id="search-next" title="Next result (Enter)" disabled>
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
    
    // Add keyboard hints
    const keyboardHints = document.createElement('div');
    keyboardHints.id = 'keyboard-hints';
    keyboardHints.textContent = 'Press Enter for next match, Shift+Enter for previous';
    searchContainer.appendChild(keyboardHints);
    
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
      
      // Get active tab
      const activeTab = document.querySelector('.tab-panel.active');
      if (!activeTab) return;
      
      // Determine which text to search based on options
      let textElements = [];
      
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
      
      // Save all highlights for navigation
      currentHighlights = Array.from(document.querySelectorAll('.search-highlight'));
      
      // Update UI based on results
      if (currentHighlights.length > 0) {
        // Enable next button
        nextButton.disabled = false;
        
        // Navigate to first result
        navigateToResult(0);
      } else {
        // No results found
        resultCount.textContent = 'No matches found';
        
        // For "search across tabs" mode with no results, suggest checking other tabs
        if (searchInCurrentTabOnly && (searchLatin.checked && searchEnglish.checked)) {
          resultCount.textContent = 'No matches in current tab';
          
          // Add suggestion to uncheck "current tab only"
          const mobileNotice = document.createElement('div');
          mobileNotice.className = 'search-mobile-notice';
          mobileNotice.textContent = 'Try unchecking "Current tab only" to search all tabs.';
          
          // Find a place to add this notice
          const searchOptions = document.querySelector('.search-options');
          if (searchOptions && !searchOptions.querySelector('.search-mobile-notice')) {
            searchOptions.appendChild(mobileNotice);
          }
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
      
      // Find the tab that contains this highlight
      const tabPanel = currentHighlight.closest('.tab-panel');
      if (!tabPanel) return;
      
      // Activate the tab if it's not already active
      if (!tabPanel.classList.contains('active')) {
        const tabId = tabPanel.id;
        const tabButton = document.querySelector(`.tab-btn[data-target="${tabId}"]`);
        if (tabButton) {
          tabButton.click();
        }
      }
      
      // Wait a bit for any tab transitions
      setTimeout(() => {
        // Scroll to current highlight with some context
        currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Make the highlight more noticeable
        currentHighlight.animate([
          { boxShadow: '0 0 0 4px rgba(255, 215, 0, 0.7)' },
          { boxShadow: '0 0 0 4px rgba(255, 215, 0, 0)' }
        ], {
          duration: 1000,
          iterations: 2
        });
      }, 100);
    }
    
    // Navigate to next result
    function goToNextResult() {
      if (currentHighlightIndex < currentHighlights.length - 1) {
        navigateToResult(currentHighlightIndex + 1);
      } else if (currentHighlights.length > 0) {
        // Loop back to the first result
        navigateToResult(0);
      }
    }
    
    // Navigate to previous result
    function goToPreviousResult() {
      if (currentHighlightIndex > 0) {
        navigateToResult(currentHighlightIndex - 1);
      } else if (currentHighlights.length > 0) {
        // Loop to the last result
        navigateToResult(currentHighlights.length - 1);
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
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          e.preventDefault();
          // If no search has been performed yet, do the search first
          if (currentHighlights.length === 0) {
            performSearch();
          } else {
            goToPreviousResult();
          }
        } else {
          e.preventDefault();
          // If no search has been performed yet, do the search first
          if (currentHighlights.length === 0) {
            performSearch();
          } else {
            goToNextResult();
          }
        }
      }
    });
    
    prevButton.addEventListener('click', goToPreviousResult);
    nextButton.addEventListener('click', goToNextResult);
    
    // Default "current tab only" based on device
    searchCurrentTab.checked = isMobile || window.innerWidth < 1200;
    
    // Update when tabs change
    document.addEventListener('tabChanged', function(e) {
      if (searchCurrentTab.checked && currentHighlights.length > 0) {
        // Re-run the search when changing tabs with "current tab only" enabled
        performSearch();
      }
    });
    
    // Focus search input when clicking the container
    searchContainer.addEventListener('click', function(e) {
      // Don't focus if clicking on a control
      if (!e.target.closest('button') && !e.target.closest('input')) {
        searchInput.focus();
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
      setTimeout(() => {
        setupSynchronizedScrolling();
      }, 50);
    } else {
      // When switching to other tabs, clean up scrolling
      cleanupSynchronizedScrolling();
    }
  });
  
  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      const isMobileNow = window.innerWidth <= 768;
      const wasMobile = window.innerWidth <= 768;
      
      // If switching between mobile and desktop, reinitialize features
      if (isMobileNow !== wasMobile) {
        searchInitialized = false;
        setupSimpleSearch();
      }
      
      if (document.getElementById('side-by-side').classList.contains('active')) {
        cleanupSynchronizedScrolling();
        setupSynchronizedScrolling();
      }
    }, 250);
  });
});