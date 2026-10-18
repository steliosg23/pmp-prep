/* ════════════════════════════════════════════════════════════════════
   PMP Prep — study tools
   Exam simulator, mistakes review (spaced repetition), practice by ECO
   task, flexible study plan, formula drills and visual labs.
   Shares the globals of index.html (CH, $, $$, esc, store, IC, getJSON…).
   ════════════════════════════════════════════════════════════════════ */

/* ── ECO 2026 tasks (from Appendix Δ of the book) ─────────────────── */
const ECO = {
  P1:'Κοινό όραμα', P2:'Διαχείριση συγκρούσεων', P3:'Καθοδήγηση ομάδας', P4:'Εμπλοκή stakeholders',
  P5:'Ευθυγράμμιση προσδοκιών', P6:'Διαχείριση προσδοκιών', P7:'Μεταφορά γνώσης', P8:'Επικοινωνία',
  PR1:'Ενοποιημένο σχέδιο & delivery', PR2:'Scope', PR3:'Παράδοση αξίας', PR4:'Πόροι', PR5:'Προμήθειες',
  PR6:'Χρηματοοικονομικά', PR7:'Ποιότητα', PR8:'Χρονοδιάγραμμα', PR9:'Αξιολόγηση κατάστασης', PR10:'Κλείσιμο έργου',
  BE1:'Governance', BE2:'Compliance', BE3:'Έλεγχος αλλαγών', BE4:'Εμπόδια & issues', BE5:'Κίνδυνοι',
  BE6:'Συνεχής βελτίωση', BE7:'Οργανωσιακή αλλαγή', BE8:'Εξωτερικό περιβάλλον'
};
const DOMAINS = [
  {k:'P',  name:'People', gr:'Άνθρωποι', w:.33},
  {k:'PR', name:'Process', gr:'Διαδικασίες', w:.41},
  {k:'BE', name:'Business Environment', gr:'Επιχειρηματικό περιβάλλον', w:.26}
];
const domOf = t => (t || '').replace(/\d+$/, '');
const BANDS = [[75, 'Above Target', 'at'], [65, 'Target', 't'], [50, 'Below Target', 'bt'], [0, 'Needs Improvement', 'ni']];
const bandOf = p => BANDS.find(b => p >= b[0]);

/* ── question bank (all chapters + ECO set), loaded once ───────────── */
let BANK = null;
async function loadBank(){ if (!BANK) BANK = await getJSON('docs/bank.json'); return BANK; }
const shuffleArr = a => { a = a.slice(); for (let k = a.length - 1; k > 0; k--){ const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
function prepQ(q){   /* shuffle options and relabel A–D */
  const L = 'ABCDEFGH', opts = {}, wrong = {}; let right = null;
  shuffleArr(Object.keys(q.options)).forEach((k, n) => {
    opts[L[n]] = q.options[k]; if (k === q.correct) right = L[n];
    if (q.wrong && q.wrong[k]) wrong[L[n]] = q.wrong[k];
  });
  return Object.assign({}, q, {options: opts, correct: right, wrong});
}

/* ── answer log + spaced repetition of mistakes ────────────────────── */
const ANS = 'pmp8.answers.v1', SRS = 'pmp8.srs.v1', DAY = 864e5, STEPS = [1, 3, 7];
function logAnswer(q, ok){
  if (!q || !q.id) return;
  const log = store.get(ANS, []); log.push({id:q.id, task:q.task, ok:ok ? 1 : 0, t:Date.now()});
  if (log.length > 5000) log.splice(0, log.length - 5000);
  store.set(ANS, log);
  const s = store.get(SRS, {}), cur = s[q.id];
  if (!ok) s[q.id] = {step:0, due:Date.now() + STEPS[0] * DAY, streak:0};
  else if (cur){
    cur.streak = (cur.streak || 0) + 1;
    if (cur.streak >= 2) delete s[q.id];             /* learned: two correct in a row */
    else { cur.step = Math.min(cur.step + 1, STEPS.length - 1); cur.due = Date.now() + STEPS[cur.step] * DAY; }
  }
  store.set(SRS, s);
}
const srsDue = () => { const s = store.get(SRS, {}), now = Date.now(); return Object.keys(s).filter(id => s[id].due <= now); };
const srsAll = () => Object.keys(store.get(SRS, {}));

/* ── a reusable question runner (review, task practice) ────────────── */
function runQuestions({qs, title, back, backLabel, onDone}){
  let i = 0, correct = 0, answered = false;
  qs = qs.map(prepQ);
  const render = () => {
    const q = qs[i], keys = Object.keys(q.options);
    app.innerHTML = `
      <div class="quiz">
        <div class="qprog">
          <button class="back" data-nav="${back}">${IC.left} ${esc(backLabel)}</button>
          <div class="track"><div class="fill" style="width:${i / qs.length * 100}%"></div></div>
          <span>${i + 1} / ${qs.length}</span>
        </div>
        <p class="eyebrow">${esc(title)}</p>
        <div class="quiz-card">
          <p class="qtitle">${q.task ? esc(q.task + ' · ' + (ECO[q.task] || '')) : ''}${q.ch ? ' · Κεφ. ' + pad2(q.ch) : ''}</p>
          ${q.scenario ? `<p class="qscen">${esc(q.scenario)}</p>` : ''}
          <p class="qtext">${esc(q.q)}</p>
          <div id="opts">${keys.map(k => `<button class="opt" data-k="${k}"><span class="key">${k}</span><span>${esc(q.options[k])}</span></button>`).join('')}</div>
          <div id="after"></div>
        </div>
      </div>`;
    $$('.opt').forEach(btn => btn.onclick = () => {
      if (answered) return; answered = true;
      const pick = btn.dataset.k, right = q.correct, ok = pick === right;
      if (ok) correct++;
      logAnswer(q, ok);
      $$('.opt').forEach(b => { b.disabled = true; if (b.dataset.k === right) b.dataset.mark = 'right'; else if (b.dataset.k === pick) b.dataset.mark = 'wrong'; });
      const last = i === qs.length - 1;
      $('#after').innerHTML = `
        <div class="why"><b>${ok ? 'Σωστά.' : 'Η σωστή είναι η ' + right + '.'}</b> ${esc(q.why)}
          ${!ok && q.wrong[pick] ? `<span class="no"><b>Γιατί όχι η ${pick}:</b> ${esc(q.wrong[pick])}</span>` : ''}</div>
        <div class="qfoot"><button class="btn btn-gold" id="next">${last ? 'Τέλος' : 'Επόμενη →'}</button></div>`;
      $('#next').onclick = () => { if (last) return onDone(correct, qs.length); i++; answered = false; render(); scrollTo(0, 0); };
      $('#next').focus({preventScroll:true});
    });
  };
  render();
}

/* ════════════════════════════════════════════════════════════════════
   Practice hub
   ════════════════════════════════════════════════════════════════════ */
async function viewPractice(){
  setView('practice'); scrollTo(0, 0);
  const due = srsDue().length, pending = srsAll().length, hist = store.get('pmp8.exam.hist', []);
  const cur = store.get('pmp8.exam.cur', null);
  const tile = (nav, ico, t, s, extra = '') => `<button class="lib-item" data-nav="${nav}"><span class="lib-ico">${ico}</span><span class="lib-t">${t}</span><span class="lib-s">${s}${extra}</span></button>`;
  app.innerHTML = `
    <section class="prog-head">
      <p class="eyebrow">Εξάσκηση</p>
      <h1>Προετοιμασία για την εξέταση</h1>
      <p>Προσομοίωση εξέτασης, επανάληψη λαθών, εξάσκηση ανά ECO task, τύποι και οπτικά εργαλεία κατανόησης.</p>
    </section>
    <div class="lib-group"><h2>Εξέταση</h2><div class="lib-grid">
      ${cur ? tile('#/exam/run', IC.play, 'Συνέχισε την προσομοίωση', `Ερώτηση ${(cur.pos || 0) + 1} από ${cur.ids.length} · απομένουν ${Math.round(cur.left / 60)}′`) : ''}
      ${tile('#/exam', IC.quiz, 'Προσομοιωτής εξέτασης', '180 ερωτήσεις · 240′ · 3 sections · ή mini mock 60', hist.length ? ` · ${hist.length} προσπάθειες, τελευταία ${hist[hist.length - 1].pct}%` : '')}
      ${tile('#/review', IC.undo, 'Τα λάθη μου', due ? `<b class="due">${due} για επανάληψη σήμερα</b> · ${pending} συνολικά` : (pending ? `${pending} σε αναμονή · καμία για σήμερα` : 'Κάθε λάθος επιστρέφει μετά από 1, 3 και 7 ημέρες'))}
    </div></div>
    <div class="lib-group"><h2>Στοχευμένη εξάσκηση</h2><div class="lib-grid">
      ${tile('#/tasks', IC.list, 'Εξάσκηση ανά ECO task', '26 tasks · δες πού είσαι αδύναμος και εξασκήσου εκεί')}
      ${tile('#/drills', IC.check, 'Ασκήσεις τύπων', 'EVM, PERT, float, κανάλια, EMV · νέοι αριθμοί κάθε φορά')}
      ${tile('#/cards', IC.cards, 'Κάρτες αυτοελέγχου', 'Οι όροι του βιβλίου ως flashcards')}
    </div></div>
    <div class="lib-group"><h2>Οπτικά εργαλεία κατανόησης</h2><div class="lib-grid">
      ${tile('#/lab/pmbok', IC.viz, 'Ο χάρτης του PMBOK 8', 'Κεφ. 3 · 6 αρχές · 7 domains · 5 focus areas · 40 processes')}
      ${tile('#/lab/value', IC.viz, 'Από το έργο στην αξία', 'Κεφ. 2 · portfolio/program/project · deliverable → value')}
      ${tile('#/lab/situational', IC.viz, 'Situational δέντρο απόφασης', 'Κεφ. 4 · τα 5 βήματα πάνω σε σενάριο')}
      ${tile('#/lab/approach', IC.viz, 'Επιλογή προσέγγισης', 'Κεφ. 5 · predictive, hybrid ή adaptive;')}
      ${tile('#/lab/finance', IC.viz, 'NPV · ROI · IRR · Payback', 'Κεφ. 6 · τρία έργα, τέσσερις δείκτες')}
      ${tile('#/lab/stakeholders', IC.viz, 'Stakeholders: grid & engagement', 'Κεφ. 8 · power/interest · C → D')}
      ${tile('#/lab/cpm', IC.viz, 'Critical path εργαστήριο', 'Κεφ. 11 · forward / backward pass')}
      ${tile('#/lab/evm', IC.viz, 'EVM εργαστήριο', 'Κεφ. 12 · κούνα PV, EV, AC')}
      ${tile('#/lab/team', IC.viz, 'Ομάδα: Tuckman, RACI, κανάλια', 'Κεφ. 13 · στάδια, leadership, n(n−1)/2')}
      ${tile('#/lab/quality', IC.viz, 'Ποιότητα', 'Κεφ. 14 · control chart, Pareto, CoQ, QA/QC')}
      ${tile('#/lab/risk', IC.viz, 'Ρίσκο', 'Κεφ. 15 · heat map, EMV, 10 στρατηγικές')}
      ${tile('#/lab/contracts', IC.viz, 'Συμβάσεις & κατανομή ρίσκου', 'Κεφ. 16 · από FFP έως CPFF')}
      ${tile('#/lab/conflict', IC.viz, 'Συγκρούσεις: Thomas-Kilmann', 'Κεφ. 17 · οι 5 τεχνικές σε χάρτη')}
      ${tile('#/lab/metrics', IC.viz, 'Burnup, burndown & δείκτες', 'Κεφ. 18 · scope growth · leading/lagging')}
      ${tile('#/lab/flows', IC.viz, 'Ροές σε σωστή σειρά', 'Change control, closing, ADKAR, Kotter, Tuckman…')}
      ${tile('#/lab/maps', IC.viz, 'Εννοιολογικοί χάρτες κεφαλαίων', 'Κάθε κεφάλαιο ως χάρτης ενοτήτων και όρων')}
    </div></div>`;
}

/* ── mistakes review ───────────────────────────────────────────────── */
async function viewReview(){
  setView('practice'); scrollTo(0, 0);
  app.innerHTML = '<div class="loading">Φόρτωση…</div>';
  const bank = await loadBank(), due = new Set(srsDue());
  const qs = shuffleArr(bank.filter(q => due.has(q.id))).slice(0, 20);
  if (!qs.length){
    const n = srsAll().length;
    app.innerHTML = `<div class="quiz"><div class="qprog"><button class="back" data-nav="#/practice">${IC.left} Εξάσκηση</button></div>
      <div class="empty"><b style="font-size:18px;color:var(--heading)">Καμία ερώτηση για σήμερα.</b><br>${n ? `${n} λάθη περιμένουν τη σειρά τους τις επόμενες ημέρες.` : 'Κάθε ερώτηση που απαντάς λάθος — σε quiz, εξάσκηση ή προσομοίωση — έρχεται εδώ μετά από 1, 3 και 7 ημέρες, μέχρι να την απαντήσεις σωστά δύο φορές στη σειρά.'}</div></div>`;
    return;
  }
  runQuestions({qs, title:'Τα λάθη μου · επανάληψη', back:'#/practice', backLabel:'Εξάσκηση', onDone:(c, n) => {
    const left = srsDue().length;
    app.innerHTML = `<div class="result">${ring(Math.round(c / n * 100), c / n >= .7)}<h2>${c}/${n}</h2>
      <p>Όσες απάντησες σωστά θα ξαναέρθουν αργότερα· μετά από δύο σωστές στη σειρά βγαίνουν από τη λίστα.${left ? ` Μένουν ${left} για σήμερα.` : ''}</p>
      <div class="row">${left ? '<button class="btn btn-gold" data-nav="#/review" id="more">Συνέχεια</button>' : ''}<button class="btn btn-ghost" data-nav="#/practice">Εξάσκηση</button></div></div>`;
    const m = $('#more'); if (m) m.onclick = () => viewReview();
  }});
}

/* ── ECO task stats + practice by task ─────────────────────────────── */
function taskStats(){
  const log = store.get(ANS, []), st = {};
  /* weight recent answers: only the last 30 per task count */
  for (let i = log.length - 1; i >= 0; i--){
    const a = log[i]; if (!a.task) continue;
    const s = st[a.task] = st[a.task] || {n:0, ok:0};
    if (s.n < 30){ s.n++; s.ok += a.ok; }
  }
  return st;
}
function ecoPanel(){
  const st = taskStats();
  const dom = DOMAINS.map(d => {
    let n = 0, ok = 0; Object.keys(ECO).filter(t => domOf(t) === d.k).forEach(t => { if (st[t]){ n += st[t].n; ok += st[t].ok; } });
    return Object.assign({n, ok, pct: n ? Math.round(ok / n * 100) : null}, d);
  });
  if (!dom.some(d => d.n)) return '';
  const rows = Object.keys(ECO).map(t => ({t, s: st[t]})).filter(x => x.s)
    .sort((a, b) => a.s.ok / a.s.n - b.s.ok / b.s.n);
  return `<div class="panel">
    <h2>Ανά ECO 2026 domain</h2>
    <p class="hint">Με βάση τις τελευταίες απαντήσεις σου σε quiz, εξάσκηση και προσομοιώσεις. Οι ζώνες είναι ενδεικτικές — το PMI δεν δημοσιεύει όρια.</p>
    <div class="dom-bars">${dom.map(d => `<div class="dom-row">
      <div class="dom-l"><b>${d.name}</b><small>${Math.round(d.w * 100)}% της εξέτασης</small></div>
      <div class="dom-track">${d.pct === null ? '' : `<i class="b-${bandOf(d.pct)[2]}" style="width:${d.pct}%"></i>`}<span class="dom-70"></span></div>
      <div class="dom-v">${d.pct === null ? '—' : d.pct + '%'}<small>${d.pct === null ? '' : bandOf(d.pct)[1]}</small></div></div>`).join('')}</div>
    </div>
    <div class="panel">
      <h2>Ανά ECO task</h2>
      <p class="hint">Από το πιο αδύναμο. Πάτα ένα task για εξάσκηση εκεί.</p>
      <div class="task-list">${rows.slice(0, 12).map(({t, s}) => { const p = Math.round(s.ok / s.n * 100); return `
        <button class="task-row" data-nav="#/tasks/${t}"><span class="tk">${t}</span><span class="tn">${esc(ECO[t])}</span>
          <span class="tb"><i class="b-${bandOf(p)[2]}" style="width:${p}%"></i></span><span class="tp">${p}%<small>${s.n} απ.</small></span></button>`; }).join('')}</div>
      <button class="btn btn-ghost" data-nav="#/tasks" style="margin-top:12px">Όλα τα tasks</button>
    </div>`;
}
async function viewTasks(task){
  setView('practice'); scrollTo(0, 0);
  app.innerHTML = '<div class="loading">Φόρτωση…</div>';
  const bank = await loadBank();
  if (task && ECO[task]){
    const pool = bank.filter(q => q.task === task);
    /* prefer questions not answered recently */
    const seen = new Set(store.get(ANS, []).slice(-400).map(a => a.id));
    const qs = shuffleArr(pool.filter(q => !seen.has(q.id))).concat(shuffleArr(pool.filter(q => seen.has(q.id)))).slice(0, 10);
    return runQuestions({qs, title:`${task} · ${ECO[task]}`, back:'#/tasks', backLabel:'Tasks', onDone:(c, n) => {
      app.innerHTML = `<div class="result">${ring(Math.round(c / n * 100), c / n >= .7)}<h2>${Math.round(c / n * 100)}%</h2>
        <p>${task} · ${esc(ECO[task])}: ${c} από ${n}. Τα λάθη μπήκαν στην επανάληψη.</p>
        <div class="row"><button class="btn btn-gold" id="again">Ξανά</button><button class="btn btn-ghost" data-nav="#/tasks">Όλα τα tasks</button></div></div>`;
      $('#again').onclick = () => viewTasks(task);
    }});
  }
  const st = taskStats(), cnt = {};
  bank.forEach(q => cnt[q.task] = (cnt[q.task] || 0) + 1);
  app.innerHTML = `
    <div class="quiz" style="max-width:860px">
      <div class="qprog"><button class="back" data-nav="#/practice">${IC.left} Εξάσκηση</button></div>
      <h1 class="lesson-title">Εξάσκηση ανά ECO task</h1>
      <p class="hint" style="color:var(--text-2);margin:0 0 18px">10 ερωτήσεις από το task που διαλέγεις, με προτεραιότητα σε όσες δεν έχεις δει πρόσφατα.</p>
      ${DOMAINS.map(d => `<div class="lib-group"><h2>${d.name} · ${Math.round(d.w * 100)}%</h2><div class="task-list">${Object.keys(ECO).filter(t => domOf(t) === d.k).map(t => {
        const s = st[t], p = s ? Math.round(s.ok / s.n * 100) : null;
        return `<button class="task-row" data-nav="#/tasks/${t}"><span class="tk">${t}</span><span class="tn">${esc(ECO[t])}<small>${cnt[t] || 0} ερωτήσεις</small></span>
          <span class="tb">${p === null ? '' : `<i class="b-${bandOf(p)[2]}" style="width:${p}%"></i>`}</span><span class="tp">${p === null ? '—' : p + '%'}</span></button>`; }).join('')}</div></div>`).join('')}
    </div>`;
}

/* ════════════════════════════════════════════════════════════════════
   Exam simulator
   ════════════════════════════════════════════════════════════════════ */
const EXAM_CUR = 'pmp8.exam.cur', EXAM_HIST = 'pmp8.exam.hist';
async function viewExamSetup(){
  setView('practice'); scrollTo(0, 0);
  const hist = store.get(EXAM_HIST, []), cur = store.get(EXAM_CUR, null);
  app.innerHTML = `
    <div class="quiz" style="max-width:820px">
      <div class="qprog"><button class="back" data-nav="#/practice">${IC.left} Εξάσκηση</button></div>
      <p class="eyebrow">Προσομοιωτής</p>
      <h1 class="lesson-title">Προσομοίωση εξέτασης PMP</h1>
      ${cur ? `<div class="exam-resume"><span>Έχεις ανοιχτή προσομοίωση: ερώτηση ${(cur.pos || 0) + 1}/${cur.ids.length}, απομένουν ${Math.round(cur.left / 60)}′.</span>
        <button class="btn btn-gold" data-nav="#/exam/run">Συνέχεια</button><button class="btn btn-ghost" id="ex-drop">Εγκατάλειψη</button></div>` : ''}
      <div class="exam-opts">
        <button class="exam-opt" data-kind="full"><b>Πλήρης εξέταση</b><span>180 ερωτήσεις · 240 λεπτά · 3 sections των 60 · 2 προαιρετικά διαλείμματα 10′</span><small>Κατανομή ECO 2026: People 33% · Process 41% · Business Environment 26%</small></button>
        <button class="exam-opt" data-kind="mini"><b>Mini mock</b><span>60 ερωτήσεις · 80 λεπτά · 1 section</span><small>Ίδια κατανομή domains, για μία συνεδρία μιάμισης ώρας</small></button>
      </div>
      <div class="panel" style="margin-top:20px">
        <h2>Πώς λειτουργεί</h2>
        <ul class="plain">
          <li>Μετά από κάθε διάλειμμα το προηγούμενο section <b>κλειδώνει</b>, όπως στην πραγματική εξέταση — έλεγξε τα flagged πριν συνεχίσεις.</li>
          <li>Δεν βλέπεις τη σωστή απάντηση μέχρι το τέλος· μετά βλέπεις σκορ ανά domain και task, και κάθε ερώτηση με επεξήγηση.</li>
          <li>Η πρόοδος αποθηκεύεται: αν κλείσεις την εφαρμογή, συνεχίζεις από το ίδιο σημείο με τον ίδιο χρόνο.</li>
          <li>Οι ερωτήσεις προέρχονται από το βιβλίο και την τράπεζα της εφαρμογής (${BANK ? BANK.length : '400+'}), με προτεραιότητα σε όσες δεν έχεις δει σε προηγούμενη προσομοίωση.</li>
        </ul>
      </div>
      ${hist.length ? `<div class="panel"><h2>Ιστορικό</h2>${historyChart(hist)}
        <div class="task-list">${hist.slice().reverse().slice(0, 8).map((h, i) => `<button class="task-row" data-nav="#/exam/result/${hist.length - 1 - i}">
          <span class="tk">${h.kind === 'full' ? '180' : '60'}</span><span class="tn">${new Date(h.t).toLocaleDateString('el-GR')}<small>${DOMAINS.map(d => d.k + ' ' + (h.dom[d.k] ?? '—') + '%').join(' · ')}</small></span>
          <span class="tb"><i class="b-${bandOf(h.pct)[2]}" style="width:${h.pct}%"></i></span><span class="tp">${h.pct}%</span></button>`).join('')}</div></div>` : ''}
    </div>`;
  $$('.exam-opt').forEach(b => b.onclick = async () => {
    if (store.get(EXAM_CUR, null) && !confirm('Υπάρχει ανοιχτή προσομοίωση. Να ξεκινήσει νέα;')) return;
    await startExam(b.dataset.kind);
  });
  const d = $('#ex-drop'); if (d) d.onclick = () => { if (confirm('Να εγκαταλειφθεί η ανοιχτή προσομοίωση;')){ store.set(EXAM_CUR, null); viewExamSetup(); } };
  if (!BANK) loadBank().catch(() => {});
}
function historyChart(hist){
  const H = hist.slice(-12), W = 600, Ht = 140, p = {l:30, r:10, t:10, b:22};
  const x = i => p.l + (H.length < 2 ? (W - p.l - p.r) / 2 : i * (W - p.l - p.r) / (H.length - 1));
  const y = v => Ht - p.b - (Ht - p.t - p.b) * v / 100;
  const pts = H.map((h, i) => `${x(i).toFixed(1)},${y(h.pct).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${Ht}">${[50, 65, 75, 100].map(v => `<line class="${v === 75 ? 'gp' : 'gl'}" x1="${p.l}" x2="${W - p.r}" y1="${y(v)}" y2="${y(v)}" ${v === 75 ? 'stroke-dasharray="4 4"' : ''}/><text class="tx" x="2" y="${y(v) + 4}" font-size="11">${v}</text>`).join('')}
    <polyline points="${pts}" fill="none" stroke="var(--sky-ink)" stroke-width="2.5"/>${H.map((h, i) => `<circle cx="${x(i)}" cy="${y(h.pct)}" r="4.5" class="b-${bandOf(h.pct)[2]}"/>`).join('')}</svg>`;
}
async function startExam(kind){
  app.innerHTML = '<div class="loading">Προετοιμασία ερωτήσεων…</div>';
  const bank = await loadBank();
  const total = kind === 'full' ? 180 : 60;
  const used = new Set(store.get(EXAM_HIST, []).flatMap(h => h.ids || []));
  const pick = (dom, n) => {
    const pool = bank.filter(q => domOf(q.task) === dom);
    /* spread across tasks, prefer unseen in previous exams */
    const fresh = shuffleArr(pool.filter(q => !used.has(q.id))), old = shuffleArr(pool.filter(q => used.has(q.id)));
    return fresh.concat(old).slice(0, n);
  };
  const nP = Math.round(total * .33), nBE = Math.round(total * .26), nPR = total - nP - nBE;
  const ids = shuffleArr([...pick('P', nP), ...pick('PR', nPR), ...pick('BE', nBE)]).map(q => q.id);
  const cur = {kind, ids, ans:{}, flag:{}, pos:0, sec:0, secs: kind === 'full' ? 3 : 1, left: kind === 'full' ? 240 * 60 : 80 * 60, started:Date.now(), order:{}};
  ids.forEach(id => { const q = bank.find(x => x.id === id); cur.order[id] = shuffleArr(Object.keys(q.options)); });
  store.set(EXAM_CUR, cur);
  location.hash = '#/exam/run';
}
let examTimer = null;
function stopExamTimer(){ if (examTimer){ clearInterval(examTimer); examTimer = null; } }
async function viewExamRun(){
  setView('exam'); scrollTo(0, 0);
  let cur = store.get(EXAM_CUR, null);
  if (!cur){ location.hash = '#/exam'; return; }
  const bank = await loadBank(), byId = {}; bank.forEach(q => byId[q.id] = q);
  const per = cur.ids.length / cur.secs;
  const secRange = s => [s * per, (s + 1) * per];
  const save = () => store.set(EXAM_CUR, cur);
  let lastTick = Date.now(), onBreak = null;
  stopExamTimer();
  examTimer = setInterval(() => {
    if (!document.body.contains($('#ex-timer'))) return stopExamTimer();
    const now = Date.now(), dt = (now - lastTick) / 1000; lastTick = now;
    if (onBreak){ onBreak.left -= dt; const b = $('#br-left'); if (b) b.textContent = fmt(Math.max(0, onBreak.left)); if (onBreak.left <= 0) endBreak(); return; }
    cur.left -= dt; if (Math.round(cur.left) % 5 === 0) save();
    const el = $('#ex-timer'); if (el){ el.textContent = fmt(Math.max(0, cur.left)); el.classList.toggle('low', cur.left < 600); }
    if (cur.left <= 0){ save(); finishExam(true); }
  }, 1000);
  addEventListener('pagehide', save, {once:true});

  function render(){
    const [a, b] = secRange(cur.sec), pos = Math.min(Math.max(cur.pos, a), b - 1); cur.pos = pos;
    const id = cur.ids[pos], q = byId[id], order = cur.order[id], L = 'ABCDEFGH';
    const pick = cur.ans[id];
    app.innerHTML = `
      <div class="exam">
        <div class="ex-top">
          <span class="ex-sec">${cur.secs > 1 ? `Section ${cur.sec + 1}/${cur.secs}` : 'Mini mock'}</span>
          <span class="ex-n">Ερώτηση ${pos - a + 1} / ${per}</span>
          <span class="ex-timer" id="ex-timer">${fmt(cur.left)}</span>
          <button class="btn btn-ghost ex-grid-btn" id="ex-gridb">${IC.list}<span>Επισκόπηση</span></button>
        </div>
        <div class="quiz-card">
          ${q.scenario ? `<p class="qscen">${esc(q.scenario)}</p>` : ''}
          <p class="qtext">${esc(q.q)}</p>
          <div>${order.map((k, n) => `<button class="opt ex-opt${pick === k ? ' picked' : ''}" data-k="${k}"><span class="key">${L[n]}</span><span>${esc(q.options[k])}</span></button>`).join('')}</div>
        </div>
        <div class="ex-nav">
          <button class="btn btn-ghost" id="ex-prev"${pos === a ? ' disabled' : ''}>← Προηγούμενη</button>
          <button class="btn btn-ghost ex-flag${cur.flag[id] ? ' on' : ''}" id="ex-flag">⚑ ${cur.flag[id] ? 'Flagged' : 'Flag'}</button>
          ${pos === b - 1 ? `<button class="btn btn-gold" id="ex-end">Τέλος section →</button>` : `<button class="btn btn-gold" id="ex-next">Επόμενη →</button>`}
        </div>
      </div>`;
    $$('.ex-opt').forEach(o => o.onclick = () => { cur.ans[id] = o.dataset.k; save(); $$('.ex-opt').forEach(x => x.classList.toggle('picked', x === o)); });
    $('#ex-flag').onclick = () => { cur.flag[id] = !cur.flag[id]; save(); render(); };
    if ($('#ex-prev')) $('#ex-prev').onclick = () => { cur.pos--; save(); render(); };
    if ($('#ex-next')) $('#ex-next').onclick = () => { cur.pos++; save(); render(); scrollTo(0, 0); };
    if ($('#ex-end')) $('#ex-end').onclick = () => reviewSection();
    $('#ex-gridb').onclick = () => reviewSection();
  }
  function reviewSection(){
    const [a, b] = secRange(cur.sec);
    const ids = cur.ids.slice(a, b), un = ids.filter(id => !cur.ans[id]).length, fl = ids.filter(id => cur.flag[id]).length;
    const last = cur.sec === cur.secs - 1;
    app.innerHTML = `
      <div class="exam">
        <div class="ex-top"><span class="ex-sec">${cur.secs > 1 ? `Section ${cur.sec + 1}/${cur.secs}` : 'Mini mock'} · επισκόπηση</span><span class="ex-timer" id="ex-timer">${fmt(cur.left)}</span></div>
        <p class="hint" style="color:var(--text-2)">${un ? `<b>${un} αναπάντητες.</b> ` : ''}${fl ? `${fl} flagged. ` : ''}Πάτα έναν αριθμό για να γυρίσεις.${last ? '' : ' Μετά το διάλειμμα αυτό το section κλειδώνει.'}</p>
        <div class="ex-grid">${ids.map((id, n) => `<button data-go="${a + n}" class="${cur.ans[id] ? 'ans' : ''}${cur.flag[id] ? ' fl' : ''}">${n + 1}</button>`).join('')}</div>
        <div class="legend"><span><i style="background:var(--sky-ink)"></i>απαντημένη</span><span><i style="background:var(--gold)"></i>flagged</span><span><i style="background:var(--line-2)"></i>αναπάντητη</span></div>
        <div class="ex-nav">
          <button class="btn btn-ghost" id="ex-back">← Πίσω στις ερωτήσεις</button>
          ${last ? `<button class="btn btn-gold" id="ex-submit">Υποβολή εξέτασης</button>`
                 : `<button class="btn btn-ghost" id="ex-skipbr">Συνέχεια χωρίς διάλειμμα</button><button class="btn btn-gold" id="ex-break">Διάλειμμα 10′ →</button>`}
        </div>
      </div>`;
    $$('[data-go]').forEach(b => b.onclick = () => { cur.pos = +b.dataset.go; save(); render(); });
    $('#ex-back').onclick = () => render();
    const next = () => { cur.sec++; cur.pos = secRange(cur.sec)[0]; save(); render(); };
    if ($('#ex-submit')) $('#ex-submit').onclick = () => { if (!un || confirm(`Υπάρχουν ${un} αναπάντητες. Υποβολή;`)) finishExam(false); };
    if ($('#ex-skipbr')) $('#ex-skipbr').onclick = () => { if (!un || confirm(`${un} αναπάντητες θα κλειδώσουν. Συνέχεια;`)) next(); };
    if ($('#ex-break')) $('#ex-break').onclick = () => {
      if (un && !confirm(`${un} αναπάντητες θα κλειδώσουν. Συνέχεια;`)) return;
      cur.sec++; cur.pos = secRange(cur.sec)[0]; save();
      onBreak = {left: 600};
      app.innerHTML = `<div class="exam"><div class="result"><p class="eyebrow" style="justify-content:center">Διάλειμμα</p><h2 id="br-left">10:00</h2>
        <p>Σήκω, πιες νερό, ανάπνευσε. Ο χρόνος της εξέτασης δεν τρέχει. <span class="ex-timer" id="ex-timer" style="display:none"></span></p>
        <div class="row"><button class="btn btn-gold" id="br-end">Συνέχεια στο section ${cur.sec + 1}</button></div></div></div>`;
      $('#br-end').onclick = endBreak;
    };
  }
  function endBreak(){ onBreak = null; lastTick = Date.now(); render(); }
  function finishExam(timeout){
    stopExamTimer();
    const res = {kind:cur.kind, t:Date.now(), ids:cur.ids, ans:cur.ans, dom:{}, task:{}, timeout};
    let ok = 0;
    cur.ids.forEach(id => {
      const q = byId[id], good = cur.ans[id] === q.correct; if (good) ok++;
      const d = domOf(q.task); res.dom[d] = res.dom[d] || [0, 0]; res.dom[d][0] += good; res.dom[d][1]++;
      res.task[q.task] = res.task[q.task] || [0, 0]; res.task[q.task][0] += good; res.task[q.task][1]++;
      logAnswer(q, good);
    });
    res.pct = Math.round(ok / cur.ids.length * 100);
    Object.keys(res.dom).forEach(d => res.dom[d] = Math.round(res.dom[d][0] / res.dom[d][1] * 100));
    const hist = store.get(EXAM_HIST, []); hist.push(res); store.set(EXAM_HIST, hist.slice(-30));
    store.set(EXAM_CUR, null);
    location.hash = `#/exam/result/${Math.min(hist.length, 30) - 1}`;
  }
  render();
}
async function viewExamResult(i){
  setView('practice'); scrollTo(0, 0);
  const hist = store.get(EXAM_HIST, []), r = hist[i];
  if (!r){ location.hash = '#/exam'; return; }
  const bank = await loadBank(), byId = {}; bank.forEach(q => byId[q.id] = q);
  const tasks = Object.keys(r.task).sort((a, b) => r.task[a][0] / r.task[a][1] - r.task[b][0] / r.task[b][1]);
  const wrong = r.ids.filter(id => r.ans[id] !== byId[id].correct);
  app.innerHTML = `
    <div class="quiz" style="max-width:860px">
      <div class="qprog"><button class="back" data-nav="#/exam">${IC.left} Προσομοιωτής</button></div>
      <div class="result" style="padding:10px 0 24px">${ring(r.pct, r.pct >= 65)}<h2>${r.pct}%</h2>
        <p>${r.kind === 'full' ? 'Πλήρης εξέταση' : 'Mini mock'} · ${new Date(r.t).toLocaleString('el-GR')}${r.timeout ? ' · έληξε ο χρόνος' : ''}<br>
        Συνολική ένδειξη: <b>${bandOf(r.pct)[1]}</b> <small>(ενδεικτικά όρια · συνήθης στόχος ≥ 75% σταθερά πριν την εξέταση)</small></p></div>
      <div class="panel"><h2>Ανά domain</h2><div class="dom-bars">${DOMAINS.map(d => { const p = r.dom[d.k]; return `<div class="dom-row">
        <div class="dom-l"><b>${d.name}</b><small>${Math.round(d.w * 100)}%</small></div>
        <div class="dom-track">${p == null ? '' : `<i class="b-${bandOf(p)[2]}" style="width:${p}%"></i>`}<span class="dom-70"></span></div>
        <div class="dom-v">${p == null ? '—' : p + '%'}<small>${p == null ? '' : bandOf(p)[1]}</small></div></div>`; }).join('')}</div></div>
      <div class="panel"><h2>Ανά task</h2><p class="hint">Από το πιο αδύναμο. Πάτα για εξάσκηση.</p><div class="task-list">${tasks.map(t => { const p = Math.round(r.task[t][0] / r.task[t][1] * 100); return `
        <button class="task-row" data-nav="#/tasks/${t}"><span class="tk">${t}</span><span class="tn">${esc(ECO[t] || t)}</span><span class="tb"><i class="b-${bandOf(p)[2]}" style="width:${p}%"></i></span><span class="tp">${r.task[t][0]}/${r.task[t][1]}</span></button>`; }).join('')}</div></div>
      <div class="panel"><h2>Λάθη και αναπάντητες (${wrong.length})</h2><p class="hint">Μπήκαν όλες στα «Τα λάθη μου».</p>
        ${wrong.map(id => { const q = byId[id], o = r.ans[id]; return `<details class="ex-rev"><summary><span class="tk">${q.task}</span> ${esc(q.q)}</summary>
          ${q.scenario ? `<p class="qscen">${esc(q.scenario)}</p>` : ''}
          <p><b>Η απάντησή σου:</b> ${o ? esc(q.options[o]) : '<i>καμία</i>'}</p><p><b>Σωστή:</b> ${esc(q.options[q.correct])}</p>
          <div class="why">${esc(q.why)}${o && q.wrong && q.wrong[o] ? `<span class="no"><b>Γιατί όχι:</b> ${esc(q.wrong[o])}</span>` : ''}</div></details>`; }).join('')}
      </div>
      <div class="row" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-gold" data-nav="#/review">Επανάληψη λαθών</button><button class="btn btn-ghost" data-nav="#/exam">Νέα προσομοίωση</button></div>
    </div>`;
}

/* ════════════════════════════════════════════════════════════════════
   Flexible study plan — an ordered queue, no fixed dates
   ════════════════════════════════════════════════════════════════════ */
const PLAN = 'pmp8.plan.v1';
function planSteps(){
  const st = id => chState(id), cardsKnown = store.get('pmp8.cards.v1', {});
  const hist = store.get(EXAM_HIST, []);
  const steps = [];
  steps.push({id:'map', title:'Γύρος 1 · Χαρτογράφηση', sub:'Πέρνα γρήγορα τα μονοσέλιδα όλων των κεφαλαίων, για να ξέρεις πού ζει τι.',
    nav:'#/doc/onepagers', long:false, done: (chState('doc:onepagers').at || 0) > .85});
  CH.forEach(c => {
    const s = st(c.id), cards = CARDS.filter(k => k.ch === c.id), known = cards.filter(k => cardsKnown[k.ch + ':' + k.t]).length;
    const read = s.heard >= .9 || (s.at || 0) >= .9;
    steps.push({id:'ch' + c.id, ch:c.id, title:`Κεφάλαιο ${pad2(c.id)} · ${c.title}`,
      sub: !read ? 'Άκου το μάθημα και διάβασε το κεφάλαιο.' : (s.best === null || s.best < 70) ? 'Δώσε το quiz του βιβλίου (στόχος ≥ 70%).' : 'Κάρτες αυτοελέγχου του κεφαλαίου.',
      nav: !read ? `#/ch/${c.id}` : (s.best === null || s.best < 70) ? `#/ch/${c.id}/quiz/${mainSet(c)}` : `#/ch/${c.id}/cards`,
      long: !read, done: read && s.best !== null && s.best >= 70 && (!cards.length || known / cards.length >= .7)});
  });
  const minis = hist.filter(h => h.kind === 'mini').length, fulls = hist.filter(h => h.kind === 'full');
  steps.push({id:'mini', title:'Γύρος 3 · Mini mock (60)', sub:'Πρώτη μέτρηση σε συνθήκες εξέτασης.', nav:'#/exam', long:true, done: minis > 0});
  [1, 2, 3].forEach(n => steps.push({id:'full' + n, title:`Πλήρης προσομοίωση ${n}/3`, sub: n === 3 ? 'Στόχος: ≥ 75% σε όλα τα domains.' : 'Μετά από κάθε προσομοίωση: ανάλυση λαθών ανά task.', nav:'#/exam', long:true, done: fulls.length >= n}));
  /* remember when each step was first seen done, for the pace estimate */
  const pl = store.get(PLAN, {}); let ch = false;
  steps.forEach(s => { if (s.done && !pl[s.id]){ pl[s.id] = Date.now(); ch = true; } });
  if (ch) store.set(PLAN, pl);
  return steps;
}
function todayCard(){
  const steps = planSteps(), done = steps.filter(s => s.done).length, next = steps.find(s => !s.done);
  const due = srsDue().length;
  const pl = store.get(PLAN, {}), recent = Object.values(pl).filter(t => Date.now() - t < 21 * DAY).length;
  const left = steps.length - done;
  const pace = recent >= 2 ? left / (recent / 3) : null;   /* steps per week over the last 3 weeks */
  const eta = pace ? new Date(Date.now() + pace * 7 * DAY) : null;
  const nextCh = steps.find(s => !s.done && s.ch), cur = nextCh ? nextCh.ch : null;
  const cardsTodo = cur ? CARDS.filter(k => k.ch <= cur && !store.get('pmp8.cards.v1', {})[k.ch + ':' + k.t]).length : 0;
  const shortTasks = [
    due ? {nav:'#/review', t:`Τα λάθη μου · ${due} για σήμερα`, s:'≈ 10–15 λεπτά'} : null,
    cardsTodo ? {nav: cur ? `#/ch/${Math.max(1, cur - 1)}/cards` : '#/cards', t:'Κάρτες αυτοελέγχου', s:'≈ 10 λεπτά · όροι από όσα έχεις διαβάσει'} : null,
    cur && OPS.includes(cur) ? {op:cur, t:`Μονοσέλιδο κεφαλαίου ${pad2(cur)}`, s:'≈ 5 λεπτά · πριν ή μετά το διάβασμα'} : null,
    cur && typeof labsFor === 'function' && labsFor(cur).length > 1 ? {nav:labsFor(cur)[0].h, t:'Οπτικό εργαλείο · ' + labsFor(cur)[0].t, s:'≈ 5–10 λεπτά · παιχνίδι κατανόησης, χωρίς διάβασμα'} : null,
    cur ? {play:cur, t:`Μόνο άκου · κεφάλαιο ${pad2(cur)}`, s:'για τις κουρασμένες μέρες · στον δρόμο ή ξαπλωμένος'} : null,
    {nav:'#/drills', t:'Ασκήσεις τύπων', s:'≈ 10 λεπτά · EVM, PERT, float'}
  ].filter(Boolean).slice(0, 4);
  return `<div class="today">
    <div class="td-head"><span class="rc-k">Σήμερα</span><span class="td-prog">${done}/${steps.length} βήματα${eta ? ` · με τον ρυθμό σου, έτοιμος περίπου ${eta.toLocaleDateString('el-GR', {day:'numeric', month:'long'})}` : ''}</span></div>
    <div class="td-bar"><i style="width:${done / steps.length * 100}%"></i></div>
    ${next ? `<button class="td-main" data-nav="${next.nav}"><span class="td-l">${next.long ? 'Όταν έχεις χρόνο (2–3 ώρες)' : 'Επόμενο βήμα'}</span><b>${esc(next.title)}</b><span>${esc(next.sub)}</span></button>` : '<div class="td-main"><b>Ολοκλήρωσες το πρόγραμμα 🎉</b><span>Κράτα επαφή με λάθη και κάρτες μέχρι την εξέταση.</span></div>'}
    <div class="td-l" style="margin-top:12px">Αν είσαι κουρασμένος ή έχεις μόνο 25 λεπτά</div>
    <div class="td-short">${shortTasks.map(x => `<button ${x.op ? `data-op="${x.op}"` : x.play ? `data-play="${x.play}"` : `data-nav="${x.nav}"`}><b>${esc(x.t)}</b><span>${esc(x.s)}</span></button>`).join('')}</div>
    <p class="td-note">Χωρίς ημερομηνίες: αν χάσεις μέρες, το πρόγραμμα συνεχίζει από εκεί που έμεινες.</p>
  </div>`;
}

/* ════════════════════════════════════════════════════════════════════
   Formula drills
   ════════════════════════════════════════════════════════════════════ */
const rnd = (a, b, s = 1) => Math.round((a + Math.random() * (b - a)) / s) * s;
const eur = v => (v < 0 ? '−€' : '€') + Math.abs(Math.round(v)).toLocaleString('el-GR');
const f2 = v => (Math.round(v * 100) / 100).toLocaleString('el-GR', {minimumFractionDigits:2, maximumFractionDigits:2});
const DRILLS = [
  () => { const BAC = rnd(200, 900, 10) * 1000, pv = rnd(30, 70) / 100, PV = BAC * pv, EV = PV * rnd(80, 115) / 100, AC = EV * rnd(85, 125) / 100;
    return {k:'CPI', g:'EVM', q:`BAC ${eur(BAC)}, PV ${eur(PV)}, EV ${eur(EV)}, AC ${eur(AC)}. Πόσο είναι το CPI;`, a:f2(EV / AC), alts:[f2(AC / EV), f2(EV / PV), f2(PV / AC)],
      w:`CPI = EV / AC = ${eur(EV)} / ${eur(AC)} = ${f2(EV / AC)}. ${EV / AC < 1 ? 'Κάτω από 1: υπέρβαση κόστους.' : 'Πάνω από 1: κάτω από το budget.'}`}; },
  () => { const PV = rnd(50, 400, 5) * 1000, EV = PV * rnd(75, 115) / 100;
    return {k:'SPI', g:'EVM', q:`PV ${eur(PV)}, EV ${eur(EV)}. Πόσο είναι το SPI;`, a:f2(EV / PV), alts:[f2(PV / EV), f2(EV / PV + .1), f2(Math.abs(EV / PV - .12))],
      w:`SPI = EV / PV = ${f2(EV / PV)}. ${EV / PV < 1 ? 'Πίσω χρονικά.' : 'Μπροστά χρονικά.'}`}; },
  () => { const PV = rnd(50, 300, 5) * 1000, EV = PV * rnd(80, 110) / 100, AC = EV * rnd(85, 120) / 100;
    return {k:'CV/SV', g:'EVM', q:`PV ${eur(PV)}, EV ${eur(EV)}, AC ${eur(AC)}. Ποια είναι τα CV και SV;`, a:`CV ${eur(EV - AC)} · SV ${eur(EV - PV)}`,
      alts:[`CV ${eur(AC - EV)} · SV ${eur(PV - EV)}`, `CV ${eur(EV - PV)} · SV ${eur(EV - AC)}`, `CV ${eur(PV - AC)} · SV ${eur(EV - PV)}`],
      w:`CV = EV − AC = ${eur(EV - AC)} · SV = EV − PV = ${eur(EV - PV)}. Αρνητικό = κακό (υπέρβαση κόστους / καθυστέρηση).`}; },
  () => { const BAC = rnd(200, 900, 10) * 1000, EV = BAC * rnd(25, 70) / 100, AC = EV * rnd(90, 125) / 100, cpi = EV / AC;
    return {k:'EAC (τυπική απόκλιση)', g:'EVM', q:`BAC ${eur(BAC)}, EV ${eur(EV)}, AC ${eur(AC)}. Η απόδοση κόστους αναμένεται να συνεχιστεί. Ποιο είναι το EAC;`,
      a:eur(BAC / cpi), alts:[eur(AC + BAC - EV), eur(BAC * cpi), eur(BAC - EV)],
      w:`Όταν η τρέχουσα απόδοση θα συνεχιστεί: EAC = BAC / CPI. CPI = ${f2(cpi)} → EAC = ${eur(BAC / cpi)}.`}; },
  () => { const BAC = rnd(200, 900, 10) * 1000, EV = BAC * rnd(25, 70) / 100, AC = EV * rnd(95, 130) / 100;
    return {k:'EAC (άτυπη απόκλιση)', g:'EVM', q:`BAC ${eur(BAC)}, EV ${eur(EV)}, AC ${eur(AC)}. Η απόκλιση οφειλόταν σε μεμονωμένο γεγονός· το υπόλοιπο θα γίνει με τον αρχικό ρυθμό. Ποιο είναι το EAC;`,
      a:eur(AC + BAC - EV), alts:[eur(BAC / (EV / AC)), eur(BAC + AC), eur(BAC - EV)],
      w:`Άτυπη (μη επαναλαμβανόμενη) απόκλιση: EAC = AC + (BAC − EV) = ${eur(AC)} + ${eur(BAC - EV)} = ${eur(AC + BAC - EV)}.`}; },
  () => { const BAC = rnd(200, 900, 10) * 1000, EV = BAC * rnd(30, 70) / 100, AC = EV * rnd(95, 125) / 100, t = (BAC - EV) / (BAC - AC);
    return {k:'TCPI', g:'EVM', q:`BAC ${eur(BAC)}, EV ${eur(EV)}, AC ${eur(AC)}. Τι απόδοση κόστους χρειάζεται για να τελειώσει το έργο εντός BAC (TCPI);`,
      a:f2(t), alts:[f2((BAC - AC) / (BAC - EV)), f2(EV / AC), f2(t + .15)],
      w:`TCPI = (BAC − EV) / (BAC − AC) = ${eur(BAC - EV)} / ${eur(BAC - AC)} = ${f2(t)}. Πάνω από 1 σημαίνει ότι πρέπει να αποδώσεις καλύτερα από τώρα.`}; },
  () => { const EAC = rnd(300, 900, 10) * 1000, AC = EAC * rnd(25, 70) / 100, BAC = EAC * rnd(85, 102) / 100;
    return {k:'ETC / VAC', g:'EVM', q:`BAC ${eur(BAC)}, EAC ${eur(EAC)}, AC ${eur(AC)}. Ποια είναι τα ETC και VAC;`,
      a:`ETC ${eur(EAC - AC)} · VAC ${eur(BAC - EAC)}`, alts:[`ETC ${eur(BAC - AC)} · VAC ${eur(EAC - BAC)}`, `ETC ${eur(EAC + AC)} · VAC ${eur(BAC - AC)}`, `ETC ${eur(EAC - BAC)} · VAC ${eur(EAC - AC)}`],
      w:`ETC = EAC − AC = ${eur(EAC - AC)} (τι μένει να ξοδευτεί). VAC = BAC − EAC = ${eur(BAC - EAC)} (${BAC - EAC < 0 ? 'αναμενόμενη υπέρβαση' : 'αναμενόμενη εξοικονόμηση'}).`}; },
  () => { const O = rnd(2, 6), M = O + rnd(1, 5), P = M + rnd(3, 12), e = (O + 4 * M + P) / 6;
    return {k:'PERT', g:'Χρονοδιάγραμμα', q:`Αισιόδοξη ${O}, πιθανότερη ${M}, απαισιόδοξη ${P} ημέρες. Ποια είναι η εκτίμηση PERT (beta);`,
      a:f2(e), alts:[f2((O + M + P) / 3), f2((O + 2 * M + P) / 4), f2(M)],
      w:`PERT (beta) = (O + 4M + P) / 6 = (${O} + ${4 * M} + ${P}) / 6 = ${f2(e)}. Η τριγωνική είναι (O + M + P) / 3 = ${f2((O + M + P) / 3)}.`}; },
  () => { const O = rnd(2, 6), P = O + rnd(6, 24);
    return {k:'Τυπική απόκλιση PERT', g:'Χρονοδιάγραμμα', q:`Αισιόδοξη ${O} και απαισιόδοξη ${P} ημέρες. Ποια είναι η τυπική απόκλιση (σ) κατά PERT;`,
      a:f2((P - O) / 6), alts:[f2((P - O) / 3), f2((P + O) / 6), f2((P - O) / 2)], w:`σ = (P − O) / 6 = (${P} − ${O}) / 6 = ${f2((P - O) / 6)}.`}; },
  () => { const ES = rnd(0, 20), d = rnd(2, 9), fl = rnd(0, 6), LS = ES + fl;
    return {k:'Float', g:'Χρονοδιάγραμμα', q:`Μια εργασία διαρκεί ${d} ημέρες, με ES = ${ES} και LS = ${LS}. Ποιο είναι το total float και τα EF / LF;`,
      a:`Float ${fl} · EF ${ES + d} · LF ${LS + d}`, alts:[`Float ${fl + d} · EF ${ES + d} · LF ${LS + d}`, `Float ${fl} · EF ${LS + d} · LF ${ES + d}`, `Float ${Math.max(0, fl - 1)} · EF ${ES + d - 1} · LF ${LS + d - 1}`],
      w:`Float = LS − ES = ${fl}. EF = ES + διάρκεια = ${ES + d}. LF = LS + διάρκεια = ${LS + d}. ${fl === 0 ? 'Float 0: η εργασία είναι στο critical path.' : ''}`}; },
  () => { const n = rnd(5, 25), m = n + rnd(2, 8), c = x => x * (x - 1) / 2;
    return {k:'Κανάλια επικοινωνίας', g:'Επικοινωνία', q:`Η ομάδα μεγαλώνει από ${n} σε ${m} άτομα. Πόσα κανάλια επικοινωνίας προστίθενται;`,
      a:String(c(m) - c(n)), alts:[String(c(m)), String((m - n) * (m - n - 1) / 2 || m - n), String(c(m) - c(n) + m - n)],
      w:`Κανάλια = n(n−1)/2. ${n} άτομα: ${c(n)}. ${m} άτομα: ${c(m)}. Διαφορά: ${c(m) - c(n)}.`}; },
  () => { const p1 = rnd(10, 60), i1 = rnd(10, 90) * 1000, p2 = rnd(10, 60), i2 = rnd(5, 60) * 1000, e = p1 / 100 * -i1 + p2 / 100 * i2;
    return {k:'EMV', g:'Κίνδυνοι', q:`Threat: πιθανότητα ${p1}%, επίπτωση −${eur(i1)}. Opportunity: πιθανότητα ${p2}%, όφελος +${eur(i2)}. Ποιο είναι το συνολικό EMV;`,
      a:(e < 0 ? '−' : '+') + eur(Math.abs(e)), alts:[(e < 0 ? '+' : '−') + eur(Math.abs(e)), '−' + eur(p1 / 100 * i1), '+' + eur(p2 / 100 * i2 + p1 / 100 * i1)],
      w:`EMV = Σ (πιθανότητα × επίπτωση). Threat: ${p1}% × −${eur(i1)} = −${eur(p1 / 100 * i1)}. Opportunity: ${p2}% × ${eur(i2)} = +${eur(p2 / 100 * i2)}. Σύνολο ${(e < 0 ? '−' : '+') + eur(Math.abs(e))}.`}; },
];
function viewDrills(){
  setView('practice'); scrollTo(0, 0);
  const groups = [...new Set(DRILLS.map(f => f().g))];
  let filter = null, n = 0, ok = 0;
  const next = () => {
    let d; do { d = DRILLS[Math.floor(Math.random() * DRILLS.length)](); } while (filter && d.g !== filter);
    const opts = shuffleArr([...new Set([d.a, ...d.alts])].slice(0, 4));
    app.innerHTML = `
      <div class="quiz">
        <div class="qprog"><button class="back" data-nav="#/practice">${IC.left} Εξάσκηση</button><div class="track"><div class="fill" style="width:${n ? ok / n * 100 : 0}%"></div></div><span>${ok}/${n}</span></div>
        <div class="qset">${['Όλα', ...groups].map(g => `<button data-g="${g}"${(filter || 'Όλα') === g ? ' aria-current="true"' : ''}>${g}</button>`).join('')}</div>
        <div class="quiz-card">
          <p class="qtitle">${esc(d.g)} · ${esc(d.k)}</p>
          <p class="qtext">${esc(d.q)}</p>
          <div>${opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>
          <div id="after"></div>
        </div>
      </div>`;
    $$('[data-g]').forEach(b => b.onclick = () => { filter = b.dataset.g === 'Όλα' ? null : b.dataset.g; next(); });
    $$('.opt').forEach(b => b.onclick = () => {
      if ($('.opt[data-mark]')) return;
      const good = opts[+b.dataset.i] === d.a; n++; if (good) ok++;
      $$('.opt').forEach(x => { x.disabled = true; if (opts[+x.dataset.i] === d.a) x.dataset.mark = 'right'; else if (x === b) x.dataset.mark = 'wrong'; });
      $('#after').innerHTML = `<div class="why"><b>${good ? 'Σωστά.' : 'Όχι ακριβώς.'}</b> ${esc(d.w)}</div><div class="qfoot"><button class="btn btn-gold" id="next">Νέα άσκηση →</button></div>`;
      $('#next').onclick = next; $('#next').focus({preventScroll:true});
    });
  };
  next();
}

/* ════════════════════════════════════════════════════════════════════
   Visual labs
   ════════════════════════════════════════════════════════════════════ */
function labShell(title, sub, body){
  setView('practice'); scrollTo(0, 0);
  const bk = typeof labBack === 'function' ? labBack() : {nav:'#/practice', label:'Εξάσκηση'};
  app.innerHTML = `<div class="lab"><div class="qprog"><button class="back" data-nav="${bk.nav}">${IC.left} ${bk.label}</button></div>
    <p class="eyebrow">Οπτικό εργαλείο</p><h1 class="lesson-title">${title}</h1><p class="lab-sub">${sub}</p>${body}</div>`;
}

/* ── EVM lab ───────────────────────────────────────────────────────── */
function labEVM(){
  labShell('EVM εργαστήριο', 'Κούνα τα sliders: τι έπρεπε να έχει γίνει (PV), τι έγινε (EV) και τι κόστισε (AC). Οι δείκτες και η ερμηνεία τους αλλάζουν ζωντανά.', `
    <div class="lab-grid">
      <div class="panel">
        ${[['bac', 'BAC (budget)', 100, 1000, 500, 'k€'], ['pv', 'PV — προγραμματισμένη αξία μέχρι σήμερα', 0, 100, 50, '% του BAC'], ['ev', 'EV — αξία της εργασίας που έγινε', 0, 100, 40, '% του BAC'], ['ac', 'AC — πραγματικό κόστος', 0, 120, 45, '% του BAC']].map(([k, l, a, b, v, u]) => `
          <label class="sl"><span>${l}</span><input type="range" id="evm-${k}" min="${a}" max="${b}" value="${v}"><b id="evm-${k}-v"></b><small>${u}</small></label>`).join('')}
        <div class="evm-bars" id="evm-bars"></div>
      </div>
      <div class="panel"><div class="evm-kpis" id="evm-kpis"></div><div class="why" id="evm-say" style="margin-top:14px"></div></div>
    </div>`);
  const upd = () => {
    const g = k => +$('#evm-' + k).value, BAC = g('bac') * 1000, PV = BAC * g('pv') / 100, EV = BAC * g('ev') / 100, AC = BAC * g('ac') / 100;
    ['bac', 'pv', 'ev', 'ac'].forEach(k => $('#evm-' + k + '-v').textContent = k === 'bac' ? eur(BAC) : eur(BAC * g(k) / 100));
    const cpi = AC ? EV / AC : 0, spi = PV ? EV / PV : 0, eac = cpi ? BAC / cpi : 0, tc = BAC - AC ? (BAC - EV) / (BAC - AC) : 0;
    const max = Math.max(BAC, AC) * 1.05, bar = (l, v, c) => `<div class="eb"><span>${l}</span><div><i class="${c}" style="width:${v / max * 100}%"></i></div><b>${eur(v)}</b></div>`;
    $('#evm-bars').innerHTML = bar('BAC', BAC, 'c-bac') + bar('PV', PV, 'c-pv') + bar('EV', EV, 'c-ev') + bar('AC', AC, 'c-ac') + (eac ? bar('EAC', eac, 'c-eac') : '');
    const kpi = (l, v, good, f) => `<div class="kpi ${good ? 'good' : 'bad'}"><small>${l}</small><b>${v}</b><span>${f}</span></div>`;
    $('#evm-kpis').innerHTML = kpi('CV = EV − AC', eur(EV - AC), EV >= AC, 'κόστος') + kpi('SV = EV − PV', eur(EV - PV), EV >= PV, 'χρόνος (σε αξία)') +
      kpi('CPI = EV / AC', f2(cpi), cpi >= 1, cpi >= 1 ? 'κάτω από budget' : 'υπέρβαση') + kpi('SPI = EV / PV', f2(spi), spi >= 1, spi >= 1 ? 'μπροστά' : 'πίσω') +
      kpi('EAC = BAC / CPI', eur(eac), eac <= BAC, 'πρόβλεψη τελικού κόστους') + kpi('VAC = BAC − EAC', eur(BAC - eac), BAC >= eac, 'τελική απόκλιση') +
      kpi('TCPI = (BAC−EV)/(BAC−AC)', f2(tc), tc <= 1, tc > 1 ? 'πρέπει να βελτιωθείς' : 'εφικτό');
    const q = cpi >= 1 ? (spi >= 1 ? 'μπροστά χρονικά και κάτω από το budget — το καλύτερο σενάριο' : 'πίσω χρονικά αλλά κάτω από το budget')
                       : (spi >= 1 ? 'μπροστά χρονικά αλλά πάνω από το budget — ίσως «αγοράζεις» χρόνο με χρήμα' : 'πίσω χρονικά και πάνω από το budget — χρειάζεται root cause και διορθωτικά');
    $('#evm-say').innerHTML = `<b>Τι σημαίνει:</b> το έργο είναι ${q}. Για κάθε €1 που ξοδεύεις παίρνεις ${f2(cpi)}€ αξίας· παράγεις το ${Math.round(spi * 100)}% της αξίας που είχες προγραμματίσει. Αν συνεχίσεις έτσι, θα τελειώσεις στα ${eur(eac)}.`;
  };
  $$('.sl input').forEach(i => i.oninput = upd); upd();
}

/* ── CPM lab ───────────────────────────────────────────────────────── */
function labCPM(){
  const NET = {A:[], B:['A'], C:['A'], D:['B'], E:['B', 'C'], F:['C'], G:['D', 'E'], H:['F', 'G']};
  let dur = {}, shown = false, picked = new Set();
  const gen = () => { dur = {}; Object.keys(NET).forEach(k => dur[k] = rnd(2, 9)); shown = false; picked = new Set(); };
  const calc = () => {
    const r = {}, ks = Object.keys(NET);
    ks.forEach(k => { const es = Math.max(0, ...NET[k].map(p => r[p].ef)); r[k] = {es, ef:es + dur[k]}; });
    const end = Math.max(...ks.map(k => r[k].ef)), succ = k => ks.filter(x => NET[x].includes(k));
    ks.slice().reverse().forEach(k => { const s = succ(k), lf = s.length ? Math.min(...s.map(x => r[x].ls)) : end; r[k].lf = lf; r[k].ls = lf - dur[k]; r[k].fl = r[k].ls - r[k].es; });
    return {r, end};
  };
  const pos = {A:[60, 150], B:[220, 70], C:[220, 230], D:[380, 40], E:[380, 150], F:[380, 260], G:[540, 90], H:[700, 170]};
  const draw = () => {
    const {r, end} = calc();
    const edges = Object.keys(NET).flatMap(k => NET[k].map(p => {
      const [x1, y1] = pos[p], [x2, y2] = pos[k], crit = shown && r[p].fl === 0 && r[k].fl === 0 && r[p].ef === r[k].es;
      return `<line x1="${x1 + 46}" y1="${y1}" x2="${x2 - 46}" y2="${y2}" class="cpm-e${crit ? ' crit' : ''}" marker-end="url(#arr${crit ? 'c' : ''})"/>`; })).join('');
    const nodes = Object.keys(NET).map(k => { const [x, y] = pos[k], n = r[k], crit = shown && n.fl === 0;
      return `<g class="cpm-n${crit ? ' crit' : ''}${picked.has(k) ? ' pick' : ''}" data-k="${k}" transform="translate(${x - 46},${y - 34})">
        <rect width="92" height="68" rx="10"/><text x="46" y="27" class="nm">${k} · ${dur[k]}η</text>
        ${shown ? `<text x="8" y="16" class="sm">ES ${n.es}</text><text x="84" y="16" class="sm" text-anchor="end">EF ${n.ef}</text><text x="8" y="60" class="sm">LS ${n.ls}</text><text x="84" y="60" class="sm" text-anchor="end">LF ${n.lf}</text><text x="46" y="46" class="fl">float ${n.fl}</text>`
                : `<text x="46" y="48" class="sm">πάτα αν είναι κρίσιμη</text>`}</g>`; }).join('');
    $('#cpm-svg').innerHTML = `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="ah"/></marker>
      <marker id="arrc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="ahc"/></marker></defs>${edges}${nodes}`;
    $$('#cpm-svg .cpm-n').forEach(g => g.onclick = () => { if (shown) return; const k = g.dataset.k; picked.has(k) ? picked.delete(k) : picked.add(k); draw(); });
    const crit = Object.keys(NET).filter(k => r[k].fl === 0);
    $('#cpm-out').innerHTML = shown ? `<b>Critical path:</b> ${crit.join(' → ')} · διάρκεια έργου <b>${end} ημέρες</b>. ${[...picked].sort().join('') === crit.join('') ? '✓ Το βρήκες!' : picked.size ? 'Σύγκρινε με τη δική σου επιλογή (περίγραμμα).' : ''}
      <br><small>Forward pass: ES = max(EF προκατόχων), EF = ES + διάρκεια. Backward pass: LF = min(LS διαδόχων), LS = LF − διάρκεια. Float = LS − ES. Κρίσιμες = float 0.</small>`
      : 'Διάλεξε τις εργασίες που πιστεύεις ότι είναι στο critical path, μετά πάτα «Δείξε τη λύση».';
  };
  labShell('Critical path εργαστήριο', 'Ένα δίκτυο 8 εργασιών με τυχαίες διάρκειες. Βρες το critical path και δες βήμα-βήμα το forward και backward pass.', `
    <div class="panel"><div class="cpm-wrap"><svg id="cpm-svg" viewBox="0 0 760 300" class="cpm"></svg></div>
      <div class="why" id="cpm-out" style="margin-top:12px"></div>
      <div class="qfoot"><button class="btn btn-gold" id="cpm-show">Δείξε τη λύση</button><button class="btn btn-ghost" id="cpm-new">Νέο δίκτυο</button></div></div>`);
  $('#cpm-show').onclick = () => { shown = true; draw(); };
  $('#cpm-new').onclick = () => { gen(); draw(); };
  gen(); draw();
}

/* ── PMBOK 8 map (from chapter 3 of the book) ──────────────────────── */
const PRINCIPLES = [
  {dim:'Proactive', n:'Adopt a Holistic View', gr:'Ολιστική θεώρηση', d:'Το έργο ως σύστημα: κάθε απόφαση επηρεάζει scope, χρόνο, κόστος, ρίσκο και πόρους. Αποφεύγει τοπικές βελτιστοποιήσεις.', dom:['Governance', 'Scope', 'Risk', 'Schedule', 'Finance', 'Stakeholders']},
  {dim:'Proactive', n:'Embed Quality Into Processes and Deliverables', gr:'Ποιότητα ενσωματωμένη', d:'Η ποιότητα χτίζεται στις διαδικασίες — prevention over inspection.', dom:['Governance', 'Scope', 'Risk', 'Schedule', 'Finance', 'Stakeholders']},
  {dim:'Ownership', n:'Be an Accountable Leader', gr:'Υπεύθυνος ηγέτης', d:'Ο PM αναλαμβάνει την ευθύνη για τα αποτελέσματα· δεν μεταθέτει ευθύνες ούτε κλιμακώνει ως διαφυγή.', dom:['Governance', 'Stakeholders', 'Risk']},
  {dim:'Ownership', n:'Build an Empowered Culture', gr:'Ενδυναμωμένη κουλτούρα', d:'Αυτονομία της ομάδας, αφαίρεση εμποδίων, servant leadership.', dom:['Resources', 'Stakeholders', 'Governance']},
  {dim:'Value-Driven', n:'Focus on Value', gr:'Εστίαση στην αξία', d:'Το έργο μετριέται σε αξία που παραδίδεται, όχι σε παραδοτέα που ολοκληρώνονται.', dom:['Governance', 'Scope', 'Finance', 'Stakeholders']},
  {dim:'Value-Driven', n:'Integrate Sustainability Within All Project Areas', gr:'Βιωσιμότητα παντού', d:'Περιβαλλοντικές, κοινωνικές και μακροπρόθεσμες οικονομικές επιπτώσεις — μέρος της έννοιας της αξίας.', dom:['Governance', 'Scope', 'Schedule', 'Finance', 'Stakeholders', 'Resources', 'Risk']},
];
const FOCUS = ['Initiating', 'Planning', 'Executing', 'Monitoring and Controlling', 'Closing'];
const T21 = {
  Governance:[['Initiate Project or Phase'], ['Integrate and Align Project Plans', 'Plan Sourcing Strategy'], ['Manage Project Execution', 'Manage Quality Assurance', 'Manage Project Knowledge'], ['Monitor and Control Project Performance', 'Assess and Implement Changes'], ['Close Project or Phase']],
  Scope:[[], ['Plan Scope Management', 'Elicit and Analyze Requirements', 'Define Scope', 'Develop Scope Structure'], [], ['Monitor and Control Scope', 'Validate Scope'], []],
  Schedule:[[], ['Plan Schedule Management', 'Develop Schedule'], [], ['Monitor and Control Schedule'], []],
  Finance:[[], ['Plan Financial Management', 'Estimate Costs', 'Develop Budget'], [], ['Monitor and Control Finances'], []],
  Stakeholders:[['Identify Stakeholders'], ['Plan Stakeholder Engagement', 'Plan Communications Management'], ['Manage Stakeholder Engagement', 'Manage Communications'], ['Monitor Stakeholder Engagement', 'Monitor Communications'], []],
  Resources:[[], ['Plan Resource Management', 'Estimate Resources'], ['Acquire Resources', 'Lead the Team'], ['Monitor and Control Resourcing'], []],
  Risk:[[], ['Plan Risk Management', 'Identify Risks', 'Perform Risk Analysis', 'Plan Risk Responses'], ['Implement Risk Responses'], ['Monitor Risks'], []],
};
function labPMBOK(){
  labShell('Ο χάρτης του PMBOK 8', 'Πάτα μια αρχή για να δεις σε ποια domains εκδηλώνεται, ή ένα process για να δεις πού ζει. Τα focus areas είναι εγκάρσια — όχι φάσεις.', `
    <div class="panel"><h2>6 Principles σε 3 Mindset Dimensions</h2>
      <div class="pr-grid">${['Proactive', 'Ownership', 'Value-Driven'].map(dm => `<div class="pr-dim"><h3>${dm}</h3>${PRINCIPLES.map((p, i) => p.dim === dm ? `<button class="pr" data-p="${i}"><b>${p.n}</b><span>${p.gr}</span></button>` : '').join('')}</div>`).join('')}</div>
      <div class="why" id="pr-say" style="margin-top:12px">Διάλεξε μια αρχή.</div></div>
    <div class="panel"><h2>Table 2-1 · 7 Performance Domains × 5 Focus Areas = 40 processes</h2>
      <div class="t21-wrap"><table class="t21"><thead><tr><th></th>${FOCUS.map(f => `<th>${f}</th>`).join('')}<th>#</th></tr></thead><tbody>
        ${Object.keys(T21).map(d => `<tr data-d="${d}"><th>${d}</th>${T21[d].map((ps, fi) => `<td>${ps.map(p => `<button class="proc" data-proc="${esc(p)}" data-d="${d}" data-f="${fi}">${esc(p)}</button>`).join('') || '<span class="dash">—</span>'}</td>`).join('')}<td class="cnt">${T21[d].flat().length}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="why" id="proc-say" style="margin-top:12px">Παρατήρησε: μόνο το Governance έχει processes και στα 5 focus areas. Η ποιότητα, οι προμήθειες και η μέτρηση δεν έχουν δικό τους domain.</div></div>`);
  $$('.pr').forEach(b => b.onclick = () => {
    const p = PRINCIPLES[+b.dataset.p];
    $$('.pr').forEach(x => x.classList.toggle('on', x === b));
    $$('.t21 tr[data-d]').forEach(tr => tr.classList.toggle('hl', p.dom.includes(tr.dataset.d)));
    $('#pr-say').innerHTML = `<b>${esc(p.n)}</b> (${p.dim}) — ${esc(p.d)}<br><small>Εκδηλώνεται κυρίως σε: ${p.dom.join(', ')} (επισημαίνονται στον πίνακα).</small>`;
  });
  $$('.proc').forEach(b => b.onclick = () => {
    $$('.proc').forEach(x => x.classList.toggle('on', x === b));
    $('#proc-say').innerHTML = `<b>${esc(b.dataset.proc)}</b> · Domain: <b>${b.dataset.d}</b> · Focus Area: <b>${FOCUS[+b.dataset.f]}</b>.<br><small>Τα processes είναι nonprescriptive: χρησιμοποιούνται όταν και όσο χρειάζεται, ανεξάρτητα από τη φάση του έργου.</small>`;
  });
}

/* ── Thomas-Kilmann (from chapter 17) ──────────────────────────────── */
const TK = [
  {k:'Competing', old:'Forcing / Directing', x:.15, y:.85, wl:'Win-Lose', when:'Κρίση, ασφάλεια, ηθικά ή κανονιστικά θέματα, όταν χρειάζεται άμεση απόφαση.', not:'Σε καθημερινά θέματα — βλάπτει την εμπιστοσύνη της ομάδας.'},
  {k:'Collaborating', old:'Confronting / Problem-Solving', x:.85, y:.85, wl:'Win-Win', when:'Σημαντικά θέματα ουσίας, όταν υπάρχει χρόνος και εμπιστοσύνη. Η προτιμώμενη προεπιλογή στο PMP.', not:'Όταν χρειάζεται άμεση απόφαση ή το θέμα είναι ασήμαντο.'},
  {k:'Compromising', old:'Reconciling', x:.5, y:.5, wl:'Μερική λύση', when:'Χρονική πίεση, πλευρές με περίπου ίση δύναμη, θέμα που δεν αξίζει πλήρη συνεργασία.', not:'Όταν η σωστή λύση απαιτεί πλήρη ανάλυση.'},
  {k:'Avoiding', old:'Withdrawing', x:.15, y:.15, wl:'Lose-Lose', when:'Ασήμαντο θέμα ή ανάγκη για αποφόρτιση πριν τη συζήτηση.', not:'Όταν το ζήτημα είναι ουσιώδες και θα επανέλθει.'},
  {k:'Accommodating', old:'Smoothing', x:.85, y:.15, wl:'Lose-Win', when:'Όταν η σχέση είναι πιο σημαντική από το θέμα, ή όταν η θέση σου είναι λάθος.', not:'Όταν η αιτία είναι σοβαρή — θα επανεμφανιστεί.'},
];
const TKQ = [
  ['Production incident: το σύστημα είναι εκτός λειτουργίας και δύο leads διαφωνούν για το τι να γίνει.', 'Competing'],
  ['Δύο senior engineers διαφωνούν για την αρχιτεκτονική· η απόφαση πρέπει να παρθεί σε δύο εβδομάδες.', 'Collaborating'],
  ['Δύο stakeholders ίσης επιρροής διαφωνούν για ημερομηνία pilot· η διαφορά είναι μικρή και ο χρόνος πιέζει.', 'Compromising'],
  ['Δύο μέλη διαφωνούν για τη γραμματοσειρά ενός εσωτερικού εγγράφου.', 'Avoiding'],
  ['Καταλαβαίνεις στη συζήτηση ότι η δική σου πρόταση ήταν λάθος.', 'Accommodating'],
];
function labConflict(){
  let qi = Math.floor(Math.random() * TKQ.length);
  labShell('Συγκρούσεις: Thomas-Kilmann', 'Οι 5 τεχνικές σε δύο άξονες: πόσο επιμένεις στη δική σου θέση (assertiveness) και πόσο νοιάζεσαι για τη θέση του άλλου (cooperativeness).', `
    <div class="lab-grid"><div class="panel"><svg viewBox="0 0 420 380" class="tk">
      <line x1="40" y1="340" x2="400" y2="340" class="ax"/><line x1="40" y1="340" x2="40" y2="20" class="ax"/>
      <text x="220" y="372" class="axl">Cooperativeness → (νοιάζομαι για τον άλλον)</text><text x="14" y="180" class="axl" transform="rotate(-90 14 180)">Assertiveness → (επιμένω στη θέση μου)</text>
      ${TK.map((t, i) => `<g class="tk-n" data-i="${i}" transform="translate(${40 + t.x * 340},${340 - t.y * 320})"><circle r="44"/><text y="-2">${t.k}</text><text y="14" class="o">${t.old.split(' / ')[0]}</text></g>`).join('')}
    </svg></div>
    <div class="panel"><div class="why" id="tk-say">Πάτα μια τεχνική.</div>
      <h2 style="margin-top:20px">Δοκίμασε</h2><p class="qtext" id="tk-q" style="font-size:16px"></p><p class="hint">Πάτα την τεχνική που ταιριάζει στον χάρτη.</p><div id="tk-r"></div>
      <button class="btn btn-ghost" id="tk-next">Άλλο σενάριο</button></div></div>`);
  const showQ = () => { $('#tk-q').textContent = TKQ[qi][0]; $('#tk-r').innerHTML = ''; };
  $$('.tk-n').forEach(g => g.onclick = () => {
    const t = TK[+g.dataset.i]; $$('.tk-n').forEach(x => x.classList.toggle('on', x === g));
    $('#tk-say').innerHTML = `<b>${t.k}</b> <small>(παλιότερα: ${t.old}) · ${t.wl}</small><br><b>Πότε:</b> ${t.when}<br><b>Πότε όχι:</b> ${t.not}`;
    const ok = t.k === TKQ[qi][1];
    $('#tk-r').innerHTML = `<div class="why" style="border-left-color:${ok ? 'var(--green)' : 'var(--red)'}"><b>${ok ? 'Σωστά.' : 'Όχι — εδώ ταιριάζει ' + TKQ[qi][1] + '.'}</b></div>`;
  });
  $('#tk-next').onclick = () => { qi = (qi + 1) % TKQ.length; showQ(); };
  showQ();
}

/* ── contract types (from chapter 16) ──────────────────────────────── */
const CONTRACTS = [
  {k:'FFP', n:'Firm Fixed Price', r:.95, ex:'Προμήθεια 200 πιστοποιημένων μετρητών', use:'Καλά ορισμένο scope, ώριμη αγορά, χαμηλή αβεβαιότητα.'},
  {k:'FPIF', n:'Fixed Price Incentive Fee', r:.82, ex:'Κατασκευή με bonus για πρόωρη παράδοση', use:'Κίνητρο για υπεραπόδοση σε χρόνο/κόστος/ποιότητα· share ratio.'},
  {k:'FPEPA', n:'Fixed Price with Economic Price Adjustment', r:.72, ex:'Πρώτες ύλες 5 ετών με προσαρμογή CPI', use:'Πολυετείς συμβάσεις με πληθωρισμό ή συνάλλαγμα.'},
  {k:'T&M', n:'Time & Materials', r:.5, ex:'Staff augmentation, επείγουσα επισκευή', use:'Μικρή διάρκεια, ασαφές scope· συνήθως με ceiling / not-to-exceed.'},
  {k:'CPIF', n:'Cost Plus Incentive Fee', r:.32, ex:'Επιστημονικό έργο με sharing ratio', use:'Αβέβαιο scope με ευθυγράμμιση κινήτρων κόστους.'},
  {k:'CPAF', n:'Cost Plus Award Fee', r:.22, ex:'Consulting με award για συνεργασία', use:'Όταν μετρούν η ποιότητα και η συνεργασία, με υποκειμενική αξιολόγηση.'},
  {k:'CPFF', n:'Cost Plus Fixed Fee', r:.1, ex:'Πρωτότυπο νέας τεχνολογίας', use:'R&D, ελλιπώς ορισμένο scope· ο buyer σηκώνει το ρίσκο κόστους.'},
];
function labContracts(){
  labShell('Συμβάσεις & κατανομή ρίσκου', 'Αριστερά: το ρίσκο κόστους το σηκώνει ο buyer. Δεξιά: ο seller. Όσο πιο σαφές το scope, τόσο πιο δεξιά μπορείς να πας.', `
    <div class="panel"><div class="ct-axis"><span>Buyer ρίσκο</span><span>Seller ρίσκο</span></div>
      <div class="ct-track">${CONTRACTS.map((c, i) => `<button class="ct" data-i="${i}" style="left:${c.r * 100}%">${c.k}</button>`).join('')}</div>
      <div class="ct-scope"><span>Ασαφές / εξελισσόμενο scope</span><span>Σαφές, σταθερό scope</span></div>
      <div class="why" id="ct-say" style="margin-top:16px">Πάτα έναν τύπο σύμβασης.</div>
      <p class="hint" style="margin-top:12px">Γενική τάση, όχι απόλυτος κανόνας: η επιλογή εξαρτάται και από αγορά, ωριμότητα του buyer, πίεση χρόνου και ανοχή ρίσκου (Κεφ. 16).</p></div>`);
  $$('.ct').forEach(b => b.onclick = () => { const c = CONTRACTS[+b.dataset.i]; $$('.ct').forEach(x => x.classList.toggle('on', x === b));
    $('#ct-say').innerHTML = `<b>${c.k} — ${c.n}</b><br><b>Πότε:</b> ${c.use}<br><b>Παράδειγμα:</b> ${c.ex}`; });
}

/* ── chapter concept maps ──────────────────────────────────────────── */
async function labMaps(ch){
  ch = ch || 3;
  labShell('Εννοιολογικός χάρτης κεφαλαίου', 'Στο κέντρο το κεφάλαιο, γύρω οι ενότητές του και οι βασικοί όροι από τις κάρτες. Πάτα έναν όρο για τον ορισμό του.', `
    <div class="card-filters"><select id="map-ch">${CH.map(c => `<option value="${c.id}"${c.id === ch ? ' selected' : ''}>Κεφάλαιο ${pad2(c.id)} · ${esc(c.title)}</option>`).join('')}</select>
      <button class="btn btn-ghost" data-nav="#/ch/${ch}">Άνοιξε το κεφάλαιο</button></div>
    <div class="panel"><div class="cmap-wrap"><svg id="cmap" viewBox="0 0 900 640" class="cmap"><text x="450" y="320" class="cm-load">Φόρτωση…</text></svg></div>
      <div class="why" id="cm-say" style="margin-top:12px">Πάτα έναν όρο (χρυσό) για τον ορισμό του.</div></div>`);
  $('#map-ch').onchange = e => { location.hash = '#/lab/maps/' + e.target.value; };
  const c = chOf(ch); let secs = [];
  try {
    const h = await getText(c.html), d = document.createElement('div'); d.innerHTML = h;
    secs = [...d.querySelectorAll('.section-eyebrow[data-anchor]')].map(el => { let n = el.nextElementSibling; while (n && !/^H[23]$/.test(n.tagName)) n = n.nextElementSibling; return (n ? n.textContent : el.textContent).replace(/\.\s*$/, '').trim(); })
      .filter(t => !/Μαθησιακοί|Practice|Exam Tips|Traps|PMP Mindset|Situational|Βασικές έννοιες|Intro|Ροή/.test(t));
  } catch(e){}
  const terms = CARDS.filter(k => k.ch === ch).slice(0, 14);
  const W = 900, H = 640, cx = W / 2, cy = H / 2;
  const wrapT = (s, n) => { const w = s.split(' '), L = []; let l = ''; w.forEach(x => { if ((l + ' ' + x).trim().length > n){ L.push(l.trim()); l = x; } else l += ' ' + x; }); L.push(l.trim()); return L.slice(0, 3); };
  const ring = (items, r, cls, n) => items.map((t, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / items.length, x = cx + r * Math.cos(a), y = cy + r * .78 * Math.sin(a);
    const L = wrapT(t.t || t, n); return {x, y, L, t, i, cls}; });
  const S = ring(secs.slice(0, 9), 200, 'sec', 18), T = ring(terms, 330, 'term', 16);
  const node = (o, j) => `<g class="cm-${o.cls}" ${o.cls === 'term' ? `data-t="${j}"` : ''} transform="translate(${o.x.toFixed(0)},${o.y.toFixed(0)})">
    <rect x="${-(Math.max(...o.L.map(l => l.length)) * 3.9 + 12)}" y="${-(o.L.length * 8 + 6)}" width="${Math.max(...o.L.map(l => l.length)) * 7.8 + 24}" height="${o.L.length * 16 + 12}" rx="10"/>
    ${o.L.map((l, k) => `<text y="${(k - (o.L.length - 1) / 2) * 16 + 5}">${esc(l)}</text>`).join('')}</g>`;
  const near = o => S.length ? S.reduce((b, s) => Math.hypot(s.x - o.x, s.y - o.y) < Math.hypot(b.x - o.x, b.y - o.y) ? s : b) : {x:cx, y:cy};
  const CL = wrapT(c.title, 22);
  $('#cmap').innerHTML = S.map(s => `<line x1="${cx}" y1="${cy}" x2="${s.x}" y2="${s.y}" class="cm-l"/>`).join('') +
    T.map(t => { const s = near(t); return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" class="cm-l2"/>`; }).join('') +
    `<g class="cm-c" transform="translate(${cx},${cy})"><circle r="78"/>${CL.map((l, k) => `<text y="${(k - (CL.length - 1) / 2) * 17 + 5}">${esc(l)}</text>`).join('')}</g>` +
    S.map(o => node(o)).join('') + T.map((o, j) => node(o, j)).join('');
  $$('#cmap .cm-term').forEach(g => g.onclick = () => { const k = terms[+g.dataset.t]; $$('#cmap .cm-term').forEach(x => x.classList.toggle('on', x === g));
    $('#cm-say').innerHTML = `<b>${esc(k.t)}</b> — ${k.d}`; });
}
