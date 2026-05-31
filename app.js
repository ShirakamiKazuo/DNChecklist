const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const DN_DEFAULTS = [
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

function getDNWeeklyResetUTC() {
  const now = Date.now();
  const PH = 8 * 3600000;
  const nowPH = new Date(now + PH);
  const daysSinceSat = (nowPH.getUTCDay() + 1) % 7;
  const satPH = new Date(now + PH);
  satPH.setUTCDate(nowPH.getUTCDate() - daysSinceSat);
  satPH.setUTCHours(9, 0, 0, 0);
  const satUTC = satPH.getTime() - PH;
  return satUTC > now ? satUTC - 7 * 86400000 : satUTC;
}

function getDNDailyResetUTC() {
  const now = Date.now();
  const PH = 8 * 3600000;
  const todayPH = new Date(now + PH);
  todayPH.setUTCHours(9, 0, 0, 0);
  const resetUTC = todayPH.getTime() - PH;
  return resetUTC > now ? resetUTC - 86400000 : resetUTC;
}

function getCustomWeeklyResetUTC(targetDay, timeStr, tz) {
  const now = Date.now();
  const [h, m] = timeStr.split(':').map(Number);
  const nowInTz = new Date(new Date(now).toLocaleString('en-US', { timeZone: tz }));
  const currentDay = nowInTz.getDay();
  let diff = (targetDay - currentDay + 7) % 7;
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() - (diff === 0 ? 0 : 7 - diff));
  const tzCandidate = new Date(candidate.toLocaleString('en-US', { timeZone: tz }));
  tzCandidate.setHours(h, m, 0, 0);
  const utcOffset = candidate.getTime() - new Date(candidate.toLocaleString('en-US', { timeZone: tz })).getTime();
  const resetUTC = tzCandidate.getTime() + utcOffset;
  return resetUTC > now ? resetUTC - 7 * 86400000 : resetUTC;
}

function getCustomDailyResetUTC(timeStr, tz) {
  const now = Date.now();
  const [h, m] = timeStr.split(':').map(Number);
  const todayInTz = new Date(new Date(now).toLocaleString('en-US', { timeZone: tz }));
  todayInTz.setHours(h, m, 0, 0);
  const utcOffset = new Date(now).getTime() - new Date(new Date(now).toLocaleString('en-US', { timeZone: tz })).getTime();
  const resetUTC = todayInTz.getTime() + utcOffset;
  return resetUTC > now ? resetUTC - 86400000 : resetUTC;
}

function loadState() {
  try {
    const saved = localStorage.getItem('adv_tracker_v1');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return {
    dn: {
      sections: JSON.parse(JSON.stringify(DN_DEFAULTS)),
      lastWeeklyReset: getDNWeeklyResetUTC(),
      lastDailyReset: getDNDailyResetUTC(),
    },
    custom: {
      sections: [],
    },
    activeTab: 'dn',
  };
}

function saveState() {
  try { localStorage.setItem('adv_tracker_v1', JSON.stringify(state)); } catch(e) {}
}

function checkAndAutoResetDN() {
  const cw = getDNWeeklyResetUTC();
  const cd = getDNDailyResetUTC();
  let changed = false;
  if (!state.dn.lastWeeklyReset || cw > state.dn.lastWeeklyReset) {
    state.dn.sections.forEach(s => { if (s.type === 'weekly') s.chars.forEach(c => c.done = false); });
    state.dn.lastWeeklyReset = cw;
    changed = true;
  }
  if (!state.dn.lastDailyReset || cd > state.dn.lastDailyReset) {
    state.dn.sections.forEach(s => { if (s.type === 'daily') s.chars.forEach(c => c.done = false); });
    state.dn.lastDailyReset = cd;
    changed = true;
  }
  if (changed) saveState();
}

function checkAndAutoResetCustom() {
  const now = Date.now();
  let changed = false;
  state.custom.sections.forEach(s => {
    if (s.type === 'counter' || s.type === 'once') return;
    let lastReset;
    if (s.type === 'weekly') {
      lastReset = getCustomWeeklyResetUTC(s.resetDay, s.resetTime, s.resetTz);
    } else {
      lastReset = getCustomDailyResetUTC(s.resetTime, s.resetTz);
    }
    if (!s.lastReset || lastReset > s.lastReset) {
      s.chars.forEach(c => c.done = false);
      s.lastReset = lastReset;
      changed = true;
    }
  });
  if (changed) saveState();
}

let state = loadState();

function currentSections() {
  return state[state.activeTab].sections;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function switchTab(tab) {
  state.activeTab = tab;
  saveState();
  document.getElementById('tab-dn').classList.toggle('active', tab === 'dn');
  document.getElementById('tab-custom').classList.toggle('active', tab === 'custom');
  document.getElementById('page-title').textContent = tab === 'dn' ? 'Dragon Nest SEA' : 'Custom Tracker';
  document.getElementById('dn-banner').style.display = tab === 'dn' ? 'flex' : 'none';
  document.getElementById('custom-banner').style.display = tab === 'custom' ? 'flex' : 'none';
  if (tab === 'dn') checkAndAutoResetDN();
  else checkAndAutoResetCustom();
  render();
  initDragDrop();
  if (tab === 'dn') updateResetTimers();
}

function render() {
  const container = document.getElementById('sections-container');
  const sections = currentSections();
  if (!sections.length) {
    container.innerHTML = `<div style="text-align:center;padding:48px 0;color:var(--text-muted);font-family:'Cinzel',serif;font-size:.85rem;letter-spacing:2px;">No activities yet. Add one above.</div>`;
    return;
  }
  container.innerHTML = sections.map((sec, si) => renderSection(sec, si)).join('');
}

function renderSection(sec, si) {
  const total = sec.chars.length;
  const done = sec.chars.filter(c => c.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const badgeClass = { weekly: 'badge-weekly', daily: 'badge-daily', once: 'badge-once', counter: 'badge-counter' }[sec.type] || 'badge-weekly';
  const badgeLabel = { weekly: 'Weekly', daily: 'Daily', once: 'One-time', counter: 'Counter' }[sec.type];
  const isCounter = sec.type === 'counter';

  let resetTag = '';
  if (state.activeTab === 'custom' && sec.type === 'weekly' && sec.resetDay !== undefined) {
    resetTag = `<div class="reset-tag">↺ ${DAYS[sec.resetDay]} at ${sec.resetTime} (${sec.resetTz.split('/')[1] || sec.resetTz})</div>`;
  } else if (state.activeTab === 'custom' && sec.type === 'daily' && sec.resetTime) {
    resetTag = `<div class="reset-tag">↺ Daily at ${sec.resetTime} (${sec.resetTz.split('/')[1] || sec.resetTz})</div>`;
  }

  return `
  <div class="section-card ${sec.collapsed ? 'collapsed' : ''}" id="sec-${sec.id}" draggable="true" data-sec-id="${sec.id}">
    <div class="section-header" onclick="toggleCollapse(${si})">
      <span class="drag-handle" onmousedown="event.stopPropagation()" title="Drag to reorder">⠿⠿</span>
      <div class="section-dot" style="background:${sec.color};color:${sec.color}"></div>
      <div class="section-title-wrap">
        <div class="section-title">${esc(sec.name)}</div>
        <div class="section-meta">${isCounter ? sec.chars.reduce((a,c)=>a+(c.count||0),0)+' total' : done+' / '+total}</div>
        ${resetTag}
      </div>
      <span class="section-badge ${badgeClass}">${badgeLabel}</span>
      ${!isCounter ? `<span class="section-progress"><span class="progress-fill">${done}</span>/${total}</span>` : ''}
      <span class="section-chevron">▼</span>
      ${!isCounter ? `<div class="section-progress-bar" style="width:${pct}%;background:linear-gradient(90deg,${sec.color}66,${sec.color})"></div>` : ''}
    </div>
    <div class="section-body">
      <div class="char-grid">
        ${isCounter ? sec.chars.map((ch,ci)=>renderCounter(sec,si,ch,ci)).join('') : sec.chars.map((ch,ci)=>renderChar(sec,si,ch,ci)).join('')}
      </div>
      <div class="add-char-row">
        <input type="text" class="input-field" id="newchar-${sec.id}" placeholder="${isCounter ? 'Item name...' : 'Character name...'}" onkeydown="if(event.key==='Enter')addChar(${si})" />
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
    <div class="char-check"><span class="char-check-icon">✓</span></div>
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
      <button class="counter-btn minus" onclick="adjustCount(${si},${ci},-1)">−</button>
      <span class="counter-val ${val===0?'zero':''}">${val}</span>
      <button class="counter-btn plus" onclick="adjustCount(${si},${ci},1)">+</button>
    </div>
    <button class="char-del" onclick="deleteChar(${si},${ci})" title="Remove">×</button>
  </div>`;
}

function adjustCount(si, ci, delta) {
  const ch = currentSections()[si].chars[ci];
  ch.count = Math.max(0, (ch.count || 0) + delta);
  saveState(); render();
}

function toggleChar(si, ci) {
  currentSections()[si].chars[ci].done = !currentSections()[si].chars[ci].done;
  saveState(); render();
}

function toggleCollapse(si) {
  currentSections()[si].collapsed = !currentSections()[si].collapsed;
  saveState(); render();
}

function addChar(si) {
  const sec = currentSections()[si];
  const input = document.getElementById(`newchar-${sec.id}`);
  const name = input ? input.value.trim() : '';
  if (!name) return;
  sec.chars.push(sec.type === 'counter'
    ? { id: 'c' + Date.now(), name, count: 0 }
    : { id: 'c' + Date.now(), name, done: false }
  );
  saveState(); render();
}

function deleteChar(si, ci) {
  if (!confirm('Remove this entry?')) return;
  currentSections()[si].chars.splice(ci, 1);
  saveState(); render();
}

function checkAll(si, val) {
  currentSections()[si].chars.forEach(c => c.done = val);
  saveState(); render();
}

function deleteSection(si) {
  if (!confirm(`Remove "${currentSections()[si].name}"?`)) return;
  currentSections().splice(si, 1);
  saveState(); render();
}

function resetAll() {
  if (!confirm('Reset all checkboxes for all activities?')) return;
  currentSections().forEach(s => s.chars.forEach(c => c.done = false));
  saveState(); render();
}

function onTypeChange() {
  const type = document.getElementById('modalSectionType').value;
  const isCustomTab = state.activeTab === 'custom';
  document.getElementById('custom-reset-fields').style.display = (isCustomTab && type === 'weekly') ? 'block' : 'none';
  document.getElementById('daily-reset-fields').style.display = (isCustomTab && type === 'daily') ? 'block' : 'none';
}

function openAddSection() {
  document.getElementById('modalSectionName').value = '';
  document.getElementById('modalSectionType').value = 'weekly';
  onTypeChange();
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

  const sec = { id, name, type, color, collapsed: false, chars: [] };

  if (state.activeTab === 'custom') {
    if (type === 'weekly') {
      sec.resetDay = parseInt(document.getElementById('modalResetDay').value);
      sec.resetTime = document.getElementById('modalResetTime').value;
      sec.resetTz = document.getElementById('modalResetTz').value;
      sec.lastReset = getCustomWeeklyResetUTC(sec.resetDay, sec.resetTime, sec.resetTz);
    } else if (type === 'daily') {
      sec.resetTime = document.getElementById('modalDailyResetTime').value;
      sec.resetTz = document.getElementById('modalDailyResetTz').value;
      sec.lastReset = getCustomDailyResetUTC(sec.resetTime, sec.resetTz);
    }
  }

  currentSections().push(sec);
  saveState(); render();
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
  const fresh = container.cloneNode(true);
  container.parentNode.replaceChild(fresh, container);
  const c = document.getElementById('sections-container');

  c.addEventListener('dragstart', e => {
    const card = e.target.closest('.section-card');
    if (!card) return;
    dragSrcId = card.dataset.secId;
    setTimeout(() => card.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
  });

  c.addEventListener('dragend', e => {
    const card = e.target.closest('.section-card');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.section-card.drag-over').forEach(x => x.classList.remove('drag-over'));
    dragSrcId = null;
  });

  c.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.section-card');
    document.querySelectorAll('.section-card.drag-over').forEach(x => x.classList.remove('drag-over'));
    if (card && card.dataset.secId !== dragSrcId) card.classList.add('drag-over');
  });

  c.addEventListener('dragleave', e => {
    const card = e.target.closest('.section-card');
    if (card) card.classList.remove('drag-over');
  });

  c.addEventListener('drop', e => {
    e.preventDefault();
    const targetCard = e.target.closest('.section-card');
    if (!targetCard || !dragSrcId) return;
    const targetId = targetCard.dataset.secId;
    if (targetId === dragSrcId) return;
    const sections = currentSections();
    const srcIdx = sections.findIndex(s => s.id === dragSrcId);
    const tgtIdx = sections.findIndex(s => s.id === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const [moved] = sections.splice(srcIdx, 1);
    sections.splice(tgtIdx, 0, moved);
    saveState();
    render();
    initDragDrop();
  });
}

checkAndAutoResetDN();
checkAndAutoResetCustom();
switchTab(state.activeTab);
updateResetTimers();
setInterval(() => {
  checkAndAutoResetDN();
  checkAndAutoResetCustom();
  render();
  initDragDrop();
  if (state.activeTab === 'dn') updateResetTimers();
}, 60000);
