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
      }
    }

    console.log(`   Built URL map for ${translationToPostUrl.size} translation files`);
  } catch (err) {
    console.log(`   Warning: Could not build translation URL map: ${err.message}`);
  }
}

/**
 * Get the URL for a translation chunk
 */
function getChunkUrl(jsonFile, chunkId) {
  // First, check if we have a mapped post URL for this JSON file
  const mappedUrl = translationToPostUrl.get(jsonFile);
  if (mappedUrl) {
    return `${mappedUrl}#chunk-${chunkId}`;
  }

  // Fallback: derive from JSON filename
  const stem = jsonFile.replace('.json', '');
  // Parse date from filename: YYYY-MM-DD-title.json
  const match = stem.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (match) {
    const [, year, month, , title] = match;
    return `/${year}/${month}/${title}/#chunk-${chunkId}`;
  }
  return `/translations/${stem}/#chunk-${chunkId}`;
}

async function main() {
  console.log('🔍 Building Pagefind search index...\n');

  // Create Pagefind index
  const { index } = await pagefind.createIndex({
    forceLanguage: 'en'
  });

  // Step 1: Index Jekyll HTML output
  console.log(`📄 Indexing HTML from ${SITE_DIR}/...`);
  const { page_count } = await index.addDirectory({ path: SITE_DIR });
  console.log(`   Added ${page_count} HTML pages\n`);

  // Step 2: Build translation JSON to post URL mapping
  console.log(`🔗 Mapping translation files to post URLs...`);
  await buildTranslationToPostUrlMap();

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

  for (const jsonFile of translationFiles) {
    try {
      const jsonPath = join(TRANSLATIONS_DIR, jsonFile);
      const rawData = await readFile(jsonPath, 'utf-8');
      const data = JSON.parse(rawData);

      if (!data.chunks || !Array.isArray(data.chunks)) {
        console.log(`   Skipping ${jsonFile}: no chunks array`);
        continue;
      }

      const metadata = await getMetadata(jsonFile, data);

      for (const chunk of data.chunks) {
        const chunkId = getChunkId(chunk);
        const url = getChunkUrl(jsonFile, chunkId);

        // Index Latin text
        const latinText = cleanText(getLatinText(chunk));
        if (latinText && latinText.length > 10) {
          await index.addCustomRecord({
            url: url,
            content: latinText,
            language: 'la',
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
