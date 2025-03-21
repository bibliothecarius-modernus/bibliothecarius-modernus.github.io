---
layout: page
title: Archive
permalink: /archive/
---

<div class="archive-page">
  <h1 class="archive-title">Translation & Research Archive</h1>
  
  <!-- Archive Search - Above Categories -->
  <div class="archive-search-container">
    <form action="{{ '/search.html' | relative_url }}" method="get" class="archive-search-form">
      <input type="text" name="query" placeholder="Search translations..." class="archive-search-input">
      <button type="submit" class="archive-search-button">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span class="search-button-text">Search</span>
      </button>
    </form>
  </div>
  
  {% if site.categories.size > 0 %}
  <div class="archive-categories">
    <h2>Browse by Category</h2>
    <div class="category-filter">
      <a href="#" class="active" data-category="all">All Categories</a>
      {% for category in site.categories %}
      <a href="#" data-category="{{ category | first }}">{{ category | first | capitalize }}</a>
      {% endfor %}
    </div>
  </div>
  {% endif %}
  
  {% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
  
  <div class="archive-list-container">
    {% for year in posts_by_year %}
    <h2 class="archive-year">{{ year.name }}</h2>
    <ul class="archive-list">
      {% for post in year.items %}
      <li class="archive-item" {% if post.categories %}data-categories="{{ post.categories | join: ' ' }}"{% endif %}>
        <div class="archive-post-container">
          <div class="archive-post-image">
            {% if post.youtube_id %}
              <div class="youtube-thumbnail-container">
                <img src="https://img.youtube.com/vi/{{ post.youtube_id }}/hqdefault.jpg" alt="{{ post.title | escape }}">
                <div class="play-button-overlay">
                  <div class="play-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="white" d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
            {% elsif post.image %}
              <img src="{{ post.image | relative_url }}" alt="{{ post.title | escape }}">
            {% else %}
              <div class="post-thumbnail placeholder"></div>
            {% endif %}
          </div>
          <div class="archive-post-content">
            <h3 class="archive-post-title">
              <a href="{{ post.url | relative_url }}">{{ post.title | escape }}</a>
            </h3>
            <div class="archive-post-meta">
              <span class="archive-post-date">{{ post.date | date: "%B %-d, %Y" }}</span>
              {% if post.categories %}
              <div class="post-categories">
                {% for category in post.categories %}
                <a href="#" data-filter="{{ category }}" class="category-tag">{{ category }}</a>
                {% endfor %}
              </div>
              {% endif %}
            </div>
            <div class="archive-post-excerpt">
              {{ post.excerpt | strip_html | truncatewords: 50 }}
              <a href="{{ post.url | relative_url }}" class="read-more">Read more</a>
            </div>
          </div>
        </div>
      </li>
      {% endfor %}
    </ul>
    {% endfor %}
  </div>
</div>

<style>
  /* Archive Search Styles */
  .archive-search-container {
    margin-bottom: 30px;
    max-width: 500px;
    width: 100%;
  }
  
  .archive-search-form {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    background-color: var(--white);
    border: 1px solid var(--highlight-color);
  }
  
  .archive-search-input {
    flex: 1;
    padding: 12px 15px;
    border: none;
    font-size: 16px;
    font-family: 'PT Serif', serif;
    background-color: transparent;
    color: var(--text-color);
  }
  
  .archive-search-input::placeholder {
    color: var(--dark-gray);
    font-style: italic;
  }
  
  .archive-search-input:focus {
    outline: none;
  }
  
  .archive-search-button {
    background-color: var(--highlight-color);
    color: white;
    border: none;
    padding: 12px 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.3s ease;
    font-family: 'PT Serif', serif;
    font-weight: 500;
  }
  
  .archive-search-button:hover {
    background-color: var(--dark-highlight);
  }
  
  @media screen and (max-width: 600px) {
    .archive-search-container {
      max-width: 100%;
    }
    
    .search-button-text {
      display: none;
    }
    
    .archive-search-button {
      padding: 12px;
    }
  }
</style>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const categoryFilters = document.querySelectorAll('.category-filter a');
    const archiveItems = document.querySelectorAll('.archive-item');
    
    categoryFilters.forEach(filter => {
      filter.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all filters
        categoryFilters.forEach(f => f.classList.remove('active'));
        
        // Add active class to clicked filter
        this.classList.add('active');
        
        const category = this.getAttribute('data-category');
        
        // Show/hide items based on category
        archiveItems.forEach(item => {
          if (category === 'all') {
            item.style.display = 'block';
          } else {
            const itemCategories = item.getAttribute('data-categories');
            if (itemCategories && itemCategories.includes(category)) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          }
        });
      });
    });
    
    // Handle category tag clicks
    document.querySelectorAll('.post-categories .category-tag').forEach(tag => {
      tag.addEventListener('click', function(e) {
        e.preventDefault();
        
        const categoryToFilter = this.getAttribute('data-filter');
        
        // Find and click the corresponding category filter
        categoryFilters.forEach(filter => {
          if (filter.getAttribute('data-category') === categoryToFilter) {
            filter.click();
          }
        });
      });
    });
    
    // YouTube thumbnail click handling
    document.querySelectorAll('.youtube-thumbnail-container').forEach(thumbnail => {
      thumbnail.addEventListener('click', function() {
        const postLink = this.closest('.archive-post-container').querySelector('.archive-post-title a').getAttribute('href');
        if (postLink) {
          window.location.href = postLink;
        }
      });
      
      // Make the thumbnail look clickable
      thumbnail.style.cursor = 'pointer';
    });
    
    // Handle hash in URL for direct category filtering
    if (window.location.hash) {
      // Decode the URL hash to handle spaces and special characters
      const category = decodeURIComponent(window.location.hash.substring(1));
      
      // Find the corresponding category filter and click it
      const categoryFilters = document.querySelectorAll('.category-filter a');
      let foundFilter = false;
      
      categoryFilters.forEach(filter => {
        const filterCategory = filter.getAttribute('data-category');
        
        // Case-insensitive comparison
        if (filterCategory && filterCategory.toLowerCase() === category.toLowerCase()) {
          filter.click();
          foundFilter = true;
          
          // Scroll to the filter to make it visible
          setTimeout(() => {
            filter.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      });
      
      // If we didn't find a match, try direct filtering as fallback
      if (!foundFilter) {
        const archiveItems = document.querySelectorAll('.archive-item');
        let hasMatchingItems = false;
        
        archiveItems.forEach(item => {
          const itemCategories = item.getAttribute('data-categories');
          
          if (itemCategories) {
            // Split the categories string and check each one
            const categories = itemCategories.split(' ');
            if (categories.some(cat => cat.toLowerCase() === category.toLowerCase())) {
              item.style.display = 'block';
              hasMatchingItems = true;
            } else {
              item.style.display = 'none';
            }
          } else {
            item.style.display = 'none';
          }
        });
        
        if (hasMatchingItems) {
          // Update filter buttons to show the right one as active
          categoryFilters.forEach(f => f.classList.remove('active'));
          
          // Try to find and mark the matching category filter
          categoryFilters.forEach(filter => {
            if (filter.getAttribute('data-category') && 
                filter.getAttribute('data-category').toLowerCase() === category.toLowerCase()) {
              filter.classList.add('active');
            }
          });
        }
      }
    }
  });
</script>