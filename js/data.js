// طبقة البيانات: Firebase لو الإعدادات موجودة، وإلا وضع تجريبي على الجهاز
import { firebaseConfig } from './firebase-config.js';
import { DAYS, todayCairo, dueDays, passages } from './plan.js';

const listeners = { users: new Set(), wall: new Set(), days: new Set(), chq: new Set(), exams: new Set(), myq: new Set() };
const emit = (k, v) => listeners[k].forEach((f) => { try { f(v); } catch (e) { console.error(e); } });
const ck = {
  get(k) { try { const m = document.cookie.match(new RegExp('(?:^|; )la3rafo_' + k + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; } catch (e) { return null; } },
  set(k, v) { try { document.cookie = `la3rafo_${k}=${encodeURIComponent(v)}; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax`; } catch (e) { /* ignore */ } },
  del(k) { try { document.cookie = `la3rafo_${k}=; max-age=0; path=/`; } catch (e) { /* ignore */ } },
};
const KEEP = ['me', 'myName'];
export const store = {
  get(k, d) {
    try { const v = localStorage.getItem('la3rafo:' + k); if (v) return JSON.parse(v); } catch (e) { /* ignore */ }
    if (KEEP.includes(k)) { const c = ck.get(k); if (c) { try { return JSON.parse(c); } catch (e) { return c; } } }
    return d;
  },
  set(k, v) { try { localStorage.setItem('la3rafo:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } if (KEEP.includes(k)) ck.set(k, JSON.stringify(v)); },
  del(k) { try { localStorage.removeItem('la3rafo:' + k); } catch (e) { /* ignore */ } if (KEEP.includes(k)) ck.del(k); },
};
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ignore */ }
export const normPhone = (p) => String(p || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, '').replace(/^(20|0020)/, '0');
export const validPhone = (p) => /^01[0125]\d{8}$/.test(normPhone(p));
const ms = (v) => (v && v.toMillis ? v.toMillis() : (typeof v === 'number' ? v : (v && v.seconds ? v.seconds * 1000 : null)));
// ---- قفل الأيام اللي معادها لسه مجاش ----
const DATE_OF = Object.fromEntries(DAYS.map((d) => [d.n, d.date]));
const CH_DATE = {}; DAYS.forEach((d) => passages(d).forEach((p) => { const k = `${p.book}_${p.ch}`; if (!CH_DATE[k] || d.date < CH_DATE[k]) CH_DATE[k] = d.date; }));
const fmtC = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayOfMs = (t) => fmtC.format(new Date(t));
// demo with ?date= : stamp actions on the simulated day, not the real clock
const nowSim = () => { const t = todayCairo(); return dayOfMs(Date.now()) === t ? Date.now() : Date.parse(t + 'T10:00:00Z'); };
export const isFutureDay = (n, today = todayCairo()) => !DATE_OF[n] || DATE_OF[n] > today;
// a record doesn't count if its day hasn't come yet, or it was stamped before its own day
function badEntries(u, today = todayCairo()) {
  const early = (t, date) => { const m = ms(t); return !!(m && dayOfMs(m) < date); };
  const ra = u.readAt || {};
  const days = (u.readDays || []).filter((n) => isFutureDay(n, today) || early(ra[n], DATE_OF[n]));
  const at = Object.keys(ra).filter((k) => isFutureDay(+k, today) || early(ra[k], DATE_OF[+k]));
  const quiz = Object.entries(u.quiz || {}).filter(([k, v]) => {
    // games and quizzes are stamped by the phone's clock, so only the day itself decides
    if (k.startsWith('game_')) return isFutureDay(+k.slice(5), today);
    const dt = CH_DATE[k]; return !!dt && dt > today;
  }).map(([k]) => k);
  return { days, at, quiz, any: days.length + at.length + quiz.length > 0 };
}
function normUser(u) {
  const b = badEntries(u); const bad = new Set(b.days); const badAt = new Set(b.at); const badQ = new Set(b.quiz);
  const ra = {}; Object.entries(u.readAt || {}).forEach(([k, v]) => { const m = ms(v); if (m && !badAt.has(k)) ra[k] = m; });
  const quiz = {}; Object.entries(u.quiz || {}).forEach(([k, v]) => { if (!badQ.has(k)) quiz[k] = v; });
  return { ...u, readAt: ra, readDays: (u.readDays || []).filter((n) => !bad.has(n)), quiz };
}
// ---- exams: 4 question types (mcq / tf / fill / essay)
export const QTYPES = { mcq: 'اختياري', tf: 'صح وخطأ', fill: 'أكمل', essay: 'مقالي' };
// normalize Arabic for comparing "fill the blank" answers
export function normAr(t) {
  return String(t ?? '').replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/^(ال)(?=\S{3,})/g, '').replace(/\s+/g, ' ').trim();
}
const accepted = (k) => String(k ?? '').split(/[\/،,|]| او /).map(normAr).filter(Boolean).map((x) => x.replace(/^ال(?=\S{3,})/, ''));
export const qPts = (q) => Math.max(1, +(q && q.pts) || 1);
export const qType = (q) => (q && q.type) || 'mcq';
// one question → { got, max, auto: true when graded automatically, pending: essay not graded yet }
export function gradeOne(q, k, a, g) {
  const max = qPts(q); const t = qType(q);
  if (g != null && g !== '') return { got: Math.min(max, Math.max(0, +g)), max, auto: false, pending: false };
  if (a == null || a === '') return { got: 0, max, auto: true, pending: false };
  if (t === 'essay') return { got: 0, max, auto: false, pending: true };
  if (t === 'fill') { const x = normAr(a).replace(/^ال(?=\S{3,})/, ''); return { got: accepted(k).includes(x) ? max : 0, max, auto: true, pending: false }; }
  return { got: a === k ? max : 0, max, auto: true, pending: false };
}
export function scoreSub(exam, key, sub) {
  const Q = exam.questions || []; let score = 0, total = 0, pending = 0;
  Q.forEach((q, i) => { const r = gradeOne(q, key[i], sub.answers && sub.answers[i], sub.grades && sub.grades[i]); score += r.got; total += r.max; if (r.pending) pending++; });
  return { score, total, pending };
}
export function scoreExam(key, answers, exam) { return scoreSub(exam || { questions: (key || []).map(() => ({})) }, key || [], { answers }).score; }
export function buildResults(exam, key, subs) {
  return subs.map((s) => { const r = scoreSub(exam, key, s); return { name: s.name, phone: s.phone, score: r.score, total: r.total, pending: r.pending, dur: s.dur || 0, at: ms(s.at) || 0 }; })
    .sort((a, b) => b.score - a.score || a.dur - b.dur || a.at - b.at);
}
// reactions on «آيات لمستنا» posts — each one is a Bible phrase
export const REACTS = [
  { k: 'amen', e: '🙏', t: 'آمين', v: '«آمِينَ. تَعَالَ أَيُّهَا الرَّبُّ يَسُوعُ» (رؤ ٢٢: ٢٠)' },
  { k: 'love', e: '❤️', t: 'لمستني', v: '«مَا أَحْلَى قَوْلَكَ لِحَنَكِي» (مز ١١٩: ١٠٣)' },
  { k: 'fire', e: '🔥', t: 'ألهبت قلبي', v: '«أَلَمْ يَكُنْ قَلْبُنَا مُلْتَهِبًا فِينَا» (لو ٢٤: ٣٢)' },
  { k: 'light', e: '💡', t: 'نوّرتني', v: '«سِرَاجٌ لِرِجْلِي كَلَامُكَ وَنُورٌ لِسَبِيلِي» (مز ١١٩: ١٠٥)' },
  { k: 'strong', e: '💪', t: 'قوّتني', v: '«أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِّينِي» (في ٤: ١٣)' },
  { k: 'tears', e: '😢', t: 'بكّتتني', v: '«فَلَمَّا سَمِعُوا نُخِسُوا فِي قُلُوبِهِمْ» (أع ٢: ٣٧)' },
];
export const initialOf = (n) => { const c = String(n || '').trim()[0]; return c ? c + '.' : '؟'; };

let impl = null;
export let mode = 'demo';

// ------------------------------------------------------------------ DEMO
function demoImpl() {
  const K = 'demo3_';
  const memo = { users: store.get(K + 'users', null), wall: store.get(K + 'wall', null), days: store.get(K + 'days', {}), chq: store.get(K + 'chq', {}), exams: store.get(K + 'exams', []), keys: store.get(K + 'keys', {}), subs: store.get(K + 'subs', []), qs: store.get(K + 'qs', null), bonus: store.get(K + 'bonus', {}) };
  if (!memo.users) {
    const names = ['مينا عادل', 'مارينا سمير', 'كيرلس ناجي', 'مريم هاني', 'أبانوب رأفت', 'فادي جرجس', 'كاترين عماد', 'يوستينا مجدي', 'جورج صبحي', 'ماريان فايز', 'مايكل نبيل', 'ساندرا رامي', 'أندرو ماهر', 'ميرنا أشرف', 'شنودة فكري', 'فيرينا وجيه', 'بولا إسحق', 'ديفيد عاطف'];
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const due = dueDays(); const tdy = todayCairo();
    memo.users = names.map((name, i) => {
      const skill = 0.5 + rnd() * 0.5; const readDays = []; const readAt = {};
      due.forEach((d) => {
        if (d.date === tdy ? rnd() < 0.55 : rnd() < skill) {
          readDays.push(d.n); const late = d.date !== tdy && rnd() < 0.22;
          readAt[d.n] = new Date(d.date + 'T' + (late ? '12' : '19') + ':00:00Z').getTime() + (late ? 864e5 * (1 + Math.floor(rnd() * 3)) : 0);
        }
      });
      return { phone: '0100000' + String(1000 + i), name, readDays, readAt, quiz: rnd() < .6 ? { gen_1: { c: rnd() < .5 ? 3 : 2, t: 3 } } : {}, createdAt: Date.now() - 864e5 * 2 };
    });
    memo.wall = [
      { id: 'w1', type: 'verse', name: 'مارينا سمير', phone: '01000001001', text: 'فِي الْبَدْءِ خَلَقَ اللهُ السَّمَاوَاتِ وَالأَرْضَ', ref: 'تكوين ١: ١', at: Date.now() - 36e5 * 20, prayed: 0 },
      { id: 'w2', type: 'verse', name: 'كيرلس ناجي', phone: '01000001002', text: 'اِحْسِبُوهُ كُلَّ فَرَحٍ يَا إِخْوَتِي حِينَمَا تَقَعُونَ فِي تَجَارِبَ مُتَنَوِّعَةٍ', ref: 'يعقوب ١: ٢', at: Date.now() - 36e5 * 9, prayed: 0 },
      { id: 'w3', type: 'prayer', name: 'م.', phone: '', uid: 'demo-01000001003', text: 'صلّوا عشان امتحانات الميدترم الأسبوع الجاي', at: Date.now() - 36e5 * 5, prayed: 7 },
    ];
    memo.days = { 1: { reflection: 'ربنا بيبدأ بالنور. قبل ما يخلق أي حاجة قال «ليكن نور». يمكن النهارده عندك حاجة ضلمة… اديها لربنا يقول فيها «ليكن نور».', question: 'إيه الحاجة اللي محتاج ربنا يقول فيها «ليكن نور» النهارده؟' } };
    memo.chq = {
      gen_1: { questions: [
        { q: 'إيه أول حاجة قال الله «ليكن»؟', options: ['الجَلَد', 'النور', 'الأرض', 'الإنسان'], answer: 1, explain: '«وَقَالَ اللهُ: لِيَكُنْ نُورٌ، فَكَانَ نُورٌ» (تك ١: ٣)' },
        { q: 'في أنهي يوم خلق الله الإنسان؟', options: ['الرابع', 'الخامس', 'السادس', 'السابع'], answer: 2, explain: 'اليوم السادس (تك ١: ٢٧–٣١)' },
        { q: 'خلق الله الإنسان على…', options: ['صورته', 'صورة الملائكة', 'صورة الحيوان', 'مفيش إجابة صح'], answer: 0, explain: '«فَخَلَقَ اللهُ الإِنْسَانَ عَلَى صُورَتِهِ» (تك ١: ٢٧)' },
      ] },
      jas_1: { questions: [
        { q: 'يعقوب بيقول نحسب التجارب كلها…', options: ['حزن', 'فرح', 'عقاب', 'صدفة'], answer: 1, explain: '«اِحْسِبُوهُ كُلَّ فَرَحٍ يَا إِخْوَتِي» (يع ١: ٢)' },
        { q: 'لو حد محتاج حكمة يعمل إيه؟', options: ['يسأل صحابه', 'يطلب من الله', 'يقرا كتب', 'يستنى'], answer: 1, explain: '«فَلْيَطْلُبْ مِنَ اللهِ الَّذِي يُعْطِي الْجَمِيعَ بِسَخَاءٍ» (يع ١: ٥)' },
      ] },
    };
    memo.exams = [{ id: 'ex1', title: 'امتحان الأسبوع الأول', desc: 'التكوين ١ – ٦ ورسالة يعقوب', status: 'open', questions: [
      { q: 'مين قتل هابيل؟', options: ['قايين', 'شيث', 'آدم', 'نوح'] },
      { q: 'كام يوم استمر الطوفان على الأرض؟', options: ['٧ أيام', '٤٠ يومًا', '١٠٠ يوم', 'سنة'] },
      { q: 'يعقوب بيقول الإيمان بدون أعمال…', options: ['قوي', 'ميت', 'كافي', 'مخفي'] },
    ], results: [], createdAt: Date.now() - 864e5 }];
    memo.keys = { ex1: [0, 1, 1] };
    save();
  }
  if (!memo.qs) {
    memo.qs = [
      { id: 'q1', phone: '01000001002', name: 'كيرلس ناجي', uid: 'demo-01000001002', ref: 'تكوين ٦: ٢', verse: 'أَنَّ أَبْنَاءَ اللهِ رَأَوْا بَنَاتِ النَّاسِ أَنَّهُنَّ حَسَنَاتٌ', text: 'مين هما «أبناء الله» و«بنات الناس» هنا؟', status: 'new', at: Date.now() - 36e5 * 3 },
      { id: 'q2', phone: '01000001005', name: 'فادي جرجس', uid: 'demo-01000001005', ref: '', verse: '', text: 'إزاي قايين خاف إن حد يقتله وهما كانوا عيلة واحدة بس؟', status: 'answered', answeredBy: 'بيشوي', answeredAt: Date.now() - 36e5 * 20, at: Date.now() - 36e5 * 30 },
    ]; save();
  }
  function save() { Object.entries({ users: memo.users, wall: memo.wall, days: memo.days, chq: memo.chq, exams: memo.exams, keys: memo.keys, subs: memo.subs, qs: memo.qs, bonus: memo.bonus }).forEach(([k, v]) => store.set(K + k, v)); }
  const me = () => memo.users.find((u) => u.phone === store.get('me', null));
  const myUid = () => 'demo-' + (store.get('me', '') || '');
  const all = () => { emit('users', memo.users.map(normUser)); emit('wall', memo.wall); emit('days', memo.days); emit('chq', memo.chq); emit('exams', memo.exams); emit('myq', (memo.qs || []).filter((q) => q.uid === myUid())); };
  return {
    async init() { setTimeout(all, 0); return me() ? normUser(me()) : null; },
    async login(name, phone) {
      let u = memo.users.find((x) => x.phone === phone);
      if (!u) { u = { phone, name, readDays: [], readAt: {}, quiz: {}, createdAt: Date.now() }; memo.users.push(u); } else u.name = name;
      store.set('me', phone); save(); all(); return normUser(u);
    },
    async logout() { store.del('me'); },
    async setRead(n, on) {
      if (on && isFutureDay(n)) throw new Error('future');
      const u = me(); if (!u) return; const s = new Set(u.readDays);
      on ? s.add(n) : s.delete(n); u.readDays = [...s].sort((a, b) => a - b);
      u.readAt = { ...(u.readAt || {}), [n]: nowSim() }; save(); all();
    },
    async answerChq(key, c, t) { if ((CH_DATE[key] || '') > todayCairo()) return; const u = me(); u.quiz = { ...(u.quiz || {}), [key]: { c, t, at: nowSim() } }; save(); all(); },
    async purgeFuture() { let n = 0; memo.users.forEach((u) => { const b = badEntries(u); if (!b.any) return; n++; u.readDays = (u.readDays || []).filter((x) => !b.days.includes(x)); b.at.forEach((k) => { delete u.readAt[k]; }); b.quiz.forEach((k) => { delete u.quiz[k]; }); }); if (n) { save(); all(); } return n; },
    async resetGame(phone, n) { const u = memo.users.find((x) => x.phone === phone); if (u && u.quiz) { delete u.quiz[`game_${n}`]; save(); all(); } return true; },
    async saveGame(n, c, t, d) { const u = me(); const k = `game_${n}`; if ((u.quiz || {})[k]) return false; u.quiz = { ...(u.quiz || {}), [k]: { c, t, d, at: nowSim() } }; save(); all(); return true; },
    myUid,
    async post(type, text, ref, note) { const u = me(); const anon = type === 'prayer'; memo.wall.push({ id: 'w' + Date.now(), type, text, ref: ref || '', note: note || '', name: anon ? initialOf(u.name) : u.name, phone: anon ? '' : u.phone, uid: myUid(), at: Date.now(), prayed: 0 }); save(); all(); },
    async pray(id) { const w = memo.wall.find((x) => x.id === id); if (w) { w.prayed = (w.prayed || 0) + 1; save(); all(); } },
    async react(id, k) { const w = memo.wall.find((x) => x.id === id); if (!w) return true; const r = { ...(w.reacts || {}) }; const u = myUid(); if (!k) delete r[u]; else r[u] = { t: k, n: me().name }; w.reacts = r; save(); all(); return true; },
    async removePost(id) { memo.wall = memo.wall.filter((x) => x.id !== id); save(); all(); },
    async isServant() { return !!store.get('servant', false); },
    async unlock(code) { if (code === (store.get('demo_code', '2026'))) { store.set('servant', true); return true; } return false; },
    async setCode(code) { store.set('demo_code', code); store.set('servant', true); return true; },
    async saveDay(n, data) { memo.days[n] = { ...(memo.days[n] || {}), ...data }; save(); all(); },
    async saveChq(key, questions) { if (questions.length) memo.chq[key] = { questions }; else delete memo.chq[key]; save(); all(); },
    async saveExam(ex, key) {
      const id = ex.id || 'ex' + Date.now(); const i = memo.exams.findIndex((x) => x.id === id);
      const doc = { ...(i >= 0 ? memo.exams[i] : { results: [], createdAt: Date.now(), status: 'draft' }), ...ex, id };
      i >= 0 ? (memo.exams[i] = doc) : memo.exams.push(doc); if (key) memo.keys[id] = key; save(); all(); return id;
    },
    async deleteExam(id) { memo.exams = memo.exams.filter((x) => x.id !== id); delete memo.keys[id]; memo.subs = memo.subs.filter((s) => s.examId !== id); save(); all(); },
    async examKey(id) { return memo.keys[id] || []; },
    async submitExam(id, answers, dur) { const u = me(); if (memo.subs.some((s) => s.examId === id && s.phone === u.phone)) return false; memo.subs.push({ examId: id, phone: u.phone, name: u.name, answers, dur, at: Date.now() }); save(); return true; },
    async mySubmission(id) { const u = me(); return memo.subs.find((s) => s.examId === id && s.phone === u?.phone) || null; },
    async submissions(id) { return memo.subs.filter((s) => s.examId === id); },
    async gradeSubmission(id, phone, grades) { const s = memo.subs.find((x) => x.examId === id && x.phone === phone); if (s) { s.grades = grades; save(); } return true; },
    async ask(text, ref, verse) { const u = me(); memo.qs.unshift({ id: 'q' + Date.now(), phone: u.phone, name: u.name, uid: myUid(), text, ref: ref || '', verse: verse || '', status: 'new', at: Date.now() }); save(); all(); return true; },
    async listQuestions() { return [...memo.qs].sort((a, b) => b.at - a.at); },
    async listBonus() { return { ...(memo.bonus || {}) }; },
    async setBonus(phone, b) { memo.bonus = { ...(memo.bonus || {}), [phone]: { ...b, at: Date.now() } }; save(); return true; },
    async markAnswered(id, by, on = true) { const q = memo.qs.find((x) => x.id === id); if (q) { q.status = on ? 'answered' : 'new'; q.answeredBy = on ? by : ''; q.answeredAt = on ? Date.now() : null; save(); all(); } return true; },
  };
}

// ------------------------------------------------------------------ FIREBASE
async function firebaseImpl() {
  const V = '10.12.2';
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.initializeFirestore(app, { localCache: F.persistentLocalCache() });
  await A.setPersistence(auth, A.browserLocalPersistence);
  if (typeof auth.authStateReady === 'function') await auth.authStateReady(); else await new Promise((ok) => { const u = A.onAuthStateChanged(auth, () => { u(); ok(); }); });
  const cred = auth.currentUser ? { user: auth.currentUser } : await A.signInAnonymously(auth);
  const uid = cred.user.uid;
  let users = []; let myPhone = store.get('me', null);
  let rawUsers = []; let amServant = false; const purged = new Set();
  // wipe records of days that haven't come yet: each person cleans their own doc, a servant cleans everyone
  async function purgeRaw(list, force) {
    let n = 0;
    for (const u of list) {
      const b = badEntries(u); if (!b.any) continue;
      if (!(u.phone === myPhone || amServant)) continue;
      if (!force && purged.has(u.phone)) continue; purged.add(u.phone);
      const upd = {}; if (b.days.length) upd.readDays = F.arrayRemove(...b.days);
      b.at.forEach((k) => { upd[`readAt.${k}`] = F.deleteField(); }); b.quiz.forEach((k) => { upd[`quiz.${k}`] = F.deleteField(); });
      try { await F.updateDoc(F.doc(db, 'users', u.phone), upd); n++; } catch (e) { console.warn('purge', u.phone, e); }
    }
    return n;
  }
  const subs = [];
  function startSubs() {
    if (subs.length) return;
    subs.push(F.onSnapshot(F.collection(db, 'users'), (s) => { rawUsers = s.docs.map((d) => ({ phone: d.id, ...d.data() })); users = rawUsers.map(normUser); emit('users', users); purgeRaw(rawUsers, false); }));
    subs.push(F.onSnapshot(F.query(F.collection(db, 'wall'), F.orderBy('at', 'desc'), F.limit(150)), (s) => {
      emit('wall', s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: ms(x.at) || Date.now() }; }));
    }));
    subs.push(F.onSnapshot(F.collection(db, 'days'), (s) => { const m = {}; s.docs.forEach((d) => { m[d.id] = d.data(); }); emit('days', m); }));
    subs.push(F.onSnapshot(F.collection(db, 'chq'), (s) => { const m = {}; s.docs.forEach((d) => { m[d.id] = d.data(); }); emit('chq', m); }));
    subs.push(F.onSnapshot(F.collection(db, 'exams'), (s) => { emit('exams', s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, createdAt: ms(x.createdAt) || 0 }; })); }));
    subs.push(F.onSnapshot(F.query(F.collection(db, 'questions'), F.where('uid', '==', uid)), (s) => { emit('myq', s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: ms(x.at) || Date.now(), answeredAt: ms(x.answeredAt) }; })); }, () => emit('myq', [])));
  }
  const me = () => users.find((u) => u.phone === myPhone) || (myPhone ? normUser({ phone: myPhone, name: store.get('myName', '') }) : null);
  return {
    async init() {
      if (!myPhone) {
        try {
          const q = await F.getDocs(F.query(F.collection(db, 'users'), F.where('uids', 'array-contains', uid), F.limit(1)));
          if (!q.empty) { const u = q.docs[0].data(); myPhone = q.docs[0].id; store.set('me', myPhone); store.set('myName', u.name); }
        } catch (e) { console.warn(e); }
      }
      if (myPhone) startSubs(); return myPhone ? me() : null;
    },
    async login(name, phone) {
      const ref = F.doc(db, 'users', phone); const snap = await F.getDoc(ref);
      if (snap.exists()) await F.updateDoc(ref, { name, uids: F.arrayUnion(uid), lastSeen: F.serverTimestamp() });
      else await F.setDoc(ref, { name, phone, uids: [uid], readDays: [], readAt: {}, quiz: {}, createdAt: F.serverTimestamp(), lastSeen: F.serverTimestamp() });
      myPhone = phone; store.set('me', phone); store.set('myName', name); startSubs(); return me();
    },
    async logout() { store.del('me'); myPhone = null; },
    async setRead(n, on) {
      if (on && isFutureDay(n)) throw new Error('future');
      await F.updateDoc(F.doc(db, 'users', myPhone), on ? { readDays: F.arrayUnion(n), [`readAt.${n}`]: F.serverTimestamp(), lastSeen: F.serverTimestamp() } : { readDays: F.arrayRemove(n) });
    },
    async answerChq(key, c, t) { if ((CH_DATE[key] || '') > todayCairo()) return; await F.updateDoc(F.doc(db, 'users', myPhone), { [`quiz.${key}`]: { c, t, at: Date.now() }, lastSeen: F.serverTimestamp() }); },
    async purgeFuture() { return purgeRaw(rawUsers, true); },
    async resetGame(phone, n) { try { await F.updateDoc(F.doc(db, 'users', phone), { [`quiz.game_${n}`]: F.deleteField() }); return true; } catch (e) { console.warn(e); return false; } },
    async saveGame(n, c, t, d) { if ((me()?.quiz || {})[`game_${n}`]) return false; await F.updateDoc(F.doc(db, 'users', myPhone), { [`quiz.game_${n}`]: { c, t, d, at: Date.now() }, lastSeen: F.serverTimestamp() }); return true; },
    myUid: () => uid,
    async post(type, text, ref, note) { const u = me(); const anon = type === 'prayer'; await F.addDoc(F.collection(db, 'wall'), { type, text, ref: ref || '', note: note || '', name: anon ? initialOf(u.name) : u.name, phone: anon ? '' : u.phone, uid, at: F.serverTimestamp(), prayed: 0 }); },
    async pray(id) { await F.updateDoc(F.doc(db, 'wall', id), { prayed: F.increment(1) }); },
    async react(id, k) { try { await F.updateDoc(F.doc(db, 'wall', id), { [`reacts.${uid}`]: k ? { t: k, n: me().name } : F.deleteField() }); return true; } catch (e) { console.warn(e); return false; } },
    async removePost(id) { await F.deleteDoc(F.doc(db, 'wall', id)); },
    async isServant() { try { const ok = (await F.getDoc(F.doc(db, 'admins', uid))).exists(); if (ok && !amServant) { amServant = true; purgeRaw(rawUsers, false); } return ok; } catch (e) { return false; } },
    async unlock(code) { try { await F.setDoc(F.doc(db, 'admins', uid), { code, phone: myPhone || '', at: F.serverTimestamp() }); amServant = true; purgeRaw(rawUsers, false); return true; } catch (e) { return false; } },
    async setCode(code) { try { await F.setDoc(F.doc(db, 'secrets', 'servants'), { code }); } catch (e) { return false; } return this.unlock(code); },
    async saveDay(n, data) { await F.setDoc(F.doc(db, 'days', String(n)), { ...data, at: F.serverTimestamp() }, { merge: true }); },
    async saveChq(key, questions) { if (questions.length) await F.setDoc(F.doc(db, 'chq', key), { questions, at: F.serverTimestamp() }); else await F.deleteDoc(F.doc(db, 'chq', key)); },
    async saveExam(ex, key) {
      const ref = ex.id ? F.doc(db, 'exams', ex.id) : F.doc(F.collection(db, 'exams'));
      const data = { ...ex }; delete data.id; if (!ex.id) { data.createdAt = F.serverTimestamp(); data.results = []; data.status = data.status || 'draft'; }
      await F.setDoc(ref, data, { merge: true }); if (key) await F.setDoc(F.doc(db, 'examKeys', ref.id), { answers: key }); return ref.id;
    },
    async deleteExam(id) { await F.deleteDoc(F.doc(db, 'exams', id)); try { await F.deleteDoc(F.doc(db, 'examKeys', id)); } catch (e) { /* ignore */ } },
    async examKey(id) { const s = await F.getDoc(F.doc(db, 'examKeys', id)); return s.exists() ? s.data().answers : []; },
    async submitExam(id, answers, dur) {
      const u = me(); try { await F.setDoc(F.doc(db, 'submissions', `${id}_${u.phone}`), { examId: id, phone: u.phone, name: u.name, uid, answers, dur, at: F.serverTimestamp() }); return true; } catch (e) { console.warn(e); return false; }
    },
    async mySubmission(id) { const u = me(); try { const s = await F.getDoc(F.doc(db, 'submissions', `${id}_${u.phone}`)); return s.exists() ? s.data() : null; } catch (e) { return null; } },
    async submissions(id) { const q = await F.getDocs(F.query(F.collection(db, 'submissions'), F.where('examId', '==', id))); return q.docs.map((d) => d.data()); },
    async gradeSubmission(id, phone, grades) { try { await F.updateDoc(F.doc(db, 'submissions', `${id}_${phone}`), { grades }); return true; } catch (e) { console.warn(e); return false; } },
    async ask(text, ref, verse) { const u = me(); try { await F.addDoc(F.collection(db, 'questions'), { phone: u.phone, name: u.name, uid, text, ref: ref || '', verse: verse || '', status: 'new', at: F.serverTimestamp() }); return true; } catch (e) { console.warn(e); return false; } },
    async listBonus() { try { const q = await F.getDocs(F.collection(db, 'bonus')); return Object.fromEntries(q.docs.map((d) => [d.id, d.data()])); } catch (e) { console.warn(e); return {}; } },
    async setBonus(phone, b) { try { await F.setDoc(F.doc(db, 'bonus', phone), { ...b, at: F.serverTimestamp() }); return true; } catch (e) { console.warn(e); return false; } },
    async listQuestions() { const q = await F.getDocs(F.query(F.collection(db, 'questions'), F.orderBy('at', 'desc'), F.limit(300))); return q.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: ms(x.at) || 0, answeredAt: ms(x.answeredAt) }; }); },
    async markAnswered(id, by, on = true) { try { await F.updateDoc(F.doc(db, 'questions', id), on ? { status: 'answered', answeredBy: by || '', answeredAt: F.serverTimestamp() } : { status: 'new', answeredBy: '', answeredAt: null }); return true; } catch (e) { console.warn(e); return false; } },
  };
}

export async function init() {
  let forceDemo = false; try { forceDemo = new URLSearchParams(location.search).has('demo'); } catch (e) { /* ignore */ }
  if (firebaseConfig && firebaseConfig.apiKey && !forceDemo) {
    try { impl = await firebaseImpl(); mode = 'firebase'; } catch (e) { console.error('Firebase failed, demo mode', e); impl = demoImpl(); mode = 'demo'; }
  } else impl = demoImpl();
  return impl.init();
}
export const api = new Proxy({}, { get: (_, k) => (...a) => impl[k](...a) });
export function on(kind, f) { listeners[kind].add(f); return () => listeners[kind].delete(f); }
export { DAYS };
