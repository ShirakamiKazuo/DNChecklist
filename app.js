const DEFAULT_SECTIONS = [
  {
    id: 'efm', name: 'Erosion Fission Maze', type: 'weekly', color: '#c9a84c', collapsed: false,
    chars: [
      { id: 'c1', name: 'Silver Hunter', done: false },
      { id: 'c2', name: 'Light Fury', done: false },
      { id: 'c3', name: 'Duelist', done: false },
      { id: 'c4', name: 'Moonlord', done: false },
    ]
  },
  {
    id: 'aot', name: 'Ark of Transcendence', type: 'weekly', color: '#9b72cf', collapsed: false,
    chars: [
      { id: 'c1', name: 'Silver Hunter', done: false },
      { id: 'c2', name: 'Light Fury', done: false },
      { id: 'c3', name: 'Duelist', done: false },
      { id: 'c4', name: 'Moonlord', done: false },
    ]
  },
  {
    id: 'bdnl', name: 'Bone Dragon Nest Light', type: 'weekly', color: '#5c9ee0', collapsed: false,
    chars: [
      { id: 'c1', name: 'Silver Hunter', done: false },
      { id: 'c2', name: 'Light Fury', done: false },
    ]
  },
  {
    id: 'bdnh', name: 'Black Dragon Nest Hardcore', type: 'weekly', color: '#e05c5c', collapsed: false,
    chars: [
      { id: 'c1', name: 'Silver Hunter', done: false },
    ]
  },
];

function getLastWeeklyResetUTC() {
  const now = Date.now();
  const PH_OFFSET_MS = 8 * 3600000;
  const nowPH = new Date(now + PH_OFFSET_MS);
  const daysSinceSat = (nowPH.getUTCDay() + 1) % 7;
  const satPH = new Date(now + PH_OFFSET_MS);
  satPH.setUTCDate(nowPH.getUTCDate() - daysSinceSat);
  satPH.setUTCHours(9, 0, 0, 0);
  const satUTC = satPH.getTime() - PH_OFFSET_MS;
  return satUTC > now ? satUTC - 7 * 86400000 : satUTC;
}

function getLastDailyResetUTC() {
  const now = Date.now();
  const PH_OFFSET_MS = 8 * 3600000;
  const todayPH = new Date(now + PH_OFFSET_MS);
  todayPH.setUTCHours(9, 0, 0, 0);
  const resetUTC = todayPH.getTime() - PH_OFFSET_MS;
  return resetUTC > now ? resetUTC - 86400000 : resetUTC;
}

function load() {
  try {
    const saved = localStorage.getItem('dn_tracker_v2');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return {
    sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)),
    lastWeeklyReset: getLastWeeklyResetUTC(),
    lastDailyReset: getLastDailyResetUTC(),
  };
}

function save() {
  try { localStorage.setItem('dn_tracker_v2', JSON.stringify(state)); } catch(e) {}
}

function checkAndAutoReset() {
  const currentWeekly = getLastWeeklyResetUTC();
  const currentDaily = getLastDailyResetUTC();
  let changed = false;

  if (!state.lastWeeklyReset || currentWeekly > state.lastWeeklyReset) {
    state.sections.forEach(s => {
      if (s.type === 'weekly') s.chars.forEach(c => c.done = false);
    });
    state.lastWeeklyReset = currentWeekly;
    changed = true;
  }

  if (!state.lastDailyReset || currentDaily > state.lastDailyReset) {
    state.sections.forEach(s => {
      if (s.type === 'daily') s.chars.forEach(c => c.done = false);
    });
    state.lastDailyReset = currentDaily;
    changed = true;
  }

  if (changed) save();
}

let state = load();

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function render() {
  const container = document.getElementById('sections-container');
  if (!state.sections.length) {
    container.innerHTML = `<div style="text-align:center;padding:48px 0;color:var(--text-muted);font-family:'Cinzel',serif;font-size:.85rem;letter-spacing:2px;">No activities yet. Add one above.</div>`;
    return;
  }
  container.innerHTML = state.sections.map((sec, si) => renderSection(sec, si)).join('');
}

function renderSection(sec, si) {
  const total = sec.chars.length;
  const done = sec.chars.filter(c => c.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const badgeClass = { weekly: 'badge-weekly', daily: 'badge-daily', once: 'badge-once', counter: 'badge-counter' }[sec.type] || 'badge-weekly';
  const badgeLabel = { weekly: 'Weekly', daily: 'Daily', once: 'One-time', counter: 'Counter' }[sec.type];
  const isCounter = sec.type === 'counter';

  return `
  <div class="section-card ${sec.collapsed ? 'collapsed' : ''}" id="sec-${sec.id}" draggable="true" data-sec-id="${sec.id}">
    <div class="section-header" onclick="toggleCollapse(${si})">
      <span class="drag-handle" data-drag-handle onmousedown="event.stopPropagation()" title="Drag to reorder">⠿⠿</span>
      <div class="section-dot" style="background:${sec.color};color:${sec.color}"></div>
      <div class="section-title-wrap">
        <div class="section-title">${esc(sec.name)}</div>
        <div class="section-meta">${isCounter ? sec.chars.reduce((a,c)=>a+(c.count||0),0)+' total tickets' : done+' / '+total+' characters'}</div>
      </div>
      <span class="section-badge ${badgeClass}">${badgeLabel}</span>
      ${!isCounter ? `<span class="section-progress"><span class="progress-fill">${done}</span>/${total}</span>` : ''}
      <span class="section-chevron">▼</span>
      ${!isCounter ? `<div class="section-progress-bar" style="width:${pct}%;background:linear-gradient(90deg,${sec.color}66,${sec.color})"></div>` : ''}
    </div>
    <div class="section-body">
      <div class="char-grid" id="chars-${sec.id}">
        ${isCounter ? sec.chars.map((ch,ci)=>renderCounter(sec,si,ch,ci)).join('') : sec.chars.map((ch,ci)=>renderChar(sec,si,ch,ci)).join('')}
      </div>
      <div class="add-char-row">
        <input type="text" class="input-field" id="newchar-${sec.id}" placeholder="${isCounter ? 'Ticket name...' : 'Character name...'}" onkeydown="if(event.key==='Enter')addChar(${si})" />
        <button class="btn-add-char" onclick="addChar(${si})">＋ Add</button>
      </div>
      <div class="section-controls">
        <button class="btn-small btn-check-all" onclick="checkAll(${si},true)">✓ All Done</button>
        <button class="btn-small btn-uncheck-all" onclick="checkAll(${si},false)">↺ Uncheck</button>
        <button class="section-del-btn btn-small" onclick="deleteSection(${si})">✕ Remove</button>
      </div>
    </div>
  </div>`;
}

function renderChar(sec, si, ch, ci) {
  return `
  <div class="char-row ${ch.done ? 'done' : ''}" onclick="toggleChar(${si},${ci})">
    <div class="char-check">
      <span class="char-check-icon">✓</span>
    </div>
    <span class="char-name">${esc(ch.name)}</span>
    <button class="char-del" onclick="event.stopPropagation();deleteChar(${si},${ci})" title="Remove">×</button>
  </div>`;
}

function renderCounter(sec, si, ch, ci) {
  const val = ch.count || 0;
  return `
  <div class="counter-row">
    <span class="counter-name">${esc(ch.name)}</span>
    <div class="counter-controls">
      <button class="counter-btn minus" onclick="adjustCount(${si},${ci},-1)" title="Use one">−</button>
      <span class="counter-val ${val===0?'zero':''}">${val}</span>
      <button class="counter-btn plus" onclick="adjustCount(${si},${ci},1)" title="Add one">+</button>
    </div>
    <button class="char-del" onclick="deleteChar(${si},${ci})" title="Remove">×</button>
  </div>`;
}

function adjustCount(si, ci, delta) {
  const ch = state.sections[si].chars[ci];
  ch.count = Math.max(0, (ch.count || 0) + delta);
  save(); render();
}

function toggleChar(si, ci) {
  state.sections[si].chars[ci].done = !state.sections[si].chars[ci].done;
  save(); render();
}

function toggleCollapse(si) {
  state.sections[si].collapsed = !state.sections[si].collapsed;
  save(); render();
}

function addChar(si) {
  const input = document.getElementById(`newchar-${state.sections[si].id}`);
  const name = input ? input.value.trim() : '';
  if (!name) return;
  const isCounter = state.sections[si].type === 'counter';
  state.sections[si].chars.push(isCounter ? { id: 'c' + Date.now(), name, count: 0 } : { id: 'c' + Date.now(), name, done: false });
  save(); render();
}

function deleteChar(si, ci) {
  if (!confirm('Remove this entry?')) return;
  state.sections[si].chars.splice(ci, 1);
  save(); render();
}

function checkAll(si, val) {
  state.sections[si].chars.forEach(c => c.done = val);
  save(); render();
}

function deleteSection(si) {
  if (!confirm(`Remove "${state.sections[si].name}"?`)) return;
  state.sections.splice(si, 1);
  save(); render();
}

function resetAll() {
  if (!confirm('Reset all checkboxes for all activities?')) return;
  state.sections.forEach(s => s.chars.forEach(c => c.done = false));
  save(); render();
}

function openAddSection() {
  document.getElementById('modalSectionName').value = '';
  document.getElementById('sectionModal').classList.add('open');
  setTimeout(() => document.getElementById('modalSectionName').focus(), 100);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function confirmAddSection() {
  const name = document.getElementById('modalSectionName').value.trim();
  if (!name) { document.getElementById('modalSectionName').focus(); return; }
  const type = document.getElementById('modalSectionType').value;
  const color = document.getElementById('modalSectionColor').value;
  const id = 'sec_' + Date.now();
  state.sections.push({ id, name, type, color, collapsed: false, chars: [] });
  save(); render();
  closeModal('sectionModal');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sectionModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal('sectionModal');
  });
});

function updateResetTimers() {
  const now = new Date();
  const nowPH = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const nextWeek = new Date(now);
  const daysPH = (6 - nowPH.getDay() + 7) % 7 || 7;
  nextWeek.setDate(now.getDate() + daysPH);
  nextWeek.setUTCHours(1, 0, 0, 0);
  if (nextWeek <= now) nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById('nextReset').textContent = formatCountdown(nextWeek - now);

  const nextDay = new Date(now);
  nextDay.setUTCHours(1, 0, 0, 0);
  if (nextDay <= now) nextDay.setDate(nextDay.getDate() + 1);
  document.getElementById('nextDaily').textContent = formatCountdown(nextDay - now);
}

function formatCountdown(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m`;
}

let dragSrcId = null;

function initDragDrop() {
  const container = document.getElementById('sections-container');

  container.addEventListener('dragstart', e => {
    const card = e.target.closest('.section-card');
    if (!card) return;
    dragSrcId = card.dataset.secId;
    setTimeout(() => card.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragend', e => {
    const card = e.target.closest('.section-card');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.section-card.drag-over').forEach(c => c.classList.remove('drag-over'));
    dragSrcId = null;
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.section-card');
    document.querySelectorAll('.section-card.drag-over').forEach(c => c.classList.remove('drag-over'));
    if (card && card.dataset.secId !== dragSrcId) card.classList.add('drag-over');
  });

  container.addEventListener('dragleave', e => {
    const card = e.target.closest('.section-card');
    if (card) card.classList.remove('drag-over');
  });

  container.addEventListener('drop', e => {
    e.preventDefault();
    const targetCard = e.target.closest('.section-card');
    if (!targetCard || !dragSrcId) return;
    const targetId = targetCard.dataset.secId;
    if (targetId === dragSrcId) return;

    const srcIdx = state.sections.findIndex(s => s.id === dragSrcId);
    const tgtIdx = state.sections.findIndex(s => s.id === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;

    const [moved] = state.sections.splice(srcIdx, 1);
    state.sections.splice(tgtIdx, 0, moved);
    save();
    render();
    initDragDrop();
  });
}

checkAndAutoReset();
render();
initDragDrop();
updateResetTimers();
setInterval(() => { checkAndAutoReset(); render(); initDragDrop(); updateResetTimers(); }, 60000);
