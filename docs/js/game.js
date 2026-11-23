// لعبة النهارده: محطات أسئلة على أصحاح اليوم، بتتصحح على طول، ولوحة «أول الخارجين»
import { DAYS, ar, status, dueDays, otLabel, ntLabel } from './plan.js';
import { api, gradeOne, qType } from './data.js';
import { $, $$, esc, APP, S, toast, vibrate, burst, avatar, first, meU, ICON, reduce } from './ui.js';

// built-in games (the servants can add or override any day from their panel → days/{n}.game)
export const GAMES = {
  8: {
    title: 'اطلع من الفلك 🛶', intro: 'نوح مخرجش من الفلك غير لما الأرض نشفت… وإنت مش هتخرج غير لما تعدّي المحطات كلها!',
    stations: [
      { emoji: '🌊', title: 'فين؟', type: 'mcq', q: 'الفلك استقر على جبال إيه؟', options: ['أراراط', 'سيناء', 'الكرمل', 'حوريب'], answer: 0, explain: '«وَاسْتَقَرَّ الْفُلْكُ فِي الشَّهْرِ السَّابِعِ… عَلَى جِبَالِ أَرَارَاطَ» (تك ٨: ٤)' },
      { emoji: '🐦‍⬛', title: 'مين خرج الأول؟', type: 'mcq', q: 'أول طير بعته نوح من الفلك كان…', options: ['الحمامة', 'الغراب', 'النسر', 'العصفور'], answer: 1, explain: '«وَأَرْسَلَ الْغُرَابَ، فَخَرَجَ مُتَرَدِّدًا حَتَّى نَشِفَتِ الْمِيَاهُ» (تك ٨: ٧)' },
      { emoji: '🌿', title: 'إيه اللي في بُقّها؟', type: 'fill', q: 'الحمامة رجعت عند المسا، وفي فمها ورقة …… خضراء', answer: 'زيتون / الزيتون / زيتونه', explain: '«وَإِذَا وَرَقَةُ زَيْتُونٍ خَضْرَاءُ فِي فَمِهَا» (تك ٨: ١١)' },
      { emoji: '🕊️', title: 'صح ولا غلط؟', type: 'tf', q: 'المرة التالتة، الحمامة رجعت لنوح برضه.', answer: false, explain: 'غلط! «فَلَبِثَ أَيْضًا سَبْعَةَ أَيَّامٍ أُخَرَ وَأَرْسَلَ الْحَمَامَةَ فَلَمْ تَعُدْ تَرْجِعُ إِلَيْهِ أَيْضًا» (تك ٨: ١٢)' },
      { emoji: '🔥', title: 'أول حاجة', type: 'mcq', q: 'أول حاجة عملها نوح بعد ما خرج من الفلك؟', options: ['بنى بيت لعيلته', 'زرع كرم', 'بنى مذبح للرب', 'نام يرتاح'], answer: 2, explain: '«وَبَنَى نُوحٌ مَذْبَحًا لِلرَّبِّ… وَأَصْعَدَ مُحْرَقَاتٍ عَلَى الْمَذْبَحِ» (تك ٨: ٢٠)' },
      { emoji: '🌈', title: 'وعد ربنا', type: 'tf', q: 'ربنا قال في قلبه: «لا أعود ألعن الأرض أيضًا من أجل الإنسان».', answer: true, explain: 'صح، وكمان: «مُدَّةَ كُلِّ أَيَّامِ الْأَرْضِ: زَرْعٌ وَحَصَادٌ… وَنَهَارٌ وَلَيْلٌ، لَا تَزَالُ» (تك ٨: ٢١-٢٢)' },
      { emoji: '✝️', title: 'كام واحد؟', type: 'mcq', q: 'بطرس الرسول قال إن قليلين خلصوا في الفلك بالماء. كانوا كام نفس؟', options: ['٤', '٦', '٨', '١٢'], answer: 2, explain: '«الَّذِي فِيهِ خَلَصَ قَلِيلُونَ، أَيْ ثَمَانِي أَنْفُسٍ بِالْمَاءِ» (١ بط ٣: ٢٠)' },
      { emoji: '💧', title: 'مثال لإيه؟', type: 'mcq', q: 'الماء اللي خلّص اللي في الفلك، بطرس قال إنه مثال لـ…', options: ['المعمودية', 'التوبة', 'الصوم', 'الدموع'], answer: 0, explain: '«الَّذِي مِثَالُهُ يُخَلِّصُنَا نَحْنُ الْآنَ، أَيِ الْمَعْمُودِيَّةُ» (١ بط ٣: ٢١)' },
      { emoji: '🎁', title: 'سؤال البونص', type: 'fill', q: 'كمّل الآية: غير مجازين عن شر بشر أو عن شتيمة بشتيمة، بل بالعكس ……', answer: 'مباركين / نبارك / باركوا', explain: '«بَلْ بِالْعَكْسِ مُبَارِكِينَ، عَالِمِينَ أَنَّكُمْ لِهَذَا دُعِيتُمْ لِكَيْ تَرِثُوا بَرَكَةً» (١ بط ٣: ٩)' },
    ],
  },
};
const EMOJI = ['🌊', '🧭', '⚓', '🕊️', '🌿', '🔥', '⛵', '🌈', '💧', '🎁'];

export function gameDay() {
  const st = status(); if (st.phase === 'reading') return st.day;
  const due = dueDays(); return due.length ? due[due.length - 1] : null;
}
export function gameFor(n) {
  const g = S.days[n]?.game || GAMES[n]; if (!g || !(g.stations || []).length) return null;
  return { ...g, stations: g.stations.map((s, i) => ({ emoji: EMOJI[i % EMOJI.length], title: `المحطة ${ar(i + 1)}`, ...s })) };
}
const gkey = (n) => `game_${n}`;
export function players(n) {
  return S.users.map((u) => ({ u, r: (u.quiz || {})[gkey(n)] })).filter((x) => x.r)
    .sort((a, b) => b.r.c - a.r.c || (a.r.d || 1e9) - (b.r.d || 1e9) || (a.r.at || 0) - (b.r.at || 0));
}
const clock = (s) => `${ar(Math.floor(s / 60))}:${ar(String(s % 60).padStart(2, '0'))}`;

// ---------------------------------------------------------------- home button
export function gameCTA(n) {
  const g = gameFor(n); if (!g) return '';
  const mine = (meU().quiz || {})[gkey(n)]; const ps = players(n).length;
  return `<a class="card game-cta ${mine ? 'played' : ''}" href="#/game/${n}"><span class="gi">🎮</span><span class="grow"><b>لعبة النهارده</b><small>${mine ? `لعبتها ✓ جبت ${ar(mine.c)} من ${ar(mine.t)}، شوف ترتيبك` : `${esc(g.title)}، ${ar(g.stations.length)} محطات${ps ? `، ${ar(ps)} لعبوها` : ''}`}</small></span>${mine ? '<span class="gbadge">🏆</span>' : '<span class="gplay">العب</span>'}</a>`;
}

// ---------------------------------------------------------------- the game
export function vGame(arg) {
  const d = (arg && DAYS.find((x) => x.n === +arg)) || gameDay(); const n = d?.n; const g = n && gameFor(n);
  const head = `<div class="rhead"><a class="iconbtn" href="#/today" aria-label="رجوع">${ICON.back}</a><b class="grow">🎮 لعبة النهارده</b></div>`;
  if (!g) { APP.innerHTML = `<div class="view">${head}<section class="card empty"><div class="big">🎮</div><h2>لسه مفيش لعبة لليوم ده</h2><p class="sub">الخدام بيجهزوها… ارجع تاني بعد شوية.</p><a class="btn primary block" href="#/today">رجوع</a></section></div>`; return; }
  const mine = (meU().quiz || {})[gkey(n)];
  if (mine && !S.gReplay) return board(d, g, head, mine);
  S.gReplay = false;
  APP.innerHTML = `<div class="view game">${head}<section class="card gintro"><div class="gwave"><span class="gboat">🛶</span></div><h1>${esc(g.title)}</h1><p class="sub">${esc(g.intro || '')}</p>
    <ul class="rules"><li>${ar(g.stations.length)} محطات على قراية اليوم ${ar(n)}: ${otLabel(d)}${d.nt ? '، ' + ntLabel(d) : ''}</li><li>كل إجابة بتتصحح على طول</li><li>الوقت بيتحسب، ولو اتساوت النجوم الأسرع بيسبق</li>${mine ? '<li><b>إنت لعبتها قبل كده، المرة دي للتسلية ومش هتتحسب</b></li>' : '<li>بتتحسب أول مرة بس</li>'}</ul>
    <div class="actions"><button class="btn red" id="ggo">يلا نبدأ 🚀</button><a class="btn ghost" href="#/read/${n}">اقرا الأول 📖</a></div></section></div>`;
  $('#ggo').onclick = () => play(d, g, head, !mine);
}

function track(g, i, res) {
  const N = Math.max(2, g.stations.length);
  return `<div class="gtrack"><div class="gline"><i style="width:${(i / N) * 100}%"></i></div>${g.stations.map((s, k) => `<span class="gst ${res[k] === true ? 'ok' : res[k] === false ? 'no' : k === i ? 'cur' : ''}" style="right:${(k / (N - 1)) * 100}%">${res[k] === true ? '✓' : res[k] === false ? '✗' : ar(k + 1)}</span>`).join('')}
    <span class="gboat moving" style="right:${(Math.min(i, N - 1) / (N - 1)) * 100}%">🛶</span></div>`;
}

function play(d, g, head, counts) {
  const S2 = g.stations; const res = []; let i = 0, c = 0; const t0 = Date.now(); let tick;
  const draw = () => {
    const s = S2[i]; const t = qType(s);
    const body = t === 'mcq' ? `<div class="opts">${s.options.map((o, k) => `<button class="opt" data-k="${k}"><span>${'أبجدهـ'[k] || ar(k + 1)}</span>${esc(o)}</button>`).join('')}</div>`
      : t === 'tf' ? `<div class="opts tf"><button class="opt" data-b="1"><span>✓</span>صح</button><button class="opt" data-b="0"><span>✗</span>غلط</button></div>`
        : `<div class="gfill"><input class="inp" id="gin" maxlength="60" autocomplete="off" placeholder="اكتب الإجابة"><button class="btn primary" id="gok">تمام</button></div>`;
    const qt = t === 'fill' ? esc(s.q).replace(/(…+|\.{3,}|_{3,})/g, '<span class="blank">……</span>') : esc(s.q);
    APP.innerHTML = `<div class="view game">${head}<div class="xbar"><span class="gscore">⭐ ${ar(c)}</span><span id="xt">٠:٠٠</span></div>${track(g, i, res)}
      <section class="card gq"><div class="gem">${s.emoji}</div><p class="qn">المحطة ${ar(i + 1)} من ${ar(S2.length)}${s.title && !/^المحطة/.test(s.title) ? `: <b>${esc(s.title)}</b>` : ''}</p><p class="qq">${qt}</p>${body}<div class="qexp" id="gx"></div></section></div>`;
    if (!reduce) $('.gq').animate([{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    const answer = (val, btn) => {
      const ok = gradeOne(s, s.answer, val).got > 0; res[i] = ok; if (ok) c++;
      $$('.opt').forEach((x) => { x.disabled = true; const v = x.dataset.k != null ? +x.dataset.k : x.dataset.b === '1'; if (v === s.answer) x.classList.add('right'); });
      if (btn && !ok) btn.classList.add('wrong'); const gi = $('#gin'); if (gi) { gi.disabled = true; gi.classList.add(ok ? 'right' : 'wrong'); $('#gok').remove(); }
      vibrate(ok ? 20 : [30, 60, 30]); if (ok) { const r = (btn || gi).getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 45); }
      const right = t === 'fill' ? String(s.answer).split('/')[0].trim() : null;
      $('#gx').innerHTML = `<p class="${ok ? 'good' : 'bad'}">${ok ? ['صح! 👏', 'برافو! 🌟', 'جامد! 🔥', 'بالظبط! ✨'][i % 4] : 'مش دي…'}${!ok && right ? ` الإجابة: <b>${esc(right)}</b>` : ''}</p>${s.explain ? `<small>${esc(s.explain)}</small>` : ''}
        <button class="btn ${i < S2.length - 1 ? 'primary' : 'red'} block" id="gn">${i < S2.length - 1 ? 'المحطة اللي بعدها ←' : 'اطلع من الفلك 🏁'}</button>`;
      $('.gscore').textContent = `⭐ ${ar(c)}`; $('.gtrack').outerHTML = track(g, i + 1, res);
      $('#gn').onclick = async () => {
        if (i < S2.length - 1) { i++; draw(); return; }
        clearInterval(tick); const dur = Math.round((Date.now() - t0) / 1000);
        if (counts) { try { await api.saveGame(d.n, c, S2.length, dur); } catch (e) { console.error(e); toast('مقدرناش نحفظ النتيجة'); } }
        finish(d, g, head, { c, t: S2.length, d: dur }, counts);
      };
    };
    $$('.opt[data-k]').forEach((b) => b.onclick = () => answer(+b.dataset.k, b));
    $$('.opt[data-b]').forEach((b) => b.onclick = () => answer(b.dataset.b === '1', b));
    const gin = $('#gin'); if (gin) { const go = () => { if (gin.value.trim()) answer(gin.value.trim()); }; $('#gok').onclick = go; gin.onkeydown = (e) => { if (e.key === 'Enter') go(); }; setTimeout(() => gin.focus(), 80); }
    clearInterval(tick); tick = setInterval(() => { const x = $('#xt'); if (!x) return clearInterval(tick); x.textContent = clock(Math.round((Date.now() - t0) / 1000)); }, 1000);
  };
  draw();
}

function finish(d, g, head, r, counts) {
  const all = r.c === r.t; const ps = players(d.n); const rank = ps.findIndex((x) => x.u.phone === S.me.phone) + 1;
  APP.innerHTML = `<div class="view game">${head}<section class="card gend"><div class="big">${all ? '🏆' : r.c >= r.t / 2 ? '🕊️' : '📖'}</div>
    <h1>${all ? 'خرجت من الفلك!' : r.c >= r.t / 2 ? 'قربت توصل!' : 'الطوفان لسه مخلصش 😅'}</h1>
    <div class="gstars">${Array.from({ length: r.t }, (_, k) => `<i class="${k < r.c ? 'on' : ''}">★</i>`).join('')}</div>
    <p class="gres"><b>${ar(r.c)}</b> من ${ar(r.t)} في <b>${clock(r.d)}</b>${counts && rank ? `، ترتيبك <b>${ar(rank)}</b> من ${ar(ps.length)}` : ''}</p>
    ${counts ? '' : '<p class="sub">دي كانت للتسلية، نتيجتك الأولى هي اللي بتتحسب.</p>'}
    <p class="sub">${all ? 'ربنا يبارك قرايتك 🤍' : 'ارجع اقرا الأصحاح تاني… وهتلاقي الإجابات مستنياك.'}</p>
    <div class="actions"><a class="btn wa-btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`🎮 لعبة النهارده في «لأعرفه»: ${g.title}\nجبت ${r.c} من ${r.t} ⭐ في ${Math.floor(r.d / 60)}:${String(r.d % 60).padStart(2, '0')}\nتقدر تغلبني؟ 😉\n${location.href.split('#')[0]}#/game/${d.n}`)}">${ICON.wa} تحدّى صحابك</a>${all ? '' : `<a class="btn ghost" href="#/read/${d.n}">اقرا تاني</a>`}</div></section>
    ${boardHTML(d.n)}</div>`;
  if (all) setTimeout(() => burst(innerWidth / 2, 200, 160), 250);
}

function boardHTML(n) {
  const ps = players(n); if (!ps.length) return '';
  const meI = ps.findIndex((x) => x.u.phone === S.me.phone); const medal = (k) => ['🥇', '🥈', '🥉'][k] || ar(k + 1);
  const row = ({ u, r }, k) => `<li class="${u.phone === S.me.phone ? 'me' : ''} ${k < 3 ? 'top' : ''}"><span class="md">${medal(k)}</span>${avatar(u.name, 30)}<span class="hn">${esc(first(u.name))}</span><span class="hs">${ar(r.c)}<small>/${ar(r.t)}</small></span><span class="ht">${clock(r.d || 0)}</span></li>`;
  return `<section class="card honor-card gold"><h2>🛶 أول الخارجين من الفلك</h2><p class="sub">${ar(ps.length)} لعبوا النهارده</p><ol class="honor">${ps.slice(0, 10).map(row).join('')}</ol>${meI >= 10 ? `<ol class="honor" start="${meI + 1}">${row(ps[meI], meI)}</ol>` : ''}</section>`;
}

function board(d, g, head, mine) {
  APP.innerHTML = `<div class="view game">${head}<section class="card gend"><div class="big">${mine.c === mine.t ? '🏆' : '🕊️'}</div><h1>${esc(g.title)}</h1>
    <div class="gstars">${Array.from({ length: mine.t }, (_, k) => `<i class="${k < mine.c ? 'on' : ''}">★</i>`).join('')}</div>
    <p class="gres">نتيجتك: <b>${ar(mine.c)}</b> من ${ar(mine.t)} في <b>${clock(mine.d || 0)}</b></p>
    <div class="actions"><button class="btn primary" id="grp">العب تاني للتسلية</button><a class="btn ghost" href="#/today">رجوع</a></div></section>${boardHTML(d.n)}</div>`;
  $('#grp').onclick = () => { S.gReplay = true; vGame(d.n); };
}
