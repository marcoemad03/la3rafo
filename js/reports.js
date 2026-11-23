// تقارير مفصلة للخدام، بتتنزل PDF (صفحات A4 بتترسم في المتصفح وبتتحط في ملف)
import { DAYS, ar, fmtDate, todayCairo, dueDays, otLabel, ntLabel, BOOKS } from './plan.js';
import { api, scoreSub, gradeOne, buildResults, QTYPES, qType, qPts } from './data.js';
import { $, $$, esc, S, toast } from './ui.js';
import { readState, cairoDate, weekRange } from './stats.js';

const W = 794, H = 1123; // A4 at 96dpi
const pc = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmtTime = new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit' });
const when = (ms) => (ms ? `${fmtDate(cairoDate(ms), false)}، ${fmtTime.format(new Date(ms))}` : '—');
const bar = (p, c = '#2E7D6B') => `<span class="rbar"><i style="width:${Math.max(0, Math.min(100, p))}%;background:${c}"></i></span>`;
const ST = { ontime: '<b class="s-ok">في معاده</b>', late: '<b class="s-la">متأخر</b>', no: '<b class="s-no">مقراش</b>', fu: '<span class="s-fu">لسه</span>' };

// ---------------------------------------------------------------- the form
export function reportsTab(el) {
  const due = dueDays(); const last = due.length ? due[due.length - 1].n : 1; const [ws, we] = weekRange();
  const wk = DAYS.filter((d) => d.date >= ws && d.date <= we);
  const R = S.rep || (S.rep = { kind: 'all', from: 1, to: last, who: '', exam: '' });
  const dopt = (sel) => DAYS.map((d) => `<option value="${d.n}" ${d.n === sel ? 'selected' : ''}>اليوم ${ar(d.n)}، ${fmtDate(d.date, false)}</option>`).join('');
  const exams = [...S.exams].sort((a, b) => b.createdAt - a.createdAt);
  el.innerHTML = `<section class="card"><h2>📄 التقارير</h2><p class="sub">اختار نوع التقرير والفترة، وهيتعمل ملف PDF مفصّل تقدر تنزّله أو تبعته.</p>
    <div class="seg rkind" style="margin-top:12px"><button data-k="all" class="${R.kind === 'all' ? 'on' : ''}">تقرير عام</button><button data-k="person" class="${R.kind === 'person' ? 'on' : ''}">مخدوم واحد</button><button data-k="exam" class="${R.kind === 'exam' ? 'on' : ''}">امتحان</button></div>
    ${R.kind === 'exam' ? `<label class="lbl">الامتحان<select id="rex">${exams.length ? exams.map((e) => `<option value="${e.id}" ${e.id === R.exam ? 'selected' : ''}>${esc(e.title)}</option>`).join('') : '<option value="">مفيش امتحانات لسه</option>'}</select></label>` : `
    ${R.kind === 'person' ? `<label class="lbl">المخدوم<select id="rwho">${[...S.users].sort((a, b) => a.name.localeCompare(b.name, 'ar')).map((u) => `<option value="${u.phone}" ${u.phone === R.who ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>` : ''}
    <div class="vp-row" style="margin-top:10px"><label class="lbl">من<select id="rfrom">${dopt(R.from)}</select></label><label class="lbl">لحد<select id="rto">${dopt(R.to)}</select></label></div>
    <div class="qadd" style="margin-top:8px"><button class="chip" data-q="week">الأسبوع ده</button><button class="chip" data-q="all">من الأول لحد النهارده</button><button class="chip" data-q="full">الرحلة كلها</button></div>`}
    <button class="btn red block" id="rgo" style="margin-top:14px">اعمل التقرير</button></section>`;
  $$('.rkind button', el).forEach((b) => b.onclick = () => { R.kind = b.dataset.k; reportsTab(el); });
  $$('[data-q]', el).forEach((b) => b.onclick = () => {
    if (b.dataset.q === 'week') { R.from = wk[0]?.n || 1; R.to = Math.min(wk[wk.length - 1]?.n || last, last); }
    if (b.dataset.q === 'all') { R.from = 1; R.to = last; }
    if (b.dataset.q === 'full') { R.from = 1; R.to = DAYS.length; }
    reportsTab(el);
  });
  const rd = () => { R.from = +($('#rfrom', el)?.value || R.from); R.to = +($('#rto', el)?.value || R.to); if (R.to < R.from) [R.from, R.to] = [R.to, R.from]; R.who = $('#rwho', el)?.value || R.who; R.exam = $('#rex', el)?.value || R.exam; };
  $('#rgo', el).onclick = async (ev) => {
    rd(); if (R.kind === 'person' && !R.who) R.who = S.users[0]?.phone; if (R.kind === 'exam' && !R.exam) return toast('مفيش امتحان تعمله تقرير');
    ev.target.disabled = true; ev.target.textContent = 'بيتعمل…';
    try { await makeReport(R); } catch (e) { console.error(e); toast('حصلت مشكلة وإحنا بنعمل التقرير'); }
    ev.target.disabled = false; ev.target.textContent = 'اعمل التقرير';
  };
}

// ---------------------------------------------------------------- data → blocks
function rangeDays(R) { return DAYS.filter((d) => d.n >= R.from && d.n <= R.to); }
function statsIn(u, days, today) {
  let on = 0, la = 0, no = 0, fu = 0; days.forEach((d) => { if (d.date > today) { fu++; return; } const s = readState(u, d.n); if (s === 'ontime') on++; else if (s === 'late') la++; else no++; });
  const due = days.length - fu; return { on, la, no, fu, due, cons: pc(on, due), done: pc(on + la, due) };
}
async function examData() {
  const out = [];
  for (const e of S.exams) { try { const [key, subs] = await Promise.all([api.examKey(e.id), api.submissions(e.id)]); out.push({ e, key, subs, res: buildResults(e, key, subs) }); } catch (x) { out.push({ e, key: [], subs: [], res: e.results || [] }); } }
  return out.sort((a, b) => b.e.createdAt - a.e.createdAt);
}

async function allBlocks(R) {
  const today = todayCairo(); const days = rangeDays(R); const dueIn = days.filter((d) => d.date <= today);
  const rows = S.users.map((u) => ({ u, s: statsIn(u, days, today) })).sort((a, b) => b.s.cons - a.s.cons || b.s.on + b.s.la - a.s.la - a.s.on || a.u.name.localeCompare(b.u.name, 'ar'));
  const n = S.users.length; const tot = rows.reduce((a, r) => ({ on: a.on + r.s.on, la: a.la + r.s.la, no: a.no + r.s.no }), { on: 0, la: 0, no: 0 }); const slots = n * dueIn.length;
  const [ex, qs] = await Promise.all([examData(), api.listQuestions().catch(() => [])]);
  const fromT = new Date(days[0].date + 'T00:00:00+02:00').getTime(); const toT = new Date(days[days.length - 1].date + 'T23:59:59+02:00').getTime();
  const inR = (t) => t >= fromT && t <= toT;
  const wallIn = S.wall.filter((w) => inR(w.at)); const qIn = qs.filter((q) => inR(q.at));
  const exScore = {}; ex.forEach(({ res }) => res.forEach((r) => { exScore[r.phone] = exScore[r.phone] || { s: 0, t: 0 }; exScore[r.phone].s += r.score; exScore[r.phone].t += r.total; }));
  const chKeys = [...new Set(days.flatMap((d) => [...d.ot.map((c) => `gen_${c}`), ...(d.nt ? [`${d.nt.book}_${d.nt.ch}`] : [])]))];
  const B = [];
  B.push({ html: `<div class="kpis">${[
    [ar(n), 'مشترك'], [`${ar(pc(tot.on + tot.la, slots))}٪`, 'نسبة القراءة'], [`${ar(pc(tot.on, slots))}٪`, 'قروا في معادهم'], [ar(tot.on), 'قراءة في معادها'],
    [ar(tot.la), 'قراءة متأخرة'], [ar(tot.no), 'قراءة فايتة'], [ar(dueIn.length), 'يوم قراءة في الفترة'], [ar(wallIn.filter((w) => w.type === 'verse').length), 'آية اتشاركت'],
    [ar(wallIn.filter((w) => w.type === 'prayer').length), 'طلب صلاة'], [`${ar(qIn.length)}<small> (${ar(qIn.filter((q) => q.status === 'answered').length)} اتردّ)</small>`, 'سؤال للخدام'],
  ].map(([v, l]) => `<div class="k"><b>${v}</b><span>${l}</span></div>`).join('')}</div>` });
  B.push({ table: { title: 'القراءة يوم بيوم', head: ['اليوم', 'التاريخ', 'القراءة', 'المسؤول', 'في معاده', 'متأخر', 'مقراش', 'النسبة'],
    rows: days.map((d) => { if (d.date > today) return [ar(d.n), fmtDate(d.date), `${otLabel(d)}${d.nt ? '، ' + ntLabel(d) : ''}`, d.servant.name, '—', '—', '—', '<span class="s-fu">لسه</span>'];
      let on = 0, la = 0; S.users.forEach((u) => { const s = readState(u, d.n); if (s === 'ontime') on++; else if (s === 'late') la++; });
      return [ar(d.n), fmtDate(d.date), `${otLabel(d)}${d.nt ? '، ' + ntLabel(d) : ''}`, d.servant.name, ar(on), ar(la), ar(n - on - la), `${ar(pc(on + la, n))}٪ ${bar(pc(on + la, n))}`]; }),
    widths: [7, 15, 26, 10, 9, 8, 8, 17] } });
  B.push({ table: { title: 'المشتركين بالتفصيل', note: 'مترتبين بالانتظام. الانتظام = القراءة في معادها من الأيام اللي فاتت في الفترة.',
    head: ['#', 'الاسم', 'الموبايل', 'في معاده', 'متأخر', 'فاته', 'الانتظام', 'أسئلة الأصحاحات', 'الامتحانات', 'آخر قراءة'],
    rows: rows.map(({ u, s }, i) => { const q = Object.entries(u.quiz || {}).filter(([k]) => chKeys.includes(k)).reduce((a, [, x]) => ({ c: a.c + (x.c || 0), t: a.t + (x.t || 0) }), { c: 0, t: 0 }); const e = exScore[u.phone];
      const lastT = Math.max(0, ...Object.entries(u.readAt || {}).filter(([k]) => +k >= R.from && +k <= R.to).map(([, v]) => v));
      return [ar(i + 1), `<b>${esc(u.name)}</b>`, `<span dir="ltr">${esc(u.phone)}</span>`, ar(s.on), ar(s.la), s.no ? `<b class="s-no">${ar(s.no)}</b>` : '٠', `${ar(s.cons)}٪ ${bar(s.cons, s.cons >= 80 ? '#2E7D6B' : s.cons >= 50 ? '#C9A04E' : '#C22026')}`, q.t ? `${ar(q.c)}/${ar(q.t)}` : '—', e ? `${ar(e.s)}/${ar(e.t)}` : '—', lastT ? fmtDate(cairoDate(lastT), false) : '—']; }),
    widths: [4, 18, 13, 7, 7, 6, 15, 10, 9, 11] } });
  const watch = rows.filter((r) => r.s.no >= 2).sort((a, b) => b.s.no - a.s.no);
  B.push({ table: { title: `محتاجين متابعة (${ar(watch.length)})`, note: 'فاتهم يومين أو أكتر في الفترة دي.', head: ['الاسم', 'الموبايل', 'فاته', 'الأيام اللي فاتته'],
    rows: watch.length ? watch.map(({ u, s }) => [`<b>${esc(u.name)}</b>`, `<span dir="ltr">${esc(u.phone)}</span>`, ar(s.no), dueIn.filter((d) => readState(u, d.n) === 'no').map((d) => ar(d.n)).join('، ')]) : [['<span class="muted">الكل ماشي كويس 👏</span>', '', '', '']], widths: [24, 18, 8, 50] } });
  const chq = chKeys.filter((k) => S.chq[k]?.questions?.length).map((k) => { let a = 0, c = 0, t = 0; S.users.forEach((u) => { const x = u.quiz?.[k]; if (x) { a++; c += x.c || 0; t += x.t || 0; } }); const [b, ch] = k.split('_'); return [`${BOOKS[b]} ${ar(ch)}`, ar(S.chq[k].questions.length), ar(a), `${ar(pc(c, t))}٪ ${bar(pc(c, t))}`]; });
  if (chq.length) B.push({ table: { title: 'أسئلة الأصحاحات «اختبر نفسك»', head: ['الأصحاح', 'عدد الأسئلة', 'جاوبوا', 'نسبة الصح'], rows: chq, widths: [30, 20, 20, 30] } });
  if (ex.length) B.push({ table: { title: 'الامتحانات', head: ['الامتحان', 'الحالة', 'سلّموا', 'المتوسط', 'أعلى درجة', 'الأوائل'],
    rows: ex.map(({ e, res }) => { const t = (e.questions || []).reduce((a, q) => a + qPts(q), 0); const avg = res.length ? res.reduce((a, r) => a + r.score, 0) / res.length : 0;
      return [`<b>${esc(e.title)}</b>`, { draft: 'مسودة', open: 'مفتوح', closed: 'مقفول', published: 'اتعلنت' }[e.status] || e.status, ar(res.length), res.length ? `${ar(avg.toFixed(1))} من ${ar(t)}` : '—', res.length ? `${ar(res[0].score)} من ${ar(t)}` : '—', res.slice(0, 3).map((r) => esc(r.name.split(' ')[0])).join('، ') || '—']; }),
    widths: [24, 11, 9, 16, 15, 25] } });
  if (qIn.length) B.push({ table: { title: 'أسئلة المخدومين للخدام', head: ['الاسم', 'السؤال', 'الحالة'],
    rows: qIn.map((q) => [`<b>${esc(q.name)}</b><br><small>${when(q.at)}</small>`, `${q.ref ? `<small class="ref">${esc(q.ref)}</small><br>` : ''}${esc(q.text)}`, q.status === 'answered' ? `<b class="s-ok">اتردّ</b><br><small>${esc(q.answeredBy || '')}</small>` : '<b class="s-la">مستني</b>']), widths: [22, 60, 18] } });
  return { title: 'تقرير رحلة «لِأَعْرِفَهُ»', sub: `من اليوم ${ar(days[0].n)} (${fmtDate(days[0].date)}) لحد اليوم ${ar(days[days.length - 1].n)} (${fmtDate(days[days.length - 1].date)})`, blocks: B, file: `تقرير-لأعرفه-يوم${days[0].n}-${days[days.length - 1].n}` };
}

async function personBlocks(R) {
  const today = todayCairo(); const u = S.users.find((x) => x.phone === R.who); if (!u) throw new Error('no user'); const days = rangeDays(R); const s = statsIn(u, days, today);
  const [ex, qs] = await Promise.all([examData(), api.listQuestions().catch(() => [])]);
  const mine = ex.map(({ e, res, key, subs }) => ({ e, i: res.findIndex((r) => r.phone === u.phone), res, key, sub: subs.find((x) => x.phone === u.phone) })).filter((x) => x.sub);
  const B = [];
  B.push({ html: `<div class="person"><div><b>${esc(u.name)}</b><span dir="ltr">${esc(u.phone)}</span></div><div class="muted">اشترك ${u.createdAt ? fmtDate(cairoDate(typeof u.createdAt === 'number' ? u.createdAt : (u.createdAt.seconds || 0) * 1000), false) : ''}</div></div>
    <div class="kpis">${[[ar(s.on), 'في معاده'], [ar(s.la), 'متأخر'], [ar(s.no), 'فاته'], [`${ar(s.cons)}٪`, 'الانتظام'], [`${ar(s.done)}٪`, 'قرا من الفترة'],
      [(() => { const q = Object.entries(u.quiz || {}).filter(([k]) => !k.startsWith('game_')).map(([, v]) => v); const c = q.reduce((a, x) => a + (x.c || 0), 0), t = q.reduce((a, x) => a + (x.t || 0), 0); return t ? `${ar(c)}/${ar(t)}` : '—'; })(), 'أسئلة الأصحاحات'],
      [ar(mine.length), 'امتحان دخله'], [ar(S.wall.filter((w) => w.phone === u.phone && w.type === 'verse').length), 'آية شاركها'], [ar(qs.filter((q) => q.phone === u.phone).length), 'سؤال سأله']].map(([v, l]) => `<div class="k"><b>${v}</b><span>${l}</span></div>`).join('')}</div>` });
  B.push({ table: { title: 'القراءة يوم بيوم', head: ['اليوم', 'التاريخ', 'القراءة', 'الحالة', 'سجّل إمتى', 'أسئلة الأصحاح'],
    rows: days.map((d) => { const st = d.date > today ? 'fu' : readState(u, d.n); const keys = [...d.ot.map((c) => `gen_${c}`), ...(d.nt ? [`${d.nt.book}_${d.nt.ch}`] : [])]; const q = keys.map((k) => u.quiz?.[k]).filter(Boolean);
      return [ar(d.n), fmtDate(d.date), `${otLabel(d)}${d.nt ? '، ' + ntLabel(d) : ''}`, ST[st], st === 'ontime' || st === 'late' ? when(u.readAt?.[d.n]) : '—', q.length ? q.map((x) => `${ar(x.c)}/${ar(x.t)}`).join('، ') : '—']; }),
    widths: [7, 16, 30, 12, 20, 15] } });
  mine.forEach(({ e, i, res, key, sub }) => {
    const r = scoreSub(e, key, sub);
    B.push({ table: { title: `امتحان: ${e.title}`, note: `الدرجة ${ar(r.score)} من ${ar(r.total)}${i >= 0 ? `، الترتيب ${ar(i + 1)} من ${ar(res.length)}` : ''}${r.pending ? `، فيه ${ar(r.pending)} مقالي لسه متصححش` : ''}`, head: ['#', 'السؤال', 'إجابته', 'الدرجة'],
      rows: e.questions.map((q, k) => { const g = gradeOne(q, key[k], sub.answers?.[k], sub.grades?.[k]); const a = sub.answers?.[k]; const t = qType(q);
        const at = a == null || a === '' ? '<span class="muted">ماجاوبش</span>' : t === 'mcq' ? esc(q.options[a]) : t === 'tf' ? (a ? 'صح' : 'خطأ') : esc(a);
        return [ar(k + 1), `<small class="muted">${QTYPES[t]}</small><br>${esc(q.q)}`, at, g.pending ? '<b class="s-la">مستني</b>' : `<b class="${g.got === g.max ? 's-ok' : g.got ? 's-la' : 's-no'}">${ar(g.got)}/${ar(g.max)}</b>`]; }), widths: [5, 45, 38, 12] } });
  });
  const myq = qs.filter((q) => q.phone === u.phone);
  if (myq.length) B.push({ table: { title: 'أسئلته للخدام', head: ['إمتى', 'السؤال', 'الحالة'], rows: myq.map((q) => [when(q.at), `${q.ref ? `<small class="ref">${esc(q.ref)}</small><br>` : ''}${esc(q.text)}`, q.status === 'answered' ? '<b class="s-ok">اتردّ</b>' : '<b class="s-la">مستني</b>']), widths: [22, 60, 18] } });
  return { title: `تقرير: ${u.name}`, sub: `من اليوم ${ar(days[0].n)} (${fmtDate(days[0].date)}) لحد اليوم ${ar(days[days.length - 1].n)} (${fmtDate(days[days.length - 1].date)})`, blocks: B, file: `تقرير-${u.name}` };
}

async function examBlocks(R) {
  const e = S.exams.find((x) => x.id === R.exam); if (!e) throw new Error('no exam');
  const [key, subs] = await Promise.all([api.examKey(e.id), api.submissions(e.id)]); const res = buildResults(e, key, subs);
  const total = e.questions.reduce((a, q) => a + qPts(q), 0); const avg = res.length ? res.reduce((a, r) => a + r.score, 0) / res.length : 0;
  const B = [];
  B.push({ html: `<div class="kpis">${[[ar(res.length), 'سلّموا'], [ar(S.users.length - res.length), 'مادخلوش'], [ar(e.questions.length), 'سؤال'], [ar(total), 'الدرجة الكلية'],
    [res.length ? ar(avg.toFixed(1)) : '—', 'المتوسط'], [res.length ? ar(res[0].score) : '—', 'أعلى درجة'], [res.length ? ar(res[res.length - 1].score) : '—', 'أقل درجة'], [ar(res.filter((r) => r.pending).length), 'مستنيين تصحيح']].map(([v, l]) => `<div class="k"><b>${v}</b><span>${l}</span></div>`).join('')}</div>` });
  B.push({ table: { title: 'الترتيب', head: ['#', 'الاسم', 'الموبايل', 'الدرجة', 'النسبة', 'الوقت', 'سلّم إمتى'],
    rows: res.map((r, i) => [ar(i + 1), `<b>${esc(r.name)}</b>${r.pending ? ' <small class="s-la">(فيه مقالي مستني)</small>' : ''}`, `<span dir="ltr">${esc(r.phone)}</span>`, `${ar(r.score)}/${ar(r.total)}`, `${ar(pc(r.score, r.total))}٪ ${bar(pc(r.score, r.total))}`, r.dur ? `${ar(Math.floor(r.dur / 60))}:${ar(String(r.dur % 60).padStart(2, '0'))}` : '—', when(r.at)]), widths: [5, 23, 15, 10, 19, 9, 19] } });
  B.push({ table: { title: 'تحليل الأسئلة', note: 'متوسط الدرجة اللي خدوها في كل سؤال. السؤال اللي نسبته قليلة محتاج شرح في الاجتماع.', head: ['#', 'السؤال', 'النوع', 'متوسط الدرجة', 'تفاصيل'],
    rows: e.questions.map((q, k) => { const t = qType(q); let full = 0, any = 0; const dist = {};
      subs.forEach((s) => { const g = gradeOne(q, key[k], s.answers?.[k], s.grades?.[k]); if (!g.pending) { any += g.max; full += g.got; } const a = s.answers?.[k]; if (t === 'mcq' || t === 'tf') dist[String(a)] = (dist[String(a)] || 0) + 1; });
      const det = t === 'mcq' ? q.options.map((o, j) => `${j === key[k] ? '✓ ' : ''}${esc(o)}: ${ar(dist[String(j)] || 0)}`).join('<br>') : t === 'tf' ? `صح: ${ar(dist.true || 0)}، خطأ: ${ar(dist.false || 0)}` : t === 'fill' ? `الإجابة: ${esc(key[k])}` : `بيتصحح بالإيد${subs.some((x) => gradeOne(q, key[k], x.answers?.[k], x.grades?.[k]).pending) ? '، فيه لسه مستني' : ''}`;
      return [ar(k + 1), esc(q.q), QTYPES[t], `${ar(pc(full, any))}٪ ${bar(pc(full, any), pc(full, any) >= 60 ? '#2E7D6B' : '#C22026')}`, `<small>${det}</small>`]; }), widths: [5, 35, 11, 19, 30] } });
  const missing = S.users.filter((u) => !subs.some((s) => s.phone === u.phone));
  if (missing.length) B.push({ table: { title: `مادخلوش الامتحان (${ar(missing.length)})`, head: ['الاسم', 'الموبايل'], rows: missing.map((u) => [esc(u.name), `<span dir="ltr">${esc(u.phone)}</span>`]), widths: [60, 40] } });
  return { title: `تقرير امتحان: ${e.title}`, sub: e.desc || '', blocks: B, file: `تقرير-${e.title}` };
}

// ---------------------------------------------------------------- layout into A4 pages
const CSS = `.rp-page{width:${W}px;height:${H}px;background:#FFFDF6;position:relative;direction:rtl;font-family:Messiri,sans-serif;color:#1d2a33;box-sizing:border-box;padding:40px 44px 70px;overflow:hidden;display:flex;flex-direction:column}
.rp-page *{box-sizing:border-box}.rp-body{flex:1;min-height:0;overflow:hidden}
.rp-head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #02304A;padding-bottom:12px;margin-bottom:14px}.rp-head img{height:58px}.rp-head .nm{height:40px}
.rp-head .t{flex:1}.rp-head h1{margin:0;font-size:24px;color:#02304A;line-height:1.3}.rp-head p{margin:2px 0 0;font-size:13px;color:#7d6f55}
.rp-mini{display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #EAD9B0;padding-bottom:8px;margin-bottom:12px;font-size:12px;color:#7d6f55}.rp-mini b{color:#02304A;font-size:14px}
.rp-foot{position:absolute;left:44px;right:44px;bottom:26px;display:flex;justify-content:space-between;font-size:11px;color:#9a8a68;border-top:1px solid #EAD9B0;padding-top:8px}
.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px}.k{background:#fff;border:1.5px solid #EAD9B0;border-radius:12px;padding:8px 6px;text-align:center}
.k b{display:block;font-size:20px;color:#02304A;line-height:1.3}.k b small{font-size:11px;color:#7d6f55}.k span{font-size:11px;color:#7d6f55}
.person{display:flex;justify-content:space-between;align-items:center;background:#02304A;color:#FDF3D8;border-radius:14px;padding:12px 16px;margin-bottom:12px}.person b{font-size:22px;margin-left:12px}.person span{font-size:14px;opacity:.8}.person .muted{color:#F2C46D;font-size:12px}
h3.rt{font-size:16px;color:#02304A;margin:12px 0 4px;display:flex;align-items:center;gap:8px}h3.rt:before{content:"";width:6px;height:18px;background:#C22026;border-radius:3px}
p.rn{font-size:11.5px;color:#7d6f55;margin:0 0 6px}
table.rt{width:100%;border-collapse:collapse;font-size:11.5px;table-layout:fixed;margin-bottom:6px}table.rt th{background:#02304A;color:#FDF3D8;font-weight:700;padding:6px 5px;text-align:right}
table.rt th:first-child{border-radius:0 8px 0 0}table.rt th:last-child{border-radius:8px 0 0 0}
table.rt td{padding:5px;border-bottom:1px solid #EFE3C4;vertical-align:middle;line-height:1.45;word-wrap:break-word}table.rt tr:nth-child(even) td{background:#FBF4E2}
.rbar{display:inline-block;width:52px;height:6px;border-radius:4px;background:#EFE3C4;vertical-align:middle;margin-right:4px;overflow:hidden}.rbar i{display:block;height:100%;border-radius:4px}
.s-ok{color:#2E7D6B}.s-la{color:#B07A1E}.s-no{color:#C22026}.s-fu,.muted{color:#a8997a}.ref{color:#8a6a2c}`;

function pageShell(doc, first) {
  const p = document.createElement('div'); p.className = 'rp-page';
  p.innerHTML = (first ? `<div class="rp-head"><img src="assets/img/emblem.png"><img class="nm" src="assets/img/name.png"><div class="t"><h1>${esc(doc.title)}</h1><p>${esc(doc.sub)}</p></div><img src="assets/img/family.png"></div>`
    : `<div class="rp-mini"><b>${esc(doc.title)}</b><span>${esc(doc.sub)}</span></div>`) + '<div class="rp-body"></div><div class="rp-foot"><span>لأعرفه، أسرة القوي الأنبا موسى للجامعيين، كنيسة السيدة العذراء مريم بمدينة السادات</span><span class="pn"></span></div>';
  return p;
}
function layout(doc, holder) {
  const pages = []; let page, body;
  const newPage = () => { page = pageShell(doc, !pages.length); holder.appendChild(page); pages.push(page); body = page.querySelector('.rp-body'); };
  const over = () => body.scrollHeight > body.clientHeight + 1;
  newPage();
  for (const b of doc.blocks) {
    if (b.html) { const d = document.createElement('div'); d.innerHTML = b.html; body.appendChild(d); if (over() && body.children.length > 1) { d.remove(); newPage(); body.appendChild(d); } continue; }
    const t = b.table; let cont = false;
    const startTable = () => {
      const w = document.createElement('div'); w.innerHTML = `<h3 class="rt">${esc(t.title)}${cont ? ' (تابع)' : ''}</h3>${t.note && !cont ? `<p class="rn">${esc(t.note)}</p>` : ''}<table class="rt"><colgroup>${t.widths.map((x) => `<col style="width:${x}%">`).join('')}</colgroup><thead><tr>${t.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody></tbody></table>`;
      body.appendChild(w); return w;
    };
    let w = startTable(); if (over() && body.children.length > 1) { w.remove(); newPage(); w = startTable(); }
    let tb = w.querySelector('tbody'); let added = 0;
    for (const r of t.rows) {
      const tr = document.createElement('tr'); tr.innerHTML = r.map((c) => `<td>${c}</td>`).join(''); tb.appendChild(tr);
      if (over()) { tr.remove(); if (!added) w.remove(); newPage(); cont = added > 0; w = startTable(); tb = w.querySelector('tbody'); tb.appendChild(tr); added = 0; }
      added++;
    }
  }
  pages.forEach((p, i) => { p.querySelector('.pn').textContent = `صفحة ${ar(i + 1)} من ${ar(pages.length)}`; });
  return pages;
}

const loadScript = (src) => new Promise((ok, no) => { if ([...document.scripts].some((s) => s.src.endsWith(src))) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

async function makeReport(R) {
  const doc = await (R.kind === 'person' ? personBlocks(R) : R.kind === 'exam' ? examBlocks(R) : allBlocks(R));
  doc.sub = `${doc.sub}${doc.sub ? '، ' : ''}اتعمل ${when(Date.now())}`;
  await Promise.all([loadScript('js/vendor/html-to-image.js'), loadScript('js/vendor/jspdf.umd.min.js'), document.fonts.ready]);
  const holder = document.createElement('div'); holder.style.cssText = 'position:fixed;left:-20000px;top:0;z-index:-1';
  holder.innerHTML = `<style>${CSS}</style>`; document.body.appendChild(holder);
  const pages = layout(doc, holder);
  await Promise.all([...holder.querySelectorAll('img')].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  const imgs = [];
  for (const p of pages) imgs.push(await window.htmlToImage.toJpeg(p, { quality: 0.92, pixelRatio: 2, width: W, height: H, backgroundColor: '#FFFDF6', cacheBust: false }));
  holder.remove();
  const pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  imgs.forEach((src, i) => { if (i) pdf.addPage(); pdf.addImage(src, 'JPEG', 0, 0, 210, 297, undefined, 'FAST'); });
  const name = `${doc.file}.pdf`.replace(/[\\/:*?"<>|]/g, '-');
  const blob = pdf.output('blob');
  preview(imgs, blob, name);
}

function preview(imgs, blob, name) {
  const m = document.createElement('div'); m.className = 'modal rprev';
  const file = new File([blob], name, { type: 'application/pdf' });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  m.innerHTML = `<div class="box"><div class="between"><h2>التقرير جاهز 📄</h2><span class="muted">${ar(imgs.length)} ${imgs.length > 2 && imgs.length < 11 ? 'صفحات' : 'صفحة'}</span></div>
    <div class="rpages">${imgs.map((s) => `<img src="${s}" alt="">`).join('')}</div>
    <div class="actions"><button class="btn red" id="rdl">⬇️ نزّل PDF</button>${canShare ? '<button class="btn primary" id="rsh">ابعته</button>' : ''}<button class="btn ghost" id="rcl">قفل</button></div></div>`;
  document.body.appendChild(m);
  const url = URL.createObjectURL(blob);
  $('#rdl', m).onclick = () => { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
  $('#rsh', m) && ($('#rsh', m).onclick = () => navigator.share({ files: [file], title: name }).catch(() => {}));
  const close = () => { URL.revokeObjectURL(url); m.remove(); };
  $('#rcl', m).onclick = close; m.onclick = (e) => { if (e.target === m) close(); };
}
