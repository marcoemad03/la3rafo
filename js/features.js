// لوحة الأمناء، قائمة الشرف، أسئلة الأصحاحات، الامتحانات، القراءة بالصوت، مشاركة آية كصورة
import { DAYS, ar, fmtDate, todayCairo, BOOKS } from './plan.js';
import { api, store } from './data.js';
import { $, $$, esc, APP, S, reduce, first, avatar, toast, vibrate, meU, topbar, logos, burst, ICON } from './ui.js';
import { userStats, weekStats, weekRange } from './stats.js';

// ---------------------------------------------------------------- the lamp
let lampN = 0;
export function lamp(level, lit, size = 64) {
  const id = 'lc' + (++lampN); const lv = Math.max(0, Math.min(1, level));
  const top = 30, bot = 84; const y = bot - (bot - top) * lv; const fy = Math.max(top - 2, y - 2);
  const H = size * 1.5;
  return `<svg class="lamp ${lit ? 'lit' : ''}" width="${size}" height="${H}" viewBox="0 0 64 96" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="M14 30h36c2 0 4 2 4 4v38c0 9-8 16-17 16h-10c-9 0-17-7-17-16V34c0-2 2-4 4-4z"/></clipPath>
    <linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE3A2"/><stop offset=".35" stop-color="#F2C46D"/><stop offset="1" stop-color="#B8862E"/></linearGradient>
    <radialGradient id="${id}h"><stop offset="0" stop-color="rgba(255,214,140,.75)"/><stop offset="1" stop-color="rgba(255,214,140,0)"/></radialGradient></defs>
    <circle class="halo" cx="32" cy="${fy - 8}" r="26" fill="url(#${id}h)"/>
    <path class="metal" d="M32 2v8M22 12h20l-3 8H25z" fill="#02304A" stroke="#02304A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="metal" d="M18 22h28v6H18z" fill="#02304A"/>
    <path class="glass" d="M14 30h36c2 0 4 2 4 4v38c0 9-8 16-17 16h-10c-9 0-17-7-17-16V34c0-2 2-4 4-4z"/>
    <g clip-path="url(#${id})"><path class="oil" d="M6 ${y + 1.5}q6.5-3 13 0t13 0t13 0t13 0V100H6z" fill="url(#${id}o)"/></g>
    <path d="M17 38v30" stroke="rgba(255,255,255,.75)" stroke-width="2.5" stroke-linecap="round"/>
    <g class="flame"><path d="M32 ${fy - 20}c5 6 7 10 5 15-1 3-3 5-5 5s-4-2-5-5c-2-5 0-9 5-15z" fill="url(#flg)"/><path d="M32 ${fy - 9}c2 2 3 4 2 6-.5 1-1 2-2 2s-1.5-1-2-2c-1-2 0-4 2-6z" fill="#fff6d6"/></g>
    <path class="metal" d="M22 88h20l2 6H20z" fill="#02304A"/>
  </svg>`;
}
const flameDefs = '<svg width="0" height="0" style="position:absolute"><defs><radialGradient id="flg" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#fff3c8"/><stop offset=".45" stop-color="#F7B84A"/><stop offset="1" stop-color="#E5612A"/></radialGradient></defs></svg>';

// ---------------------------------------------------------------- board (لوحة الأمناء + قائمة الشرف)
export function vBoard(sub) {
  const tab = sub || S.jTab || 'mountain';
  if (tab === 'mountain') return false; // handled by the journey view
  const segs = `<div class="seg" role="tablist"><a href="#/journey/mountain" class="${tab === 'mountain' ? 'on' : ''}">الجبل</a><a href="#/journey/lamps" class="${tab === 'lamps' ? 'on' : ''}">لوحة الأمناء</a><a href="#/journey/honor" class="${tab === 'honor' ? 'on' : ''}">قائمة الشرف</a></div>`;
  if (tab === 'lamps') boardLamps(segs); else boardHonor(segs);
  return true;
}
export function journeySegs(tab) {
  return `<div class="seg" role="tablist"><a href="#/journey/mountain" class="${tab === 'mountain' ? 'on' : ''}">الجبل</a><a href="#/journey/lamps" class="${tab === 'lamps' ? 'on' : ''}">لوحة الأمناء</a><a href="#/journey/honor" class="${tab === 'honor' ? 'on' : ''}">قائمة الشرف</a></div>`;
}
function boardLamps(segs) {
  const range = S.boardRange || 'all'; const t = todayCairo();
  const rows = S.users.map((u) => { const s = userStats(u, t); const w = weekStats(u, t); return { u, s, w, key: range === 'week' ? w.consistency * 1000 + w.onTime * 10 : s.onTime * 10000 + s.read * 100 + s.streak }; })
    .sort((a, b) => b.key - a.key || a.u.name.localeCompare(b.u.name, 'ar'));
  const lvl = (r) => (range === 'week' ? r.w.consistency / 100 : r.s.consistency / 100);
  const top = rows.slice(0, 3); const order = [top[1], top[0], top[2]].filter(Boolean);
  const meRank = rows.findIndex((r) => r.u.phone === S.me.phone);
  const [ws, we] = weekRange(t);
  APP.innerHTML = `<div class="view">${flameDefs}${topbar()}<div class="hello"><h1>لوحة الأمناء</h1><p class="verse-sub">«كُنْتَ أَمِينًا فِي الْقَلِيلِ فَأُقِيمُكَ عَلَى الْكَثِيرِ» (مت ٢٥: ٢١)</p></div>${segs}
  <div class="range"><button class="${range === 'all' ? 'on' : ''}" data-r="all">الرحلة كلها</button><button class="${range === 'week' ? 'on' : ''}" data-r="week">الأسبوع ده</button></div>
  <section class="altar">
    <p class="altar-note">الزيت = الانتظام في القراءة في معادها، والشعلة = قريت النهارده${range === 'week' ? `<br>من ${fmtDate(ws, false)} لـ ${fmtDate(we, false)}` : ''}</p>
    <div class="podium">${order.map((r) => { const rank = rows.indexOf(r) + 1; return `<div class="pod p${rank} ${r.u.phone === S.me.phone ? 'me' : ''}">
      <div class="pl">${lamp(lvl(r), r.s.readToday, rank === 1 ? 74 : 60)}</div><b class="pn">${esc(first(r.u.name))}</b>
      <span class="ps">${range === 'week' ? `${ar(r.w.onTime)} من ${ar(r.w.due)}` : `${ar(r.s.consistency)}٪ انتظام`}</span><div class="step"><span>${ar(rank)}</span></div></div>`; }).join('')}</div>
  </section>
  ${meRank >= 0 ? `<a class="mepill" href="#me-row">ترتيبك <b>${ar(meRank + 1)}</b> من ${ar(rows.length)}${meRank > 0 ? ` <small>فاضلك ${ar(Math.max(1, Math.ceil((rows[meRank - 1].key - rows[meRank].key) / (range === 'week' ? 1000 : 10000)) || 1))} يوم في معاده وتعدّي اللي قبلك</small>` : ' 👑'}</a>` : ''}
  <ol class="lamps">${rows.map((r, i) => `<li class="lrow ${r.u.phone === S.me.phone ? 'me' : ''}" ${r.u.phone === S.me.phone ? 'id="me-row"' : ''} style="--i:${Math.min(i, 14)}">
    <span class="rk">${ar(i + 1)}</span>${lamp(lvl(r), r.s.readToday, 30)}<span class="ln"><b>${esc(r.u.name)}</b>
    <small>${range === 'week' ? `${ar(r.w.onTime)} يوم في معاده من ${ar(r.w.due)}` : `${ar(r.s.onTime)} في معاده${r.s.late ? ` <i class="lt">${ar(r.s.late)} متأخر</i>` : ''}${r.s.streak > 1 ? ` <i class="st">🔥${ar(r.s.streak)}</i>` : ''}`}</small></span>
    <span class="pc">${ar(range === 'week' ? r.w.consistency : r.s.consistency)}٪</span></li>`).join('')}</ol>
  ${logos()}</div>`;
  $$('.range button').forEach((b) => b.onclick = () => { S.boardRange = b.dataset.r; boardLamps(segs); });
  if (!reduce) $$('.lamp .oil').forEach((o, i) => o.animate([{ transform: 'translateY(60px)' }, { transform: 'none' }], { duration: 1500, easing: 'cubic-bezier(.2,.8,.2,1)', delay: 120 + Math.min(i, 12) * 40, fill: 'backwards' }));
}
function boardHonor(segs) {
  const pub = S.exams.filter((e) => e.status === 'published' && (e.results || []).length).sort((a, b) => b.createdAt - a.createdAt);
  // overall: sum of exam scores
  const tot = {}; pub.forEach((e) => e.results.forEach((r) => { const k = r.phone; tot[k] = tot[k] || { name: r.name, phone: r.phone, score: 0, total: 0, n: 0 }; tot[k].score += r.score; tot[k].total += r.total; tot[k].n++; }));
  const overall = Object.values(tot).sort((a, b) => b.score - a.score);
  const medal = (i) => ['🥇', '🥈', '🥉'][i] || ar(i + 1);
  const list = (rs, isExam) => `<ol class="honor">${rs.map((r, i) => `<li class="${r.phone === S.me.phone ? 'me' : ''} ${i < 3 ? 'top' : ''}"><span class="md">${medal(i)}</span><span class="hn">${esc(r.name)}</span><span class="hs">${ar(r.score)}<small>/${ar(r.total)}</small></span>${isExam && r.dur ? `<span class="ht">${ar(Math.floor(r.dur / 60))}:${ar(String(r.dur % 60).padStart(2, '0'))}</span>` : ''}</li>`).join('')}</ol>`;
  const open = S.exams.filter((e) => e.status === 'open');
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>قائمة الشرف</h1><p>أوائل الامتحانات، وكل امتحان له قائمته</p></div>${segs}
  ${open.map((e) => `<a class="card exam-cta" href="#/exam/${e.id}"><span class="ei">📝</span><span class="grow"><b>${esc(e.title)}</b><small>الامتحان مفتوح دلوقتي، ادخل امتحن</small></span>${ICON.back}</a>`).join('')}
  ${overall.length ? `<section class="card honor-card gold"><h2>الترتيب العام</h2><p class="sub">مجموع درجات كل الامتحانات</p>${list(overall.slice(0, 10), false)}</section>` : ''}
  ${pub.map((e) => `<section class="card honor-card"><h2>${esc(e.title)}</h2>${e.desc ? `<p class="sub">${esc(e.desc)}</p>` : ''}${list(e.results.slice(0, 10), true)}
    ${(() => { const i = e.results.findIndex((r) => r.phone === S.me.phone); return i >= 10 ? `<p class="mine">ترتيبك ${ar(i + 1)}: ${ar(e.results[i].score)} من ${ar(e.results[i].total)}</p>` : ''; })()}</section>`).join('')}
  ${!pub.length ? `<section class="card empty"><div class="big">🏆</div><h2>لسه مفيش نتايج</h2><p class="sub">أول ما الخدام يعلنوا نتيجة امتحان، الأوائل هيظهروا هنا.</p></section>` : ''}
  ${logos()}</div>`;
}

// ---------------------------------------------------------------- chapter quiz (اختبر نفسك)
export function chapterQuiz(el, key, label) {
  const qz = S.chq[key]; if (!el || !qz || !(qz.questions || []).length) { if (el) el.innerHTML = ''; return; }
  const Q = qz.questions; const done = (meU().quiz || {})[key];
  if (done) {
    el.innerHTML = `<section class="card quiz done"><div class="between"><h2>اختبر نفسك</h2><span class="score">${ar(done.c)} / ${ar(done.t)}</span></div><p class="sub">جاوبت على أسئلة ${esc(label)} قبل كده.</p><button class="btn ghost block" id="qrev" style="margin-top:12px">راجع الإجابات</button><div id="qrevb"></div></section>`;
    $('#qrev', el).onclick = () => { $('#qrevb', el).innerHTML = Q.map((q, i) => `<div class="qrev"><b>${ar(i + 1)}. ${esc(q.q)}</b><p>✓ ${esc(q.options[q.answer])}</p>${q.explain ? `<small>${esc(q.explain)}</small>` : ''}</div>`).join(''); $('#qrev', el).remove(); };
    return;
  }
  let i = 0, c = 0;
  el.innerHTML = `<section class="card quiz"><div class="between"><h2>اختبر نفسك</h2><span class="qdots">${Q.map((_, k) => `<i data-k="${k}"></i>`).join('')}</span></div><p class="sub">${ar(Q.length)} ${Q.length > 2 && Q.length < 11 ? 'أسئلة' : 'سؤال'} على ${esc(label)}. كل إجابة صح بـ٣ نقط.</p><div class="qbody" id="qb"></div></section>`;
  const body = $('#qb', el);
  const show = () => {
    const q = Q[i];
    body.innerHTML = `<p class="qq">${esc(q.q)}</p><div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}"><span>${'أبجد'[k] || ar(k + 1)}</span>${esc(o)}</button>`).join('')}</div><div class="qexp" id="qx"></div>`;
    body.animate?.([{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' });
    $$('.opt', body).forEach((b) => b.onclick = () => {
      const k = +b.dataset.k; const ok = k === q.answer; if (ok) c++;
      $$('.opt', body).forEach((x) => { x.disabled = true; if (+x.dataset.k === q.answer) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong'); vibrate(ok ? 20 : [30, 60, 30]);
      $(`.qdots i[data-k="${i}"]`, el).classList.add(ok ? 'ok' : 'no');
      if (ok) { const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 40); }
      $('#qx', body).innerHTML = `<p class="${ok ? 'good' : 'bad'}">${ok ? 'صح! 👏' : 'مش دي…'}</p>${q.explain ? `<small>${esc(q.explain)}</small>` : ''}<button class="btn primary block" id="qn">${i < Q.length - 1 ? 'السؤال اللي بعده' : 'خلّصت'}</button>`;
      $('#qn', body).onclick = async () => {
        if (i < Q.length - 1) { i++; show(); return; }
        try { await api.answerChq(key, c, Q.length); } catch (e) { console.error(e); }
        body.innerHTML = `<div class="qend"><div class="big">${c === Q.length ? '🌟' : c ? '👍' : '📖'}</div><h3>${ar(c)} من ${ar(Q.length)}</h3><p class="sub">${c === Q.length ? 'كله صح! ربنا يبارك قرايتك' : 'كويس… ارجع للأصحاح تاني وهتلاقي الإجابات'}</p></div>`;
        if (c === Q.length) { const r = body.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 40, 120); }
      };
    });
  };
  show();
}

// ---------------------------------------------------------------- exams
export async function examBanner(el) {
  if (!el) return; const open = S.exams.filter((e) => e.status === 'open'); if (!open.length) { el.innerHTML = ''; return; }
  const out = [];
  for (const e of open) { const s = await api.mySubmission(e.id); if (!s) out.push(e); }
  el.innerHTML = out.map((e) => `<a class="card exam-cta" href="#/exam/${e.id}"><span class="ei">📝</span><span class="grow"><b>${esc(e.title)}</b><small>امتحان مفتوح، ${ar(e.questions.length)} سؤال، مرة واحدة بس</small></span>${ICON.back}</a>`).join('');
}
export async function vExam(id) {
  const e = S.exams.find((x) => x.id === id);
  if (!e) { APP.innerHTML = `<div class="view">${topbar()}<section class="card empty"><div class="big">📝</div><h2>الامتحان مش موجود</h2><a class="btn primary" href="#/journey/honor">قائمة الشرف</a></section></div>`; return; }
  const mine = await api.mySubmission(id);
  const head = `<div class="rhead"><a class="iconbtn" href="#/journey/honor" aria-label="رجوع">${ICON.back}</a><b class="grow">${esc(e.title)}</b></div>`;
  if (e.status === 'published') {
    const i = (e.results || []).findIndex((r) => r.phone === S.me.phone); const r = e.results[i];
    APP.innerHTML = `<div class="view">${head}<section class="card result">${r ? `<div class="big">${i < 3 ? ['🥇', '🥈', '🥉'][i] : '🎓'}</div><h2>${ar(r.score)} من ${ar(r.total)}</h2><p class="sub">ترتيبك ${ar(i + 1)} من ${ar(e.results.length)}</p>` : '<div class="big">📝</div><h2>النتيجة اتعلنت</h2><p class="sub">مكنتش دخلت الامتحان ده.</p>'}
      <a class="btn primary block" href="#/journey/honor" style="margin-top:14px">شوف قائمة الشرف</a></section></div>`;
    if (r && i < 3) setTimeout(() => burst(innerWidth / 2, 200, 140), 300); return;
  }
  if (mine) { APP.innerHTML = `<div class="view">${head}<section class="card result"><div class="big">✅</div><h2>إجاباتك اتسلّمت</h2><p class="sub">النتيجة وقائمة الشرف هيظهروا أول ما الخدام يعلنوها.</p></section></div>`; return; }
  if (e.status !== 'open') { APP.innerHTML = `<div class="view">${head}<section class="card result"><div class="big">⏳</div><h2>الامتحان مقفول دلوقتي</h2></section></div>`; return; }
  APP.innerHTML = `<div class="view">${head}<section class="card exam-intro"><div class="big">📝</div><h2>${esc(e.title)}</h2>${e.desc ? `<p class="sub">${esc(e.desc)}</p>` : ''}
    <ul class="rules"><li>${ar(e.questions.length)} سؤال اختيار من متعدد</li><li>تقدر تدخله مرة واحدة بس</li><li>الوقت بيتحسب، ولو اتساوت الدرجات الأسرع بيسبق</li></ul>
    <button class="btn red block" id="xgo">ابدأ الامتحان</button></section></div>`;
  $('#xgo').onclick = () => runExam(e, head);
}
function runExam(e, head) {
  const Q = e.questions; const ans = Array(Q.length).fill(null); let i = 0; const t0 = Date.now(); let tick;
  const draw = () => {
    const q = Q[i];
    APP.innerHTML = `<div class="view">${head}<div class="xbar"><div class="xprog"><i style="width:${(i / Q.length) * 100}%"></i></div><span id="xt">٠:٠٠</span></div>
    <section class="card xq"><p class="qn">سؤال ${ar(i + 1)} من ${ar(Q.length)}</p><p class="qq">${esc(q.q)}</p>
    <div class="opts">${q.options.map((o, k) => `<button class="opt ${ans[i] === k ? 'picked' : ''}" data-k="${k}"><span>${'أبجد'[k] || ar(k + 1)}</span>${esc(o)}</button>`).join('')}</div>
    <div class="actions">${i > 0 ? '<button class="btn ghost" id="xp">السابق</button>' : ''}<button class="btn ${i === Q.length - 1 ? 'red' : 'primary'}" id="xn" ${ans[i] == null ? 'disabled' : ''}>${i === Q.length - 1 ? 'سلّم الإجابات' : 'التالي'}</button></div></section></div>`;
    $$('.opt').forEach((b) => b.onclick = () => { ans[i] = +b.dataset.k; $$('.opt').forEach((x) => x.classList.toggle('picked', x === b)); $('#xn').disabled = false; vibrate(10); });
    $('#xp') && ($('#xp').onclick = () => { i--; draw(); });
    $('#xn').onclick = async () => {
      if (i < Q.length - 1) { i++; draw(); return; }
      clearInterval(tick); $('#xn').disabled = true; const dur = Math.round((Date.now() - t0) / 1000);
      const ok = await api.submitExam(e.id, ans, dur);
      APP.innerHTML = `<div class="view">${head}<section class="card result"><div class="big">${ok ? '✅' : '⚠️'}</div><h2>${ok ? 'إجاباتك اتسلّمت' : 'مقدرناش نسلّم الإجابات'}</h2><p class="sub">${ok ? 'النتيجة وقائمة الشرف هيظهروا أول ما الخدام يعلنوها.' : 'يمكن الامتحان اتقفل أو سلّمته قبل كده.'}</p><a class="btn primary block" href="#/today" style="margin-top:14px">رجوع للنهارده</a></section></div>`;
      if (ok) burst(innerWidth / 2, 220, 100);
    };
    clearInterval(tick); tick = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); const x = $('#xt'); if (!x) return clearInterval(tick); x.textContent = `${ar(Math.floor(s / 60))}:${ar(String(s % 60).padStart(2, '0'))}`; }, 1000);
  };
  draw();
}

// ---------------------------------------------------------------- listen to the chapter
export function ttsSetup(btn, verseEls) {
  const synth = window.speechSynthesis; if (!btn) return;
  if (!synth) { btn.remove(); return; }
  let playing = false; let idx = 0;
  const pickVoice = () => { const vs = synth.getVoices(); return vs.find((v) => /^ar(-EG)?/i.test(v.lang) && /EG/i.test(v.lang)) || vs.find((v) => /^ar/i.test(v.lang)) || null; };
  const stop = () => { playing = false; synth.cancel(); verseEls.forEach((v) => v.classList.remove('speaking')); btn.classList.remove('on'); btn.setAttribute('aria-label', 'اسمع الأصحاح'); };
  const speakNext = () => {
    if (!playing || idx >= verseEls.length) return stop();
    const el = verseEls[idx]; verseEls.forEach((v) => v.classList.toggle('speaking', v === el));
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    const u = new SpeechSynthesisUtterance(el.dataset.t || el.textContent); const v = pickVoice(); if (v) u.voice = v; u.lang = v?.lang || 'ar-EG'; u.rate = .92;
    u.onend = () => { idx++; speakNext(); }; u.onerror = () => stop(); synth.speak(u);
  };
  btn.onclick = () => {
    if (playing) return stop();
    if (!pickVoice() && synth.getVoices().length) toast('مفيش صوت عربي على جهازك… هنجرّب بالصوت الافتراضي');
    playing = true; btn.classList.add('on'); btn.setAttribute('aria-label', 'وقّف الصوت');
    const sel = verseEls.findIndex((v) => v.classList.contains('sel')); idx = sel >= 0 ? sel : 0; speakNext();
  };
  addEventListener('hashchange', stop, { once: true });
}

// ---------------------------------------------------------------- share a verse as an image
export async function shareVerseImage(text, ref) {
  await document.fonts.ready; const W = 1080, H = 1350; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const img = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = s; });
  const [em, nm] = await Promise.all([img('assets/img/emblem.png'), img('assets/img/name.png')]);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04395a'); g.addColorStop(1, '#011f31'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = c.createRadialGradient(W / 2, 330, 20, W / 2, 330, 700); r.addColorStop(0, 'rgba(242,196,109,.35)'); r.addColorStop(1, 'rgba(242,196,109,0)'); c.fillStyle = r; c.fillRect(0, 0, W, H);
  if (em) { c.globalAlpha = .07; c.drawImage(em, W - 520, H - 640, 600, 794); c.globalAlpha = 1; }
  c.direction = 'rtl'; c.textAlign = 'center'; c.fillStyle = '#F2C46D'; c.font = '700 150px Amiri'; c.fillText('«', W / 2, 270);
  // wrap text
  let fs = 66; let lines;
  const wrap = () => { c.font = `700 ${fs}px Amiri`; const words = text.split(/\s+/); lines = []; let cur = '';
    words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > W - 200 && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); };
  wrap(); while (lines.length * fs * 1.75 > 700 && fs > 34) { fs -= 4; wrap(); }
  const lh = fs * 1.75; let y = 330 + (700 - lines.length * lh) / 2 + fs;
  c.fillStyle = '#FDF3D8'; lines.forEach((l) => { c.fillText(l, W / 2, y); y += lh; });
  c.fillStyle = '#F2C46D'; c.font = '700 44px Messiri'; c.fillText(ref, W / 2, y + 30);
  c.fillStyle = 'rgba(253,243,216,.18)'; c.fillRect(W / 2 - 160, H - 230, 320, 2);
  if (nm) { const w = 230, h = w * nm.height / nm.width; const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; const t = tmp.getContext('2d'); t.drawImage(nm, 0, 0, w, h); t.globalCompositeOperation = 'source-in'; t.fillStyle = '#FDF3D8'; t.fillRect(0, 0, w, h); c.drawImage(tmp, W / 2 - w / 2, H - 200); }
  c.fillStyle = 'rgba(253,243,216,.6)'; c.font = '500 26px Messiri'; c.fillText('رحلة قراءة الكتاب المقدس', W / 2, H - 50);
  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png'));
  const file = new File([blob], 'آية-لأعرفه.png', { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `«${text}» (${ref})` }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob); const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box"><img src="${url}" alt="صورة الآية" style="width:100%;border-radius:16px"><p class="sub" style="margin:10px 0">اضغط مطوّل على الصورة واحفظها، أو نزّلها:</p><div class="actions"><a class="btn red" href="${url}" download="آية-لأعرفه.png">تنزيل</a><button class="btn ghost">قفل</button></div></div>`;
  document.body.appendChild(m); m.onclick = (ev) => { if (ev.target === m || ev.target.tagName === 'BUTTON') { m.remove(); URL.revokeObjectURL(url); } };
}
export { store };
