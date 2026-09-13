source "https://rubygems.org"

# Versions are pinned to conservative ranges so CI builds are reproducible
# until a real Gemfile.lock is generated in CI (bundler is not installed on the
# authoring machine, so a lock file cannot be produced trustworthily here).
gem "jekyll", "~> 4.3.0"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-redirect-from", "~> 0.16"
end

# Theme
gem "minima", "~> 2.5"

# Windows and JRuby compatibility
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
