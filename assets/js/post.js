/**
 * @file Post layout functionality including tab navigation and JSON translation loading.
 * @description Handles tab switching, view toggle within Translation tab, localStorage preferences,
 *              responsive view switching, synchronized scrolling, and dynamic translation content loading.
 * @requires DOM elements: .tab-btn, .tab-panel, .view-toggle-btn, .translation-view, .json-loader
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

  // Set up tab switching
  tabButtons.forEach(function(button) {
    button.addEventListener('click', function() {
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

  // --- View Toggle Setup (within Translation tab) ---
  const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
  const translationViews = document.querySelectorAll('.translation-view');

  viewToggleButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const viewId = 'view-' + this.getAttribute('data-view');

      // Remove active class from all toggle buttons and views
      viewToggleButtons.forEach(function(btn) {
        btn.classList.remove('active');
      });

      translationViews.forEach(function(view) {
        view.classList.remove('active');
      });

      // Add active class to clicked button and target view
      this.classList.add('active');
      const targetView = document.getElementById(viewId);
      if (targetView) {
        targetView.classList.add('active');
      }

      // Save view preference to localStorage
      safeSetItem('preferredView', this.getAttribute('data-view'));
    });
  });

  // Restore saved preferences
  const savedTab = safeGetItem('preferredTab');
  const savedView = safeGetItem('preferredView');
  const isMobile = window.innerWidth <= 768;

  // Restore tab preference
  if (savedTab && document.getElementById(savedTab)) {
    const savedButton = document.querySelector('.tab-btn[data-target="' + savedTab + '"]');
    if (savedButton) {
      savedButton.click();
    }
  }

  // Restore view preference (default to 'english' on mobile if 'both' was saved)
  if (savedView) {
    let viewToRestore = savedView;
    if (isMobile && savedView === 'both') {
      viewToRestore = 'english';
    }
    const savedViewButton = document.querySelector('.view-toggle-btn[data-view="' + viewToRestore + '"]');
    if (savedViewButton) {
      savedViewButton.click();
    }
  } else if (isMobile) {
    // Default to english on mobile if no preference
    const englishButton = document.querySelector('.view-toggle-btn[data-view="english"]');
    if (englishButton) {
      englishButton.click();
    }
  }

  // Handle window resize
  window.addEventListener('resize', function() {
    const isMobileView = window.innerWidth <= 768;
    const activeView = document.querySelector('.translation-view.active');

    // If resizing to mobile and 'both' view is active, switch to 'english'
    if (isMobileView && activeView && activeView.id === 'view-both') {
      const englishButton = document.querySelector('.view-toggle-btn[data-view="english"]');
      if (englishButton) {
        englishButton.click();
      }
    }
  });

  // --- Synchronized Scrolling ---
  const latinColumn = document.querySelector('.latin-column .column-content');
  const englishColumn = document.querySelector('.english-column .column-content');

  if (latinColumn && englishColumn) {
    latinColumn.addEventListener('scroll', function() {
      const scrollPercentage = this.scrollTop / (this.scrollHeight - this.clientHeight);
      englishColumn.scrollTop = scrollPercentage * (englishColumn.scrollHeight - englishColumn.clientHeight);
    });

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
   * Render translation JSON data into appropriate view format.
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

    // Get view type from data attribute, or detect from parent elements
    let viewType = container.getAttribute('data-view-type');

    // Fallback: detect view type from parent elements if attribute is missing
    if (!viewType) {
      const latinColumn = container.closest('.latin-column');
      const englishColumn = container.closest('.english-column');
      const parentView = container.closest('.translation-view');

      if (latinColumn) {
        viewType = 'side-by-side-latin';
      } else if (englishColumn) {
        viewType = 'side-by-side-english';
      } else if (parentView) {
        const viewId = parentView.id;
        if (viewId === 'view-latin') viewType = 'latin-only';
        else if (viewId === 'view-english') viewType = 'english-only';
        else if (viewId === 'view-both') viewType = 'side-by-side-latin'; // fallback
      }
    }

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

    /** Clean English text from SSML tags */
    function cleanEnglishText(text) {
      return text
        .replace(/<speak>/g, '')
        .replace(/<\/speak>/g, '')
        .replace(/<s>/g, '')
        .replace(/<\/s>/g, '')
        .replace(/<p>/g, '<p class="translation-paragraph">')
        .replace(/<break time="\\d+ms"\/>/g, '');
    }

    /** Render Latin chunks */
    function renderLatinChunks(isFullView) {
      json.chunks.forEach(chunk => {
        const chunkNum = getChunkNumber(chunk);
        const chunkEl = document.createElement('div');
        chunkEl.className = isFullView ? 'chunk-section latin-full' : 'chunk-section';
        if (isFullView) chunkEl.id = 'chunk-' + chunkNum;
        chunkEl.dataset.chunk = chunkNum;
        chunkEl.innerHTML = `
          <span class="chunk-number">${chunkNum}</span>
          <div class="latin-text">${getLatinText(chunk).replace(/\n/g, '<br>')}</div>
        `;
        container.appendChild(chunkEl);
      });
    }

    /** Render English chunks */
    function renderEnglishChunks(isFullView) {
      json.chunks.forEach(chunk => {
        const chunkNum = getChunkNumber(chunk);
        const chunkEl = document.createElement('div');
        chunkEl.className = isFullView ? 'chunk-section english-full' : 'chunk-section';
        if (isFullView) chunkEl.id = 'chunk-' + chunkNum;
        chunkEl.dataset.chunk = chunkNum;
        chunkEl.innerHTML = `
          <span class="chunk-number">${chunkNum}</span>
          <div class="english-text">${cleanEnglishText(getEnglishText(chunk))}</div>
        `;
        container.appendChild(chunkEl);
      });
    }

    // Check if json has chunks
    if (json && json.chunks && json.chunks.length > 0) {
      // Process based on view type
      if (viewType === 'latin-only') {
        renderLatinChunks(true);
      } else if (viewType === 'english-only') {
        renderEnglishChunks(true);
      } else if (viewType === 'side-by-side-latin') {
        renderLatinChunks(false);
      } else if (viewType === 'side-by-side-english') {
        renderEnglishChunks(false);
      } else {
        // Fallback: render English by default
        console.warn('Unknown viewType:', viewType, '- defaulting to English');
        renderEnglishChunks(true);
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
   * Switches to Translation tab with English view for better readability.
   */
  function scrollToHashChunk() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#chunk-')) return;

    // Extract chunk number from hash (e.g., "#chunk-5" -> "5")
    const chunkNum = hash.replace('#chunk-', '');
    if (!chunkNum) return;

    // Switch to Translation tab
    const translationTab = document.querySelector('.tab-btn[data-target="translation"]');
    if (translationTab) {
      translationTab.click();
    }

    // Switch to English view for search results (more readable)
    const englishViewBtn = document.querySelector('.view-toggle-btn[data-view="english"]');
    if (englishViewBtn) {
      englishViewBtn.click();
    }

    // Wait for tab/view switch and content to be ready, then scroll
    setTimeout(() => {
      // Find the chunk within the english view
      const englishView = document.getElementById('view-english');
      if (!englishView) return;

      const targetElement = englishView.querySelector(`[data-chunk="${chunkNum}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the chunk briefly
        targetElement.style.transition = 'background-color 0.3s';
        targetElement.style.backgroundColor = 'rgba(184, 134, 11, 0.25)';
        targetElement.style.borderLeft = '4px solid #B8860B';
        setTimeout(() => {
          targetElement.style.backgroundColor = '';
          targetElement.style.borderLeft = '';
        }, 3000);
      }
    }, 500);
  }

  // Also handle hash changes (e.g., clicking internal links)
  window.addEventListener('hashchange', scrollToHashChunk);

  // --- Scroll to Top Button ---
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  if (scrollToTopBtn) {
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    });

    // Scroll to top when clicked
    scrollToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // --- Copy and Download Functions ---
  const copyLatinBtn = document.getElementById('copy-latin-btn');
  const copyEnglishBtn = document.getElementById('copy-english-btn');
  const downloadBtn = document.getElementById('download-btn');

  /** Extract text from all latin-text elements */
  function getLatinText() {
    const latinElements = document.querySelectorAll('.latin-text');
    let text = '';
    latinElements.forEach(function(el, index) {
      if (index > 0) text += '\n\n';
      text += el.textContent.trim();
    });
    return text;
  }

  /** Extract text from all english-text elements */
  function getEnglishText() {
    const englishElements = document.querySelectorAll('.english-text');
    let text = '';
    englishElements.forEach(function(el, index) {
      if (index > 0) text += '\n\n';
      text += el.textContent.trim();
    });
    return text;
  }

  /** Copy text to clipboard with visual feedback */
  function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(function() {
      button.classList.add('copied');
      const originalText = button.querySelector('span').textContent;
      button.querySelector('span').textContent = 'Copied!';
      setTimeout(function() {
        button.classList.remove('copied');
        button.querySelector('span').textContent = originalText;
      }, 2000);
    }).catch(function(err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy text. Please try again.');
    });
  }

  /** Download text as a file */
  function downloadAsFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (copyLatinBtn) {
    copyLatinBtn.addEventListener('click', function() {
      const text = getLatinText();
      if (text) {
        copyToClipboard(text, this);
      } else {
        alert('No Latin text available to copy.');
      }
    });
  }

  if (copyEnglishBtn) {
    copyEnglishBtn.addEventListener('click', function() {
      const text = getEnglishText();
      if (text) {
        copyToClipboard(text, this);
      } else {
        alert('No English text available to copy.');
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      const latinText = getLatinText();
      const englishText = getEnglishText();
      const pageTitle = document.querySelector('.post-title')?.textContent || 'translation';
      const safeTitle = pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      let content = '';
      if (latinText) {
        content += '=== LATIN TEXT ===\n\n' + latinText;
      }
      if (englishText) {
        if (content) content += '\n\n\n';
        content += '=== ENGLISH TRANSLATION ===\n\n' + englishText;
      }

      if (content) {
        downloadAsFile(safeTitle + '.txt', content);
      } else {
        alert('No translation text available to download.');
      }
    });
  }

  /** Generate BibTeX citation */
  function generateBibTeX() {
    const d = window.citationData;
    if (!d) return '';
    const citeKey = 'bibliothecarius' + d.year + d.latinTitle.replace(/[^a-zA-Z]/g, '').substring(0, 20);
    let bibtex = `@misc{${citeKey},
  title = {${d.latinTitle}},
  editor = {Wolfslayer, Ryan},
  year = {${d.year}},
  month = {${d.month}},
  url = {${d.doi ? 'https://doi.org/' + d.doi : d.url}},
`;
    if (d.doi) {
      bibtex += `  doi = {${d.doi}},\n`;
    }
    bibtex += `  note = {AI-assisted translation using ${d.aiModel}. Original work by ${d.author} (${d.originalDate}). Source: ${d.publication}},
  howpublished = {Bibliothecarius Modernus}
}`;
    return bibtex;
  }

  /** Generate RIS citation */
  function generateRIS() {
    const d = window.citationData;
    if (!d) return '';
    const lines = [
      'TY  - ELEC',
      'ED  - Wolfslayer, Ryan',
      'TI  - ' + d.latinTitle,
      'T2  - Bibliothecarius Modernus',
      'PY  - ' + d.year,
      'DA  - ' + d.isoDate.replace(/-/g, '/'),
      d.doi ? 'DO  - ' + d.doi : null,
      'UR  - ' + (d.doi ? 'https://doi.org/' + d.doi : d.url),
      'N1  - AI-assisted translation using ' + d.aiModel + '. Original work by ' + d.author + ' (' + d.originalDate + '). Source: ' + d.publication,
      'ER  - '
    ].filter(Boolean);
    return lines.join('\n');
  }

  /** BibTeX export button */
  document.getElementById('export-bibtex')?.addEventListener('click', function() {
    if (!window.citationData) {
      alert('Citation data not available.');
      return;
    }
    const safeTitle = window.citationData.latinTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadAsFile(safeTitle + '.bib', generateBibTeX());
  });

  /** RIS export button */
  document.getElementById('export-ris')?.addEventListener('click', function() {
    if (!window.citationData) {
      alert('Citation data not available.');
      return;
    }
    const safeTitle = window.citationData.latinTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadAsFile(safeTitle + '.ris', generateRIS());
  });
});
