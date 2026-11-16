(() => {
  if (window.top !== window || window.__durvaPet || !window.DurvaPet) return;
  window.__durvaPet = true;
  const store = chrome.storage.local;
  const visible = () => document.visibilityState === 'visible';

  store.get(['pet', 'timer'], ({ pet: saved, timer }) => {
    const root = document.createElement('div');
    root.id = 'durva-pet-root';
    root.style.cssText = 'all:initial';
    document.documentElement.appendChild(root);
    const shadow = root.attachShadow({ mode: 'open' });

    const pet = DurvaPet.create({
      root: shadow,
      state: saved || {},
      adapter: {
        save: s => store.set({ pet: { scale: s.scale, visible: s.visible, wander: s.wander, x: s.x, outfit: s.outfit, custom: s.custom, cat: s.cat, nag: s.nag } }),
        setTimer: t => store.set({ timer: t }),
        leader: visible,
        notify: (title, body) => chrome.runtime.sendMessage({ type: 'notify', title, body }),
        onHide: () => {}
      }
    });
    if (timer) pet.setTimer(timer);

    chrome.storage.onChanged.addListener(ch => {
      if (ch.timer) pet.setTimer(ch.timer.newValue || null);
      if (ch.pet && ch.pet.newValue) {
        const v = ch.pet.newValue;
        if (v.scale && v.scale !== pet.state.scale) pet.setScale(v.scale);
        if (v.visible !== undefined && v.visible !== pet.state.visible) { v.visible ? pet.show() : pet.hide(); }
        if (v.wander !== undefined) pet.state.wander = v.wander;
        if (v.nag !== undefined) pet.state.nag = v.nag;
        if (v.cat !== undefined && v.cat !== pet.state.cat) pet.setCat(v.cat);
        if (v.outfit && (v.outfit !== pet.state.outfit || JSON.stringify(v.custom) !== JSON.stringify(pet.state.custom))) pet.setOutfit(v.outfit, v.custom);
      }
      if (ch.cmd && ch.cmd.newValue && visible()) {
        const c = ch.cmd.newValue;
        if (c.name === 'timer') pet.startTimer(c.kind, c.minutes);
        else if (c.name === 'stop') pet.stopTimer();
        else if (c.name === 'act') pet.act(c.act);
      }
    });
  });
})();
