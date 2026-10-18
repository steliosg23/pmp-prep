/* PMP 8 · "Πάμε": a ready-made 30-minute session for tired evenings.
   One button, no decisions: warm-up → listen → recall → one visual "click" →
   coach-mode situational questions → due mistakes → close with tomorrow's hook.
   Any block can be the last one; the day still counts. */
'use strict';

const SESS = 'pmp8.sess.cur', DAYS = 'pmp8.days.v1', HOOK = 'pmp8.hook', JOURNAL = 'pmp8.journal.v1';
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function markDay(blocks = 1, secs = 0){ const d = store.get(DAYS, {}), k = today(); d[k] = {b:((d[k] || {}).b || 0) + blocks, s:((d[k] || {}).s || 0) + secs}; store.set(DAYS, d); }

const allHeard = () => CH.length && CH.every(c => stateOf(c) === 'done');
function sessCh(){
  /* the first chapter not yet done: episode heard and chapter quiz passed */
  const cur = store.get('pmp8.tutor.cur', null);
  if (cur && chOf(cur) && stateOf(chOf(cur)) !== 'done') return cur;
  const c = CH.find(c => stateOf(c) !== 'done');
  return c ? c.id : CH[CH.length - 1].id;
}
/* ── readiness: coverage of the syllabus + recent accuracy (indicative) ── */
function readiness(){
  const cov = CH.filter(c => chState(c.id).heard >= .9 || chState(c.id).best !== null).length / (CH.length || 21);
  const log = store.get('pmp8.answers.v1', []).slice(-100), n = log.length;
  const acc = n ? log.reduce((a, x) => a + x.ok, 0) / n : 0;
  return {cov, acc, n, score:Math.round(100 * (.4 * cov + .6 * acc * Math.min(1, n / 60)))};
}
function weekDots(){
  const d = store.get(DAYS, {}), now = new Date(), dow = (now.getDay() + 6) % 7, L = ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'];
  return L.map((l, k) => { const x = new Date(now); x.setDate(now.getDate() - dow + k);
    const key = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    return `<span class="wd${d[key] ? ' on' : ''}${k === dow ? ' now' : ''}" title="${key}">${l}</span>`; }).join('');
}

function readyChecks(){
  const heard = CH.filter(c => chState(c.id).heard >= .9).length;
  const T = store.get('pmp8.tests.v1', []), good = T.slice(-5).filter(t => t.sc >= 75).length;
  const mock = store.get('pmp8.exam.hist', []).some(h => h.pct >= 75);
  return [[heard >= CH.length, `Όλα τα επεισόδια (${heard}/${CH.length})`], [good >= 2, `2 τεστ ετοιμότητας ≥ 75% (${Math.min(good, 2)}/2)`], [mock, 'Μία προσομοίωση ≥ 75%']];
}
/* card on the home page, above everything else */
function sessCard(){
  const ch = sessCh(), c = chOf(ch), r = readiness(), s = store.get(SESS, null), going = s && s.date === today() && s.step > 0 && s.step < s.blocks.length;
  const active = Object.keys(store.get(DAYS, {})).length;
  return `<div class="sess-card">
    <button class="sess-go" data-nav="#/session"><span class="sg-play">${IC.play}</span>
      <span><b>${going ? 'Συνέχισε τη συνεδρία' : 'Πάμε'}</b><small>${going ? `μπλοκ ${s.step + 1} από ${s.blocks.length}` : allHeard() ? 'Τεστ ετοιμότητας · 12 ερωτήσεις από όλη την ύλη' : `~${Math.round(((c ? c.seconds : 600) - (chState(ch).pos || 0)) / 60) + 20}′ χωρίς αποφάσεις · Κεφ. ${pad2(ch)} · ${esc(c ? c.title : '')}`}</small></span></button>
    <button class="sess-mini" data-nav="#/session/mini">Κουρασμένος; <b>Μόνο 2 λεπτά</b> — η μέρα μετράει</button>
    <div class="sess-meta"><div class="wds">${weekDots()}</div>
      <div class="rd"><span>Ετοιμότητα <b>${r.n < 10 && !r.cov ? '—' : r.score + '%'}</b>${r.n < 10 && !r.cov ? ' <small>φαίνεται μετά τις πρώτες 10 ερωτήσεις</small>' : ' <small>στόχος 75%</small>'}</span><div class="rd-bar"><i style="width:${r.score}%"></i><em style="left:75%"></em></div></div></div>
    <div class="rdy"><span class="rdy-t">${readyChecks().every(x => x[0]) ? '✓ Είσαι έτοιμος να πας στον καθηγητή σου' : 'Για να πας έτοιμος στον καθηγητή σου:'}</span>
      ${readyChecks().map(x => `<span class="rdy-i${x[0] ? ' ok' : ''}">${x[0] ? '✓' : '○'} ${x[1]}</span>`).join('')}</div>
    ${active ? '' : '<p class="sess-tip">Ξεκίνα με το «Πάμε»: η εφαρμογή σου δείχνει ένα βήμα τη φορά.</p>'}
  </div>`;
}

/* ── small question widget (recall, coach mode, mistakes, hook) ────── */
function miniQ(host, q0, {coach = false, onDone, label = ''}){
  const q = prepQ(q0), keys = Object.keys(q.options);
  let cut = [];
  const draw = () => {
    host.innerHTML = `<div class="mq">${label ? `<p class="mq-l">${label}</p>` : ''}<p class="qtext">${esc(q.q)}</p>
      <div class="mq-o">${keys.map(k => `<button class="opt${cut.includes(k) ? ' cut' : ''}" data-k="${k}"${cut.includes(k) ? ' disabled' : ''}><span class="key">${k}</span><span>${esc(q.options[k])}</span></button>`).join('')}</div>
      ${coach && !cut.length ? `<button class="btn btn-ghost mq-help">Βοήθεια: κράτα μόνο τις 2 πιο πιθανές</button>` : ''}
      ${coach && cut.length ? '<p class="hint mq-hint">Έμειναν δύο. Ποια είναι πιο <b>proactive</b>, δείχνει <b>ownership</b> και εξυπηρετεί την <b>αξία</b>;</p>' : ''}
      <div class="mq-after"></div></div>`;
    const help = host.querySelector('.mq-help');
    if (help) help.onclick = () => { cut = shuffleArr(keys.filter(k => k !== q.correct)).slice(0, 2); draw(); };
    host.querySelectorAll('.opt:not([disabled])').forEach(b => b.onclick = () => {
      if (host.querySelector('.opt[data-mark]')) return;
      const pick = b.dataset.k, ok = pick === q.correct; logAnswer(q, ok);
      host.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.dataset.k === q.correct) x.dataset.mark = 'right'; else if (x.dataset.k === pick) x.dataset.mark = 'wrong'; });
      host.querySelector('.mq-after').innerHTML = `<div class="why"><b>${ok ? 'Ακριβώς.' : 'Η σωστή είναι η ' + q.correct + '.'}</b> ${esc(q.why)}
        ${!ok && q.wrong[pick] ? `<span class="no"><b>Γιατί όχι η ${pick}:</b> ${esc(q.wrong[pick])}</span>` : ''}
        ${!ok ? '<span class="no">Δεν πειράζει: έγινε κάρτα επανάληψης και θα σου ξανάρθει σε 1 μέρα.</span>' : ''}</div>
        <div class="qfoot"><button class="btn btn-gold mq-next">Συνέχεια →</button></div>`;
      host.querySelector('.mq-next').onclick = () => onDone(ok);
    });
  };
  draw();
}
function questionsSeq(host, qs, opts, done){
  let i = 0;
  const next = () => { if (i >= qs.length) return done(); const q = qs[i]; i++;
    miniQ(host, q, Object.assign({}, opts, {label:(opts.label || '') + ` · ${i}/${qs.length}`, onDone:() => { next(); host.scrollIntoView({block:'start', behavior:'smooth'}); }})); };
  next();
}

/* ── the session ───────────────────────────────────────────────────── */
const SBLOCKS = {
  warm:{t:'Ζέσταμα', m:2}, listen:{t:'Άκου το επεισόδιο', m:0}, recall:{t:'Quiz κεφαλαίου', m:5}, click:{t:'Ένα «κλικ»', m:5},
  coach:{t:'Situational', m:7}, test:{t:'Τεστ ετοιμότητας', m:15}, mist:{t:'Τα λάθη σου', m:3}, close:{t:'Κλείσιμο', m:2},
};
async function viewSession(mini){
  setView('session'); scrollTo(0, 0);
  app.innerHTML = '<div class="loading">Ετοιμάζω τη συνεδρία…</div>';
  await loadBank().catch(() => {});
  let s = store.get(SESS, null);
  const kind = mini ? 'mini' : 'full';
  if (!s || s.date !== today() || s.kind !== kind || s.step >= s.blocks.length)
    s = {date:today(), kind, ch:sessCh(), step:0, blocks: mini ? ['warm', 'coach', 'close'] : allHeard() ? ['warm', 'test', 'mist', 'close'] : ['warm', 'listen', 'recall', 'click', 'coach', 'mist', 'close'], t0:Date.now()};
  store.set(SESS, s);
  const ch = s.ch, c = chOf(ch);
  const save = () => store.set(SESS, s);
  const advance = () => { markDay(1); s.step++; save(); draw(); scrollTo({top:0, behavior:'smooth'}); };
  const stop = () => { markDay(0); s.step = s.blocks.length - 1; save(); draw(); };

  function draw(){
    const k = s.blocks[s.step], B = SBLOCKS[k];
    app.innerHTML = `<div class="sess">
      <div class="sess-top"><button class="back" data-nav="#/">${IC.left} Αρχική</button>
        <div class="sess-seg">${s.blocks.map((b, i) => `<i class="${i < s.step ? 'd' : i === s.step ? 'c' : ''}" title="${SBLOCKS[b].t}"></i>`).join('')}</div></div>
      <p class="eyebrow">${mini ? 'Μόνο 2 λεπτά' : 'Συνεδρία'} · Κεφ. ${pad2(ch)} · ${esc(c ? c.title : '')}</p>
      <h1 class="sess-h">${B.t} <small>~${k === 'listen' ? Math.max(1, Math.round(((c ? c.seconds : 600) - (chState(ch).pos || 0)) / 60)) : mini && k === 'coach' ? 1 : B.m}′</small></h1>
      <div id="sb"></div>
      ${k !== 'close' ? `<div class="sess-foot"><button class="btn btn-ghost" id="s-skip">Παράλειψη</button><button class="btn btn-ghost" id="s-stop">Σταματάω εδώ · μετράει</button></div>` : ''}
    </div>`;
    if ($('#s-skip')) $('#s-skip').onclick = advance;
    if ($('#s-stop')) $('#s-stop').onclick = stop;
    (R[k] || (() => advance()))($('#sb'));
  }

  const chQs = n => (BANK || []).filter(q => q.ch === n);
  const answered = new Set(store.get('pmp8.answers.v1', []).filter(x => x.ok).map(x => x.id));
  const R = {
    warm(h){
      const hook = store.get(HOOK, null), hq = hook && hook.date !== today() && (BANK || []).find(q => q.id === hook.id);
      const known = store.get('pmp8.cards.v1', {}), pool0 = CARDS.filter(k => k.ch <= ch), pool = pool0.length >= 3 ? pool0 : CARDS.filter(k => k.ch <= ch + 2).concat(pool0.length ? [] : CARDS).slice(0, 60);
      const kn = pool.filter(k => known[cardId(k)]), cards = shuffleArr(kn.length >= 3 ? kn : pool).slice(0, mini ? 2 : 3);
      const doCards = () => {
        let i = 0, flip = false;
        const dc = () => {
          if (i >= cards.length) return advance();
          const k = cards[i];
          h.innerHTML = `<p class="sess-say">${i === 0 ? 'Εύκολο ξεκίνημα: θυμήσου τον ορισμό και πάτα την κάρτα.' : 'Ωραία. Άλλη μία.'}</p>
            <button class="flash${flip ? ' flipped' : ''}" id="wf"><span class="fl-k">Κάρτα ${i + 1}/${cards.length} · Κεφ. ${pad2(k.ch)}</span><span class="fl-t">${esc(k.t)}</span>
              ${flip ? `<span class="fl-d guide">${k.d}</span>` : '<span class="fl-hint">Πάτα για τον ορισμό</span>'}</button>
            ${flip ? '<div class="qfoot"><button class="btn btn-gold" id="wn">Επόμενη →</button></div>' : ''}`;
          $('#wf').onclick = () => { flip = !flip; dc(); };
          if ($('#wn')) $('#wn').onclick = () => { i++; flip = false; dc(); };
        };
        dc();
      };
      if (hq){ store.set(HOOK, null); h.innerHTML = '<p class="sess-say">Χθες σου άφησα μια ερώτηση. Πάμε να την κλείσουμε.</p><div id="hq"></div>';
        miniQ($('#hq'), hq, {label:'Η χθεσινή απορία', onDone:doCards}); }
      else doCards();
    },
    listen(h){
      if (chState(ch).heard >= .9) return advance();   /* already heard: straight to the quiz */
      const c = chOf(ch), total = c.seconds || 600;
      const left = () => P.ch === ch && P.ready ? Math.max(0, P.dur - P.a.currentTime) : Math.max(0, total - (chState(ch).pos || 0));
      const fmt = x => Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0');
      h.innerHTML = `<p class="sess-say">Άκου ολόκληρο το επεισόδιο, χαλαρά — μπορείς να κλείσεις τα μάτια. Όταν τελειώσει, περνάμε μόνοι μας στο επόμενο. Αν κουραστείς, πάτα «Σταματάω εδώ»: συνεχίζει από το ίδιο σημείο την επόμενη φορά.</p>
        <div class="lis"><button class="lis-btn" data-play="${ch}">${IC.play}${IC.pause}</button>
          <div class="lis-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="r0"/><circle cx="60" cy="60" r="52" class="r1" id="lr"/></svg><b id="lt"></b><small class="lis-s">απομένουν</small></div></div>
        <p class="hint" style="text-align:center">Κεφάλαιο ${pad2(ch)} · επεισόδιο ${Math.round(total / 60)}′</p>`;
      const C = 2 * Math.PI * 52;
      const upd = () => { const l = left();
        $('#lr') && ($('#lr').style.strokeDasharray = `${C * Math.min(1, 1 - l / total)} ${C}`);
        $('#lt') && ($('#lt').textContent = fmt(l)); };
      let t0 = null;
      const tick = () => { if (!$('#lt')) return off(); if (P.ch === ch && !P.a.paused){ if (t0 === null) t0 = Date.now(); } upd(); };
      const end = () => { if (!$('#lt') || P.ch !== ch) return off(); off(); markDay(0, t0 ? Math.round((Date.now() - t0) / 1000) : 0); setTimeout(() => { if (!P.a.paused) P.a.pause(); }, 50); advance(); };
      const off = () => { P.a.removeEventListener('timeupdate', tick); P.a.removeEventListener('ended', end); };
      P.a.addEventListener('timeupdate', tick); P.a.addEventListener('ended', end); upd();
    },
    recall(h){
      /* the chapter's own quiz (book questions; extra for chapter 1): the score updates the chapter */
      const c = chOf(ch), set = mainSet(c), qs = (BANK || []).filter(q => q.ch === ch && q.set === set);
      if (!qs.length) return advance();
      const t0 = store.get('pmp8.answers.v1', []).length;
      h.innerHTML = `<p class="sess-say">Το quiz του κεφαλαίου: ${qs.length} ερωτήσεις πάνω σε ό,τι μόλις άκουσες. Με 70% και πάνω, το κεφάλαιο γίνεται ✓ στη διαδρομή σου.</p><div id="rq"></div>`;
      questionsSeq($('#rq'), shuffleArr(qs), {label:'Quiz κεφαλαίου'}, () => {
        const got = store.get('pmp8.answers.v1', []).slice(t0), pct = got.length ? Math.round(100 * got.reduce((a, x) => a + x.ok, 0) / got.length) : 0;
        const key = scoreKey(c, set), prev = chState(ch)[key];
        if (prev === null || prev === undefined || pct > prev) setCh(ch, {[key]:pct});
        h.innerHTML = `<div class="sess-end"><p class="sess-big">${pct}%</p><p class="hint">${pct >= PASS ? 'Πέρασες το κεφάλαιο ✓' : 'Κάτω από 70%: τα λάθη έγιναν κάρτες επανάληψης. Την επόμενη φορά το ξαναδοκιμάζεις — μετράει το καλύτερο σκορ.'}</p></div>
          <div class="qfoot"><button class="btn btn-gold" id="rn">Συνέχεια →</button></div>`;
        $('#rn').onclick = advance;
      });
    },
    click(h){
      const L = labsFor(ch), lab = L.find(l => !/maps|drills/.test(l.h)) || L[0];
      h.innerHTML = `<p class="sess-say">Μία έννοια, σε εικόνα. Άνοιξέ το, παίξε λίγο, και πάτα «Συνέχεια συνεδρίας» πάνω αριστερά για να γυρίσεις.</p>
        <button class="sess-lab" id="sl">${IC.viz}<span><b>${esc(lab.t)}</b><small>Κεφάλαιο ${pad2(ch)}</small></span><i>→</i></button>`;
      $('#sl').onclick = () => { LAB_FROM = '#/session'; markDay(1); s.step++; save(); location.hash = lab.h; };
    },
    coach(h){
      const done = new Set([...answered]);
      const pool = (BANK || []).filter(q => q.ch && q.ch <= Math.max(ch, 4) && !done.has(q.id));
      const qs = shuffleArr(pool.length >= 4 ? pool : (BANK || [])).slice(0, mini ? 1 : 4);
      h.innerHTML = `<p class="sess-say">Λειτουργία προπονητή: χωρίς χρόνο, χωρίς σκορ. Αν δυσκολευτείς, πάτα «Βοήθεια» και θα μείνουν οι δύο πιο πιθανές — εκεί κρίνεται η εξέταση.</p><div id="cq"></div>`;
      questionsSeq($('#cq'), qs, {coach:true, label:'Situational'}, advance);
    },
    test(h){
      /* after the whole syllabus: 12 mixed questions, weighted towards the weakest ECO tasks */
      const st = typeof taskStats === 'function' ? taskStats() : {}, rate = t => st[t] && st[t].n ? st[t].ok / st[t].n : .5;
      const pool = shuffleArr((BANK || []).filter(q => !answered.has(q.id))).sort((a, b) => rate(a.task) - rate(b.task));
      const qs = shuffleArr(pool.slice(0, 30)).slice(0, 12);
      if (!qs.length) return advance();
      let ok = 0;
      h.innerHTML = `<p class="sess-say">Τέλειωσες όλη την ύλη. Τώρα κάθε συνεδρία είναι ένα μικρό τεστ 12 ερωτήσεων από όλα τα κεφάλαια, με περισσότερες από τα ECO tasks όπου είσαι πιο αδύναμος. Στο τέλος βλέπεις το σκορ.</p><div id="tq"></div>`;
      questionsSeq($('#tq'), qs.map(q => Object.assign({}, q)), {label:'Τεστ', coach:false}, () => {
        const log = store.get('pmp8.answers.v1', []).slice(-qs.length), sc = Math.round(100 * log.reduce((a, x) => a + x.ok, 0) / qs.length);
        const T = store.get('pmp8.tests.v1', []); T.push({d:today(), sc}); store.set('pmp8.tests.v1', T);
        h.innerHTML = `<div class="sess-end"><p class="sess-big">${sc}%</p><p class="hint">${sc >= 75 ? 'Επίπεδο εξέτασης. Αν το κρατήσεις και στις πλήρεις προσομοιώσεις, είσαι έτοιμος.' : sc >= 65 ? 'Κοντά. Τα λάθη έγιναν κάρτες επανάληψης — συνέχισε έτσι.' : 'Τα λάθη έγιναν κάρτες επανάληψης. Η εξάσκηση ανά ECO task θα σε ανεβάσει γρήγορα.'}</p>
          <p class="hint">Τελευταία τεστ: ${T.slice(-5).map(t => t.sc + '%').join(' · ')}</p></div>
          <div class="qfoot"><button class="btn btn-gold" id="tn">Συνέχεια →</button></div>`;
        $('#tn').onclick = advance;
      });
    },
    mist(h){
      const due = srsDue().slice(0, 3), qs = due.map(id => (BANK || []).find(q => q.id === id)).filter(Boolean);
      if (!qs.length){ h.innerHTML = '<p class="sess-say">Κανένα λάθος για επανάληψη σήμερα. ✓</p><div class="qfoot"><button class="btn btn-gold" id="mn">Συνέχεια →</button></div>'; $('#mn').onclick = advance; return; }
      h.innerHTML = `<p class="sess-say">${qs.length} ερωτήσεις που είχες χάσει. Δύο σωστές στη σειρά και φεύγουν για πάντα.</p><div id="mq"></div>`;
      questionsSeq($('#mq'), qs, {label:'Επανάληψη'}, advance);
    },
    close(h){
      const mins = Math.max(1, Math.round((Date.now() - s.t0) / 60000)), r = readiness();
      let hook = store.get(HOOK, null);
      if (!hook || hook.date !== today()){
        const nextCh = chState(ch).heard >= .9 && chOf(ch + 1) ? ch + 1 : ch;
        const cand = shuffleArr(chQs(nextCh).filter(q => !answered.has(q.id)))[0] || shuffleArr(chQs(nextCh))[0];
        hook = cand ? {id:cand.id, date:today()} : null; store.set(HOOK, hook);
      }
      const hq = hook && (BANK || []).find(q => q.id === hook.id);
      markDay(0);
      h.innerHTML = `<div class="sess-end"><p class="sess-big">Τέλος για σήμερα. Μπράβο.</p>
        <p class="hint">${mins}′ · η μέρα μετράει ✓</p><div class="wds big">${weekDots()}</div>
        <div class="rd"><span>Ετοιμότητα <b>${r.score}%</b> <small>(κάλυψη ύλης ${Math.round(r.cov * 100)}% · ακρίβεια ${r.n ? Math.round(r.acc * 100) + '%' : '—'})</small></span><div class="rd-bar"><i style="width:${r.score}%"></i><em style="left:75%"></em></div></div></div>
        <label class="sess-j"><span>Μία πρόταση: τι κράτησες σήμερα; <small>(προαιρετικό)</small></span><textarea id="sj" rows="2" placeholder="π.χ. Το CPI κάτω από 1 σημαίνει υπέρβαση κόστους"></textarea></label>
        ${hq ? `<div class="sess-hook"><small>Αύριο ξεκινάμε με αυτό:</small><p>${esc(hq.q)}</p><span>Μην ψάξεις την απάντηση — άσ' τη να «δουλέψει» μέσα σου.</span></div>` : ''}
        <div class="qfoot">${mini ? '<button class="btn btn-ghost" data-nav="#/session">Έχω κουράγιο για 30′ →</button>' : ''}<button class="btn btn-gold" id="sdone">Κλείσιμο</button></div>`;
      $('#sdone').onclick = () => { const t = $('#sj').value.trim(); if (t){ const j = store.get(JOURNAL, []); j.push({d:today(), ch, t}); store.set(JOURNAL, j); }
        s.step = s.blocks.length; save(); location.hash = '#/'; };
    },
  };
  draw();
}
