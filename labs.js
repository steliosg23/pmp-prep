/* PMP 8 · more visual understanding labs + chapter → lab links
   Grounded in the book's chapters (2, 4, 5, 6, 8, 13, 14, 15, 17–20).
   Shares globals with index.html and study.js (classic scripts). */
'use strict';

/* ── where the user came from, so "back" returns to the chapter ────── */
let LAB_FROM = null;
document.addEventListener('click', e => {
  const t = e.target.closest('[data-nav^="#/lab/"],[data-nav="#/drills"]');
  if (t && !/^#\/lab\//.test(location.hash)) LAB_FROM = location.hash;
}, true);
function labBack(){
  const m = LAB_FROM && LAB_FROM.match(/^#\/ch\/(\d+)/);
  return m ? {nav:'#/ch/' + m[1], label:'Κεφάλαιο ' + pad2(+m[1])} : {nav:'#/practice', label:'Εξάσκηση'};
}

IC.viz = '<svg class="i s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/><circle cx="7" cy="15" r="1.2"/><circle cx="11" cy="10" r="1.2"/><circle cx="14" cy="13" r="1.2"/><circle cx="19" cy="6" r="1.2"/></svg>';

/* ── chapter → tools ───────────────────────────────────────────────── */
const LAB_LINKS = [
  [2, '#/lab/value', 'Από το έργο στην αξία'], [2, '#/lab/flows/value', 'Σειρά: η αλυσίδα της αξίας'],
  [3, '#/lab/pmbok', 'Ο χάρτης του PMBOK 8'],
  [4, '#/lab/situational', 'Situational δέντρο απόφασης'], [4, '#/lab/flows/situational', 'Σειρά: τα 5 βήματα'],
  [5, '#/lab/approach', 'Επιλογή προσέγγισης'],
  [6, '#/lab/finance', 'NPV · ROI · IRR · Payback'], [6, '#/lab/value', 'Από το έργο στην αξία'],
  [8, '#/lab/stakeholders', 'Stakeholders: grid & engagement'], [8, '#/lab/flows/stakeholder', 'Σειρά: stakeholder cycle'],
  [11, '#/lab/cpm', 'Critical path εργαστήριο'], [11, '#/drills', 'Ασκήσεις τύπων (PERT, float)'],
  [12, '#/lab/evm', 'EVM εργαστήριο'], [12, '#/drills', 'Ασκήσεις τύπων (EVM)'],
  [13, '#/lab/team', 'Ομάδα: Tuckman, RACI, κανάλια'], [13, '#/lab/flows/tuckman', 'Σειρά: τα στάδια Tuckman'],
  [14, '#/lab/quality', 'Ποιότητα: control chart, Pareto, CoQ'],
  [15, '#/lab/risk', 'Ρίσκο: heat map, EMV, responses'], [15, '#/drills', 'Ασκήσεις τύπων (EMV)'],
  [16, '#/lab/contracts', 'Συμβάσεις & κατανομή ρίσκου'],
  [17, '#/lab/conflict', 'Συγκρούσεις: Thomas-Kilmann'], [17, '#/lab/flows/adkar', 'Σειρά: ADKAR'], [17, '#/lab/flows/kotter', 'Σειρά: Kotter 8 βήματα'],
  [18, '#/lab/metrics', 'Burnup, burndown & δείκτες'], [18, '#/lab/evm', 'EVM εργαστήριο'],
  [19, '#/lab/flows/change', 'Σειρά: change control'],
  [20, '#/lab/flows/closing', 'Σειρά: closing activities'],
  [21, '#/lab/situational', 'Situational δέντρο απόφασης'],
];
function labsFor(ch){
  const l = LAB_LINKS.filter(x => x[0] === ch).map(x => ({h:x[1], t:x[2]}));
  l.push({h:'#/lab/maps/' + ch, t:'Εννοιολογικός χάρτης'});
  return l;
}
function labButtons(ch, cls){
  return labsFor(ch).map(l => `<button class="btn ${cls}" data-nav="${l.h}">${IC.viz} ${esc(l.t)}</button>`).join('');
}

/* ── generic: classify items into buckets ──────────────────────────── */
function sortGame(host, {buckets, items, ask}){
  let order, i, ok;
  const start = () => { order = shuffleArr(items); i = 0; ok = 0; show(); };
  const show = () => {
    if (i >= order.length){
      host.innerHTML = `<div class="sg"><p class="sg-done"><b>${ok}/${order.length}</b> σωστά ${ok === order.length ? '— άψογα.' : ''}</p>
        <button class="btn btn-gold sg-again">Ξανά με άλλη σειρά</button></div>`;
      host.querySelector('.sg-again').onclick = start; return;
    }
    const it = order[i];
    host.innerHTML = `<div class="sg"><div class="sg-top"><span>${i + 1} / ${order.length}</span><span>Σωστά ${ok}</span></div>
      ${ask ? `<p class="hint">${ask}</p>` : ''}<p class="sg-item">${esc(it[0])}</p>
      <div class="sg-b">${buckets.map((b, k) => `<button class="opt sg-o" data-k="${k}">${esc(b)}</button>`).join('')}</div><div class="sg-after"></div></div>`;
    host.querySelectorAll('.sg-o').forEach(b => b.onclick = () => {
      if (host.querySelector('.sg-o[data-mark]')) return;
      const good = +b.dataset.k === it[1]; if (good) ok++;
      host.querySelectorAll('.sg-o').forEach(x => { x.disabled = true; if (+x.dataset.k === it[1]) x.dataset.mark = 'right'; else if (x === b) x.dataset.mark = 'wrong'; });
      host.querySelector('.sg-after').innerHTML = `<div class="why"><b>${good ? 'Σωστά.' : 'Όχι — ' + esc(buckets[it[1]]) + '.'}</b> ${it[2] ? esc(it[2]) : ''}</div>
        <div class="qfoot"><button class="btn btn-gold sg-next">Επόμενο →</button></div>`;
      host.querySelector('.sg-next').onclick = () => { i++; show(); };
    });
  };
  start();
}

/* ── generic: put steps in order ───────────────────────────────────── */
function orderGame(host, steps){
  let pool, done, miss;
  const start = () => { pool = shuffleArr(steps.map((s, k) => k)); done = []; miss = 0; draw(); };
  const draw = () => {
    const fin = done.length === steps.length;
    host.innerHTML = `<div class="og">
      <ol class="og-list">${done.map(k => `<li><b>${esc(steps[k][0])}</b>${fin && steps[k][1] ? `<span>${esc(steps[k][1])}</span>` : ''}</li>`).join('')}
        ${fin ? '' : `<li class="og-slot">Ποιο έρχεται ${done.length ? 'μετά' : 'πρώτο'};</li>`}</ol>
      ${fin ? `<div class="why"><b>${miss ? `Ολοκληρώθηκε με ${miss} λάθος${miss > 1 ? 'η' : ''}.` : 'Τέλεια σειρά, χωρίς λάθος.'}</b> Διάβασε τι κάνει κάθε βήμα παραπάνω.</div>`
            : `<div class="og-pool">${pool.map(k => `<button class="og-c" data-k="${k}">${esc(steps[k][0])}</button>`).join('')}</div>`}
      <div class="qfoot"><button class="btn btn-ghost og-re">Ανακάτεψε ξανά</button>${fin ? '' : '<button class="btn btn-ghost og-show">Δείξε τη σειρά</button>'}</div></div>`;
    host.querySelectorAll('.og-c').forEach(b => b.onclick = () => {
      const k = +b.dataset.k;
      if (k === done.length){ done.push(k); pool = pool.filter(x => x !== k); draw(); }
      else { miss++; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
    });
    host.querySelector('.og-re').onclick = start;
    const sh = host.querySelector('.og-show'); if (sh) sh.onclick = () => { miss += steps.length - done.length; done = steps.map((s, k) => k); pool = []; draw(); };
  };
  start();
}

/* ════════════════════════════════════════════════════════════════════
   Ch.2 · from project to value
   ════════════════════════════════════════════════════════════════════ */
const HIER = [
  ['Portfolio', 'Σύνολο από projects, programs, sub-portfolios και operations που διαχειρίζονται ως ομάδα για την επίτευξη στρατηγικών στόχων του οργανισμού.'],
  ['Program', 'Ομάδα σχετικών projects που διαχειρίζεται συντονισμένα για benefits που δεν θα μπορούσαν να επιτευχθούν αν τα έργα λειτουργούσαν απομονωμένα.'],
  ['Project', 'Προσωρινή και μοναδική προσπάθεια. Στο σύγχρονο PMP αξιολογείται με βάση την αξία που δημιουργεί.'],
  ['Operations', 'Συνεχιζόμενες, επαναλαμβανόμενες δραστηριότητες που υποστηρίζουν τη βασική λειτουργία του οργανισμού. Δεν έχουν τέλος.'],
];
const VCHAIN = [
  ['Need / Opportunity', 'Η ανάγκη ή η ευκαιρία που δικαιολογεί την επένδυση.'],
  ['Business Case', 'Τεκμηριώνει γιατί αξίζει η επένδυση (βλ. Κεφ. 6).'],
  ['Project', 'Η προσωρινή προσπάθεια που παράγει τα παραδοτέα.'],
  ['Deliverable', 'Το απτό παραδοτέο. Παράδειγμα: το νέο CRM software.'],
  ['Outcome', 'Το αποτέλεσμα της χρήσης του παραδοτέου. Παράδειγμα: το CRM σε πλήρη λειτουργία με 500 ενεργούς χρήστες.'],
  ['Benefit', 'Το συγκεκριμένο όφελος από το outcome. Παράδειγμα: μείωση customer churn κατά 15%, +€400.000 έσοδα ετησίως.'],
  ['Value', 'Η ευρύτερη αξία για τον οργανισμό. Παράδειγμα: ανταγωνιστικό πλεονέκτημα, φήμη, sustainability, μακροπρόθεσμη αξία για τους stakeholders.'],
];
const VBREAK = [
  [4, 'Παραδοτέο χωρίς outcome', 'Software που παραδόθηκε αλλά χρησιμοποιείται ελάχιστα.'],
  [5, 'Outcome χωρίς benefit', 'Πλατφόρμα σε λειτουργία, χωρίς μείωση των λαθών.'],
  [6, 'Benefit χωρίς value', 'Τοπικά benefits χωρίς συνολική αξία για τον οργανισμό.'],
];
const DOBV = [
  ['Το νέο CRM software', 0, 'Απτό παραδοτέο του έργου.'],
  ['Το CRM σε πλήρη λειτουργία με 500 ενεργούς χρήστες', 1, 'Αποτέλεσμα της χρήσης του παραδοτέου.'],
  ['Μείωση customer churn κατά 15%', 2, 'Μετρήσιμο όφελος από το outcome.'],
  ['Ανταγωνιστικό πλεονέκτημα και βελτιωμένη φήμη', 3, 'Ευρύτερη, μακροπρόθεσμη αξία για τον οργανισμό.'],
  ['Νέα εφαρμογή παραγγελιών για κινητά', 0, 'Το ίδιο το προϊόν που παραδίδεται.'],
  ['Το 60% των παραγγελιών γίνεται πλέον από την εφαρμογή', 1, 'Δείχνει ότι το παραδοτέο χρησιμοποιείται.'],
  ['+€200.000 έσοδα ετησίως από τις παραγγελίες μέσω εφαρμογής', 2, 'Συγκεκριμένο, μετρήσιμο όφελος.'],
  ['Εκπαιδευτικό υλικό και εγχειρίδια για το νέο ERP', 0, 'Απτά παραδοτέα.'],
  ['Το προσωπικό χρησιμοποιεί το ERP στην καθημερινή δουλειά', 1, 'Outcome: υιοθέτηση και χρήση.'],
  ['Μείωση λαθών τιμολόγησης κατά 30%', 2, 'Benefit που προκύπτει από τη χρήση.'],
  ['Μακροπρόθεσμη αξία για τους stakeholders και sustainability', 3, 'Value: το ανώτερο επίπεδο της αλυσίδας.'],
];
function labValue(){
  labShell('Από το έργο στην αξία', 'Πού ζει ένα project μέσα στον οργανισμό και πώς ένα παραδοτέο μετατρέπεται σε αξία. Πάτα τα κουτιά.', `
    <div class="lab-grid">
      <div class="panel"><h2>Portfolio · Program · Project · Operations</h2>
        <div class="hier"><div class="hb h0" data-h="0"><span>Portfolio</span>
          <div class="h-row"><div class="hb h1" data-h="1"><span>Program</span><div class="h-row"><div class="hb h2" data-h="2"><span>Project</span></div><div class="hb h2" data-h="2"><span>Project</span></div></div></div>
            <div class="hb h2" data-h="2"><span>Project</span></div><div class="hb h3" data-h="3"><span>Operations</span></div></div></div></div>
        <div class="why" id="h-say" style="margin-top:12px">Συχνά Portfolio → Program → Project, αλλά δεν είναι υποχρεωτική αλυσίδα: ένα project μπορεί να ανήκει απευθείας σε portfolio, όπως δείχνει το σχήμα.</div></div>
      <div class="panel"><h2>Η αλυσίδα της αξίας</h2>
        <div class="vchain">${VCHAIN.map((v, k) => `<button class="vc" data-v="${k}">${esc(v[0])}</button>`).join('<i class="vc-a">→</i>')}</div>
        <div class="why" id="vc-say" style="margin-top:12px">Κάθε βήμα μετασχηματίζει το προηγούμενο σε κάτι υψηλότερης αξίας. Πάτα ένα βήμα.</div>
        <p class="hint" style="margin-top:14px">Πού μπορεί να σπάσει η αλυσίδα;</p>
        <div class="chips">${VBREAK.map((b, k) => `<button class="chip-b" data-b="${k}">${esc(b[1])}</button>`).join('')}</div></div>
    </div>
    <div class="panel"><h2>Deliverable, Outcome, Benefit ή Value;</h2><div id="dobv"></div></div>`);
  $$('.hb').forEach(b => b.onclick = e => { e.stopPropagation(); const h = HIER[+b.dataset.h];
    $$('.hb').forEach(x => x.classList.toggle('on', x.dataset.h === b.dataset.h));
    $('#h-say').innerHTML = `<b>${h[0]}</b> — ${esc(h[1])}`; });
  const vc = k => { $$('.vc').forEach((x, j) => { x.classList.toggle('on', j === k); x.classList.remove('broken'); }); $$('.vc-a').forEach(a => a.classList.remove('broken')); };
  $$('.vc').forEach(b => b.onclick = () => { const k = +b.dataset.v; vc(k); $('#vc-say').innerHTML = `<b>${esc(VCHAIN[k][0])}</b> — ${esc(VCHAIN[k][1])}`; });
  $$('.chip-b').forEach(b => b.onclick = () => { const [k, t, ex] = VBREAK[+b.dataset.b]; vc(-1);
    $$('.vc')[k - 1].classList.add('on'); $$('.vc')[k].classList.add('broken'); $$('.vc-a')[k - 1].classList.add('broken');
    $('#vc-say').innerHTML = `<b>${esc(t)}.</b> ${esc(ex)} Ο σύγχρονος PM παρακολουθεί και τα τέσσερα επίπεδα, όχι μόνο τα παραδοτέα.`; });
  sortGame($('#dobv'), {buckets:['Deliverable', 'Outcome', 'Benefit', 'Value'], items:DOBV});
}

/* ════════════════════════════════════════════════════════════════════
   Ch.4 · situational decision tree
   ════════════════════════════════════════════════════════════════════ */
const SIT_STEPS = [
  ['Ανάγνωση πλήρους σεναρίου', 'Κάθε context clue μετράει: τύπος έργου, φάση, delivery approach, σχέση PM με sponsor και ομάδα.'],
  ['Domain και task', 'Τοποθέτησε την ερώτηση σε People, Process ή Business Environment, και σε task του ECO 2026.'],
  ['Φίλτρα mindset', 'Proactive, Ownership, Value-Driven: ποια επιλογή είναι προληπτική, ποια αναδεικνύει ευθύνη, ποια εξυπηρετεί αξία.'],
  ['Αποκλεισμός extreme options', 'Απόλυτες διατυπώσεις ή μηδενική ενέργεια είναι συνήθως distractors, χωρίς σαφή ένδειξη από το σενάριο.'],
  ['Η πιο σωστή', 'Αν μείνουν δύο κοντινές: heuristic άνθρωποι → διαδικασία → εργαλείο (όχι formal PMI rule· σε change control, compliance ή safety η διαδικασία μπορεί να προηγείται).'],
];
const SIT = [
  {s:'Σε hybrid έργο, ένα βασικό μέλος της ομάδας αρχίζει να καθυστερεί τις παραδόσεις του και δείχνει αποσυρμένο στα meetings. Ο sponsor δεν το έχει αντιληφθεί ακόμη. Τι κάνεις πρώτα;',
   clues:['hybrid έργο', 'βασικό μέλος', 'αρχίζει — νωρίς', 'ο sponsor δεν ξέρει'], dom:'People — η ουσία είναι ένας άνθρωπος, όχι το schedule.',
   o:[['Ζητάς από τον functional manager να τον αντικαταστήσει', 3, 'Ownership: κλιμάκωση ως διαφυγή — ο PM δεν μεταθέτει την ευθύνη πριν καταλάβει τι συμβαίνει.'],
      ['Περιμένεις· μάλλον θα διορθωθεί μόνο του', 4, 'Μηδενική ενέργεια.'],
      ['Συζητάς ιδιωτικά μαζί του για να καταλάβεις τι συμβαίνει', 0, 'Άνθρωποι πρώτα: κατανόηση της αιτίας πριν από οποιοδήποτε μέτρο.'],
      ['Προσθέτεις εβδομαδιαίο status report μόνο γι\' αυτόν', 5, 'Διαδικασία/εργαλείο: δεν αγγίζει την αιτία· χάνει από την επιλογή που ξεκινά από τον άνθρωπο.']]},
  {s:'Κατά το planning, ένας προμηθευτής σε ενημερώνει ότι ίσως υπάρξουν ελλείψεις σε κρίσιμο υλικό σε τρεις μήνες. Τι κάνεις;',
   clues:['planning — υπάρχει χρόνος', '«ίσως» — αβεβαιότητα', 'κρίσιμο υλικό'], dom:'Process — διαχείριση ρίσκου.',
   o:[['Περιμένεις να φανεί αν θα συμβεί και τότε κάνεις fast-tracking', 3, 'Proactive: αντίδραση μετά το γεγονός (reactive).'],
      ['Καταγράφεις το ρίσκο, το αναλύεις με την ομάδα και σχεδιάζεις response', 0, 'Προληπτικό, με ευθύνη, μέσα από τη διαδικασία risk management.'],
      ['Ακυρώνεις αμέσως όλες τις παραγγελίες στον προμηθευτή', 4, 'Ακραία ενέργεια χωρίς ανάλυση.'],
      ['Υπενθυμίζεις στον προμηθευτή ότι η σύμβαση τον δεσμεύει, άρα είναι δικό του πρόβλημα', 3, 'Ownership: μετάθεση ευθύνης· το ρίσκο για το έργο παραμένει δικό σου.']]},
  {s:'Η ομάδα ολοκλήρωσε όλα τα παραδοτέα εγκαίρως και εντός budget, όμως οι χρήστες δεν χρησιμοποιούν το νέο σύστημα. Τι κάνεις;',
   clues:['παραδοτέα έτοιμα', 'εγκαίρως & εντός budget', 'κανείς δεν το χρησιμοποιεί'], dom:'Business Environment — αξία και υιοθέτηση (Deliverable χωρίς Outcome).',
   o:[['Κλείνεις το έργο, αφού τα παραδοτέα έγιναν αποδεκτά', 3, 'Value-Driven: process-driven σκέψη· το έργο μετριέται σε αξία, όχι σε παραδοτέα.'],
      ['Διερευνάς με τους χρήστες γιατί δεν το υιοθετούν και σχεδιάζεις ενέργειες υιοθέτησης με τον sponsor', 0, 'Ξεκινά από τους ανθρώπους και στοχεύει στο outcome και στην αξία.'],
      ['Ζητάς από τη διοίκηση να επιβάλει υποχρεωτική χρήση σε όλους από αύριο', 4, 'Απόλυτη, ακραία λύση χωρίς κατανόηση της αιτίας.'],
      ['Αγοράζεις εργαλείο analytics για να μετρήσεις τη χρήση', 5, 'Εργαλείο: χρήσιμο αργότερα, αλλά χάνει από την επιλογή που ξεκινά από τους ανθρώπους.']]},
];
function labSituational(){
  let si = 0, step = 0;
  labShell('Situational δέντρο απόφασης', 'Τα 5 βήματα του Κεφ. 4 πάνω σε ένα σενάριο: σε κάθε βήμα κόβονται οι επιλογές που δεν περνούν το φίλτρο. Τα σενάρια είναι ενδεικτικά.', `
    <div class="lab-grid sit">
      <div class="panel"><ol class="sit-steps">${SIT_STEPS.map((s, k) => `<li data-s="${k}"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></li>`).join('')}</ol></div>
      <div class="panel"><p class="qtext" id="sit-q" style="font-size:16.5px"></p><div id="sit-clue"></div><div class="sit-opts" id="sit-o"></div>
        <div class="why" id="sit-say" style="margin-top:12px"></div>
        <div class="qfoot"><button class="btn btn-gold" id="sit-next">Επόμενο βήμα →</button><button class="btn btn-ghost" id="sit-new">Άλλο σενάριο</button></div></div>
    </div>`);
  const draw = () => {
    const S = SIT[si];
    $('#sit-q').textContent = S.s;
    $$('.sit-steps li').forEach((li, k) => { li.classList.toggle('on', k === step); li.classList.toggle('past', k < step); });
    $('#sit-clue').innerHTML = step >= 0 ? `<div class="chips">${S.clues.map(c => `<span class="chip-b static">${esc(c)}</span>`).join('')}</div>` : '';
    $('#sit-o').innerHTML = S.o.map((o, k) => {
      const out = (o[1] === 3 && step >= 2) || (o[1] === 4 && step >= 3) || (o[1] === 5 && step >= 4);
      const win = o[1] === 0 && step >= 4;
      return `<div class="sit-o${out ? ' out' : ''}${win ? ' win' : ''}"><span class="L">${'ABCD'[k]}</span><div>${esc(o[0])}${out || win ? `<small>${esc(o[2])}</small>` : ''}</div></div>`; }).join('');
    $('#sit-say').innerHTML = [`<b>Βήμα 1.</b> Υπογράμμισε τα στοιχεία του σεναρίου (επάνω).`, `<b>Βήμα 2.</b> ${esc(S.dom)}`,
      `<b>Βήμα 3.</b> Τα φίλτρα mindset κόβουν ό,τι είναι reactive, μεταθέτει ευθύνη ή εξυπηρετεί τη διαδικασία αντί για την αξία.`,
      `<b>Βήμα 4.</b> Κόβονται οι απόλυτες λύσεις και η αδράνεια.`, `<b>Βήμα 5.</b> Από όσες μένουν, κερδίζει αυτή που ξεκινά από τους ανθρώπους.`][step];
    $('#sit-next').textContent = step < 4 ? 'Επόμενο βήμα →' : 'Από την αρχή';
  };
  $('#sit-next').onclick = () => { step = step < 4 ? step + 1 : 0; draw(); };
  $('#sit-new').onclick = () => { si = (si + 1) % SIT.length; step = 0; draw(); };
  draw();
}

/* ════════════════════════════════════════════════════════════════════
   Ch.5 · approach selector
   ════════════════════════════════════════════════════════════════════ */
function labApproach(){
  const sel = (id, l, opts) => `<label class="sl sel"><span>${l}</span><select id="ap-${id}">${opts.map((o, k) => `<option value="${k}"${k === 1 ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;
  labShell('Επιλογή προσέγγισης', 'Ρύθμισε τα χαρακτηριστικά του έργου και δες προς τα πού γέρνει η επιλογή: Adaptive, Hybrid ή Predictive. Ενδεικτική λογική για κατανόηση — όχι μηχανική αντιστοίχιση.', `
    <div class="lab-grid">
      <div class="panel">
        <label class="sl"><span>Σαφήνεια & σταθερότητα απαιτήσεων</span><input type="range" id="ap-req" min="0" max="100" value="50"><b id="ap-req-v"></b><small>αριστερά: ασαφείς, θα αποσαφηνιστούν με feedback · δεξιά: γνωστές από την αρχή</small></label>
        <label class="sl"><span>Κόστος αλλαγής</span><input type="range" id="ap-chg" min="0" max="100" value="50"><b id="ap-chg-v"></b><small>δεξιά: construction, hardware, φυσικοί περιορισμοί</small></label>
        ${sel('risk', 'Ρίσκο επιπτώσεων', ['Χαμηλό (internal pilot)', 'Μέτριο (customer-facing, financial impact)', 'Υψηλό (safety-critical, regulatory)'])}
        ${sel('dur', 'Διάρκεια', ['< 3 μήνες', '3–12 μήνες', '> 1 έτος'])}
        ${sel('team', 'Κατανομή ομάδας', ['Colocated', 'Distributed, ίδια ζώνη ώρας', 'Distributed, πολλές ζώνες ώρας'])}
        <label class="ck"><input type="checkbox" id="ap-het"> Ετερογενή παραδοτέα (π.χ. hardware + software)</label>
      </div>
      <div class="panel"><div class="ap-bar"><span>Adaptive</span><span>Hybrid</span><span>Predictive</span><i id="ap-needle"></i></div>
        <p class="ap-res" id="ap-res"></p><ul class="ap-why" id="ap-why"></ul></div>
    </div>`);
  const upd = () => {
    const req = +$('#ap-req').value, chg = +$('#ap-chg').value, risk = +$('#ap-risk').value, dur = +$('#ap-dur').value, team = +$('#ap-team').value, het = $('#ap-het').checked;
    $('#ap-req-v').textContent = req < 35 ? 'ασαφείς' : req > 65 ? 'σαφείς' : 'μερικώς'; $('#ap-chg-v').textContent = chg < 35 ? 'χαμηλό' : chg > 65 ? 'υψηλό' : 'μέτριο';
    const f = [(req - 50) / 50, (chg - 50) / 50, [-.6, 0, .8][risk], [-.4, 0, .1][dur], [-.4, 0, .5][team]];
    let s = f.reduce((a, b) => a + b, 0) / f.length * 1.6; s = Math.max(-1, Math.min(1, s));
    if (het || dur === 2) s *= .45;
    const zone = s < -.25 ? 'Adaptive' : s > .25 ? 'Predictive' : 'Hybrid';
    $('#ap-needle').style.left = (50 + s * 46) + '%';
    $('#ap-res').innerHTML = `Γέρνει προς <b>${zone}</b>`;
    const W = [
      req > 65 ? 'Σαφές και σταθερό scope → η predictive σχεδιάζει ολιστικά από την αρχή.' : req < 35 ? 'Το τι θα φτιαχτεί θα αποσαφηνιστεί με παραδόσεις και feedback → adaptive.' : 'Μερικώς γνωστές απαιτήσεις → rolling wave ή συνδυασμός.',
      chg > 65 ? 'Ακριβή αλλαγή (construction, hardware) → predictive.' : chg < 35 ? 'Φθηνή αλλαγή → γρήγορες iterations.' : '',
      ['Χαμηλό ρίσκο: light governance, γρήγορη iteration — adaptive συχνά αρκεί.', 'Μέτριο ρίσκο: formal change control και gates — hybrid συχνά ισορροπεί.', 'Υψηλό ρίσκο: predictive με audit trails και multi-layer approvals· adaptive μόνο με strict governance.'][risk],
      ['< 3 μήνες: adaptive με short iterations ή σύντομος predictive κύκλος.', '3–12 μήνες: rolling wave ή adaptive με release plan.', '> 1 έτος: robust governance, formal change control· hybrid ή adaptive με strong ορόσημα.'][dur],
      ['Colocated: το adaptive είναι φυσικό (standups, pair work).', 'Ίδια ζώνη ώρας: και οι δύο δουλεύουν με σαφή communication protocols.', 'Πολλές ζώνες ώρας: η predictive μειώνει την εξάρτηση από real-time αλληλεπίδραση.'][team],
      het ? 'Ετερογενή παραδοτέα: hardware → predictive, software → adaptive· άρα hybrid.' : '',
    ].filter(Boolean);
    $('#ap-why').innerHTML = W.map(w => `<li>${esc(w)}</li>`).join('');
  };
  $$('.lab input, .lab select').forEach(i => i.oninput = i.onchange = upd); upd();
}

/* ════════════════════════════════════════════════════════════════════
   Ch.6 · NPV / ROI / IRR / Payback
   ════════════════════════════════════════════════════════════════════ */
const FIN_P = {A:['Νέα εφαρμογή', 200, [80, 90, 110, 60]], B:['Process automation', 300, [120, 140, 120, 60]], C:['New product launch', 400, [50, 150, 250, 200]]};
const finCalc = (inv, cf, r) => {
  const npvAt = x => cf.reduce((a, c, t) => a + c / Math.pow(1 + x, t + 1), 0) - inv;
  const pv = cf.map((c, t) => c / Math.pow(1 + r, t + 1)), tot = cf.reduce((a, b) => a + b, 0);
  let lo = -.99, hi = 5, irr = null;
  if (npvAt(lo) > 0 && npvAt(hi) < 0){ for (let k = 0; k < 80; k++){ const m = (lo + hi) / 2; npvAt(m) > 0 ? lo = m : hi = m; } irr = (lo + hi) / 2; }
  let cum = 0, pb = null; cf.forEach((c, t) => { if (pb === null && cum + c >= inv) pb = t + (inv - cum) / c; cum += c; });
  return {pv, npv:npvAt(r), roi:(tot - inv) / inv, irr, pb, tot};
};
function labFinance(){
  let cur = 'A';
  labShell('NPV · ROI · IRR · Payback', 'Τα τρία έργα του Exam Calculation Corner (Κεφ. 6) με cost of capital 10%. Άλλαξε τιμές και δες πώς διαφορετικοί δείκτες κατατάσσουν τα ίδια έργα διαφορετικά.', `
    <div class="panel"><h2>Σύγκριση</h2><div class="t21-wrap"><table class="fin-t" id="fin-t"></table></div>
      <p class="hint" style="margin-top:8px">Χρυσό = καλύτερο ανά δείκτη. Το NPV δείχνει νομισματική αξία, το ROI αγνοεί τον χρόνο, το payback δείχνει ρευστότητα — όχι κερδοφορία.</p></div>
    <div class="lab-grid">
      <div class="panel"><div class="seg" id="fin-seg">${Object.keys(FIN_P).map(k => `<button data-p="${k}">Project ${k}</button>`).join('')}</div>
        <div class="fin-in" id="fin-in"></div></div>
      <div class="panel"><svg viewBox="0 0 420 240" class="fin-svg" id="fin-svg"></svg><div class="evm-kpis" id="fin-k"></div></div>
    </div>`);
  const P = JSON.parse(JSON.stringify(FIN_P)); let r = .10;
  const form = () => {
    const p = P[cur];
    $$('#fin-seg button').forEach(b => b.classList.toggle('on', b.dataset.p === cur));
    $('#fin-in').innerHTML = `<p class="hint">${esc(p[0])} · ποσά σε χιλ. €</p>
      <label class="num"><span>Αρχική επένδυση (Year 0)</span><input type="number" id="fi-0" value="${p[1]}" min="1"></label>
      ${p[2].map((c, t) => `<label class="num"><span>Cash inflow Year ${t + 1}</span><input type="number" id="fi-${t + 1}" value="${c}" min="0"></label>`).join('')}
      <label class="sl" style="margin-top:10px"><span>Cost of capital (r)</span><input type="range" id="fi-r" min="0" max="30" value="${Math.round(r * 100)}"><b id="fi-r-v"></b></label>`;
    $$('#fin-in input').forEach(i => i.oninput = () => { p[1] = Math.max(1, +$('#fi-0').value || 1); p[2] = p[2].map((c, t) => Math.max(0, +$('#fi-' + (t + 1)).value || 0)); r = +$('#fi-r').value / 100; upd(); });
    upd();
  };
  const k = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('el-GR', {minimumFractionDigits:d, maximumFractionDigits:d});
  const upd = () => {
    $('#fi-r-v').textContent = Math.round(r * 100) + '%';
    const R = {}; Object.keys(P).forEach(x => R[x] = finCalc(P[x][1], P[x][2], r));
    const best = (f, hi) => Object.keys(R).filter(x => R[x][f] !== null).sort((a, b) => hi ? R[b][f] - R[a][f] : R[a][f] - R[b][f])[0];
    const bN = best('npv', 1), bR = best('roi', 1), bI = best('irr', 1), bP = best('pb', 0);
    const td = (x, f, v, b) => `<td class="${x === b ? 'best' : ''}">${v}</td>`;
    $('#fin-t').innerHTML = `<thead><tr><th></th><th>Επένδυση</th><th>NPV @${Math.round(r * 100)}%</th><th>ROI</th><th>IRR</th><th>Payback</th></tr></thead><tbody>` +
      Object.keys(R).map(x => `<tr><th>Project ${x}</th><td>€${P[x][1]}K</td>${td(x, 'npv', '€' + k(R[x].npv) + 'K', bN)}${td(x, 'roi', k(R[x].roi * 100) + '%', bR)}${td(x, 'irr', R[x].irr === null ? '—' : k(R[x].irr * 100) + '%', bI)}${td(x, 'pb', R[x].pb === null ? 'δεν ανακτάται' : k(R[x].pb, 2) + ' έτη', bP)}</tr>`).join('') + '</tbody>';
    const p = P[cur], c = R[cur], n = p[2].length, W = 420, H = 240, x0 = 40, y0 = 120, bw = 300 / n;
    let cum = -p[1]; const cums = [cum].concat(p[2].map(v => cum += v));
    const mx = Math.max(p[1], ...p[2], ...cums.map(Math.abs)) * 1.1, sy = v => y0 - v / mx * 100;
    $('#fin-svg').innerHTML = `<line x1="${x0}" y1="${y0}" x2="${W - 10}" y2="${y0}" class="fin-ax"/>
      <rect x="${x0 + 4}" y="${y0}" width="${bw * .5}" height="${p[1] / mx * 100}" class="fin-inv"/>
      ${p[2].map((v, t) => { const x = x0 + bw * (t + 1); return `<rect x="${x}" y="${sy(v)}" width="${bw * .3}" height="${v / mx * 100}" class="fin-cf"/><rect x="${x + bw * .32}" y="${sy(c.pv[t])}" width="${bw * .3}" height="${c.pv[t] / mx * 100}" class="fin-pv"/><text x="${x + bw * .3}" y="${H - 6}" class="fin-l">Y${t + 1}</text>`; }).join('')}
      <polyline points="${cums.map((v, t) => `${x0 + bw * t + bw * .3},${sy(v)}`).join(' ')}" class="fin-cum"/>
      ${cums.map((v, t) => `<circle cx="${x0 + bw * t + bw * .3}" cy="${sy(v)}" r="3.5" class="fin-dot"/>`).join('')}
      <text x="${x0 + 4}" y="${H - 6}" class="fin-l">Y0</text>
      <g class="fin-leg"><rect x="250" y="8" width="10" height="10" class="fin-cf"/><text x="264" y="17">cash flow</text><rect x="250" y="24" width="10" height="10" class="fin-pv"/><text x="264" y="33">παρούσα αξία (PV)</text><line x1="250" y1="45" x2="260" y2="45" class="fin-cum"/><text x="264" y="49">σωρευτικό</text></g>`;
    const kp = (l, v, good, f) => `<div class="kpi ${good ? 'good' : 'bad'}"><small>${l}</small><b>${v}</b><span>${f}</span></div>`;
    $('#fin-k').innerHTML = kp('NPV = ΣPV − επένδυση', '€' + k(c.npv) + 'K', c.npv > 0, c.npv > 0 ? 'βιώσιμο: αξία πάνω από το cost of capital' : 'μη βιώσιμο') +
      kp('ROI = (οφέλη − κόστος)/κόστος', k(c.roi * 100) + '%', c.roi > 0, 'αγνοεί το πότε έρχονται τα οφέλη') +
      kp('IRR (NPV = 0)', c.irr === null ? '—' : k(c.irr * 100) + '%', c.irr !== null && c.irr > r, c.irr !== null && c.irr > r ? 'πάνω από το r → βιώσιμο' : 'κάτω από το r') +
      kp('Payback', c.pb === null ? '—' : k(c.pb, 2) + ' έτη', c.pb !== null, 'ρίσκο ρευστότητας· αγνοεί το μετά');
  };
  $$('#fin-seg button').forEach(b => b.onclick = () => { cur = b.dataset.p; form(); });
  form();
}

/* ════════════════════════════════════════════════════════════════════
   Ch.8 · stakeholders
   ════════════════════════════════════════════════════════════════════ */
const PIQ = ['Keep satisfied', 'Manage closely', 'Monitor', 'Keep informed'];
const PIQD = ['Υψηλή δύναμη, χαμηλό ενδιαφέρον', 'Υψηλή δύναμη, υψηλό ενδιαφέρον', 'Χαμηλή δύναμη, χαμηλό ενδιαφέρον', 'Χαμηλή δύναμη, υψηλό ενδιαφέρον'];
const PIS = [
  ['Ο CFO εγκρίνει το budget, αλλά δεν ασχολείται με τις λεπτομέρειες του έργου.', 0],
  ['Ο sponsor χρηματοδοτεί το έργο και το παρακολουθεί στενά.', 1],
  ['Οι υπάλληλοι ενός τμήματος θα δουλεύουν καθημερινά με το νέο σύστημα, χωρίς εξουσία απόφασης.', 3],
  ['Ένα τμήμα του οργανισμού που δεν επηρεάζεται από το έργο.', 2],
  ['Ρυθμιστική αρχή που μπορεί να σταματήσει το έργο, αλλά ενδιαφέρεται μόνο για τη συμμόρφωση στο τέλος.', 0],
  ['Ο διευθυντής λειτουργιών που θα παραλάβει το σύστημα και έχει veto στο go-live.', 1],
  ['Η ομάδα εξυπηρέτησης πελατών ανησυχεί για τις αλλαγές στη δουλειά της, αλλά δεν αποφασίζει.', 3],
  ['Ένας προμηθευτής αναλωσίμων του οργανισμού, χωρίς σχέση με το έργο.', 2],
];
const ENG = ['Unaware', 'Resistant', 'Neutral', 'Supportive', 'Leading'];
const ENGD = ['αγνοεί το έργο ή τις επιπτώσεις του', 'γνωρίζει και αντιτίθεται', 'γνωρίζει, ούτε υποστηρίζει ούτε αντιτίθεται', 'γνωρίζει και υποστηρίζει', 'γνωρίζει και ενεργά προωθεί την επιτυχία'];
function labStakeholders(){
  let qi = 0, mode = 'C';
  const rows = [['Sponsor', 3, 4], ['Διευθυντής λειτουργιών', 1, 3], ['Τελικοί χρήστες', 0, 3], ['Ρυθμιστική αρχή', 2, 2]];
  labShell('Stakeholders: grid & engagement', 'Πρώτα ιεράρχηση με το Power/Interest grid, μετά το Engagement Assessment Matrix: πού βρίσκεται ο καθένας (C) και πού πρέπει να βρεθεί (D).', `
    <div class="lab-grid">
      <div class="panel"><h2>Power / Interest grid</h2>
        <div class="pig"><span class="pig-y">Power ↑</span>${PIQ.map((q, k) => `<button class="pig-q q${k}" data-q="${k}"><b>${q}</b><small>${PIQD[k]}</small></button>`).join('')}<span class="pig-x">Interest →</span></div></div>
      <div class="panel"><h2>Σε ποιο τεταρτημόριο;</h2><p class="qtext" id="pi-q" style="font-size:16px"></p><p class="hint">Πάτα το τεταρτημόριο στο grid.</p><div id="pi-r"></div>
        <button class="btn btn-ghost" id="pi-next">Άλλος stakeholder</button>
        <p class="hint" style="margin-top:14px">Σε πολιτικά σύνθετα ή regulated περιβάλλοντα, το Salience model προσθέτει τρίτη διάσταση (urgency) και δίνει επτά τύπους.</p></div>
    </div>
    <div class="panel"><h2>Engagement Assessment Matrix</h2>
      <div class="seg" id="em-mode"><button data-m="C" class="on">C · τώρα</button><button data-m="D">D · στόχος</button></div>
      <div class="t21-wrap"><table class="em" id="em"></table></div>
      <div class="why" id="em-say" style="margin-top:12px"></div></div>`);
  const showQ = () => { $('#pi-q').textContent = PIS[qi][0]; $('#pi-r').innerHTML = ''; $$('.pig-q').forEach(x => x.classList.remove('on', 'ok', 'no')); };
  $$('.pig-q').forEach(b => b.onclick = () => {
    const ok = +b.dataset.q === PIS[qi][1];
    $$('.pig-q').forEach(x => x.classList.remove('on', 'ok', 'no')); b.classList.add(ok ? 'ok' : 'no'); if (!ok) $$('.pig-q')[PIS[qi][1]].classList.add('ok');
    $('#pi-r').innerHTML = `<div class="why" style="border-left-color:${ok ? 'var(--green)' : 'var(--red)'}"><b>${ok ? 'Σωστά.' : 'Όχι — ' + PIQ[PIS[qi][1]] + '.'}</b> ${PIQD[PIS[qi][1]]}.</div>`;
  });
  $('#pi-next').onclick = () => { qi = (qi + 1) % PIS.length; showQ(); };
  const em = () => {
    $('#em').innerHTML = `<thead><tr><th>Stakeholder</th>${ENG.map((e, k) => `<th title="${ENGD[k]}">${e}</th>`).join('')}<th>Gap</th></tr></thead><tbody>` +
      rows.map((r, i) => `<tr><th>${r[0]}</th>${ENG.map((e, k) => `<td><button class="em-c" data-r="${i}" data-k="${k}">${r[1] === k ? '<b class="C">C</b>' : ''}${r[2] === k ? '<b class="D">D</b>' : ''}</button></td>`).join('')}<td class="cnt">${r[2] - r[1] > 0 ? '+' : ''}${r[2] - r[1]}</td></tr>`).join('') + '</tbody>';
    $$('.em-c').forEach(b => b.onclick = () => { rows[+b.dataset.r][mode === 'C' ? 1 : 2] = +b.dataset.k; em(); });
    const big = rows.filter(r => Math.abs(r[2] - r[1]) >= 2).map(r => r[0]), zero = rows.filter(r => r[2] === r[1]).map(r => r[0]);
    $('#em-say').innerHTML = `Το gap μεταξύ C και D υπαγορεύει την παρέμβαση. ${big.length ? `<b>Μεγάλο gap:</b> ${big.join(', ')} — χρειάζεται στοχευμένη, εξατομικευμένη προσέγγιση. ` : ''}${zero.length ? `<b>Χωρίς gap:</b> ${zero.join(', ')} — διατήρηση. ` : ''}<br><small>Γι' αυτό η μαζική επικοινωνία («newsletter σε όλους») είναι συχνά αναποτελεσματική: διαφορετικά gaps θέλουν διαφορετικές παρεμβάσεις.</small>`;
  };
  $$('#em-mode button').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('#em-mode button').forEach(x => x.classList.toggle('on', x === b)); });
  showQ(); em();
}

/* ════════════════════════════════════════════════════════════════════
   Ch.13 · team: Tuckman, situational leadership, channels, RACI
   ════════════════════════════════════════════════════════════════════ */
const TUCK = [
  ['Forming', .38, 'Οι άνθρωποι γνωρίζονται· ευγένεια, ασαφείς ρόλοι, χαμηλή παραγωγικότητα.', 'Παρέχει σαφήνεια: στόχοι, ρόλοι, κανόνες εργασίας.'],
  ['Storming', .18, 'Ξεκινά η πραγματική δουλειά και εμφανίζονται συγκρούσεις· η παραγωγικότητα πέφτει προσωρινά.', 'Διαμεσολαβεί στις συγκρούσεις και κρατά την ομάδα εστιασμένη χωρίς να καταπνίγει τη συζήτηση.'],
  ['Norming', .58, 'Κοινός ρυθμός, εμπιστοσύνη, κανόνες λειτουργίας· η παραγωγικότητα ανακάμπτει.', 'Ενισχύει τους κανόνες και τη συνοχή που αναδύονται.'],
  ['Performing', .9, 'Καλά συντονισμένη μονάδα: αυτονομία, συνεργασία, υψηλή απόδοση.', 'Μετατοπίζεται σε servant leadership, αφαιρώντας εμπόδια.'],
  ['Adjourning', .42, 'Το έργο ολοκληρώνεται και η ομάδα διαλύεται.', 'Διαχειρίζεται τα συναισθήματα, γιορτάζει, εξασφαλίζει lessons learned και ομαλή μετάβαση.'],
];
const LSTY = [
  ['Directing / Telling', 'Σαφείς οδηγίες, στενός έλεγχος', 'Κρίση, νέα ή ανειδίκευτη ομάδα, υψηλή ρύθμιση'],
  ['Coaching', 'Καθοδήγηση + εξήγηση «γιατί»', 'Ομάδα με κίνητρο αλλά ελλιπή εμπειρία'],
  ['Supporting / Servant', 'Αφαίρεση εμποδίων, ενδυνάμωση', 'Ώριμες ομάδες, agile/adaptive contexts'],
  ['Delegating / Transformational', 'Όραμα, ευρεία ανάθεση αποφάσεων', 'Self-organizing teams, μετασχηματιστικά έργα'],
];
function labTeam(){
  const RT = ['Τεχνικές προδιαγραφές', 'Εγκατάσταση servers', 'Εκπαίδευση χρηστών'], RP = ['PM', 'Tech lead', 'Developer', 'Sponsor'], CY = ['', 'R', 'A', 'C', 'I'];
  const raci = [['A', 'A', 'R', 'I'], ['I', 'R', 'R', ''], ['A', 'C', '', 'I']];
  labShell('Ομάδα: Tuckman, RACI, κανάλια', 'Πώς εξελίσσεται μια ομάδα και τι κάνει ο PM σε κάθε στάδιο, ποιο leadership style ταιριάζει, πόσο γρήγορα αυξάνονται τα κανάλια επικοινωνίας και πώς στήνεται ένα σωστό RACI.', `
    <div class="lab-grid">
      <div class="panel"><h2>Tuckman ladder</h2><svg viewBox="0 0 440 210" class="tuck" id="tuck"></svg><div class="why" id="tu-say" style="margin-top:10px">Πάτα ένα στάδιο.</div></div>
      <div class="panel"><h2>Situational leadership</h2><p class="hint">Το style προσαρμόζεται στην ωριμότητα της ομάδας: Directing για αρχάριους, Coaching για ανερχόμενους, Supporting για έμπειρους, Delegating για ειδικούς.</p>
        <label class="sl"><span>Ωριμότητα ομάδας</span><input type="range" id="ls-m" min="0" max="3" value="0"><b id="ls-v"></b></label><div id="ls-card"></div></div>
    </div>
    <div class="lab-grid">
      <div class="panel"><h2>Κανάλια επικοινωνίας · n(n−1)/2</h2>
        <label class="sl"><span>Μέλη ομάδας (n)</span><input type="range" id="ch-n" min="2" max="20" value="5"><b id="ch-v"></b></label>
        <svg viewBox="0 0 300 300" class="chn" id="chn"></svg><div class="why" id="ch-say"></div></div>
      <div class="panel"><h2>RACI · διόρθωσε τον πίνακα</h2><p class="hint">Πάτα ένα κελί για να αλλάξει (R → A → C → I → κενό). Κανόνας: ακριβώς ένας Accountable ανά task και τουλάχιστον ένας Responsible.</p>
        <div class="t21-wrap"><table class="raci" id="raci"></table></div><div id="raci-say" style="margin-top:10px"></div></div>
    </div>`);
  const tu = sel => {
    const X = k => 50 + k * 85, Y = v => 180 - v * 160;
    $('#tuck').innerHTML = `<line x1="30" y1="180" x2="430" y2="180" class="fin-ax"/><text x="34" y="14" class="fin-l" style="text-anchor:start">παραγωγικότητα</text>
      <path d="M ${TUCK.map((t, k) => `${X(k)} ${Y(t[1])}`).join(' L ')}" class="tu-p"/>
      ${TUCK.map((t, k) => `<g class="tu-n${sel === k ? ' on' : ''}" data-k="${k}"><circle cx="${X(k)}" cy="${Y(t[1])}" r="11"/><text x="${X(k)}" y="200">${t[0]}</text></g>`).join('')}`;
    $$('.tu-n').forEach(g => g.onclick = () => { const k = +g.dataset.k, t = TUCK[k]; tu(k);
      $('#tu-say').innerHTML = `<b>${t[0]}</b> — ${esc(t[2])}<br><b>Ο PM:</b> ${esc(t[3])}<br><small>Η πορεία δεν είναι μονόδρομη: ένα νέο μέλος μπορεί να επαναφέρει storming.</small>`; });
  };
  tu(-1);
  const ls = () => { const k = +$('#ls-m').value, s = LSTY[k]; $('#ls-v').textContent = ['αρχάριοι', 'ανερχόμενοι', 'έμπειροι', 'ειδικοί'][k];
    $('#ls-card').innerHTML = `<div class="kpi good"><small>Style</small><b style="font-size:20px">${s[0]}</b><span>${s[1]}</span></div><p class="hint" style="margin-top:8px"><b>Πότε:</b> ${s[2]}</p>`; };
  $('#ls-m').oninput = ls; ls();
  const ch = () => { const n = +$('#ch-n').value, c = n * (n - 1) / 2, pts = [...Array(n)].map((_, k) => [150 + 120 * Math.cos(k * 2 * Math.PI / n - Math.PI / 2), 150 + 120 * Math.sin(k * 2 * Math.PI / n - Math.PI / 2)]);
    $('#ch-v').textContent = n;
    let L = ''; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) L += `<line x1="${pts[a][0].toFixed(1)}" y1="${pts[a][1].toFixed(1)}" x2="${pts[b][0].toFixed(1)}" y2="${pts[b][1].toFixed(1)}"/>`;
    $('#chn').innerHTML = `<g class="ch-l">${L}</g>${pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${n > 12 ? 6 : 9}" class="ch-n"/>`).join('')}`;
    $('#ch-say').innerHTML = `<b>${n}×${n - 1}/2 = ${c} κανάλια.</b> Αν προστεθεί ένα μέλος: ${(n + 1) * n / 2} (+${n}). Τα κανάλια αυξάνονται πολύ πιο γρήγορα από τα μέλη.`; };
  $('#ch-n').oninput = ch; ch();
  const rc = () => {
    $('#raci').innerHTML = `<thead><tr><th>Task</th>${RP.map(p => `<th>${p}</th>`).join('')}</tr></thead><tbody>` + RT.map((t, i) => `<tr><th>${t}</th>${RP.map((p, j) => `<td><button class="rc rc-${raci[i][j] || 'x'}" data-i="${i}" data-j="${j}">${raci[i][j] || '·'}</button></td>`).join('')}</tr>`).join('') + '</tbody>';
    $$('.rc').forEach(b => b.onclick = () => { const i = +b.dataset.i, j = +b.dataset.j; raci[i][j] = CY[(CY.indexOf(raci[i][j]) + 1) % CY.length]; rc(); });
    const msg = RT.map((t, i) => { const a = raci[i].filter(x => x === 'A').length, r = raci[i].filter(x => x === 'R').length;
      const p = [a === 0 ? 'κανένας Accountable' : a > 1 ? `${a} Accountables — άρα κανείς δεν είναι πραγματικά υπεύθυνος` : '', r === 0 ? 'κανένας Responsible' : ''].filter(Boolean);
      return p.length ? `<li class="bad"><b>${t}:</b> ${p.join(' · ')}</li>` : `<li class="good"><b>${t}:</b> ✓</li>`; });
    const all = msg.every(m => m.includes('class="good"'));
    $('#raci-say').innerHTML = `<ul class="raci-m">${msg.join('')}</ul>${all ? '<div class="why"><b>Σωστό RACI.</b> Ένας owner ανά task, χωρίς κενά ευθύνης. Consulted = αμφίδρομη πριν τη δουλειά· Informed = μονόδρομη μετά.</div>' : ''}`;
  };
  rc();
}

/* ════════════════════════════════════════════════════════════════════
   Ch.14 · quality
   ════════════════════════════════════════════════════════════════════ */
const COQ = [
  ['Εκπαίδευση της ομάδας', 0, '«Χτίζω την ποιότητα».'], ['Σχεδιασμός διαδικασιών', 0, 'Πρόληψη defects.'], ['Quality planning', 0, 'Πρόληψη defects.'],
  ['Testing', 1, '«Ελέγχω την ποιότητα».'], ['Inspections', 1, 'Ανίχνευση defects.'], ['Audits', 1, 'Ανίχνευση defects.'],
  ['Rework πριν την παράδοση', 2, '«Πιάνω τα λάθη εσωτερικά».'], ['Scrap', 2, 'Defect που βρέθηκε πριν τον πελάτη.'], ['Επανέλεγχος μετά από διόρθωση', 2, 'Κόστος εσωτερικής αστοχίας.'],
  ['Εγγυήσεις (warranty)', 3, '«Τα λάθη φτάνουν στον πελάτη».'], ['Επιστροφές προϊόντων', 3, 'Defect μετά τον πελάτη.'], ['Απώλεια φήμης', 3, 'Το ακριβότερο: μετά τον πελάτη.'],
];
const QAQC = [
  ['Audit ότι η ομάδα ακολουθεί τη μεθοδολογία', 0, 'Process-focused: «εκτελούμε σωστά την εργασία;»'], ['Process review μετά από κάθε release', 0, 'Ελέγχει τη διαδικασία.'],
  ['Μέτρηση διαστάσεων ενός εξαρτήματος', 1, 'Product-focused: «είναι σωστό αυτό που παραδώσαμε;»'], ['Testing ενός παραδοτέου πριν σταλεί στον πελάτη', 1, 'Εσωτερικός έλεγχος προϊόντος — πριν το Validate Scope.'],
  ['Έλεγχος συμμόρφωσης με ποιοτικά πρότυπα διαδικασιών', 0, 'QA = Activities (διαδικασίες).'], ['Inspection στο τελικό προϊόν', 1, 'QC = Check the product.'],
];
const PARETO = [['Λάθη δεδομένων', 42], ['UI', 7], ['Integration', 25], ['Performance', 6], ['Τεκμηρίωση', 4], ['Security', 3], ['Ρυθμίσεις', 13]];
function labQuality(){
  let pts = [], kind = 0, shown = false, sorted = false;
  labShell('Ποιότητα: control chart, Pareto, CoQ', 'Διάβασε ένα control chart όπως στο worked example του Κεφ. 14 (CL 50,00 · UCL 50,30 · LCL 49,70 mm), βρες τις λίγες κρίσιμες αιτίες με Pareto και ταξινόμησε κόστη ποιότητας.', `
    <div class="panel"><h2>Control chart</h2><div class="cpm-wrap"><svg viewBox="0 0 640 240" class="cc" id="cc"></svg></div>
      <p class="hint">Είναι η διαδικασία υπό έλεγχο;</p>
      <div class="sg-b" id="cc-b">${['Υπό έλεγχο', 'Εκτός: σημείο εκτός ορίων', 'Εκτός: Rule of Seven'].map((t, k) => `<button class="opt" data-k="${k}">${t}</button>`).join('')}</div>
      <div id="cc-say"></div><div class="qfoot"><button class="btn btn-ghost" id="cc-new">Νέες μετρήσεις</button></div></div>
    <div class="lab-grid">
      <div class="panel"><h2>Pareto · 80/20</h2><svg viewBox="0 0 420 250" class="par" id="par"></svg>
        <div class="qfoot"><button class="btn btn-gold" id="par-s">Ταξινόμησε (Pareto)</button></div><div class="why" id="par-say"></div></div>
      <div class="panel"><h2>Cost of Quality</h2><p class="hint">Conformance (Prevention, Appraisal) κοστίζει συνήθως λιγότερο από non-conformance (Internal, External Failure).</p><div id="coq"></div></div>
    </div>
    <div class="panel"><h2>QA ή QC;</h2><div id="qaqc"></div></div>`);
  const gen = () => {
    kind = Math.floor(Math.random() * 3); shown = false;
    const r = () => +(50 + (Math.random() - .5) * .44).toFixed(2), N = 15;
    const run7 = a => { let c = 1; for (let k = 1; k < a.length; k++){ c = Math.sign(a[k] - 50) === Math.sign(a[k - 1] - 50) && a[k] !== 50 ? c + 1 : 1; if (c >= 7) return true; } return false; };
    do { pts = [...Array(N)].map(r); } while (run7(pts));
    if (kind === 1){ const k = 3 + Math.floor(Math.random() * 10); pts[k] = Math.random() < .5 ? +(50.34 + Math.random() * .08).toFixed(2) : +(49.66 - Math.random() * .08).toFixed(2); }
    if (kind === 2){ const s = Math.floor(Math.random() * (N - 7)), up = Math.random() < .5; for (let k = s; k < s + 7; k++) pts[k] = +(50 + (up ? 1 : -1) * (.03 + Math.random() * .2)).toFixed(2); }
    $('#cc-say').innerHTML = ''; $$('#cc-b .opt').forEach(b => { b.disabled = false; delete b.dataset.mark; }); draw();
  };
  const draw = () => {
    const X = k => 40 + k * 41, Y = v => 120 - (v - 50) / .45 * 100;
    const bad = k => shown && ((kind === 1 && (pts[k] > 50.3 || pts[k] < 49.7)) || (kind === 2 && runIdx.includes(k)));
    let runIdx = []; if (kind === 2){ let s = 0; for (let k = 1; k <= pts.length; k++){ if (k === pts.length || Math.sign(pts[k] - 50) !== Math.sign(pts[k - 1] - 50)){ if (k - s >= 7) runIdx = [...Array(k - s)].map((_, j) => s + j); s = k; } } }
    $('#cc').innerHTML = `<rect x="30" y="${Y(50.3)}" width="600" height="${Y(49.7) - Y(50.3)}" class="cc-band"/>
      ${[[50.3, 'UCL 50,30'], [50, 'CL 50,00'], [49.7, 'LCL 49,70']].map(([v, l], k) => `<line x1="30" x2="630" y1="${Y(v)}" y2="${Y(v)}" class="cc-${k === 1 ? 'cl' : 'lim'}"/><text x="626" y="${Y(v) - 4}" class="cc-t">${l}</text>`).join('')}
      <polyline points="${pts.map((v, k) => `${X(k)},${Y(v)}`).join(' ')}" class="cc-line"/>
      ${pts.map((v, k) => `<circle cx="${X(k)}" cy="${Y(v)}" r="5" class="cc-p${bad(k) ? ' bad' : ''}"><title>${v.toFixed(2)}</title></circle>`).join('')}`;
  };
  $$('#cc-b .opt').forEach(b => b.onclick = () => {
    if ($('#cc-b .opt[data-mark]')) return;
    const good = +b.dataset.k === kind; shown = true; draw();
    $$('#cc-b .opt').forEach(x => { x.disabled = true; if (+x.dataset.k === kind) x.dataset.mark = 'right'; else if (x === b) x.dataset.mark = 'wrong'; });
    $('#cc-say').innerHTML = `<div class="why"><b>${good ? 'Σωστά.' : 'Όχι ακριβώς.'}</b> ${[
      'Όλα τα σημεία μέσα στα όρια, χωρίς 7 συνεχόμενα στην ίδια πλευρά: κοινές αιτίες διακύμανσης — καμία παρέμβαση.',
      'Ένα σημείο εκτός UCL/LCL: η διαδικασία είναι εκτός ελέγχου — διερεύνηση ειδικής αιτίας (root cause).',
      '7 συνεχόμενα σημεία στην ίδια πλευρά του μέσου, ακόμη κι εντός ορίων: συστηματική απόκλιση (bias) που χρειάζεται διερεύνηση.'][kind]}</div>`;
  });
  $('#cc-new').onclick = gen; gen();
  const par = () => {
    const d = sorted ? PARETO.slice().sort((a, b) => b[1] - a[1]) : PARETO, tot = d.reduce((a, b) => a + b[1], 0), mx = Math.max(...d.map(x => x[1])), bw = 340 / d.length;
    let c = 0; const cum = d.map(x => (c += x[1]) / tot), vital = sorted ? cum.findIndex(v => v >= .8) : -1;
    $('#par').innerHTML = `<line x1="40" y1="190" x2="400" y2="190" class="fin-ax"/>
      ${d.map((x, k) => `<rect x="${44 + k * bw}" y="${190 - x[1] / mx * 160}" width="${bw - 8}" height="${x[1] / mx * 160}" class="par-b${sorted && k <= vital ? ' v' : ''}"/><text x="${44 + k * bw + (bw - 8) / 2}" y="204" class="par-l" transform="rotate(-35 ${44 + k * bw + (bw - 8) / 2} 204)">${x[0].split(' ')[0]}</text><text x="${44 + k * bw + (bw - 8) / 2}" y="${186 - x[1] / mx * 160}" class="par-n">${x[1]}</text>`).join('')}
      ${sorted ? `<line x1="40" x2="400" y1="${190 - .8 * 170}" y2="${190 - .8 * 170}" class="par-80"/><text x="402" y="${194 - .8 * 170}" class="par-n" style="text-anchor:start">80%</text>
        <polyline points="${cum.map((v, k) => `${44 + k * bw + (bw - 8) / 2},${190 - v * 170}`).join(' ')}" class="par-c"/>` : ''}`;
    $('#par-s').textContent = sorted ? 'Αρχική σειρά' : 'Ταξινόμησε (Pareto)';
    $('#par-say').innerHTML = sorted ? `<b>${vital + 1} από ${d.length} κατηγορίες</b> (${d.slice(0, vital + 1).map(x => x[0]).join(', ')}) εξηγούν ~${Math.round(cum[vital] * 100)}% των defects. Εκεί εστιάζεις πρώτα.` : 'Defects ανά κατηγορία σε ένα release (ενδεικτικά). Ταξινόμησέ τα σε φθίνουσα σειρά με αθροιστική γραμμή.';
  };
  $('#par-s').onclick = () => { sorted = !sorted; par(); }; par();
  sortGame($('#coq'), {buckets:['Prevention', 'Appraisal', 'Internal Failure', 'External Failure'], items:COQ});
  sortGame($('#qaqc'), {buckets:['QA — διαδικασία', 'QC — προϊόν'], items:QAQC});
}

/* ════════════════════════════════════════════════════════════════════
   Ch.15 · risk
   ════════════════════════════════════════════════════════════════════ */
const HEAT = [['Medium', 'High', 'Critical'], ['Low', 'Medium', 'High'], ['Very Low', 'Low', 'Medium']];
const RSP = [
  ['Avoid', 'Εξάλειψη του ρίσκου μέσω αλλαγής προσέγγισης, scope ή timeline.', 'Exploit'],
  ['Transfer', 'Μεταφορά της οικονομικής επίπτωσης ή της ευθύνης σε τρίτο (insurance, outsourcing, fixed-price).', 'Share'],
  ['Mitigate', 'Μείωση πιθανότητας ή επίπτωσης χωρίς εξάλειψη (prototyping, redundancy).', 'Enhance'],
  ['Accept', 'Συνειδητή αποδοχή: active (contingency, trigger, reserve) ή passive.', 'Accept'],
  ['Escalate', 'Μεταφορά σε ανώτερο επίπεδο όταν ξεπερνά την εξουσιοδότηση του PM.', 'Escalate'],
];
const RSPO = {Exploit:'Ενεργή επιδίωξη της μέγιστης αξιοποίησης και πιθανότητας της ευκαιρίας.', Share:'Κοινή επιδίωξη με τρίτο που μπορεί να την αξιοποιήσει καλύτερα (partnership, joint venture).', Enhance:'Αύξηση πιθανότητας ή επίπτωσης της ευκαιρίας.', Accept:'Αν συμβεί, αξιοποιείται· δεν επιδιώκεται ενεργά.', Escalate:'Όταν η ευκαιρία ξεπερνά το scope του έργου (π.χ. ανήκει σε άλλο πρόγραμμα).'};
const RBUCK = ['Avoid', 'Transfer', 'Mitigate', 'Accept', 'Escalate', 'Exploit', 'Share', 'Enhance'];
const RQ = [
  ['Μια αδοκίμαστη τεχνολογία είναι πολύ ριψοκίνδυνη· η ομάδα αποφασίζει να χρησιμοποιήσει την ώριμη τεχνολογία που ήδη γνωρίζει.', 0, 'Αλλαγή προσέγγισης που αφαιρεί το ρίσκο τελείως.'],
  ['Αγοράζεις ασφάλεια για ζημιά του εξοπλισμού κατά τη μεταφορά.', 1, 'Η οικονομική επίπτωση περνά σε τρίτο.'],
  ['Φτιάχνεις prototype για να μειώσεις το τεχνικό ρίσκο πριν την πλήρη ανάπτυξη.', 2, 'Μείωση πιθανότητας χωρίς εξάλειψη.'],
  ['Το ρίσκο είναι μικρό· ορίζεις contingency reserve και trigger για την περίπτωση που εμφανιστεί.', 3, 'Active acceptance.'],
  ['Το ρίσκο αγγίζει αποφάσεις επιπέδου portfolio, εκτός της εξουσίας σου.', 4, 'Ξεπερνά την εξουσιοδότηση του PM.'],
  ['Βάζεις τους καλύτερους developers ώστε η ευκαιρία έγκαιρης παράδοσης να γίνει όσο πιο σίγουρη γίνεται.', 5, 'Μέγιστη αξιοποίηση της ευκαιρίας (↔ Avoid).'],
  ['Συνεργάζεσαι σε joint venture με εταιρεία που μπορεί να αξιοποιήσει καλύτερα την ευκαιρία.', 6, 'Κοινή επιδίωξη (↔ Transfer).'],
  ['Επενδύεις επιπλέον στην ομάδα ώστε να αυξηθεί η πιθανότητα να πάρετε το bonus πρόωρης ολοκλήρωσης.', 7, 'Αύξηση πιθανότητας (↔ Mitigate).'],
  ['Μικρή πιθανή έκπτωση από προμηθευτή: αν προκύψει θα την αξιοποιήσεις, αλλά δεν την κυνηγάς.', 3, 'Accept ισχύει και για ευκαιρίες.'],
  ['Η ευκαιρία αφορά στρατηγικό όφελος που ανήκει σε άλλο πρόγραμμα.', 4, 'Escalate ισχύει και για ευκαιρίες.'],
];
function labRisk(){
  let opp = false;
  labShell('Ρίσκο: heat map, EMV, responses', 'Ποιοτική διαλογή με το Probability/Impact Matrix (Πίνακας 15.1), ποσοτική με EMV, και οι 10 στρατηγικές με τη συμμετρία threats ↔ opportunities.', `
    <div class="lab-grid">
      <div class="panel"><h2>Probability / Impact Matrix</h2>
        <div class="heat"><span></span>${['Low', 'Medium', 'High'].map(x => `<span class="hx">${x} impact</span>`).join('')}
          ${HEAT.map((r, i) => `<span class="hy">${['High', 'Medium', 'Low'][i]} prob.</span>${r.map(c => `<button class="hc h-${c.replace(' ', '')}" data-c="${c}">${c}</button>`).join('')}`).join('')}</div>
        <div class="why" id="heat-say" style="margin-top:12px">Πάτα ένα κελί.</div></div>
      <div class="panel"><h2>EMV = Probability × Impact</h2>
        <div class="seg" id="emv-t"><button class="on" data-o="0">Threat</button><button data-o="1">Opportunity</button></div>
        <label class="sl"><span>Πιθανότητα</span><input type="range" id="emv-p" min="0" max="100" step="5" value="30"><b id="emv-p-v"></b></label>
        <label class="sl"><span>Επίπτωση</span><input type="range" id="emv-i" min="0" max="300000" step="5000" value="100000"><b id="emv-i-v"></b></label>
        <div class="evm-kpis" id="emv-k"></div></div>
    </div>
    <div class="panel"><h2>Οι 10 στρατηγικές</h2>
      <div class="rsp"><div class="rsp-h">Threats</div><div></div><div class="rsp-h">Opportunities</div>
        ${RSP.map(r => `<button class="rs" data-t="${r[0]}">${r[0]}</button><i>↔</i><button class="rs o" data-o="${r[2]}">${r[2]}</button>`).join('')}</div>
      <div class="why" id="rsp-say" style="margin-top:12px">Accept και Escalate εμφανίζονται και στις δύο πλευρές.</div></div>
    <div class="panel"><h2>Ποια στρατηγική;</h2><div id="rq"></div></div>`);
  $$('.hc').forEach(b => b.onclick = () => { const c = b.dataset.c; $$('.hc').forEach(x => x.classList.toggle('on', x === b));
    $('#heat-say').innerHTML = `<b>${c}</b> — ${/Critical|High/.test(c) ? 'απαιτεί άμεση response.' : c === 'Medium' ? 'παρακολουθείται.' : 'καταγράφεται σε watchlist.'}<br><small>Η ποιοτική ανάλυση είναι γρήγορη και αποτελεί την πρώτη διαλογή για όλα τα risks· η ποσοτική εφαρμόζεται επιλεκτικά.</small>`; });
  const emv = () => { const p = +$('#emv-p').value / 100, i = +$('#emv-i').value, v = (opp ? 1 : -1) * p * i;
    $('#emv-p-v').textContent = Math.round(p * 100) + '%'; $('#emv-i-v').textContent = eur(i);
    $('#emv-k').innerHTML = `<div class="kpi ${opp ? 'good' : 'bad'}"><small>EMV</small><b>${v >= 0 ? '+' : ''}${eur(v)}</b><span>${opp ? 'opportunity: θετικό' : 'threat: αρνητικό'} · ${f2(p)} × ${eur(i)}</span></div>`; };
  $$('#emv-t button').forEach(b => b.onclick = () => { opp = b.dataset.o === '1'; $$('#emv-t button').forEach(x => x.classList.toggle('on', x === b)); emv(); });
  $('#emv-p').oninput = $('#emv-i').oninput = emv; emv();
  $$('.rs').forEach(b => b.onclick = () => { $$('.rs').forEach(x => x.classList.toggle('on', x === b));
    const t = b.dataset.t, o = b.dataset.o, r = RSP.find(x => x[0] === t || x[2] === o);
    $('#rsp-say').innerHTML = t ? `<b>${t}</b> (threat) — ${esc(r[1])}<br><small>Αντίστοιχο στις ευκαιρίες: ${r[2]}.</small>` : `<b>${o}</b> (opportunity) — ${esc(RSPO[o])}<br><small>Αντίστοιχο στα threats: ${r[0]}.</small>`; });
  sortGame($('#rq'), {buckets:RBUCK, items:RQ});
}

/* ════════════════════════════════════════════════════════════════════
   Ch.18 · adaptive metrics
   ════════════════════════════════════════════════════════════════════ */
const LEADLAG = [
  ['Velocity trend', 0, 'Προβλέπει future delivery.'], ['Defect rate του τρέχοντος module', 0, 'Προβλέπει την ποιότητα του release.'],
  ['Risk exposure trend', 0, 'Δείχνει τι πιθανώς θα συμβεί.'], ['Backlog health και ρυθμός εισροής νέων items', 0, 'Προβλεπτικός δείκτης.'],
  ['Cycle time trend', 0, 'Δείκτης team health και process efficiency.'], ['Team morale', 0, 'Υποστηρικτικός leading (proxy): early warning για burnout.'],
  ['Customer satisfaction μετά από release', 1, 'Καταγράφει τι ήδη έγινε.'], ['Πραγματικό τελικό κόστος', 1, 'Αναδρομικός.'],
  ['On-time delivery rate', 1, 'Αναδρομικός.'], ['Defect rate σε παραγωγή', 1, 'Μετρά ό,τι ήδη διέφυγε.'],
];
function labMetrics(){
  labShell('Burnup, burndown & δείκτες', 'Ίδιο έργο, δύο γραφήματα. Πρόσθεσε scope ανά sprint και δες γιατί το burnup αποκαλύπτει το scope growth ενώ το burndown το κρύβει.', `
    <div class="panel"><div class="lab-grid" style="gap:12px">
      <div><label class="sl"><span>Αρχικό scope</span><input type="range" id="bm-s" min="40" max="200" step="10" value="120"><b id="bm-s-v"></b><small>story points</small></label>
        <label class="sl"><span>Velocity</span><input type="range" id="bm-v" min="5" max="30" value="15"><b id="bm-v-v"></b><small>points / sprint</small></label></div>
      <div><label class="sl"><span>Νέο scope ανά sprint</span><input type="range" id="bm-a" min="0" max="12" value="0"><b id="bm-a-v"></b><small>points που προστίθενται κάθε sprint</small></label>
        <div class="kpi" id="bm-k"></div></div></div>
      <div class="lab-grid"><div><h2>Release burnup</h2><svg viewBox="0 0 360 220" class="bm" id="bu"></svg></div><div><h2>Burndown</h2><svg viewBox="0 0 360 220" class="bm" id="bd"></svg></div></div>
      <div class="why" id="bm-say"></div></div>
    <div class="panel"><h2>Leading ή lagging;</h2><p class="hint">Leading προβλέπουν· lagging επιβεβαιώνουν. Dashboard μόνο με lagging → αντιδραστική διοίκηση.</p><div id="ll"></div></div>`);
  const upd = () => {
    const S = +$('#bm-s').value, V = +$('#bm-v').value, A = +$('#bm-a').value;
    $('#bm-s-v').textContent = S; $('#bm-v-v').textContent = V; $('#bm-a-v').textContent = A;
    const plan = Math.ceil(S / V), fin = V > A ? Math.ceil(S / (V - A)) : null, N = Math.min(Math.max(plan, fin || 20), 20);
    const tot = t => S + A * t, done = t => Math.min(tot(t), V * t), mx = tot(N) * 1.05, X = t => 30 + t / N * 315, Y = v => 195 - v / mx * 180;
    const axes = `<line x1="30" y1="195" x2="350" y2="195" class="fin-ax"/><line x1="30" y1="195" x2="30" y2="10" class="fin-ax"/>${[0, Math.round(N / 2), N].map(t => `<text x="${X(t)}" y="210" class="fin-l">S${t}</text>`).join('')}`;
    const ts = [...Array(N + 1)].map((_, t) => t);
    $('#bu').innerHTML = axes + `<polyline points="${ts.map(t => `${X(t)},${Y(tot(t))}`).join(' ')}" class="bm-scope"/><polyline points="${ts.map(t => `${X(t)},${Y(done(t))}`).join(' ')}" class="bm-done"/>
      <text x="${X(N) - 4}" y="${Y(tot(N)) - 6}" class="bm-t" text-anchor="end">συνολικό scope</text><text x="${X(N * .5)}" y="${Y(done(N * .5)) + 16}" class="bm-t g">ολοκληρωμένα</text>`;
    $('#bd').innerHTML = axes + `<line x1="${X(0)}" y1="${Y(S)}" x2="${X(Math.min(plan, N))}" y2="${Y(Math.max(0, S - V * Math.min(plan, N)))}" class="bm-ideal"/>
      <polyline points="${ts.map(t => `${X(t)},${Y(tot(t) - done(t))}`).join(' ')}" class="bm-rem"/><text x="${X(1)}" y="${Y(S) - 6}" class="bm-t">υπόλοιπο</text>`;
    $('#bm-k').innerHTML = `<small>Ολοκλήρωση</small><b>${fin === null ? 'ποτέ' : 'sprint ' + fin}</b><span>αρχικό πλάνο: sprint ${plan}</span>`;
    $('#bm-say').innerHTML = A === 0 ? 'Χωρίς νέο scope τα δύο γραφήματα λένε την ίδια ιστορία. Ανέβασε το «νέο scope ανά sprint».' :
      `Στο <b>burndown</b> φαίνεται μόνο ότι η ομάδα «αργεί» — σαν να έπεσε η απόδοση. Στο <b>burnup</b> φαίνεται η πραγματική αιτία: η γραμμή του συνολικού scope ανεβαίνει (scope growth) ενώ η velocity μένει ${V}.${V <= A ? ' Με velocity ≤ νέο scope το έργο δεν τελειώνει ποτέ.' : ''}<br><small>Χαρακτηρίζεται scope creep μόνο όταν η αύξηση είναι uncontrolled ή μη εγκεκριμένη.</small>`;
  };
  $$('.lab input[type=range]').forEach(i => i.oninput = upd); upd();
  sortGame($('#ll'), {buckets:['Leading', 'Lagging'], items:LEADLAG});
}

/* ════════════════════════════════════════════════════════════════════
   Flows to put in order (from the book's flow diagrams)
   ════════════════════════════════════════════════════════════════════ */
const FLOWS = {
  value:{ch:2, t:'Η αλυσίδα της αξίας', s:VCHAIN},
  situational:{ch:4, t:'Situational ερώτηση: 5 βήματα', s:SIT_STEPS},
  stakeholder:{ch:8, t:'Stakeholder management cycle', s:[['Identify', 'Αναγνώριση stakeholders — συνεχής, όχι μόνο στην αρχή.'], ['Analyze / Prioritize', 'Power/Interest, Salience, ιεράρχηση.'], ['Plan Engagement', 'Σχέδιο για το gap C → D.'], ['Manage Engagement', 'Εφαρμογή του σχεδίου.'], ['Monitor Engagement', 'Παρακολούθηση· νέοι stakeholders επιστρέφουν στο Identify.']]},
  tuckman:{ch:13, t:'Στάδια Tuckman', s:TUCK.map(t => [t[0], t[3]])},
  adkar:{ch:17, t:'ADKAR (ατομική αλλαγή)', s:[['Awareness', 'Γνωρίζει ότι υπάρχει αλλαγή και γιατί.'], ['Desire', 'Θέλει προσωπικά να συμμετάσχει.'], ['Knowledge', 'Γνωρίζει πώς να αλλάξει.'], ['Ability', 'Έχει την ικανότητα να εφαρμόσει.'], ['Reinforcement', 'Διατηρεί την αλλαγή.']]},
  kotter:{ch:17, t:'Kotter: 8 βήματα (οργανωσιακή αλλαγή)', s:[['Create urgency', ''], ['Build coalition', ''], ['Create vision', ''], ['Communicate vision', ''], ['Empower action', ''], ['Create quick wins', ''], ['Sustain acceleration', ''], ['Anchor in culture', '']]},
  change:{ch:19, t:'Integrated change control', s:[['Identify change', 'Εντοπισμός της ανάγκης για αλλαγή.'], ['Submit change request', 'Τεκμηρίωση και καταχώριση στο change log.'], ['Impact analysis', 'Scope, schedule, cost, quality, risk, resources, stakeholders.'], ['Decision: CCB ή delegated', 'Approve / reject / defer ανάλογα με threshold.'], ['Update baselines / artifacts', 'Αν εγκριθεί: όλα τα επηρεαζόμενα plans και baselines.'], ['Communicate', 'Ενημέρωση όσων επηρεάζονται.'], ['Implement', 'Εκτέλεση της αλλαγής.'], ['Verify implementation', 'Σωστή εφαρμογή, αναμενόμενο αποτέλεσμα, χωρίς παρενέργειες.'], ['Close change request', 'Το change log ενημερώνεται σε κάθε στάδιο.']]},
  closing:{ch:20, t:'Closing activities', s:[['Final acceptance παραδοτέων', ''], ['Administrative closure', 'Τεκμηρίωση, final reports.'], ['Financial closure', 'Εκκρεμείς πληρωμές, οικονομική συμφωνία.'], ['Procurement closure', 'Ολοκλήρωση ή τυπική μεταβίβαση συμβάσεων.'], ['Resources release', ''], ['Lessons learned consolidation', ''], ['Μετατροπή σε OPAs', 'Reusable assets και templates.'], ['Transition σε operations', 'Επιβεβαίωση — όχι έναρξη.'], ['Celebration', ''], ['Formal project closure', '']]},
};
function labFlows(key){
  key = FLOWS[key] ? key : 'change';
  const F = FLOWS[key];
  labShell('Ροές σε σωστή σειρά', 'Πάτα τα βήματα με τη σωστή σειρά. Οι ροές προέρχονται από τα διαγράμματα των κεφαλαίων.', `
    <div class="card-filters"><select id="fl-k">${Object.keys(FLOWS).map(k => `<option value="${k}"${k === key ? ' selected' : ''}>Κεφ. ${pad2(FLOWS[k].ch)} · ${esc(FLOWS[k].t)}</option>`).join('')}</select>
      <button class="btn btn-ghost" data-nav="#/ch/${F.ch}">Άνοιξε το κεφάλαιο</button></div>
    <div class="panel"><h2>${esc(F.t)}</h2><div id="fl"></div></div>`);
  $('#fl-k').onchange = e => { location.hash = '#/lab/flows/' + e.target.value; };
  orderGame($('#fl'), F.s);
}

/* ── registry used by the router ───────────────────────────────────── */
const LAB_FN = {
  pmbok:labPMBOK, evm:labEVM, cpm:labCPM, conflict:labConflict, contracts:labContracts, maps:a => labMaps(a ? +a : null),
  value:labValue, situational:labSituational, approach:labApproach, finance:labFinance, stakeholders:labStakeholders,
  team:labTeam, quality:labQuality, risk:labRisk, metrics:labMetrics, flows:labFlows,
};
