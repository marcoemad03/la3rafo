// خطة القراءة: ٤٦ يوم من الأحد ١٥ نوفمبر ٢٠٢٦ لحد الأربعاء ٦ يناير ٢٠٢٧ — الجمعة إجازة
export const START = '2026-11-15';
export const CHRISTMAS = '2027-01-07';
export const SERVANTS = [
  { name: 'بيشوي', color: '#2E7D6B' },
  { name: 'ماركو', color: '#02304A' },
  { name: 'بيتر', color: '#C22026' },
  { name: 'محب', color: '#B07A1E' },
];
const NT = [['jas', 'يعقوب', 5], ['1pe', 'بطرس الأولى', 5], ['2pe', 'بطرس الثانية', 3], ['1jn', 'يوحنا الأولى', 5],
  ['2jn', 'يوحنا الثانية', 1], ['3jn', 'يوحنا الثالثة', 1], ['jud', 'يهوذا', 1], ['rev', 'رؤيا يوحنا', 22]];
export const BOOKS = { gen: 'التكوين', jas: 'يعقوب', '1pe': 'بطرس الأولى', '2pe': 'بطرس الثانية', '1jn': 'يوحنا الأولى', '2jn': 'يوحنا الثانية', '3jn': 'يوحنا الثالثة', jud: 'يهوذا', rev: 'رؤيا يوحنا' };
const ntList = NT.flatMap(([k, n, c]) => Array.from({ length: c }, (_, i) => ({ book: k, ch: i + 1 })));
const otList = [...Array.from({ length: 43 }, (_, i) => [i + 1]), [44, 45], [46, 47], [48, 49, 50]];

const AR = '٠١٢٣٤٥٦٧٨٩';
export const ar = (x) => String(x).replace(/[0-9]/g, (d) => AR[d]);
export const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// dates are handled as 'YYYY-MM-DD' strings in Cairo time
export function iso(d) { return d.toISOString().slice(0, 10); }
export function addDays(s, n) { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
export function weekday(s) { return new Date(s + 'T12:00:00Z').getUTCDay(); }
export function diffDays(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }
export function fmtDate(s, withDay = true, withYear = false) {
  const d = new Date(s + 'T12:00:00Z');
  return (withDay ? WEEKDAYS[d.getUTCDay()] + ' ' : '') + ar(d.getUTCDate()) + ' ' + MONTHS[d.getUTCMonth()] + (withYear ? ' ' + ar(d.getUTCFullYear()) : '');
}
export function todayCairo() {
  try {
    const q = new URLSearchParams(location.search).get('date');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  } catch (e) { /* ignore */ }
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export const DAYS = [];
(() => {
  let d = START;
  while (DAYS.length < otList.length) {
    if (weekday(d) !== 5) {
      const i = DAYS.length;
      DAYS.push({ n: i + 1, date: d, ot: otList[i], nt: ntList[i] || null, servant: SERVANTS[i % 4] });
    }
    d = addDays(d, 1);
  }
})();
export const TOTAL = DAYS.length;
export const END = DAYS[DAYS.length - 1].date;

export function otLabel(day, short = false) {
  const c = day.ot; const b = short ? 'تك' : 'التكوين';
  if (c.length === 1) return `${b} ${ar(c[0])}`;
  if (c.length === 2) return `${b} ${ar(c[0])} و${ar(c[1])}`;
  return `${b} ${ar(c[0])} – ${ar(c[c.length - 1])}`;
}
export function ntLabel(day) { return day.nt ? `${BOOKS[day.nt.book]} ${ar(day.nt.ch)}` : null; }
export function passages(day) {
  const p = day.ot.map((c) => ({ book: 'gen', ch: c }));
  if (day.nt) p.push(day.nt);
  return p;
}
export function dayByDate(s) { return DAYS.find((d) => d.date === s) || null; }
// state of the calendar for a given date
export function status(today = todayCairo()) {
  if (today < START) return { phase: 'before', daysLeft: diffDays(today, START) };
  if (today > END) return { phase: 'after' };
  const d = dayByDate(today);
  if (d) return { phase: 'reading', day: d };
  return { phase: 'friday', next: DAYS.find((x) => x.date > today) };
}
export function dueDays(today = todayCairo()) { return DAYS.filter((d) => d.date <= today); }

export const BADGES = [
  { id: 'first', icon: '🕯️', name: 'أول شمعة', desc: 'قريت أول يوم', test: (r) => r.size >= 1 },
  { id: 'week', icon: '🌿', name: 'أسبوع كامل', desc: '٦ أيام قراءة', test: (r) => r.size >= 6 },
  { id: 'james', icon: '📜', name: 'رسالة يعقوب', desc: 'خلّصت يعقوب', test: (r) => [1, 2, 3, 4, 5].every((n) => r.has(n)) },
  { id: 'peter', icon: '🗝️', name: 'رسائل بطرس', desc: 'خلّصت بطرس الأولى والثانية', test: (r) => range(6, 13).every((n) => r.has(n)) },
  { id: 'john', icon: '❤️', name: 'رسائل يوحنا', desc: 'يوحنا الأولى والثانية والثالثة', test: (r) => range(14, 20).every((n) => r.has(n)) },
  { id: 'half', icon: '⛰️', name: 'نص الجبل', desc: '٢٣ يوم قراءة', test: (r) => r.size >= 23 },
  { id: 'rev', icon: '👑', name: 'سفر الرؤيا', desc: 'خلّصت العهد الجديد كله', test: (r) => range(1, 43).every((n) => r.has(n)) },
  { id: 'joseph', icon: '🌾', name: 'قصة يوسف', desc: 'التكوين ٣٧ – ٥٠', test: (r) => range(37, 46).every((n) => r.has(n)) },
  { id: 'summit', icon: '✝️', name: 'القمة', desc: 'خلّصت الرحلة كلها', test: (r) => r.size >= TOTAL },
];
function range(a, b) { return Array.from({ length: b - a + 1 }, (_, i) => a + i); }

// consecutive reading days ending at the latest due day (Fridays don't break it)
export function streak(readSet, today = todayCairo()) {
  const due = dueDays(today); let s = 0;
  for (let i = due.length - 1; i >= 0; i--) {
    if (readSet.has(due[i].n)) s++;
    else if (i === due.length - 1 && due[i].date === today) continue; // today not read yet doesn't break
    else break;
  }
  return s;
}
