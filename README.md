# PMP Prep

A single-page web app for PMP/CAPM exam preparation. 1,044 PMBOK 6 questions, mock exams, knowledge-area quizzes, focus drills, spaced-repetition rework, mastery analytics.

## Features

- **Tests** — 30 sections covering knowledge-area quizzes, focus tests, and mock exams. Study mode (immediate feedback) or Exam mode (timed, PMI pacing).
- **Custom tests** — upload your own PDF question banks.
- **Mastery tracking** — per-question SM-2 spaced repetition.
- **Rework queue** — auto-surfaces questions you got wrong.
- **Search & flag** — full-text search across the bank, flag questions for review.
- **Dashboard** — score history, mastery heatmap, study streak.
- **Offline / PWA** — installable, fully offline-capable after first load.
- **Backup / restore** — JSON export/import in the Settings page.

## Local development

The app is a single static site. Open `index.html` directly, or serve over HTTP for full PWA features (service worker requires `http://` or `https://`):

```
python -m http.server 8765
```

Then open <http://localhost:8765/>.

## Hosting on GitHub Pages

The repo is structured so the root contains all static assets — push to a public GitHub repo, enable Pages from `main` / root, and you're live. Bump `CACHE_VERSION` in `sw.js` on every deploy so clients invalidate stale caches.

## Privacy

Local-only. All progress (attempts, flags, notes, mastery) lives in your browser's `localStorage`. No analytics, no telemetry, no network calls beyond CDN-loaded assets (Tailwind, Chart.js, Inter font, PDF.js).

To move data between devices, use **Settings → Backup & restore**:
- Download JSON on device A.
- Restore from JSON on device B.

## Question bank

1,044 questions sourced from a PMBOK 6-aligned study guide. Some explanations are truncated mid-sentence in the source PDF; these are flagged with a "truncated in source" badge rather than fabricated.
