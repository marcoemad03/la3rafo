// طبقة البيانات: Firebase لو الإعدادات موجودة، وإلا وضع تجريبي على الجهاز
import { firebaseConfig } from './firebase-config.js';
import { DAYS, todayCairo, dueDays } from './plan.js';

const listeners = { users: new Set(), wall: new Set(), days: new Set() };
const emit = (k, v) => listeners[k].forEach((f) => { try { f(v); } catch (e) { console.error(e); } });
const ck = {
  get(k) { try { const m = document.cookie.match(new RegExp('(?:^|; )la3rafo_' + k + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; } catch (e) { return null; } },
  set(k, v) { try { document.cookie = `la3rafo_${k}=${encodeURIComponent(v)}; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax`; } catch (e) { /* ignore */ } },
  del(k) { try { document.cookie = `la3rafo_${k}=; max-age=0; path=/`; } catch (e) { /* ignore */ } },
};
const KEEP = ['me', 'myName'];
const store = {
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

let impl = null;
export let mode = 'demo';

// ------------------------------------------------------------------ DEMO
function demoImpl() {
  const memo = { users: store.get('demo_users', null), wall: store.get('demo_wall', null), days: store.get('demo_days', {}) };
  if (!memo.users) {
    const names = ['مينا عادل', 'مارينا سمير', 'كيرلس ناجي', 'مريم هاني', 'أبانوب رأفت', 'فادي جرجس', 'كاترين عماد', 'يوستينا مجدي', 'جورج صبحي', 'ماريان فايز', 'مايكل نبيل', 'ساندرا رامي', 'أندرو ماهر', 'ميرنا أشرف', 'شنودة فكري', 'فيرينا وجيه', 'بولا إسحق', 'ديفيد عاطف'];
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const due = dueDays(); const tdy = todayCairo();
    memo.users = names.map((name, i) => {
      const skill = 0.55 + rnd() * 0.45; const readDays = [];
      due.forEach((d) => { if (d.date === tdy ? rnd() < 0.55 : rnd() < skill) readDays.push(d.n); });
      return { phone: '0100000' + String(1000 + i), name, readDays, createdAt: Date.now() - 864e5 * 2 };
    });
    memo.wall = [
      { id: 'w1', type: 'verse', name: 'مارينا سمير', phone: '01000001001', text: 'فِي الْبَدْءِ خَلَقَ اللهُ السَّمَاوَاتِ وَالأَرْضَ', ref: 'تكوين ١: ١', at: Date.now() - 36e5 * 20, prayed: 0 },
      { id: 'w2', type: 'verse', name: 'كيرلس ناجي', phone: '01000001002', text: 'اِحْسِبُوهُ كُلَّ فَرَحٍ يَا إِخْوَتِي حِينَمَا تَقَعُونَ فِي تَجَارِبَ مُتَنَوِّعَةٍ', ref: 'يعقوب ١: ٢', at: Date.now() - 36e5 * 9, prayed: 0 },
      { id: 'w3', type: 'prayer', name: 'مريم هاني', phone: '01000001003', text: 'صلّوا عشان امتحانات الميدترم الأسبوع الجاي', at: Date.now() - 36e5 * 5, prayed: 7 },
      { id: 'w4', type: 'verse', name: 'فادي جرجس', phone: '01000001005', text: 'وَأَمَّا إِنْ كَانَ أَحَدُكُمْ تُعْوِزُهُ حِكْمَةٌ، فَلْيَطْلُبْ مِنَ اللهِ', ref: 'يعقوب ١: ٥', at: Date.now() - 36e5 * 2, prayed: 0 },
    ];
    memo.days = { 1: { reflection: 'ربنا بيبدأ بالنور. قبل ما تخلق حاجة، قال «ليكن نور». يمكن النهارده عندك حاجة ضلمة… اديها لربنا يقول فيها «ليكن نور».', question: 'إيه الحاجة اللي محتاج ربنا يقول فيها «ليكن نور» النهارده؟', by: 'بيشوي' } };
    save();
  }
  function save() { store.set('demo_users', memo.users); store.set('demo_wall', memo.wall); store.set('demo_days', memo.days); }
  const me = () => memo.users.find((u) => u.phone === store.get('me', null));
  return {
    async init() { setTimeout(() => { emit('users', memo.users); emit('wall', memo.wall); emit('days', memo.days); }, 0); return me() || null; },
    async login(name, phone) {
      let u = memo.users.find((x) => x.phone === phone);
      if (!u) { u = { phone, name, readDays: [], createdAt: Date.now() }; memo.users.push(u); } else u.name = name;
      store.set('me', phone); save(); emit('users', memo.users); return u;
    },
    async logout() { store.del('me'); },
    me,
    async setRead(n, on) {
      const u = me(); if (!u) return; const s = new Set(u.readDays);
      on ? s.add(n) : s.delete(n); u.readDays = [...s].sort((a, b) => a - b);
      u.readAt = { ...(u.readAt || {}), [n]: Date.now() }; save(); emit('users', memo.users);
    },
    async post(type, text, ref) {
      const u = me(); memo.wall.push({ id: 'w' + Date.now(), type, text, ref: ref || '', name: u.name, phone: u.phone, at: Date.now(), prayed: 0 });
      save(); emit('wall', memo.wall);
    },
    async pray(id) { const w = memo.wall.find((x) => x.id === id); if (w) { w.prayed = (w.prayed || 0) + 1; save(); emit('wall', memo.wall); } },
    async removePost(id) { memo.wall = memo.wall.filter((x) => x.id !== id); save(); emit('wall', memo.wall); },
    async isServant() { return !!store.get('servant', false); },
    async unlock(code) { if (code === (store.get('demo_code', '2026'))) { store.set('servant', true); return true; } return false; },
    async setCode(code) { store.set('demo_code', code); store.set('servant', true); return true; },
    async saveDay(n, data) { memo.days[n] = { ...(memo.days[n] || {}), ...data }; save(); emit('days', memo.days); },
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
  const cred = auth.currentUser ? { user: auth.currentUser } : await A.signInAnonymously(auth);
  const uid = cred.user.uid;
  let users = []; let myPhone = store.get('me', null);
  const subs = [];
  function startSubs() {
    if (subs.length) return;
    subs.push(F.onSnapshot(F.collection(db, 'users'), (s) => { users = s.docs.map((d) => ({ phone: d.id, ...d.data() })); emit('users', users); }));
    subs.push(F.onSnapshot(F.query(F.collection(db, 'wall'), F.orderBy('at', 'desc'), F.limit(150)), (s) => {
      emit('wall', s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: x.at?.toMillis ? x.at.toMillis() : x.at }; }));
    }));
    subs.push(F.onSnapshot(F.collection(db, 'days'), (s) => { const m = {}; s.docs.forEach((d) => { m[d.id] = d.data(); }); emit('days', m); }));
  }
  const me = () => users.find((u) => u.phone === myPhone) || (myPhone ? { phone: myPhone, name: store.get('myName', ''), readDays: [] } : null);
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
      else await F.setDoc(ref, { name, phone, uids: [uid], readDays: [], readAt: {}, createdAt: F.serverTimestamp(), lastSeen: F.serverTimestamp() });
      myPhone = phone; store.set('me', phone); store.set('myName', name); startSubs(); return me();
    },
    async logout() { store.del('me'); myPhone = null; },
    me,
    async setRead(n, on) {
      const ref = F.doc(db, 'users', myPhone);
      await F.updateDoc(ref, on ? { readDays: F.arrayUnion(n), [`readAt.${n}`]: F.serverTimestamp() } : { readDays: F.arrayRemove(n) });
    },
    async post(type, text, ref) {
      const u = me(); await F.addDoc(F.collection(db, 'wall'), { type, text, ref: ref || '', name: u.name, phone: u.phone, uid, at: F.serverTimestamp(), prayed: 0 });
    },
    async pray(id) { await F.updateDoc(F.doc(db, 'wall', id), { prayed: F.increment(1) }); },
    async removePost(id) { await F.deleteDoc(F.doc(db, 'wall', id)); },
    async isServant() { try { return (await F.getDoc(F.doc(db, 'admins', uid))).exists(); } catch (e) { return false; } },
    async unlock(code) { try { await F.setDoc(F.doc(db, 'admins', uid), { code, phone: myPhone, at: F.serverTimestamp() }); return true; } catch (e) { return false; } },
    async setCode(code) {
      try { await F.setDoc(F.doc(db, 'secrets', 'servants'), { code }); } catch (e) { return false; }
      return this.unlock(code);
    },
    async saveDay(n, data) { await F.setDoc(F.doc(db, 'days', String(n)), { ...data, at: F.serverTimestamp() }, { merge: true }); },
  };
}

export async function init() {
  if (firebaseConfig && firebaseConfig.apiKey) {
    try { impl = await firebaseImpl(); mode = 'firebase'; } catch (e) { console.error('Firebase failed, demo mode', e); impl = demoImpl(); mode = 'demo'; }
  } else impl = demoImpl();
  return impl.init();
}
export const api = new Proxy({}, { get: (_, k) => (...a) => impl[k](...a) });
export function on(kind, f) { listeners[kind].add(f); return () => listeners[kind].delete(f); }
export { DAYS };
