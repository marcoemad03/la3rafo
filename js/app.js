import { DAYS, TOTAL, START, END, CHRISTMAS, SERVANTS, BADGES, BOOKS, ar, fmtDate, todayCairo, status, dueDays, streak, otLabel, ntLabel, passages, diffDays, addDays, weekday } from './plan.js';
import { init, api, on, mode, normPhone, validPhone } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const APP = $('#app'); const NAV = $('#nav');
const S = { me: null, users: [], wall: [], days: {}, text: null, wallTab: 'verse', fs: 21 };
try { S.fs = +localStorage.getItem('la3rafo:fs') || 21; } catch (e) { /* ignore */ }
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- helpers ----------
const PALETTE = ['#02304A', '#C22026', '#2E7D6B', '#B07A1E', '#6B3FA0', '#0E7C9E', '#A0522D', '#3D5A80'];
function color(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; }
const initial = (n) => (String(n || '؟').trim()[0] || '؟');
const first = (n) => String(n || '').trim().split(/\s+/)[0];
function avatar(name, size = 38) { return `<span class="av" style="background:${color(name)};width:${size}px;height:${size}px">${esc(initial(name))}</span>`; }
function timeAgo(ms) {
  const m = Math.max(1, Math.round((Date.now() - ms) / 6e4));
  if (m < 60) return `من ${ar(m)} دقيقة`; const h = Math.round(m / 60); if (h < 24) return `من ${ar(h)} ساعة`; return `من ${ar(Math.round(h / 24))} يوم`;
}
let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } }
function myRead() { const u = S.users.find((x) => x.phone === S.me?.phone) || S.me; return new Set((u && u.readDays) || []); }
function greeting() { const h = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false }).format(new Date()); return h < 12 ? 'صباح الخير' : h < 17 ? 'نهارك سعيد' : 'مساء الخير'; }
async function loadText() { if (!S.text) S.text = await (await fetch('data/text.json')).json(); return S.text; }
const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" style="fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round"><path d="M5 12l5 5 9-10"/></svg>',
  wa: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
};
function topbar() {
  const st = streak(myRead());
  return `<header class="top"><a class="brand" href="#/today" aria-label="لأعرفه"><img class="em" src="assets/img/emblem_s.png" alt=""><img class="nm" src="assets/img/name.png" alt="لأعرفه">${mode === 'demo' ? '<span class="demo-tag">تجريبي</span>' : ''}</a>
  <span class="chip fire" title="أيام متتالية">🔥 <b>${ar(st)}</b> يوم</span></header>`;
}
function logos() {
  return `<div class="logos"><img src="assets/img/family.png" alt="أسرة القوي الأنبا موسى"><img src="assets/img/church.png" alt="كنيسة السيدة العذراء مريم"></div>
  <p class="foot-note">أسرة القوي الأنبا موسى للجامعيين<br>كنيسة السيدة العذراء مريم بمدينة السادات</p>`;
}

// ---------- light burst fx ----------
const fx = $('#fx'); const ctx = fx.getContext('2d'); let parts = []; let fxOn = false;
function burst(x, y, n = 90) {
  if (reduce) return; const dpr = devicePixelRatio || 1; fx.width = innerWidth * dpr; fx.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 7; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, r: 1.5 + Math.random() * 3.5, life: 1, c: Math.random() < .5 ? '255,214,140' : '255,245,220' }); }
  if (!fxOn) { fxOn = true; requestAnimationFrame(stepFx); }
}
function stepFx() {
  ctx.clearRect(0, 0, fx.width, fx.height);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += .12; p.vx *= .985; p.life -= .016; ctx.beginPath(); ctx.fillStyle = `rgba(${p.c},${Math.max(0, p.life)})`; ctx.shadowColor = `rgba(${p.c},1)`; ctx.shadowBlur = 12; ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
  if (parts.length) requestAnimationFrame(stepFx); else { fxOn = false; ctx.clearRect(0, 0, fx.width, fx.height); }
}

// ---------- reading action ----------
async function markRead(n, btn) {
  const before = new Set(myRead()); if (before.has(n)) return;
  const r = btn?.getBoundingClientRect(); if (r) burst(r.left + r.width / 2, r.top + r.height / 2);
  btn?.classList.add('pop'); vibrate([18, 40, 30]);
  const mine = $('.cd.me'); if (mine) { mine.classList.add('on', 'lighting'); }
  try { await api.setRead(n, true); } catch (e) { console.error(e); toast('حصلت مشكلة في الحفظ… جرّب تاني'); return; }
  const after = new Set([...before, n]);
  const got = BADGES.filter((b) => !b.test(before) && b.test(after));
  toast(n === dayToday()?.n ? 'شمعتك ولّعت 🕯️ ربنا يبارك قرايتك' : `تمام! اليوم ${ar(n)} اتسجل ✓`);
  if (got.length) setTimeout(() => badgeModal(got[0]), 900);
}
function dayToday() { const s = status(); return s.phase === 'reading' ? s.day : null; }
function badgeModal(b) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box"><div style="font-size:64px;line-height:1.2">${b.icon}</div><p class="eyebrow" style="margin-top:6px">شارة جديدة</p><h2 style="font-size:26px;margin:4px 0">${b.name}</h2><p class="muted">${b.desc}</p><button class="btn primary block" style="margin-top:18px">آمين 🙏</button></div>`;
  document.body.appendChild(m); const r = m.querySelector('.box').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 60, 120);
  m.addEventListener('click', (e) => { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); });
}

// ---------- views ----------
function candlesHTML(n) {
  const list = [...S.users].sort((a, b) => (a.phone === S.me.phone ? -1 : b.phone === S.me.phone ? 1 : 0));
  const lit = list.filter((u) => (u.readDays || []).includes(n)).length;
  return `<div class="candles">${list.map((u) => `<div class="cd ${(u.readDays || []).includes(n) ? 'on' : ''} ${u.phone === S.me.phone ? 'me' : ''}" title="${esc(u.name)}"><span class="fl"></span><span class="wick"></span><span class="wax"></span>${u.phone === S.me.phone ? '<span class="tip">أنا</span>' : ''}</div>`).join('')}</div>
  <p class="candlecount" style="margin-top:14px"><b>${ar(lit)}</b> من ${ar(list.length)} ولّعوا شمعتهم النهارده</p>`;
}
function countdownHTML() {
  const t = todayCairo(); const d = diffDays(t, CHRISTMAS); if (d < 0) return '';
  const left = DAYS.filter((x) => x.date >= t).length;
  return `<section class="card"><p class="eyebrow">على عيد الميلاد المجيد</p><div class="count"><div><b>${ar(d)}</b><span>يوم على العيد</span></div><div><b>${ar(left)}</b><span>يوم قراءة فاضل</span></div><div><b>${ar(myRead().size)}</b><span>من ${ar(TOTAL)} قريتهم</span></div></div></section>`;
}
function missedHTML() {
  const r = myRead(); const t = todayCairo(); const miss = dueDays(t).filter((d) => d.date < t && !r.has(d.n));
  if (!miss.length) return '';
  return `<section class="card"><div class="between"><h2>فاتك ${ar(miss.length)} ${miss.length > 10 || miss.length < 3 ? 'يوم' : 'أيام'}</h2><a class="chip" href="#/plan">الخطة كلها</a></div><p class="sub">ولا يهمك… كمّلهم براحتك، أي وقت.</p>
  ${miss.slice(0, 3).map((d) => `<a class="pday missed" href="#/read/${d.n}" style="margin-top:10px"><span class="n">${ar(d.n)}</span><span class="t"><b>${otLabel(d)}${d.nt ? ' + ' + ntLabel(d) : ''}</b><small>${fmtDate(d.date)}</small></span></a>`).join('')}</section>`;
}
function reflHTML(n) {
  const x = S.days[n]; if (!x || !(x.reflection || x.question)) return '';
  return `<section class="card refl"><p class="eyebrow">كلمة النهارده</p>${x.reflection ? `<blockquote>${esc(x.reflection)}</blockquote>` : ''}${x.question ? `<div class="q">💭 ${esc(x.question)}</div>` : ''}${x.by ? `<p class="by">— ${esc(x.by)}</p>` : ''}</section>`;
}

function vToday() {
  const st = status(); const r = myRead(); const name = first(S.me.name);
  let hero = '';
  if (st.phase === 'reading') {
    const d = st.day; const done = r.has(d.n);
    hero = `<section class="card dayhero"><div class="between"><span class="eyebrow">قراءة النهارده</span><span class="num">اليوم <b>${ar(d.n)}</b> من ${ar(TOTAL)}</span></div>
      <div class="prog"><i style="width:${(r.size / TOTAL) * 100}%"></i></div><p style="font-size:13px;color:#e9d6a8">${fmtDate(d.date, true, true)}</p>
      <div class="chapters"><a class="chap" href="#/read/${d.n}"><small>العهد القديم</small><b>${otLabel(d)}</b></a>${d.nt ? `<a class="chap" href="#/read/${d.n}/${d.ot.length}"><small>العهد الجديد</small><b>${ntLabel(d)}</b></a>` : '<div class="chap" style="opacity:.6"><small>العهد الجديد</small><b>خلّصناه ✓</b></div>'}</div>
      <div class="duty"><span class="dot" style="background:${d.servant.color}"></span>الخادم المسؤول النهارده: <b>${d.servant.name}</b></div>
      <div class="actions"><a class="btn light" href="#/read/${d.n}">اقرا دلوقتي</a><button class="btn ${done ? 'done' : 'red'} readbtn" id="readNow" ${done ? 'disabled style="opacity:1"' : ''}><span class="glow"></span>${done ? ICON.check + ' قريت النهارده' : 'قريت ✓'}</button></div></section>
      <section class="card"><div class="between"><h2>شمعدان النهارده</h2><span class="sub">كل واحد يقرا يولّع شمعة</span></div>${candlesHTML(d.n)}</section>
      ${reflHTML(d.n)}`;
  } else if (st.phase === 'friday') {
    const nx = st.next;
    hero = `<section class="card dayhero"><span class="eyebrow">النهارده الجمعة</span><h2 style="font-size:28px;margin:6px 0 4px;color:#fff">إجازة 🌿</h2>
      <p style="color:#e9d6a8;line-height:1.8">يوم راحة… ولو فاتك أصحاح، ده أحلى وقت تكمّله.</p>
      ${nx ? `<div class="chapters"><a class="chap" href="#/read/${nx.n}"><small>بكرة — اليوم ${ar(nx.n)}</small><b>${otLabel(nx)}${nx.nt ? ' + ' + ntLabel(nx) : ''}</b></a></div>` : ''}</section>`;
  } else if (st.phase === 'before') {
    hero = `<section class="card dayhero"><span class="eyebrow">الرحلة لسه هتبدأ</span><h2 style="font-size:28px;color:#fff;margin-top:6px">فاضل ${ar(st.daysLeft)} يوم</h2><p style="color:#e9d6a8">البداية ${fmtDate(START, true, true)} من سفر التكوين.</p></section>`;
  } else {
    hero = `<section class="card dayhero" style="text-align:center"><span class="eyebrow">الرحلة خلصت</span><h2 style="font-size:28px;color:#fff;margin:6px 0">كل سنة وانت طيب ✨</h2><p style="color:#e9d6a8;line-height:1.8">قريت ${ar(r.size)} من ${ar(TOTAL)} يوم. «لأعرفه… وقوة قيامته»</p><a class="btn light" href="#/me" style="margin-top:14px">شوف شهادتك</a></section>`;
  }
  APP.innerHTML = `<div class="view">${topbar()}<div class="stagger"><div class="hello"><h1>${greeting()} يا ${esc(name)} 👋</h1><p>${st.phase === 'reading' ? 'جاهز لخطوة النهارده على الجبل؟' : 'خليك قريب… الرحلة مستمرة.'}</p></div>${hero}${missedHTML()}${countdownHTML()}${logos()}</div></div>`;
  $('#readNow')?.addEventListener('click', (e) => markRead(st.day.n, e.currentTarget));
}

async function vRead(n, tab = 0) {
  const d = DAYS.find((x) => x.n === +n); if (!d) { location.hash = '#/today'; return; }
  const ps = passages(d); tab = Math.min(+tab || 0, ps.length - 1);
  APP.innerHTML = `<div class="view reader"><div class="rhead"><a class="iconbtn" href="#/today" aria-label="رجوع">${ICON.back}</a><div class="tabs grow">${ps.map((p, i) => `<a class="tab ${i === tab ? 'on' : ''}" href="#/read/${d.n}/${i}">${BOOKS[p.book]} ${ar(p.ch)}</a>`).join('')}</div>
    <button class="iconbtn" id="fsm" aria-label="تصغير الخط">${ICON.minus}</button><button class="iconbtn" id="fsp" aria-label="تكبير الخط">${ICON.plus}</button></div>
    <div class="chapter" id="chap"><p class="muted" style="text-align:center;margin-top:40px">بيحمّل…</p></div></div>`;
  const T = await loadText(); const p = ps[tab]; const vs = T[p.book][p.ch];
  const chapEl = $('#chap'); if (!chapEl) return;
  chapEl.innerHTML = `<p class="eyebrow" style="text-align:center">اليوم ${ar(d.n)} — ${fmtDate(d.date)}</p><h2>${p.book === 'gen' ? 'سفر التكوين' : BOOKS[p.book]}</h2><div class="orn">الأصحاح ${ar(p.ch)}</div>
    <div class="text" style="--fs:${S.fs}px">${vs.map((v, i) => `<span class="v" data-v="${i + 1}"><sup>${ar(i + 1)}</sup>${esc(v)}</span> `).join('')}</div>
    <div class="endread">${tab < ps.length - 1 ? `<a class="btn primary block" href="#/read/${d.n}/${tab + 1}">الأصحاح اللي بعده ←</a>` : (myRead().has(d.n) ? `<button class="btn done block" disabled style="opacity:1">${ICON.check} قريت اليوم ده</button>` : `<button class="btn red block readbtn" id="rdone"><span class="glow"></span>خلّصت… قريت ✓</button>`)}
    <p class="hint">دوس على أي آية عشان تختارها وتشاركها في «آيات لمستنا»</p></div>
    <div class="selbar" id="selbar"><button class="btn light" id="share">✨ آية لمستني</button><button class="btn ghost" style="color:var(--cream);border-color:rgba(255,255,255,.3)" id="copy">نسخ</button></div>`;
  const sel = new Set();
  const upd = () => $('#selbar').classList.toggle('show', sel.size > 0);
  $$('.v', chapEl).forEach((el) => el.addEventListener('click', () => { const k = +el.dataset.v; sel.has(k) ? sel.delete(k) : sel.add(k); el.classList.toggle('sel'); upd(); }));
  const selText = () => { const ks = [...sel].sort((a, b) => a - b); return { text: ks.map((k) => vs[k - 1]).join(' '), ref: `${p.book === 'gen' ? 'تكوين' : BOOKS[p.book]} ${ar(p.ch)}: ${ar(ks[0])}${ks.length > 1 ? '-' + ar(ks[ks.length - 1]) : ''}` }; };
  $('#share').onclick = async () => { const s = selText(); await api.post('verse', s.text, s.ref); toast('اتشاركت في «آيات لمستنا» ✨'); $$('.v.sel').forEach((x) => x.classList.replace('sel', 'mark')); sel.clear(); upd(); };
  $('#copy').onclick = async () => { const s = selText(); try { await navigator.clipboard.writeText(`«${s.text}» (${s.ref})`); toast('اتنسخت'); } catch (e) { toast('مش قادر أنسخ هنا'); } };
  $('#rdone')?.addEventListener('click', async (e) => { await markRead(d.n, e.currentTarget); setTimeout(() => { location.hash = '#/today'; }, 1400); });
  const setFs = (v) => { S.fs = Math.max(16, Math.min(32, v)); $('.text').style.setProperty('--fs', S.fs + 'px'); try { localStorage.setItem('la3rafo:fs', S.fs); } catch (e) { /* ignore */ } };
  $('#fsp').onclick = () => setFs(S.fs + 2); $('#fsm').onclick = () => setFs(S.fs - 2);
  scrollTo(0, 0);
}

function vJourney() {
  const r = myRead(); const H = 1500; const Wd = 400;
  const pts = []; for (let i = 0; i <= 12; i++) { const y = H - 70 - i * ((H - 330) / 12); const x = i % 2 ? 300 - (i % 4 === 1 ? 10 : 0) : 100 + (i % 4 === 0 ? 0 : 15); pts.push([i === 12 ? 200 : x, y]); }
  pts[0] = [200, H - 40];
  let dpath = `M${pts[0][0]},${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const my = (y0 + y1) / 2; dpath += ` C${x0},${my} ${x1},${my} ${x1},${y1}`; }
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>رحلتنا للقمة ⛰️</h1><p>كل يوم قراءة خطوة… والقمة عند الصليب يوم ${fmtDate(END, false)}</p></div>
  <div class="mtn" id="mtn"><svg viewBox="0 0 ${Wd} ${H}" id="msvg" role="img" aria-label="خريطة الرحلة">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E0"/><stop offset=".5" stop-color="#FDF3D8"/><stop offset="1" stop-color="#F4E3BC"/></linearGradient>
    <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b4466"/><stop offset="1" stop-color="#02304A"/></linearGradient>
    <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b6a86" stop-opacity=".55"/><stop offset="1" stop-color="#1d4e6b" stop-opacity=".35"/></linearGradient>
    <radialGradient id="sun"><stop offset="0" stop-color="#fff3c8"/><stop offset=".4" stop-color="#F2C46D" stop-opacity=".8"/><stop offset="1" stop-color="#F2C46D" stop-opacity="0"/></radialGradient></defs>
    <rect width="${Wd}" height="${H}" fill="url(#sky)"/>
    <circle cx="200" cy="215" r="230" fill="url(#sun)"><animate attributeName="r" values="215;240;215" dur="6s" repeatCount="indefinite"/></circle>
    <g opacity=".9">${Array.from({ length: 16 }, (_, i) => `<rect x="198" y="-10" width="4" height="210" fill="#F2C46D" opacity=".35" transform="rotate(${i * 22.5} 200 215)"/>`).join('')}<animateTransform attributeName="transform" type="rotate" from="0 200 215" to="360 200 215" dur="90s" repeatCount="indefinite"/></g>
    <path d="M-20 ${H} L-20 620 L60 520 L120 600 L200 260 L280 590 L340 500 L420 640 L420 ${H}Z" fill="url(#m2)"/>
    <path d="M-20 ${H} L-20 800 L90 640 L150 700 L200 330 L250 690 L320 610 L420 760 L420 ${H}Z" fill="url(#m1)"/>
    <path d="M200 330 L176 500 L200 470 L224 520Z" fill="#FDF3D8" opacity=".14"/>
    <image href="assets/img/emblem_s.png" x="146" y="88" width="108" height="143"/>
    <path id="trail" d="${dpath}" fill="none" stroke="#FDF3D8" stroke-width="16" stroke-linecap="round" opacity=".18"/>
    <path id="trail2" d="${dpath}" fill="none" stroke="#F2C46D" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
    <path id="trailDone" d="${dpath}" fill="none" stroke="#F2C46D" stroke-width="6" stroke-linecap="round"/>
    <g id="stations"></g><g id="people"></g>
  </svg></div>
  <div class="legend"><span><i style="background:#F2C46D"></i>أيام قريتها</span><span><i style="background:#fff;border:2px solid #F2C46D"></i>لسه</span><span><i style="background:#C22026"></i>النهارده</span></div>
  <section class="card"><h2>الشارات</h2><div class="badges">${BADGES.map((b) => `<div class="badge ${b.test(r) ? 'got' : ''}"><div class="ic">${b.icon}</div><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div></section>${logos()}</div>`;
  const path = $('#trail'); const L = path.getTotalLength(); const NS = 'http://www.w3.org/2000/svg';
  const pos = (k) => path.getPointAtLength(L * (k / TOTAL)); // k = 0..46
  const tday = dayToday(); const stG = $('#stations'); const peG = $('#people');
  DAYS.forEach((d) => {
    const p = pos(d.n); const done = r.has(d.n); const g = document.createElementNS(NS, 'g');
    g.innerHTML = `<circle cx="${p.x}" cy="${p.y}" r="${tday?.n === d.n ? 11 : 8}" fill="${done ? '#F2C46D' : (tday?.n === d.n ? '#C22026' : '#fff')}" stroke="${done ? '#fff3c8' : '#F2C46D'}" stroke-width="2.5"/>
      ${d.n % 5 === 0 || d.n === 1 || d.n === TOTAL ? `<text x="${p.x + (p.x > 200 ? -18 : 18)}" y="${p.y + 5}" font-size="14" font-weight="700" fill="#FDF3D8" text-anchor="middle" font-family="Messiri">${ar(d.n)}</text>` : ''}`;
    g.style.cursor = 'pointer'; g.addEventListener('click', () => toast(`اليوم ${ar(d.n)}: ${otLabel(d)}${d.nt ? ' + ' + ntLabel(d) : ''} — ${fmtDate(d.date)}`));
    stG.appendChild(g);
  });
  // progress line
  const td = $('#trailDone'); const prog = L * (r.size / TOTAL); td.style.strokeDasharray = `${prog} ${L}`; td.style.strokeDashoffset = reduce ? 0 : prog;
  if (!reduce) td.animate([{ strokeDashoffset: prog }, { strokeDashoffset: 0 }], { duration: 1600, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
  // people grouped by progress
  const groups = {}; S.users.forEach((u) => { const k = (u.readDays || []).length; (groups[k] = groups[k] || []).push(u); });
  let mePt = null;
  Object.entries(groups).forEach(([k, us]) => {
    const p = pos(+k); us.sort((a) => (a.phone === S.me.phone ? 1 : -1));
    us.forEach((u, i) => {
      const isMe = u.phone === S.me.phone; const off = (i - (us.length - 1) / 2) * 15; const x = p.x + off, y = p.y - 26 - (isMe ? 8 : 0);
      const g = document.createElementNS(NS, 'g'); const R = isMe ? 17 : 10;
      g.innerHTML = `${isMe ? `<circle cx="${x}" cy="${y}" r="${R + 6}" fill="none" stroke="#C22026" stroke-width="2.5" opacity=".6"><animate attributeName="r" values="${R + 3};${R + 11};${R + 3}" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0;.7" dur="2.2s" repeatCount="indefinite"/></circle>` : ''}
        <circle cx="${x}" cy="${y}" r="${R}" fill="${isMe ? '#C22026' : color(u.name)}" stroke="#FDF3D8" stroke-width="2"/>
        <text x="${x}" y="${y + (isMe ? 6 : 4)}" font-size="${isMe ? 16 : 11}" fill="#fff" text-anchor="middle" font-weight="700" font-family="Messiri">${esc(isMe ? 'أنا' : initial(u.name))}</text>`;
      g.addEventListener('click', () => toast(`${u.name} — قرا ${ar(k)} يوم`)); g.style.cursor = 'pointer';
      peG.appendChild(g); if (isMe) mePt = y;
    });
  });
  if (mePt) setTimeout(() => { const svg = $('#msvg'); const sc = svg.getBoundingClientRect().height / H; scrollTo({ top: svg.getBoundingClientRect().top + scrollY + mePt * sc - innerHeight / 2, behavior: reduce ? 'auto' : 'smooth' }); }, 350);
}

function vPlan() {
  const r = myRead(); const t = todayCairo(); let html = ''; let wk = -1;
  let d = START; const end = END; const byDate = Object.fromEntries(DAYS.map((x) => [x.date, x]));
  while (d <= end) {
    const w = Math.floor(diffDays('2026-11-14', d) / 7);
    if (w !== wk) { if (wk >= 0) html += '</div>'; wk = w; const s = addDays('2026-11-14', w * 7); html += `<div class="week"><h3>الأسبوع ${ar(w + 1)} · ${fmtDate(s, false)} – ${fmtDate(addDays(s, 6), false)}</h3>`; }
    const x = byDate[d];
    if (x) {
      const cls = r.has(x.n) ? 'done' : x.date === t ? 'today' : x.date < t ? 'missed' : 'future';
      html += `<a class="pday ${cls}" href="#/read/${x.n}"><span class="n">${ar(x.n)}</span><span class="t"><b>${otLabel(x)}${x.nt ? ' + ' + ntLabel(x) : ''}</b><small>${fmtDate(x.date)} · ${x.servant.name}</small></span>${cls === 'done' ? `<span class="check">${ICON.check}</span>` : cls === 'missed' ? '<span class="st" style="color:var(--red)">كمّله</span>' : cls === 'today' ? '<span class="st" style="color:var(--red)">النهارده</span>' : ''}</a>`;
    } else if (weekday(d) === 5 && d > START) html += `<div class="friday">الجمعة ${fmtDate(d, false)} — إجازة 🌿</div>`;
    d = addDays(d, 1);
  }
  html += '</div>';
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>الخطة كلها</h1><p>${ar(TOTAL)} يوم · من ${fmtDate(START, false)} لحد ${fmtDate(END, false, true)} · الجمعة إجازة</p></div>
  <div class="card" style="padding:14px 16px"><div class="between"><span class="sub">قريت</span><b>${ar(r.size)} / ${ar(TOTAL)}</b></div><div class="prog" style="background:#f2e4c2"><i style="width:${(r.size / TOTAL) * 100}%"></i></div></div>${html}${logos()}</div>`;
  const tEl = $('.pday.today'); if (tEl) setTimeout(() => tEl.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 300);
}

function prayedSet() { try { return new Set(JSON.parse(localStorage.getItem('la3rafo:prayed') || '[]')); } catch (e) { return new Set(); } }
function vWall() {
  const tab = S.wallTab; const list = S.wall.filter((w) => w.type === tab).sort((a, b) => b.at - a.at); const pr = prayedSet();
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>الجماعة 🤍</h1><p>«احملوا بعضكم أثقال بعض»</p></div>
  <div class="seg" role="tablist"><button class="${tab === 'verse' ? 'on' : ''}" data-t="verse">✨ آيات لمستنا</button><button class="${tab === 'prayer' ? 'on' : ''}" data-t="prayer">🙏 طلبات صلاة</button></div>
  <section class="card compose"><textarea id="ptext" maxlength="400" placeholder="${tab === 'verse' ? 'اكتب الآية اللي لمستك النهارده…' : 'اكتب طلبتك… وإحنا هنصلّي لك'}"></textarea>${tab === 'verse' ? '<input id="pref" maxlength="40" placeholder="الشاهد (مثلًا: تكوين ١: ٣)">' : ''}
  <button class="btn primary block" id="psend" style="margin-top:10px">${tab === 'verse' ? 'شارك الآية' : 'اطلب صلاة'}</button></section>
  <div class="stagger">${list.length ? list.map((w) => `<article class="card post ${w.type}"><div class="who">${avatar(w.name)}<div class="grow"><b>${esc(w.name)}</b><div class="sub" style="font-size:12px">${timeAgo(w.at)}</div></div>${w.phone === S.me.phone ? `<button class="chip" data-del="${w.id}" aria-label="حذف">حذف</button>` : ''}</div>
    <p class="txt ${w.type === 'verse' ? 'verse-q' : ''}">${w.type === 'verse' ? '«' + esc(w.text) + '»' : esc(w.text)}</p>${w.ref ? `<p class="ref">${esc(w.ref)}</p>` : ''}
    ${w.type === 'prayer' ? `<div class="foot"><span class="sub">${ar(w.prayed || 0)} صلّوا</span><button class="pray ${pr.has(w.id) ? 'did' : ''}" data-pray="${w.id}">${pr.has(w.id) ? 'صلّيت ✓' : '🙏 صلّيت'}</button></div>` : ''}</article>`).join('')
    : `<div class="card" style="text-align:center"><p class="muted">لسه مفيش حاجة هنا… كن أول واحد يشارك 🤍</p></div>`}</div>${logos()}</div>`;
  $$('.seg button').forEach((b) => b.onclick = () => { S.wallTab = b.dataset.t; vWall(); });
  $('#psend').onclick = async () => { const t = $('#ptext').value.trim(); if (t.length < 3) return toast('اكتب حاجة الأول 🙂'); $('#psend').disabled = true; await api.post(tab, t, $('#pref')?.value.trim()); toast(tab === 'verse' ? 'اتشاركت ✨' : 'طلبتك وصلت… هنصلّي لك 🙏'); };
  $$('[data-pray]').forEach((b) => b.onclick = async () => { const id = b.dataset.pray; const s = prayedSet(); if (s.has(id)) return; s.add(id); localStorage.setItem('la3rafo:prayed', JSON.stringify([...s])); vibrate(15); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 30); await api.pray(id); });
  $$('[data-del]').forEach((b) => b.onclick = async () => { if (b.dataset.sure) { await api.removePost(b.dataset.del); toast('اتمسح'); } else { b.dataset.sure = '1'; b.textContent = 'متأكد؟'; b.style.color = 'var(--red)'; setTimeout(() => { delete b.dataset.sure; b.textContent = 'حذف'; b.style.color = ''; }, 3000); } });
}

function vMe() {
  const r = myRead(); const st = streak(r); const got = BADGES.filter((b) => b.test(r)); const pct = r.size / TOTAL; const C = 2 * Math.PI * 78;
  APP.innerHTML = `<div class="view">${topbar()}<div class="stagger"><section class="card" style="text-align:center"><div class="row" style="justify-content:center">${avatar(S.me.name, 54)}<div style="text-align:right"><h2 style="margin:0">${esc(S.me.name)}</h2><span class="sub">في الرحلة من ${fmtDate(START, false)}</span></div></div>
    <div class="ring"><svg width="180" height="180"><circle cx="90" cy="90" r="78" fill="none" stroke="#f2e4c2" stroke-width="14"/><circle cx="90" cy="90" r="78" fill="none" stroke="url(#rg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" style="transition:stroke-dashoffset 1.4s var(--ease)"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#C9A04E"/><stop offset="1" stop-color="#C22026"/></linearGradient></defs></svg>
    <div class="c"><div><b>${ar(Math.round(pct * 100))}٪</b><span>من الرحلة</span></div></div></div>
    <div class="stats"><div class="stat"><b>${ar(r.size)}</b><span>يوم قريته</span></div><div class="stat"><b>${ar(st)}</b><span>أيام متتالية</span></div><div class="stat"><b>${ar(got.length)}</b><span>شارة</span></div></div></section>
    <section class="card"><h2>شهادة إتمام الرحلة</h2><p class="sub">${r.size >= TOTAL ? 'مبروك! خلّصت الرحلة كلها 🎉' : `هتتفتح لما تخلّص الـ${ar(TOTAL)} يوم — فاضل ${ar(TOTAL - r.size)}`}</p><button class="btn ${r.size >= TOTAL ? 'red' : 'ghost'} block" id="cert" style="margin-top:12px">${r.size >= TOTAL ? 'حمّل شهادتك' : 'شوف شكل الشهادة'}</button></section>
    <section class="card"><h2>بياناتي</h2><div class="field" style="margin-top:10px"><input id="nm" value="${esc(S.me.name)}" placeholder=" " maxlength="40"><label for="nm">الاسم</label></div>
    <div class="actions" style="margin-top:4px"><button class="btn primary" id="save">حفظ الاسم</button><button class="btn ghost" id="out">خروج</button></div></section>
    <a class="card between" href="#/servants" style="display:flex"><span><b>دخول الخدام</b><br><span class="sub">ماركو · بيتر · محب · بيشوي</span></span><span style="font-size:22px">🔑</span></a>
    ${logos()}</div></div>`;
  $('#cert').onclick = () => certModal(r.size >= TOTAL);
  $('#save').onclick = async () => { const n = $('#nm').value.trim(); if (n.length < 2) return toast('اكتب اسمك'); S.me = await api.login(n, S.me.phone); toast('اتحفظ ✓'); };
  $('#out').onclick = async () => { await api.logout(); S.me = null; route(); };
}

function certModal(real) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box cert"><h2>${real ? 'شهادتك 🎉' : 'شكل الشهادة'}</h2><canvas id="cv" width="1600" height="1130"></canvas><div class="actions"><button class="btn red" id="dl" ${real ? '' : 'disabled'}>تحميل</button><button class="btn ghost" id="cl">قفل</button></div></div>`;
  document.body.appendChild(m); m.querySelector('#cl').onclick = () => m.remove(); m.onclick = (e) => { if (e.target === m) m.remove(); };
  drawCert(m.querySelector('#cv'), real).then(() => { m.querySelector('#dl').onclick = () => { const a = document.createElement('a'); a.download = 'شهادة-لأعرفه.png'; a.href = m.querySelector('#cv').toDataURL('image/png'); a.click(); }; });
}
async function drawCert(cv, real) {
  await document.fonts.ready; const c = cv.getContext('2d'); const W = cv.width, H = cv.height;
  const img = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = s; });
  const [em, nm, ch, fa] = await Promise.all(['assets/img/emblem.png', 'assets/img/name.png', 'assets/img/church.png', 'assets/img/family.png'].map(img));
  c.fillStyle = '#FDF3D8'; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(W / 2, H * .35, 50, W / 2, H * .4, W * .7); g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(1, 'rgba(242,225,184,1)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#C9A04E'; c.lineWidth = 6; c.strokeRect(40, 40, W - 80, H - 80); c.lineWidth = 2; c.strokeRect(58, 58, W - 116, H - 116);
  if (em) { c.globalAlpha = .06; c.drawImage(em, W / 2 - 330, H / 2 - 440, 660, 873); c.globalAlpha = 1; c.drawImage(em, W / 2 - 75, 90, 150, 198); }
  if (nm) c.drawImage(nm, W / 2 - 140, 300, 280, 280 * nm.height / nm.width);
  c.direction = 'rtl'; c.textAlign = 'center'; c.fillStyle = '#8a6a2c'; c.font = '700 40px Messiri'; c.fillText('شهادة إتمام رحلة قراءة الكتاب المقدس', W / 2, 470);
  c.fillStyle = '#02304A'; c.font = '700 96px Amiri'; c.fillText(real ? S.me.name : 'اسمك هنا', W / 2, 600);
  c.fillStyle = '#3b2f1b'; c.font = '400 38px Amiri'; c.fillText('أتمّ قراءة سفر التكوين ورسائل يعقوب وبطرس ويوحنا ويهوذا وسفر الرؤيا', W / 2, 690);
  c.fillText(`في ${ar(TOTAL)} يومًا من ${fmtDate(START, false)} إلى ${fmtDate(END, false, true)}`, W / 2, 745);
  c.fillStyle = '#C22026'; c.font = '700 34px Amiri'; c.fillText('«لأَعْرِفَهُ، وَقُوَّةَ قِيَامَتِهِ» (في ٣: ١٠)', W / 2, 820);
  if (fa) c.drawImage(fa, 250, 860, 180, 180 * fa.height / fa.width); if (ch) c.drawImage(ch, W - 250 - 156, 860, 156, 156 * ch.height / ch.width);
  c.fillStyle = '#8a6a2c'; c.font = '500 26px Messiri'; c.fillText('أسرة القوي الأنبا موسى للجامعيين — كنيسة السيدة العذراء مريم بمدينة السادات', W / 2, 1040);
  if (!real) { c.save(); c.translate(W / 2, H / 2); c.rotate(-.35); c.fillStyle = 'rgba(194,32,38,.13)'; c.font = '700 150px Messiri'; c.fillText('معاينة', 0, 40); c.restore(); }
}

// ---------- servants ----------
async function vServants() {
  const ok = await api.isServant();
  if (!ok) {
    APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>دخول الخدام 🔑</h1><p>ماركو · بيتر · محب · بيشوي</p></div>
    <section class="card"><div class="field"><input id="code" type="password" inputmode="numeric" placeholder=" " autocomplete="off"><label for="code">كود الخدام</label></div><button class="btn primary block" id="go">دخول</button>
    ${mode === 'demo' ? '<p class="hint">في الوضع التجريبي الكود: 2026</p>' : ''}</section>
    <details class="card"><summary style="font-weight:700;cursor:pointer">أول مرة؟ حدد كود الخدام</summary><p class="sub" style="margin:8px 0">الكود بيتحدد مرة واحدة بس، وبعدها كل خادم يدخل بيه.</p><div class="field"><input id="ncode" type="password" placeholder=" " minlength="4"><label for="ncode">كود جديد (٤ حروف أو أرقام على الأقل)</label></div><button class="btn ghost block" id="setc">حدد الكود</button></details></div>`;
    $('#go').onclick = async () => { if (await api.unlock($('#code').value.trim())) { toast('أهلًا يا خادم 🙏'); vServants(); } else toast('الكود غلط'); };
    $('#setc').onclick = async () => { const c = $('#ncode').value.trim(); if (c.length < 4) return toast('الكود قصير'); if (await api.setCode(c)) { toast('اتحدد الكود ✓'); vServants(); } else toast('الكود متحدد قبل كده — اسأل باقي الخدام'); };
    return;
  }
  const st = status(); const sel = S.sDay || (st.phase === 'reading' ? st.day.n : (st.next?.n || 1)); const d = DAYS.find((x) => x.n === sel);
  const readers = S.users.filter((u) => (u.readDays || []).includes(sel)); const not = S.users.filter((u) => !(u.readDays || []).includes(sel));
  const url = location.href.split('#')[0];
  const msg = (u) => encodeURIComponent(`سلام يا ${first(u.name)} 🌿\nلسه مستنيين شمعتك النهارده 🕯️\nقراءة اليوم ${ar(d.n)}: ${otLabel(d)}${d.nt ? ' + ' + ntLabel(d) : ''}\n${url}\n— لأعرفه`);
  const wa = (p) => '2' + normPhone(p);
  const counts = DAYS.map((x) => S.users.filter((u) => (u.readDays || []).includes(x.n)).length); const mx = Math.max(1, S.users.length);
  const x = S.days[sel] || {};
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>لوحة الخدام</h1><p>${ar(S.users.length)} مشترك في الرحلة</p></div>
  <section class="card"><label class="sub" for="dsel">اختار اليوم</label><select id="dsel" style="margin-top:6px">${DAYS.map((y) => `<option value="${y.n}" ${y.n === sel ? 'selected' : ''}>اليوم ${ar(y.n)} — ${fmtDate(y.date)} — ${y.servant.name}</option>`).join('')}</select>
    <div class="duty" style="color:var(--muted)"><span class="dot" style="background:${d.servant.color}"></span>المسؤول: <b style="color:var(--navy)">${d.servant.name}</b> · ${otLabel(d)}${d.nt ? ' + ' + ntLabel(d) : ''}</div></section>
  <section class="card"><div class="between"><h2>مين قرا؟</h2><span class="chip">${ar(readers.length)} / ${ar(S.users.length)}</span></div>
    ${not.map((u) => `<div class="member">${avatar(u.name, 34)}<span>${esc(u.name)}</span><a class="wa" target="_blank" rel="noopener" href="https://wa.me/${wa(u.phone)}?text=${msg(u)}">${ICON.wa} فكّره</a></div>`).join('')}
    ${readers.map((u) => `<div class="member">${avatar(u.name, 34)}<span>${esc(u.name)}</span><span class="okk">قرا ✓</span></div>`).join('')}</section>
  <section class="card"><h2>كلمة اليوم ${ar(sel)}</h2><p class="sub">بتظهر للكل في صفحة «النهارده»</p>
    <textarea class="inp" id="refl" style="margin-top:10px" placeholder="تأمل قصير على قراءة اليوم…">${esc(x.reflection || '')}</textarea>
    <input class="inp" id="ques" style="margin-top:8px" placeholder="سؤال للتأمل (اختياري)" value="${esc(x.question || '')}">
    <button class="btn primary block" id="sv" style="margin-top:10px">حفظ</button></section>
  <section class="card"><h2>القراءة يوم بيوم</h2><div class="bars">${counts.map((c, i) => `<i class="${DAYS[i].n === sel ? 't' : ''}" style="height:${(c / mx) * 100}%" title="اليوم ${i + 1}: ${c}"></i>`).join('')}</div></section></div>`;
  $('#dsel').onchange = (e) => { S.sDay = +e.target.value; vServants(); };
  $('#sv').onclick = async () => { await api.saveDay(sel, { reflection: $('#refl').value.trim(), question: $('#ques').value.trim(), by: d.servant.name }); toast('اتحفظت ✓'); };
}

// ---------- onboarding with the pop-up book ----------
function vOnboard() {
  NAV.hidden = true; APP.classList.add('full');
  APP.innerHTML = `<div class="onb view"><div class="stage3d"><div class="sunrays" id="rays"></div><div class="emb" id="emb">
    <div class="w" id="wPL" style="transform-origin:50.8% 74.6%"><div class="w" id="iPL" style="transform-origin:50.8% 44%"><img src="assets/img/l_pageL.png" alt=""></div></div>
    <div class="w" id="wPR" style="transform-origin:50.8% 74.6%"><div class="w" id="iPR" style="transform-origin:50.8% 44%"><img src="assets/img/l_pageR.png" alt=""></div></div>
    <div class="w" id="wFL" style="transform-origin:50.8% 74.6%"><div class="w" id="iFL" style="transform-origin:53.1% 31.2%"><img src="assets/img/l_flame.png" alt=""></div></div>
    <div class="w" id="wSU" style="transform-origin:50.8% 74.6%"><img src="assets/img/l_sun.png" alt=""></div>
    <div class="w" id="wBK" style="transform-origin:50.8% 74.6%"><img src="assets/img/l_back.png" alt=""></div>
    <div class="w" id="wFR" style="transform-origin:50.8% 98.2%"><img src="assets/img/l_front.png" alt="">
      <img id="tabs" src="assets/img/l_tablets.png" alt="" style="transform-origin:26.2% 83.9%"><img id="cr0" src="assets/img/l_cross0.png" alt="" style="transform-origin:71.4% 85.4%"><img id="cr1" src="assets/img/l_cross1.png" alt="" style="transform-origin:76.8% 85.4%"><img id="cr2" src="assets/img/l_cross2.png" alt="" style="transform-origin:82.6% 85.4%"></div>
    </div></div>
    <img class="nm" id="onm" src="assets/img/name.png" alt="لأعرفه">
    <p class="tag" id="otag">رحلة قراءة الكتاب المقدس · من التكوين للرؤيا</p>
    <p class="verse" id="over">«لأَعْرِفَهُ، وَقُوَّةَ قِيَامَتِهِ، وَشَرِكَةَ آلاَمِهِ…»<small>فيلبي ٣: ١٠</small></p>
    <form class="form" id="oform" novalidate>
      <div class="field"><input id="iname" autocomplete="name" placeholder=" " maxlength="40" required><label for="iname">اسمك</label></div>
      <div class="field"><input id="iphone" type="tel" inputmode="tel" autocomplete="tel" placeholder=" " maxlength="14" required><label for="iphone">رقم الموبايل</label></div>
      <p class="err" id="oerr"></p>
      <button class="btn red block" id="ogo">يلا نبدأ الرحلة ⛰️</button>
      <p class="hint">رقمك بيخليك تدخل من أي موبايل، والخدام يقدروا يفكّروك بالقراية.<br>${mode === 'demo' ? '<b>وضع تجريبي:</b> البيانات على جهازك بس لحد ما يتربط Firebase.' : ''}</p>
    </form>
    ${logos()}</div>`;
  popup();
  $('#oform').addEventListener('submit', async (e) => {
    e.preventDefault(); const n = $('#iname').value.trim(); const p = normPhone($('#iphone').value);
    if (n.length < 2) return ($('#oerr').textContent = 'اكتب اسمك');
    if (!validPhone(p)) return ($('#oerr').textContent = 'رقم الموبايل لازم يكون ١١ رقم ويبدأ بـ 01');
    $('#oerr').textContent = ''; $('#ogo').disabled = true; $('#ogo').textContent = 'لحظة…';
    try { S.me = await api.login(n, p); const r = $('#ogo').getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 140); setTimeout(() => { APP.classList.remove('full'); location.hash = '#/today'; route(); }, 700); }
    catch (err) { console.error(err); $('#oerr').textContent = 'حصلت مشكلة في الاتصال… جرّب تاني'; $('#ogo').disabled = false; $('#ogo').textContent = 'يلا نبدأ الرحلة ⛰️'; }
  });
}
function popup() {
  const cl = (x) => Math.min(1, Math.max(0, x)); const P = (t, a, b) => cl((t - a) / (b - a));
  const eo = (x) => 1 - Math.pow(1 - x, 3); const eio = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const bk = (x, c = 1.7) => (x <= 0 ? 0 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2));
  const E = (id) => document.getElementById(id); const t0 = performance.now();
  const frame = (now) => {
    const t = reduce ? 9 : (now - t0) / 1000; if (!E('emb')) return;
    const TILT = 40 * (1 - eio(P(t, 3.6, 4.8)));
    E('emb').style.transform = `rotateX(${TILT}deg) scale(${.92 + .08 * eo(P(t, 0, 4.8))})`; E('emb').style.transformOrigin = '50% 69%';
    const pa = 88 * (1 - bk(eio(P(t, .1, 1.5)), 1));
    ['wPL', 'wPR'].forEach((k) => { E(k).style.transform = `rotateX(${-TILT}deg)`; E(k).style.opacity = P(t, 0, .25); });
    E('iPL').style.transform = `rotateY(${-pa}deg)`; E('iPR').style.transform = `rotateY(${pa}deg)`;
    const pop = (a, b) => { const k = P(t, a, b); return { ang: -TILT * Math.min(1.15, bk(k, 2.2)), op: P(k, 0, .15) }; };
    let p = pop(1.1, 1.9); E('wBK').style.transform = `translateZ(.2px) rotateX(${p.ang}deg)`; E('wBK').style.opacity = p.op;
    p = pop(1.5, 2.3); E('wFR').style.transform = `translateZ(.4px) rotateX(${p.ang}deg)`; E('wFR').style.opacity = p.op;
    const ks = P(t, 1.9, 2.9); E('wSU').style.transform = `translateZ(.1px) rotateX(${-TILT}deg) translateY(${(1 - Math.pow(1 - ks, 5)) * -0 + (1 - eo(ks)) * 26}%)`; E('wSU').style.opacity = P(ks, 0, .1);
    const kt = P(t, 2.5, 3.1); E('tabs').style.transform = `translateZ(.3px) scale(${bk(kt, 2.4)})`; E('tabs').style.opacity = P(kt, 0, .1);
    [[0, 2.8], [2, 2.95], [1, 3.1]].forEach(([i, a]) => { const k = P(t, a, a + .5); const e = E('cr' + i); e.style.transform = `translateZ(.3px) scaleY(${bk(k, 2.2)})`; e.style.opacity = P(k, 0, .1); });
    const kf = P(t, 3.1, 3.9); E('wFL').style.transform = `translateZ(.05px) rotateX(${-TILT}deg)`; E('iFL').style.transform = `scaleY(${bk(kf, 2.6)}) skewX(${Math.sin(t * 14) * 3 * (1 - kf) * kf * 4}deg)`; E('wFL').style.opacity = P(kf, 0, .12);
    E('rays').style.opacity = .85 * eo(P(t, 2.6, 3.6)); E('rays').style.transform = `translate(-50%,-50%) rotate(${t * 6}deg) scale(${.4 + .6 * eo(P(t, 2.6, 3.8))})`;
    if (t > 4.0) { E('onm')?.classList.add('in'); E('otag')?.classList.add('in2'); E('over')?.classList.add('in2'); E('oform')?.classList.add('in'); }
    if (t < 30 && E('emb')) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---------- router ----------
function route() {
  if (!S.me) return vOnboard();
  NAV.hidden = false; APP.classList.remove('full');
  const [, r = 'today', a, b] = (location.hash || '#/today').split('/');
  $$('#nav a').forEach((x) => x.classList.toggle('on', x.dataset.r === r || (r === 'read' && x.dataset.r === 'today') || (r === 'servants' && x.dataset.r === 'me')));
  const v = { today: vToday, read: () => vRead(a, b), journey: vJourney, plan: vPlan, wall: vWall, me: vMe, servants: vServants }[r] || vToday;
  v(); if (r !== 'journey' && r !== 'plan' && r !== 'read') scrollTo(0, 0);
}
let rt; const rerender = (kinds) => () => { clearTimeout(rt); rt = setTimeout(() => { const r = (location.hash.split('/')[1] || 'today'); if (S.me && kinds.includes(r) && !document.activeElement?.matches('input,textarea,select')) route(); }, 120); };
on('users', (u) => { S.users = u; if (S.me) { const m = u.find((x) => x.phone === S.me.phone); if (m) S.me = m; } rerender(['today', 'journey', 'plan', 'me', 'servants'])(); });
on('wall', (w) => { S.wall = w; rerender(['wall'])(); });
on('days', (d) => { S.days = d; rerender(['today'])(); });
addEventListener('hashchange', route);

(async () => {
  APP.innerHTML = '<div style="min-height:100dvh;display:grid;place-items:center"><img src="assets/img/emblem_s.png" alt="" style="width:90px;animation:bob 1.6s ease-in-out infinite"></div>';
  try { S.me = await init(); } catch (e) { console.error(e); }
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.endsWith('claude.ai') && !location.hostname.includes('claudeusercontent')) { try { navigator.serviceWorker.register('sw.js'); } catch (e) { /* ignore */ } }
})();
