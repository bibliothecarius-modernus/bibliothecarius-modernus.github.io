---
layout: page
title: Archive
permalink: /archive/
---

<div class="archive-page">
  <h1 class="archive-title">Translation & Research Archive</h1>
  
  {% if site.data.categories.size > 0 %}
  <div class="archive-categories">
    <h2>Browse by Category</h2>
    <div class="category-filter">
      <a href="#all" class="active" data-category="all">All Categories</a>
      {% for cat in site.data.categories %}
      <a href="#{{ cat[0] }}" data-category="{{ cat[0] }}">{{ cat[1].name }}</a>
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
      <li class="archive-item" {% if post.categories %}data-categories="{{ post.categories | join: ' ' }}"{% endif %} data-category-slugs="{{ post.categories | join: ' ' }}">
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
                {% assign cat_data = site.data.categories[category] %}
                <a href="#{{ category }}" data-filter="{{ category }}" class="category-tag">{% if cat_data %}{{ cat_data.name }}{% else %}{{ category }}{% endif %}</a>
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
    // Legacy hash mapping - maps old URL-encoded category names to new slugs
    const legacyHashMap = {
      'Apologetics': 'apologetics',
      'Apostolic Fathers': 'apostolic-fathers',
      'Apostolic%20Fathers': 'apostolic-fathers',
      'Asceticism & Monasticism': 'asceticism-monasticism',
      'Asceticism%20%26%20Monasticism': 'asceticism-monasticism',
      'Canon Law': 'canon-law',
      'Canon%20Law': 'canon-law',
      'Carolingian Theological Renaissance': 'carolingian-theological-renaissance',
      'Carolingian%20Theological%20Renaissance': 'carolingian-theological-renaissance',
      'Christology': 'christology',
      'Chronicles & Annals': 'chronicles-annals',
      'Chronicles%20%26%20Annals': 'chronicles-annals',
      'Conciliar & Synodal Acts': 'conciliar-synodal-acts',
      'Conciliar%20%26%20Synodal%20Acts': 'conciliar-synodal-acts',
      'Creeds & Confessions': 'creeds-confessions',
      'Creeds%20%26%20Confessions': 'creeds-confessions',
      'Early Church Theology': 'early-church-theology',
      'Early%20Church%20Theology': 'early-church-theology',
      'Ecclesiastical History': 'ecclesiastical-history',
      'Ecclesiastical%20History': 'ecclesiastical-history',
      'Ecclesiology': 'ecclesiology',
      'Epistolary': 'epistolary',
      'Epistolary Literature': 'epistolary-literature',
      'Epistolary%20Literature': 'epistolary-literature',
      'Eschatology': 'eschatology',
      'Hagiography': 'hagiography',
      'Heresiology': 'heresiology',
      'High Scholasticism': 'high-scholasticism',
      'High%20Scholasticism': 'high-scholasticism',
      'Homiletics': 'homiletics',
      'Irish & Anglo-Saxon Contributions': 'irish-anglo-saxon-contributions',
      'Irish%20%26%20Anglo-Saxon%20Contributions': 'irish-anglo-saxon-contributions',
      'Liturgical Texts & Sacramentaries': 'liturgical-texts-sacramentaries',
      'Liturgical%20Texts%20%26%20Sacramentaries': 'liturgical-texts-sacramentaries',
      'Marian Theology & Devotion': 'marian-theology-devotion',
      'Marian%20Theology%20%26%20Devotion': 'marian-theology-devotion',
      'Mathematics': 'mathematics',
      'Medieval Diplomacy': 'medieval-diplomacy',
      'Medieval%20Diplomacy': 'medieval-diplomacy',
      'Medieval Science': 'medieval-science',
      'Medieval%20Science': 'medieval-science',
      'Medieval Theology (6th-12th Century)': 'medieval-theology',
      'Medieval%20Theology%20(6th-12th%20Century)': 'medieval-theology',
      'Merovingian History': 'merovingian-history',
      'Merovingian%20History': 'merovingian-history',
      'Monastic Rules & Constitutions': 'monastic-rules-constitutions',
      'Monastic%20Rules%20%26%20Constitutions': 'monastic-rules-constitutions',
      'Monastic Spirituality': 'monastic-spirituality',
      'Monastic%20Spirituality': 'monastic-spirituality',
      'Moral Theology': 'moral-theology',
      'Moral%20Theology': 'moral-theology',
      'Mystical Theology': 'mystical-theology',
      'Mystical%20Theology': 'mystical-theology',
      'Natural Philosophy & Medicine': 'natural-philosophy-medicine',
      'Natural%20Philosophy%20%26%20Medicine': 'natural-philosophy-medicine',
      'Neo-Platonic Christian Philosophy': 'neo-platonic-christian-philosophy',
      'Neo-Platonic%20Christian%20Philosophy': 'neo-platonic-christian-philosophy',
      'New Testament Commentaries': 'new-testament-commentaries',
      'New%20Testament%20Commentaries': 'new-testament-commentaries',
      'Nicene Fathers': 'nicene-fathers',
      'Nicene%20Fathers': 'nicene-fathers',
      'Old Testament Commentaries': 'old-testament-commentaries',
      'Old%20Testament%20Commentaries': 'old-testament-commentaries',
      'Papal Bulls & Decretals': 'papal-bulls-decretals',
      'Papal%20Bulls%20%26%20Decretals': 'papal-bulls-decretals',
      'Patristic Correspondence': 'patristic-correspondence',
      'Patristic%20Correspondence': 'patristic-correspondence',
      'Patristic Philosophy': 'patristic-philosophy',
      'Patristic%20Philosophy': 'patristic-philosophy',
      'Penitential Literature': 'penitential-literature',
      'Penitential%20Literature': 'penitential-literature',
      'Pneumatology': 'pneumatology',
      'Post-Nicene Fathers': 'post-nicene-fathers',
      'Post-Nicene%20Fathers': 'post-nicene-fathers',
      'Scholastic Theology': 'scholastic-theology',
      'Scholastic%20Theology': 'scholastic-theology',
      'Soteriology': 'soteriology',
      'Trinitarian Theology': 'trinitarian-theology',
      'Trinitarian%20Theology': 'trinitarian-theology',
      'Visigothic & Mozarabic Writings': 'visigothic-mozarabic-writings',
      'Visigothic%20%26%20Mozarabic%20Writings': 'visigothic-mozarabic-writings'
    };

    const categoryFilters = document.querySelectorAll('.category-filter a');
    const archiveItems = document.querySelectorAll('.archive-item');

    // Function to filter by category slug
    function filterByCategory(categorySlug) {
      // Remove active class from all filters
      categoryFilters.forEach(f => f.classList.remove('active'));

      // Find and activate the matching filter
      categoryFilters.forEach(filter => {
        if (filter.getAttribute('data-category') === categorySlug) {
          filter.classList.add('active');
        }
      });

      // Show/hide items based on category
      archiveItems.forEach(item => {
        if (categorySlug === 'all') {
          item.style.display = 'block';
        } else {
          const itemCategories = item.getAttribute('data-categories');
          if (itemCategories && itemCategories.split(' ').includes(categorySlug)) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        }
      });

      // Update URL hash without triggering reload
      if (categorySlug !== 'all') {
        history.replaceState(null, null, '#' + categorySlug);
      } else {
        history.replaceState(null, null, window.location.pathname);
      }
    }

    categoryFilters.forEach(filter => {
      filter.addEventListener('click', function(e) {
        e.preventDefault();
        const category = this.getAttribute('data-category');
        filterByCategory(category);
      });
    });

    // Handle category tag clicks
    document.querySelectorAll('.post-categories .category-tag').forEach(tag => {
      tag.addEventListener('click', function(e) {
        e.preventDefault();
        const categoryToFilter = this.getAttribute('data-filter');
        filterByCategory(categoryToFilter);
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

    // Handle hash in URL for direct category filtering (including legacy hashes)
    if (window.location.hash) {
      let hashValue = window.location.hash.substring(1);
      let decodedHash = decodeURIComponent(hashValue);

      // Check if this is a legacy hash that needs redirect
      let targetSlug = legacyHashMap[hashValue] || legacyHashMap[decodedHash];

      if (targetSlug) {
        // Redirect to new slug format
        history.replaceState(null, null, '#' + targetSlug);
        filterByCategory(targetSlug);
      } else {
        // Already a slug or 'all'
        filterByCategory(hashValue);
      }

      // Scroll to the filter area
      setTimeout(() => {
        const filterArea = document.querySelector('.category-filter');
        if (filterArea) {
          filterArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  });
</script>