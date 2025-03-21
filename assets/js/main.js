// Main JavaScript file for Bibliothecarius Modernus

document.addEventListener('DOMContentLoaded', function() {
  // YouTube Thumbnail Click Handler
  const youtubeThumbnails = document.querySelectorAll('.youtube-thumbnail-container');
  
  youtubeThumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function(e) {
      // Find the closest post item to get its link
      const listItem = this.closest('li');
      if (listItem) {
        const postLink = listItem.querySelector('.post-link').getAttribute('href');
        if (postLink) {
          window.location.href = postLink;
        }
      }
    });
    
    // Make the thumbnail look clickable
    thumbnail.style.cursor = 'pointer';
  });

  // Tab Functionality
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabButtons.length > 0) {
    console.log('Tab functionality initialized: Found ' + tabButtons.length + ' tabs');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        console.log('Tab clicked: ' + this.getAttribute('data-tab'));
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // Save user preference to localStorage
        localStorage.setItem('preferredTab', tabId);
      });
    });
    
    // Check if user has a preferred tab
    const preferredTab = localStorage.getItem('preferredTab');
    if (preferredTab) {
      const preferredButton = document.querySelector(`.tab-button[data-tab="${preferredTab}"]`);
      if (preferredButton) {
        preferredButton.click();
      }
    }
  }

  // Interactive features for interlinear view
  if (document.getElementById('interlinear')) {
    const interlinearLines = document.querySelectorAll('.interlinear-line');
    interlinearLines.forEach(line => {
      line.addEventListener('mouseenter', function() {
        this.classList.add('highlighted');
      });
      line.addEventListener('mouseleave', function() {
        this.classList.remove('highlighted');
      });
    });
  }
  
  // Synchronize scrolling in parallel view
  if (document.getElementById('parallel')) {
    const latinColumn = document.querySelector('.latin-column');
    const englishColumn = document.querySelector('.english-column');
    
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
  }

  // Add smooth scrolling to all links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if(href !== "#") {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
});