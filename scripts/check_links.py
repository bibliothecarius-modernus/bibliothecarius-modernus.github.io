#!/usr/bin/env python3
"""Internal link check over the built site (_site): every href/src that points inside the
site must resolve to a file. External links are counted, not fetched (use --external to HEAD
them). Exit 1 on broken internal links. Phase 8B acceptance test."""
import argparse
import html.parser
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path


class LinkParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for key in ("href", "src"):
            if a.get(key):
                self.links.append(a[key])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="_site")
    ap.add_argument("--external", action="store_true", help="HEAD-check external links too (slow)")
    a = ap.parse_args()
    root = Path(a.site)
    broken, external, checked = [], set(), 0
    for path in root.rglob("*.html"):
        p = LinkParser()
        p.feed(path.read_text(encoding="utf-8", errors="replace"))
        for link in p.links:
            u = urllib.parse.urlsplit(link)
            if u.scheme in ("mailto", "javascript", "data") or link.startswith("#"):
                continue
            if u.scheme in ("http", "https"):
                if u.netloc == "bibliothecarius-modernus.github.io":
                    target = u.path
                else:
                    external.add(link)
                    continue
            else:
                target = u.path
            if not target:
                continue
            target = urllib.parse.unquote(target)
            fs = root / target.lstrip("/") if target.startswith("/") else path.parent / target
            checked += 1
            if fs.is_dir():
                fs = fs / "index.html"
            if not fs.exists():
                broken.append((str(path.relative_to(root)), link))
    print(f"checked {checked} internal links in {sum(1 for _ in root.rglob('*.html'))} pages; {len(external)} distinct external links")
    for page, link in broken[:50]:
        print(f"BROKEN {page}: {link}")
    if a.external:
        bad = 0
        for link in sorted(external):
            try:
                req = urllib.request.Request(link, method="HEAD", headers={"User-Agent": "Mozilla/5.0 (link check)"})
                with urllib.request.urlopen(req, timeout=20) as r:
                    if r.status >= 400:
                        print(f"EXTERNAL {r.status} {link}"); bad += 1
            except Exception as e:  # noqa: BLE001
                print(f"EXTERNAL ERR {link}: {str(e)[:60]}"); bad += 1
        print(f"external problems: {bad}")
    print(f"broken internal links: {len(broken)}")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
