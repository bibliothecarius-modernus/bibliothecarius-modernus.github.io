# Bibliothecarius Modernus

Latin Patristic texts translated through modern AI technology.

## Development

This Jekyll site uses custom Ruby plugins and deploys via GitHub Actions.

### Local Development

```bash
bundle install
bundle exec jekyll serve
```

### Deployment

Push to `main` branch. GitHub Actions handles the build and deploy.

## Structure

- `_posts/` - Blog posts (use `layout: post`)
- `assets/translations/` - JSON files with Latin/English text chunks
- `_templates/new_post.md` - Template for new posts
