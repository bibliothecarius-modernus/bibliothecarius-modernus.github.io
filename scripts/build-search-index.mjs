#!/usr/bin/env node
/**
 * Build Pagefind search index with translation content
 *
 * This script:
 * 1. Indexes the Jekyll HTML output (blog posts, pages)
 * 2. Adds custom records for each translation chunk (Latin + English)
 *
 * Run after Jekyll build: node scripts/build-search-index.mjs
 */

import * as pagefind from 'pagefind';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'yaml';

const SITE_DIR = '_site';
const TRANSLATIONS_DIR = 'assets/translations';
const POSTS_DIR = '_posts';

// Cache mapping translation_json paths to post URLs
const translationToPostUrl = new Map();

// Posts with `listed: false` are unpublished: their HTML and their translation
// JSON must not enter the public search index.
const unlistedPostUrls = new Set();
const unlistedTranslationFiles = new Set();

/**
 * A "NOTA LECTORIBUS" placeholder JSON is a single-chunk notice, not a translation.
 */
function isPlaceholderTranslation(data) {
  const chunks = Array.isArray(data.chunks) ? data.chunks : [];
  if (chunks.length !== 1) return false;
  const text = `${getLatinText(chunks[0])} ${getEnglishText(chunks[0])}`;
  return /NOTA LECTORIBUS/i.test(text);
}

/**
 * Normalise a century label so the filter has one spelling:
 * "11 century" -> "11th century"; "11th century" unchanged.
 */
function normalizeCenturyLabel(label) {
  if (!label) return '';
  const m = String(label).trim().match(/^(\d{1,2})(st|nd|rd|th)?\s*century$/i);
  if (!m) return String(label).trim();
  const n = parseInt(m[1], 10);
  const suffix = (n % 100 >= 11 && n % 100 <= 13) ? 'th'
    : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix} century`;
}

/**
 * Extract text content, stripping HTML/SSML tags
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<speak[^>]*>/gi, '')
    .replace(/<\/speak>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get Latin text from chunk (handles both formats)
 */
function getLatinText(chunk) {
  return chunk.latin || chunk.original_latin || '';
}

/**
 * Get English text from chunk (handles both formats)
 */
function getEnglishText(chunk) {
  return chunk.english || chunk.cleaned_english_translation || '';
}

/**
 * Get chunk ID (handles both formats)
 */
function getChunkId(chunk) {
  return chunk.chunk_id || chunk.chunk_number || 0;
}

/**
 * Recursively list .html/.htm files under dir, as paths relative to dir.
 */
async function walkHtmlFiles(dir, base = dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await walkHtmlFiles(full, base));
    } else if (/\.html?$/i.test(entry.name)) {
      out.push(full.slice(base.length + 1));
    }
  }
  return out.sort();
}

/**
 * Parse Jekyll front matter from a markdown file
 */
async function parsePostFrontMatter(postPath) {
  try {
    const content = await readFile(postPath, 'utf-8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;
    return yaml.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Extract metadata from JSON or matching post
 */
async function getMetadata(jsonFile, jsonData) {
  // If JSON has embedded metadata, use it
  if (jsonData.metadata) {
    const meta = jsonData.metadata;
    return {
      title: meta.title || meta.title_english || '',
      titleLatin: meta.title_latin || '',
      author: meta.author || 'Unknown',
      century: meta.century || '',
      source: meta.source || ''
    };
  }

  // Otherwise, try to get from matching post
  const stem = jsonFile.replace('.json', '');
  const postPath = join(POSTS_DIR, `${stem}.md`);
  const frontMatter = await parsePostFrontMatter(postPath);

  if (frontMatter?.original_work) {
    const work = frontMatter.original_work;
    return {
      title: frontMatter.title || '',
      titleLatin: work.latin_title || '',
      author: work.author || 'Unknown',
      century: extractCentury(work.date),
      source: work.publication || ''
    };
  }

  // Fallback: derive from filename
  return {
    title: stem.split('-').slice(3).join(' ').replace(/-/g, ' '),
    titleLatin: '',
    author: 'Unknown',
    century: '',
    source: ''
  };
}

/**
 * Extract century from date string like "c. 923-924" or "13th century"
 */
function extractCentury(dateStr) {
  if (!dateStr) return '';

  // Already says "century"
  if (dateStr.includes('century')) {
    return dateStr;
  }

  // Extract year and compute century
  const yearMatch = dateStr.match(/(\d{3,4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const century = Math.ceil(year / 100);
    const suffix = century === 1 ? 'st' : century === 2 ? 'nd' : century === 3 ? 'rd' : 'th';
    return `${century}${suffix} century`;
  }

  return '';
}

/**
 * Build mapping of translation JSON paths to their post URLs
 * by scanning all posts for translation_json references
 */
async function buildTranslationToPostUrlMap() {
  try {
    const postFiles = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));

    for (const postFile of postFiles) {
      const frontMatter = await parsePostFrontMatter(join(POSTS_DIR, postFile));
      if (!frontMatter?.translation_json) continue;

      // Extract the JSON filename from the path
      const jsonPath = frontMatter.translation_json;
      const jsonFilename = jsonPath.split('/').pop();

      // Build the post URL from the filename
      // Post filename: YYYY-MM-DD-title.md
      const match = postFile.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
      if (match) {
        const [, year, month, , title] = match;
        const postUrl = `/${year}/${month}/${title}/`;
        translationToPostUrl.set(jsonFilename, postUrl);
        if (frontMatter.listed === false) {
          unlistedPostUrls.add(postUrl);
          unlistedTranslationFiles.add(jsonFilename);
        }
      }
    }
    if (unlistedPostUrls.size) {
      console.log(`   Excluding ${unlistedPostUrls.size} unlisted post(s) from the index`);
    }

    console.log(`   Built URL map for ${translationToPostUrl.size} translation files`);
  } catch (err) {
    console.log(`   Warning: Could not build translation URL map: ${err.message}`);
  }
}

/**
 * Get the URL for a translation chunk.
 *
 * Pagefind keys records by URL, so a Latin record and an English record for the same
 * chunk must not share one URL — before Phase 8B the English record silently replaced
 * the Latin one and Latin text was never searchable (audit finding W6). The Latin record
 * therefore carries `?lang=latin` before the anchor; the edition page reads it and opens
 * the Latin view (assets/js/post.js), and the `#chunk-n` anchor still resolves.
 */
function getChunkUrl(jsonFile, chunkId, lang = 'english') {
  const suffix = (lang === 'latin' ? '?lang=latin' : '') + `#chunk-${chunkId}`;
  // First, check if we have a mapped post URL for this JSON file
  const mappedUrl = translationToPostUrl.get(jsonFile);
  if (mappedUrl) {
    return `${mappedUrl}${suffix}`;
  }

  // Fallback: derive from JSON filename
  const stem = jsonFile.replace('.json', '');
  // Parse date from filename: YYYY-MM-DD-title.json
  const match = stem.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (match) {
    const [, year, month, , title] = match;
    return `/${year}/${month}/${title}/${suffix}`;
  }
  return `/translations/${stem}/${suffix}`;
}

async function main() {
  console.log('🔍 Building Pagefind search index...\n');

  // Create Pagefind index
  // Use forceLanguage: 'en' to create a single unified index
  // (Pagefind doesn't support Latin stemming anyway, so we use 'en' for all content)
  const { index } = await pagefind.createIndex({
    forceLanguage: 'en'
  });

  // Step 1: Build translation JSON to post URL mapping (also finds unlisted posts)
  console.log(`🔗 Mapping translation files to post URLs...`);
  await buildTranslationToPostUrlMap();

  // Step 2: Index Jekyll HTML output, excluding unlisted posts' pages.
  // Files are added one by one (addHTMLFile) rather than via addDirectory so the
  // exclusion is a plain path check, not a glob dialect we cannot test locally.
  console.log(`📄 Indexing HTML from ${SITE_DIR}/...`);
  const htmlFiles = await walkHtmlFiles(SITE_DIR);
  let page_count = 0;
  let excludedPages = 0;
  for (const rel of htmlFiles) {
    const urlPath = '/' + rel.replace(/\\/g, '/').replace(/index\.html$/, '');
    if ([...unlistedPostUrls].some(u => urlPath === u || urlPath.startsWith(u))) {
      excludedPages++;
      continue;
    }
    const content = await readFile(join(SITE_DIR, rel), 'utf-8');
    const { errors: fileErrors } = await index.addHTMLFile({ sourcePath: rel, content });
    if (fileErrors && fileErrors.length) {
      console.log(`   Warning: ${rel}: ${fileErrors.join('; ')}`);
      continue;
    }
    page_count++;
  }
  console.log(`   Added ${page_count} HTML pages${excludedPages ? ` (excluded ${excludedPages} unlisted page(s))` : ''}\n`);

  // Step 3: Index translation JSON files
  console.log(`📜 Indexing translation files from ${TRANSLATIONS_DIR}/...`);

  let translationFiles;
  try {
    translationFiles = (await readdir(TRANSLATIONS_DIR)).filter(f => f.endsWith('.json'));
  } catch (err) {
    console.log(`   Warning: Could not read ${TRANSLATIONS_DIR}: ${err.message}`);
    translationFiles = [];
  }

  let latinChunks = 0;
  let englishChunks = 0;
  let errors = 0;

  let skippedUnlisted = 0;
  let skippedPlaceholders = 0;

  for (const jsonFile of translationFiles) {
    try {
      if (unlistedTranslationFiles.has(jsonFile)) {
        skippedUnlisted++;
        continue;
      }
      const jsonPath = join(TRANSLATIONS_DIR, jsonFile);
      const rawData = await readFile(jsonPath, 'utf-8');
      const data = JSON.parse(rawData);

      if (!data.chunks || !Array.isArray(data.chunks)) {
        console.log(`   Skipping ${jsonFile}: no chunks array`);
        continue;
      }
      if (isPlaceholderTranslation(data)) {
        skippedPlaceholders++;
        continue;
      }

      const metadata = await getMetadata(jsonFile, data);
      metadata.century = normalizeCenturyLabel(metadata.century);

      for (const chunk of data.chunks) {
        const chunkId = getChunkId(chunk);
        const url = getChunkUrl(jsonFile, chunkId, 'english');
        const latinUrl = getChunkUrl(jsonFile, chunkId, 'latin');

        // Index Latin text
        // Note: Use 'en' as language code for unified index (Pagefind doesn't support Latin stemming)
        // The 'language' filter and meta still identify this as Latin content for filtering
        const latinText = cleanText(getLatinText(chunk));
        if (latinText && latinText.length > 10) {
          await index.addCustomRecord({
            url: latinUrl,
            content: latinText,
            language: 'en',
            meta: {
              title: metadata.titleLatin || metadata.title,
              author: metadata.author,
              language: 'Latin',
              chunk: String(chunkId)
            },
            filters: {
              language: ['Latin'],
              century: metadata.century ? [metadata.century] : [],
              author: [metadata.author]
            }
          });
          latinChunks++;
        }

        // Index English text
        const englishText = cleanText(getEnglishText(chunk));
        if (englishText && englishText.length > 10) {
          await index.addCustomRecord({
            url: url,
            content: englishText,
            language: 'en',
            meta: {
              title: metadata.title || metadata.titleLatin,
              author: metadata.author,
              language: 'English',
              chunk: String(chunkId)
            },
            filters: {
              language: ['English'],
              century: metadata.century ? [metadata.century] : [],
              author: [metadata.author]
            }
          });
          englishChunks++;
        }
      }

      process.stdout.write('.');
    } catch (err) {
      console.log(`\n   Error processing ${jsonFile}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n   Added ${latinChunks} Latin chunks`);
  console.log(`   Added ${englishChunks} English chunks`);
  if (skippedUnlisted) console.log(`   Skipped ${skippedUnlisted} unlisted translation file(s)`);
  if (skippedPlaceholders) console.log(`   Skipped ${skippedPlaceholders} placeholder file(s) (NOTA LECTORIBUS)`);
  if (errors > 0) {
    console.log(`   ⚠️  ${errors} files had errors`);
  }

  // Step 4: Write the index
  console.log(`\n📦 Writing index to ${SITE_DIR}/pagefind/...`);
  await index.writeFiles({ outputPath: join(SITE_DIR, 'pagefind') });

  console.log('\n✅ Search index built successfully!');

  await pagefind.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
