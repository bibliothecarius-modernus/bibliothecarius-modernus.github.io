// Post Layout JavaScript - Tab functionality and JSON loading
document.addEventListener('DOMContentLoaded', function() {
  // Get all tab buttons and panels
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
      localStorage.setItem('preferredTab', targetId);
    });
  });

  // Check for saved preference
  const savedTab = localStorage.getItem('preferredTab');

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
    const currentActiveTab = document.querySelector('.tab-panel.active').id;
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

  // Set up synchronized scrolling for side-by-side view
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

  // Load JSON files from assets if needed
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

  // Function to process translation JSON and create content
  function processTranslationJson(json, container) {
    // Clear loading placeholders
    container.innerHTML = '';

    // Get parent tab type
    const parentTab = container.closest('.tab-panel');
    const tabType = parentTab ? parentTab.id : null;

    // Helper function to get chunk number (supports both old and new format)
    function getChunkNumber(chunk) {
      return chunk.chunk_number || chunk.chunk_id || '';
    }

    // Helper function to get Latin text (supports both old and new format)
    function getLatinText(chunk) {
      return chunk.original_latin || chunk.latin || '';
    }

    // Helper function to get English text (supports both old and new format)
    function getEnglishText(chunk) {
      return chunk.cleaned_english_translation || chunk.english || '';
    }

    // Check if json has chunks
    if (json && json.chunks && json.chunks.length > 0) {
      // Process based on tab type
      if (tabType === 'latin-only') {
        // Latin only view
        json.chunks.forEach(chunk => {
          const chunkEl = document.createElement('div');
          chunkEl.className = 'chunk-section latin-full';
          chunkEl.innerHTML = `
            <span class="chunk-number">${getChunkNumber(chunk)}</span>
            <div class="latin-text">${getLatinText(chunk).replace(/\n/g, '<br>')}</div>
          `;
          container.appendChild(chunkEl);
        });
      } else if (tabType === 'english-only') {
        // English only view
        json.chunks.forEach(chunk => {
          const chunkEl = document.createElement('div');
          chunkEl.className = 'chunk-section english-full';

          // Clean the text
          let cleanedText = getEnglishText(chunk)
            .replace(/<speak>/g, '')
            .replace(/<\/speak>/g, '')
            .replace(/<s>/g, '')
            .replace(/<\/s>/g, '')
            .replace(/<p>/g, '<p class="translation-paragraph">')
            .replace(/<break time="\\d+ms"\/>/g, '');

          chunkEl.innerHTML = `
            <span class="chunk-number">${getChunkNumber(chunk)}</span>
            <div class="english-text">${cleanedText}</div>
          `;
          container.appendChild(chunkEl);
        });
      } else if (tabType === 'side-by-side') {
        // We need to find which column we're in
        const latinColumn = container.closest('.latin-column');
        const englishColumn = container.closest('.english-column');

        if (latinColumn) {
          // Latin column in side-by-side view
          json.chunks.forEach(chunk => {
            const chunkEl = document.createElement('div');
            chunkEl.className = 'chunk-section';
            chunkEl.innerHTML = `
              <span class="chunk-number">${getChunkNumber(chunk)}</span>
              <div class="latin-text">${getLatinText(chunk).replace(/\n/g, '<br>')}</div>
            `;
            container.appendChild(chunkEl);
          });
        } else if (englishColumn) {
          // English column in side-by-side view
          json.chunks.forEach(chunk => {
            const chunkEl = document.createElement('div');
            chunkEl.className = 'chunk-section';

            // Clean the text
            let cleanedText = getEnglishText(chunk)
              .replace(/<speak>/g, '')
              .replace(/<\/speak>/g, '')
              .replace(/<s>/g, '')
              .replace(/<\/s>/g, '')
              .replace(/<p>/g, '<p class="translation-paragraph">')
              .replace(/<break time="\\d+ms"\/>/g, '');

            chunkEl.innerHTML = `
              <span class="chunk-number">${getChunkNumber(chunk)}</span>
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
  }
});
