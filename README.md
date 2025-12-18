# Bibliothecarius Modernus

A Jekyll site publishing AI-assisted translations of Latin Patristic texts. The project makes obscure theological works accessible to modern readers by providing side-by-side Latin/English translations, with accompanying YouTube video presentations.

Currently hosts 54 translated works spanning early Church fathers and medieval theologians, many of which lack existing English translations.

## Requirements

- Ruby 2.7+
- Jekyll 4.x
- Bundler

Jekyll plugins (configured in `_config.yaml`):
- jekyll-feed
- jekyll-seo-tag
- jekyll-sitemap
- jekyll-redirect-from

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`.

## Deployment

Push to `main` branch. GitHub Actions builds and deploys to GitHub Pages.

The site uses custom Ruby plugins in `_plugins/`, which requires GitHub Actions for builds rather than standard GitHub Pages.

## Structure

```
_posts/              # Blog posts (layout: tabbed_post)
assets/
  translations/      # JSON files with Latin/English text chunks
  css/               # Stylesheets
  js/                # JavaScript (filtering, translation viewer)
  images/            # Site images and post thumbnails
_layouts/
  tabbed_post.html   # Post layout with Latin/English/Analysis tabs
  home.html          # Homepage with filtering
_plugins/
  remove_chars.rb    # Liquid filter for search indexing
_data/
  categories.yml     # Post category definitions
  featured_videos.yml
_templates/
  new_post.md        # Template for creating new posts
```

## Adding New Posts

1. Copy `_templates/new_post.md` to `_posts/` with date prefix: `YYYY-MM-DD-title.md`
2. Create corresponding translation JSON in `assets/translations/`
3. Update front matter with `translation_json` path and metadata

Translation JSON format:
```json
{
  "chunks": [
    {
      "chunk_number": "1",
      "original_latin": "Latin text...",
      "cleaned_english_translation": "English translation..."
    }
  ]
}
```

## Related Resources

- [Latin Patristic Texts Repository](https://github.com/wryan14/Latin-Patristic-Texts) - Source texts and raw translations
- [YouTube Channel](https://youtube.com/@BibliothecariusModernus) - Video presentations of translations

## License

Creative Commons. All translations and site content are freely available for use, modification, and redistribution.
