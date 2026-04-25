/* PMP Prep — Firebase init (ES module)
 *
 * Loads Firebase SDK from gstatic, exposes helpers on window.PMP_SYNC for the
 * (non-module) main app script to call.
 *
 * Sync model: a single Firestore doc per user at users/{uid}/state/main.
 * Push on every persist() (debounced 1.5s by caller). Pull on sign-in and via
 * onSnapshot for cross-device live updates.
 *
 * If firebase-config.js still has REPLACE_ME placeholders, this module sets
 * PMP_SYNC.available=false and the app silently runs local-only.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut,
  onAuthStateChanged, setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const cfg = window.PMP_FIREBASE_CONFIG || {};
const isPlaceholder = !cfg.apiKey || /REPLACE_ME/.test(JSON.stringify(cfg));

const PMP_SYNC = {
  available: !isPlaceholder,
  user: null,
  // listeners (the main script subscribes to these)
  _authListeners: new Set(),
  _remoteListeners: new Set(),
  _lastPulledModified: 0,

  onAuth(cb) { this._authListeners.add(cb); cb(this.user); return () => this._authListeners.delete(cb); },
  onRemote(cb) { this._remoteListeners.add(cb); return () => this._remoteListeners.delete(cb); },

  // populated below if config is real
  signIn: async () => { throw new Error('Sync not configured'); },
  signOut: async () => { throw new Error('Sync not configured'); },
  push: async () => { /* no-op */ },
  pull: async () => null,
};
window.PMP_SYNC = PMP_SYNC;

if (isPlaceholder) {
  console.info('[PMP Sync] firebase-config.js still has placeholders — running in local-only mode.');
} else {
  try {
    const app = initializeApp(cfg);
    const auth = getAuth(app);
    const db = getFirestore(app);
    await setPersistence(auth, browserLocalPersistence);

    const stateRef = (uid) => doc(db, 'users', uid, 'state', 'main');

    let unsubscribeSnapshot = null;

    PMP_SYNC.signIn = async () => {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      return res.user;
    };
    PMP_SYNC.signOut = async () => {
      if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
      await fbSignOut(auth);
    };
    PMP_SYNC.pull = async () => {
      if (!PMP_SYNC.user) return null;
      const snap = await getDoc(stateRef(PMP_SYNC.user.uid));
      if (!snap.exists()) return null;
      const data = snap.data();
      PMP_SYNC._lastPulledModified = data.lastModified || 0;
      return data;
    };
    PMP_SYNC.push = async (state) => {
      if (!PMP_SYNC.user) return;
      const lastModified = state.lastModified || Date.now();
      // Strip volatile/local-only fields if any (none currently). Keep state shape stable.
      await setDoc(stateRef(PMP_SYNC.user.uid), {
        ...state,
        lastModified,
        _serverTime: serverTimestamp(),
      });
      PMP_SYNC._lastPulledModified = lastModified;
    };

    onAuthStateChanged(auth, (user) => {
      PMP_SYNC.user = user || null;
      // Set up live-sync subscription when signed in.
      if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
      if (user) {
        unsubscribeSnapshot = onSnapshot(stateRef(user.uid), (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          // Ignore our own writes (lastModified <= what we just pushed).
          if ((data.lastModified || 0) <= PMP_SYNC._lastPulledModified) return;
          PMP_SYNC._lastPulledModified = data.lastModified || 0;
          PMP_SYNC._remoteListeners.forEach((cb) => { try { cb(data); } catch (e) { console.warn(e); } });
        }, (err) => console.warn('[PMP Sync] snapshot error:', err));
      }
      PMP_SYNC._authListeners.forEach((cb) => { try { cb(user); } catch (e) { console.warn(e); } });
    });
  } catch (err) {
    console.error('[PMP Sync] init failed:', err);
    PMP_SYNC.available = false;
  }
}

// Notify any listeners that init has completed (auth state may still be null).
window.dispatchEvent(new CustomEvent('pmp-sync-ready'));
