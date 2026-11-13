# COD SETTLE

Mobile COD settlement calculator (RM). It is a single static page: no login, no database, nothing saved.

- Total collected = TnG + Cash
- COD difference = Shopee Total − Total collected
- Transfer TnG ➜ Maybank = Shopee Total − Cash

Hosted free on GitHub Pages: Settings → Pages → Deploy from a branch → root.

## Brand logos

Put the official logo files in a `logos` folder, named in lowercase:
`logos/shopee.png`, `logos/tng.png`, `logos/maybank.png` (`.svg`, `.webp` or `.jpg` also work).
If a file is missing, the app shows a brand-coloured badge instead.

## Checks

`node tests/app-check.js` runs the calculation, validation and reset checks in a mobile browser (Playwright).
