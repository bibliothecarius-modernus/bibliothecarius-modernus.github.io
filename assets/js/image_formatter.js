// Enhanced image formatter to handle various image formats
document.addEventListener('DOMContentLoaded', function() {
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;
    
    // Process all links that might be images
    const potentialImageLinks = postContent.querySelectorAll('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".gif"], a[href$=".svg"]');
    potentialImageLinks.forEach(link => {
      // Skip links that are already part of a figure
      if (link.closest('figure')) return;
      
      const href = link.getAttribute('href');
      const text = link.textContent;
      
      // Create image element
      const img = document.createElement('img');
      img.src = href;
      img.alt = text;
      img.className = 'markdown-image';
      
      // Create figure
      const figure = document.createElement('figure');
      figure.className = 'content-image';
      figure.appendChild(img);
      
      // Add caption if the link text isn't just the URL
      if (text && !text.includes(href)) {
        const figcaption = document.createElement('figcaption');
        figcaption.textContent = text;
        figure.appendChild(figcaption);
      }
      
      // Replace the link with the figure
      link.parentNode.replaceChild(figure, link);
    });
    
    // Handle Wikimedia links specifically
    const wikimediaLinks = postContent.querySelectorAll('a[href*="commons.wikimedia.org/wiki/File:"]');
    wikimediaLinks.forEach(link => {
      // Skip links that are already processed
      if (link.closest('figure')) return;
      
      const href = link.getAttribute('href');
      const text = link.textContent;
      
      // Extract the filename from the URL
      const filename = href.split('File:')[1];
      if (!filename) return;
      
      // Create direct image URL
      const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
      
      // Create image element
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = text;
      img.className = 'markdown-image';
      
      // Create figure
      const figure = document.createElement('figure');
      figure.className = 'content-image';
      figure.appendChild(img);
      
      // Add caption
      const figcaption = document.createElement('figcaption');
      figcaption.textContent = text;
      figure.appendChild(figcaption);
      
      // Replace the link with the figure
      link.parentNode.replaceChild(figure, link);
    });
    
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
  });