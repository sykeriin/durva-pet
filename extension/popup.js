const store = chrome.storage.local;
const $ = s => document.querySelector(s);
const { GROUPS_UI, OUTFITS, fmt } = DurvaPet;
const cmd = c => store.set({ cmd: { ...c, id: Date.now() + Math.random() } });
const DEF = { scale: 3, visible: true, wander: true, outfit: 'classic', custom: { shirt: '#d6cec1', pants: '#28282d', shoes: '#f0eae0', hair: '#221b15' }, cat: false, nag: true };

$('#face').src = DURVA_SPRITES.idle;
$('#p-do').innerHTML = GROUPS_UI.map(g => `<h2>${g[0]}</h2><div class="row">${g[1].map(b => `<button data-a="${b[0]}">${b[1]}</button>`).join('')}</div>`).join('');
$('#p-do').addEventListener('click', e => { const b = e.target.closest('button'); if (b) cmd({ name: 'act', act: b.dataset.a }); });

document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + b.dataset.tab));
}));

document.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => {
  const t = b.dataset.t;
  if (t === 'custom') return cmd({ name: 'timer', kind: 'focus', minutes: +$('#mins').value || 15 });
  const [kind, m] = t.split(':'); cmd({ name: 'timer', kind, minutes: +m });
}));
$('#stop').onclick = () => cmd({ name: 'stop' });

async function get() { const { pet: p } = await store.get('pet'); return { ...DEF, ...(p || {}), custom: { ...DEF.custom, ...((p || {}).custom || {}) } }; }
async function patch(x) { await store.set({ pet: { ...(await get()), ...x } }); refresh(); }
const sw = c => `<span style="top:0;background:${c.hair || '#221b15'}"></span><span style="top:25%;background:${c.skin || '#c9a57c'}"></span><span style="top:50%;background:${c.shirt || '#d6cec1'}"></span><span style="top:75%;background:${c.pants || '#28282d'}"></span>`;

async function refresh() {
  const p = await get();
  $('#vis').textContent = p.visible === false ? 'Show' : 'Hide';
  $('#wander').textContent = p.wander === false ? 'Wander' : 'Stay put';
  $('#vis').onclick = () => patch({ visible: p.visible === false });
  $('#big').onclick = () => patch({ scale: Math.min(8, (p.scale || 3) + 1) });
  $('#small').onclick = () => patch({ scale: Math.max(1, (p.scale || 3) - 1) });
  $('#wander').onclick = () => patch({ wander: p.wander === false });
  $('#nag').textContent = p.nag ? '🔔 Nudges on' : '🔕 Nudges off'; $('#nag').classList.toggle('on-toggle', !!p.nag);
  $('#nag').onclick = () => patch({ nag: !p.nag });
  $('#cat').classList.toggle('on-toggle', !!p.cat);
  $('#cat').onclick = () => patch({ cat: !p.cat });
  $('#sw').innerHTML = OUTFITS.map(o => `<button data-o="${o.id}" class="${p.outfit === o.id ? 'on' : ''}">${sw(o.c)}<em>${o.name}</em></button>`).join('') + `<button data-o="custom" class="${p.outfit === 'custom' ? 'on' : ''}">${sw(p.custom)}<em>Mine</em></button>`;
  $('#sw').onclick = e => { const b = e.target.closest('button'); if (b) patch({ outfit: b.dataset.o }); };
  if (!$('#pick').children.length) {
    $('#pick').innerHTML = [['shirt', 'Top'], ['pants', 'Pants'], ['shoes', 'Shoes'], ['hair', 'Hair']].map(c => `<label>${c[1]}<input type="color" data-c="${c[0]}"></label>`).join('');
    $('#pick').addEventListener('change', async e => { const c = e.target.dataset.c; if (!c) return; const cur = await get(); patch({ outfit: 'custom', custom: { ...cur.custom, [c]: e.target.value } }); });
  }
  document.querySelectorAll('#pick input').forEach(i => { i.value = p.custom[i.dataset.c]; });
}
async function tick() {
  const { timer } = await store.get('timer');
  if (!timer) { $('#clock').textContent = 'No timer'; $('#sub').textContent = 'Poke him on any page.'; return; }
  const left = timer.kind === 'stopwatch' ? (Date.now() - timer.startedAt) / 1000 : (timer.endsAt - Date.now()) / 1000;
  $('#clock').textContent = fmt(left);
  $('#sub').textContent = timer.kind === 'break' ? 'Break. Drink something.' : timer.kind === 'stopwatch' ? 'Counting up.' : timer.pomo ? 'Focus, round ' + ((timer.round || 0) + 1) : 'Focus.';
}
refresh(); tick(); setInterval(tick, 500);
