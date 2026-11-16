const KEY = 'durva-pet';
const load = k => { try { return JSON.parse(localStorage.getItem(KEY + ':' + k)); } catch { return null; } };
const put = (k, v) => { try { localStorage.setItem(KEY + ':' + k, JSON.stringify(v)); } catch {} };

const saved = load('state') || {};
const pet = DurvaPet.create({
  root: document.body,
  state: { scale: saved.scale || 3, wander: saved.wander !== false, visible: true, outfit: saved.outfit || 'classic', custom: saved.custom, cat: !!saved.cat, nag: saved.nag !== false },
  adapter: {
    moveBy: (dx, dy) => desk.moveBy(dx, dy),
    width: () => innerWidth,
    save: s => put('state', { scale: s.scale, wander: s.wander, outfit: s.outfit, custom: s.custom, cat: s.cat, nag: s.nag }),
    setTimer: t => put('timer', t),
    resize: s => desk.resize(s),
    notify: (title, body) => { try { new Notification(title, { body, silent: false }); } catch {} },
    onHide: () => desk.hide()
  }
});
desk.resize(pet.state.scale);

const t = load('timer');
if (t && (t.kind === 'stopwatch' || t.endsAt > Date.now())) pet.setTimer(t);

desk.onCmd(c => {
  if (c.name === 'timer') pet.startTimer(c.kind, c.minutes);
  else if (c.name === 'stop') pet.stopTimer();
  else if (c.name === 'act') pet.act(c.act);
});

// The window is transparent and click-through everywhere except over the pet, its bubble and its menu.
let over = false;
document.addEventListener('mousemove', e => {
  const hit = !!e.target.closest('.dp img, .dp .menu, .dp .chip');
  if (hit !== over) { over = hit; desk.ignoreMouse(!hit); }
});
