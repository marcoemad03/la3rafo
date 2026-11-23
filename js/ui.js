// أدوات مشتركة بين كل الصفحات
import { ar, streak } from './plan.js';
import { mode } from './data.js';
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const APP = $('#app'); export const NAV = $('#nav');
export const S = { me: null, users: [], wall: [], days: {}, chq: {}, exams: [], text: null, wallTab: 'verse', fs: 21, jTab: 'mountain' };
try { S.fs = +localStorage.getItem('la3rafo:fs') || 21; } catch (e) { /* ignore */ }
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- helpers ----------
const PALETTE = ['#02304A', '#C22026', '#2E7D6B', '#B07A1E', '#6B3FA0', '#0E7C9E', '#A0522D', '#3D5A80'];
export function color(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; }
export const initial = (n) => (String(n || '؟').trim()[0] || '؟');
export const first = (n) => String(n || '').trim().split(/\s+/)[0];
export function avatar(name, size = 38) { return `<span class="av" style="background:${color(name)};width:${size}px;height:${size}px">${esc(initial(name))}</span>`; }
export function timeAgo(ms) {
  const m = Math.max(1, Math.round((Date.now() - ms) / 6e4));
  if (m < 60) return `من ${ar(m)} دقيقة`; const h = Math.round(m / 60); if (h < 24) return `من ${ar(h)} ساعة`; return `من ${ar(Math.round(h / 24))} يوم`;
}
let toastT; export function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
export function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } }
export function meU() { return S.users.find((x) => x.phone === S.me?.phone) || S.me; }
export function myRead() { const u = S.users.find((x) => x.phone === S.me?.phone) || S.me; return new Set((u && u.readDays) || []); }
export function greeting() { const h = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false }).format(new Date()); return h < 12 ? 'صباح الخير' : h < 17 ? 'نهارك سعيد' : 'مساء الخير'; }
let textP = null; // one shared download, however many views ask at once
export async function loadText() { if (S.text) return S.text; if (!textP) textP = fetch('data/text.json').then((r) => r.json()).then((t) => (S.text = t)).catch((e) => { textP = null; throw e; }); return textP; }
export const ICON = {
  ear: '<svg viewBox="0 0 24 24"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" style="fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round"><path d="M5 12l5 5 9-10"/></svg>',
  wa: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
};
export function topbar() {
  const st = streak(myRead());
  return `<header class="top"><a class="brand" href="#/today" aria-label="لأعرفه"><img class="em" src="assets/img/emblem_s.png" alt=""><img class="nm" src="assets/img/name.png" alt="لأعرفه">${mode === 'demo' ? '<span class="demo-tag">تجريبي</span>' : ''}</a>
  <span class="chip fire" title="أيام متتالية">🔥 <b>${ar(st)}</b> يوم</span></header>`;
}
export function logos() {
  return `<div class="logos"><img src="assets/img/family.png" alt="أسرة القوي الأنبا موسى"><img src="assets/img/church.png" alt="كنيسة السيدة العذراء مريم"></div>
  <p class="foot-note">أسرة القوي الأنبا موسى للجامعيين<br>كنيسة السيدة العذراء مريم بمدينة السادات</p>`;
}

// ---------- light burst fx ----------
const fx = $('#fx'); const ctx = fx.getContext('2d'); let parts = []; let fxOn = false;
export function burst(x, y, n = 90) {
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

