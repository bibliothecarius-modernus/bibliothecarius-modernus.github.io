// Combined main.js with YouTube thumbnails and tab functionality

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
  const setupTabs = function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0) {
      return; // No tabs on this page
    }
    
    console.log('Setting up tabs - found ' + tabButtons.length + ' tab buttons');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        console.log('Tab clicked: ' + this.getAttribute('data-tab'));
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        const tabContent = document.getElementById(tabId);
        
        if (tabContent) {
          tabContent.classList.add('active');
        } else {
          console.error('Tab content with id "' + tabId + '" not found');
        }
        
        // Save user preference to localStorage
        localStorage.setItem('preferredTab', tabId);
      });
    });
    
    // Check if user has a preferred tab
    const preferredTab = localStorage.getItem('preferredTab');
    if (preferredTab) {
      const preferredButton = document.querySelector('.tab-button[data-tab="' + preferredTab + '"]');
      if (preferredButton) {
        preferredButton.click();
      }
    }
  };
  
  // Run the tab setup
  setupTabs();
  
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