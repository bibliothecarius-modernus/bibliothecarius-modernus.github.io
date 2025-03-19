// Format images in post content
document.addEventListener('DOMContentLoaded', function() {
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;
    
    // Find all paragraph elements that only contain an image
    const imageParagraphs = Array.from(postContent.querySelectorAll('p')).filter(p => {
      return p.childNodes.length === 1 && 
             (p.firstChild.nodeName === 'IMG' || 
              (p.firstChild.nodeName === '#text' && p.firstChild.textContent.trim().startsWith('![')));
    });
    
    // Process each image paragraph
    imageParagraphs.forEach(p => {
      let img, caption;
      
      // If it's a markdown image that hasn't been converted to an img tag
      if (p.firstChild.nodeName === '#text' && p.firstChild.textContent.trim().startsWith('![')) {
        const text = p.firstChild.textContent.trim();
        const altMatch = text.match(/!\[(.*?)\]/);
        const srcMatch = text.match(/\((.*?)\)/);
        
        if (altMatch && srcMatch) {
          const alt = altMatch[1];
          const src = srcMatch[1];
          
          // Create the image element
          img = document.createElement('img');
          img.src = src;
          img.alt = alt;
          img.className = 'markdown-image';
          
          // Check for caption (text after the image markdown)
          const captionMatch = text.match(/\)(.+)$/);
          if (captionMatch) {
            caption = captionMatch[1].trim();
          }
        }
      }
      // Regular img tag
      else if (p.firstChild.nodeName === 'IMG') {
        img = p.firstChild;
        img.className = 'markdown-image';
        
        // Check next sibling for potential caption text
        if (p.nextElementSibling && p.nextElementSibling.textContent.trim().startsWith('*') && 
            p.nextElementSibling.textContent.trim().endsWith('*')) {
          caption = p.nextElementSibling.textContent.trim().replace(/^\*|\*$/g, '');
          p.nextElementSibling.remove();
        }
      }
      
      if (img) {
        // Create figure element
        const figure = document.createElement('figure');
        figure.className = 'content-image';
        
        // Add image to figure
        figure.appendChild(img);
        
        // Add caption if exists
        if (caption) {
          const figcaption = document.createElement('figcaption');
          figcaption.textContent = caption;
          figure.appendChild(figcaption);
        }
        
        // Replace paragraph with figure
        p.parentNode.replaceChild(figure, p);
      }
    });
    
    // Handle images with links
    const linkedImages = postContent.querySelectorAll('a > img');
    linkedImages.forEach(img => {
      const link = img.parentNode;
      if (link.childNodes.length === 1) {
        img.className = 'markdown-image';
        
        const figure = document.createElement('figure');
        figure.className = 'content-image';
        
        // Move the link inside the figure
        link.parentNode.replaceChild(figure, link);
        figure.appendChild(link);
      }
    });
  });