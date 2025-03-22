// File: assets/js/drive-loader.js

/**
 * Google Drive Content Loader
 * This script handles loading content from Google Drive for our Latin translations
 * Enhanced with mobile-friendly functionality
 */

const DriveLoader = {
    // Cache for loaded content to prevent redundant requests
    cache: {},
    
    /**
     * Initialize the Drive Loader
     */
    init: function() {
      console.log('Drive Loader initialized');
      this.bindEvents();
      this.checkMobileView();
    },
    
    /**
     * Check if we're in mobile view and adjust accordingly
     */
    checkMobileView: function() {
      const isMobile = window.innerWidth <= 768;
      const sideBySideTab = document.querySelector('.side-by-side-tab');
      
      if (sideBySideTab) {
        sideBySideTab.style.display = isMobile ? 'none' : 'block';
      }
      
      // Add resize listener if not already added
      if (!this.resizeListenerAdded) {
        window.addEventListener('resize', this.handleResize.bind(this));
        this.resizeListenerAdded = true;
      }
    },
    
    /**
     * Handle window resize events
     */
    handleResize: function() {
      this.checkMobileView();
      
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const activeTab = document.querySelector('.tab-panel.active');
        if (activeTab && activeTab.id === 'side-by-side') {
          // Switch to analysis view on mobile if side-by-side is active
          const analysisBtn = document.querySelector('.tab-btn[data-target="analysis"]');
          if (analysisBtn) analysisBtn.click();
        }
      }
    },
    
    /**
     * Bind events for dynamic loading
     */
    bindEvents: function() {
      // Listen for tab changes to lazy load content when needed
      document.addEventListener('tabChanged', function(e) {
        const tabId = e.detail.tabId;
        if (tabId === 'side-by-side' || tabId === 'latin-only' || tabId === 'english-only') {
          DriveLoader.loadTranslationData();
        }
      });
      
      // Setup audio player with dynamic loading
      const audioDetails = document.querySelector('.audio-player-container details');
      if (audioDetails) {
        audioDetails.addEventListener('toggle', function() {
          if (this.open && !this.dataset.loaded) {
            DriveLoader.loadAudioFile();
            this.dataset.loaded = 'true';
          }
        });
      }
      
      // Handle mobile navigation buttons
      const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
      mobileNavButtons.forEach(function(button) {
        button.addEventListener('click', function() {
          const targetId = this.getAttribute('data-target');
          DriveLoader.loadTranslationData(); // Ensure data is loaded when using mobile navigation
        });
      });
    },
    
    /**
     * Load translation JSON data from Google Drive
     */
    loadTranslationData: function() {
      const translationContainer = document.getElementById('translation-viewer');
      if (!translationContainer || translationContainer.dataset.loaded === 'true') return;
      
      const driveFileId = translationContainer.dataset.driveJson;
      if (!driveFileId) return;
      
      if (this.cache[driveFileId]) {
        this.processTranslationData(this.cache[driveFileId]);
        return;
      }
      
      const loadingIndicator = this.showLoadingIndicator(translationContainer);
      
      fetch(`https://drive.google.com/uc?export=download&id=${driveFileId}`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load translation data');
          return response.json();
        })
        .then(data => {
          this.cache[driveFileId] = data;
          this.processTranslationData(data);
          translationContainer.dataset.loaded = 'true';
          this.hideLoadingIndicator(loadingIndicator);
        })
        .catch(error => {
          console.error('Error loading translation data:', error);
          this.showErrorMessage(translationContainer, 'Failed to load translation data. Please try again later.');
          this.hideLoadingIndicator(loadingIndicator);
        });
    },
    
    /**
     * Process the translation data and populate the UI
     */
    processTranslationData: function(data) {
      if (!data || !data.chunks) return;
      
      // Clear existing content
      const latinColumn = document.querySelector('.latin-column .column-content');
      const englishColumn = document.querySelector('.english-column .column-content');
      const latinOnly = document.querySelector('#latin-only .single-column');
      const englishOnly = document.querySelector('#english-only .single-column');
      
      if (latinColumn) latinColumn.innerHTML = '';
      if (englishColumn) englishColumn.innerHTML = '';
      if (latinOnly) latinOnly.innerHTML = '<h3>Latin Original</h3>';
      if (englishOnly) englishOnly.innerHTML = '<h3>English Translation</h3>';
      
      // Populate with chunks
      data.chunks.forEach(chunk => {
        // Side by side view
        if (latinColumn) {
          const latinSection = this.createChunkSection(chunk, 'latin');
          latinColumn.appendChild(latinSection);
        }
        
        if (englishColumn) {
          const englishSection = this.createChunkSection(chunk, 'english');
          englishColumn.appendChild(englishSection);
        }
        
        // Single column views
        if (latinOnly) {
          const latinFullSection = this.createChunkSection(chunk, 'latin-full');
          latinOnly.appendChild(latinFullSection);
        }
        
        if (englishOnly) {
          const englishFullSection = this.createChunkSection(chunk, 'english-full');
          englishOnly.appendChild(englishFullSection);
        }
      });
      
      // Setup synchronized scrolling
      this.setupSyncedScrolling();
      
      // Update tab status indicators
      this.updateTabStatusIndicators();
    },
    
    /**
     * Update the tab status indicators to show loaded state
     */
    updateTabStatusIndicators: function() {
      const tabs = document.querySelectorAll('.tab-btn');
      tabs.forEach(tab => {
        const targetId = tab.getAttribute('data-target');
        if (targetId === 'side-by-side' || targetId === 'latin-only' || targetId === 'english-only') {
          tab.setAttribute('data-status', 'loaded');
          tab.classList.remove('loading');
        }
      });
    },
    
    /**
     * Create a chunk section element
     */
    createChunkSection: function(chunk, type) {
      const section = document.createElement('div');
      section.className = `chunk-section ${type}`;
      
      const chunkNumber = document.createElement('span');
      chunkNumber.className = 'chunk-number';
      chunkNumber.textContent = chunk.chunk_number;
      section.appendChild(chunkNumber);
      
      const textDiv = document.createElement('div');
      
      if (type === 'latin' || type === 'latin-full') {
        textDiv.className = 'latin-text';
        textDiv.innerHTML = chunk.original_latin.replace(/\n/g, '<br>');
      } else {
        textDiv.className = 'english-text';
        let cleanedText = chunk.cleaned_english_translation
          .replace(/<speak>/g, '')
          .replace(/<\/speak>/g, '')
          .replace(/<s>/g, '')
          .replace(/<\/s>/g, '')
          .replace(/<p>/g, '<p class="translation-paragraph">')
          .replace(/<break time="[^"]*"\/>/g, '');
        
        textDiv.innerHTML = cleanedText;
      }
      
      section.appendChild(textDiv);
      return section;
    },
    
    /**
     * Load audio file from Google Drive
     */
    loadAudioFile: function() {
      const audioPlayer = document.querySelector('.audio-player audio');
      if (!audioPlayer || audioPlayer.dataset.loaded === 'true') return;
      
      const driveFileId = audioPlayer.dataset.driveAudio;
      if (!driveFileId) return;
      
      const loadingIndicator = this.showLoadingIndicator(audioPlayer.parentElement);
      
      // Update audio source to direct Google Drive streaming link
      audioPlayer.src = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
      audioPlayer.dataset.loaded = 'true';
      
      audioPlayer.addEventListener('canplay', () => {
        this.hideLoadingIndicator(loadingIndicator);
      });
      
      audioPlayer.addEventListener('error', () => {
        this.showErrorMessage(audioPlayer.parentElement, 'Failed to load audio. Please try again later.');
        this.hideLoadingIndicator(loadingIndicator);
      });
    },
    
    /**
     * Setup synchronized scrolling for side-by-side view
     */
    setupSyncedScrolling: function() {
      const latinColumn = document.querySelector('.latin-column .column-content');
      const englishColumn = document.querySelector('.english-column .column-content');
      
      if (!latinColumn || !englishColumn) return;
      
      // Remove any existing listeners
      latinColumn.onscroll = null;
      englishColumn.onscroll = null;
      
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
    },
    
    /**
     * Show loading indicator
     */
    showLoadingIndicator: function(container) {
      const loader = document.createElement('div');
      loader.className = 'drive-loading-indicator';
      loader.innerHTML = `
        <div class="loader-spinner"></div>
        <div class="loader-text">Loading content...</div>
      `;
      container.appendChild(loader);
      return loader;
    },
    
    /**
     * Hide loading indicator
     */
    hideLoadingIndicator: function(loader) {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    },
    
    /**
     * Show error message
     */
    showErrorMessage: function(container, message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'drive-error-message';
      errorDiv.textContent = message;
      container.appendChild(errorDiv);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
    }
  };
  
  // Initialize when document is loaded
  document.addEventListener('DOMContentLoaded', function() {
    DriveLoader.init();
  });