import { KEY_VERSES, DAYS, TOTAL, START, END, CHRISTMAS, SERVANTS, BADGES, BOOKS, ar, fmtDate, todayCairo, status, dueDays, streak, otLabel, ntLabel, passages, diffDays, addDays, weekday } from './plan.js';
import { init, api, on, mode, normPhone, validPhone, initialOf } from './data.js';
import { versePicker, askModal, myQuestionsHTML } from './extras.js';
import { $, $$, esc, APP, NAV, S, reduce, color, initial, first, avatar, timeAgo, toast, vibrate, myRead, meU, greeting, loadText, ICON, topbar, logos, burst } from './ui.js';
import { userStats, readState, nextBadge, weekRange } from './stats.js';
import { lamp, vBoard, journeySegs, chapterQuiz, vExam, examBanner, ttsSetup, shareVerseImage } from './features.js';
import { vAdmin } from './admin.js';

// ---------- reading action ----------
async function markRead(n, btn) {
  const before = new Set(myRead()); if (before.has(n)) return;
  const r = btn?.getBoundingClientRect(); if (r) burst(r.left + r.width / 2, r.top + r.height / 2);
  btn?.classList.add('pop'); vibrate([18, 40, 30]);
  const mine = $('.cd.me'); if (mine) { mine.classList.add('on', 'lighting'); }
  try { await api.setRead(n, true); } catch (e) { console.error(e); toast('حصلت مشكلة في الحفظ… جرّب تاني'); return; }
  const after = new Set([...before, n]);
  const got = BADGES.filter((b) => !b.test(before) && b.test(after));
  const dd = DAYS.find((x) => x.n === n); toast(n === dayToday()?.n ? 'شمعتك ولّعت 🕯️ ربنا يبارك قرايتك' : (dd && dd.date < todayCairo() ? `اليوم ${ar(n)} اتسجّل إنك قريته متأخر ✓` : `تمام! اليوم ${ar(n)} اتسجّل ✓`));
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
function weekHTML() {
  const t = todayCairo(); const [s] = weekRange(t); const u = meU();
  const cells = Array.from({ length: 7 }, (_, i) => { const dt = addDays(s, i); const d = DAYS.find((x) => x.date === dt);
    let cls = 'fu', ic = ''; if (weekday(dt) === 5) { cls = 'fri'; ic = '🌿'; }
    else if (d) { const st = readState(u, d.n); if (st === 'ontime') { cls = 'ok'; ic = '✓'; } else if (st === 'late') { cls = 'late'; ic = '⏰'; } else if (dt < t) { cls = 'miss'; ic = '!'; } else if (dt === t) { cls = 'now'; ic = '•'; } }
    else cls = 'off';
    return `<a class="wd ${cls}" ${d ? `href="#/read/${d.n}"` : ''}><span>${['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][weekday(dt)]}</span><i>${ic}</i><small>${ar(+dt.slice(8))}</small></a>`; });
  return `<section class="card week7"><div class="between"><h2>أسبوعك</h2><a class="chip" href="#/plan">الخطة</a></div><div class="wrow">${cells.join('')}</div></section>`;
}
function verseHTML(d) {
  const k = KEY_VERSES[d.n]; if (!k || !S.text) return '<section class="card vday" id="vday"></section>';
  const [b, c, v] = k; const txt = (S.text[b] && S.text[b][c] && S.text[b][c][v - 1]) || ''; if (!txt) return '';
  const ref = `${b === 'gen' ? 'تكوين' : BOOKS[b]} ${ar(c)}: ${ar(v)}`;
  return `<section class="card vday" id="vday"><span class="vq">«</span><p class="vt">${esc(txt)}</p><div class="between"><span class="vr">${ref}</span><button class="chip" id="vshare">🖼️ شاركها صورة</button></div></section>`;
}
function lampsHTML() {
  const t = todayCairo(); const rows = S.users.map((u) => ({ u, s: userStats(u, t) })).sort((a, b) => b.s.onTime - a.s.onTime || b.s.read - a.s.read);
  const i = rows.findIndex((r) => r.u.phone === S.me.phone); if (i < 0 || rows.length < 2) return '';
  const me = rows[i];
  return `<a class="card lamppre" href="#/journey/lamps">${lamp(me.s.consistency / 100, me.s.readToday, 38)}<span class="grow"><b>ترتيبك في لوحة الأمناء: ${ar(i + 1)} من ${ar(rows.length)}</b>
    <small>الأوائل: ${rows.slice(0, 3).map((r) => esc(first(r.u.name))).join('، ')}</small></span>${ICON.back}</a>`;
}
function familyHTML() {
  const vs = S.wall.filter((w) => w.type === 'verse').sort((a, b) => b.at - a.at).slice(0, 2); const pr = S.wall.filter((w) => w.type === 'prayer').length;
  if (!vs.length && !pr) return '';
  return `<section class="card fam"><div class="between"><h2>من الأسرة</h2><a class="chip" href="#/wall">الكل</a></div>
    ${vs.map((w) => `<div class="famv">${avatar(w.name, 30)}<span class="grow"><b>${esc(first(w.name))}</b> لمسته آية${w.ref ? ` <small>${esc(w.ref)}</small>` : ''}<em>«${esc(w.text.length > 90 ? w.text.slice(0, 90) + '…' : w.text)}»</em></span></div>`).join('')}
    ${pr ? `<a class="famp" href="#/wall">🙏 فيه ${ar(pr)} ${pr > 2 && pr < 11 ? 'طلبات' : 'طلب'} صلاة مستنيين صلاتك</a>` : ''}</section>`;
}
function quizCTA(d) {
  const keys = passages(d).map((p) => `${p.book}_${p.ch}`).filter((k) => (S.chq[k]?.questions || []).length && !(meU().quiz || {})[k]);
  if (!keys.length) return '';
  return `<a class="card qcta" href="#/read/${d.n}"><span class="ei">💡</span><span class="grow"><b>فيه أسئلة على قراءة النهارده</b><small>اقرا وبعدين «اختبر نفسك» تحت الأصحاح</small></span>${ICON.back}</a>`;
}
function nudgeHTML() {
  const nb = nextBadge(myRead()); if (!nb) return '';
  return `<a class="nudge" href="#/journey/mountain">✨ فاضلك ${ar(nb.left)} ${nb.left > 2 && nb.left < 11 ? 'أيام' : 'يوم'} على شارة «${nb.name}»</a>`;
}
function countdownHTML() {
  const t = todayCairo(); const d = diffDays(t, CHRISTMAS); if (d < 0) return '';
  const left = DAYS.filter((x) => x.date >= t).length;
  return `<section class="card"><p class="eyebrow">على عيد الميلاد المجيد</p><div class="count"><div><b>${ar(d)}</b><span>يوم على العيد</span></div><div><b>${ar(left)}</b><span>يوم قراءة فاضل</span></div><div><b>${ar(myRead().size)}</b><span>من ${ar(TOTAL)} قريتهم</span></div></div></section>`;
}
function missedHTML() {
  const r = myRead(); const t = todayCairo(); const miss = dueDays(t).filter((d) => d.date < t && !r.has(d.n));
  if (!miss.length) return '';
  return `<section class="card"><div class="between"><h2>فاتك ${ar(miss.length)} ${miss.length > 10 || miss.length < 3 ? 'يوم' : 'أيام'}</h2><a class="chip" href="#/plan">الخطة كلها</a></div><p class="sub">ولا يهمك… تقدر تقراهم دلوقتي، وهيتسجلوا إنك قريتهم متأخر.</p>
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
      <div class="actions"><a class="btn light" href="#/read/${d.n}">اقرا دلوقتي</a><button class="btn ${done ? 'done' : 'red'} readbtn" id="readNow" ${done ? 'disabled style="opacity:1"' : ''}><span class="glow"></span>${done ? ICON.check + ' قريت النهارده' : 'قريت ✓'}</button></div></section>
      <section class="card"><div class="between"><h2>شمعدان النهارده</h2><span class="sub">كل واحد يقرا يولّع شمعة</span></div>${candlesHTML(d.n)}</section>
      ${weekHTML()}${quizCTA(d)}${reflHTML(d.n)}${verseHTML(d)}`;
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
  APP.innerHTML = `<div class="view">${topbar()}<div class="stagger"><div class="hello"><h1>${greeting()} يا ${esc(name)} 👋</h1><p>${st.phase === 'reading' ? 'جاهز لخطوة النهارده على الجبل؟' : 'خليك قريب… الرحلة مستمرة.'}</p></div>${nudgeHTML()}<div id="exb"></div>${hero}${st.phase !== 'reading' ? weekHTML() : ''}${lampsHTML()}${familyHTML()}<a class="card askpre" href="#/wall/ask"><span class="ei">❓</span><span class="grow"><b>عندك سؤال أو محتاج تفسير لآية؟</b><small>اسأل الخدام، والرد هيوصلك على الواتساب</small></span>${ICON.back}</a>${missedHTML()}${countdownHTML()}${logos()}</div></div>`;
  $('#readNow')?.addEventListener('click', (e) => markRead(st.day.n, e.currentTarget));
  examBanner($('#exb'));
  if (st.phase === 'reading') {
    const hook = () => { const k = KEY_VERSES[st.day.n]; $('#vshare')?.addEventListener('click', () => { const [b, c, v] = k; shareVerseImage(S.text[b][c][v - 1], `${b === 'gen' ? 'تكوين' : BOOKS[b]} ${ar(c)}: ${ar(v)}`); }); };
    if (S.text) hook(); else loadText().then(() => { const el = $('#vday'); if (el) { el.outerHTML = verseHTML(st.day); hook(); } });
  }
}

async function vRead(n, tab = 0) {
  const d = DAYS.find((x) => x.n === +n); if (!d) { location.hash = '#/today'; return; }
  const ps = passages(d); tab = Math.min(+tab || 0, ps.length - 1);
  APP.innerHTML = `<div class="view reader"><div class="rhead"><a class="iconbtn" href="#/today" aria-label="رجوع">${ICON.back}</a><span class="sp"></span><div class="tabs grow">${ps.map((p, i) => `<a class="tab ${i === tab ? 'on' : ''}" href="#/read/${d.n}/${i}">${BOOKS[p.book]} ${ar(p.ch)}</a>`).join('')}</div>
    <button class="iconbtn" id="tts" aria-label="اسمع الأصحاح">${ICON.ear}</button><button class="iconbtn" id="night" aria-label="وضع القراءة الليلي">${ICON.moon}</button><button class="iconbtn" id="fsm" aria-label="تصغير الخط">${ICON.minus}</button><button class="iconbtn" id="fsp" aria-label="تكبير الخط">${ICON.plus}</button></div>
    <div class="chapter" id="chap"><p class="muted" style="text-align:center;margin-top:40px">بيحمّل…</p></div></div>`;
  const T = await loadText(); const p = ps[tab]; const vs = T[p.book][p.ch];
  const chapEl = $('#chap'); if (!chapEl) return;
  chapEl.innerHTML = `<p class="eyebrow" style="text-align:center">اليوم ${ar(d.n)} — ${fmtDate(d.date)}</p><h2>${p.book === 'gen' ? 'سفر التكوين' : BOOKS[p.book]}</h2><div class="orn">الأصحاح ${ar(p.ch)}</div>
    <div class="text" style="--fs:${S.fs}px">${vs.map((v, i) => `<span class="v" data-v="${i + 1}" data-t="${esc(v)}"><sup>${ar(i + 1)}</sup>${esc(v)}</span> `).join('')}</div><div id="cquiz"></div>
    <div class="endread">${tab < ps.length - 1 ? `<a class="btn primary block" href="#/read/${d.n}/${tab + 1}">الأصحاح اللي بعده ←</a>` : (myRead().has(d.n) ? `<button class="btn done block" disabled style="opacity:1">${ICON.check} قريت اليوم ده</button>` : `<button class="btn red block readbtn" id="rdone"><span class="glow"></span>خلّصت… قريت ✓</button>`)}
    <p class="hint">دوس على أي آية عشان تختارها: تشاركها في «آيات لمستنا»، أو تسأل الخدام عنها</p></div>
    <div class="selbar" id="selbar"><button class="btn light" id="share">✨ آية لمستني</button><button class="btn light" id="simg">🖼️ صورة</button><button class="btn light" id="sask">❓ اسأل</button><button class="btn ghost" style="color:var(--cream);border-color:rgba(255,255,255,.3)" id="copy">نسخ</button></div>`;
  $$('body > .selbar').forEach((x) => x.remove()); document.body.appendChild($('#selbar')); // fixed bar must live outside the animated view
  const sel = new Set();
  const upd = () => $('#selbar').classList.toggle('show', sel.size > 0);
  $$('.v', chapEl).forEach((el) => el.addEventListener('click', () => { const k = +el.dataset.v; sel.has(k) ? sel.delete(k) : sel.add(k); el.classList.toggle('sel'); upd(); }));
  const selText = () => { const ks = [...sel].sort((a, b) => a - b); return { text: ks.map((k) => vs[k - 1]).join(' '), ref: `${p.book === 'gen' ? 'تكوين' : BOOKS[p.book]} ${ar(p.ch)}: ${ar(ks[0])}${ks.length > 1 ? '-' + ar(ks[ks.length - 1]) : ''}` }; };
  $('#share').onclick = async () => { const s = selText(); await api.post('verse', s.text, s.ref); toast('اتشاركت في «آيات لمستنا» ✨'); $$('.v.sel').forEach((x) => x.classList.replace('sel', 'mark')); sel.clear(); upd(); };
  $('#simg').onclick = async () => { const s = selText(); await shareVerseImage(s.text, s.ref); };
  $('#sask').onclick = () => { const s = selText(); askModal(s); $$('.v.sel').forEach((x) => x.classList.remove('sel')); sel.clear(); upd(); };
  ttsSetup($('#tts'), $$('.v', chapEl));
  chapterQuiz($('#cquiz'), `${p.book}_${p.ch}`, `${p.book === 'gen' ? 'التكوين' : BOOKS[p.book]} ${ar(p.ch)}`);
  const applyNight = () => document.body.classList.toggle('night', !!S.night); try { S.night = localStorage.getItem('la3rafo:night') === '1'; } catch (e) { /* ignore */ } applyNight();
  $('#night').onclick = () => { S.night = !S.night; applyNight(); try { localStorage.setItem('la3rafo:night', S.night ? '1' : '0'); } catch (e) { /* ignore */ } };
  $('#copy').onclick = async () => { const s = selText(); try { await navigator.clipboard.writeText(`«${s.text}» (${s.ref})`); toast('اتنسخت'); } catch (e) { toast('مش قادر أنسخ هنا'); } };
  $('#rdone')?.addEventListener('click', async (e) => { await markRead(d.n, e.currentTarget); setTimeout(() => { location.hash = '#/today'; }, 1400); });
  const setFs = (v) => { S.fs = Math.max(16, Math.min(32, v)); $('.text').style.setProperty('--fs', S.fs + 'px'); try { localStorage.setItem('la3rafo:fs', S.fs); } catch (e) { /* ignore */ } };
  $('#fsp').onclick = () => setFs(S.fs + 2); $('#fsm').onclick = () => setFs(S.fs - 2);
  scrollTo(0, 0);
}

function vJourney(sub) {
  if (sub && sub !== 'mountain') { S.jTab = sub; if (vBoard(sub)) return; }
  const r = myRead(); const H = 1500; const Wd = 400;
  const pts = []; for (let i = 0; i <= 12; i++) { const y = H - 70 - i * ((H - 330) / 12); const x = i % 2 ? 300 - (i % 4 === 1 ? 10 : 0) : 100 + (i % 4 === 0 ? 0 : 15); pts.push([i === 12 ? 200 : x, y]); }
  pts[0] = [200, H - 40];
  let dpath = `M${pts[0][0]},${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const my = (y0 + y1) / 2; dpath += ` C${x0},${my} ${x1},${my} ${x1},${y1}`; }
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>رحلتنا للقمة ⛰️</h1><p>كل يوم قراءة خطوة… والقمة عند الصليب يوم ${fmtDate(END, false)}</p></div>${journeySegs('mountain')}
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
    if (w !== wk) { if (wk >= 0) html += '</div>'; wk = w; const s = addDays('2026-11-14', w * 7); html += `<div class="week"><h3>الأسبوع ${ar(w + 1)}، من ${fmtDate(s, false)} لـ ${fmtDate(addDays(s, 6), false)}</h3>`; }
    const x = byDate[d];
    if (x) {
      const cls = r.has(x.n) ? 'done' : x.date === t ? 'today' : x.date < t ? 'missed' : 'future';
      html += `<a class="pday ${cls}" href="#/read/${x.n}"><span class="n">${ar(x.n)}</span><span class="t"><b>${otLabel(x)}${x.nt ? ' + ' + ntLabel(x) : ''}</b><small>${fmtDate(x.date)}${r.has(x.n) && readState(meU(), x.n) === 'late' ? ' <i class="latepill">قريته متأخر</i>' : ''}</small></span>${cls === 'done' ? `<span class="check">${ICON.check}</span>` : cls === 'missed' ? '<span class="st" style="color:var(--red)">كمّله</span>' : cls === 'today' ? '<span class="st" style="color:var(--red)">النهارده</span>' : ''}</a>`;
    } else if (weekday(d) === 5 && d > START) html += `<div class="friday">الجمعة ${fmtDate(d, false)} — إجازة 🌿</div>`;
    d = addDays(d, 1);
  }
  html += '</div>';
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>الخطة كلها</h1><p>${ar(TOTAL)} يوم من ${fmtDate(START, false)} لحد ${fmtDate(END, false, true)}، والجمعة إجازة</p></div>
  <div class="card" style="padding:14px 16px"><div class="between"><span class="sub">قريت</span><b>${ar(r.size)} / ${ar(TOTAL)}</b></div><div class="prog" style="background:#f2e4c2"><i style="width:${(r.size / TOTAL) * 100}%"></i></div></div>${html}${logos()}</div>`;
  const tEl = $('.pday.today'); if (tEl) setTimeout(() => tEl.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 300);
}

function prayedSet() { try { return new Set(JSON.parse(localStorage.getItem('la3rafo:prayed') || '[]')); } catch (e) { return new Set(); } }
async function vWall(tabArg) {
  if (['verse', 'prayer', 'ask'].includes(tabArg)) S.wallTab = tabArg;
  const tab = S.wallTab; const list = S.wall.filter((w) => w.type === tab).sort((a, b) => b.at - a.at); const pr = prayedSet();
  const mine = (w) => (w.uid ? w.uid === api.myUid() : w.phone === S.me.phone);
  const pending = (S.myq || []).filter((q) => q.status !== 'answered').length;
  const post = (w) => {
    const anon = w.type === 'prayer'; const who = anon ? initialOf(w.name) : w.name;
    return `<article class="card post ${w.type}"><div class="who">${anon ? `<span class="av anon">${esc(who.replace('.', ''))}</span>` : avatar(w.name)}<div class="grow"><b>${esc(who)}</b><div class="sub" style="font-size:12px">${anon ? 'واحد من الأسرة، ' : ''}${timeAgo(w.at)}</div></div>${mine(w) ? `<button class="chip" data-del="${w.id}" aria-label="حذف">حذف</button>` : ''}</div>
    <p class="txt ${w.type === 'verse' ? 'verse-q' : ''}">${w.type === 'verse' ? '«' + esc(w.text) + '»' : esc(w.text)}</p>${w.ref ? `<p class="ref">${esc(w.ref)}</p>` : ''}${w.note ? `<p class="note">💭 ${esc(w.note)}</p>` : ''}
    ${anon ? `<div class="foot"><span class="sub">${ar(w.prayed || 0)} صلّوا</span><button class="pray ${pr.has(w.id) ? 'did' : ''}" data-pray="${w.id}">${pr.has(w.id) ? 'صلّيت ✓' : '🙏 صلّيت'}</button></div>` : ''}</article>`;
  };
  const compose = {
    verse: `<section class="card compose"><h3 class="ch3">اختار الآية اللي لمستك</h3><div id="vpick"></div>
      <input class="inp" id="pnote" maxlength="200" placeholder="ليه لمستك؟ (اختياري)" style="margin-top:10px"><button class="btn primary block" id="psend" style="margin-top:10px">شارك الآية ✨</button></section>`,
    prayer: `<blockquote class="vp-text pverse"><p>«وَصَلُّوا بَعْضُكُمْ لأَجْلِ بَعْضٍ، لِكَيْ تُشْفَوْا. طَلِبَةُ الْبَارِّ تَقْتَدِرُ كَثِيرًا فِي فِعْلِهَا»</p><cite>يعقوب ٥: ١٦</cite></blockquote><section class="card compose"><textarea id="ptext" maxlength="400" placeholder="اكتب طلبتك… وإحنا هنصلّي لك"></textarea><p class="hint" style="margin:6px 2px 0">🔒 اسمك مش هيظهر، هيظهر أول حرف منه بس.</p>
      <button class="btn primary block" id="psend" style="margin-top:10px">اطلب صلاة</button></section>`,
    ask: `<section class="card ask-cta"><div class="big">❓</div><h2>عندك سؤال أو محتاج تفسير لآية؟</h2><p class="sub">اسأل الخدام، والرد هيوصلك على الواتساب. سؤالك محدش بيشوفه غير الخدام.</p><button class="btn red block" id="ask">اسأل دلوقتي</button>
      <p class="hint" style="margin-top:8px">ممكن كمان وإنت بتقرا: دوس على الآية واختار «❓ اسأل».</p></section><h3 class="ch3" style="margin:16px 4px 8px">أسئلتي</h3>`,
  }[tab];
  APP.innerHTML = `<div class="view">${topbar()}<div class="hello"><h1>الأسرة 🤍</h1><p>«احملوا بعضكم أثقال بعض»</p></div>
  <div class="seg three" role="tablist"><button class="${tab === 'verse' ? 'on' : ''}" data-t="verse">✨ آيات لمستنا</button><button class="${tab === 'prayer' ? 'on' : ''}" data-t="prayer">🙏 طلبات صلاة</button><button class="${tab === 'ask' ? 'on' : ''}" data-t="ask">❓ اسأل${pending ? ` <i class="dot">${ar(pending)}</i>` : ''}</button></div>
  ${compose}
  <div class="stagger">${tab === 'ask' ? myQuestionsHTML(S.myq || []) : list.length ? list.map(post).join('')
    : `<div class="card" style="text-align:center"><p class="muted">لسه مفيش حاجة هنا… كن أول واحد يشارك 🤍</p></div>`}</div>${logos()}</div>`;
  $$('.seg button').forEach((b) => b.onclick = () => { location.hash = '#/wall/' + b.dataset.t; });
  if (tab === 'ask') { $('#ask').onclick = () => askModal(); return; }
  let getVerse = null; if (tab === 'verse') getVerse = await versePicker($('#vpick'), {}, { keep: (S.vpWall = S.vpWall || {}) });
  $('#psend').onclick = async () => {
    if (tab === 'verse') {
      const v = getVerse && getVerse(); if (!v || !v.text) return toast('اختار الآية الأول 🙂');
      $('#psend').disabled = true; await api.post('verse', v.text, v.ref, $('#pnote').value.trim()); toast('اتشاركت ✨'); return;
    }
    const t = $('#ptext').value.trim(); if (t.length < 3) return toast('اكتب طلبتك الأول 🙂'); $('#psend').disabled = true; await api.post('prayer', t); toast('طلبتك وصلت… هنصلّي لك 🙏');
  };
  $$('[data-pray]').forEach((b) => b.onclick = async () => { const id = b.dataset.pray; const s = prayedSet(); if (s.has(id)) return; s.add(id); localStorage.setItem('la3rafo:prayed', JSON.stringify([...s])); vibrate(15); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 30); await api.pray(id); });
  $$('[data-del]').forEach((b) => b.onclick = async () => { if (b.dataset.sure) { await api.removePost(b.dataset.del); toast('اتمسح'); } else { b.dataset.sure = '1'; b.textContent = 'متأكد؟'; b.style.color = 'var(--red)'; setTimeout(() => { delete b.dataset.sure; b.textContent = 'حذف'; b.style.color = ''; }, 3000); } });
}

function vMe() {
  const r = myRead(); const us = userStats(meU()); const st = streak(r); const got = BADGES.filter((b) => b.test(r)); const pct = r.size / TOTAL; const C = 2 * Math.PI * 78;
  APP.innerHTML = `<div class="view">${topbar()}<div class="stagger"><section class="card" style="text-align:center"><div class="row" style="justify-content:center">${avatar(S.me.name, 54)}<div style="text-align:right"><h2 style="margin:0">${esc(S.me.name)}</h2><span class="sub">في الرحلة من ${fmtDate(START, false)}</span></div></div>
    <div class="ring"><svg width="180" height="180"><circle cx="90" cy="90" r="78" fill="none" stroke="#f2e4c2" stroke-width="14"/><circle cx="90" cy="90" r="78" fill="none" stroke="url(#rg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" style="transition:stroke-dashoffset 1.4s var(--ease)"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#C9A04E"/><stop offset="1" stop-color="#C22026"/></linearGradient></defs></svg>
    <div class="c"><div><b>${ar(Math.round(pct * 100))}٪</b><span>من الرحلة</span></div></div></div>
    <div class="stats"><div class="stat"><b>${ar(us.onTime)}</b><span>في معاده</span></div><div class="stat"><b>${ar(us.late)}</b><span>متأخر</span></div><div class="stat"><b>${ar(st)}</b><span>أيام متتالية</span></div><div class="stat"><b>${ar(got.length)}</b><span>شارة</span></div><div class="stat"><b>${us.qt ? ar(us.qc) + '<small>/' + ar(us.qt) + '</small>' : '—'}</b><span>أسئلة صح</span></div><div class="stat"><b>${ar(us.points)}</b><span>نقطة نور</span></div></div></section>
    <section class="card"><h2>شهادة إتمام الرحلة</h2><p class="sub">${r.size >= TOTAL ? 'مبروك! خلّصت الرحلة كلها 🎉' : `هتتفتح لما تخلّص الـ${ar(TOTAL)} يوم — فاضل ${ar(TOTAL - r.size)}`}</p><button class="btn ${r.size >= TOTAL ? 'red' : 'ghost'} block" id="cert" style="margin-top:12px">${r.size >= TOTAL ? 'حمّل شهادتك' : 'شوف شكل الشهادة'}</button></section>
    <section class="card"><h2>بياناتي</h2><div class="field" style="margin-top:10px"><input id="nm" value="${esc(S.me.name)}" placeholder=" " maxlength="40"><label for="nm">الاسم</label></div>
    <div class="actions" style="margin-top:4px"><button class="btn primary" id="save">حفظ الاسم</button><button class="btn ghost" id="out">خروج</button></div></section>
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

// ---------- onboarding with the pop-up book ----------
function vOnboard() {
  NAV.hidden = true; APP.classList.add('full');
  APP.innerHTML = `<div class="onb view">${emblem3D()}
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
  intro3D();
  $('#oform').addEventListener('submit', async (e) => {
    e.preventDefault(); const n = $('#iname').value.trim(); const p = normPhone($('#iphone').value);
    if (n.length < 2) return ($('#oerr').textContent = 'اكتب اسمك');
    if (!validPhone(p)) return ($('#oerr').textContent = 'رقم الموبايل لازم يكون ١١ رقم ويبدأ بـ 01');
    $('#oerr').textContent = ''; $('#ogo').disabled = true; $('#ogo').textContent = 'لحظة…';
    try { S.me = await api.login(n, p); const r = $('#ogo').getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 140); setTimeout(() => { APP.classList.remove('full'); if (!/^#\/(khadem|exam)/.test(location.hash)) location.hash = '#/today'; route(); }, 700); }
    catch (err) { console.error(err); $('#oerr').textContent = 'حصلت مشكلة في الاتصال… جرّب تاني'; $('#ogo').disabled = false; $('#ogo').textContent = 'يلا نبدأ الرحلة ⛰️'; }
  });
}
// ---------- 3D emblem: real depth layers + thickness, camera fly-in, then drag to rotate ----------
const LAYERS = [
  ['pageL', -54, 'pl'], ['pageR', -54, 'pr'], ['flame', -44, 'fl'], ['sun', -32, 'su'], ['back', -16, 'bk'], ['front', 0, 'fr'],
  ['tablets', 16, 'tb'], ['cross0', 16, 'c0'], ['cross2', 16, 'c2'], ['cross1', 16, 'c1'],
];
const PERSP = 1100;
function emblem3D() {
  const slice = (n, k) => `<img class="ex" src="assets/img/l_${n}.png" alt="" style="transform:translateZ(${-k * 1.7}px)">`;
  return `<div class="stage3d" id="st"><div class="glow3d" id="glow"></div><div class="rays3d" id="rays"></div>
    <div class="cam3d" id="cam"><div class="floor3d" id="floor"></div>${LAYERS.map(([n, z, id]) => `<div class="L3" id="L_${id}" data-z="${z}">
      ${['tablets', 'cross0', 'cross1', 'cross2'].includes(n) ? '' : [4, 3, 2, 1].map((k) => slice(n, k)).join('')}<img class="face" src="assets/img/l_${n}.png" alt=""></div>`).join('')}</div>
    <p class="hint3d" id="h3d">حرّكه بصباعك 👆</p></div>`;
}
function intro3D() {
  const cl = (x) => Math.min(1, Math.max(0, x)); const P = (t, a, b) => cl((t - a) / (b - a));
  const eo = (x) => 1 - Math.pow(1 - x, 3); const eio = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const bk = (x, c = 1.6) => (x <= 0 ? 0 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2));
  const E = (id) => document.getElementById(id); const cam = E('cam'); if (!cam) return;
  const L = Object.fromEntries(LAYERS.map(([, z, id]) => [id, { el: E('L_' + id), z }]));
  const comp = (z) => (PERSP - z) / PERSP; // keeps every layer pixel-aligned when seen from the front
  // drag / tilt
  let dx = 0, dy = 0, vx = 0, vy = 0, drag = null, touched = false;
  const st = E('st');
  st.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, dx, dy }; touched = true; st.setPointerCapture?.(e.pointerId); E('h3d')?.classList.add('gone'); });
  st.addEventListener('pointermove', (e) => { if (!drag) return; const nx = drag.dx + (e.clientX - drag.x) * .35, ny = drag.dy - (e.clientY - drag.y) * .25; vx = nx - dx; vy = ny - dy; dx = nx; dy = ny; });
  const up = () => { drag = null; }; st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
  addEventListener('deviceorientation', (e) => { if (drag || e.gamma == null) return; dx += ((Math.max(-25, Math.min(25, e.gamma)) * .9) - dx) * .08; dy += ((Math.max(-20, Math.min(20, (e.beta || 45) - 45)) * -.6) - dy) * .08; }, { passive: true });
  const t0 = performance.now();
  const frame = (now) => {
    if (!document.getElementById('cam')) return;
    const t = reduce ? 9 : (now - t0) / 1000;
    // camera: starts low and to the side, orbits while the book builds, settles facing us
    const settle = eio(P(t, 2.9, 4.3));
    let ry = -42 + 22 * eo(P(t, 0, 2.9)); ry = ry * (1 - settle) + (settle >= 1 ? 0 : 0);
    let rx = 30 - 10 * eo(P(t, 0, 2.9)); rx = rx * (1 - settle);
    const idle = P(t, 4.3, 5.3);
    if (!drag) { dx *= .94; dy *= .94; if (Math.abs(vx) > .05) { dx += vx; vx *= .9; } if (Math.abs(vy) > .05) { dy += vy; vy *= .9; } }
    const sway = touched ? 0 : 1;
    ry += idle * (sway * 9 * Math.sin((t - 4.3) * .55) + dx); rx += idle * (sway * 4 * Math.sin((t - 4.3) * .4) + dy);
    rx = Math.max(-35, Math.min(35, rx)); ry = Math.max(-60, Math.min(60, ry));
    cam.style.transform = `translateZ(-40px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${.86 + .14 * eo(P(t, 0, 4.3))})`;
    // pages open like a book from the spine
    const po = bk(eio(P(t, .15, 1.5)), .9); const pa = 92 * (1 - po);
    const put = (id, extra, op) => { const o = L[id]; o.el.style.transform = `translateZ(${o.z}px) scale(${comp(o.z)}) ${extra || ''}`; o.el.style.opacity = op; };
    put('pl', `rotateY(${-pa}deg)`, P(t, 0, .3)); put('pr', `rotateY(${pa}deg)`, P(t, 0, .3));
    // mountains rise out of the book
    const kb = P(t, .9, 1.8), kf = P(t, 1.25, 2.15);
    put('bk', `translateY(${(1 - bk(kb, 1.4)) * 38}%)`, P(kb, 0, .25)); put('fr', `translateY(${(1 - bk(kf, 1.4)) * 42}%)`, P(kf, 0, .25));
    // sun climbs over the peak, rays open
    const ks = P(t, 1.7, 2.8); put('su', `translateY(${(1 - eo(ks)) * 34}%)`, P(ks, 0, .15));
    // tablets and crosses come forward toward us
    const kt = P(t, 2.2, 2.9); put('tb', `translateZ(${(1 - bk(kt, 2)) * 140}px)`, P(kt, 0, .2));
    [['c0', 2.45], ['c2', 2.6], ['c1', 2.75]].forEach(([id, a]) => { const k = P(t, a, a + .55); put(id, `translateY(${(1 - bk(k, 2)) * 12}%) scaleY(${.3 + .7 * eo(k)})`, P(k, 0, .2)); });
    // the flame flares
    const kfl = P(t, 2.8, 3.6); put('fl', `scaleY(${bk(kfl, 2.4)})`, P(kfl, 0, .15));
    E('rays').style.opacity = .9 * eo(P(t, 2.2, 3.4)); E('rays').style.transform = `translate(-50%,-50%) translateZ(-90px) rotate(${t * 7}deg) scale(${.35 + .65 * eo(P(t, 2.2, 3.6))})`;
    E('glow').style.opacity = eo(P(t, 2, 3.4));
    E('floor').style.opacity = .9 * P(t, .3, 1.2);
    if (t > 3.9) { E('onm')?.classList.add('in'); E('otag')?.classList.add('in2'); E('over')?.classList.add('in2'); E('oform')?.classList.add('in'); }
    if (t > 5.5 && !touched) E('h3d')?.classList.add('show');
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---------- router ----------
function route() {
  $$('body > .selbar').forEach((x) => x.remove());
  if (!S.me) return vOnboard();
  APP.classList.remove('full');
  { const rr = (location.hash || '#/today').split('/')[1]; NAV.hidden = rr === 'read' || rr === 'exam'; document.body.classList.toggle('reading', rr === 'read'); }
  const [, r = 'today', a, b] = (location.hash || '#/today').split('/');
  if (r === 'servants') { location.hash = '#/khadem'; return; }
  try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } if (r !== 'read') document.body.classList.remove('night');
  $$('#nav a').forEach((x) => x.classList.toggle('on', x.dataset.r === r || (r === 'read' && x.dataset.r === 'today') || (r === 'exam' && x.dataset.r === 'journey')));
  const v = { today: vToday, read: () => vRead(a, b), journey: () => vJourney(a), plan: vPlan, wall: () => vWall(a), me: vMe, khadem: () => vAdmin(a, b), exam: () => vExam(a) }[r] || vToday;
  const same = S.lastRoute === location.hash; S.lastRoute = location.hash;
  v(); if (!same && r !== 'journey' && r !== 'plan' && r !== 'read') scrollTo(0, 0);
}
let rt; const pendK = new Set(); const rerender = (kinds) => () => { kinds.forEach((k) => pendK.add(k)); clearTimeout(rt); rt = setTimeout(() => { const ks = new Set(pendK); pendK.clear(); const r = (location.hash.split('/')[1] || 'today'); const sub = location.hash.split('/')[2]; if (r === 'khadem' && ['quiz', 'exams', 'word', 'asks', 'reports'].includes(sub)) return; if (S.me && ks.has(r) && !document.activeElement?.matches('input,textarea,select')) route(); }, 120); };
on('users', (u) => { S.users = u; if (S.me) { const m = u.find((x) => x.phone === S.me.phone); if (m) S.me = m; } rerender(['today', 'journey', 'plan', 'me', 'khadem'])(); });
on('wall', (w) => { S.wall = w; rerender(['wall'])(); });
on('myq', (q) => { S.myq = q; rerender(['wall'])(); });
on('days', (d) => { S.days = d; rerender(['today', 'khadem'])(); });
on('chq', (d) => { S.chq = d; rerender(['khadem'])(); });
on('exams', (d) => { S.exams = d; rerender(['today', 'journey', 'khadem'])(); });
addEventListener('hashchange', route);

(async () => {
  APP.innerHTML = '<div style="min-height:100dvh;display:grid;place-items:center"><img src="assets/img/emblem_s.png" alt="" style="width:90px;animation:bob 1.6s ease-in-out infinite"></div>';
  try { S.me = await init(); } catch (e) { console.error(e); }
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.endsWith('claude.ai') && !location.hostname.includes('claudeusercontent')) { try { navigator.serviceWorker.register('sw.js'); } catch (e) { /* ignore */ } }
})();
