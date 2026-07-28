# ReadMe sync (do not commit API keys)

The Headless Checkout guides and `tickean-checkout-v1.json` were published to ReadMe version `1.0` on 2026-07-28. Re-run the sync after contract or guide changes.

```bash
# From tickean-core-server
node scripts/export-checkout-openapi.js
rdme openapi docs/openapi/tickean-checkout-v1.json --key="$README_API_KEY"

# From tickean-checkout-js
# Upload each docs/readme/*.md as a Guide via rdme docs (version as configured in ReadMe)
for f in docs/readme/*.md; do
  echo "Prepare guide: $f"
done
```

Set `README_API_KEY` in your shell environment only. Never commit it.
