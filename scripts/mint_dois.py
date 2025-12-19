#!/usr/bin/env python3
"""
Zenodo DOI Minting Script for Bibliothecarius Modernus

Automatically mints DOIs for translations via the Zenodo API.

Usage:
    python scripts/mint_dois.py                    # Dry run (shows what would be done)
    python scripts/mint_dois.py --execute          # Actually mint DOIs
    python scripts/mint_dois.py --execute --limit 5  # Mint DOIs for first 5 posts only
    python scripts/mint_dois.py --post "de-cultu-imaginum"  # Mint DOI for specific post

Environment:
    ZENODO_TOKEN: Your Zenodo API token (required)
    ZENODO_SANDBOX: Set to "1" to use sandbox.zenodo.org for testing
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from datetime import datetime

import requests
import yaml

# Configuration
POSTS_DIR = Path(__file__).parent.parent / "_posts"
TRANSLATIONS_DIR = Path(__file__).parent.parent / "assets" / "translations"
SITE_URL = "https://bibliothecarius-modernus.github.io"

# Zenodo endpoints
ZENODO_API = "https://zenodo.org/api"
ZENODO_SANDBOX_API = "https://sandbox.zenodo.org/api"


def get_zenodo_config():
    """Get Zenodo API configuration from environment or file."""
    # Try environment variable first
    token = os.environ.get("ZENODO_TOKEN")

    # Fall back to token file
    if not token:
        token_file = Path.home() / ".zenodo_token"
        if token_file.exists():
            token = token_file.read_text().strip()

    if not token:
        print("Error: ZENODO_TOKEN not found")
        print("Either set ZENODO_TOKEN environment variable or create ~/.zenodo_token")
        print("Generate a token at: zenodo.org -> Settings -> Applications -> Personal access tokens")
        print("Required scopes: deposit:write, deposit:actions")
        sys.exit(1)

    use_sandbox = os.environ.get("ZENODO_SANDBOX", "0") == "1"
    base_url = ZENODO_SANDBOX_API if use_sandbox else ZENODO_API

    return token, base_url, use_sandbox


def parse_front_matter(file_path: Path) -> dict:
    """Parse YAML front matter from a Jekyll post."""
    content = file_path.read_text(encoding="utf-8")

    # Extract front matter between --- markers
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None

    try:
        return yaml.safe_load(match.group(1))
    except yaml.YAMLError as e:
        print(f"  Warning: Failed to parse YAML in {file_path.name}: {e}")
        return None


def is_placeholder_json(json_path: Path) -> bool:
    """Check if a JSON file is a placeholder (not a real translation)."""
    if not json_path or not json_path.exists():
        return True

    # Small files are likely placeholders
    if json_path.stat().st_size < 2000:
        return True

    # Check for placeholder marker text
    try:
        content = json_path.read_text(encoding="utf-8")
        if "NOTA LECTORIBUS" in content or "NOTE TO READERS" in content:
            return True
    except Exception:
        return True

    return False


def get_posts_needing_dois() -> list:
    """Find all posts that need DOIs minted."""
    posts = []

    for post_path in sorted(POSTS_DIR.glob("*.md")):
        front_matter = parse_front_matter(post_path)
        if not front_matter:
            continue

        # Check if DOI already exists and is not a placeholder
        existing_doi = front_matter.get("external_resources", {}).get("doi", "")
        if existing_doi and "EXAMPLE" not in existing_doi:
            continue

        # Check if translation JSON exists
        translation_json = front_matter.get("translation_json", "")
        if translation_json:
            json_filename = Path(translation_json).name
            json_path = TRANSLATIONS_DIR / json_filename
            if not json_path.exists():
                # Try matching by date prefix
                date_prefix = post_path.stem[:10]  # YYYY-MM-DD
                matches = list(TRANSLATIONS_DIR.glob(f"{date_prefix}*.json"))
                json_path = matches[0] if matches else None
        else:
            # Try to find matching JSON by filename pattern
            date_prefix = post_path.stem[:10]
            matches = list(TRANSLATIONS_DIR.glob(f"{date_prefix}*.json"))
            json_path = matches[0] if matches else None

        # Check if JSON is a real translation (not a placeholder)
        is_placeholder = is_placeholder_json(json_path)

        posts.append({
            "path": post_path,
            "front_matter": front_matter,
            "json_path": json_path,
            "has_json": json_path and json_path.exists() if json_path else False,
            "is_placeholder": is_placeholder
        })

    return posts


def build_zenodo_metadata(front_matter: dict, post_path: Path) -> dict:
    """Build Zenodo metadata from post front matter."""
    original = front_matter.get("original_work", {})

    # Build title
    latin_title = original.get("latin_title", front_matter.get("title", "Untitled"))
    author = original.get("author", "Unknown")
    date = original.get("date", "")

    title = f"{latin_title}"
    if author and author != "Unknown":
        title = f"{author}: {title}"

    # Build description
    publication = original.get("publication", "")
    context = original.get("context", "")

    description_parts = [
        f"AI-assisted Latin to English translation of \"{latin_title}\"",
    ]
    if author:
        description_parts[0] += f" by {author}"
    if date:
        description_parts[0] += f" ({date})"
    description_parts[0] += "."

    if publication:
        description_parts.append(f"Source: {publication}.")
    if context:
        description_parts.append(context)

    description_parts.append(
        "Translation produced using Claude (Anthropic) with human direction, "
        "selection, and editorial review. The Latin text is provided alongside "
        "English for verification."
    )

    description = " ".join(description_parts)

    # Determine publication date from filename
    date_match = re.match(r"(\d{4})-(\d{2})-(\d{2})", post_path.name)
    if date_match:
        pub_date = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
    else:
        pub_date = datetime.now().strftime("%Y-%m-%d")

    # Build keywords from categories
    categories = front_matter.get("categories", [])
    keywords = ["patristics", "Latin", "translation", "AI-assisted translation"]
    for cat in categories:
        # Convert kebab-case to readable
        keyword = cat.replace("-", " ")
        if keyword not in keywords:
            keywords.append(keyword)

    # Related identifiers
    related = []
    external = front_matter.get("external_resources", {})
    if external.get("archive_url"):
        related.append({
            "identifier": external["archive_url"],
            "relation": "isSupplementedBy",
            "resource_type": "dataset"
        })
    if external.get("github_url"):
        related.append({
            "identifier": external["github_url"],
            "relation": "isSupplementedBy",
            "resource_type": "software"
        })

    # Post URL (permalink format: /:year/:month/:title/)
    date_match = re.match(r"(\d{4})-(\d{2})-\d{2}-(.*)", post_path.stem)
    if date_match:
        year, month, slug = date_match.groups()
        post_url = f"{SITE_URL}/{year}/{month}/{slug}/"
    else:
        post_url = f"{SITE_URL}/{post_path.stem}/"
    related.append({
        "identifier": post_url,
        "relation": "isDocumentedBy",
        "resource_type": "publication-other"
    })

    metadata = {
        "title": title,
        "description": description,
        "upload_type": "publication",
        "publication_type": "other",
        "publication_date": pub_date,
        "creators": [
            {
                "name": "Wolfslayer, Ryan",
                "affiliation": "Bibliothecarius Modernus",
                "orcid": "0000-0001-8914-9706"
            }
        ],
        "license": "cc-by-4.0",
        "keywords": keywords,
        "language": "eng",
        "notes": (
            "Translation produced with AI assistance (Claude, Anthropic). "
            f"See {SITE_URL}/about/ for methodology details."
        ),
        "related_identifiers": related
    }

    return metadata


def create_zenodo_deposit(token: str, base_url: str, metadata: dict, json_path: Path) -> str:
    """Create a Zenodo deposit, upload file, and publish. Returns DOI."""
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Create empty deposit
    r = requests.post(
        f"{base_url}/deposit/depositions",
        headers=headers,
        json={}
    )
    r.raise_for_status()
    deposit = r.json()
    deposit_id = deposit["id"]
    bucket_url = deposit["links"]["bucket"]

    print(f"    Created deposit {deposit_id}")

    # Step 2: Upload file
    if json_path and json_path.exists():
        with open(json_path, "rb") as f:
            r = requests.put(
                f"{bucket_url}/{json_path.name}",
                headers=headers,
                data=f
            )
            r.raise_for_status()
        print(f"    Uploaded {json_path.name}")
    else:
        print("    Warning: No JSON file to upload")

    # Step 3: Add metadata
    r = requests.put(
        f"{base_url}/deposit/depositions/{deposit_id}",
        headers={**headers, "Content-Type": "application/json"},
        json={"metadata": metadata}
    )
    r.raise_for_status()
    print(f"    Added metadata")

    # Step 4: Publish
    r = requests.post(
        f"{base_url}/deposit/depositions/{deposit_id}/actions/publish",
        headers=headers
    )
    r.raise_for_status()
    result = r.json()
    doi = result["doi"]

    print(f"    Published! DOI: {doi}")
    return doi


def update_post_with_doi(post_path: Path, doi: str):
    """Update a post's front matter with the minted DOI."""
    content = post_path.read_text(encoding="utf-8")

    # Check if external_resources exists
    if "external_resources:" in content:
        # Check if doi field exists
        if re.search(r"^\s+doi:", content, re.MULTILINE):
            # Replace existing doi line
            content = re.sub(
                r"^(\s+doi:)\s*[\"']?[^\"'\n]*[\"']?\s*$",
                f'\\1 "{doi}"',
                content,
                flags=re.MULTILINE
            )
        else:
            # Add doi field after external_resources:
            content = re.sub(
                r"(external_resources:)\n",
                f'\\1\n  doi: "{doi}"\n',
                content
            )
    else:
        # Add external_resources section before ---
        # Find the closing ---
        parts = content.split("---", 2)
        if len(parts) >= 3:
            parts[1] = parts[1].rstrip() + f'\n\nexternal_resources:\n  doi: "{doi}"\n'
            content = "---".join(parts)

    post_path.write_text(content, encoding="utf-8")
    print(f"    Updated {post_path.name}")


def main():
    parser = argparse.ArgumentParser(description="Mint DOIs for translations via Zenodo API")
    parser.add_argument("--execute", action="store_true", help="Actually mint DOIs (default is dry run)")
    parser.add_argument("--limit", type=int, help="Limit number of DOIs to mint")
    parser.add_argument("--post", type=str, help="Mint DOI for specific post (partial name match)")
    parser.add_argument("--skip-update", action="store_true", help="Don't update post files with DOIs")
    args = parser.parse_args()

    token, base_url, use_sandbox = get_zenodo_config()

    if use_sandbox:
        print("Using Zenodo SANDBOX (test DOIs)")
    else:
        print("Using Zenodo PRODUCTION")

    print()

    # Find posts needing DOIs
    posts = get_posts_needing_dois()

    # Filter by specific post if requested
    if args.post:
        posts = [p for p in posts if args.post.lower() in p["path"].stem.lower()]

    # Apply limit
    if args.limit:
        posts = posts[:args.limit]

    if not posts:
        print("No posts need DOIs!")
        return

    print(f"Found {len(posts)} posts needing DOIs:\n")

    for i, post in enumerate(posts, 1):
        path = post["path"]
        fm = post["front_matter"]
        has_json = post["has_json"]
        is_placeholder = post["is_placeholder"]

        title = fm.get("original_work", {}).get("latin_title", fm.get("title", "Untitled"))
        author = fm.get("original_work", {}).get("author", "Unknown")

        print(f"{i}. {path.name}")
        print(f"   Title: {title}")
        print(f"   Author: {author}")
        print(f"   Has JSON: {'Yes' if has_json else 'No'}")
        if is_placeholder:
            print(f"   Status: PLACEHOLDER (will skip)")

        if args.execute:
            if not has_json or is_placeholder:
                reason = "No translation JSON file" if not has_json else "Placeholder file only"
                print(f"   SKIPPED: {reason}")
                print()
                continue

            try:
                metadata = build_zenodo_metadata(fm, path)
                doi = create_zenodo_deposit(token, base_url, metadata, post["json_path"])

                if not args.skip_update:
                    update_post_with_doi(path, doi)

            except requests.HTTPError as e:
                print(f"   ERROR: {e}")
                print(f"   Response: {e.response.text[:500] if e.response else 'No response'}")
            except Exception as e:
                print(f"   ERROR: {e}")
        else:
            if is_placeholder:
                print("   [DRY RUN - would SKIP (placeholder)]")
            else:
                print("   [DRY RUN - would mint DOI]")

        print()

    if not args.execute:
        print("=" * 60)
        print("This was a DRY RUN. To actually mint DOIs, run:")
        print("  python scripts/mint_dois.py --execute")
        print()
        print("To test with sandbox first:")
        print("  ZENODO_SANDBOX=1 python scripts/mint_dois.py --execute")


if __name__ == "__main__":
    main()
