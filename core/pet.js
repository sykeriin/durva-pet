/* Durva Pet engine. One file, no dependencies. Used by the Chrome extension and the desktop app.
   const pet = DurvaPet.create({ root, adapter, state });  root = element (or shadow root) to render into.
   Sprites come from window.DURVA_SPRITES (data URIs, built by scripts/sync.mjs) so they can be recoloured on a canvas. */
(function (global) {
  'use strict';

  /* ---------- what he can do ---------- */
  const ACTS = {
    idle: { f: ['idle', 'idle', 'idle', 'idle2'], ms: 700 },
    walk: { f: ['walk1', 'walk2'], ms: 190 },
    wave: { f: ['wave1', 'wave2'], ms: 260, dur: 3000 },
    tea: { f: ['tea1', 'tea2', 'tea2', 'sip', 'tea2', 'tea1'], ms: 850, dur: 14000 },
    coffee: { f: ['coffee1', 'coffee2', 'coffee3', 'coffee2', 'coffee1'], ms: 850, dur: 14000 },
    hot: { f: ['hot1', 'hot2', 'hot3', 'hot2', 'hot1'], ms: 850, dur: 14000 },
    water: { f: ['water1', 'water2', 'water3', 'water2', 'water1'], ms: 800, dur: 10000 },
    cookie: { f: ['cookie1', 'cookie2', 'cookie3', 'cookie2', 'cookie3', 'cookie1'], ms: 750, dur: 12000 },
    pizza: { f: ['pizza1', 'pizza2', 'pizza2', 'pizza1', 'pizza2'], ms: 800, dur: 12000 },
    read: { f: ['read1', 'read2'], ms: 1500, dur: 16000 },
    work: { f: ['laptop', 'laptop2'], ms: 480, dur: 16000 },
    busy: { f: ['laptop', 'laptop2', 'laptop', 'headphones'], ms: 520, dur: 30000 },
    sleep: { f: ['sleep1', 'sleep2'], ms: 1100, dur: 15000 },
    dance: { f: ['dance1', 'dance2', 'dance3', 'pop1', 'pop2', 'step1', 'step2'], ms: 250, dur: 7000 },
    guitar: { f: ['guitar1', 'guitar2'], ms: 280, dur: 9000 },
    drums: { f: ['dL', 'dR', 'dL', 'dK'], ms: 210, dur: 8000 },
    music: { f: ['headphones', 'focus', 'headphones', 'focus'], ms: 900, dur: 14000 },
    box: { f: ['guard', 'guard', 'kick', 'guard'], ms: 380, dur: 6000 },
    floss: { f: ['floss1', 'floss2'], ms: 200, dur: 5000 },
    moon: { f: ['moon1', 'moon2'], ms: 260, dur: 5000 },
    jump: { f: ['jump', 'idle'], ms: 320, dur: 1400 },
    love: { f: ['love'], ms: 600, dur: 2600 },
    idea: { f: ['idea'], ms: 600, dur: 2600 },
    sweat: { f: ['sweat'], ms: 600, dur: 2400 },
    point: { f: ['point'], ms: 600, dur: 2600 },
    wink: { f: ['wink'], ms: 600, dur: 1500 },
    kiss: { f: ['kiss'], ms: 600, dur: 1500 },
    rose: { f: ['rose', 'flirt'], ms: 500, dur: 2600 },
    flirt: { f: ['wink', 'kiss', 'rose', 'flirt'], ms: 700, dur: 4200 },
    thwip: { f: ['thwip'], ms: 600, dur: 1500 },
    climb: { f: ['climb1', 'climb2'], ms: 240, dur: 4000, noflip: true },
    hang: { f: ['hang1', 'hang2'], ms: 700, dur: 7000 },
    crouch: { f: ['crouch'], ms: 600, dur: 3000 },
    flex: { f: ['flex'], ms: 600, dur: 2000 },
    shrug: { f: ['shrug'], ms: 600, dur: 2000 },
    facepalm: { f: ['facepalm'], ms: 600, dur: 2200 },
    clap: { f: ['clap', 'idle'], ms: 260, dur: 2400 },
    salute: { f: ['salute'], ms: 600, dur: 2000 },
    think: { f: ['think'], ms: 600, dur: 2400 },
    phone: { f: ['phone'], ms: 600, dur: 4000 },
    cool: { f: ['cool'], ms: 600, dur: 4000 },
    yawn: { f: ['yawn'], ms: 600, dur: 2400 }
  };

  /* menu groups: [act key, label]. Keys that are not in ACTS are handled specially in doAct(). */
  const GROUPS_UI = [
    ['Sip & snack', [['tea', '🍵 Chai'], ['coffee', '☕ Coffee'], ['hot', '🍫 Hot choc'], ['water', '💧 Water'], ['cookie', '🍪 Cookie'], ['pizza', '🍕 Pizza']]],
    ['Brain mode', [['lockin', '🔒 Lock in!'], ['work', '💻 Laptop'], ['read', '📖 Read'], ['music', '🎧 Headphones'], ['busy', '🙉 Busy, ignore me'], ['lookaway', '👀 Look away']]],
    ['Chaos', [['flirt', '😘 Flirt'], ['steal', '🥷 Steal a line'], ['spider', '🕷️ Spidey mode'], ['hang', '🧗 Hang around'], ['offscreen', '🚪 Step out']]],
    ['Show off', [['wave', '👋 Wave'], ['dance', '💃 Dance'], ['guitar', '🎸 Guitar'], ['drums', '🥁 Drums'], ['floss', '🕺 Floss'], ['moon', '🌙 Moonwalk'], ['box', '🥊 Box'], ['flex', '💪 Flex'], ['cool', '😎 Cool'], ['sleep', '😴 Nap']]]
  ];
  const DRINKS = ['tea', 'coffee', 'hot', 'water', 'cookie', 'pizza'];

  const LINES = {
    poke: ['Ow. Rude.', 'I have a meeting. With a sandwich.', 'Careful, I am load-bearing.', 'Do not touch the talent.', 'Stop. I am blushing in hex.', 'Plot twist: I am 32 pixels wide.', 'Yes? No? Maybe cache it?', 'I put the fun in function. Barely.', 'Hello! This is a recording.', 'Sorry, I only speak fluent TODO.', 'I was thinking. Allegedly.', 'You clicked me. Bold move.'],
    annoyed: ['That’s IT. Put the cursor down.', 'I will unionise the pixels.', 'Five pokes. Five. I counted.', 'One more and I am calling HR.'],
    pet: ['Okay that is actually nice.', 'Good cursor.', 'Keep going. I am fine. Totally fine.'],
    tea: ['Chai is a personality.', 'Sipping. Do not disturb.', 'This is the good tea.', 'Hot. Very hot. I am fine.'],
    coffee: ['Coffee first. Opinions later.', 'This is my fourth. Do not count.', 'Caffeine: the only dependency I trust.', 'I run on beans and spite.'],
    hot: ['Hot chocolate. Marshmallows are non-negotiable.', 'Cosy mode: engaged.', 'Sweet, hot, and slightly burnt tongue.'],
    water: ['Water. Remember it? Go drink some.', 'Hydration check. Yours too.', 'Glug glug. Your turn.'],
    cookie: ['Cookies accepted. All of them.', 'I only accept cookies in this form.', 'Crumbs in the keyboard are a feature.'],
    pizza: ['Pizza is a food group. I checked.', 'Do not ask how many slices.', 'Cold pizza is still pizza.'],
    work: ['Typing very important things.', 'It compiles. Do not ask how.', 'Ship it. Fix it later.', 'Stack Overflow, take the wheel.'],
    read: ['Chapter one. Again.', 'Reading, allegedly.', 'This book has no dark mode.'],
    sleep: ['Five more minutes.', 'zzz... merge conflict... zzz', 'Do not wake the developer.', 'Eye mask on. World off.'],
    music: ['Do not talk to me, song is good.', 'Volume at a responsible 11.'],
    dance: ['I have no rhythm and full confidence.', 'Choreographed. By nobody.'],
    idle: ['Anyone want to hear me ramble?', 'Hydrate. I am serious.', 'Posture check. Mine is gone.', 'Stretch your neck. I will wait.', 'Have you committed lately?', 'Blink. You forgot to.', 'Looking good out there.', 'I live in your browser rent free.'],
    night: ['It is late. Sleep exists.', 'Go to bed, gremlin.', 'Nothing good compiles after 2 AM.'],
    focusStart: ['Locked in. Go.', 'Focus time. I will guard the tab.', 'Heads down. I will not judge.'],
    breakStart: ['Break! Snack o’clock.', 'Stand up. Stretch. Water.', 'You earned this. Sip something.'],
    done: ['Time!', 'That is the timer. Do something about it.'],
    hello: ['Hi! I live here now.', 'Hello again!'],
    flirt: ['Is that a cursor, or are you just happy to see me?', 'You up? Your cursor is.', 'I would call you cute, but I only have 32 pixels to do it with.', 'Are you a semicolon? Because without you my code breaks.', 'Come here often? Same tab, every day.', 'Roses are red, my hex is #c9a57c, you are in my viewport and I am not mad about it.', 'You had me at “Allow notifications”.', 'Are you cache? Because I keep coming back to you.'],
    steal: ['“Talk is cheap. Show me the code.” Linus. Borrowed.', '“Make it work, make it right, make it fast.” Kent Beck. Stolen. Returned slightly bent.', '“Premature optimisation is the root of all evil.” Knuth. I am just holding it.', '“Stay hungry, stay foolish.” Not mine. Very good though.', '“I think, therefore I am.” Descartes. Sorry Rene, I need it.', 'Stole this one from a fortune cookie: “Your bug is in the other file.”', '“Move fast and break things.” Stolen, then broke it.', 'Pickup line, stolen off a mug: “You are my favourite exception.”', '“The best code is no code.” Someone clever said that. I am just wearing it.'],
    lockin: ['Lock in. Phone face down. Tab count: one.', 'Close the 14 tabs. I see you.', 'Study now, doomscroll later. I will remind you.', 'Ten minutes. Just ten. Then we negotiate.', 'Future you is watching. Make them proud.', 'Notes out. Brain on. Let us go.', 'You can do hard things. Starting with this one.', 'Lock in. I am right here, studying alongside you. Quietly.'],
    busy: ['...', '(typing loudly)', 'Not now. In a flow.', 'I can hear you. I choose not to.', 'Headphones are on. That is a sign.', 'Mm-hm. (I did not hear a word.)'],
    busyBreak: ['Fine. FINE. Hi. What.', 'Okay okay, I surrender. Hello.', 'You win. Break time, I guess.'],
    lookaway: ['20-20-20: look at something 20 feet away for 20 seconds.', 'Eyes off the screen. Look out of the window. I will wait.', 'Blink. Look far. Your eyes will thank you.'],
    back: ['Back. Missed me?', 'I went for water. It was fine.', 'Did anything happen? Nothing important, I hope.', 'Ta-da. I returned.'],
    spider: ['Thwip! With great power comes great procrastination.', 'Friendly neighbourhood browser pet.', 'Wall-crawling. It is a lifestyle.'],
    hang: ['Just hanging around.', 'Hang in there.', 'Nothing to see up here. Just me.']
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

  /* ---------- outfits: colours are swapped on the sprite at runtime ---------- */
  const GROUPS = { shirt: ['#d6cec1'], pants: ['#28282d'], shoes: ['#f0eae0'], hair: ['#221b15', '#181412'], skin: ['#c9a57c', '#b08c65'] };
  const OUTFITS = [
    { id: 'classic', name: 'Classic', c: {} },
    { id: 'tomato', name: 'Tomato', c: { shirt: '#e0452f', pants: '#28282d', shoes: '#f0eae0' } },
    { id: 'ocean', name: 'Ocean', c: { shirt: '#5aa9e6', pants: '#1f3a5f', shoes: '#ffffff' } },
    { id: 'matcha', name: 'Matcha', c: { shirt: '#9ccc65', pants: '#33402a', shoes: '#f4f2ec' } },
    { id: 'sakura', name: 'Sakura', c: { shirt: '#f7b6c8', pants: '#7a4a63', shoes: '#ffffff' } },
    { id: 'midnight', name: 'Midnight', c: { shirt: '#3a3a6a', pants: '#101018', shoes: '#9aa0ff' } },
    { id: 'sunset', name: 'Sunset', c: { shirt: '#ff9a3c', pants: '#7a2e5a', shoes: '#ffe6a8' } },
    { id: 'spidey', name: 'Spidey', c: { shirt: '#d32f2f', pants: '#1c3f94', shoes: '#d32f2f', skin: '#d32f2f', hair: '#7a1515' } }
  ];
  const CUSTOM0 = { shirt: '#d6cec1', pants: '#28282d', shoes: '#f0eae0', hair: '#221b15' };
  const h2 = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const x2 = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  function colorMap(o) {
    const m = new Map();
    for (const g in GROUPS) { const t = o[g]; if (!t) continue; const b0 = h2(GROUPS[g][0]), t0 = h2(t); GROUPS[g].forEach(b => { const bb = h2(b); m.set(b, [0, 1, 2].map(i => bb[i] + t0[i] - b0[i])); }); }
    return m;
  }

  const CSS = `
:host{all:initial}
.dp{position:fixed;left:0;bottom:0;z-index:2147483646;user-select:none;-webkit-user-select:none;touch-action:none;font-family:"Pixelify Sans",ui-rounded,"Nunito","Segoe UI",system-ui,sans-serif}
.dp.desk{position:absolute}
.dp img{display:block;image-rendering:pixelated;cursor:grab;filter:drop-shadow(0 3px 0 rgba(0,0,0,.18));-webkit-user-drag:none}
.dp.drag img{cursor:grabbing}
.dp.swing{transform-origin:50% 0;animation:dpsw 1.8s ease-in-out infinite}
@keyframes dpsw{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
.dp .bub{position:absolute;bottom:100%;left:50%;max-width:230px;min-width:60px;width:max-content;transform:translate(-50%,-6px) scale(.9);opacity:0;transition:opacity .15s,transform .15s;pointer-events:none;background:#fff8ef;color:#2b2230;border:2.5px solid #2b2230;border-radius:14px;padding:7px 11px;font-size:13px;font-weight:700;line-height:1.3;text-align:center;box-shadow:3px 3px 0 #2b2230}
.dp.ceil .bub{bottom:auto;top:100%;transform:translate(-50%,6px) scale(.9)}
.dp .bub.on{opacity:1;transform:translate(-50%,-6px) scale(1)}
.dp.ceil .bub.on{transform:translate(-50%,6px) scale(1)}
.dp .chip{position:absolute;top:100%;left:50%;transform:translate(-50%,2px);background:#2b2230;color:#fff8ef;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;letter-spacing:.04em;white-space:nowrap;display:none}
.dp .chip.on{display:block}
.dp .chip.focus{background:#e0453a}.dp .chip.rest{background:#2f9e6b}
.dp .menu{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:10px;background:#fff8ef;color:#2b2230;border:3px solid #2b2230;border-radius:20px;box-shadow:5px 5px 0 #2b2230;padding:10px;display:none;width:272px;max-height:min(400px,72vh);overflow:auto;z-index:2;font-size:12px}
.dp.ceil .menu{bottom:auto;top:100%;margin:10px 0 0}
.dp .menu.on{display:block}
.dp .menu *{box-sizing:border-box;font-family:inherit}
.dp .mh{display:flex;align-items:center;gap:6px;margin:0 2px 8px}
.dp .mh b{font-size:15px;letter-spacing:.02em}.dp .mh i{font-style:normal;color:#9a7f9e;font-size:11px;font-weight:700;flex:1}
.dp .menu .x{border:0;background:#ffd2dc;border-radius:50%;width:22px;height:22px;line-height:20px;text-align:center;padding:0;cursor:pointer;font-size:14px;color:#2b2230;font-weight:800}
.dp .tabs{display:flex;gap:4px;background:#f4e8da;border-radius:999px;padding:3px;margin-bottom:8px}
.dp .tabs button{flex:1;border:0;background:none;border-radius:999px;padding:5px 0;font-weight:800;font-size:12px;color:#8a6f8e;cursor:pointer}
.dp .tabs button.on{background:#2b2230;color:#fff8ef}
.dp .menu h4{margin:9px 3px 5px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#a58aa8;font-weight:800}
.dp .menu .row{display:flex;flex-wrap:wrap;gap:5px}
.dp .menu .row button{font-weight:800;font-size:12px;line-height:1;border:2px solid #2b2230;background:#ffd9e4;border-radius:999px;padding:6px 9px;cursor:pointer;color:#2b2230;box-shadow:0 2px 0 #2b2230;transition:transform .08s}
.dp .menu .row button:nth-child(5n+2){background:#c8f0dc}.dp .menu .row button:nth-child(5n+3){background:#fff0b8}.dp .menu .row button:nth-child(5n+4){background:#ddd2ff}.dp .menu .row button:nth-child(5n+5){background:#ffdcc0}
.dp .menu .row button:hover{transform:translateY(-1px)}.dp .menu .row button:active{transform:translateY(2px);box-shadow:none}
.dp .menu .row button.big{background:#e0453a;color:#fff8ef}
.dp .menu .row button.on{background:#2b2230;color:#fff8ef}
.dp .menu input[type=number]{width:56px;font-weight:800;font-size:12px;border:2px solid #2b2230;border-radius:999px;padding:5px 8px;background:#fff;color:#2b2230}
.dp .sw{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.dp .sw button{border:2.5px solid #2b2230;border-radius:14px;padding:0;height:44px;cursor:pointer;overflow:hidden;position:relative;background:#fff;box-shadow:0 2px 0 #2b2230}
.dp .sw button.on{outline:3px solid #ff7aa2;outline-offset:1px}
.dp .sw button span{position:absolute;left:0;right:0;height:25%}
.dp .sw button em{position:absolute;bottom:2px;left:0;right:0;text-align:center;font:800 9px/1 inherit;font-style:normal;color:#2b2230;background:rgba(255,248,239,.85)}
.dp .pick{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}
.dp .pick label{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;font-weight:800;color:#8a6f8e}
.dp .pick input{width:100%;height:30px;border:2px solid #2b2230;border-radius:10px;padding:0;background:none;cursor:pointer}`;

  function create(opts) {
    const A = opts.adapter || {}, SPR = global.DURVA_SPRITES || {};
    const desk = typeof A.moveBy === 'function';
    const doc = (opts.root.ownerDocument || document);
    const st = doc.createElement('style'); st.textContent = CSS; opts.root.appendChild(st);
    const host = doc.createElement('div'); host.className = 'dp' + (desk ? ' desk' : '');
    host.innerHTML = '<div class="bub"></div><img alt="Durva" draggable="false"><div class="chip"></div><div class="menu"></div>';
    opts.root.appendChild(host);
    const img = host.querySelector('img'), bub = host.querySelector('.bub'), chip = host.querySelector('.chip'), menu = host.querySelector('.menu');

    const S = { scale: 3, sound: false, visible: true, wander: true, outfit: 'classic', custom: { ...CUSTOM0 }, cat: false, nag: true, ...(opts.state || {}) };
    S.custom = { ...CUSTOM0, ...(S.custom || {}) };
    let timer = null, act = 'idle', actUntil = 0, fi = 0, lastTick = 0, lastFrame = 0, x = (opts.state && opts.state.x != null ? opts.state.x : 40), y = 0, dir = 1, target = null, walking = false;
    let pokes = [], bubT = 0, nextAuto = performance.now() + 4000, drag = null, hoverT = 0, ctx = '', alive = true, pose = '', want = '';
    let pos = 'floor', side = 'L', seq = null, away = 0, leave = null, busyUntil = 0, busyPokes = 0, tempOutfit = null, tab = 'do';
    let nagAt = performance.now() + (15 + Math.random() * 10) * 60000;

    /* ---------- sprites + outfits ---------- */
    const cache = new Map(); let okey = '', colors = new Map();
    const effOutfit = () => tempOutfit ? (OUTFITS.find(o => o.id === tempOutfit) || OUTFITS[0]).c : S.outfit === 'custom' ? S.custom : (OUTFITS.find(o => o.id === S.outfit) || OUTFITS[0]).c;
    function source(n) { return (S.cat && SPR[n + '-cat']) || SPR[n] || (opts.spriteUrl ? opts.spriteUrl(n) : ''); }
    function render(n, cb) {
      const key = okey + '|' + n; if (cache.has(key)) return cb(cache.get(key));
      const base = source(n); if (!colors.size || !base || base.indexOf('data:') !== 0) { cache.set(key, base); return cb(base); }
      const im = new Image();
      im.onload = () => {
        const c = doc.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
        for (let i = 0; i < p.length; i += 4) { if (p[i + 3] < 128) continue; const m = colors.get(x2([p[i], p[i + 1], p[i + 2]])); if (m) { p[i] = Math.max(0, Math.min(255, m[0])); p[i + 1] = Math.max(0, Math.min(255, m[1])); p[i + 2] = Math.max(0, Math.min(255, m[2])); } }
        g.putImageData(d, 0, 0); const u = c.toDataURL(); cache.set(key, u); cb(u);
      };
      im.src = base;
    }
    function refreshOutfit() {
      const o = effOutfit(); okey = JSON.stringify([o, S.cat]); colors = colorMap(o);
      const cur = pose; pose = ''; if (cur) setFrame(cur);
      let i = 0; const names = [...new Set(Object.values(ACTS).flatMap(a => a.f))]; (function warm() { for (let k = 0; k < 6 && i < names.length; k++, i++) render(names[i], () => {}); if (i < names.length) setTimeout(warm, 16); })();
    }
    const save = () => A.save && A.save({ ...S, x, y });
    const size = () => { img.style.width = 32 * S.scale + 'px'; img.style.height = 48 * S.scale + 'px'; };
    const vw = () => (A.width ? A.width() : innerWidth), vh = () => (A.height ? A.height() : innerHeight), petW = () => 32 * S.scale, petH = () => 48 * S.scale;
    function place() {
      if (desk) { host.style.left = '50%'; host.style.bottom = '0'; host.style.transform = 'translateX(-50%)'; return; }
      host.style.transform = '';
      const up = pos === 'top' || pos === 'ceil';
      host.classList.toggle('ceil', up); host.classList.toggle('swing', pos === 'ceil' || pos === 'top');
      if (up) { host.style.bottom = 'auto'; host.style.top = '0'; host.style.left = x + 'px'; }
      else { host.style.top = 'auto'; host.style.bottom = y + 'px'; host.style.left = (pos === 'wall' ? (side === 'L' ? 0 : vw() - petW()) : x) + 'px'; }
    }
    function setFrame(n) {
      if (n !== pose) { pose = n; want = n; render(n, u => { if (want === n && u) img.src = u; }); }
      const t = []; if (dir < 0 && !(ACTS[act] && ACTS[act].noflip) && pos !== 'ceil') t.push('scaleX(-1)'); if (pos === 'ceil') t.push('rotate(180deg)');
      img.style.transform = t.join(' ');
    }

    function say(text, ms) { bub.textContent = text; bub.classList.add('on'); clearTimeout(bubT); bubT = setTimeout(() => bub.classList.remove('on'), ms || 2800 + text.length * 40); }
    function setAct(name, dur) { if (!ACTS[name]) return; act = name; fi = 0; lastFrame = 0; actUntil = dur === 0 ? Infinity : performance.now() + (dur || ACTS[name].dur || 4000); walking = name === 'walk'; }
    function floor() { pos = 'floor'; y = 0; host.classList.remove('swing'); place(); }
    function cancelSeq() { if (seq && seq.timer) clearInterval(seq.timer); seq = null; if (tempOutfit) { tempOutfit = null; refreshOutfit(); } if (pos !== 'floor') floor(); leave = null; }

    /* ---------- tiny sequence runner ---------- */
    function run(steps) { cancelSeq(); seq = { steps, i: -1, until: 0 }; advance(); }
    function advance() {
      if (!seq) return; if (seq.timer) { clearInterval(seq.timer); seq.timer = 0; }
      const s = seq.steps[++seq.i];
      if (!s) { seq = null; if (tempOutfit) { tempOutfit = null; refreshOutfit(); } floor(); setAct('idle', 1500); return; }
      if (s.fn) s.fn();
      if (s.a) setAct(s.a, s.d || 2000);
      if (s.s) say(typeof s.s === 'function' ? s.s() : s.s, s.ms);
      seq.until = performance.now() + (s.d || 2000);
      if (s.walkto !== undefined) { const t = s.walkto(); if (desk) { target = { dx: t, got: 0 }; dir = t < 0 ? -1 : 1; } else { target = t; dir = t < x ? -1 : 1; } setAct('walk', 0); seq.until = Infinity; }
      if (s.climb) seq.until = Infinity;
      if (s.count) { let n = s.count; seq.timer = setInterval(() => { n--; if (n > 0) say('Eyes away… ' + n, 1400); else { clearInterval(seq.timer); seq.timer = 0; } }, 1000); }
    }

    /* ---------- timer ---------- */
    const timerSave = () => A.setTimer && A.setTimer(timer);
    function startTimer(kind, minutes, label) {
      const now = Date.now(), total = Math.round(minutes * 60000);
      timer = { kind, label: label || '', startedAt: now, endsAt: kind === 'stopwatch' ? 0 : now + total, total: kind === 'stopwatch' ? 0 : total, round: timer && timer.round || 0 };
      timerSave(); onTimerStart();
    }
    function onTimerStart() { if (!timer) return; cancelSeq(); setAct(timer.kind === 'break' ? pick(DRINKS) : 'work', 0); say(pick(timer.kind === 'break' ? LINES.breakStart : LINES.focusStart)); }
    function stopTimer(silent) { timer = null; timerSave(); setAct('idle', 0); if (!silent) say('Timer stopped. No judgement.'); }
    function timerDone() {
      const t = timer; if (!t) return;
      if (A.leader && !A.leader()) return;
      const next = t.kind === 'focus' && t.pomo ? { kind: 'break', min: t.pomo.rest } : t.kind === 'break' && t.pomo ? { kind: 'focus', min: t.pomo.work } : null;
      if (A.notify) A.notify(t.kind === 'focus' ? 'Focus time is up' : 'Timer done', t.kind === 'focus' ? 'Take a break. Drink something.' : 'Back to it?');
      setAct('jump'); say(t.kind === 'focus' ? 'Focus done! Break time.' : pick(LINES.done), 4200);
      if (next) { const pomo = t.pomo, round = (t.round || 0) + (t.kind === 'focus' ? 1 : 0); setTimeout(() => { startTimer(next.kind, next.min); timer.pomo = pomo; timer.round = round; timerSave(); }, 2200); }
      else { timer = null; timerSave(); }
    }
    function pomodoro(work, rest) { startTimer('focus', work || 25); timer.pomo = { work: work || 25, rest: rest || 5 }; timerSave(); }
    const timerFace = () => { if (!timer) return act; const left = timer.kind === 'stopwatch' ? 0 : timer.endsAt - Date.now(); if (timer.kind === 'break') return DRINKS.includes(act) || act === 'dance' || act === 'guitar' || act === 'music' ? act : pick(DRINKS); if (timer.kind === 'focus' && left > 0 && !['read', 'work', 'busy', 'jump', 'sweat', 'love', 'music'].includes(act)) return 'work'; return act; };

    /* ---------- special acts ---------- */
    function stepOut() {
      cancelSeq(); const left = desk ? Math.random() < .5 : x < vw() / 2;
      const edge = left ? -petW() - 24 : vw() + 24;
      leave = { left, dx: desk ? (left ? -1 : 1) * 520 : 0, phase: 'out' };
      say(pick(['Brb.', 'Going for water.', 'Touching grass. Back soon.', 'Stepping out. Do not touch my stuff.']), 2200);
      setAct('walk', 0); dir = left ? -1 : 1;
      if (desk) target = { dx: leave.dx, got: 0 }; else target = edge;
    }
    function spider() {
      const nearL = desk ? true : x < vw() / 2, wallX = nearL ? 0 : vw() - petW();
      const steps = [{ fn: () => { tempOutfit = 'spidey'; refreshOutfit(); }, a: 'thwip', d: 1500, s: () => pick(LINES.spider), ms: 3200 }];
      if (desk) { steps.push({ a: 'climb', d: 2600 }, { a: 'crouch', d: 1400 }, { a: 'cool', d: 3000, s: 'Spidey sense: tingling.' }); }
      else {
        steps.push({ walkto: () => wallX },
          { fn: () => { pos = 'wall'; side = nearL ? 'L' : 'R'; dir = nearL ? 1 : -1; x = wallX; y = 0; place(); }, a: 'climb', d: 0, climb: true },
          { fn: () => { pos = 'ceil'; x = Math.max(0, Math.min(vw() - petW(), nearL ? 20 : vw() - petW() - 20)); place(); }, a: 'idle', d: 6500, s: 'Upside down, still cool.', ms: 3200 },
          { fn: () => { floor(); x = Math.max(0, Math.min(vw() - petW(), x)); place(); }, a: 'jump', d: 1400, s: 'And… scene.' });
      }
      run(steps);
    }
    function hang() {
      if (desk) return run([{ a: 'hang', d: 6000, s: () => pick(LINES.hang) }, { a: 'jump', d: 1200 }]);
      run([{ fn: () => { pos = 'top'; x = Math.max(0, Math.min(vw() - petW(), x)); place(); }, a: 'hang', d: 7000, s: () => pick(LINES.hang), ms: 3200 }, { fn: () => { floor(); }, a: 'jump', d: 1300, s: 'Dropped in.' }]);
    }
    function doAct(k) {
      cancelSeq(); walking = false; busyUntil = 0; nextAuto = performance.now() + 4000;
      if (k === 'spider') return spider(); if (k === 'hang') return hang(); if (k === 'offscreen') return stepOut();
      if (k === 'flirt') return run([{ a: 'wink', d: 1500, s: () => pick(LINES.flirt), ms: 4200 }, { a: 'kiss', d: 1500 }, { a: 'rose', d: 3000, s: () => pick(LINES.flirt), ms: 4200 }]);
      if (k === 'steal') return run([{ a: 'think', d: 1500, s: 'Hmm. Let me borrow something…' }, { a: 'cool', d: 6200, s: () => pick(LINES.steal), ms: 5800 }]);
      if (k === 'lockin') return run([{ a: 'point', d: 2600, s: () => pick(LINES.lockin), ms: 4600 }, { a: 'flex', d: 1500 }, { a: 'work', d: 12000, s: 'Right there with you. Quietly.' }]);
      if (k === 'lookaway') return run([{ a: 'point', d: 2600, s: () => pick(LINES.lookaway), ms: 4200 }, { a: 'cool', d: 20000, count: 20, s: 'Eyes away… 20', ms: 1400 }, { a: 'clap', d: 2200, s: 'Good eyes. Carry on.' }]);
      if (k === 'busy') { busyUntil = performance.now() + 30000; busyPokes = 0; setAct('busy', 30000); say(pick(LINES.busy)); return; }
      if (!ACTS[k]) return; setAct(k); if (LINES[k]) say(pick(LINES[k]));
    }

    /* ---------- life ---------- */
    function chooseAuto() {
      const h = new Date().getHours(), late = h >= 23 || h < 5, roll = Math.random();
      const bag = [['idle', 3], ['walk', S.wander ? 4 : 0], ['tea', 1.4], ['coffee', 1.2], ['hot', .6], ['water', .8], ['cookie', .7], ['pizza', .3], ['read', 1.3], ['work', 2], ['music', 1], ['dance', .6], ['guitar', .7], ['floss', .3], ['moon', .3], ['think', .5], ['flex', .3], ['cool', .3], ['yawn', .4], ['sleep', late ? 5 : .5]];
      if (S.wander) bag.push(['hang', .25], ['spider', .12], ['offscreen', .2]);
      if (ctx === 'work') bag.push(['work', 5]); if (ctx === 'read') bag.push(['read', 5]); if (ctx === 'music') bag.push(['music', 5]);
      const tot = bag.reduce((a, b) => a + b[1], 0); let r = roll * tot; let nm = 'idle'; for (const [n, w] of bag) { r -= w; if (r <= 0) { nm = n; break; } }
      if (nm === 'walk') { const W = desk ? 360 : Math.max(0, vw() - petW() - 16); target = desk ? (Math.random() < .5 ? -1 : 1) * (60 + Math.random() * 160) : 8 + Math.random() * W; setAct('walk', 0); dir = (desk ? target : target - x) < 0 ? -1 : 1; if (desk) target = { dx: target, got: 0 }; return; }
      if (nm === 'hang' || nm === 'spider' || nm === 'offscreen') return doAct(nm);
      setAct(nm, nm === 'idle' ? 2500 + Math.random() * 4000 : undefined);
      if (Math.random() < .45 && LINES[nm]) say(pick(LINES[nm]));
      else if (nm === 'idle' && Math.random() < .25) say(pick(h >= 23 || h < 5 ? LINES.night : LINES.idle));
    }
    function nag() {
      nagAt = performance.now() + (18 + Math.random() * 14) * 60000;
      if (!S.nag || !S.visible || (A.leader && !A.leader())) return;
      const r = Math.random();
      if (timer && timer.kind === 'focus') return doAct(r < .5 ? 'water' : 'lookaway');
      doAct(r < .35 ? 'water' : r < .7 ? 'lookaway' : 'lockin');
    }

    function frameStep(now) {
      const a = ACTS[act] || ACTS.idle, f = a.f;
      if (now - lastFrame >= a.ms) { lastFrame = now; fi = (fi + 1) % f.length; }
      setFrame(f[fi % f.length]);
    }
    function loop(now) {
      if (!alive) return; requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - (lastTick || now)) / 1000); lastTick = now;
      if (!S.visible) { host.style.display = 'none'; return; } host.style.display = '';
      /* out of sight for a bit */
      if (away) {
        if (now < away) { host.style.visibility = 'hidden'; return; }
        away = 0; host.style.visibility = ''; bub.classList.remove('on');
        if (desk) { target = { dx: -leave.dx, got: 0 }; dir = -Math.sign(leave.dx); } else { x = leave.left ? -petW() : vw(); const home = 20 + Math.random() * Math.max(0, vw() - petW() - 40); target = home; dir = x < home ? 1 : -1; place(); }
        leave.phase = 'in'; setAct('walk', 0); walking = true; say(pick(LINES.back), 3200);
      }
      if (drag && drag.moved) { setFrame('jump'); return; }
      /* timer */
      if (timer) {
        if (timer.kind === 'stopwatch') chip.textContent = fmt((Date.now() - timer.startedAt) / 1000);
        else { const left = (timer.endsAt - Date.now()) / 1000; chip.textContent = (timer.kind === 'break' ? 'Break ' : 'Focus ') + fmt(left); if (left <= 0) timerDone(); }
        chip.className = 'chip on ' + (timer && timer.kind === 'break' ? 'rest' : timer && timer.kind === 'focus' ? 'focus' : '');
        if (!walking && !seq && now > actUntil) { const f = timerFace(); setAct(f === act ? (timer.kind === 'break' ? pick(DRINKS) : Math.random() < .35 ? 'read' : 'work') : f, 0); actUntil = now + 20000 + Math.random() * 20000; }
      } else chip.classList.remove('on');
      /* sequences */
      if (seq && !walking) {
        if (seq.steps[seq.i] && seq.steps[seq.i].climb) { y += 70 * dt; const top = vh() - petH() - 8; if (y >= top) { y = top; seq.until = 0; } place(); }
        if (now >= seq.until) advance();
      }
      /* wandering */
      if (walking) {
        const sp = (leave ? 70 : 46) * dt;
        if (desk) { const mv = Math.min(sp, Math.abs(target.dx) - target.got) * (target.dx < 0 ? -1 : 1); A.moveBy(mv, 0); target.got += Math.abs(mv); if (target.got >= Math.abs(target.dx) - .5) arrive(now); }
        else { const d = target - x; if (Math.abs(d) <= sp) { x = target; arrive(now); } else { x += Math.sign(d) * sp; dir = Math.sign(d); } place(); }
      } else if (!timer && !seq && now > actUntil && now > nextAuto) { if (busyUntil && now < busyUntil) setAct('busy', busyUntil - now); else { busyUntil = 0; chooseAuto(); } nextAuto = now + 800; }
      else if (!timer && !seq && now > actUntil) { setAct('idle', 1500); }
      else if (timer && !walking && !seq && ACTS[act] && act === 'walk') setAct('work', 0);
      if (!seq && !away && !drag && !timer && !leave && now > nagAt) nag();
      frameStep(now);
    }
    function arrive(now) {
      walking = false;
      if (leave && leave.phase === 'out') { away = now + 8000 + Math.random() * 12000; setAct('idle', 1000); return; }
      if (leave && leave.phase === 'in') { leave = null; setAct('wave', 2200); return; }
      if (seq) { seq.until = 0; return; }
      setAct('idle', 1200 + Math.random() * 2500);
    }

    /* ---------- poking ---------- */
    function poke() {
      const now = performance.now();
      if (act === 'busy' && busyUntil && now < busyUntil) {
        busyPokes++; if (busyPokes >= 5) { busyUntil = 0; busyPokes = 0; setAct('sweat', 1800); say(pick(LINES.busyBreak), 3600); setTimeout(() => { if (act === 'sweat') doAct('flirt'); }, 2000); return; }
        say(LINES.busy[Math.min(busyPokes, LINES.busy.length - 1)] + (busyPokes > 2 ? ' (' + (5 - busyPokes) + ' more and I snap)' : ''), 1800); return;
      }
      if (seq || away) return;
      pokes = pokes.filter(t => now - t < 3200); pokes.push(now);
      if (pokes.length >= 5) { pokes = []; setAct('box', 3400); say(pick(LINES.annoyed), 3000); return; }
      const r = Math.random();
      if (r < .2) { setAct('wave'); say(pick(['Hey!', 'Hi hi.', 'Yo.', 'Sup.', 'Hello, human.'])); }
      else if (r < .27) { setAct('jump'); say('Whoa!'); }
      else if (r < .32) { setAct('sweat'); say('Please. I am delicate.'); }
      else if (r < .37) { setAct('idea'); say('Wait. I had a thought. It left.'); }
      else if (r < .42) { setAct('love'); say(pick(LINES.pet)); }
      else if (r < .52) doAct('flirt');
      else if (r < .6) doAct('steal');
      else if (r < .66) doAct('lockin');
      else if (r < .7) { setAct('shrug'); say('Beats me.'); }
      else if (r < .74) { setAct('facepalm'); say('Why do I do this to myself.'); }
      else { setAct('point', 2200); say(pick(LINES.poke)); }
    }

    /* ---------- the cute menu ---------- */
    const sw = c => '<span style="top:0;background:' + (c.hair || '#221b15') + '"></span><span style="top:25%;background:' + (c.skin || '#c9a57c') + '"></span><span style="top:50%;background:' + (c.shirt || '#d6cec1') + '"></span><span style="top:75%;background:' + (c.pants || '#28282d') + '"></span>';
    function toggleMenu(on) { const open = on === undefined ? !menu.classList.contains('on') : on; if (open) buildMenu(); menu.classList.toggle('on', open); }
    function buildMenu() {
      const tabs = [['do', 'Do'], ['focus', 'Focus'], ['fit', 'Outfit'], ['me', 'Me']];
      let h = '<div class="mh"><b>Durva</b><i>pocket edition</i><button class="x" data-a="close" aria-label="Close">×</button></div><div class="tabs">' + tabs.map(t => '<button data-a="tab:' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>';
      if (tab === 'do') h += GROUPS_UI.map(g => '<h4>' + g[0] + '</h4><div class="row">' + g[1].map(b => '<button data-a="act:' + b[0] + '">' + b[1] + '</button>').join('') + '</div>').join('');
      else if (tab === 'focus') h += '<h4>Study with me</h4><div class="row"><button class="big" data-a="pomo">🍅 Pomodoro 25/5</button><button data-a="f45">45 min</button><button data-a="stopwatch">⏱ Stopwatch</button></div>' +
        '<h4>Custom timer</h4><div class="row"><input type="number" min="1" max="600" value="10" data-i="mins" aria-label="Minutes"><button data-a="custom">Start</button>' + (timer ? '<button data-a="stop">Stop</button>' : '') + '</div>' +
        '<h4>Reminders</h4><div class="row"><button class="' + (S.nag ? 'on' : '') + '" data-a="nag">' + (S.nag ? '🔔 Nudges on' : '🔕 Nudges off') + '</button></div>';
      else if (tab === 'fit') {
        const cur = S.outfit, c = S.custom;
        h += '<h4>Outfits</h4><div class="sw">' + OUTFITS.map(o => '<button data-a="fit:' + o.id + '" class="' + (cur === o.id ? 'on' : '') + '" title="' + o.name + '">' + sw(o.c) + '<em>' + o.name + '</em></button>').join('') + '<button data-a="fit:custom" class="' + (cur === 'custom' ? 'on' : '') + '">' + sw(c) + '<em>Mine</em></button></div>' +
          '<h4>Make your own</h4><div class="pick">' + [['shirt', 'Top'], ['pants', 'Pants'], ['shoes', 'Shoes'], ['hair', 'Hair']].map(p => '<label>' + p[1] + '<input type="color" data-c="' + p[0] + '" value="' + c[p[0]] + '"></label>').join('') + '</div>' +
          '<h4>Extras</h4><div class="row"><button class="' + (S.cat ? 'on' : '') + '" data-a="cat">🐱 Cat boy mode</button></div>';
      } else h += '<h4>Pet</h4><div class="row"><button data-a="say">💬 Say something</button><button data-a="wander">' + (S.wander ? '🧍 Stay put' : '🚶 Wander') + '</button><button data-a="big">➕ Bigger</button><button data-a="small">➖ Smaller</button><button data-a="hide">🫥 Hide</button></div>';
      menu.innerHTML = h;
    }
    menu.addEventListener('pointerdown', e => e.stopPropagation());
    let colT = 0;
    menu.addEventListener('input', e => { const c = e.target.dataset && e.target.dataset.c; if (!c) return; S.custom[c] = e.target.value; S.outfit = 'custom'; clearTimeout(colT); colT = setTimeout(() => { refreshOutfit(); save(); }, 120); });
    menu.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a; e.stopPropagation(); if (!a) return;
      const mins = +((menu.querySelector('[data-i=mins]') || {}).value) || 10;
      if (a === 'close') return toggleMenu(false);
      if (a.startsWith('tab:')) { tab = a.slice(4); return buildMenu(); }
      if (a.startsWith('fit:')) { S.outfit = a.slice(4); refreshOutfit(); save(); say(S.outfit === 'spidey' ? 'Thwip. Fashion.' : 'Ooh. New drip.'); return buildMenu(); }
      if (a === 'cat') { S.cat = !S.cat; refreshOutfit(); save(); say(S.cat ? 'Nyaa. I mean. Hello.' : 'Ears off. Dignity restored.'); return buildMenu(); }
      if (a === 'nag') { S.nag = !S.nag; save(); say(S.nag ? 'I will nag you. Lovingly.' : 'Okay. I will stay quiet.'); return buildMenu(); }
      if (a === 'pomo') pomodoro(25, 5); else if (a === 'f45') startTimer('focus', 45); else if (a === 'stopwatch') startTimer('stopwatch', 0); else if (a === 'custom') startTimer('focus', mins);
      else if (a === 'stop') stopTimer(); else if (a === 'say') say(pick(LINES.idle.concat(LINES.poke, LINES.flirt)));
      else if (a === 'wander') { S.wander = !S.wander; save(); say(S.wander ? 'Off I go.' : 'Staying right here.'); }
      else if (a === 'big' || a === 'small') { S.scale = Math.max(1, Math.min(8, S.scale + (a === 'big' ? 1 : -1))); size(); save(); if (A.resize) A.resize(S.scale); return; }
      else if (a === 'hide') { S.visible = false; save(); A.onHide && A.onHide(); }
      else if (a.startsWith('act:')) doAct(a.slice(4));
      toggleMenu(false);
    });

    /* ---------- pointer: click, double click, drag, long hover ---------- */
    let lastClick = 0;
    img.addEventListener('pointerdown', e => {
      if (e.button === 2) return; e.preventDefault(); img.setPointerCapture(e.pointerId);
      drag = { sx: e.screenX, sy: e.screenY, ox: x, oy: y, lx: e.screenX, ly: e.screenY, moved: false };
    });
    img.addEventListener('pointermove', e => {
      clearTimeout(hoverT); if (!drag) return;
      const dx = e.screenX - drag.sx, dy = e.screenY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; host.classList.add('drag'); walking = false; cancelSeq(); toggleMenu(false); }
      if (drag.moved) { if (desk) { A.moveBy(e.screenX - drag.lx, e.screenY - drag.ly); } else { x = Math.max(0, Math.min(vw() - petW(), drag.ox + dx)); y = Math.max(0, drag.oy - dy); place(); } drag.lx = e.screenX; drag.ly = e.screenY; }
    });
    img.addEventListener('pointerup', e => {
      if (!drag) return; const d = drag; drag = null; host.classList.remove('drag');
      if (d.moved) { if (!desk) { y = 0; place(); } setAct('jump'); say('Put me down gently next time.'); save(); return; }
      const now = performance.now();
      if (now - lastClick < 380) { lastClick = 0; cancelSeq(); busyUntil = 0; setAct('dance'); say(pick(LINES.dance)); toggleMenu(false); return; }
      lastClick = now; setTimeout(() => { if (lastClick === now) { lastClick = 0; poke(); } }, 390);
    });
    img.addEventListener('contextmenu', e => { e.preventDefault(); toggleMenu(); });
    img.addEventListener('pointerenter', () => { clearTimeout(hoverT); hoverT = setTimeout(() => { if (!drag && !seq && !busyUntil && !menu.classList.contains('on')) { setAct('love'); say(pick(LINES.pet)); } }, 2600); });
    img.addEventListener('pointerleave', () => clearTimeout(hoverT));

    /* ---------- public ---------- */
    size(); place(); refreshOutfit(); setFrame('idle'); requestAnimationFrame(loop);
    setTimeout(() => { setAct('wave'); say(pick(LINES.hello)); }, 700);
    return {
      state: S, act: k => { if (k === 'say') return say(pick(LINES.idle)); doAct(k); },
      say, startTimer: (k, m) => { if (k === 'pomodoro') pomodoro(m || 25, 5); else startTimer(k, m); }, stopTimer, setTimer(t) { const same = t && timer && t.startedAt === timer.startedAt && t.kind === timer.kind; timer = t; if (t && !same) onTimerStart(); else if (!t) chip.classList.remove('on'); }, getTimer: () => timer,
      setOutfit(id, custom) { S.outfit = id; if (custom) S.custom = { ...S.custom, ...custom }; refreshOutfit(); save(); },
      setCat(on) { S.cat = !!on; refreshOutfit(); save(); },
      setNag(on) { S.nag = !!on; save(); },
      toggleMenu, show() { S.visible = true; host.style.display = ''; save(); }, hide() { S.visible = false; save(); }, setScale(n) { S.scale = n; size(); save(); },
      setContext(c) { ctx = c || ''; }, destroy() { alive = false; host.remove(); st.remove(); }, host
    };
  }
  global.DurvaPet = { create, ACTS, LINES, OUTFITS, GROUPS_UI, fmt };
})(typeof window !== 'undefined' ? window : globalThis);
