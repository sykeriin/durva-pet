let lastNote = 0;
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type !== 'notify') return;
  const now = Date.now();
  if (now - lastNote < 4000) return;
  lastNote = now;
  chrome.notifications.create({ type: 'basic', iconUrl: 'icons/128.png', title: msg.title, message: msg.body });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('pet', ({ pet }) => { if (!pet) chrome.storage.local.set({ pet: { scale: 3, visible: true, wander: true } }); });
});
