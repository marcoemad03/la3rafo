// لعبة النهارده: محطات أسئلة على أصحاح اليوم، بتتصحح على طول، ولوحة «أول الخارجين»
import { DAYS, ar, status, dueDays, otLabel, ntLabel, fmtDate, todayCairo } from './plan.js';
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
  9: {
    title: 'لوّن قوس قزح 🌈', theme: 'rainbow', intro: '«وَضَعْتُ قَوْسِي فِي السَّحَابِ»… القوس لسه رمادي. كل مرحلة تخلّصها بتلوّن لون، لحد ما وعد ربنا يكمل!',
    stations: [
      { title: 'رتّب الحكاية', type: 'order', q: 'رتّب أحداث تكوين ٩ من الأول للآخر', answer: ['ربنا بارك نوح وبنيه: «أثمروا واكثروا»', 'ربنا وضع قوسه في السحاب علامة للميثاق', 'نوح بقى فلاح وغرس كرم', 'سام ويافث غطّوا أبوهم بالرداء', 'نوح مات وعمره ٩٥٠ سنة'], explain: 'تكوين ٩: ١، ١٣، ٢٠، ٢٣، ٢٩' },
      { title: 'الآية المكسّرة', type: 'verse', q: 'رتّب كلمات الآية', answer: 'وضعت قوسي في السحاب فتكون علامة ميثاق بيني وبين الأرض', explain: 'تكوين ٩: ١٣' },
      { title: 'وصّل', type: 'match', q: 'وصّل كل حاجة باللي يخصها من تكوين ٩', answer: [{ a: 'سام ويافث', b: 'ستروا عورة أبوهم' }, { a: 'حام', b: 'أبو كنعان' }, { a: 'القوس', b: 'علامة الميثاق' }, { a: 'نوح', b: 'غرس كرم' }], explain: 'تكوين ٩: ١٣، ١٨، ٢٠، ٢٣' },
      { title: 'الآية المكسّرة', type: 'verse', q: 'رتّب كلمات الآية', answer: 'لتكن محبتكم بعضكم لبعض شديدة لأن المحبة تستر كثرة من الخطايا', explain: '١ بطرس ٤: ٨' },
      { title: 'وصّل', type: 'match', q: 'وصّل الوصية بكمالتها من بطرس الأولى ٤', answer: [{ a: 'نهاية كل شيء اقتربت', b: 'تعقّلوا واصحوا للصلوات' }, { a: 'كونوا مضيفين بعضكم بعضًا', b: 'بلا دمدمة' }, { a: 'كل واحد أخد موهبة', b: 'يخدم بها بعضكم بعضًا' }, { a: 'البلوى المحرقة', b: 'لا تستغربوها' }], explain: '١ بطرس ٤: ٧، ٩، ١٠، ١٢' },
      { title: 'كمّل الجملة', type: 'match', q: 'وصّل أول الجملة بآخرها', answer: [{ a: 'إن عُيّرتم باسم المسيح', b: 'فطوبى لكم' }, { a: 'إن كان كمسيحي', b: 'فلا يخجل' }, { a: 'إن كان يتكلم أحد', b: 'فكأقوال الله' }, { a: 'إن كان يخدم أحد', b: 'فكأنه من قوة يمنحها الله' }], explain: '١ بطرس ٤: ١١، ١٤، ١٦' },
      { title: 'الوعد الأخير', type: 'verse', q: 'رتّب كلمات الآية، وكمّل القوس 🌈', answer: 'فمتى كانت القوس في السحاب أبصرها لأذكر ميثاقا أبديا', explain: 'تكوين ٩: ١٦' },
    ],
  },
};
export const GTYPES = { mcq: 'اختياري', tf: 'صح وخطأ', fill: 'أكمل', order: 'رتّب', verse: 'آية مكسّرة', match: 'وصّل' };
const RAIN = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#3949AB', '#8E24AA'];
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
export function pastGames() { const t = todayCairo(); return DAYS.filter((d) => d.date <= t && gameFor(d.n)); }
export function gameCTA(n) {
  const past = pastGames().filter((d) => d.n !== n); const left = past.filter((d) => !(meU().quiz || {})[gkey(d.n)]).length;
  const more = past.length ? `<a class="games-link" href="#/games">🕹️ ${left === 1 ? 'فيه لعبة لسه ملعبتهاش' : left === 2 ? 'فيه لعبتين لسه ملعبتهمش' : left ? `فيه ${ar(left)} ألعاب لسه ملعبتهمش` : 'كل الألعاب (لعبتهم كلهم ✓)'}</a>` : '';
  const g = gameFor(n); if (!g) return more;
  const mine = (meU().quiz || {})[gkey(n)]; const ps = players(n).length;
  return `<a class="card game-cta ${mine ? 'played' : ''}" href="#/game/${n}"><span class="gi">🎮</span><span class="grow"><b>لعبة النهارده</b><small>${mine ? `لعبتها ✓ جبت ${ar(mine.c)} من ${ar(mine.t)}، شوف ترتيبك` : `${esc(g.title)}، ${ar(g.stations.length)} محطات${ps ? `، ${ar(ps)} لعبوها` : ''}`}</small></span>${mine ? '<span class="gbadge">🏆</span>' : '<span class="gplay">العب</span>'}</a>${more}`;
}

// ---------------------------------------------------------------- all games (play an old one)
export function vGames() {
  const list = pastGames().reverse();
  APP.innerHTML = `<div class="view game"><div class="rhead"><a class="iconbtn" href="#/today" aria-label="رجوع">${ICON.back}</a><b class="grow">🕹️ كل الألعاب</b></div>
    <p class="sub" style="margin:4px 6px 12px">اللعبة اللي ملعبتهاش لسه نتيجتها بتتحسب لما تلعبها، حتى لو يومها فات.</p>
    ${list.length ? list.map((d) => { const g = gameFor(d.n); const m = (meU().quiz || {})[gkey(d.n)]; const ps = players(d.n).length;
      return `<a class="card gitem ${m ? 'played' : ''}" href="#/game/${d.n}"><span class="gday"><small>اليوم</small><b>${ar(d.n)}</b></span><span class="grow"><b>${esc(g.title)}</b><small>${fmtDate(d.date, false)}، ${otLabel(d)}${d.nt ? ' + ' + ntLabel(d) : ''}</small><small>${ps ? `${ar(ps)} لعبوها` : 'محدش لعبها لسه'}</small></span>${m ? `<span class="gsc">${ar(m.c)}<small>/${ar(m.t)}</small></span>` : '<span class="gplay">العب</span>'}</a>`; }).join('')
      : '<section class="card empty"><div class="big">🎮</div><h2>مفيش ألعاب لسه</h2></section>'}</div>`;
}

// ---------------------------------------------------------------- the game
export function vGame(arg) {
  const d = (arg && DAYS.find((x) => x.n === +arg)) || gameDay(); const n = d?.n; const g = n && gameFor(n);
  const isToday = d && d.n === gameDay()?.n;
  const head = `<div class="rhead"><a class="iconbtn" href="${isToday ? '#/today' : '#/games'}" aria-label="رجوع">${ICON.back}</a><b class="grow">🎮 ${isToday ? 'لعبة النهارده' : `لعبة اليوم ${d ? ar(d.n) : ''}`}</b><a class="chip" href="#/games">كل الألعاب</a></div>`;
  if (d && d.date > todayCairo()) { APP.innerHTML = `<div class="view">${head}<section class="card empty"><div class="big">⏳</div><h2>لسه يومها مجاش</h2><p class="sub">اللعبة دي بتفتح يوم ${fmtDate(d.date, false)}.</p></section></div>`; return; }
  if (!g) { APP.innerHTML = `<div class="view">${head}<section class="card empty"><div class="big">🎮</div><h2>لسه مفيش لعبة لليوم ده</h2><p class="sub">الخدام بيجهزوها… ارجع تاني بعد شوية.</p><a class="btn primary block" href="#/today">رجوع</a></section></div>`; return; }
  const mine = (meU().quiz || {})[gkey(n)];
  if (mine) return board(d, g, head, mine);
  APP.innerHTML = `<div class="view game">${head}<section class="card gintro">${g.theme === 'rainbow' ? rainbow(0, g.stations.length, true) : '<div class="gwave"><span class="gboat">🛶</span></div>'}<h1>${esc(g.title)}</h1><p class="sub">${esc(g.intro || '')}</p>
    <ul class="rules"><li>${ar(g.stations.length)} ${g.theme === 'rainbow' ? 'مراحل' : 'محطات'} على قراية اليوم ${ar(n)}: ${otLabel(d)}${d.nt ? '، ' + ntLabel(d) : ''}</li><li>${g.stations.some((x) => ['order', 'verse', 'match'].includes(x.type)) ? 'النجمة بتتحسب لو حلّيت المرحلة من أول محاولة' : 'كل إجابة بتتصحح على طول'}</li><li>الوقت بيتحسب، ولو اتساوت النجوم الأسرع بيسبق</li>${mine ? '<li><b>إنت لعبتها قبل كده، المرة دي للتسلية ومش هتتحسب</b></li>' : '<li>بتتلعب مرة واحدة بس، فركّز 🙂</li>'}</ul>
    <div class="actions"><button class="btn red" id="ggo">يلا نبدأ 🚀</button><a class="btn ghost" href="#/read/${n}">اقرا الأول 📖</a></div></section></div>`;
  $('#ggo').onclick = () => play(d, g, head, !mine);
}

function rainbow(done, n, big) {
  const R = [120, 108, 96, 84, 72, 60, 48]; const k = Math.min(7, n);
  return `<svg class="rainbow ${big ? 'big' : ''}" viewBox="0 0 260 140" aria-hidden="true"><g fill="none" stroke-width="12" stroke-linecap="round">${R.slice(0, k).map((r, j) => `<path d="M${130 - r} 132 A${r} ${r} 0 0 1 ${130 + r} 132" stroke="${j < done ? RAIN[j] : '#e3dccb'}" class="${j === done - 1 ? 'fresh' : ''}"/>`).join('')}</g><g class="cloud"><ellipse cx="22" cy="128" rx="24" ry="12"/><ellipse cx="238" cy="128" rx="24" ry="12"/></g></svg>`;
}
function track(g, i, res) {
  if (g.theme === 'rainbow') return `<div class="rtrack">${rainbow(res.filter((x) => x !== undefined).length, g.stations.length)}<div class="rdots">${g.stations.map((_, k) => `<i class="${res[k] === true ? 'ok' : res[k] === false ? 'no' : k === i ? 'cur' : ''}" style="--c:${RAIN[k % 7]}">${res[k] === true ? '★' : ar(k + 1)}</i>`).join('')}</div></div>`;
  const N = Math.max(2, g.stations.length);
  return `<div class="gtrack"><div class="gline"><i style="width:${(i / N) * 100}%"></i></div>${g.stations.map((s, k) => `<span class="gst ${res[k] === true ? 'ok' : res[k] === false ? 'no' : k === i ? 'cur' : ''}" style="right:${(k / (N - 1)) * 100}%">${res[k] === true ? '✓' : res[k] === false ? '✗' : ar(k + 1)}</span>`).join('')}
    <span class="gboat moving" style="right:${(Math.min(i, N - 1) / (N - 1)) * 100}%">🛶</span></div>`;
}

const shuffle = (arr, seed = 7) => { const a = [...arr]; let x = seed; for (let i = a.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } if (a.length > 1 && a.every((v, i) => v === arr[i])) a.push(a.shift()); return a; };
const words = (t) => String(t).replace(/[«»،.:؛!؟]/g, ' ').split(/\s+/).filter(Boolean);

function play(d, g, head, counts) {
  const S2 = g.stations; const res = []; let i = 0, c = 0; const t0 = Date.now(); let tick;
  const praise = (k) => ['صح! 👏', 'برافو! 🌟', 'جامد! 🔥', 'بالظبط! ✨'][k % 4];
  const draw = () => {
    const s = S2[i]; const t = s.type || 'mcq'; const ttl = s.title && !/^المحطة/.test(s.title) ? s.title : '';
    const unit = g.theme === 'rainbow' ? 'المرحلة' : 'المحطة';
    const qt = t === 'fill' ? esc(s.q).replace(/(…+|\.{3,}|_{3,})/g, '<span class="blank">……</span>') : esc(s.q);
    APP.innerHTML = `<div class="view game ${g.theme || ''}">${head}<div class="xbar"><span class="gscore">⭐ ${ar(c)}</span><span id="xt">٠:٠٠</span></div><div id="gtr">${track(g, i, res)}</div>
      <section class="card gq" ${g.theme === 'rainbow' ? `style="--c:${RAIN[i % 7]}"` : ''}>${g.theme === 'rainbow' ? '' : `<div class="gem">${s.emoji}</div>`}<p class="qn">${unit} ${ar(i + 1)} من ${ar(S2.length)}${ttl ? `: <b>${esc(ttl)}</b>` : ''}</p><p class="qq">${qt}</p><div id="gbody"></div><div class="qexp" id="gx"></div></section></div>`;
    if (!reduce) $('.gq').animate([{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    const body = $('#gbody');
    // called once the station is finished: ok = star earned
    const done = (ok, msg, at) => {
      res[i] = ok; if (ok) c++; vibrate(ok ? 20 : [30, 60, 30]);
      if (ok && at) { const r = at.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 45); }
      $('#gx').innerHTML = `<p class="${ok ? 'good' : /^(تمام|وصّلتهم)/.test(msg || '') ? 'meh' : 'bad'}">${msg || (ok ? praise(i) : 'مش دي…')}</p>${s.explain ? `<small>${esc(s.explain)}</small>` : ''}
        <button class="btn ${i < S2.length - 1 ? 'primary' : 'red'} block" id="gn">${i < S2.length - 1 ? (g.theme === 'rainbow' ? 'المرحلة اللي بعدها ←' : 'المحطة اللي بعدها ←') : (g.theme === 'rainbow' ? 'كمّل القوس 🌈' : 'اطلع من الفلك 🏁')}</button>`;
      $('.gscore').textContent = `⭐ ${ar(c)}`; $('#gtr').innerHTML = track(g, i + 1, res);
      $('#gn').scrollIntoView?.({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      $('#gn').onclick = async () => {
        if (i < S2.length - 1) { i++; draw(); return; }
        clearInterval(tick); const dur = Math.round((Date.now() - t0) / 1000);
        if (counts) { try { await api.saveGame(d.n, c, S2.length, dur); } catch (e) { console.error(e); toast('مقدرناش نحفظ النتيجة'); } }
        finish(d, g, head, { c, t: S2.length, d: dur }, counts);
      };
    };
    if (t === 'mcq' || t === 'tf' || t === 'fill') {
      body.innerHTML = t === 'mcq' ? `<div class="opts">${s.options.map((o, k) => `<button class="opt" data-k="${k}"><span>${'أبجدهـ'[k] || ar(k + 1)}</span>${esc(o)}</button>`).join('')}</div>`
        : t === 'tf' ? `<div class="opts tf"><button class="opt" data-b="1"><span>✓</span>صح</button><button class="opt" data-b="0"><span>✗</span>غلط</button></div>`
          : `<div class="gfill"><input class="inp" id="gin" maxlength="60" autocomplete="off" placeholder="اكتب الإجابة"><button class="btn primary" id="gok">تمام</button></div>`;
      const answer = (val, btn) => {
        const ok = gradeOne(s, s.answer, val).got > 0;
        $$('.opt').forEach((x) => { x.disabled = true; const v = x.dataset.k != null ? +x.dataset.k : x.dataset.b === '1'; if (v === s.answer) x.classList.add('right'); });
        if (btn && !ok) btn.classList.add('wrong'); const gi = $('#gin'); if (gi) { gi.disabled = true; gi.classList.add(ok ? 'right' : 'wrong'); $('#gok').remove(); }
        const right = t === 'fill' ? String(s.answer).split('/')[0].trim() : null;
        done(ok, ok ? null : `مش دي…${right ? ` الإجابة: <b>${esc(right)}</b>` : ''}`, btn || gi);
      };
      $$('.opt[data-k]').forEach((b) => b.onclick = () => answer(+b.dataset.k, b));
      $$('.opt[data-b]').forEach((b) => b.onclick = () => answer(b.dataset.b === '1', b));
      const gin = $('#gin'); if (gin) { const go = () => { if (gin.value.trim()) answer(gin.value.trim()); }; $('#gok').onclick = go; gin.onkeydown = (e) => { if (e.key === 'Enter') go(); }; setTimeout(() => gin.focus(), 80); }
    } else if (t === 'order' || t === 'verse') {
      const target = t === 'verse' ? words(s.answer) : [...s.answer]; const N = target.length;
      const pool = shuffle(target.map((v, k) => ({ v, k })), d.n * 31 + i * 7 + N); const slots = Array(N).fill(null); const lock = Array(N).fill(false); let tries = 0;
      const paint = () => {
        const used = new Set(slots.filter(Boolean).map((x) => x.k));
        body.innerHTML = `<div class="${t === 'verse' ? 'vbuild' : 'obuild'}">${slots.map((x, k) => t === 'verse'
          ? (x ? `<button class="wt placed ${lock[k] ? 'lock' : ''}" data-s="${k}">${esc(x.v)}</button>` : `<span class="wt slot" data-s="${k}"></span>`)
          : `<div class="oslot ${x ? 'full' : ''} ${lock[k] ? 'lock' : ''}" data-s="${k}"><span class="on">${ar(k + 1)}</span>${x ? `<button class="oit" data-s="${k}">${esc(x.v)}</button>` : '<i>دوس على الحدث اللي مكانه هنا</i>'}</div>`).join('')}</div>
          <div class="${t === 'verse' ? 'vpool' : 'opool'}">${pool.map((x) => used.has(x.k) ? '' : `<button class="${t === 'verse' ? 'wt' : 'oit free'}" data-p="${x.k}">${esc(x.v)}</button>`).join('')}</div>
          ${slots.every(Boolean) && !lock.every(Boolean) ? '<button class="btn red block" id="gchk">اتأكد ✓</button>' : ''}`;
        $$('[data-p]', body).forEach((b) => b.onclick = () => { const x = pool.find((p) => p.k === +b.dataset.p); const e = slots.findIndex((q) => !q); if (e >= 0) { slots[e] = x; vibrate(8); paint(); } });
        $$('[data-s]', body).forEach((b) => b.onclick = (ev) => { ev.stopPropagation(); const k = +b.dataset.s; if (lock[k] || !slots[k]) return; slots[k] = null; paint(); });
        $('#gchk', body) && ($('#gchk', body).onclick = () => {
          tries++; let all = true;
          slots.forEach((x, k) => { if (x && x.v === target[k]) lock[k] = true; else { all = false; slots[k] = null; } });
          if (all) { paint(); done(tries === 1, tries === 1 ? praise(i) : `تمام كده ✓ (من محاولة رقم ${ar(tries)}، فمفيش نجمة المرة دي)`, body); return; }
          vibrate([30, 60, 30]); paint(); const n = lock.filter(Boolean).length;
          toast(n ? `${ar(n)} في مكانهم الصح 👍 كمّل الباقي` : 'ولا واحدة في مكانها… حاول تاني');
        });
      };
      paint();
    } else if (t === 'match') {
      const P = s.answer; const right = shuffle(P.map((p, k) => ({ v: p.b, k })), d.n * 17 + i); let selL = null, selR = null, miss = 0; const got = new Set();
      const paint = () => {
        body.innerHTML = `<div class="mgrid"><div class="mcol">${P.map((p, k) => `<button class="mit ${got.has(k) ? 'ok' : ''} ${selL === k ? 'sel' : ''}" data-l="${k}" ${got.has(k) ? `style="--mc:${RAIN[k % 7]}"` : ''}>${esc(p.a)}</button>`).join('')}</div>
          <div class="mcol">${right.map((x) => `<button class="mit ${got.has(x.k) ? 'ok' : ''} ${selR === x.k ? 'sel' : ''}" data-r="${x.k}" ${got.has(x.k) ? `style="--mc:${RAIN[x.k % 7]}"` : ''}>${esc(x.v)}</button>`).join('')}</div></div>
          <p class="hint" style="text-align:center">دوس على حاجة من اليمين، وبعدين اللي يخصها من الشمال</p>`;
        $$('[data-l]', body).forEach((b) => b.onclick = () => { const k = +b.dataset.l; if (got.has(k)) return; selL = k; check(b); });
        $$('[data-r]', body).forEach((b) => b.onclick = () => { const k = +b.dataset.r; if (got.has(k)) return; selR = k; check(b); });
      };
      const check = (b) => {
        if (selL == null || selR == null) { paint(); return; }
        if (selL === selR) { got.add(selL); vibrate(15); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 20); selL = selR = null; paint();
          if (got.size === P.length) done(miss === 0, miss === 0 ? praise(i) : `وصّلتهم كلهم ✓ بس غلطت ${ar(miss)} ${miss === 1 ? 'مرة' : 'مرات'}، فمفيش نجمة المرة دي`, body); }
        else { miss++; vibrate([30, 60, 30]); const wl = selL, wr = selR; selL = selR = null; paint(); $$(`[data-l="${wl}"],[data-r="${wr}"]`, body).forEach((x) => { x.classList.add('bad'); }); }
      };
      paint();
    }
    clearInterval(tick); tick = setInterval(() => { const x = $('#xt'); if (!x) return clearInterval(tick); x.textContent = clock(Math.round((Date.now() - t0) / 1000)); }, 1000);
  };
  draw();
}

function finish(d, g, head, r, counts) {
  const all = r.c === r.t; const ps = players(d.n); const rank = ps.findIndex((x) => x.u.phone === S.me.phone) + 1;
  APP.innerHTML = `<div class="view game">${head}<section class="card gend">${g.theme === 'rainbow' ? '' : `<div class="big">${all ? '🏆' : r.c >= r.t / 2 ? '🕊️' : '📖'}</div>`}
    ${g.theme === 'rainbow' ? rainbow(7, 7, true) : ''}<h1>${g.theme === 'rainbow' ? (all ? 'القوس كمل… والوعد ثابت! 🌈' : 'لوّنت القوس كله!') : all ? 'خرجت من الفلك!' : r.c >= r.t / 2 ? 'قربت توصل!' : 'الطوفان لسه مخلصش 😅'}</h1>
    <div class="gstars">${Array.from({ length: r.t }, (_, k) => `<i class="${k < r.c ? 'on' : ''}">★</i>`).join('')}</div>
    <p class="gres"><b>${ar(r.c)}</b> من ${ar(r.t)} في <b>${clock(r.d)}</b>${counts && rank ? `، ترتيبك <b>${ar(rank)}</b> من ${ar(ps.length)}` : ''}</p>
    ${counts ? '' : '<p class="sub">دي كانت للتسلية، نتيجتك الأولى هي اللي بتتحسب.</p>'}
    <p class="sub">${all ? 'ربنا يبارك قرايتك 🤍' : 'ارجع اقرا الأصحاح تاني… وهتلاقي الإجابات مستنياك.'}</p>
    <div class="actions"><a class="btn wa-btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`🎮 لعبة اليوم ${d.n} في «لأعرفه»: ${g.title}\nجبت ${r.c} من ${r.t} ⭐ في ${Math.floor(r.d / 60)}:${String(r.d % 60).padStart(2, '0')}\nتقدر تغلبني؟ 😉\n${location.href.split('#')[0]}#/game/${d.n}`)}">${ICON.wa} تحدّى صحابك</a>${all ? '' : `<a class="btn ghost" href="#/read/${d.n}">اقرا تاني</a>`}</div></section>
    ${boardHTML(d.n, g)}</div>`;
  if (all) setTimeout(() => burst(innerWidth / 2, 200, 160), 250);
}

function boardHTML(n, g) {
  const ps = players(n); if (!ps.length) return '';
  const meI = ps.findIndex((x) => x.u.phone === S.me.phone); const medal = (k) => ['🥇', '🥈', '🥉'][k] || ar(k + 1);
  const row = ({ u, r }, k) => `<li class="${u.phone === S.me.phone ? 'me' : ''} ${k < 3 ? 'top' : ''}"><span class="md">${medal(k)}</span>${avatar(u.name, 30)}<span class="hn">${esc(first(u.name))}</span><span class="hs">${ar(r.c)}<small>/${ar(r.t)}</small></span><span class="ht">${clock(r.d || 0)}</span></li>`;
  return `<section class="card honor-card gold"><h2>${g && g.theme === 'rainbow' ? '🌈 أول من لوّن القوس' : '🛶 أول الخارجين من الفلك'}</h2><p class="sub">${ar(ps.length)} لعبوا</p><ol class="honor">${ps.slice(0, 10).map(row).join('')}</ol>${meI >= 10 ? `<ol class="honor" start="${meI + 1}">${row(ps[meI], meI)}</ol>` : ''}</section>`;
}

function board(d, g, head, mine) {
  APP.innerHTML = `<div class="view game">${head}<section class="card gend">${g.theme === 'rainbow' ? rainbow(7, 7, true) : `<div class="big">${mine.c === mine.t ? '🏆' : '🕊️'}</div>`}<h1>${esc(g.title)}</h1>
    <div class="gstars">${Array.from({ length: mine.t }, (_, k) => `<i class="${k < mine.c ? 'on' : ''}">★</i>`).join('')}</div>
    <p class="gres">نتيجتك: <b>${ar(mine.c)}</b> من ${ar(mine.t)} في <b>${clock(mine.d || 0)}</b></p>
    <p class="sub">اللعبة بتتلعب مرة واحدة بس 🔒</p><div class="actions"><a class="btn ghost" href="#/games">كل الألعاب</a></div></section>${boardHTML(d.n, g)}</div>`;
}
