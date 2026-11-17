// حسابات الانتظام والنقاط
import { DAYS, TOTAL, todayCairo, dueDays, streak, BADGES } from './plan.js';

const fmtCairo = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
export const cairoDate = (ms) => fmtCairo.format(new Date(ms));
const byN = Object.fromEntries(DAYS.map((d) => [d.n, d]));

// on time = marked on the reading day itself (Cairo time). Anything later is late.
export function readState(u, n) {
  if (!(u.readDays || []).includes(n)) return 'no';
  const t = u.readAt && u.readAt[n]; if (!t) return 'ontime';
  return cairoDate(t) <= byN[n].date ? 'ontime' : 'late';
}
export function userStats(u, today = todayCairo()) {
  const due = dueDays(today); const read = new Set(u.readDays || []);
  let onTime = 0, late = 0;
  read.forEach((n) => { const s = readState(u, n); if (s === 'ontime') onTime++; else if (s === 'late') late++; });
  const dueN = due.length || 1;
  const quiz = Object.values(u.quiz || {}); const qc = quiz.reduce((a, x) => a + (x.c || 0), 0); const qt = quiz.reduce((a, x) => a + (x.t || 0), 0);
  const st = streak(read, today);
  const points = onTime * 10 + late * 5 + qc * 3 + st * 2;
  const lastAt = Math.max(0, ...Object.values(u.readAt || {}));
  return { read: read.size, onTime, late, missed: due.filter((d) => d.date < today && !read.has(d.n)).length, due: due.length,
    consistency: Math.round((onTime / dueN) * 100), progress: read.size / TOTAL, streak: st, qc, qt, points, lastAt,
    badges: BADGES.filter((b) => b.test(read)).length, readToday: due.length && due[due.length - 1].date === today && read.has(due[due.length - 1].n) };
}
// "this week" = Saturday..Friday in Cairo
export function weekRange(today = todayCairo()) {
  const d = new Date(today + 'T12:00:00Z'); const back = (d.getUTCDay() + 1) % 7; d.setUTCDate(d.getUTCDate() - back);
  const s = d.toISOString().slice(0, 10); const e = new Date(d.getTime() + 6 * 864e5).toISOString().slice(0, 10); return [s, e];
}
export function weekStats(u, today = todayCairo()) {
  const [s, e] = weekRange(today); const days = DAYS.filter((d) => d.date >= s && d.date <= e && d.date <= today);
  let onTime = 0; days.forEach((d) => { if (readState(u, d.n) === 'ontime') onTime++; });
  return { onTime, due: days.length, consistency: days.length ? Math.round((onTime / days.length) * 100) : 0 };
}
// closest badge the user hasn't got yet (for nudges)
const TARGETS = [
  { id: 'week', name: 'أسبوع كامل', count: 6 }, { id: 'james', name: 'رسالة يعقوب', set: [1, 5] }, { id: 'peter', name: 'رسائل بطرس', set: [6, 13] },
  { id: 'john', name: 'رسائل يوحنا', set: [14, 20] }, { id: 'half', name: 'نص الجبل', count: 23 }, { id: 'rev', name: 'سفر الرؤيا', set: [1, 43] },
  { id: 'joseph', name: 'قصة يوسف', set: [37, 46] }, { id: 'summit', name: 'القمة', count: TOTAL },
];
export function nextBadge(readSet) {
  const opts = TARGETS.map((t) => {
    let left; if (t.count) left = t.count - readSet.size; else { left = 0; for (let n = t.set[0]; n <= t.set[1]; n++) if (!readSet.has(n)) left++; }
    return { ...t, left };
  }).filter((t) => t.left > 0).sort((a, b) => a.left - b.left);
  return opts[0] || null;
}
