# Embeds for ReadMe

## `wizard-demo.html`

Standalone Elements wizard in **demo mode** (no backend). Hosted at:

https://d1eg24w7igwib6.cloudfront.net/wizard-demo.html

Embed param: `?embed=1` (compact chrome for iframes).

### Publish / update

```bash
aws s3 cp docs/readme/embeds/wizard-demo.html \
  s3://tickets-core/wizard-demo.html \
  --content-type "text/html; charset=utf-8" \
  --cache-control "public, max-age=300" \
  --region us-east-2

aws cloudfront create-invalidation \
  --distribution-id E3EES7TQ1V77B9 \
  --paths "/wizard-demo.html"
```

Bump jsDelivr package versions inside the HTML when publishing new SDK releases.
