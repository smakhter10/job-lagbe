# JOB LAGBE 💼

A small, friendly, hand-checked job board for Bangladesh and fully remote roles worldwide — ten categories: WordPress, Shopify, WIX, Frontend, UI/UX, Client Communication, MTO, SEO, Google Ads and Teaching. Newest jobs first.

**Live site:** deploy this repo on Vercel (no build step — it is a plain static site).

## How it works

- `index.html`, `style.css`, `app.js` — the site. No framework, no build.
- `jobs.json` — the job data. The page fetches it and renders searchable, filterable cards.
- New jobs are appended to `jobs.json` daily by Mate (Seeyam's assistant) from the daily job digests, then committed and pushed here — Vercel redeploys automatically.

## Job entry format

```json
{
  "id": 1,
  "dateFound": "2026-11-15",
  "title": "Customer Success Manager",
  "company": "Example Ltd",
  "category": "Client & Business | WordPress & Web | Teaching",
  "locationType": "Bangladesh | Remote",
  "salary": "BDT 30,000–50,000/month or null",
  "details": "Short notes: location, shift, deadline, honest gaps.",
  "url": "https://…",
  "status": "open | check | closed"
}
```

- `open` — posting verified live with a working apply route on `dateFound`.
- `check` — something could not be fully confirmed (eligibility, salary, or the posting itself); read the notes.
- `closed` — expired or removed; hidden by default, kept for the record.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Jobs can close at any time — always confirm on the employer's page before applying.
