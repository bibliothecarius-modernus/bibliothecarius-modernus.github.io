document.addEventListener('DOMContentLoaded', function() {
  console.log("Enhanced translation view initialized");
  
  // Tab functionality with improved transitions
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabButtons.length > 0) {
    console.log('Tab functionality initialized: Found ' + tabButtons.length + ' tabs');
    
    // Set up tab click handlers with visual feedback
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        console.log('Tab clicked: ' + tabId);
        
        // Visual feedback on click
        button.classList.add('button-clicked');
        setTimeout(() => {
          button.classList.remove('button-clicked');
        }, 300);
        
        // Hide all tabs with smooth transition
        tabContents.forEach(content => {
          content.style.display = 'none';
          content.classList.remove('active');
        });
        
        // Remove active class from all buttons
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Show selected tab with animation
        const selectedTab = document.getElementById(tabId);
        selectedTab.style.display = 'block';
        
        // Trigger reflow to ensure animation plays
        void selectedTab.offsetWidth;
        
        selectedTab.classList.add('active');
        this.classList.add('active');
        
        // Save user preference
        localStorage.setItem('preferredTab', tabId);
      });
    });
    
    // Check for saved tab preference
    const savedTab = localStorage.getItem('preferredTab');
    if (savedTab && document.getElementById(savedTab)) {
      const savedButton = document.querySelector(`.tab-button[data-tab="${savedTab}"]`);
      if (savedButton) {
        savedButton.click();
      } else {
        // Default to first tab if saved preference is invalid
        tabButtons[0].click();
      }
    } else {
      // Default to first tab (analysis)
      tabButtons[0].click();
    }
  }
  
  // Enhanced interlinear view functionality
  if (document.getElementById('interlinear')) {
    const latinLines = document.querySelectorAll('.latin-line');
    const englishLines = document.querySelectorAll('.english-line');
    
    // Make each Latin line interactive
    latinLines.forEach((line, index) => {
      // Add hover effect
      line.addEventListener('mouseenter', function() {
        this.classList.add('active-line');
        if (englishLines[index]) {
          englishLines[index].classList.add('active-line');
        }
      });
      
      line.addEventListener('mouseleave', function() {
        this.classList.remove('active-line');
        if (englishLines[index]) {
          englishLines[index].classList.remove('active-line');
        }
      });
      
      // Add click to highlight
      line.addEventListener('click', function() {
        // Remove highlight from all lines
        latinLines.forEach(l => l.classList.remove('highlight-line'));
        englishLines.forEach(l => l.classList.remove('highlight-line'));
        
        // Add highlight to clicked pair
        this.classList.add('highlight-line');
        if (englishLines[index]) {
          englishLines[index].classList.add('highlight-line');
        }
      });
    });
    
    // Do the same for English lines
    englishLines.forEach((line, index) => {
      line.addEventListener('mouseenter', function() {
        this.classList.add('active-line');
        if (latinLines[index]) {
          latinLines[index].classList.add('active-line');
        }
      });
      
      line.addEventListener('mouseleave', function() {
        this.classList.remove('active-line');
        if (latinLines[index]) {
          latinLines[index].classList.remove('active-line');
        }
      });
      
      line.addEventListener('click', function() {
        latinLines.forEach(l => l.classList.remove('highlight-line'));
        englishLines.forEach(l => l.classList.remove('highlight-line'));
        
        this.classList.add('highlight-line');
        if (latinLines[index]) {
          latinLines[index].classList.add('highlight-line');
        }
      });
    });
  }
  
  // Section navigation
  const sectionLinks = document.querySelectorAll('.section-link');
  sectionLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Ensure correct tab is open first
        const tabId = targetElement.closest('.tab-content').id;
        document.querySelector(`.tab-button[data-tab="${tabId}"]`).click();
        
        // Then scroll to element with smooth animation
        setTimeout(() => {
          targetElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          
          // Highlight the target section briefly
          targetElement.classList.add('highlight-section');
          setTimeout(() => {
            targetElement.classList.remove('highlight-section');
          }, 2000);
        }, 300); // Small delay to ensure tab has transitioned
      }
    });
  });
  
  // Enhance section indicators with tooltips
  const sectionIndicators = document.querySelectorAll('.section-indicator');
  sectionIndicators.forEach(indicator => {
    const tooltip = document.createElement('span');
    tooltip.className = 'section-tooltip';
    tooltip.textContent = 'Jump to corresponding translation';
    indicator.appendChild(tooltip);
    
    indicator.addEventListener('click', function() {
      const sectionNumber = this.textContent.replace('Section ', '');
      const currentTab = this.closest('.tab-content').id;
      
      // Determine which tab to switch to
      let targetTab;
      let targetSection;
      
      if (currentTab === 'latin') {
        targetTab = 'english';
        targetSection = document.getElementById(`english-section-${sectionNumber}`);
      } else if (currentTab === 'english') {
        targetTab = 'latin';
        targetSection = document.getElementById(`latin-section-${sectionNumber}`);
      }
      
      if (targetTab && targetSection) {
        // Switch tabs and highlight section
        document.querySelector(`.tab-button[data-tab="${targetTab}"]`).click();
        
        setTimeout(() => {
          targetSection.scrollIntoView({ behavior: 'smooth' });
          targetSection.classList.add('highlight-section');
          setTimeout(() => {
            targetSection.classList.remove('highlight-section');
          }, 2000);
        }, 300);
      }
    });
  });
  
  // Additional animation for smooth content transitions
  const contentSections = document.querySelectorAll('.latin-chunk, .english-chunk, .interlinear-chunk');
  
  // Set up intersection observer for fade-in effects
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });
    
    contentSections.forEach(section => {
      section.classList.add('fade-in-section');
      observer.observe(section);
    });
  }
  
  // Create true interlinear view for Latin lines
  if (document.getElementById('interlinear')) {
    const interlinearPairs = document.querySelectorAll('.interlinear-pair');
    
    interlinearPairs.forEach(pair => {
      const latinLine = pair.querySelector('.latin-line');
      
      if (latinLine && latinLine.textContent.trim() !== '') {
        // Create a simplified English translation line that shows next to the Latin
        const englishHint = document.createElement('div');
        englishHint.className = 'english-hint';
        englishHint.innerHTML = `<div class="hint-content">View translation in full section below</div>`;
        
        // Add connection arrow between Latin and English
        const connector = document.createElement('div');
        connector.className = 'latin-english-connector';
        
        // Add elements to the interlinear pair
        pair.appendChild(connector);
        pair.appendChild(englishHint);
      }
    });
  }
  
  // Add keyboard navigation for tabs
  document.addEventListener('keydown', function(e) {
    // Only process if not in an input field
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      const activeTab = document.querySelector('.tab-button.active');
      
      if (activeTab) {
        const tabs = Array.from(document.querySelectorAll('.tab-button'));
        const currentIndex = tabs.indexOf(activeTab);
        
        // Right arrow or Tab key
        if ((e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) && currentIndex < tabs.length - 1) {
          e.preventDefault();
          tabs[currentIndex + 1].click();
        }
        
        // Left arrow or Shift+Tab key
        if ((e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) && currentIndex > 0) {
          e.preventDefault();
          tabs[currentIndex - 1].click();
        }
      }
    }
  });});