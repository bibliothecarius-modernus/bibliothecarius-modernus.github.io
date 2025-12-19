# Zenodo DOI Workflow for Bibliothecarius Modernus

This document describes how to mint DOIs for translations via Zenodo, making them citable scholarly resources.

## Setup (One-Time)

1. Create a Zenodo account at [zenodo.org](https://zenodo.org)
2. Go to **Settings → GitHub → Connect**
3. Authorize Zenodo to access your GitHub account
4. Toggle ON the `bibliothecarius-modernus.github.io` repository
5. Optionally test with [Zenodo Sandbox](https://sandbox.zenodo.org) first

## Minting a DOI for a New Release

1. Create a GitHub Release (e.g., `v2025.12.1` or semantic versioning)
2. Zenodo automatically creates a deposit and mints a DOI
3. Retrieve the DOI from your Zenodo dashboard
4. The DOI format will be `10.5281/zenodo.XXXXXXX`

## Adding DOI to Posts

Add the DOI to the post's front matter under `external_resources.doi`:

```yaml
external_resources:
  doi: "10.5281/zenodo.XXXXXXX"
  archive_url: "https://archive.org/..."
  github_url: "https://github.com/..."
```

For collection releases covering multiple translations, add the same DOI to each included post. For individual translation DOIs (if minting separately), use the specific DOI.

## Attribution Standards

Each translation lists Ryan Wolfslayer as creator/translator. AI assistance is disclosed in:

1. The Zenodo record description and notes fields
2. Each post's Resource Info tab (Translation Method field)
3. The site's About page methodology section

This follows emerging academic norms treating AI as a sophisticated tool requiring disclosure rather than a co-author requiring attribution. The human contributor remains responsible for:

- Text selection and curatorial decisions
- Prompting strategy and translation direction
- Quality review and error correction
- Contextual research and analysis content
- Editorial decisions about publication

The AI tool (currently Claude 4.5 Sonnet, previously ChatGPT-4o for older translations) performs the linguistic transformation from Latin to English under human direction.

## Citation Format

Recommended citation for individual translations:

> [Author]. "[Latin Title]." Translated by Ryan Wolfslayer using Claude (Anthropic), Bibliothecarius Modernus, [Date]. DOI: [DOI]

Example:

> Jonas of Orléans. "De cultu imaginum." Translated by Ryan Wolfslayer using Claude (Anthropic), Bibliothecarius Modernus, 26 Nov. 2025. DOI: 10.5281/zenodo.XXXXXXX

## Repository Metadata

The `.zenodo.json` file in the repository root provides default metadata for Zenodo deposits:

- **Title:** Bibliothecarius Modernus: Latin Patristic Translations
- **License:** CC BY 4.0
- **Keywords:** patristics, Latin, translation, church fathers, medieval theology, AI-assisted translation, Patrologia Latina

## Versioning Strategy

Consider using calendar-based versioning (e.g., `v2025.12.1`) where:
- Year and month indicate the release period
- Final digit tracks releases within that month

This approach works well for content-focused projects where semantic versioning (breaking/feature/patch) is less applicable.
