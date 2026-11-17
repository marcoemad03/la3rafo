// لوحة الخدام — لينك خاص #/khadem وكود
import { DAYS, TOTAL, ar, fmtDate, todayCairo, dueDays, otLabel, ntLabel, BOOKS, status } from './plan.js';
import { api, mode, normPhone, buildResults } from './data.js';
import { $, $$, esc, APP, S, first, avatar, toast, topbar, burst, ICON } from './ui.js';
import { userStats, readState, cairoDate } from './stats.js';

const CH = [['gen', 50], ['jas', 5], ['1pe', 5], ['2pe', 3], ['1jn', 5], ['2jn', 1], ['3jn', 1], ['jud', 1], ['rev', 22]]
  .flatMap(([b, n]) => Array.from({ length: n }, (_, i) => ({ key: `${b}_${i + 1}`, label: `${BOOKS[b]} ${ar(i + 1)}` })));
const TABS = [['home', 'نظرة عامة'], ['day', 'يوم بيوم'], ['people', 'المشتركين'], ['quiz', 'أسئلة الأصحاحات'], ['exams', 'الامتحانات'], ['word', 'كلمة اليوم']];
const wa = (p) => '2' + normPhone(p);
const siteUrl = () => location.href.split('#')[0].replace(/khadem\/?$/, '');
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export async function vAdmin(tab = 'home', arg) {
  if (!(await api.isServant())) return gate();
  const T = TABS.find((x) => x[0] === tab) ? tab : 'home';
  const nav = `<div class="atabs">${TABS.map(([k, l]) => `<a href="#/khadem/${k}" class="${k === T ? 'on' : ''}">${l}</a>`).join('')}</div>`;
  APP.innerHTML = `<div class="view admin">${topbar()}<div class="hello"><h1>لوحة الخدام</h1><p>${ar(S.users.length)} مشترك في الرحلة</p></div>${nav}<div id="ab"></div></div>`;
  ({ home, day: dayTab, people, quiz: quizTab, exams: examsTab, word }[T])($('#ab'), arg);
  $('.atabs a.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function gate() {
  APP.innerHTML = `<div class="view">${topbar()}<section class="card gate"><div class="key">🔑</div><h1>دخول الخدام</h1><p class="sub">اكتب كود الخدام عشان تفتح اللوحة على الجهاز ده. هيفضل مفتوح على طول.</p>
    <div class="field" style="margin-top:14px"><input id="code" type="password" placeholder=" " autocomplete="off"><label for="code">كود الخدام</label></div><button class="btn primary block" id="go">ادخل</button>
    ${mode === 'demo' ? '<p class="hint">في الوضع التجريبي الكود: 2026</p>' : ''}</section>
    <details class="card"><summary><b>أول مرة؟ حدد كود الخدام</b></summary><p class="sub" style="margin:8px 0">الكود بيتحدد مرة واحدة بس، ومحدش يقدر يغيّره بعد كده من الموقع.</p>
    <div class="field"><input id="ncode" type="password" placeholder=" " minlength="4"><label for="ncode">الكود الجديد (٤ حروف أو أرقام على الأقل)</label></div>
    <div class="field"><input id="ncode2" type="password" placeholder=" "><label for="ncode2">اكتبه تاني للتأكيد</label></div><button class="btn ghost block" id="setc">احفظ الكود</button></details></div>`;
  $('#go').onclick = async () => { $('#go').disabled = true; if (await api.unlock($('#code').value.trim())) { toast('أهلًا يا خادم 🙏'); vAdmin(); } else { $('#go').disabled = false; toast('الكود غلط'); } };
  $('#setc').onclick = async () => {
    const c = $('#ncode').value.trim(); if (c.length < 4) return toast('الكود لازم يكون ٤ حروف أو أرقام على الأقل'); if (c !== $('#ncode2').value.trim()) return toast('الكودين مش زي بعض');
    if (await api.setCode(c)) { toast('اتحفظ الكود ✓'); vAdmin(); } else toast('الكود متحدد قبل كده. ادخل بيه من فوق');
  };
}

// ---------------------------------------------------------------- overview
function home(el) {
  const t = todayCairo(); const due = dueDays(t); const st = S.users.map((u) => ({ u, s: userStats(u, t) }));
  const last = due[due.length - 1]; const readLast = last ? S.users.filter((u) => (u.readDays || []).includes(last.n)).length : 0;
  const avgCons = st.length ? Math.round(st.reduce((a, x) => a + x.s.consistency, 0) / st.length) : 0;
  const lateAll = st.reduce((a, x) => a + x.s.late, 0); const week = Date.now() - 7 * 864e5; const active = st.filter((x) => x.s.lastAt > week).length;
  const qc = st.reduce((a, x) => a + x.s.qc, 0), qt = st.reduce((a, x) => a + x.s.qt, 0);
  const per = due.map((d) => { let on = 0, la = 0; S.users.forEach((u) => { const r = readState(u, d.n); if (r === 'ontime') on++; else if (r === 'late') la++; }); return { d, on, la }; });
  const mx = Math.max(1, S.users.length);
  const watch = st.filter((x) => x.s.missed >= 2 || (x.s.lastAt && x.s.lastAt < Date.now() - 3 * 864e5) || !x.s.read).sort((a, b) => b.s.missed - a.s.missed).slice(0, 8);
  const best = [...st].sort((a, b) => b.s.consistency - a.s.consistency || b.s.read - a.s.read).slice(0, 5);
  el.innerHTML = `<div class="kpis">
    ${kpi(`${ar(readLast)}<small>/${ar(S.users.length)}</small>`, last ? `قروا اليوم ${ar(last.n)}` : 'قراءة اليوم', pct(readLast, S.users.length))}
    ${kpi(`${ar(avgCons)}٪`, 'متوسط الانتظام', avgCons)}
    ${kpi(ar(active), 'نشطين آخر ٧ أيام', pct(active, S.users.length))}
    ${kpi(ar(lateAll), 'قراءة متأخرة', null)}
    ${kpi(qt ? `${ar(pct(qc, qt))}٪` : '—', 'إجابات صح في الأسئلة', qt ? pct(qc, qt) : null)}
    ${kpi(ar(S.wall.length), 'مشاركات وطلبات صلاة', null)}</div>
  <section class="card"><div class="between"><h2>القراءة يوم بيوم</h2><span class="legend2"><i class="on"></i>في معاده <i class="la"></i>متأخر</span></div>
    <div class="sbars">${per.map((p) => `<a href="#/khadem/day/${p.d.n}" class="sb" title="اليوم ${p.d.n}: ${p.on} في معاده، ${p.la} متأخر"><i class="la" style="height:${(p.la / mx) * 100}%"></i><i class="on" style="height:${(p.on / mx) * 100}%"></i><span>${p.d.n % 5 === 0 || p.d.n === 1 ? ar(p.d.n) : ''}</span></a>`).join('')}</div></section>
  <section class="card"><h2>محتاجين متابعة</h2><p class="sub">فاتهم يومين أو أكتر، أو بقالهم ٣ أيام مقروش</p>
    ${watch.length ? watch.map(({ u, s }) => `<div class="member">${avatar(u.name, 34)}<span class="grow"><b>${esc(u.name)}</b><br><small class="muted">فاته ${ar(s.missed)} يوم${s.lastAt ? `، آخر قراءة ${fmtDate(cairoDate(s.lastAt), false)}` : '، لسه مقراش'}</small></span>${waBtn(u, msgMissed(u, s))}</div>`).join('') : '<p class="muted" style="margin-top:8px">الكل ماشي كويس 👏</p>'}</section>
  <section class="card"><h2>الأكثر انتظامًا</h2>${best.map(({ u, s }, i) => `<div class="member"><span class="rkk">${ar(i + 1)}</span>${avatar(u.name, 30)}<span class="grow">${esc(u.name)}</span><b>${ar(s.consistency)}٪</b></div>`).join('')}</section>`;
}
const kpi = (v, l, p) => `<div class="kpi"><b>${v}</b><span>${l}</span>${p != null ? `<i style="--p:${p}%"></i>` : ''}</div>`;
const waBtn = (u, m) => `<a class="wa" target="_blank" rel="noopener" href="https://wa.me/${wa(u.phone)}?text=${encodeURIComponent(m)}">${ICON.wa} فكّره</a>`;
const msgDay = (u, d) => `سلام يا ${first(u.name)} 🌿\nلسه مستنيين شمعتك 🕯️\nقراءة اليوم ${ar(d.n)}: ${otLabel(d)}${d.nt ? ' + ' + ntLabel(d) : ''}\n${siteUrl()}\n— لأعرفه`;
const msgMissed = (u, s) => `سلام يا ${first(u.name)} 🌿\nوحشتنا في رحلة لأعرفه… فاتك ${ar(s.missed)} يوم، ولسه تقدر تكمّلهم من صفحة الخطة 📖\n${siteUrl()}`;

// ---------------------------------------------------------------- day by day
function dayTab(el, arg) {
  const st = status(); const sel = +arg || (st.phase === 'reading' ? st.day.n : (st.next?.n || dueDays().slice(-1)[0]?.n || 1)); const d = DAYS.find((x) => x.n === sel) || DAYS[0];
  const groups = { ontime: [], late: [], no: [] }; S.users.forEach((u) => groups[readState(u, d.n)].push(u));
  const isPast = d.date <= todayCairo();
  el.innerHTML = `<section class="card"><label class="sub" for="dsel">اختار اليوم</label><select id="dsel" style="margin-top:6px">${DAYS.map((y) => `<option value="${y.n}" ${y.n === d.n ? 'selected' : ''}>اليوم ${ar(y.n)}، ${fmtDate(y.date)}</option>`).join('')}</select>
    <p class="dsum">${otLabel(d)}${d.nt ? ' + ' + ntLabel(d) : ''}<br><small>المسؤول: <b>${d.servant.name}</b></small></p>
    <div class="tri"><span class="t1"><b>${ar(groups.ontime.length)}</b>في معاده</span><span class="t2"><b>${ar(groups.late.length)}</b>متأخر</span><span class="t3"><b>${ar(groups.no.length)}</b>${isPast ? 'مقراش' : 'لسه'}</span></div></section>
  ${groups.no.length ? `<section class="card"><h2>${isPast ? 'مقروش' : 'لسه مقروش'}</h2>${groups.no.map((u) => `<div class="member">${avatar(u.name, 34)}<span class="grow">${esc(u.name)}</span>${isPast ? waBtn(u, msgDay(u, d)) : ''}</div>`).join('')}</section>` : ''}
  ${groups.late.length ? `<section class="card"><h2>قروا متأخر ⏰</h2>${groups.late.map((u) => `<div class="member">${avatar(u.name, 34)}<span class="grow">${esc(u.name)}</span><span class="tag late">يوم ${fmtDate(cairoDate(u.readAt[d.n]), false)}</span></div>`).join('')}</section>` : ''}
  ${groups.ontime.length ? `<section class="card"><h2>قروا في معاده ✓</h2>${groups.ontime.map((u) => `<div class="member">${avatar(u.name, 34)}<span class="grow">${esc(u.name)}</span><span class="tag ok">في معاده</span></div>`).join('')}</section>` : ''}`;
  $('#dsel').onchange = (e) => { location.hash = `#/khadem/day/${e.target.value}`; };
}

// ---------------------------------------------------------------- people
function people(el) {
  const t = todayCairo(); const sort = S.pSort || 'cons';
  const rows = S.users.map((u) => ({ u, s: userStats(u, t) }));
  const key = { name: (r) => r.u.name, cons: (r) => -r.s.consistency * 1000 - r.s.read, late: (r) => -r.s.late, missed: (r) => -r.s.missed, quiz: (r) => -(r.s.qt ? r.s.qc / r.s.qt : -1), last: (r) => -r.s.lastAt }[sort];
  rows.sort((a, b) => { const x = key(a), y = key(b); return typeof x === 'string' ? x.localeCompare(y, 'ar') : x - y; });
  const th = (k, l) => `<button class="${sort === k ? 'on' : ''}" data-s="${k}">${l}</button>`;
  el.innerHTML = `<div class="between" style="margin-top:12px"><div class="sorts">${th('cons', 'الانتظام')}${th('missed', 'اللي فاتهم')}${th('late', 'المتأخر')}${th('quiz', 'الأسئلة')}${th('last', 'آخر قراءة')}${th('name', 'الاسم')}</div></div>
  <div class="ptable">${rows.map(({ u, s }) => `<button class="prow" data-p="${u.phone}">${avatar(u.name, 34)}<span class="grow"><b>${esc(u.name)}</b><small>${ar(s.read)} قراءة: ${ar(s.onTime)} في معاده${s.late ? `، ${ar(s.late)} متأخر` : ''}${s.missed ? `، فاته ${ar(s.missed)}` : ''}${s.qt ? `، الأسئلة ${ar(s.qc)}/${ar(s.qt)}` : ''}</small></span><span class="cons" style="--p:${s.consistency}%">${ar(s.consistency)}٪</span></button>`).join('')}</div>
  <button class="btn ghost block" id="csv" style="margin-top:14px">⬇️ نزّل البيانات (Excel / CSV)</button>`;
  $$('.sorts button', el).forEach((b) => b.onclick = () => { S.pSort = b.dataset.s; people(el); });
  $$('.prow', el).forEach((b) => b.onclick = () => personModal(S.users.find((u) => u.phone === b.dataset.p)));
  $('#csv', el).onclick = () => {
    const head = ['الاسم', 'الموبايل', 'قرا', 'في معاده', 'متأخر', 'فاته', 'الانتظام %', 'أسئلة صح', 'أسئلة كلها', 'أيام متتالية', ...DAYS.map((d) => `يوم ${d.n}`)];
    const lines = rows.map(({ u, s }) => [u.name, u.phone, s.read, s.onTime, s.late, s.missed, s.consistency, s.qc, s.qt, s.streak, ...DAYS.map((d) => ({ ontime: '✓', late: 'متأخر', no: '' }[readState(u, d.n)]))]);
    const csv = '﻿' + [head, ...lines].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `لأعرفه-المشتركين-${todayCairo()}.csv`; a.click();
  };
}
function personModal(u) {
  if (!u) return; const t = todayCairo(); const s = userStats(u, t);
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box" style="text-align:right"><div class="row">${avatar(u.name, 48)}<div><h2 style="margin:0">${esc(u.name)}</h2><span class="sub" dir="ltr">${esc(u.phone)}</span></div></div>
    <div class="stats" style="margin-top:12px"><div class="stat"><b>${ar(s.onTime)}</b><span>في معاده</span></div><div class="stat"><b>${ar(s.late)}</b><span>متأخر</span></div><div class="stat"><b>${ar(s.missed)}</b><span>فاته</span></div></div>
    <div class="dgrid">${DAYS.map((d) => `<i class="${d.date > t ? 'fu' : readState(u, d.n)}" title="اليوم ${d.n}">${ar(d.n)}</i>`).join('')}</div>
    <p class="legend2" style="justify-content:center;margin-top:8px"><i class="on"></i>في معاده <i class="la"></i>متأخر <i class="no"></i>فاته</p>
    <div class="actions">${waBtn(u, `سلام يا ${first(u.name)} 🌿`)}<button class="btn ghost" id="cl">قفل</button></div></div>`;
  document.body.appendChild(m); m.onclick = (e) => { if (e.target === m || e.target.id === 'cl') m.remove(); };
}

// ---------------------------------------------------------------- question builder (shared by chapter quizzes and exams)
function qBuilder(host, questions, withKey = true) {
  const draw = () => {
    host.innerHTML = questions.map((q, i) => `<div class="qed" data-i="${i}"><div class="between"><b>سؤال ${ar(i + 1)}</b><button class="chip" data-del="${i}">حذف</button></div>
      <input class="inp" data-f="q" value="${esc(q.q)}" placeholder="السؤال">
      ${[0, 1, 2, 3].map((k) => `<label class="optin"><input type="radio" name="a${i}" value="${k}" ${q.answer === k ? 'checked' : ''} aria-label="الإجابة الصح"><input class="inp" data-o="${k}" value="${esc(q.options[k] || '')}" placeholder="اختيار ${'أبجد'[k]}${k > 1 ? ' (اختياري)' : ''}"></label>`).join('')}
      ${withKey ? `<input class="inp" data-f="explain" value="${esc(q.explain || '')}" placeholder="الشاهد أو التوضيح (اختياري) — بيظهر بعد الإجابة">` : ''}</div>`).join('')
      + '<button class="btn ghost block" id="qadd">＋ ضيف سؤال</button><p class="hint">علّم الدايرة جنب الإجابة الصح.</p>';
    $$('[data-del]', host).forEach((b) => b.onclick = () => { read(); questions.splice(+b.dataset.del, 1); draw(); });
    $('#qadd', host).onclick = () => { read(); questions.push({ q: '', options: ['', '', '', ''], answer: 0, explain: '' }); draw(); $$('.qed', host).slice(-1)[0]?.querySelector('input')?.focus(); };
  };
  const read = () => {
    $$('.qed', host).forEach((box) => { const i = +box.dataset.i; const q = questions[i];
      q.q = box.querySelector('[data-f="q"]').value.trim(); q.options = [0, 1, 2, 3].map((k) => box.querySelector(`[data-o="${k}"]`).value.trim());
      const a = box.querySelector(`input[name="a${i}"]:checked`); q.answer = a ? +a.value : 0; const ex = box.querySelector('[data-f="explain"]'); if (ex) q.explain = ex.value.trim(); });
  };
  draw();
  return () => { read(); const clean = []; for (const q of questions) {
    const opts = q.options.map((o, k) => ({ o, k })).filter((x) => x.o); if (!q.q && !opts.length) continue;
    if (!q.q || opts.length < 2) return { error: 'كل سؤال محتاج نص واختيارين على الأقل' };
    const ans = opts.findIndex((x) => x.k === q.answer); if (ans < 0) return { error: 'في سؤال الإجابة الصح فيه اختيار فاضي' };
    clean.push({ q: q.q, options: opts.map((x) => x.o), answer: ans, ...(q.explain ? { explain: q.explain } : {}) }); } return { questions: clean }; };
}

function quizTab(el, arg) {
  const key = arg || S.qKey || 'gen_1'; S.qKey = key; const has = (k) => (S.chq[k]?.questions || []).length;
  const cur = (S.chq[key]?.questions || []).map((q) => ({ ...q, options: [...q.options, '', '', '', ''].slice(0, 4) }));
  if (!cur.length) cur.push({ q: '', options: ['', '', '', ''], answer: 0, explain: '' });
  el.innerHTML = `<section class="card"><h2>أسئلة على كل أصحاح</h2><p class="sub">اختياري. لو حطيت أسئلة على أصحاح، هتظهر للمخدومين تحت الأصحاح بعنوان «اختبر نفسك».</p>
    <select id="ksel" style="margin-top:10px">${CH.map((c) => `<option value="${c.key}" ${c.key === key ? 'selected' : ''}>${c.label}${has(c.key) ? ` ✓ (${ar(has(c.key))})` : ''}</option>`).join('')}</select></section>
  <section class="card"><div id="qb"></div><div class="actions"><button class="btn primary" id="qsave">حفظ الأسئلة</button>${has(key) ? '<button class="btn ghost" id="qclear">امسح أسئلة الأصحاح</button>' : ''}</div></section>`;
  const get = qBuilder($('#qb', el), cur);
  $('#ksel', el).onchange = (e) => { location.hash = `#/khadem/quiz/${e.target.value}`; };
  $('#qsave', el).onclick = async () => { const r = get(); if (r.error) return toast(r.error); await api.saveChq(key, r.questions); toast(r.questions.length ? `اتحفظ ${ar(r.questions.length)} سؤال ✓` : 'مفيش أسئلة على الأصحاح ده'); };
  $('#qclear', el) && ($('#qclear', el).onclick = async () => { await api.saveChq(key, []); toast('اتمسحت'); quizTab(el, key); });
}

// ---------------------------------------------------------------- exams
async function examsTab(el, arg) {
  if (arg === 'new' || (arg && arg.startsWith('edit-'))) return examEditor(el, arg === 'new' ? null : arg.slice(5));
  const ex = [...S.exams].sort((a, b) => b.createdAt - a.createdAt);
  const label = { draft: 'مسودة', open: 'مفتوح', closed: 'مقفول', published: 'النتيجة اتعلنت' };
  el.innerHTML = `<a class="btn red block" href="#/khadem/exams/new" style="margin-top:14px">＋ امتحان جديد</a>
  ${ex.length ? ex.map((e) => `<section class="card exam-admin" data-id="${e.id}"><div class="between"><h2>${esc(e.title)}</h2><span class="tag st-${e.status}">${label[e.status] || e.status}</span></div>
    <p class="sub">${ar(e.questions.length)} سؤال${e.desc ? `، ${esc(e.desc)}` : ''}</p><p class="subs" data-c="${e.id}">…</p>
    <div class="xacts">${e.status === 'draft' || e.status === 'closed' ? `<button class="btn primary" data-a="open">افتح الامتحان</button>` : ''}${e.status === 'open' ? `<button class="btn primary" data-a="close">اقفل الامتحان</button>` : ''}
    ${e.status === 'closed' || e.status === 'open' ? `<button class="btn red" data-a="publish">اعلن النتيجة</button>` : ''}${e.status !== 'published' ? `<a class="btn ghost" href="#/khadem/exams/edit-${e.id}">تعديل</a>` : '<button class="btn ghost" data-a="republish">حدّث النتيجة</button>'}
    <button class="btn ghost" data-a="del">حذف</button></div></section>`).join('') : '<section class="card empty"><div class="big">📝</div><h2>مفيش امتحانات لسه</h2><p class="sub">اعمل امتحان عام أو امتحان على آخر سفر، وافتحه وقت ما تحب. النتيجة بتظهر في «قائمة الشرف» لما تعلنها.</p></section>'}`;
  for (const e of ex) { api.submissions(e.id).then((s) => { const p = $(`[data-c="${e.id}"]`, el); if (p) p.textContent = `${ar(s.length)} سلّموا إجاباتهم`; }).catch(() => {}); }
  $$('.exam-admin', el).forEach((card) => card.querySelectorAll('[data-a]').forEach((b) => b.onclick = async () => {
    const id = card.dataset.id; const a = b.dataset.a; const e = S.exams.find((x) => x.id === id);
    if (a === 'open') { await api.saveExam({ id, status: 'open' }); toast('الامتحان اتفتح للمخدومين ✓'); }
    if (a === 'close') { await api.saveExam({ id, status: 'closed' }); toast('اتقفل'); }
    if (a === 'publish' || a === 'republish') {
      b.disabled = true; const [key, subs] = await Promise.all([api.examKey(id), api.submissions(id)]);
      const results = buildResults(e, key, subs); await api.saveExam({ id, status: 'published', results });
      toast(`اتعلنت النتيجة، ${ar(results.length)} مشترك 🏆`); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 120);
    }
    if (a === 'del') { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'متأكد؟ اضغط تاني'; setTimeout(() => { delete b.dataset.sure; b.textContent = 'حذف'; }, 3000); return; } await api.deleteExam(id); toast('اتمسح'); }
    setTimeout(() => examsTab(el), 300);
  }));
}
async function examEditor(el, id) {
  const e = id ? S.exams.find((x) => x.id === id) : null; const key = id ? await api.examKey(id) : [];
  const qs = e ? e.questions.map((q, i) => ({ q: q.q, options: [...q.options, '', '', '', ''].slice(0, 4), answer: key[i] ?? 0 })) : [{ q: '', options: ['', '', '', ''], answer: 0 }];
  el.innerHTML = `<section class="card"><h2>${e ? 'تعديل الامتحان' : 'امتحان جديد'}</h2>
    <input class="inp" id="xt" value="${esc(e?.title || '')}" placeholder="اسم الامتحان، مثلًا: امتحان رسالة يعقوب" style="margin-top:10px">
    <input class="inp" id="xd" value="${esc(e?.desc || '')}" placeholder="وصف قصير (اختياري)" style="margin-top:8px"></section>
  <section class="card"><h2>الأسئلة</h2><div id="xqb" style="margin-top:8px"></div></section>
  <div class="actions"><button class="btn primary" id="xs">احفظ مسودة</button><button class="btn red" id="xo">احفظ وافتح الامتحان</button></div><a class="btn ghost block" href="#/khadem/exams" style="margin-top:10px">رجوع</a>`;
  const get = qBuilder($('#xqb', el), qs, false);
  const save = async (open) => {
    const title = $('#xt', el).value.trim(); if (!title) return toast('اكتب اسم الامتحان'); const r = get(); if (r.error) return toast(r.error); if (!r.questions.length) return toast('ضيف سؤال واحد على الأقل');
    const nid = await api.saveExam({ ...(id ? { id } : {}), title, desc: $('#xd', el).value.trim(), questions: r.questions.map((q) => ({ q: q.q, options: q.options })), ...(open ? { status: 'open' } : {}) }, r.questions.map((q) => q.answer));
    toast(open ? 'الامتحان اتفتح للمخدومين ✓' : 'اتحفظ ✓'); location.hash = '#/khadem/exams'; return nid;
  };
  $('#xs', el).onclick = () => save(false); $('#xo', el).onclick = () => save(true);
}

// ---------------------------------------------------------------- word of the day
function word(el, arg) {
  const st = status(); const sel = +arg || (st.phase === 'reading' ? st.day.n : (st.next?.n || 1)); const d = DAYS.find((x) => x.n === sel) || DAYS[0]; const x = S.days[sel] || {};
  el.innerHTML = `<section class="card"><select id="wsel">${DAYS.map((y) => `<option value="${y.n}" ${y.n === d.n ? 'selected' : ''}>اليوم ${ar(y.n)}، ${fmtDate(y.date)}${S.days[y.n]?.reflection ? ' ✓' : ''}</option>`).join('')}</select>
    <p class="dsum">${otLabel(d)}${d.nt ? ' + ' + ntLabel(d) : ''}</p>
    <textarea class="inp" id="refl" placeholder="تأمل قصير على قراءة اليوم… بيظهر للكل في صفحة «النهارده»">${esc(x.reflection || '')}</textarea>
    <input class="inp" id="ques" style="margin-top:8px" placeholder="سؤال للتأمل (اختياري)" value="${esc(x.question || '')}">
    <button class="btn primary block" id="sv" style="margin-top:10px">حفظ كلمة اليوم</button></section>`;
  $('#wsel', el).onchange = (e) => { location.hash = `#/khadem/word/${e.target.value}`; };
  $('#sv', el).onclick = async () => { await api.saveDay(sel, { reflection: $('#refl', el).value.trim(), question: $('#ques', el).value.trim() }); toast('اتحفظت كلمة اليوم ✓'); };
}
