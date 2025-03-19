// YouTube Thumbnail Click Handler
document.addEventListener('DOMContentLoaded', function() {
    // Get all YouTube thumbnails
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
  });