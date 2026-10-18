/* PMP 8 · the chapter tutor: a guided route through every chapter
   (goals → listen → read → see it → traps → book quiz → cards → extra quiz → close).
   Steps tick themselves from what the app already tracks; the rest are one tap.
   Shares globals with index.html, study.js and labs.js. */
'use strict';

IC.tutor = '<svg class="i s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/></svg>';

const TUT = 'pmp8.tutor.v1', TUT_CUR = 'pmp8.tutor.cur', LABS_SEEN = 'pmp8.labs.v1';
let TUTOR = null;
const loadTutor = async () => { if (!TUTOR){ try { TUTOR = await getJSON('docs/tutor.json'); } catch(e){ return {}; } } return TUTOR; };

/* remember which visual tools were opened, so "see it" can tick itself */
addEventListener('hashchange', () => {
  if (/^#\/(lab\/|drills)/.test(location.hash)){ const s = store.get(LABS_SEEN, {}); s[location.hash] = Date.now(); store.set(LABS_SEEN, s); }
});

const tutMarks = n => (store.get(TUT, {})[n] || {});
function tutMark(n, k, v = true){ const t = store.get(TUT, {}); t[n] = Object.assign(t[n] || {}, {[k]:v ? Date.now() : 0}); store.set(TUT, t); }

function tutSteps(n){
  const c = chOf(n); if (!c) return [];
  const st = chState(n), mk = tutMarks(n), T = (TUTOR || {})[n] || {goals:[], tips:[], traps:[]};
  const cards = CARDS.filter(k => k.ch === n), known = store.get('pmp8.cards.v1', {}), nk = cards.filter(k => known[k.ch + ':' + k.t]).length;
  const seen = store.get(LABS_SEEN, {}), labs = labsFor(n), hasOp = OPS.includes(n), hasX = c.quiz && c.quiz.book && c.quiz.extra;
  const mins = Math.max(1, Math.round(c.seconds / 60));
  const S = [];
  S.push({k:'goals', t:'Προσανατολισμός', m:'2′', manual:true, done:!!mk.goals,
    say: T.goals.length ? `Πριν ξεκινήσεις, δες πού πας. Αυτοί είναι οι ${T.goals.length} στόχοι του κεφαλαίου — δεν τους αποστηθίζεις, απλώς τους διαβάζεις για να ξέρεις τι να προσέξεις.` : 'Πριν ξεκινήσεις, ρίξε μια ματιά στο μονοσέλιδο για να ξέρεις τι έρχεται.',
    list:T.goals, acts:[hasOp ? {op:n, t:'Μονοσέλιδο (προαιρετικό)'} : null]});
  S.push({k:'listen', t:'Άκου το μάθημα', m:mins + '′', manual:true, done: st.heard >= .9 || !!mk.listen,
    say:'Άκου το μάθημα χαλαρά, χωρίς σημειώσεις — ο στόχος είναι να σου γίνουν οικείες οι έννοιες. Αν σήμερα είσαι κουρασμένος, αυτό το βήμα αρκεί. Μπορείς και στον δρόμο ή ξαπλωμένος.',
    acts:[{play:n, t:'Άκου το μάθημα'}]});
  S.push({k:'read', t:'Διάβασε το κεφάλαιο', m:'20–30′', manual:true, done: (st.at || 0) >= .9 || !!mk.read,
    say:'Τώρα διάβασε. Εστίασε στα κίτρινα και πράσινα highlights του βιβλίου· ό,τι δεν κάθεται, σημείωσέ το με την πένα. Δεν χρειάζεται να το τελειώσεις σε μία φορά — η πρόοδος κρατιέται.',
    acts:[{nav:'#/ch/' + n, t:'Άνοιξε το κεφάλαιο'}]});
  S.push({k:'see', t:'Δες το οπτικά', m:'5–10′', manual:true, done: labs.some(l => seen[l.h]) || !!mk.see,
    say: labs.length > 1 ? 'Κάνε τις έννοιες εικόνα. Τα εργαλεία αυτά είναι παιχνίδια κατανόησης — όταν κάτι «κάνει κλικ» οπτικά, δεν το ξεχνάς.' : 'Δες τον εννοιολογικό χάρτη του κεφαλαίου: πώς δένουν οι ενότητες και οι βασικοί όροι.',
    acts:labs.map(l => ({nav:l.h, t:l.t, viz:true}))});
  if (T.traps.length || T.tips.length) S.push({k:'traps', t:'Οι παγίδες του κεφαλαίου', m:'5′', manual:true, done:!!mk.traps,
    say:'Πριν το quiz, πέρνα τις παγίδες που ρίχνουν τους υποψηφίους σε αυτό το κεφάλαιο. Διάβασέ τες μία φορά με προσοχή.', traps:T.traps, tips:T.tips});
  S.push({k:'quiz', t:hasX ? 'Quiz του βιβλίου' : 'Quiz κεφαλαίου', m:'10–15′', done: st.best !== null && st.best >= 70,
    say: st.best === null ? 'Κάνε το quiz χωρίς να κοιτάς. Στόχος 70%. Κάθε λάθος μπαίνει αυτόματα στα «Τα λάθη μου» και θα σου ξαναέρθει σε 1, 3 και 7 μέρες.'
      : st.best < 70 ? `Έπιασες ${st.best}%. Μην ξαναδιαβάσεις όλο το κεφάλαιο: δες τις εξηγήσεις των λαθών, ξαναδιάβασε μόνο εκείνες τις ενότητες και ξαναδοκίμασε.` : `Έπιασες ${st.best}% — μπράβο.`,
    acts:[{nav:`#/ch/${n}/quiz/${mainSet(c)}`, t:'Ξεκίνα το quiz', gold:true}]});
  if (cards.length) S.push({k:'cards', t:'Κάρτες αυτοελέγχου', m:'10′', done: nk / cards.length >= .7,
    say:`Γύρνα τις κάρτες του κεφαλαίου και σημείωσε όσες ξέρεις. Ξέρεις ${nk} από ${cards.length}· στόχος το 70%. Όσες δεν ξέρεις θα ξανάρθουν.`,
    acts:[{nav:`#/ch/${n}/cards`, t:'Άνοιξε τις κάρτες'}]});
  if (hasX) S.push({k:'extra', t:'Επιπλέον ερωτήσεις', m:'10–15′', done: st.bestX !== null && st.bestX >= 70,
    say:'Τώρα δοκίμασε τη γνώση σου σε νέες ερωτήσεις, γραμμένες σε ύφος εξέτασης. Εδώ φαίνεται αν το κατάλαβες ή αν θυμάσαι απλώς τις ερωτήσεις του βιβλίου.',
    acts:[{nav:`#/ch/${n}/quiz/extra`, t:'Επιπλέον ερωτήσεις'}]});
  S.push({k:'close', t:'Κλείσιμο κεφαλαίου', m:'5′', manual:true, done:!!mk.close,
    say:'Τελευταία ματιά στο μονοσέλιδο. Μετά κλείσε τα μάτια και πες στον εαυτό σου τρία πράγματα που κράτησες. Αυτό είναι — πάμε στο επόμενο.',
    acts:[hasOp ? {op:n, t:'Μονοσέλιδο'} : null]});
  return S;
}

/* ── the tutor view ────────────────────────────────────────────────── */
async function viewTutor(n){
  setView('tutor'); scrollTo(0, 0);
  const c = chOf(n); if (!c) return viewList();
  store.set(TUT_CUR, n);
  app.innerHTML = '<div class="loading">Φόρτωση…</div>';
  await loadTutor();
  const draw = () => {
    const S = tutSteps(n), cur = S.findIndex(s => !s.done), done = S.filter(s => s.done).length, nextC = chOf(n + 1);
    const act = a => !a ? '' : a.op ? `<button class="btn btn-ghost" data-op="${a.op}">${IC.doc} ${esc(a.t)}</button>`
      : a.play ? `<button class="btn btn-navy" data-play="${a.play}">${IC.play}${IC.pause}<span class="lbl">${esc(a.t)}</span></button>`
      : `<button class="btn ${a.gold ? 'btn-gold' : 'btn-ghost'}" data-nav="${a.nav}">${a.viz ? IC.viz : ''} ${esc(a.t)}</button>`;
    const body = (s, i) => `
      <div class="tu-say"><span class="tu-av">${IC.tutor}</span><p>${esc(s.say)}</p></div>
      ${s.list && s.list.length ? `<ol class="tu-goals">${s.list.map(g => `<li>${esc(g)}</li>`).join('')}</ol>` : ''}
      ${s.traps ? `<div class="tu-traps">${s.traps.map(t => `<div class="tu-trap">${t[0] ? `<b>${esc(t[0])}</b>` : ''}<span>${esc(t[1])}</span></div>`).join('')}</div>
        ${s.tips && s.tips.length ? `<details class="tu-tips"><summary>Exam tips του κεφαλαίου (${s.tips.length})</summary><ul>${s.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>` : ''}` : ''}
      <div class="tu-acts">${s.acts ? s.acts.map(act).join('') : ''}
        ${s.manual ? `<button class="btn ${s.done ? 'btn-ghost' : 'btn-gold'} tu-tick" data-k="${s.k}" data-v="${s.done ? 0 : 1}">${s.done ? 'Αναίρεση' : IC.check + ' Έγινε, επόμενο'}</button>` : ''}</div>`;
    app.innerHTML = `<div class="tutor">
      <div class="qprog"><button class="back" data-nav="#/ch/${n}">${IC.left} Κεφάλαιο ${pad2(n)}</button></div>
      <p class="eyebrow">Ο καθηγητής σου · ροή μελέτης</p>
      <h1 class="lesson-title">${esc(c.title)}</h1>
      <div class="tu-top"><div class="tu-bar"><i style="width:${done / S.length * 100}%"></i></div><span>${done}/${S.length} βήματα</span></div>
      ${cur === -1 ? `<div class="tu-done"><b>Ολοκλήρωσες το κεφάλαιο ${pad2(n)}.</b> ${nextC ? `<button class="btn btn-gold" data-nav="#/ch/${nextC.id}/tutor">Επόμενο: Κεφάλαιο ${pad2(nextC.id)} →</button>` : '<button class="btn btn-gold" data-nav="#/exam">Πάμε στις προσομοιώσεις →</button>'}</div>` : ''}
      <ol class="tu-steps">${S.map((s, i) => `<li class="tu-s${s.done ? ' done' : ''}${i === cur ? ' on' : ''}" data-i="${i}">
        <button class="tu-h" data-i="${i}"><span class="tu-n">${s.done ? IC.check : i + 1}</span><b>${esc(s.t)}</b><small>${s.m}</small></button>
        <div class="tu-b">${body(s, i)}</div></li>`).join('')}</ol>
      <p class="hint" style="margin-top:18px">Δεν υπάρχουν ημερομηνίες. Όπου κι αν βγεις από την εφαρμογή, η ροή σε περιμένει εδώ — και το κουμπί «Συνέχεια ροής» σε φέρνει πίσω από οποιαδήποτε οθόνη.</p>
    </div>`;
    $$('.tu-h').forEach(b => b.onclick = () => { const li = b.closest('.tu-s'); const was = li.classList.contains('on'); $$('.tu-s').forEach(x => x.classList.remove('on')); if (!was) li.classList.add('on'); });
    $$('.tu-tick').forEach(b => b.onclick = () => { tutMark(n, b.dataset.k, b.dataset.v === '1'); draw(); const on = $('.tu-s.on'); if (on) on.scrollIntoView({behavior:'smooth', block:'nearest'}); });
  };
  draw();
}

/* ── "continue the route" pill, visible everywhere else ─────────────── */
function tutorPill(){
  let el = $('#tpill');
  const n = store.get(TUT_CUR, null), h = location.hash;
  const hide = !n || !chOf(n) || /\/tutor$/.test(h) || /^#\/exam\/run/.test(h) || !CH.length;
  if (hide){ if (el) el.remove(); return; }
  if (!el){ el = document.createElement('div'); el.id = 'tpill'; el.className = 'tpill'; document.body.appendChild(el); }
  const S = tutSteps(n), nx = S.find(s => !s.done);
  el.innerHTML = `<button class="tp-go" data-nav="#/ch/${n}/tutor"><small>Ροή · Κεφ. ${pad2(n)}</small><b>${nx ? 'Επόμενο: ' + esc(nx.t) : 'Δες την πρόοδο'}</b></button><button class="tp-x" aria-label="Κλείσε τη ροή">×</button>`;
  el.querySelector('.tp-x').onclick = () => { store.set(TUT_CUR, null); el.remove(); };
}
{ const sv = setView; setView = function(v){ sv(v); setTimeout(tutorPill, 0); if (!TUTOR) loadTutor().then(() => { if (TUTOR) tutorPill(); }); }; }
loadTutor().then(() => tutorPill()).catch(() => {});
function tutorLine(n){
  const S = tutSteps(n), d = S.filter(s => s.done).length, nx = S.find(s => !s.done);
  return d === S.length ? 'Ολοκληρώθηκε ✓' : `${d}/${S.length} βήματα · επόμενο: ${esc(nx.t)}`;
}
