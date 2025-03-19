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
          {% if post.image %}
          <div class="archive-post-image">
            <img src="{{ post.image | relative_url }}" alt="{{ post.title | escape }}">
          </div>
          {% endif %}
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
  });
</script>