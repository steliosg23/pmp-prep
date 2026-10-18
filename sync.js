/* PMP 8 · sync progress between devices through a secret GitHub Gist.
   The gist holds one file, encrypted with the same AES-256-GCM key as the book,
   so GitHub only ever sees ciphertext. Needs a token with the "gist" scope.
   Merge rule: per storage key, the most recent change wins. */
'use strict';

const SYNC_PAT = 'pmp8.sync.pat', SYNC_GIST = 'pmp8.sync.gist', SYNC_META = 'pmp8.sync.meta', SYNC_LAST = 'pmp8.sync.last';
const SYNC_FILE = 'pmp8-sync.enc';
const SYNC_SKIP = new Set(['pmp8.key', 'pmp8.theme', 'pmp8.prefs']);
const syncable = k => k.startsWith('pmp8.') && !k.startsWith('pmp8.sync.') && !SYNC_SKIP.has(k);
const rawGet = k => { try { return localStorage.getItem(k); } catch(e){ return null; } };
const rawSet = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch(e){} };
const metaGet = () => { try { return JSON.parse(rawGet(SYNC_META)) || {}; } catch(e){ return {}; } };
const metaSet = m => rawSet(SYNC_META, JSON.stringify(m));

let syncTimer = null, syncBusy = false, syncLastErr = '', SKEY = null;

/* every write through store.set is stamped, so the newest change can win */
{ const set0 = store.set.bind(store);
  store.set = (k, v) => { set0(k, v); if (syncable(k)){ const m = metaGet(); m[k] = Date.now(); metaSet(m); syncSoon(); } }; }

const syncOn = () => !!rawGet(SYNC_PAT);
async function syncKey(){
  if (SKEY) return SKEY;
  const raw = await crypto.subtle.exportKey('raw', VKEY);
  return SKEY = await crypto.subtle.importKey('raw', raw, {name:'AES-GCM'}, false, ['encrypt', 'decrypt']);
}
async function sealText(obj){
  const iv = crypto.getRandomValues(new Uint8Array(12)), k = await syncKey();
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, k, new TextEncoder().encode(JSON.stringify(obj))));
  const all = new Uint8Array(12 + ct.length); all.set(iv); all.set(ct, 12); return toB64(all);
}
async function openText(b64){
  const u = fromB64(b64.trim()), k = await syncKey();
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM', iv:u.subarray(0, 12)}, k, u.subarray(12))));
}

async function gh(path, opt = {}){
  const r = await fetch('https://api.github.com' + path, Object.assign({}, opt, {
    headers:Object.assign({'Authorization':'Bearer ' + rawGet(SYNC_PAT), 'Accept':'application/vnd.github+json'}, opt.body ? {'Content-Type':'application/json'} : {}),
    cache:'no-store'}));
  if (r.status === 401) throw new Error('Το token δεν είναι έγκυρο ή έληξε.');
  if (r.status === 403 || r.status === 404) throw new Error('Το token δεν έχει δικαίωμα σε gists (χρειάζεται το scope «gist»).');
  if (!r.ok) throw new Error('GitHub ' + r.status);
  return r.status === 204 ? null : r.json();
}
async function findGist(){
  let id = rawGet(SYNC_GIST); if (id) return id;
  for (let page = 1; page <= 10; page++){
    const list = await gh(`/gists?per_page=100&page=${page}`);
    const g = list.find(x => x.files && x.files[SYNC_FILE]); if (g){ rawSet(SYNC_GIST, g.id); return g.id; }
    if (list.length < 100) break;
  }
  const g = await gh('/gists', {method:'POST', body:JSON.stringify({description:'PMP Prep · κρυπτογραφημένη πρόοδος', public:false, files:{[SYNC_FILE]:{content:'{}'}}})});
  rawSet(SYNC_GIST, g.id); return g.id;
}
async function pullRemote(id){
  const g = await gh('/gists/' + id), f = g.files && g.files[SYNC_FILE];
  if (!f) return {};
  let txt = f.content;
  if (f.truncated) txt = await (await fetch(f.raw_url, {cache:'no-store'})).text();
  if (!txt || txt.trim() === '{}') return {};
  return (await openText(txt)).d || {};
}

/* pull, merge (newest wins per key), push if this device has anything newer */
async function syncNow(){
  if (!syncOn() || !VKEY || syncBusy) return {changed:false};
  syncBusy = true; let changed = false;
  try {
    const id = await findGist(), remote = await pullRemote(id), meta = metaGet();
    for (const k of Object.keys(remote)){
      if (!syncable(k)) continue;
      if ((remote[k].t || 0) > (meta[k] || 0)){ rawSet(k, remote[k].v); meta[k] = remote[k].t; changed = true; }
    }
    metaSet(meta);
    const out = {}; let newer = false;
    for (let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i); if (!syncable(k)) continue;
      out[k] = {t:meta[k] || 0, v:rawGet(k)};
      if (!remote[k] || (meta[k] || 0) > (remote[k].t || 0)) newer = true;
    }
    if (newer) await gh('/gists/' + id, {method:'PATCH', body:JSON.stringify({files:{[SYNC_FILE]:{content:await sealText({v:1, at:Date.now(), d:out})}}})});
    rawSet(SYNC_LAST, String(Date.now())); syncLastErr = '';
  } catch(e){ syncLastErr = e.message || String(e); }
  finally { syncBusy = false; syncStatus(); }
  return {changed};
}
function syncSoon(ms = 6000){ if (!syncOn()) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, ms); }

/* on start: wait briefly for the latest progress, but never block the app for long */
async function syncBoot(){
  /* the token travels with the book, encrypted with the same password: unlocking is all a new device needs */
  if (!syncOn() && !rawGet('pmp8.sync.manualoff')){ try { const c = await getJSON('docs/sync.json'); if (c && c.pat) rawSet(SYNC_PAT, c.pat); } catch(e){} }
  if (!syncOn()) return;
  await Promise.race([syncNow(), new Promise(r => setTimeout(r, 4000))]);
}
const quietView = () => !['list', 'progress', 'practice', 'tutor', 'library'].includes(currentView);
addEventListener('visibilitychange', async () => {
  if (!syncOn() || !VKEY) return;
  if (document.visibilityState === 'hidden'){ clearTimeout(syncTimer); syncNow(); }
  else { const r = await syncNow(); if (r.changed && !quietView()) route(); }
});

/* ── settings panel (in Πρόοδος) ───────────────────────────────────── */
function syncPanel(){
  return `<div class="panel" id="sync-panel">
    <h2>Συγχρονισμός σε όλες τις συσκευές</h2>
    <div id="sync-body"></div></div>`;
}
function syncStatus(){
  const el = $('#sync-body'); if (!el) return;
  if (!syncOn()){
    el.innerHTML = `<p class="hint">Η πρόοδος, οι σημειώσεις, οι κάρτες, η ροή του καθηγητή και τα λάθη σου συγχρονίζονται μέσω ενός ιδιωτικού GitHub Gist, κρυπτογραφημένα με τον κωδικό σου — το GitHub βλέπει μόνο ακαταλαβίστικα.</p>
      <ol class="sync-steps"><li>Φτιάξε ένα token με δικαίωμα <b>gist</b>: <a href="https://github.com/settings/tokens/new?scopes=gist&description=PMP%20Prep%20sync" target="_blank" rel="noopener">github.com → νέο token</a> (Expiration: όσο θέλεις).</li>
        <li>Επικόλλησέ το εδώ σε κάθε συσκευή σου (κινητό, tablet, υπολογιστή).</li></ol>
      <div class="sync-row"><input type="password" id="sync-pat" placeholder="ghp_…" autocomplete="off" spellcheck="false"><button class="btn btn-gold" id="sync-go">Σύνδεση</button></div>
      <p class="sync-err" id="sync-err">${esc(syncLastErr)}</p>`;
    $('#sync-go').onclick = async () => {
      const v = $('#sync-pat').value.trim(); if (!v) return;
      rawSet(SYNC_PAT, v); rawSet(SYNC_GIST, null); rawSet('pmp8.sync.manualoff', null); $('#sync-go').disabled = true; $('#sync-go').textContent = 'Σύνδεση…';
      const r = await syncNow();
      if (syncLastErr){ rawSet(SYNC_PAT, null); syncStatus(); return; }
      if (r.changed) route(); else syncStatus();
    };
    return;
  }
  const last = +rawGet(SYNC_LAST) || 0;
  el.innerHTML = `<p class="sync-ok"><span class="dot${syncLastErr ? ' bad' : ''}"></span>${syncLastErr ? esc(syncLastErr) : syncBusy ? 'Συγχρονισμός…' : last ? 'Συγχρονισμένο · τελευταία φορά ' + new Date(last).toLocaleString('el-GR', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : 'Συνδεδεμένο'}</p>
    <p class="hint">Γίνεται αυτόματα όταν ανοίγεις την εφαρμογή, όταν επιστρέφεις σε αυτήν και λίγα δευτερόλεπτα μετά από κάθε αλλαγή. Αν δουλέψεις σε δύο συσκευές ταυτόχρονα, κρατιέται η πιο πρόσφατη αλλαγή ανά τμήμα.</p>
    <div class="sync-row"><button class="btn btn-navy" id="sync-now">Συγχρόνισε τώρα</button><button class="btn btn-ghost" id="sync-off">Αποσύνδεση αυτής της συσκευής</button></div>`;
  $('#sync-now').onclick = async () => { const r = await syncNow(); if (r.changed) route(); };
  $('#sync-off').onclick = () => { if (!confirm('Να σταματήσει ο συγχρονισμός σε αυτή τη συσκευή; Η πρόοδος εδώ μένει.')) return; rawSet(SYNC_PAT, null); rawSet(SYNC_GIST, null); rawSet('pmp8.sync.manualoff', '1'); syncStatus(); };
}
