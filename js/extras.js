// اختيار آية من الكتاب، وأسئلة المخدومين للخدام
import { DAYS, BOOKS, ar, dueDays, passages } from './plan.js';
import { api } from './data.js';
import { $, $$, esc, S, toast, loadText, timeAgo, burst } from './ui.js';

export const bookName = (b) => (b === 'gen' ? 'تكوين' : BOOKS[b]);
export const refOf = (b, ch, from, to) => `${bookName(b)} ${ar(ch)}: ${ar(from)}${to > from ? '-' + ar(to) : ''}`;
const MAXV = 5;

function defaultPassage() {
  const d = dueDays().slice(-1)[0] || DAYS[0]; const p = passages(d)[0]; return { book: p.book, ch: p.ch };
}

// verse picker: book → chapter → from → to, with the text filled automatically
export async function versePicker(host, init = {}, { optional = false, keep = null } = {}) {
  const T = await loadText(); const books = Object.keys(BOOKS).filter((b) => T[b]);
  const st = keep && keep.book ? keep : Object.assign(keep || {}, { ...defaultPassage(), from: 1, to: 1, ...init, on: !optional || !!init.book });
  const draw = () => {
    const chs = Object.keys(T[st.book]).length; st.ch = Math.min(st.ch, chs);
    const vs = T[st.book][st.ch]; st.from = Math.min(st.from, vs.length); st.to = Math.min(Math.max(st.to, st.from), st.from + MAXV - 1, vs.length);
    const opt = (n, sel, start = 1) => Array.from({ length: n - start + 1 }, (_, i) => i + start).map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${ar(k)}</option>`).join('');
    host.innerHTML = `${optional ? `<label class="vp-toggle"><input type="checkbox" id="vpOn" ${st.on ? 'checked' : ''}> السؤال عن آية معينة</label>` : ''}
      <div class="vp" ${st.on ? '' : 'hidden'}>
        <div class="vp-row"><label><span>السفر</span><select data-k="book">${books.map((b) => `<option value="${b}" ${b === st.book ? 'selected' : ''}>${BOOKS[b]}</option>`).join('')}</select></label>
        <label><span>الأصحاح</span><select data-k="ch">${opt(chs, st.ch)}</select></label></div>
        <div class="vp-row"><label><span>من آية</span><select data-k="from">${opt(vs.length, st.from)}</select></label>
        <label><span>لحد آية</span><select data-k="to">${opt(Math.min(vs.length, st.from + MAXV - 1), st.to, st.from)}</select></label></div>
        <blockquote class="vp-text"><p>«${esc(vs.slice(st.from - 1, st.to).join(' '))}»</p><cite>${refOf(st.book, st.ch, st.from, st.to)}</cite></blockquote>
      </div>`;
    $$('select', host).forEach((s) => s.onchange = () => {
      const k = s.dataset.k; st[k] = k === 'book' ? s.value : +s.value;
      if (k === 'book') { st.ch = 1; st.from = 1; st.to = 1; } if (k === 'ch') { st.from = 1; st.to = 1; } if (k === 'from') st.to = st.from;
      draw();
    });
    const t = $('#vpOn', host); if (t) t.onchange = () => { st.on = t.checked; draw(); };
  };
  draw();
  return () => {
    if (!st.on) return null; const vs = T[st.book][st.ch];
    return { book: st.book, ch: st.ch, from: st.from, to: st.to, text: vs.slice(st.from - 1, st.to).join(' '), ref: refOf(st.book, st.ch, st.from, st.to) };
  };
}

// ask the servants: a question or an explanation of a verse; answered on WhatsApp
export async function askModal(pre) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box ask-box"><h2>❓ اسأل الخدام</h2><p class="sub">عندك سؤال، أو محتاج تفسير لآية؟ اكتبه هنا، وواحد من الخدام هيرد عليك على الواتساب على رقمك <b dir="ltr">${esc(S.me.phone)}</b>.</p>
    ${pre ? `<blockquote class="vp-text"><p>«${esc(pre.text.length > 260 ? pre.text.slice(0, 260) + '…' : pre.text)}»</p><cite>${esc(pre.ref)}</cite></blockquote>` : '<div id="apick"></div>'}
    <textarea class="inp" id="aq" maxlength="600" placeholder="${pre ? 'إيه اللي محتاج تفهمه في الآية دي؟' : 'اكتب سؤالك…'}"></textarea>
    <div class="actions"><button class="btn red" id="asend">ابعت السؤال</button><button class="btn ghost" id="acl">إلغاء</button></div></div>`;
  document.body.appendChild(m); const close = () => m.remove();
  m.onclick = (e) => { if (e.target === m) close(); }; $('#acl', m).onclick = close;
  const get = pre ? () => pre : await versePicker($('#apick', m), {}, { optional: true });
  setTimeout(() => $('#aq', m)?.focus(), 50);
  $('#asend', m).onclick = async () => {
    const t = $('#aq', m).value.trim(); const v = get();
    if (t.length < 3 && !v) return toast('اكتب سؤالك الأول 🙂');
    $('#asend', m).disabled = true;
    const ok = await api.ask(t || 'محتاج تفسير للآية دي', v?.ref || '', v?.text || '');
    if (!ok) { $('#asend', m).disabled = false; return toast('مقدرناش نبعت السؤال، جرّب تاني'); }
    close(); toast('سؤالك وصل للخدام 🙏 هيردّوا عليك على الواتساب'); burst(innerWidth / 2, innerHeight / 2, 50);
  };
}

// share a verse: picker in its own sheet, so the wall itself stays light
export async function verseModal() {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box ask-box"><h2>✨ شارك آية لمستك</h2><div id="vmp"><p class="muted" style="text-align:center">بيحمّل الكتاب…</p></div>
    <input class="inp" id="vmn" maxlength="200" placeholder="ليه لمستك؟ (اختياري)" style="margin-top:10px">
    <div class="actions"><button class="btn primary" id="vms">شارك ✨</button><button class="btn ghost" id="vmc">إلغاء</button></div></div>`;
  document.body.appendChild(m); const close = () => m.remove(); m.onclick = (e) => { if (e.target === m) close(); }; $('#vmc', m).onclick = close;
  let get = null; try { get = await versePicker($('#vmp', m), {}, { keep: (S.vpWall = S.vpWall || {}) }); } catch (e) { $('#vmp', m).innerHTML = '<p class="muted">مقدرناش نحمّل الكتاب، جرّب تاني.</p>'; }
  $('#vms', m).onclick = async () => {
    const v = get && get(); if (!v || !v.text) return toast('اختار الآية الأول 🙂');
    $('#vms', m).disabled = true; await api.post('verse', v.text, v.ref, $('#vmn', m).value.trim()); close(); toast('اتشاركت ✨'); burst(innerWidth / 2, innerHeight / 2, 50);
  };
}

// "my questions" list for the participant
export function myQuestionsHTML(list) {
  if (!list || !list.length) return '<p class="muted" style="text-align:center;margin:10px 0 0">لسه مسألتش أي سؤال.</p>';
  return list.sort((a, b) => b.at - a.at).map((q) => `<article class="card myq ${q.status}">
    <div class="between"><span class="tag ${q.status === 'answered' ? 'ok' : 'late'}">${q.status === 'answered' ? '✓ اتردّ عليه' : '⏳ مستني الرد'}</span><small class="muted">${timeAgo(q.at)}</small></div>
    ${q.ref ? `<p class="ref" style="margin-top:8px">${esc(q.ref)}</p>` : ''}<p class="txt">${esc(q.text)}</p>
    ${q.status === 'answered' ? `<small class="muted">ردّ عليك ${esc(q.answeredBy || 'واحد من الخدام')} على الواتساب${q.answeredAt ? '، ' + timeAgo(q.answeredAt) : ''}</small>` : '<small class="muted">هيوصلك الرد على الواتساب</small>'}</article>`).join('');
}

