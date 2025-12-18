# Bibliothecarius Modernus

A Jekyll site publishing AI-assisted translations of Latin Patristic texts. Provides side-by-side Latin/English translations of early Church fathers and medieval theologians, many of which lack existing English translations.

Translations prioritize accessibility over scholarly authority—the original Latin is always displayed alongside English for verification.

## Requirements

- Ruby 2.7+
- Jekyll 4.x
- Bundler

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

Site available at `http://localhost:4000`.

## Deployment

Push to `main` branch. GitHub Actions builds and deploys to GitHub Pages automatically.

Custom Ruby plugins in `_plugins/` require GitHub Actions rather than standard GitHub Pages builds.

## Structure

```
_posts/              # Blog posts (layout: tabbed_post)
_layouts/            # Page templates including tabbed Latin/English/Analysis view
_plugins/            # Custom Liquid filters
_templates/          # New post template
_data/               # Category and video configuration
assets/
  translations/      # JSON files with Latin/English text chunks
  css/
  js/
  images/
```

## Adding New Posts

1. Copy `_templates/new_post.md` to `_posts/YYYY-MM-DD-title.md`
2. Create translation JSON in `assets/translations/`
3. Update front matter with `translation_json` path

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

- [Project Blog](https://bibliothecarius-modernus.github.io/)
- [Latin Patristic Texts Repository](https://github.com/wryan14/Latin-Patristic-Texts) - Source texts and interlinear translations
- [YouTube Channel](https://youtube.com/@BibliothecariusModernus) - Video presentations with Latin/English display

## License

CC0 1.0 Universal - see [LICENSE](LICENSE)