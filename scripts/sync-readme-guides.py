#!/usr/bin/env python3
"""Sync Headless Checkout / Elements guides + OpenAPI to ReadMe API v2."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GUIDES_DIR = ROOT / "docs" / "readme"
OPENAPI_PATH = GUIDES_DIR / "tickean-checkout-v1.openapi.json"
OPENAPI_FILENAME = "tickean-checkout-v1.json"
BRANCH = "1.0"
BASE = "https://api.readme.com/v2"
CATEGORY_TITLE = "SDK de Headless Checkout"
GITHUB_BLOB = "https://github.com/Tickean/tickean-checkout-js/blob/main"

# Local file stem (without .md) → ReadMe slug
GUIDES: list[tuple[str, str]] = [
    ("00-overview", "headless-checkout-overview"),
    ("01-quickstart-js", "headless-checkout-quickstart-js"),
    ("02-quickstart-react", "headless-checkout-quickstart-react"),
    ("03-keys-and-domains", "headless-checkout-keys-domains"),
    ("04-otp", "headless-checkout-otp"),
    ("05-cart-quote", "headless-checkout-cart-quote"),
    ("06-promotions", "headless-checkout-promotions"),
    ("07-payments-returns", "headless-checkout-payments-returns"),
    ("08-webhooks", "headless-checkout-webhooks"),
    ("09-errors", "headless-checkout-errors"),
    ("10-security", "headless-checkout-security"),
    ("11-accessibility", "headless-checkout-accessibility"),
    ("12-go-live", "headless-checkout-go-live"),
    ("13-migration-from-iframe", "headless-checkout-migrate-iframe"),
    ("14-elements-quickstart", "headless-checkout-elements-quickstart"),
    ("15-appearance-api", "headless-checkout-appearance-api"),
    ("16-states-and-next-action", "headless-checkout-states-next-action"),
    ("17-csp-and-security-headers", "headless-checkout-csp-security-headers"),
    ("18-session-resume", "headless-checkout-session-resume"),
    ("19-troubleshooting", "headless-checkout-troubleshooting"),
    ("20-browser-support-and-semver", "headless-checkout-browser-semver"),
    ("21-recipes-frameworks", "headless-checkout-recipes-frameworks"),
    ("22-wordpress", "headless-checkout-wordpress"),
]

FILE_TO_SLUG = {file: slug for file, slug in GUIDES}


def auth_headers(content_type: str | None = "application/json") -> dict[str, str]:
    api_key = os.environ.get("README_API_KEY", "").strip()
    if not api_key:
        print("ERROR: set README_API_KEY", file=sys.stderr)
        sys.exit(1)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": "tickean-checkout-js-sync/1.0",
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def request(
    method: str,
    path: str,
    payload: dict | None = None,
    allow: set[int] | None = None,
    raw_body: bytes | None = None,
    headers: dict[str, str] | None = None,
):
    if raw_body is not None:
        data = raw_body
        hdrs = headers or auth_headers(None)
    elif payload is not None:
        data = json.dumps(payload).encode("utf-8")
        hdrs = headers or auth_headers()
    else:
        data = None
        hdrs = headers or auth_headers()

    req = urllib.request.Request(BASE + path, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        if allow and exc.code in allow:
            return exc.code, json.loads(body) if body else {}
        raise RuntimeError(f"{method} {path} -> {exc.code}: {body}") from exc


def list_categories() -> list[dict]:
    _, data = request("GET", f"/branches/{BRANCH}/categories/guides")
    return data.get("data", [])


def ensure_category(title: str) -> str:
    categories = list_categories()
    for cat in categories:
        if cat.get("title") == title:
            return cat["uri"]
    _, data = request(
        "POST",
        f"/branches/{BRANCH}/categories/guides",
        {"title": title, "position": len(categories) + 1},
    )
    return data["data"]["uri"]


def get_guide(slug: str) -> dict | None:
    enc = urllib.parse.quote(slug, safe="")
    status, data = request("GET", f"/branches/{BRANCH}/guides/{enc}", allow={404})
    if status == 404:
        return None
    return data.get("data")


def delete_guide(slug: str) -> None:
    enc = urllib.parse.quote(slug, safe="")
    request("DELETE", f"/branches/{BRANCH}/guides/{enc}", allow={404})
    print(f"  deleted {slug}")


def find_slug_variants(slug: str) -> list[str]:
    """Return accidental ReadMe duplicates like `{slug}-1` in the category."""
    enc = urllib.parse.quote(CATEGORY_TITLE, safe="")
    _, pages_data = request("GET", f"/branches/{BRANCH}/categories/guides/{enc}/pages")
    variants: list[str] = []
    for page in pages_data.get("data", []):
        page_slug = page["slug"]
        if page_slug == slug:
            continue
        if re.fullmatch(re.escape(slug) + r"(?:-\d+)+", page_slug):
            variants.append(page_slug)
    return variants


def parse_guide(path: Path) -> tuple[str, str]:
    text = path.read_text(encoding="utf-8").strip()
    lines = text.splitlines()
    title = path.stem
    if lines and lines[0].startswith("# "):
        title = lines[0][2:].strip()
        body = "\n".join(lines[1:]).lstrip("\n")
    else:
        body = text
    return title, body


def rewrite_links(body: str) -> str:
    def replace_md_link(match: re.Match[str]) -> str:
        label, url = match.group(1), match.group(2)
        if url.startswith("http://") or url.startswith("https://") or url.startswith("#"):
            return match.group(0)

        # ./14-elements-quickstart.md or 14-elements-quickstart.md (+ optional #anchor)
        m = re.match(
            r"^(?:\./)?(\d{2}-[a-z0-9-]+)\.md(?:#([a-zA-Z0-9_-]+))?$",
            url,
        )
        if m:
            file_stem, anchor = m.group(1), m.group(2)
            slug = FILE_TO_SLUG.get(file_stem)
            if slug:
                dest = f"/docs/{slug}"
                if anchor:
                    dest += f"#{anchor}"
                return f"[{label}]({dest})"

        # SYNC-README or other local docs → leave as-is (not published)
        if "SYNC-README" in url:
            return f"[{label}](https://github.com/Tickean/tickean-checkout-js/blob/main/docs/readme/SYNC-README.md)"

        # examples/recipes/...
        m = re.match(r"^(?:\.\./)*examples/recipes/([^)#]+)(?:#(.*))?$", url)
        if m:
            rel = m.group(1)
            dest = f"{GITHUB_BLOB}/examples/recipes/{rel}"
            if m.group(2):
                dest += f"#{m.group(2)}"
            return f"[{label}]({dest})"

        # ../../examples/...
        m = re.match(r"^(?:\.\./)+(examples/.+)$", url)
        if m:
            return f"[{label}]({GITHUB_BLOB}/{m.group(1)})"

        return match.group(0)

    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", replace_md_link, body)


def upsert_guide(slug: str, title: str, body: str, category_uri: str) -> None:
    for variant in find_slug_variants(slug):
        delete_guide(variant)

    # Do not send `slug` on PATCH — ReadMe may rename to `{slug}-1`.
    content_payload = {
        "title": title,
        "privacy": {"view": "public"},
        "category": {"uri": category_uri},
        "content": {"body": body, "type": "markdown"},
    }
    existing = get_guide(slug)
    enc = urllib.parse.quote(slug, safe="")
    if existing:
        request("PATCH", f"/branches/{BRANCH}/guides/{enc}", content_payload)
        print(f"  updated {slug}")
    else:
        create_payload = {**content_payload, "slug": slug}
        request("POST", f"/branches/{BRANCH}/guides", create_payload)
        print(f"  created {slug}")


def multipart_body(fields: dict[str, tuple[str | None, bytes, str | None]]) -> tuple[bytes, str]:
    boundary = "----TickeanReadMeBoundary7MA4YWxkTrZu0gW"
    lines: list[bytes] = []
    for name, (filename, content, content_type) in fields.items():
        lines.append(f"--{boundary}".encode())
        if filename:
            disp = f'Content-Disposition: form-data; name="{name}"; filename="{filename}"'
            lines.append(disp.encode())
            lines.append(f"Content-Type: {content_type or 'application/octet-stream'}".encode())
        else:
            lines.append(f'Content-Disposition: form-data; name="{name}"'.encode())
        lines.append(b"")
        lines.append(content)
    lines.append(f"--{boundary}--".encode())
    lines.append(b"")
    return b"\r\n".join(lines), f"multipart/form-data; boundary={boundary}"


def openapi_for_readme(raw: bytes) -> bytes:
    """ReadMe's OpenAPI validator rejects JSON Schema `const`; rewrite to enum."""
    spec = json.loads(raw.decode("utf-8"))

    def walk(node):
        if isinstance(node, dict):
            if "const" in node:
                value = node.pop("const")
                node["enum"] = [value]
            for child in node.values():
                walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)

    walk(spec)
    return json.dumps(spec, ensure_ascii=False, indent=2).encode("utf-8")


def upload_openapi() -> None:
    if not OPENAPI_PATH.exists():
        print(f"  skip OpenAPI (missing {OPENAPI_PATH})")
        return

    schema = openapi_for_readme(OPENAPI_PATH.read_bytes())
    body, content_type = multipart_body(
        {
            "schema": (OPENAPI_FILENAME, schema, "application/json"),
            "upload_source": (None, b"form", None),
        }
    )
    headers = auth_headers(content_type)

    # Update existing filename if present; otherwise create.
    status, _ = request(
        "GET",
        f"/branches/{BRANCH}/apis/{OPENAPI_FILENAME}",
        allow={404},
    )
    if status == 404:
        method, path = "POST", f"/branches/{BRANCH}/apis"
        print(f"  creating API {OPENAPI_FILENAME}")
    else:
        method, path = "PUT", f"/branches/{BRANCH}/apis/{OPENAPI_FILENAME}"
        print(f"  updating API {OPENAPI_FILENAME}")

    status, data = request(method, path, raw_body=body, headers=headers, allow={202, 200, 201})
    print(f"  upload accepted ({status})")

    # Poll processing status
    for _ in range(30):
        _, info = request("GET", f"/branches/{BRANCH}/apis/{OPENAPI_FILENAME}")
        upload = (info.get("data") or info).get("upload") or {}
        st = upload.get("status")
        reason = upload.get("reason")
        print(f"  upload.status={st}")
        if st == "done":
            return
        if st == "failed" or (st == "pending_update" and reason):
            raise RuntimeError(f"OpenAPI upload failed: {upload}")
        if st == "pending_review":
            print("  pending_review — check ReadMe dashboard")
            return
        time.sleep(2)
    print("  warning: OpenAPI still processing; check ReadMe dashboard")


def verify() -> None:
    cats = list_categories()
    cat = next((c for c in cats if c.get("title") == CATEGORY_TITLE), None)
    if not cat:
        raise RuntimeError(f"category missing: {CATEGORY_TITLE}")
    enc = urllib.parse.quote(CATEGORY_TITLE, safe="")
    _, pages_data = request("GET", f"/branches/{BRANCH}/categories/guides/{enc}/pages")
    pages = pages_data.get("data", [])
    slugs = {p["slug"] for p in pages}
    print(f"\nCategory pages: {len(pages)}")
    missing = [slug for _, slug in GUIDES if slug not in slugs]
    if missing:
        raise RuntimeError(f"missing slugs: {missing}")
    if get_guide("headless-checkout-wordpress") is None:
        raise RuntimeError("wordpress guide not found")
    print("Verify OK: 23 guides including headless-checkout-wordpress")


def sync(skip_openapi: bool = False) -> None:
    category_uri = ensure_category(CATEGORY_TITLE)
    print(f"Category: {CATEGORY_TITLE}")
    print(f"uri: {category_uri}")

    for file_stem, slug in GUIDES:
        path = GUIDES_DIR / f"{file_stem}.md"
        if not path.exists():
            raise FileNotFoundError(path)
        title, body = parse_guide(path)
        body = rewrite_links(body)
        upsert_guide(slug, title, body, category_uri)

    if not skip_openapi:
        print("\nOpenAPI:")
        upload_openapi()

    verify()
    print("\nSync complete.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync Headless Checkout guides to ReadMe")
    parser.add_argument("--skip-openapi", action="store_true")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()

    if args.verify_only:
        verify()
        return

    sync(skip_openapi=args.skip_openapi)


if __name__ == "__main__":
    main()
