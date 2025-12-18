/**
 * @file Post layout functionality including tab navigation and JSON translation loading.
 * @description Handles tab switching, localStorage preferences, responsive view switching,
 *              synchronized scrolling, and dynamic translation content loading.
 * @requires DOM elements: .tab-btn, .tab-panel, .json-loader
 */
document.addEventListener('DOMContentLoaded', function() {
  // --- localStorage Helpers (Safari private browsing throws) ---
  function safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Silent fail - preference won't persist but site works
    }
  }

  // --- Tab Navigation Setup ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Mobile navigation buttons
  const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
  mobileNavButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      document.querySelector('.tab-btn[data-target="' + targetId + '"]').click();
    });
  });

  // Set up tab switching
  tabButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      // Get target panel id
      const targetId = this.getAttribute('data-target');

      // Remove active class from all buttons and panels
      tabButtons.forEach(function(btn) {
        btn.classList.remove('active');
      });

      tabPanels.forEach(function(panel) {
        panel.classList.remove('active');
      });

      // Add active class to clicked button and target panel
      this.classList.add('active');
      document.getElementById(targetId).classList.add('active');

      // Save preference to localStorage
      safeSetItem('preferredTab', targetId);
    });
  });

  // Check for saved preference
  const savedTab = safeGetItem('preferredTab');

  // Don't restore side-by-side view on mobile
  const isMobile = window.innerWidth <= 768;
  if (savedTab && document.getElementById(savedTab)) {
    if (!(isMobile && savedTab === 'side-by-side')) {
      // Find the button for this tab
      const savedButton = document.querySelector('.tab-btn[data-target="' + savedTab + '"]');
      if (savedButton) {
        savedButton.click();
      }
    } else {
      // If we're on mobile and the saved tab is side-by-side, default to analysis
      const analysisButton = document.querySelector('.tab-btn[data-target="analysis"]');
      if (analysisButton) {
        analysisButton.click();
      }
    }
  }

  // Handle window resize to switch views if needed
  window.addEventListener('resize', function() {
    const activeTabPanel = document.querySelector('.tab-panel.active');
    if (!activeTabPanel) return;

    const currentActiveTab = activeTabPanel.id;
    const isMobileView = window.innerWidth <= 768;

    // If resizing to mobile view and side-by-side is active, switch to analysis
    if (isMobileView && currentActiveTab === 'side-by-side') {
      const analysisButton = document.querySelector('.tab-btn[data-target="analysis"]');
      if (analysisButton) {
        analysisButton.click();
      }
    }

    // Toggle visibility of side-by-side tab based on screen size
    const sideBySideTab = document.querySelector('.side-by-side-tab');
    if (sideBySideTab) {
      sideBySideTab.style.display = isMobileView ? 'none' : 'block';
    }
  });

  // --- Synchronized Scrolling ---
  const latinColumn = document.querySelector('.latin-column .column-content');
  const englishColumn = document.querySelector('.english-column .column-content');

  if (latinColumn && englishColumn) {
    // When scrolling latin column
    latinColumn.addEventListener('scroll', function() {
      const scrollPercentage = this.scrollTop / (this.scrollHeight - this.clientHeight);
      englishColumn.scrollTop = scrollPercentage * (englishColumn.scrollHeight - englishColumn.clientHeight);
    });

    // When scrolling english column
    englishColumn.addEventListener('scroll', function() {
      const scrollPercentage = this.scrollTop / (this.scrollHeight - this.clientHeight);
      latinColumn.scrollTop = scrollPercentage * (latinColumn.scrollHeight - latinColumn.clientHeight);
    });
  }

  // --- JSON Translation Loading ---
  const jsonLoaders = document.querySelectorAll('.json-loader');
  if (jsonLoaders.length > 0) {
    jsonLoaders.forEach(function(loader) {
      const jsonPath = loader.getAttribute('data-json-path');
      if (jsonPath) {
        fetch(jsonPath)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            // Process the loaded JSON
            processTranslationJson(data, loader);
          })
          .catch(error => {
            console.error('Error loading JSON:', error);
            loader.innerHTML = '<p class="placeholder">Error loading translation data.</p>';
          });
      }
    });
  }

  /**
   * Render translation JSON data into appropriate tab panel format.
   *
   * Expected JSON structure:
   * {
   *   chunks: [{
   *     chunk_number: string,      // or chunk_id in old format
   *     original_latin: string,    // or latin in old format
   *     cleaned_english_translation: string  // or english in old format
   *   }]
   * }
   *
   * @param {Object} json - Translation data with chunks array
   * @param {HTMLElement} container - Target container for rendered content
   */
  function processTranslationJson(json, container) {
    // Clear loading placeholders
    container.innerHTML = '';

    // Get parent tab type
    const parentTab = container.closest('.tab-panel');
    const tabType = parentTab ? parentTab.id : null;

    /** Extract chunk number from either old or new JSON format */
    function getChunkNumber(chunk) {
      return chunk.chunk_number || chunk.chunk_id || '';
    }

    /** Extract Latin text from either old or new JSON format */
    function getLatinText(chunk) {
      return chunk.original_latin || chunk.latin || '';
    }

    /** Extract English text from either old or new JSON format */
    function getEnglishText(chunk) {
      return chunk.cleaned_english_translation || chunk.english || '';
    }

    // Check if json has chunks
    if (json && json.chunks && json.chunks.length > 0) {
      // Process based on tab type
      if (tabType === 'latin-only') {
        // Latin only view
        json.chunks.forEach(chunk => {
          const chunkNum = getChunkNumber(chunk);
          const chunkEl = document.createElement('div');
          chunkEl.className = 'chunk-section latin-full';
          chunkEl.id = `chunk-${chunkNum}`;
          chunkEl.innerHTML = `
            <span class="chunk-number">${chunkNum}</span>
            <div class="latin-text">${getLatinText(chunk).replace(/\n/g, '<br>')}</div>
          `;
          container.appendChild(chunkEl);
        });
      } else if (tabType === 'english-only') {
        // English only view
        json.chunks.forEach(chunk => {
          const chunkNum = getChunkNumber(chunk);
          const chunkEl = document.createElement('div');
          chunkEl.className = 'chunk-section english-full';
          chunkEl.id = `chunk-${chunkNum}`;

          // Clean the text
          let cleanedText = getEnglishText(chunk)
            .replace(/<speak>/g, '')
            .replace(/<\/speak>/g, '')
            .replace(/<s>/g, '')
            .replace(/<\/s>/g, '')
            .replace(/<p>/g, '<p class="translation-paragraph">')
            .replace(/<break time="\\d+ms"\/>/g, '');

          chunkEl.innerHTML = `
            <span class="chunk-number">${chunkNum}</span>
            <div class="english-text">${cleanedText}</div>
          `;
          container.appendChild(chunkEl);
        });
      } else if (tabType === 'side-by-side') {
        // We need to find which column we're in
        const latinColumn = container.closest('.latin-column');
        const englishColumn = container.closest('.english-column');

        if (latinColumn) {
          // Latin column in side-by-side view (IDs go here to avoid duplicates)
          json.chunks.forEach(chunk => {
            const chunkNum = getChunkNumber(chunk);
            const chunkEl = document.createElement('div');
            chunkEl.className = 'chunk-section';
            chunkEl.id = `chunk-${chunkNum}`;
            chunkEl.innerHTML = `
              <span class="chunk-number">${chunkNum}</span>
              <div class="latin-text">${getLatinText(chunk).replace(/\n/g, '<br>')}</div>
            `;
            container.appendChild(chunkEl);
          });
        } else if (englishColumn) {
          // English column in side-by-side view
          json.chunks.forEach(chunk => {
            const chunkNum = getChunkNumber(chunk);
            const chunkEl = document.createElement('div');
            chunkEl.className = 'chunk-section';
            chunkEl.dataset.chunk = chunkNum; // Use data attribute to avoid duplicate IDs

            // Clean the text
            let cleanedText = getEnglishText(chunk)
              .replace(/<speak>/g, '')
              .replace(/<\/speak>/g, '')
              .replace(/<s>/g, '')
              .replace(/<\/s>/g, '')
              .replace(/<p>/g, '<p class="translation-paragraph">')
              .replace(/<break time="\\d+ms"\/>/g, '');

            chunkEl.innerHTML = `
              <span class="chunk-number">${chunkNum}</span>
              <div class="english-text">${cleanedText}</div>
            `;
            container.appendChild(chunkEl);
          });
        }
      }
    } else {
      // No chunks found
      container.innerHTML = '<p class="placeholder">Translation data could not be loaded properly.</p>';
    }

    // After loading, check if we need to scroll to a specific chunk
    scrollToHashChunk();
  }

  /**
   * Scroll to a specific chunk if the URL contains a hash like #chunk-5.
   * Switches to English-only tab for better readability.
   */
  function scrollToHashChunk() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#chunk-')) return;

    const chunkId = hash.substring(1); // Remove the #
    const targetElement = document.getElementById(chunkId);

    if (targetElement) {
      // Switch to English-only tab for search results (more readable)
      const englishTab = document.querySelector('.tab-btn[data-target="english-only"]');
      if (englishTab) {
        englishTab.click();
      }

      // Wait for tab switch, then scroll
      setTimeout(() => {
        // Try to find the element again in case tab switch created new elements
        const element = document.getElementById(chunkId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the chunk briefly
          element.style.transition = 'background-color 0.3s';
          element.style.backgroundColor = 'rgba(184, 134, 11, 0.2)';
          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 2000);
        }
      }, 300);
    }
  }

  // Also handle hash changes (e.g., clicking internal links)
  window.addEventListener('hashchange', scrollToHashChunk);
});
