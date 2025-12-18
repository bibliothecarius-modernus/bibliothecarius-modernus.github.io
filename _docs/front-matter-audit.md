# Front Matter Audit Report

Generated: 2025-12-18

## Summary

- **Total Posts Scanned:** 56
- **Fully Compliant:** 55
- **Issues Found:** 1

## Required Fields Checked

1. `layout: post` - All 56 posts correct
2. `title` - All 56 posts have titles
3. `date` - All 56 posts have dates
4. `categories` (array) - All 56 posts have category arrays
5. `translation_json` - 55/56 posts have valid paths
6. `original_work` object - All 56 posts have complete objects

## Issues Found

### Missing `translation_json`

**File:** `_posts/2025-12-18-three-sermons-nativity-hildebert-lavardin.md`

This post is missing the `translation_json` field entirely. All other required fields are present.

**Recommended fix:** Add the translation_json field:
```yaml
translation_json: "/assets/translations/[filename].json"
```

## Notes

- No posts use the legacy `layout: tabbed_post`
- All `translation_json` paths that exist point to valid file paths
- The single issue is on a post currently being edited (per git status)
