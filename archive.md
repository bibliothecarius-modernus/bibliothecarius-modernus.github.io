---
layout: page
title: Archive
permalink: /archive/
---

<div class="archive-page">
  <h1 class="archive-title">Translation & Research Archive</h1>
  
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
  
  // Add the new hash handling code here, right before the closing bracket of the DOMContentLoaded function
  
  // Handle hash in URL for direct category filtering
  if (window.location.hash) {
    const category = window.location.hash.substring(1); // Remove the # symbol
    
    // Find the corresponding category filter and click it
    const categoryFilters = document.querySelectorAll('.category-filter a');
    let foundFilter = false;
    
    categoryFilters.forEach(filter => {
      const filterCategory = filter.getAttribute('data-category');
      
      // Check if the category matches (case-insensitive comparison)
      if (filterCategory && filterCategory.toLowerCase() === category.toLowerCase()) {
        // Remove active class from all filters first
        categoryFilters.forEach(f => f.classList.remove('active'));
        
        // Add active class to this filter
        filter.classList.add('active');
        
        // Show/hide items based on category
        const archiveItems = document.querySelectorAll('.archive-item');
        archiveItems.forEach(item => {
          const itemCategories = item.getAttribute('data-categories');
          if (itemCategories && itemCategories.toLowerCase().includes(category.toLowerCase())) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
        
        // Scroll to the filter to make it visible
        filter.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        foundFilter = true;
      }
    });
    
    // If we didn't find a matching filter, try to find a category with that name anyway
    if (!foundFilter) {
      const archiveItems = document.querySelectorAll('.archive-item');
      let hasMatchingItems = false;
      
      archiveItems.forEach(item => {
        const itemCategories = item.getAttribute('data-categories');
        if (itemCategories && itemCategories.toLowerCase().includes(category.toLowerCase())) {
          item.style.display = 'block';
          hasMatchingItems = true;
        } else {
          item.style.display = 'none';
        }
      });
      
      if (hasMatchingItems) {
        // Update the "All Categories" button to not be active
        const allCategoriesFilter = document.querySelector('.category-filter a[data-category="all"]');
        if (allCategoriesFilter) {
          categoryFilters.forEach(f => f.classList.remove('active'));
          // We don't mark any specific category as active since we didn't find an exact match
        }
      }
    }
  }
});
</script>