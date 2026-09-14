#!/usr/bin/env node
/**
 * Query the built Pagefind index from Node (no browser), e.g. after `npm run build`:
 *
 *   node scripts/search-check.mjs misericordia "totus mundus, cum multis miseriis suis"
 *   node scripts/search-check.mjs --json misericordia
 *
 * Loads _site/pagefind/pagefind.js with a fetch shim that serves the index files from
 * disk, runs each query (all languages, then Latin-only and English-only filters) and
 * prints result counts with the first hit. Exit code 1 if any query has zero results.
 * Used by Phase 8B to verify that Latin text is searchable (D040 acceptance test).
 */
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

const SITE_DIR = process.env.SITE_DIR || '_site';
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const queries = args.filter(a => a !== '--json');
if (!queries.length) {
  console.error('usage: node scripts/search-check.mjs [--json] QUERY [QUERY ...]');
  process.exit(2);
}

const root = resolve(SITE_DIR);
globalThis.fetch = async (url) => {
  const u = String(url);
  let path = u.startsWith('file://') ? new URL(u).pathname : u.replace(/^https?:\/\/[^/]+/, '');
  path = path.split('?')[0];
  const file = path.startsWith(root) ? path : join(root, path);
  try {
    const buf = await readFile(file);
    return new Response(buf, { status: 200, headers: { 'content-type': file.endsWith('.json') ? 'application/json' : 'application/octet-stream' } });
  } catch (e) {
    return new Response('', { status: 404 });
  }
};
globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || { querySelector: () => null, documentElement: { lang: 'en' }, location: { pathname: '/' },
  currentScript: null };
globalThis.location = globalThis.location || { pathname: '/', origin: 'http://localhost' };

const pf = await import(pathToFileURL(join(root, 'pagefind', 'pagefind.js')).href);
await pf.options({ basePath: '/pagefind/', baseUrl: '/' });
await pf.init();

let failed = false;
const report = {};
for (const q of queries) {
  const all = await pf.search(q);
  const la = await pf.search(q, { filters: { language: 'Latin' } });
  const en = await pf.search(q, { filters: { language: 'English' } });
  const first = all.results.length ? await all.results[0].data() : null;
  report[q] = {
    total: all.results.length, latin: la.results.length, english: en.results.length,
    first: first ? { url: first.url, title: first.meta?.title, language: first.meta?.language, excerpt: (first.excerpt || '').replace(/<[^>]+>/g, '').slice(0, 140) } : null,
  };
  if (!all.results.length) failed = true;
}
if (asJson) {
  console.log(JSON.stringify(report, null, 1));
} else {
  for (const [q, r] of Object.entries(report)) {
    console.log(`"${q}": ${r.total} results (Latin ${r.latin}, English ${r.english})` + (r.first ? `\n   first: ${r.first.url} — ${r.first.title} [${r.first.language}]\n   ${r.first.excerpt}` : '\n   NO RESULTS'));
  }
}
process.exit(failed ? 1 : 0);
