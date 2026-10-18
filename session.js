/* PMP 8 · "Πάμε": a ready-made 30-minute session for tired evenings.
   One button, no decisions: warm-up → listen → recall → one visual "click" →
   coach-mode situational questions → due mistakes → close with tomorrow's hook.
   Any block can be the last one; the day still counts. */
'use strict';

const SESS = 'pmp8.sess.cur', DAYS = 'pmp8.days.v1', HOOK = 'pmp8.hook', JOURNAL = 'pmp8.journal.v1';
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function markDay(blocks = 1, secs = 0){ const d = store.get(DAYS, {}), k = today(); d[k] = {b:((d[k] || {}).b || 0) + blocks, s:((d[k] || {}).s || 0) + secs}; store.set(DAYS, d); }

function sessCh(){
  const cur = store.get('pmp8.tutor.cur', null);
  if (cur && chOf(cur) && chState(cur).heard < .9) return cur;
  const c = CH.find(c => chState(c.id).heard < .9);
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

/* card on the home page, above everything else */
function sessCard(){
  const ch = sessCh(), c = chOf(ch), r = readiness(), s = store.get(SESS, null), going = s && s.date === today() && s.step > 0 && s.step < s.blocks.length;
  const active = Object.keys(store.get(DAYS, {})).length;
  return `<div class="sess-card">
    <button class="sess-go" data-nav="#/session"><span class="sg-play">${IC.play}</span>
      <span><b>${going ? 'Συνέχισε τη συνεδρία' : 'Πάμε'}</b><small>${going ? `μπλοκ ${s.step + 1} από ${s.blocks.length}` : `30′ χωρίς αποφάσεις · Κεφ. ${pad2(ch)} · ${esc(c ? c.title : '')}`}</small></span></button>
    <button class="sess-mini" data-nav="#/session/mini">Κουρασμένος; <b>Μόνο 2 λεπτά</b> — η μέρα μετράει</button>
    <div class="sess-meta"><div class="wds">${weekDots()}</div>
      <div class="rd"><span>Ετοιμότητα <b>${r.n < 10 && !r.cov ? '—' : r.score + '%'}</b>${r.n < 10 && !r.cov ? ' <small>φαίνεται μετά τις πρώτες 10 ερωτήσεις</small>' : ' <small>στόχος 75%</small>'}</span><div class="rd-bar"><i style="width:${r.score}%"></i><em style="left:75%"></em></div></div></div>
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
  warm:{t:'Ζέσταμα', m:2}, listen:{t:'Άκου', m:7}, recall:{t:'Θυμήσου', m:3}, click:{t:'Ένα «κλικ»', m:5},
  coach:{t:'Situational', m:7}, mist:{t:'Τα λάθη σου', m:3}, close:{t:'Κλείσιμο', m:2},
};
async function viewSession(mini){
  setView('session'); scrollTo(0, 0);
  app.innerHTML = '<div class="loading">Ετοιμάζω τη συνεδρία…</div>';
  await loadBank().catch(() => {});
  let s = store.get(SESS, null);
  const kind = mini ? 'mini' : 'full';
  if (!s || s.date !== today() || s.kind !== kind || s.step >= s.blocks.length)
    s = {date:today(), kind, ch:sessCh(), step:0, blocks: mini ? ['warm', 'coach', 'close'] : ['warm', 'listen', 'recall', 'click', 'coach', 'mist', 'close'], t0:Date.now()};
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
      <h1 class="sess-h">${B.t} <small>~${mini && k === 'coach' ? 1 : B.m}′</small></h1>
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
      const goal = 7 * 60; let got = s.lis || 0, last = null;
      h.innerHTML = `<p class="sess-say">Άκου χαλαρά. Μπορείς να κλείσεις τα μάτια — εγώ μετράω. Σε 7 λεπτά σταματάω και περνάμε στο επόμενο.</p>
        <div class="lis"><button class="lis-btn" data-play="${ch}">${IC.play}${IC.pause}</button>
          <div class="lis-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="r0"/><circle cx="60" cy="60" r="52" class="r1" id="lr"/></svg><b id="lt"></b></div></div>
        <p class="hint" style="text-align:center">Κεφάλαιο ${pad2(ch)} · έχεις ακούσει το ${Math.round(chState(ch).heard * 100)}%</p>`;
      const upd = () => { const left = Math.max(0, goal - got), C = 2 * Math.PI * 52;
        $('#lr') && ($('#lr').style.strokeDasharray = `${C * Math.min(1, got / goal)} ${C}`);
        $('#lt') && ($('#lt').textContent = Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0')); };
      const tick = () => {
        if (!$('#lt')) return P.a.removeEventListener('timeupdate', tick);
        const t = P.a.currentTime;
        if (P.ch === ch && !P.a.paused && last !== null && t > last && t - last < 3){ got += t - last; s.lis = got; if (Math.floor(got) % 5 === 0) save(); }
        last = t; upd();
        if (got >= goal){ P.a.removeEventListener('timeupdate', tick); P.a.pause(); markDay(0, goal); s.lis = 0; advance(); }
      };
      P.a.addEventListener('timeupdate', tick); upd();
    },
    recall(h){
      const pool = chQs(ch), fresh = pool.filter(q => !answered.has(q.id)), qs = shuffleArr(fresh.length >= 3 ? fresh : pool).slice(0, 3);
      if (!qs.length) return advance();
      h.innerHTML = '<p class="sess-say">Τρεις γρήγορες από όσα μόλις άκουσες. Χωρίς βαθμό — η προσπάθεια να θυμηθείς είναι που μένει στη μνήμη.</p><div id="rq"></div>';
      questionsSeq($('#rq'), qs, {label:'Θυμήσου'}, advance);
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
