# PMP Prep — deploy + cross-device sync setup

This guide walks you through hosting the app on **GitHub Pages** (free, no card)
and enabling **cross-device sync** via **Firebase Spark plan** (free, no card).

End result: open `https://<your-username>.github.io/<repo>/` on your phone or
any browser, sign in with Google, and your progress (attempts, mastery, flags,
notes, custom tests) syncs across all devices automatically.

---

## Part 1 — Push the app to GitHub Pages

1. Create a free GitHub account if you don't have one.
2. Create a new **public** repository (Pages is free only on public repos under
   the free plan). Name it whatever you like, e.g. `pmp-prep`.
3. Push the contents of the `pmp-app/` folder to the repo's `main` branch.
   The repo root should contain `index.html`, `data.js`, `sw.js`, the icons,
   `manifest.webmanifest`, `firebase-config.js`, `firebase-init.js`, etc.
4. In GitHub: **Settings → Pages → Build and deployment → Source: Deploy from
   a branch**, then pick `main` / `/ (root)` and **Save**.
5. Wait ~1 min. Your app is now live at:
   `https://<your-username>.github.io/<repo>/`

The app already works at this point — fully offline-capable PWA, **but data is
local to each browser**. Continue to Part 2 to enable cross-device sync.

> **Update flow:** every time you change app files, bump `CACHE_VERSION` in
> `sw.js` (e.g. `v2026.04.25.1` → `v2026.04.25.2`) before pushing, otherwise
> users will see the cached old version until the SW expires it.

---

## Part 2 — Set up Firebase (Spark / free, no credit card)

### 2.1 Create the project

1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. **Add project** → name it (e.g. `pmp-prep`) → **disable Google Analytics**
   (not needed; keeps things simpler) → **Create project**.
3. You're now on the **Spark plan** by default. **Do not click "Upgrade"**. Spark
   has zero-cost ceilings — if you hit a quota Firebase simply rate-limits;
   nothing will charge you because no payment method is on file.

### 2.2 Enable Google Sign-In

1. Left sidebar → **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Google** → **Enable** → set a project support email → **Save**.

### 2.3 Create Firestore database

1. Left sidebar → **Build → Firestore Database → Create database**.
2. **Start in production mode** (we'll set rules immediately) → pick a region
   close to you (e.g. `eur3 (europe-west)`) → **Enable**.
3. Go to the **Rules** tab and replace the contents with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

   Click **Publish**. This makes each user's data private to themselves.

### 2.4 Register the web app and copy the config

1. Project home (gear icon) → **Project settings** → scroll to **Your apps** →
   **Add app → Web** (the `</>` icon).
2. Give it a nickname (e.g. `pmp-prep-web`). **Do not** check "Set up
   Firebase Hosting" — we're using GitHub Pages.
3. Firebase shows a `firebaseConfig = { ... }` object. Copy those values into
   `pmp-app/firebase-config.js`, replacing each `REPLACE_ME_...` placeholder:

   ```js
   window.PMP_FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "pmp-prep.firebaseapp.com",
     projectId: "pmp-prep",
     storageBucket: "pmp-prep.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef..."
   };
   ```

   These values are **safe to commit publicly** — the security boundary is the
   Firestore rules above, not config secrecy.

### 2.5 Authorize your GitHub Pages domain

1. **Authentication → Settings → Authorized domains → Add domain**.
2. Enter `<your-username>.github.io` (no path, no protocol). **Add**.

### 2.6 Push the updated `firebase-config.js` and bump the SW cache

1. Edit `pmp-app/firebase-config.js` with your real values.
2. Edit `pmp-app/sw.js` and bump `CACHE_VERSION`.
3. Commit and push. Wait ~1 min for Pages to redeploy.

---

## Part 3 — Use it

1. Open `https://<your-username>.github.io/<repo>/` in any browser.
2. Click **Sign in** in the top-right → choose your Google account.
3. The footer should now read **"Synced as <your name>"**.
4. Open the same URL on your phone, sign in with the same Google account —
   your progress appears within ~1 second and stays live-synced.

### Install as a phone app (PWA)

- **iOS Safari**: Share → Add to Home Screen.
- **Android Chrome**: menu → Install app / Add to Home screen.

The app will work offline after the first load. Sync resumes automatically
when you regain connectivity.

---

## Troubleshooting

- **"Sign-in failed: auth/unauthorized-domain"** — you forgot step 2.5. Add
  your `*.github.io` domain to Authorized domains.
- **"Cloud sync not configured"** toast — `firebase-config.js` still contains
  `REPLACE_ME` placeholders, or the file failed to load. Check the browser
  console.
- **Footer says "Local-only — sign in to sync" forever after sign-in** — open
  DevTools console and look for Firestore errors. Most common cause is the
  rules in 2.3 not being published.
- **App shows old version after deploy** — `CACHE_VERSION` in `sw.js` must
  change for clients to invalidate the cache. Hard-refresh (Ctrl+Shift+R) once.
- **I want to wipe everything and start over on a device** — DevTools →
  Application → Clear storage → Clear site data. Then sign in again to repull
  from the cloud.
