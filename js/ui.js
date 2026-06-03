/* ============================================================
   OFIZ Tasks — UI Components & Renderers  (Redesign v2)
   ============================================================ */

/* ── Toast ──────────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const wrap = document.getElementById('toast-wrap');
  const el   = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="ti ti-${type === 'success' ? 'circle-check' : 'alert-circle'}"></i><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('hiding'); setTimeout(() => el.remove(), 200); }, 3200);
}

/* ── HTML escape ────────────────────────────────────────── */
function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ── Date formatter ─────────────────────────────────────── */
const _MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];

/* Returns "June 2026" — consistent regardless of browser locale */
function _monthLabel(yearMonth) {
  const [y, m] = yearMonth.split('-');
  return `${_MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function isOverdue(t) {
  const today = new Date().toISOString().slice(0,10);
  return t.status !== 'done' && t.dueDate < today;
}

/* ── Tag helpers ────────────────────────────────────────── */
function typeTag(type) {
  const map = { daily:'Daily', weekly:'Weekly', monthly:'Monthly', oneoff:'One-off' };
  return `<span class="tag tag-${type}">${map[type] || type}</span>`;
}

function statusTag(status, dueDate) {
  const today = new Date().toISOString().slice(0,10);
  if (status === 'done')    return `<span class="tag tag-done"><i class="ti ti-check" style="font-size:9px"></i> Done</span>`;
  if (status !== 'done' && dueDate < today)
                            return `<span class="tag tag-overdue">Overdue</span>`;
  if (status === 'progress') return `<span class="tag tag-progress">In progress</span>`;
  return `<span class="tag tag-pending">Pending</span>`;
}

function priorityTag(p) {
  const labels = { high:'High', medium:'Medium', low:'Low' };
  return `<span class="tag tag-${p}">${labels[p] || p}</span>`;
}

function clientTag(clientId) {
  const c = State.getClient(clientId);
  if (!c) return '';
  return `<span class="tag tag-client" style="color:${c.color};background:${c.bg};border-color:${c.color}22">${c.short}</span>`;
}

function assigneeChip(userId) {
  const u = State.getUser(userId);
  if (!u) return '';
  return `<div class="assign-chip ${u.avClass}" title="${u.name}" style="width:22px;height:22px;border-radius:50%;font-size:8.5px;font-weight:600;font-family:var(--mono)">${u.initials}</div>`;
}

/* ── Task card ──────────────────────────────────────────── */
function renderTaskCard(task) {
  const over     = isOverdue(task);
  const done     = task.status === 'done';
  const canClose = State.user?.role !== 'viewer';
  const canEdit  = State.user?.role === 'admin';

  const hasNotes    = task.notes && task.notes.trim();
  const isBlocked   = State.isBlocked(task.id);
  const subtasks    = task.subtasks || [];
  const stDone      = subtasks.filter(s => s.done).length;
  const stTotal     = subtasks.length;
  const hasSubtasks = stTotal > 0;

  return `
  <div class="task-card ${done ? 'done' : ''} ${over ? 'overdue' : ''} ${isBlocked ? 'blocked' : ''} ${selectMode && selectedTasks.has(task.id) ? 'task-selected' : ''}"
       data-id="${task.id}"
       onclick="${selectMode ? `toggleTaskSelect('${task.id}')` : `openTaskModal('${task.id}')`}">

    <div class="tc-top">
      ${selectMode ? `<div class="tc-select-box ${selectedTasks.has(task.id) ? 'checked' : ''}"
        onclick="event.stopPropagation();toggleTaskSelect('${task.id}')">
        <i class="ti ti-check" style="font-size:9px"></i>
      </div>` : ''}
      <div class="task-check ${done ? 'checked' : ''}"
           onclick="event.stopPropagation();${done ? '' : canClose ? `quickClose('${task.id}')` : ''}"
           title="${done ? 'Completed' : canClose ? 'Mark done' : 'Read only'}">
        ${done ? '<i class="ti ti-check" style="font-size:9px"></i>' : ''}
      </div>
      <div class="task-title">${esc(task.title)}</div>
      <div style="flex-shrink:0">${assigneeChip(task.assigneeId)}</div>
    </div>

    ${hasNotes ? `<div class="tc-note">${esc(task.notes)}</div>` : ''}

    <div class="tc-bottom">
      <div class="task-meta">
        ${clientTag(task.clientId)}
        ${typeTag(task.type)}
        ${priorityTag(task.priority)}
        ${statusTag(task.status, task.dueDate)}
        ${hasSubtasks ? `<span class="tc-st-badge ${stDone===stTotal?'complete':''}">✓ ${stDone}/${stTotal}</span>` : ''}
        ${isBlocked ? `<span class="tc-st-badge" style="background:var(--bg);color:var(--ink-3);border:1px solid var(--border-md)">
          <i class="ti ti-lock" style="font-size:9px"></i> Blocked
        </span>` : ''}
      </div>
      <div class="tc-right">
        <span class="task-due ${over ? 'late' : ''}">
          <i class="ti ti-calendar-event" style="font-size:10px;vertical-align:-1px"></i>
          ${fmtDate(task.dueDate)}
        </span>
        ${!done && canClose
          ? `<button class="btn btn-success btn-sm" style="padding:2px 7px;font-size:10.5px;gap:3px"
               onclick="event.stopPropagation();openTaskModal('${task.id}','close')">
               <i class="ti ti-circle-check" style="font-size:10px"></i> Close
             </button>`
          : ''}
      </div>
    </div>

  </div>`;
}

/* ── Chat state ─────────────────────────────────────────── */
let _chatOpen      = false;
let _chatChannel   = 'team';
let _chatPollTimer = null;
let _chatLastRead  = {}; /* { channelId: lastMessageId } — per session */

/* ── State vars ─────────────────────────────────────────── */
let editUserId          = null;
let editClientSettingsId = null;
let selectMode          = false;
const selectedTasks     = new Set();
let calendarView        = false;
let _calYear            = null;
let _calMonth           = null;

/* ── Stage colour palette ───────────────────────────────── */
const STAGE_COLORS = [
  '#0d7a6b','#1a5fb4','#5b3fa6','#c0392b',
  '#b7691a','#1e6f3e','#c2185b','#546e7a',
];
let _colorPickerTarget = null;

/* ── Skeleton loader ────────────────────────────────────── */
function renderSkeleton(containerId, count = 4) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line title"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>`).join('');
}

/* ── Task list renderer ─────────────────────────────────── */
function renderTaskList(tasks, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!tasks.length) {
    el.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-clipboard-list"></i>
        <p>No tasks found</p>
      </div>`;
    return;
  }
  el.innerHTML = tasks.map(renderTaskCard).join('');
}

/* ── Dashboard ──────────────────────────────────────────── */
function renderDashboard() {
  const s = State.dashStats();
  document.getElementById('stat-total').textContent   = s.total;
  document.getElementById('stat-today').textContent   = s.dueToday;
  document.getElementById('stat-overdue').textContent = s.overdue;
  document.getElementById('stat-done').textContent    = s.done;

  const today    = new Date().toISOString().slice(0,10);
  const priority = State.filterTasks()
    .filter(t => t.status !== 'done')
    .sort((a,b) => {
      const pw = { high:0, medium:1, low:2 };
      if (isOverdue(a) && !isOverdue(b)) return -1;
      if (!isOverdue(a) && isOverdue(b)) return 1;
      return (pw[a.priority]||1) - (pw[b.priority]||1);
    })
    .slice(0, 8);

  /* Render priority tasks as table */
  _renderDashboardTaskTable(priority);

  const od = State.overdueTasks().length;
  document.querySelectorAll('.badge-overdue').forEach(el => {
    el.textContent  = od || '';
    el.style.display = od ? '' : 'none';
  });

  /* Pipeline overdue badge */
  const today2 = new Date().toISOString().slice(0,10);
  const pipeOD = State.tasks.filter(t => t.pipelineId && t.status !== 'done' && t.dueDate < today2).length;
  const pb = document.getElementById('badge-pipelines');
  if (pb) { pb.textContent = pipeOD ? String(pipeOD) : '!'; pb.style.display = pipeOD ? '' : 'none'; }

  renderCompletionChart();
  renderWorkload();

  /* Reminders badge in sidebar */
  const todayR = new Date().toISOString().slice(0,10);
  const myIdR   = State.user?.id;
  const isAdminR = State.user?.role === 'admin';
  const urgentRem = State.reminders.filter(r => {
    if (!r.active || r.paidAt) return false;
    if (!isAdminR && r.assignedUserId !== myIdR) return false;
    const days = Math.ceil((new Date(r.eventDate) - new Date(todayR)) / 86400000);
    return days <= 7;
  }).length;
  const rb = document.getElementById('badge-reminders');
  if (rb) { rb.textContent = urgentRem||''; rb.style.display = urgentRem ? '' : 'none'; }

  /* Documents expiry badge in sidebar */
  const expDocs = State.expiringDocuments(30).length;
  const db = document.getElementById('badge-documents');
  if (db) { db.textContent = expDocs || ''; db.style.display = expDocs ? '' : 'none'; }
}

/* ── Dashboard task table ───────────────────────────────── */
function _renderDashboardTaskTable(tasks) {
  const el = document.getElementById('dash-task-list');
  if (!el) return;
  if (!tasks.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-clipboard-check"></i><p>All caught up!</p></div>`;
    return;
  }
  const today    = new Date().toISOString().slice(0,10);
  const canClose = State.user?.role !== 'viewer';
  el.innerHTML = `
  <div class="task-table-wrap">
  <table class="task-table">
  <thead><tr class="task-table-head">
    <th></th><th>Task</th><th>Client</th>
    <th>Due date</th><th>Status</th><th>Priority</th><th>Assignee</th><th></th>
  </tr></thead>
  <tbody>
    ${tasks.map(t => {
      const done   = t.status === 'done';
      const over   = !done && t.dueDate && t.dueDate < today;
      const client = State.getClient(t.clientId);
      const user   = State.getUser(t.assigneeId);
      const priCls = t.priority === 'high' ? 'pri-high' : t.priority === 'low' ? 'pri-low' : 'pri-medium';
      return `
      <tr class="task-row ${done?'done-row':''} ${priCls}" onclick="openTaskModal('${t.id}')">
        <td><div class="task-check ${done?'checked':''}" style="width:15px;height:15px;font-size:8px"
          onclick="event.stopPropagation();${done?'':canClose?`quickClose('${t.id}')`:''}" >
          ${done?'<i class="ti ti-check" style="font-size:8px"></i>':''}
        </div></td>
        <td class="tt-title">${esc(t.title)}</td>
        <td>${client?`<span class="tag tag-client" style="color:${client.color};background:${client.bg}">${client.short}</span>`:'—'}</td>
        <td style="font-family:var(--mono);font-size:12px;color:${over?'var(--red)':'var(--ink-3)'};white-space:nowrap">${t.dueDate?fmtDate(t.dueDate):'—'}</td>
        <td>${_ttStatusBadge(t, today)}</td>
        <td><span style="font-size:12px;font-weight:700;color:${t.priority==='high'?'var(--red)':t.priority==='low'?'var(--ink-4)':'var(--amber)'}">
          ${t.priority==='high'?'↑ High':t.priority==='low'?'↓ Low':'→ Med'}
        </span></td>
        <td>${user?`<div class="assign-chip ${user.avClass}" style="width:24px;height:24px;font-size:8.5px">${user.initials}</div>`:'—'}</td>
        <td onclick="event.stopPropagation()">
          <div class="tt-row-actions">
            ${!done&&canClose?`<button class="btn btn-success btn-sm" style="padding:2px 7px;font-size:10px"
              onclick="openTaskModal('${t.id}','close')">Close</button>`:''}
          </div>
        </td>
      </tr>`;
    }).join('')}
  </tbody></table></div>`;
}

/* ── Completion bar chart (canvas) ──────────────────────── */
function renderCompletionChart() {
  const canvas = document.getElementById('completion-chart');
  if (!canvas) return;
  requestAnimationFrame(() => _drawChart(canvas));
}

function _drawChart(canvas) {
  const month = new Date().toISOString().slice(0, 7);
  const data  = State.clients.map(c => ({
    label: c.short,
    color: c.color,
    count: State.tasks.filter(t =>
      t.clientId === c.id && t.status === 'done' &&
      t.closedAt && String(t.closedAt).startsWith(month)
    ).length,
  }));

  const maxVal = Math.max(...data.map(d => d.count), 1);
  const parent = canvas.parentElement;
  const W      = parent ? Math.max(parent.clientWidth - 44, 200) : 600;
  const H      = 150;
  const dpr    = window.devicePixelRatio || 1;

  canvas.width        = W * dpr;
  canvas.height       = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const n      = data.length;
  const pad    = 20;
  const gap    = (W - pad * 2) / n;
  const barW   = Math.max(Math.floor(gap * 0.45), 14);
  const maxH   = H - 42;
  const baseY  = H - 22;

  /* Baseline */
  ctx.fillStyle = '#e8e5df';
  ctx.fillRect(pad, baseY, W - pad * 2, 1);

  data.forEach((d, i) => {
    const cx   = pad + gap * i + gap / 2;
    const barH = Math.max(Math.round(d.count / maxVal * maxH), d.count > 0 ? 3 : 0);
    const x    = Math.round(cx - barW / 2);
    const y    = baseY - barH;

    /* Track */
    ctx.fillStyle = '#f0ede8';
    ctx.fillRect(x, baseY - maxH, barW, maxH);

    /* Bar */
    if (barH > 0) {
      ctx.fillStyle = d.color + 'bb';
      ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = d.color;
      ctx.fillRect(x, y, barW, 2);
    }

    /* Count */
    if (d.count > 0) {
      ctx.font      = '600 11px "Geist Mono",monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = d.color;
      ctx.fillText(String(d.count), cx, y - 5);
    }

    /* Label */
    ctx.font      = '10px "Geist Mono",monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8a49e';
    ctx.fillText(d.label, cx, baseY + 15);
  });
}

/* ── All tasks page ─────────────────────────────────────── */
let taskFilter    = { status:'active', type:'all', clientId:'all', assigneeId:'all', search:'' };
let groupByClient = false;

function renderAllTasks() {
  /* Keep dropdowns in sync with current filter state */
  const csel = document.getElementById('filter-client-select');
  const asel = document.getElementById('filter-assignee-select');
  if (csel && csel.value !== taskFilter.clientId)   csel.value = taskFilter.clientId   || 'all';
  if (asel && asel.value !== taskFilter.assigneeId) asel.value = taskFilter.assigneeId || 'all';

  const tasks = State.filterTasks(taskFilter).sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  const lbl = document.getElementById('task-count-label');
  if (lbl) lbl.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
  renderSavedViews();

  if (groupByClient) {
    _renderTasksGrouped(tasks);
  } else if (!calendarView) {
    _renderTasksByDate(tasks);
  }
}

function _renderTasksGrouped(tasks) {
  const el = document.getElementById('all-task-list');
  if (!el) return;
  if (!tasks.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-clipboard-list"></i><p>No tasks found</p></div>`;
    return;
  }

  /* Build groups preserving client order from State.clients */
  const grouped = {};
  tasks.forEach(t => { (grouped[t.clientId] = grouped[t.clientId] || []).push(t); });

  const orderedClients = State.clients.filter(c => grouped[c.id]);

  const today    = new Date().toISOString().slice(0,10);
  const canClose = State.user?.role !== 'viewer';

  el.innerHTML = orderedClients.map(c => {
    const clientTasks = grouped[c.id];
    return `
      <div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;
          padding-bottom:6px;border-bottom:2px solid ${c.color}33">
          <span style="width:8px;height:8px;border-radius:50%;background:${c.color};flex-shrink:0"></span>
          <span style="font-size:11px;font-weight:700;color:var(--ink-2);
            text-transform:uppercase;letter-spacing:0.7px">${c.name}</span>
          <span style="font-size:10px;font-family:var(--mono);color:var(--ink-4);
            background:var(--bg);border:1px solid var(--border);
            border-radius:20px;padding:0 6px">${clientTasks.length}</span>
        </div>
        ${_TABLE_HEAD}
          ${clientTasks.map(t => _renderTaskRow(t, today, canClose)).join('')}
        </tbody></table></div>
      </div>`;
  }).join('');
}

function _ttStatusBadge(task, today) {
  const done = task.status === 'done';
  const over = !done && task.dueDate < today;
  if (done) return `<span class="tt-status-badge" style="background:var(--green-light);color:var(--green)"><i class="ti ti-check" style="font-size:10px"></i> Done</span>`;
  if (over) return `<span class="tt-status-badge" style="background:var(--red-light);color:var(--red)"><i class="ti ti-alert-triangle" style="font-size:10px"></i> Overdue</span>`;
  if (task.status === 'progress') return `<span class="tt-status-badge" style="background:var(--blue-light);color:var(--blue)"><i class="ti ti-loader" style="font-size:10px"></i> In progress</span>`;
  return `<span class="tt-status-badge" style="background:var(--bg-active);color:var(--ink-3)"><i class="ti ti-circle" style="font-size:10px"></i> Pending</span>`;
}

function _ttProgressCell(task) {
  const subs  = task.subtasks || [];
  const total = subs.length;
  if (!total) return `<span style="color:var(--ink-4);font-size:12px">—</span>`;
  const done = subs.filter(s => s.done).length;
  const pct  = Math.round(done / total * 100);
  const color = pct === 100 ? 'var(--accent)' : pct > 50 ? 'var(--blue)' : 'var(--amber)';
  return `<div class="tt-progress-wrap">
    <div class="tt-progress-bar"><div class="tt-progress-fill" style="width:${pct}%;background:${color}"></div></div>
    <span>${done}/${total}</span>
  </div>`;
}

function _renderTaskRow(task, today, canClose) {
  const done   = task.status === 'done';
  const over   = !done && task.dueDate && task.dueDate < today;
  const client = State.getClient(task.clientId);
  const user   = State.getUser(task.assigneeId);
  const subs   = task.subtasks || [];
  const isBlocked = State.isBlocked(task.id);
  const priCls = task.priority === 'high' ? 'pri-high' : task.priority === 'low' ? 'pri-low' : 'pri-medium';
  const selCls = selectMode && selectedTasks.has(task.id) ? 'task-selected' : '';

  return `
  <tr class="task-row ${done?'done-row':''} ${priCls} ${selCls}"
      data-id="${task.id}"
      onclick="${selectMode ? `toggleTaskSelect('${task.id}')` : `openTaskModal('${task.id}')`}">
    <td>
      ${selectMode
        ? `<div class="tc-select-box ${selectedTasks.has(task.id)?'checked':''}"
             onclick="event.stopPropagation();toggleTaskSelect('${task.id}')">
             <i class="ti ti-check" style="font-size:9px"></i></div>`
        : `<div class="task-check ${done?'checked':''}"
             onclick="event.stopPropagation();${done?'':canClose?`quickClose('${task.id}')`:''}"
             style="width:15px;height:15px;font-size:8px">
             ${done?'<i class="ti ti-check" style="font-size:8px"></i>':''}
           </div>`}
    </td>
    <td class="tt-title">
      ${esc(task.title)}
      ${isBlocked ? `<i class="ti ti-lock" style="font-size:10px;color:var(--ink-4);margin-left:5px"></i>` : ''}
      ${subs.length ? `<span style="font-size:10px;color:var(--ink-4);font-family:var(--mono);margin-left:5px">✓${subs.filter(s=>s.done).length}/${subs.length}</span>` : ''}
    </td>
    <td style="white-space:nowrap">
      ${client ? `<span class="tag tag-client" style="color:${client.color};background:${client.bg}">${client.short}</span>` : '—'}
    </td>
    <td style="font-family:var(--mono);font-size:12px;color:${over?'var(--red)':'var(--ink-3)'};white-space:nowrap">
      ${task.dueDate ? fmtDate(task.dueDate) : '—'}
    </td>
    <td>${_ttStatusBadge(task, today)}</td>
    <td>
      <span style="font-size:12px;font-weight:700;color:${task.priority==='high'?'var(--red)':task.priority==='low'?'var(--ink-4)':'var(--amber)'}">
        ${task.priority==='high'?'↑ High':task.priority==='low'?'↓ Low':'→ Med'}
      </span>
    </td>
    <td>${_ttProgressCell(task)}</td>
    <td>
      ${user ? `<div class="assign-chip ${user.avClass}" title="${user.name}"
        style="width:24px;height:24px;font-size:8.5px">${user.initials}</div>` : '—'}
    </td>
    <td onclick="event.stopPropagation()">
      <div class="tt-row-actions">
        ${!done && canClose ? `<button class="btn btn-success btn-sm" style="padding:2px 7px;font-size:10px"
          onclick="openTaskModal('${task.id}','close')">Close</button>` : ''}
        ${State.user?.role==='admin' ? `<button class="btn btn-ghost btn-sm" style="padding:2px 6px"
          onclick="openEditModal('${task.id}')"><i class="ti ti-edit" style="font-size:11px"></i></button>` : ''}
      </div>
    </td>
  </tr>`;
}

const _TABLE_HEAD = `
<div class="task-table-wrap">
<table class="task-table">
<thead><tr class="task-table-head">
  <th></th>
  <th>Task</th>
  <th>Client</th>
  <th>Due date</th>
  <th>Status</th>
  <th>Priority</th>
  <th>Progress</th>
  <th>Assignee</th>
  <th></th>
</tr></thead><tbody>`;

function _renderTasksByDate(tasks) {
  const el = document.getElementById('all-task-list');
  if (!el) return;
  if (!tasks.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-clipboard-list"></i><p>No tasks found</p></div>`;
    return;
  }

  const today    = new Date().toISOString().slice(0,10);
  const canClose = State.user?.role !== 'viewer';
  const overdue  = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today);
  const rest     = tasks.filter(t => !(t.status !== 'done' && t.dueDate && t.dueDate < today));

  const byDate = {};
  rest.forEach(t => { const k = t.dueDate||'__none__'; (byDate[k]=byDate[k]||[]).push(t); });
  const sortedDates = Object.keys(byDate).sort((a,b)=>{ if(a==='__none__')return 1; if(b==='__none__')return -1; return a.localeCompare(b); });

  let html = _TABLE_HEAD;

  if (overdue.length) {
    html += `<tr class="task-group-row overdue-group"><td colspan="9">
      <i class="ti ti-alert-triangle" style="font-size:11px;margin-right:6px"></i>
      Overdue <span style="opacity:0.6;font-weight:400;margin-left:4px">${overdue.length} task${overdue.length!==1?'s':''}</span>
    </td></tr>`;
    html += overdue.map(t => _renderTaskRow(t, today, canClose)).join('');
  }

  sortedDates.forEach(date => {
    const isToday = date === today;
    const isNone  = date === '__none__';
    const label   = isNone ? 'No due date' : isToday ? `Today — ${fmtDate(date)}` : fmtDate(date);
    const grpCls  = isToday ? 'today-group' : 'normal-group';
    const icon    = isToday ? 'ti-calendar-event' : 'ti-calendar';
    html += `<tr class="task-group-row ${grpCls}"><td colspan="9">
      <i class="ti ${icon}" style="font-size:11px;margin-right:6px"></i>
      ${label} <span style="opacity:0.6;font-weight:400;margin-left:4px">${byDate[date].length}</span>
    </td></tr>`;
    html += byDate[date].map(t => _renderTaskRow(t, today, canClose)).join('');
  });

  html += `</tbody></table></div>`;

  /* Add task row at bottom */
  if (State.user?.role === 'admin') {
    html += `<div style="margin-top:4px">
      <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:flex-start;border-style:dashed;color:var(--ink-3)"
        onclick="openNewTaskModal()">
        <i class="ti ti-plus"></i> Add new task
      </button>
    </div>`;
  }

  el.innerHTML = html;
}

function toggleGroupByClient() {
  groupByClient = !groupByClient;
  const btn = document.getElementById('group-toggle-btn');
  if (btn) {
    btn.innerHTML = groupByClient
      ? '<i class="ti ti-layout-list"></i> Ungroup'
      : '<i class="ti ti-layout-rows"></i> Group by client';
    btn.style.background      = groupByClient ? 'var(--ink)'        : '';
    btn.style.color           = groupByClient ? 'var(--bg-sidebar)' : '';
    btn.style.borderColor     = groupByClient ? 'var(--ink)'        : '';
  }
  renderAllTasks();
}

function setFilter(key, val, el) {
  /* Clicking the same type chip again deselects it → show all types */
  if (key === 'type' && taskFilter[key] === val) {
    taskFilter[key] = 'all';
    el.classList.remove('on');
    renderAllTasks();
    return;
  }
  taskFilter[key] = val;
  if (el) {
    /* Only clear chips in the same filter group (status or type) */
    el.closest('.filter-bar')
      .querySelectorAll(`.filter-chip[data-filter="${key}"]`)
      .forEach(c => c.classList.remove('on'));
    el.classList.add('on');
  }
  renderAllTasks();
}

/* ── Clients page ───────────────────────────────────────── */
let _dragClientId    = null;
let _activeClientTag = null;
let _showArchived    = false;
let _clientSort      = 'manual'; /* 'manual' | 'az' | 'tasks' */

function setClientSort(sort) {
  _clientSort = sort;
  /* Update button states */
  ['manual','az','tasks'].forEach(s => {
    const btn = document.getElementById(`csort-${s}`);
    if (!btn) return;
    const on = s === sort;
    btn.style.background  = on ? 'var(--ink)' : '';
    btn.style.color       = on ? 'var(--bg-sidebar)' : '';
    btn.style.borderColor = on ? 'var(--ink)' : '';
  });
  renderClients();
}

function toggleShowArchived() {
  _showArchived = !_showArchived;
  const btn = document.getElementById('archived-toggle-btn');
  const lbl = document.getElementById('archived-toggle-label');
  if (btn) {
    btn.style.background  = _showArchived ? 'var(--amber-light)' : '';
    btn.style.color       = _showArchived ? 'var(--amber)' : '';
    btn.style.borderColor = _showArchived ? 'var(--amber)' : '';
  }
  if (lbl) lbl.textContent = _showArchived ? 'Hide archived' : 'Show archived';
  renderClients();
}

function setClientTagFilter(tag) {
  _activeClientTag = _activeClientTag === tag ? null : tag; /* toggle */
  renderClients();
  const clearBtn = document.getElementById('client-tag-clear');
  if (clearBtn) clearBtn.style.display = _activeClientTag ? '' : 'none';
}

function renderClientTagFilter() {
  const bar   = document.getElementById('client-tag-filter-bar');
  const chips = document.getElementById('client-tag-chips');
  if (!bar || !chips) return;
  const tags = State.allClientTags();
  if (!tags.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  chips.innerHTML = tags.map(t => `
    <button class="client-tag" onclick="setClientTagFilter('${esc(t)}')"
      style="${_activeClientTag===t?'background:var(--ink);color:var(--bg-sidebar);border-color:var(--ink)':''}">
      ${esc(t)}
    </button>`).join('');
}

function renderClients() {
  const el = document.getElementById('client-grid');
  if (!el) return;

  renderClientTagFilter();

  const archivedCount = State.clients.filter(c => !c.active).length;
  const archBtn = document.getElementById('archived-toggle-btn');
  const archLbl = document.getElementById('archived-toggle-label');
  if (archBtn) {
    archBtn.style.display = archivedCount > 0 ? '' : 'none';
    if (archLbl && !_showArchived) archLbl.textContent = `Show archived (${archivedCount})`;
  }

  let health = State.clientHealth()
    .filter(c => {
      const client = State.getClient(c.id);
      return _showArchived ? client?.active === false : client?.active !== false;
    });

  /* Apply sort */
  if (_clientSort === 'az') {
    health.sort((a, b) => a.name.localeCompare(b.name));
  } else if (_clientSort === 'tasks') {
    health.sort((a, b) => b.total - a.total);
  } else {
    /* manual — sort by drag-drop sortOrder */
    health.sort((a,b) => (State.getClient(a.id)?.sortOrder ?? 999) - (State.getClient(b.id)?.sortOrder ?? 999));
  }

  if (_activeClientTag) {
    health = health.filter(c => (State.getClient(c.id)?.tags||[]).includes(_activeClientTag));
  }
  const isAdmin = State.user?.role === 'admin';

  el.innerHTML = health.map(c => {
    const hs      = State.clientHealthScore(c.id);
    const vat     = State.vatNextDue(c.id);
    const vatSoon = vat && vat <= new Date(Date.now()+30*86400000).toISOString().slice(0,10);
    const cls     = State.getClient(c.id)?.classification || 'Mainland';
    return `
    <div class="client-card" data-client-id="${c.id}"
         draggable="${isAdmin}"
         onclick="openClientProfile('${c.id}')"
         ondragstart="clientDragStart(event,'${c.id}')"
         ondragend="clientDragEnd(event)"
         ondragover="clientDragOver(event)"
         ondragleave="clientDragLeave(event)"
         ondrop="clientDrop(event,'${c.id}')">
      <div class="client-card-accent" style="background:${State.getClient(c.id)?.active===false?'var(--border-md)':c.color}"></div>
      ${State.getClient(c.id)?.active === false ? `<div style="position:absolute;top:10px;left:12px;font-size:9.5px;
        font-weight:700;color:var(--ink-3);background:var(--bg-active);
        border:1px solid var(--border-md);border-radius:20px;padding:1px 7px;letter-spacing:0.5px">ARCHIVED</div>` : ''}
      ${isAdmin ? `<i class="ti ti-grip-vertical client-drag-handle" onclick="event.stopPropagation()" title="Drag to reorder"></i>` : ''}
      <div class="client-card-body">
        <div class="client-card-top">
          <div class="client-initial" style="background:${c.bg};color:${c.color}">${c.short}</div>
          <div class="client-name-block">
            <div class="client-name" title="${c.name}">${esc(c.name)}</div>
            <div class="client-sub">
              <span>${c.short}</span><span style="color:var(--border-hi)">·</span><span>${cls}</span>
            </div>
          </div>
          <div class="health-badge" style="background:${hs.bg};color:${hs.color};flex-shrink:0"
               title="${hs.label}">${hs.score}</div>
        </div>
        <div class="client-stats">
          <div class="client-stat">
            <div class="client-stat-val">${c.total}</div>
            <div class="client-stat-lbl">Tasks</div>
          </div>
          <div class="client-stat">
            <div class="client-stat-val" style="color:var(--accent)">${c.done}</div>
            <div class="client-stat-lbl">Done</div>
          </div>
          <div class="client-stat">
            <div class="client-stat-val" style="color:${c.overdue?'var(--red)':'var(--ink)'}">${c.overdue}</div>
            <div class="client-stat-lbl">Overdue</div>
          </div>
        </div>
        <div class="progress-wrap">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink-3);margin-bottom:4px">
            <span>Completion</span>
            <span style="font-family:var(--mono);font-weight:700;color:${c.overdue?'var(--amber)':'var(--accent)'}">${c.pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${c.pct}%;background:${c.overdue?'var(--amber)':'var(--accent)'}"></div>
          </div>
        </div>
        ${vat ? `<div style="margin-top:8px;font-size:10.5px;color:${vatSoon?'var(--amber)':'var(--ink-3)'};
          display:flex;align-items:center;gap:4px">
          <i class="ti ti-receipt" style="font-size:11px"></i> VAT due ${fmtDate(vat)}
        </div>` : ''}
        ${(State.getClient(c.id)?.tags||[]).length ? `
        <div class="client-tags-row">
          ${(State.getClient(c.id).tags).map(t => `<span class="client-tag">${esc(t)}</span>`).join('')}
        </div>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* ── Client card drag & drop ────────────────────────────── */
function clientDragStart(e, id) {
  _dragClientId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.currentTarget?.classList.add('dragging'), 0);
}
function clientDragEnd(e) {
  e.currentTarget?.classList.remove('dragging');
  document.querySelectorAll('.client-card.drag-over').forEach(el => el.classList.remove('drag-over'));
}
function clientDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function clientDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.classList.remove('drag-over');
}
async function clientDrop(e, targetId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!_dragClientId || _dragClientId === targetId) return;
  const fi = State.clients.findIndex(c => c.id === _dragClientId);
  const ti = State.clients.findIndex(c => c.id === targetId);
  if (fi < 0 || ti < 0) return;
  const [moved] = State.clients.splice(fi, 1);
  State.clients.splice(ti, 0, moved);
  _dragClientId = null;
  renderClients();
  toast('Order saved');
  await State.saveClientOrder();
}

function filterByClient(clientId) {
  taskFilter.clientId = clientId;
  taskFilter.status   = 'active';
  taskFilter.type     = 'all';
  showPage('tasks', document.querySelector('[data-page=tasks]'));
  setTimeout(() => {
    /* Sync the dropdown to the active filter */
    const sel = document.getElementById('filter-client-select');
    if (sel) sel.value = clientId;
    renderAllTasks();
  }, 60);
}

/* ── New client modal ───────────────────────────────────── */
function openNewClientModal() {
  document.getElementById('cf-name').value  = '';
  document.getElementById('cf-short').value = '';
  document.getElementById('cf-color').value = '#4f8ef7';
  document.getElementById('cf-tags').value  = '';
  document.getElementById('client-form-modal').classList.add('open');
}

function closeClientForm() {
  editClientSettingsId = null;
  const modal = document.getElementById('client-form-modal');
  modal.querySelector('.modal-title').textContent = 'New client';
  modal.querySelector('.btn-primary').innerHTML   = '<i class="ti ti-circle-check"></i> Add client';
  modal.classList.remove('open');
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

async function submitClientForm() {
  const name  = document.getElementById('cf-name').value.trim();
  const short = document.getElementById('cf-short').value.trim().toUpperCase();
  const color = document.getElementById('cf-color').value;
  const tags  = (document.getElementById('cf-tags').value||'').split(',').map(t=>t.trim()).filter(Boolean);

  if (!name || !short) {
    toast('Please fill in name and short code', 'error');
    return;
  }
  if (short.length < 2) {
    toast('Short code must be at least 2 letters', 'error');
    return;
  }
  const dup = State.clients.find(c => c.short === short && c.id !== editClientSettingsId);
  if (dup) { toast(`Short code "${short}" is already used`, 'error'); return; }

  const saveBtn = document.querySelector('#client-form-modal .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  const bg = hexToRgba(color, 0.12);

  if (editClientSettingsId) {
    await State.updateClient(editClientSettingsId, { name, short, color, bg, tags });
    if (saveBtn) { saveBtn.disabled = false; }
    closeClientForm();
    renderSettingsClients();
    populateFormDropdowns();
    renderClients();
    toast('Client updated!');
  } else {
    const newClient = { id:'c' + Date.now(), name, short, color, bg, active:true, tags, sortOrder: State.clients.length };
    State.clients.push(newClient);
    if (State.useSheets) {
      await Sheets.addClient(newClient); /* Supabase insert */
    }
    if (saveBtn) { saveBtn.disabled = false; }
    closeClientForm();
    populateFormDropdowns();
    renderClients();
    if (typeof currentPage !== 'undefined' && currentPage === 'settings') renderSettingsClients();
    toast(`Client "${name}" added!`);
  }
}

/* ── Users page ─────────────────────────────────────────── */
function renderUsers() {
  const el = document.getElementById('user-profile-grid');
  if (!el) return;
  el.innerHTML = State.users.map(u => `
    <div class="user-profile-card">
      <div class="upc-top">
        <div class="av-large ${u.avClass}">${u.initials}</div>
        <div>
          <div class="upc-name">${u.name}</div>
          <div class="upc-email">${u.email}</div>
        </div>
      </div>
      <span class="role-pill role-${u.role === 'admin' ? 'admin' : u.role === 'assistant' ? 'asst' : 'viewer'}">
        <i class="ti ti-${u.role === 'admin' ? 'crown' : u.role === 'assistant' ? 'pencil' : 'eye'}" style="font-size:10px"></i>
        ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}
      </span>
    </div>`).join('');
}

/* ── Templates page ─────────────────────────────────────── */
function renderTemplates() {
  /* Set default month on the generate bar */
  const tgMonth = document.getElementById('tg-month');
  if (tgMonth && !tgMonth.value) {
    tgMonth.value = new Date().toISOString().slice(0, 7);
  }
  const el = document.getElementById('template-list');
  if (!el) return;
  if (!State.templates.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-repeat"></i><p>No recurring templates yet</p></div>`;
    return;
  }
  const isAdmin = State.user?.role === 'admin';
  el.innerHTML = State.templates.map(tp => {
    const client   = State.getClient(tp.clientId);
    const recLabel = {
      daily:   'Every day',
      weekly:  `Every ${tp.dayOfWeek || 'Mon'}`,
      monthly: tp.dayOfMonth ? `Day ${tp.dayOfMonth} of each month` : 'Monthly',
    };
    return `
    <div class="task-card" style="cursor:default">
      <div class="tc-top">
        <div style="color:var(--accent);flex-shrink:0;font-size:15px;
          background:var(--accent-light);border-radius:var(--radius-sm);
          width:28px;height:28px;display:flex;align-items:center;justify-content:center">
          <i class="ti ti-repeat"></i>
        </div>
        <div class="task-title">${tp.title}</div>
        ${assigneeChip(tp.assigneeId)}
      </div>
      <div class="tc-bottom">
        <div class="task-meta">
          ${client ? `<span class="tag tag-client" style="color:${client.color};background:${client.bg}">${client.short}</span>` : ''}
          <span class="tag tag-${tp.recurrence}">${tp.recurrence.charAt(0).toUpperCase()+tp.recurrence.slice(1)}</span>
          <span style="font-size:11px;color:var(--ink-3)">${recLabel[tp.recurrence] || ''}</span>
        </div>
        <div class="tc-right">
          <span style="font-size:10.5px;padding:2px 9px;border-radius:20px;font-weight:600;flex-shrink:0;
            ${tp.active
              ? 'background:var(--green-light);color:var(--green)'
              : 'background:var(--bg);color:var(--ink-3);border:1px solid var(--border-md)'}">
            ${tp.active ? 'Active' : 'Paused'}
          </span>
          ${isAdmin ? `
          <button class="btn btn-ghost btn-sm" onclick="openEditTemplateModal('${tp.id}')">
            <i class="ti ti-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteTemplate('${tp.id}')">
            <i class="ti ti-trash"></i>
          </button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Task detail modal ──────────────────────────────────── */
let activeTaskId = null;

function openTaskModal(taskId, tab) {
  activeTaskId = taskId;
  const task     = State.getTask(taskId);
  if (!task) return;
  const client   = State.getClient(task.clientId);
  const assignee = State.getUser(task.assigneeId);
  const comments = State.getComments(taskId);
  const canClose = State.user?.role !== 'viewer';
  const canEdit  = State.user?.role === 'admin';
  const done     = task.status === 'done';

  document.getElementById('modal-task-title').textContent = task.title; /* textContent auto-escapes */

  const pipeline = task.pipelineId ? State.getPipeline(task.pipelineId) : null;
  const stage    = task.pipelineStageId ? State.stages.find(s => s.id === task.pipelineStageId) : null;

  document.getElementById('modal-task-body').innerHTML = `
    <div class="detail-meta">
      <div class="detail-meta-item">
        <label>Client</label>
        <span>${client ? client.name : '—'}</span>
      </div>
      <div class="detail-meta-item">
        <label>Assigned to</label>
        <span>${assignee ? assignee.name : '—'}</span>
      </div>
      <div class="detail-meta-item">
        <label>Due date</label>
        <span style="${isOverdue(task) ? 'color:var(--red)' : ''}">${fmtDate(task.dueDate)}</span>
      </div>
      <div class="detail-meta-item">
        <label>Type</label>
        <span>${task.type.charAt(0).toUpperCase()+task.type.slice(1)}</span>
      </div>
      <div class="detail-meta-item">
        <label>Priority</label>
        <span>${priorityTag(task.priority)}</span>
      </div>
      <div class="detail-meta-item">
        <label>Status</label>
        <span>${statusTag(task.status, task.dueDate)}</span>
      </div>
      ${pipeline ? `
      <div class="detail-meta-item" style="grid-column:1/-1">
        <label>Pipeline</label>
        <span style="display:flex;align-items:center;gap:6px">
          <i class="ti ti-layout-kanban" style="font-size:12px;color:var(--ink-3)"></i>
          ${pipeline.name}
          ${stage ? `<i class="ti ti-chevron-right" style="font-size:11px;color:var(--ink-4)"></i>
          ${stage.color ? `<span style="width:8px;height:8px;border-radius:50%;background:${stage.color};display:inline-block"></span>` : ''}
          ${stage.name}` : ''}
        </span>
      </div>` : ''}
    </div>

    ${task.notes ? `
      <p style="font-size:13px;color:var(--ink-2);margin-bottom:18px;line-height:1.65;
        padding:12px 14px;background:var(--bg);border-radius:var(--radius-sm);
        border-left:2px solid var(--border-md)">${esc(task.notes)}</p>` : ''}

    ${(task.subtasks?.length || canClose) ? _renderChecklistSection(task, canClose) : ''}
    ${_renderDependenciesSection(task, canEdit)}
    ${_renderTimeLogSection(task, canClose)}

    ${comments.length ? `
      <div class="section-title" style="margin-bottom:12px">Comments</div>
      <div class="comment-thread">
        ${comments.map(cm => {
          const u = State.getUser(cm.userId);
          const canEdit = State.user?.role === 'admin' || cm.userId === State.user?.id;
          return `<div class="comment-item" id="cm-item-${cm.id}">
            <div class="avatar ${u?.avClass||'av-admin'}" style="width:26px;height:26px;font-size:9px;flex-shrink:0">${u?.initials||'?'}</div>
            <div class="comment-body" style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                <div>
                  <span class="comment-who">${u?.name||'Unknown'}</span>
                  <span class="comment-when">${cm.createdAt}</span>
                </div>
                ${canEdit ? `<button class="btn btn-ghost btn-sm"
                  style="padding:2px 7px;font-size:11px;flex-shrink:0"
                  onclick="editComment('${cm.id}')">
                  <i class="ti ti-pencil" style="font-size:11px"></i> Edit
                </button>` : ''}
              </div>
              <div class="comment-text" id="cm-text-${cm.id}">${esc(cm.text)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}

    ${canClose && !done ? `
      <div class="close-task-box">
        <div class="close-task-title"><i class="ti ti-circle-check"></i> Close this task</div>
        <textarea id="close-comment-input"
          placeholder="Optional closing note — e.g. filed, reference number, confirmation…"></textarea>
        <div class="close-task-actions">
          <button class="btn btn-ghost btn-sm" onclick="closeTaskModal()">Cancel</button>
          <button class="btn btn-success btn-sm" onclick="submitCloseTask()">
            <i class="ti ti-circle-check"></i> Mark as done
          </button>
        </div>
      </div>` : ''}

    ${done && task.closeComment ? `
      <div style="background:var(--green-light);border:1px solid rgba(30,111,62,0.15);
        border-radius:var(--radius);padding:12px 14px;margin-top:14px">
        <div style="font-size:10.5px;font-weight:600;color:var(--green);margin-bottom:4px;
          text-transform:uppercase;letter-spacing:0.5px">
          <i class="ti ti-circle-check" style="font-size:12px"></i>
          Completed ${fmtDate(task.closedAt)}
        </div>
        <div style="font-size:13px;color:var(--ink-2)">${task.closeComment}</div>
      </div>` : ''}

    ${canClose && !done ? `
      <div class="divider"></div>
      <div class="form-group">
        <label class="form-label">Add a comment</label>
        <textarea class="form-textarea" id="new-comment-input"
          placeholder="Add a note or update…" style="height:64px"></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <button class="btn btn-ghost btn-sm" onclick="submitComment()">
            <i class="ti ti-send"></i> Comment
          </button>
        </div>
      </div>` : ''}

    ${_renderActivitySection(task.id)}
  `;

  document.getElementById('modal-task-footer').innerHTML = `
    <span style="font-size:11px;color:var(--ink-3);font-family:var(--mono)">
      Created ${fmtDate(task.createdAt)}
    </span>
    <div style="display:flex;gap:7px;flex-wrap:wrap">
      ${canEdit ? `
        <button class="btn btn-ghost btn-sm" onclick="duplicateTask('${task.id}')">
          <i class="ti ti-copy"></i> Duplicate
        </button>
        <button class="btn btn-ghost btn-sm" onclick="saveAsTemplate('${task.id}')">
          <i class="ti ti-repeat"></i> Save as template
        </button>
        <button class="btn btn-ghost btn-sm" onclick="openEditModal('${task.id}')">
          <i class="ti ti-edit"></i> Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">
          <i class="ti ti-trash"></i> Delete
        </button>` : ''}
    </div>
  `;

  document.getElementById('task-detail-modal').classList.add('open');
  if (tab === 'close') {
    setTimeout(() => {
      document.getElementById('close-comment-input')?.focus();
      document.getElementById('close-comment-input')?.scrollIntoView({ behavior:'smooth' });
    }, 120);
  }
}

function closeTaskModal() {
  document.getElementById('task-detail-modal').classList.remove('open');
  activeTaskId = null;
}

async function submitCloseTask() {
  if (!activeTaskId) return;
  const comment = document.getElementById('close-comment-input')?.value?.trim() || '';
  const btn = document.querySelector('.close-task-actions .btn-success');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }
  await State.closeTask(activeTaskId, comment);
  closeTaskModal();
  toast('Task marked as done!');
  refreshCurrentPage();
}

async function submitComment() {
  if (!activeTaskId) return;
  const input = document.getElementById('new-comment-input');
  const text  = input?.value?.trim();
  if (!text) return;
  await State.addComment(activeTaskId, text);
  toast('Comment added');
  input.value = '';
  openTaskModal(activeTaskId);
}

function editComment(commentId) {
  const cm = State.comments.find(c => c.id === commentId);
  if (!cm) return;
  const textEl = document.getElementById(`cm-text-${commentId}`);
  if (!textEl) return;
  textEl.innerHTML = `
    <textarea class="form-textarea" id="cm-edit-${commentId}"
      style="height:64px;margin-top:5px;font-size:13px">${esc(cm.text)}</textarea>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:7px">
      <button class="btn btn-ghost btn-sm" onclick="cancelCommentEdit('${commentId}')">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="saveCommentEdit('${commentId}')">
        <i class="ti ti-check"></i> Save
      </button>
    </div>`;
  document.getElementById(`cm-edit-${commentId}`)?.focus();
}

function cancelCommentEdit(commentId) {
  const cm = State.comments.find(c => c.id === commentId);
  if (!cm) return;
  const textEl = document.getElementById(`cm-text-${commentId}`);
  if (textEl) textEl.innerHTML = esc(cm.text);
}

async function saveCommentEdit(commentId) {
  const textarea = document.getElementById(`cm-edit-${commentId}`);
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) { toast('Comment cannot be empty', 'error'); return; }

  const saveBtn = textarea.nextElementSibling?.querySelector('.btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="ti ti-loader"></i>'; }

  await State.updateComment(commentId, text);

  const textEl = document.getElementById(`cm-text-${commentId}`);
  if (textEl) textEl.innerHTML = esc(text);
  toast('Comment updated');
}

async function quickClose(taskId) {
  await State.closeTask(taskId, '');
  toast('Task marked as done!');
  refreshCurrentPage();
}

async function deleteTask(taskId) {
  if (!confirm('Delete this task? This cannot be undone.')) return;
  await State.deleteTask(taskId);
  closeTaskModal();
  toast('Task deleted', 'error');
  refreshCurrentPage();
}

/* ── New / Edit task modal ──────────────────────────────── */
let editTaskId = null;

function openNewTaskModal() {
  editTaskId = null;
  document.getElementById('task-form-title').textContent = 'New task';
  document.getElementById('task-form').reset();
  populateFormDropdowns(); /* refresh all dropdowns including pipelines */
  const ps = document.getElementById('tf-pipeline');
  if (ps) { ps.value = ''; onPipelineSelectChange(''); }
  document.getElementById('task-form-modal').classList.add('open');
}

function openEditModal(taskId) {
  editTaskId = taskId;
  const task = State.getTask(taskId);
  if (!task) return;
  closeTaskModal();
  populateFormDropdowns(); /* refresh all dropdowns including pipelines */
  document.getElementById('task-form-title').textContent = 'Edit task';
  document.getElementById('tf-title').value    = task.title;
  document.getElementById('tf-client').value   = task.clientId;
  document.getElementById('tf-assignee').value = task.assigneeId;
  document.getElementById('tf-type').value     = task.type;
  document.getElementById('tf-priority').value = task.priority;
  document.getElementById('tf-due').value      = task.dueDate;
  document.getElementById('tf-notes').value    = task.notes || '';
  const ps = document.getElementById('tf-pipeline');
  if (ps) {
    ps.value = task.pipelineId || '';
    onPipelineSelectChange(task.pipelineId || '');
    const ss = document.getElementById('tf-stage');
    if (ss && task.pipelineStageId) ss.value = task.pipelineStageId;
  }
  document.getElementById('task-form-modal').classList.add('open');
}

function closeTaskForm() {
  document.getElementById('task-form-modal').classList.remove('open');
  editTaskId = null;
}

async function submitTaskForm() {
  if (State.user?.role !== 'admin') {
    toast('Only admins can create or edit tasks', 'error'); return;
  }
  const title      = document.getElementById('tf-title').value.trim();
  const clientId   = document.getElementById('tf-client').value;
  const assigneeId = document.getElementById('tf-assignee').value;
  const type       = document.getElementById('tf-type').value;
  const priority   = document.getElementById('tf-priority').value;
  const dueDate    = document.getElementById('tf-due').value;
  const notes      = document.getElementById('tf-notes').value.trim();
  const pipelineId      = document.getElementById('tf-pipeline')?.value || null;
  const pipelineStageId = (pipelineId && document.getElementById('tf-stage')?.value) || null;

  if (!title || !clientId || !assigneeId || !dueDate) {
    toast('Please fill in all required fields', 'error'); return;
  }

  const saveBtn = document.querySelector('#task-form-modal .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  if (editTaskId) {
    await State.updateTask(editTaskId, { title, clientId, assigneeId, type, priority, dueDate, notes,
      pipelineId: pipelineId || null, pipelineStageId: pipelineStageId || null });
    toast('Task updated!');
  } else {
    await State.addTask({ title, clientId, assigneeId, type, priority, dueDate, notes, status:'pending',
      pipelineId: pipelineId || null, pipelineStageId: pipelineStageId || null });
    toast('Task created!');
  }

  if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="ti ti-circle-check"></i> Save task'; }
  closeTaskForm();
  refreshCurrentPage();
}

/* ── Form dropdowns ─────────────────────────────────────── */
function populateFormDropdowns() {
  const clientSel   = document.getElementById('tf-client');
  const assigneeSel = document.getElementById('tf-assignee');
  const filterSel   = document.getElementById('filter-client-select');
  const pipelineSel = document.getElementById('tf-pipeline');

  clientSel.innerHTML = `<option value="">Select client…</option>` +
    State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  assigneeSel.innerHTML = `<option value="">Assign to…</option>` +
    State.users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('');

  if (filterSel) {
    filterSel.innerHTML = `<option value="all">All clients</option>` +
      State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    filterSel.onchange = e => { taskFilter.clientId = e.target.value; renderAllTasks(); };
  }

  const assigneeFilterSel = document.getElementById('filter-assignee-select');
  if (assigneeFilterSel) {
    assigneeFilterSel.innerHTML = `<option value="all">All users</option>` +
      State.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    assigneeFilterSel.onchange = e => { taskFilter.assigneeId = e.target.value; renderAllTasks(); };
  }

  if (pipelineSel) {
    pipelineSel.innerHTML = `<option value="">No pipeline</option>` +
      State.pipelines.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    onPipelineSelectChange(pipelineSel.value);
  }
}

function onPipelineSelectChange(pipelineId) {
  const stageSel   = document.getElementById('tf-stage');
  const stageGroup = document.getElementById('tf-stage-group');
  if (!stageSel) return;
  if (!pipelineId) {
    stageSel.innerHTML = '<option value="">—</option>';
    if (stageGroup) stageGroup.style.opacity = '0.4';
    return;
  }
  const stages = State.getStages(pipelineId);
  stageSel.innerHTML = stages.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  if (stageGroup) stageGroup.style.opacity = '1';
}

/* ── Recurring template modal ───────────────────────────── */
let editTemplateId = null;

function _populateTemplateLists() {
  document.getElementById('tmf-client').innerHTML =
    `<option value="">Select client…</option>` +
    State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('tmf-assignee').innerHTML =
    `<option value="">Assign to…</option>` +
    State.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}

function openNewTemplateModal() {
  editTemplateId = null;
  _tmfSubtasks   = [];
  document.getElementById('template-form-modal-title').textContent = 'New recurring template';
  document.getElementById('tmf-title').value      = '';
  document.getElementById('tmf-recurrence').value = 'monthly';
  document.getElementById('tmf-day-month').value  = '';
  document.getElementById('tmf-day-week').value   = 'Mon';
  document.getElementById('tmf-priority').value   = 'medium';
  document.getElementById('tmf-notes').value      = '';
  document.getElementById('tmf-hours').value      = '';
  document.getElementById('tmf-comments').value   = '';
  document.getElementById('tmf-advanced').style.display = 'none';
  _renderTemplatChecklist();
  _populateTemplateLists();
  onTemplateRecurrenceChange('monthly');
  document.getElementById('template-form-modal').classList.add('open');
  setTimeout(() => document.getElementById('tmf-title').focus(), 100);
}

function openEditTemplateModal(templateId) {
  editTemplateId = templateId;
  _tmfSubtasks   = [];
  const tp = State.templates.find(t => t.id === templateId);
  if (!tp) return;
  document.getElementById('template-form-modal-title').textContent = 'Edit template';
  _populateTemplateLists();
  document.getElementById('tmf-title').value      = tp.title;
  document.getElementById('tmf-client').value     = tp.clientId;
  document.getElementById('tmf-assignee').value   = tp.assigneeId;
  document.getElementById('tmf-recurrence').value = tp.recurrence;
  onTemplateRecurrenceChange(tp.recurrence);
  if (tp.recurrence === 'monthly') document.getElementById('tmf-day-month').value = tp.dayOfMonth || '';
  if (tp.recurrence === 'weekly')  document.getElementById('tmf-day-week').value  = tp.dayOfWeek  || 'Mon';
  /* Advanced fields */
  document.getElementById('tmf-priority').value = tp.priority || 'medium';
  document.getElementById('tmf-notes').value    = tp.notes || '';
  document.getElementById('tmf-hours').value    = tp.estimatedHours || '';
  document.getElementById('tmf-comments').value = (tp.defaultComments||[]).join('\n');
  if (tp.pipelineId) {
    document.getElementById('tmf-pipeline').value = tp.pipelineId;
    onTemplatePipelineChange(tp.pipelineId);
    setTimeout(() => { document.getElementById('tmf-stage').value = tp.pipelineStageId || ''; }, 50);
  }
  /* Checklist */
  _tmfSubtasks = (tp.subtasks || []).map(s => s.text || s);
  _renderTemplatChecklist();
  if (_tmfSubtasks.length || tp.notes || tp.priority !== 'medium') {
    document.getElementById('tmf-advanced').style.display = '';
  }
  document.getElementById('template-form-modal').classList.add('open');
}

function closeTemplateModal() {
  document.getElementById('template-form-modal').classList.remove('open');
  editTemplateId = null;
}

function onTemplateRecurrenceChange(val) {
  const dayGroup = document.getElementById('tmf-day-group');
  const monthInp = document.getElementById('tmf-day-month');
  const weekSel  = document.getElementById('tmf-day-week');
  const dayLabel = document.getElementById('tmf-day-label');
  if (val === 'daily') {
    dayGroup.style.display = 'none';
  } else if (val === 'weekly') {
    dayGroup.style.display = '';
    monthInp.style.display = 'none';
    weekSel.style.display  = '';
    dayLabel.textContent   = 'Day of week';
  } else {
    dayGroup.style.display = '';
    monthInp.style.display = '';
    weekSel.style.display  = 'none';
    dayLabel.textContent   = 'Day of month';
  }
}

async function submitTemplateForm() {
  const title      = document.getElementById('tmf-title').value.trim();
  const clientId   = document.getElementById('tmf-client').value;
  const assigneeId = document.getElementById('tmf-assignee').value;
  const recurrence = document.getElementById('tmf-recurrence').value;
  const dayOfMonth = recurrence === 'monthly' ? (Number(document.getElementById('tmf-day-month').value) || null) : null;
  const dayOfWeek  = recurrence === 'weekly'  ? document.getElementById('tmf-day-week').value : null;

  if (!title || !clientId || !assigneeId) {
    toast('Please fill in title, client and assignee', 'error'); return;
  }

  const priority        = document.getElementById('tmf-priority')?.value || 'medium';
  const notes           = document.getElementById('tmf-notes')?.value.trim() || '';
  const estimatedHours  = parseFloat(document.getElementById('tmf-hours')?.value) || 0;
  const pipelineId      = document.getElementById('tmf-pipeline')?.value || '';
  const pipelineStageId = document.getElementById('tmf-stage')?.value || '';
  const commentsRaw     = document.getElementById('tmf-comments')?.value.trim() || '';
  const defaultComments = commentsRaw ? commentsRaw.split('\n').map(s=>s.trim()).filter(Boolean) : [];
  const subtasks        = _tmfSubtasks.map((text,i) => ({ id:'st'+Date.now()+i, text, done:false }));

  const templateData = { title, clientId, assigneeId, recurrence, dayOfMonth, dayOfWeek,
    priority, notes, subtasks, pipelineId, pipelineStageId, estimatedHours,
    defaultComments, templateDependencies:[] };

  const btn = document.querySelector('#template-form-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  if (editTemplateId) {
    await State.updateTemplate(editTemplateId, templateData);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save template'; }
    closeTemplateModal();
    renderTemplates();
    toast('Template updated!');
  } else {
    await State.addTemplate(templateData);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save template'; }
    closeTemplateModal();
    renderTemplates();
    toast(`Template "${title}" created!`);
  }
}

async function confirmDeleteTemplate(templateId) {
  const tp = State.templates.find(t => t.id === templateId);
  if (!tp) return;
  if (!confirm(`Delete template "${tp.title}"? This cannot be undone.`)) return;
  await State.deleteTemplate(templateId);
  renderTemplates();
  toast(`Template deleted`, 'error');
}

/* ═══════════════════════════════════════════════════════════
   DARK MODE
   ═══════════════════════════════════════════════════════════ */
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const btn    = document.getElementById('dark-btn');
  const isDark = document.body.classList.contains('dark');
  if (btn) btn.innerHTML = isDark
    ? '<i class="ti ti-sun"></i>'
    : '<i class="ti ti-moon"></i>';
}

/* ═══════════════════════════════════════════════════════════
   EXPORT / PRINT
   ═══════════════════════════════════════════════════════════ */
function printTasks() {
  document.title = 'OFIZ Tasks — ' + (document.getElementById('task-count-label')?.textContent || 'Export');
  window.print();
}

/* ═══════════════════════════════════════════════════════════
   BULK OPERATIONS
   ═══════════════════════════════════════════════════════════ */
function toggleSelectMode() {
  selectMode = !selectMode;
  if (!selectMode) { selectedTasks.clear(); updateBulkBar(); }
  const btn = document.getElementById('sel-mode-btn');
  if (btn) {
    btn.innerHTML    = `<i class="ti ti-checkbox"></i> ${selectMode ? 'Done' : 'Select'}`;
    btn.style.background  = selectMode ? 'var(--ink)' : '';
    btn.style.color       = selectMode ? 'var(--bg-sidebar)' : '';
    btn.style.borderColor = selectMode ? 'var(--ink)' : '';
  }
  renderAllTasks();
}

function toggleTaskSelect(taskId) {
  if (selectedTasks.has(taskId)) selectedTasks.delete(taskId);
  else selectedTasks.add(taskId);
  updateBulkBar();
  renderAllTasks();
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-action-bar');
  const cnt = selectedTasks.size;
  if (!bar) return;
  bar.style.display = cnt > 0 ? 'flex' : 'none';
  const lbl = document.getElementById('bulk-count');
  if (lbl) lbl.textContent = `${cnt} task${cnt !== 1 ? 's' : ''} selected`;
  const sel = document.getElementById('bulk-reassign-sel');
  if (sel) {
    sel.innerHTML = `<option value="">Reassign to…</option>` +
      State.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  }
}

function clearBulkSelection() {
  selectedTasks.clear();
  selectMode = false;
  updateBulkBar();
  const btn = document.getElementById('sel-mode-btn');
  if (btn) { btn.innerHTML = '<i class="ti ti-checkbox"></i> Select'; btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = ''; }
  renderAllTasks();
}

async function bulkClose() {
  if (!selectedTasks.size) return;
  if (!confirm(`Mark ${selectedTasks.size} tasks as done?`)) return;
  for (const id of [...selectedTasks]) await State.closeTask(id, '');
  toast(`${selectedTasks.size} tasks marked done`);
  clearBulkSelection();
  refreshCurrentPage();
}

async function bulkDelete() {
  if (!selectedTasks.size) return;
  if (!confirm(`Delete ${selectedTasks.size} tasks? This cannot be undone.`)) return;
  for (const id of [...selectedTasks]) await State.deleteTask(id);
  toast(`${selectedTasks.size} tasks deleted`, 'error');
  clearBulkSelection();
  refreshCurrentPage();
}

async function bulkReassign(userId) {
  if (!userId || !selectedTasks.size) return;
  const user = State.getUser(userId);
  for (const id of [...selectedTasks]) await State.updateTask(id, { assigneeId: userId });
  toast(`${selectedTasks.size} tasks reassigned to ${user?.name}`);
  document.getElementById('bulk-reassign-sel').value = '';
  clearBulkSelection();
  refreshCurrentPage();
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR VIEW
   ═══════════════════════════════════════════════════════════ */
function toggleCalendarView() {
  calendarView = !calendarView;
  const btn  = document.getElementById('cal-toggle-btn');
  const wrap = document.getElementById('calendar-wrap');
  const list = document.getElementById('all-task-list');
  if (btn) {
    btn.innerHTML     = calendarView ? '<i class="ti ti-list"></i> List' : '<i class="ti ti-calendar"></i> Calendar';
    btn.style.background  = calendarView ? 'var(--ink)' : '';
    btn.style.color       = calendarView ? 'var(--bg-sidebar)' : '';
    btn.style.borderColor = calendarView ? 'var(--ink)' : '';
  }
  if (wrap) wrap.style.display = calendarView ? '' : 'none';
  if (list) list.style.display = calendarView ? 'none' : '';
  if (calendarView) {
    if (!_calYear) { const n = new Date(); _calYear = n.getFullYear(); _calMonth = n.getMonth(); }
    renderCalendar();
  }
}

function calNav(dir) {
  if (!_calYear) { const n = new Date(); _calYear = n.getFullYear(); _calMonth = n.getMonth(); }
  if (dir === 0) { const n = new Date(); _calYear = n.getFullYear(); _calMonth = n.getMonth(); }
  else {
    _calMonth += dir;
    if (_calMonth < 0)  { _calMonth = 11; _calYear--; }
    if (_calMonth > 11) { _calMonth = 0;  _calYear++; }
  }
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  const lbl  = document.getElementById('cal-month-label');
  if (!grid || _calYear === null) return;
  if (lbl) lbl.textContent = _MONTHS[_calMonth] + ' ' + _calYear;

  const today    = new Date().toISOString().slice(0,10);
  const tasks    = State.filterTasks(taskFilter);
  const taskMap  = {};
  tasks.forEach(t => { if (t.dueDate) (taskMap[t.dueDate] = taskMap[t.dueDate] || []).push(t); });

  const firstDay    = new Date(_calYear, _calMonth, 1);
  const lastDay     = new Date(_calYear, _calMonth + 1, 0);
  let   startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const DAY_HEADS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let html = DAY_HEADS.map(d => `<div class="cal-head-cell">${d}</div>`).join('');
  for (let i = 0; i < startOffset; i++) html += `<div class="cal-cell other-month"></div>`;

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds   = `${_calYear}-${String(_calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dts  = taskMap[ds] || [];
    const od   = dts.filter(t => t.status !== 'done' && ds < today).length;
    const done = dts.filter(t => t.status === 'done').length;
    html += `
    <div class="cal-cell${ds===today?' today':''}" onclick="calDayClick('${ds}')">
      <div class="cal-date">${d}</div>
      ${dts.length ? `
        <div class="cal-dots">
          ${dts.slice(0,8).map(t => {
            const c = State.getClient(t.clientId);
            return `<div class="cal-dot" title="${t.title}" style="background:${c?.color||'var(--ink-3)'}"></div>`;
          }).join('')}
        </div>
        ${od   ? `<span class="cal-badge" style="color:var(--red)">⚠ ${od} overdue</span>` : ''}
        ${done && !od ? `<span class="cal-badge" style="color:var(--accent)">✓ ${done}</span>` : ''}
        ${(dts.length - done - od) > 0 && !od ? `<span class="cal-badge" style="color:var(--ink-3)">${dts.length-done} open</span>` : ''}
      ` : ''}
    </div>`;
  }

  const endOffset = (7 - ((startOffset + lastDay.getDate()) % 7)) % 7;
  for (let i = 0; i < endOffset; i++) html += `<div class="cal-cell other-month"></div>`;
  grid.innerHTML = html;
}

function calDayClick(dateStr) {
  /* Switch to list view, filter to show tasks due that date */
  const wrap = document.getElementById('calendar-wrap');
  const list = document.getElementById('all-task-list');
  calendarView = false;
  if (wrap) wrap.style.display = 'none';
  if (list) list.style.display = '';
  const btn = document.getElementById('cal-toggle-btn');
  if (btn) { btn.innerHTML = '<i class="ti ti-calendar"></i> Calendar'; btn.style.background=''; btn.style.color=''; btn.style.borderColor=''; }
  const dayTasks = State.filterTasks(taskFilter).filter(t => t.dueDate === dateStr);
  renderTaskList(dayTasks, 'all-task-list');
  const lbl = document.getElementById('task-count-label');
  if (lbl) lbl.textContent = `${dayTasks.length} task${dayTasks.length!==1?'s':''} due ${fmtDate(dateStr)}`;
}

/* ═══════════════════════════════════════════════════════════
   WORKLOAD VIEW
   ═══════════════════════════════════════════════════════════ */
function renderWorkload() {
  const el = document.getElementById('workload-section');
  if (!el) return;
  const today = new Date().toISOString().slice(0,10);
  const data  = State.users.map(u => {
    const open    = State.tasks.filter(t => t.assigneeId === u.id && t.status !== 'done');
    const overdue = open.filter(t => t.dueDate < today).length;
    return { ...u, total: open.length, overdue };
  }).filter(u => u.total > 0).sort((a,b) => b.total - a.total);

  if (!data.length) { el.innerHTML = ''; return; }

  const maxTasks = Math.max(...data.map(u => u.total), 1);
  el.innerHTML = `
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 22px">
    ${data.map(u => {
      const pct   = Math.round(u.total   / maxTasks * 100);
      const odPct = Math.round(u.overdue / maxTasks * 100);
      return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:${data.indexOf(u) < data.length-1 ? '12' : '0'}px">
        <div class="avatar ${u.avClass}" style="width:26px;height:26px;font-size:9px;flex-shrink:0">${u.initials}</div>
        <div style="font-size:12px;color:var(--ink-2);width:76px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}</div>
        <div style="flex:1;background:var(--bg);border-radius:4px;height:8px;overflow:hidden;position:relative">
          <div style="height:100%;width:${pct}%;background:${u.overdue?'var(--amber)':'var(--accent)'};border-radius:4px;transition:width 600ms var(--ease)"></div>
          ${u.overdue ? `<div style="position:absolute;top:0;left:0;height:100%;width:${odPct}%;background:var(--red);border-radius:4px"></div>` : ''}
        </div>
        <div style="font-size:11px;font-family:var(--mono);color:var(--ink-3);text-align:right;flex-shrink:0;min-width:40px">
          ${u.total}
          ${u.overdue ? `<div style="color:var(--red);font-size:10px">${u.overdue}OD</div>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ── Generate tasks from templates ─────────────────────── */
async function generateFromTemplates() {
  const month = document.getElementById('tg-month')?.value;
  if (!month) { toast('Please select a month', 'error'); return; }

  const active = State.templates.filter(tp => tp.active);
  if (!active.length) { toast('No active templates found', 'error'); return; }

  const btn = document.getElementById('tg-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Generating…'; }

  const monthLabel = _monthLabel(month);
  const dueDate0   = `${month}-01`; /* earliest possible due date this month */
  const dueDate1   = _lastDayOfMonth(month);
  const created    = [];
  const skipped    = [];

  for (const tp of active) {
    const dueDate  = _templateDueDate(tp, month);
    if (!dueDate) continue;
    const titleKey = `${tp.title} — ${monthLabel}`;
    /* Duplicate check: match title + client OR same template+client with a due date in this month */
    const exists = State.tasks.some(t =>
      t.clientId === tp.clientId &&
      (t.title === titleKey ||
       (t.dueDate >= dueDate0 && t.dueDate <= dueDate1 &&
        t.title.startsWith(tp.title))));
    if (exists) { skipped.push(tp.title); continue; }
    const task = await State.addTask({
      title:           titleKey,
      clientId:        tp.clientId,
      assigneeId:      tp.assigneeId,
      type:            tp.recurrence,
      priority:        tp.priority || 'medium',
      dueDate,
      notes:           tp.notes || '',
      status:          'pending',
      subtasks:        (tp.subtasks||[]).map(s => ({...s, id:'st'+Date.now()+Math.random(), done:false})),
      pipelineId:      tp.pipelineId || null,
      pipelineStageId: tp.pipelineStageId || null,
    });
    for (const comment of (tp.defaultComments||[])) {
      await State.addComment(task.id, comment);
    }
    created.push(task);
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-sparkles"></i> Generate'; }

  if (created.length === 0 && skipped.length > 0) {
    toast(`All ${skipped.length} tasks already exist for ${monthLabel}`, 'error');
  } else if (created.length === 0) {
    toast('No active templates to generate from', 'error');
  } else {
    const skipNote = skipped.length ? ` (${skipped.length} already existed)` : '';
    toast(`${created.length} task${created.length !== 1 ? 's' : ''} created for ${monthLabel}${skipNote}!`);
  }
}

function _templateDueDate(tp, yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();

  if (tp.recurrence === 'monthly') {
    const day = Math.min(tp.dayOfMonth || lastDay, lastDay);
    return `${yearMonth}-${String(day).padStart(2, '0')}`;
  }
  if (tp.recurrence === 'weekly') {
    return _firstWeekdayInMonth(yearMonth, tp.dayOfWeek || 'Mon');
  }
  if (tp.recurrence === 'daily') {
    return `${yearMonth}-01`; /* first day of month for daily templates */
  }
  return null;
}

function _firstWeekdayInMonth(yearMonth, dayName) {
  const dayMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const [y, m] = yearMonth.split('-').map(Number);
  const target = dayMap[dayName] ?? 1;
  const d      = new Date(y, m - 1, 1);
  while (d.getDay() !== target) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/* ── Search ─────────────────────────────────────────────── */
function handleSearch(val) {
  taskFilter.search = val;
  renderAllTasks();
}

/* ═══════════════════════════════════════════════════════════
   PIPELINE / KANBAN RENDERERS
   ═══════════════════════════════════════════════════════════ */

function renderPipelinesPage() {
  renderPipelineTabs();
  /* Populate client filter */
  const cf = document.getElementById('kb-client-filter');
  if (cf) {
    cf.innerHTML = `<option value="">All clients</option>` +
      State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  if (_kbView === 'table')     renderKanbanTable();
  else if (_kbView === 'analytics') renderKanbanAnalytics();
  else renderKanbanBoard(State.activePipelineId);
}

let _pipTabDragId = null;

function renderPipelineTabs() {
  const el = document.getElementById('pipeline-tabs');
  if (!el) return;
  const today   = new Date().toISOString().slice(0,10);
  const isAdmin = State.user?.role === 'admin';
  el.innerHTML  = State.pipelines.map(p => {
    const cards   = State.tasks.filter(t => t.pipelineId === p.id && t.status !== 'done');
    const hasOD   = cards.some(t => t.dueDate < today);
    const cnt     = cards.length;
    const isActive = p.id === State.activePipelineId;
    const cntHtml = cnt > 0
      ? `<span style="font-size:10px;font-family:var(--mono);font-weight:700;padding:1px 7px;
           border-radius:20px;
           background:${isActive ? 'rgba(255,255,255,0.25)' : hasOD ? '#fee2e2' : '#f1f5f9'};
           color:${isActive ? '#fff' : hasOD ? '#ef4444' : '#64748b'}">${cnt}</span>`
      : '';
    const editHtml = isAdmin
      ? `<span onclick="event.stopPropagation();openEditPipelineModal('${p.id}')"
           style="opacity:0.6;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;
                  transition:opacity 120ms" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6">
           <i class="ti ti-pencil"></i></span>` : '';
    const delHtml = isAdmin
      ? `<span onclick="event.stopPropagation();confirmDeletePipeline('${p.id}')"
           style="opacity:0.5;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;
                  transition:opacity 120ms" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">
           <i class="ti ti-x"></i></span>` : '';
    return `
    <div class="pipeline-tab ${isActive ? 'active' : ''}"
         draggable="${isAdmin}"
         onclick="switchPipeline('${p.id}')"
         ondragstart="pipTabDragStart(event,'${p.id}')"
         ondragend="pipTabDragEnd(event)"
         ondragover="pipTabDragOver(event)"
         ondrop="pipTabDrop(event,'${p.id}')">
      ${p.name} ${cntHtml} ${editHtml} ${delHtml}
    </div>`;
  }).join('');
}

function pipTabDragStart(e, id) {
  _pipTabDragId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.target.classList.add('dragging-tab'), 0);
}
function pipTabDragEnd(e)   { e.target.classList.remove('dragging-tab'); document.querySelectorAll('.tab-drag-over').forEach(t=>t.classList.remove('tab-drag-over')); }
function pipTabDragOver(e)  { e.preventDefault(); e.currentTarget.classList.add('tab-drag-over'); }
async function pipTabDrop(e, targetId) {
  e.preventDefault();
  e.currentTarget.classList.remove('tab-drag-over');
  if (!_pipTabDragId || _pipTabDragId === targetId) return;
  const fi = State.pipelines.findIndex(p => p.id === _pipTabDragId);
  const ti = State.pipelines.findIndex(p => p.id === targetId);
  if (fi < 0 || ti < 0) return;
  const [moved] = State.pipelines.splice(fi, 1);
  State.pipelines.splice(ti, 0, moved);
  _pipTabDragId = null;
  renderPipelinesPage();
  toast('Pipeline order updated');
}

async function confirmDeletePipeline(pipelineId) {
  const p = State.getPipeline(pipelineId);
  if (!p) return;
  const taskCnt = State.getPipeTasks(pipelineId).length;
  const msg = taskCnt > 0
    ? `Delete pipeline "${p.name}"? This will unlink ${taskCnt} task${taskCnt !== 1 ? 's' : ''} from it. This cannot be undone.`
    : `Delete pipeline "${p.name}"? This cannot be undone.`;
  if (!confirm(msg)) return;
  const name = p.name;
  await State.deletePipeline(pipelineId);
  toast(`Pipeline "${name}" deleted`, 'error');
  renderPipelinesPage();
}

function switchPipeline(pipelineId) {
  State.activePipelineId = pipelineId;
  renderPipelineTabs();
  renderKanbanBoard(pipelineId);
}

function renderKanbanBoard(pipelineId) {
  const wrap = document.getElementById('kanban-board-wrap');
  if (!wrap) return;

  if (!pipelineId) {
    wrap.innerHTML = `
      <div class="pipeline-empty">
        <i class="ti ti-layout-kanban"></i>
        <p>No pipelines yet. Create one to get started.</p>
        <button class="btn btn-primary" onclick="openNewPipelineModal()">
          <i class="ti ti-plus"></i> New pipeline
        </button>
      </div>`;
    return;
  }

  const stages      = State.getStages(pipelineId);
  const today       = new Date().toISOString().slice(0,10);
  const canEdit     = State.user?.role !== 'viewer';
  const clientFilter = document.getElementById('kb-client-filter')?.value || '';
  const swimLane    = document.getElementById('kb-swim-lane')?.value || '';
  let   pipeTasks   = State.getPipeTasks(pipelineId);
  if (clientFilter) pipeTasks = pipeTasks.filter(t => t.clientId === clientFilter);

  if (!stages.length) {
    wrap.innerHTML = `<div class="pipeline-empty"><i class="ti ti-columns"></i><p>No stages defined.</p></div>`;
    return;
  }

  /* Default colors for stages without a custom color */
  const DEFAULT_STAGE_COLORS = ['#6366f1','#8b5cf6','#10b981','#3b82f6','#f59e0b','#ec4899','#ef4444'];

  wrap.innerHTML = `<div class="kanban-board">${stages.map((stage, idx) => {
    const allCards  = pipeTasks.filter(t => t.pipelineStageId === stage.id);
    const stageColor = stage.color || DEFAULT_STAGE_COLORS[idx % DEFAULT_STAGE_COLORS.length];
    /* Colorful gradient header */
    const colStyle  = `border-top: 3px solid ${stageColor}`;
    const hdrBg     = `background: linear-gradient(135deg, ${stageColor}18 0%, ${stageColor}08 100%);`;
    const dotHtml   = canEdit
      ? `<span class="stage-color-dot ${stage.color ? '' : 'empty'}"
           style="background:${stageColor};opacity:${stage.color?1:0.4}"
           onclick="openStageColorPicker('${stage.id}', this)" title="Change colour"></span>`
      : `<span class="stage-color-dot" style="background:${stageColor}"></span>`;
    const slaHtml = stage.targetDays
      ? `<span style="font-size:9px;font-weight:700;font-family:var(--mono);
           background:rgba(0,0,0,0.08);border-radius:20px;padding:1px 6px;
           color:${stageColor};opacity:0.9">${stage.targetDays}d</span>`
      : '';

    /* Render cards with optional swim lanes */
    let cardsHtml = '';
    if (swimLane === 'client') {
      const groups = {};
      allCards.forEach(t => { (groups[t.clientId] = groups[t.clientId]||[]).push(t); });
      cardsHtml = Object.keys(groups).map(cid => {
        const c = State.getClient(cid);
        return `<div class="kb-swim-head" style="border-left:2px solid ${c?.color||'var(--border)'}">
          <span style="color:${c?.color||'var(--ink-3)'}">${c?.short||'?'}</span> ${c?.name||''}
        </div>
        ${groups[cid].map(t => renderKanbanCard(t, stage, stages, today, canEdit)).join('')}`;
      }).join('');
    } else if (swimLane === 'assignee') {
      const groups = {};
      allCards.forEach(t => { (groups[t.assigneeId] = groups[t.assigneeId]||[]).push(t); });
      cardsHtml = Object.keys(groups).map(uid => {
        const u = State.getUser(uid);
        return `<div class="kb-swim-head">
          <div class="avatar ${u?.avClass||'av-admin'}" style="width:16px;height:16px;font-size:7px">${u?.initials||'?'}</div>
          ${u?.name||'?'}
        </div>
        ${groups[uid].map(t => renderKanbanCard(t, stage, stages, today, canEdit)).join('')}`;
      }).join('');
    } else {
      cardsHtml = allCards.length
        ? allCards.map(t => renderKanbanCard(t, stage, stages, today, canEdit)).join('')
        : `<div class="kanban-empty-col">Drop a card here</div>`;
    }

    return `
    <div class="kanban-col" style="${colStyle}">
      <div class="kanban-col-head" style="${hdrBg}">
        ${dotHtml}
        <span class="kanban-col-title" style="color:${stageColor}">${stage.name}</span>
        ${slaHtml}
        <span class="kanban-col-count" style="margin-left:auto;background:${stageColor}22;color:${stageColor}">${allCards.length}</span>
      </div>
      <div class="kanban-col-body"
           ondragover="kanbanDragOver(event)"
           ondragleave="kanbanDragLeave(event)"
           ondrop="kanbanDrop(event,'${stage.id}')">
        ${cardsHtml}
      </div>
      ${canEdit ? `<button class="kanban-add-card" onclick="openPipeTaskModal('${pipelineId}','${stage.id}')">
        <i class="ti ti-plus"></i> Add task
      </button>` : ''}
    </div>`;
  }).join('')}</div>`;
}

function renderKanbanCard(task, currentStage, allStages, today, canEdit) {
  const over      = task.status !== 'done' && task.dueDate < today;
  const done      = task.status === 'done';
  const client    = State.getClient(task.clientId);
  const user      = State.getUser(task.assigneeId);
  const stageIdx  = allStages.findIndex(s => s.id === currentStage.id);
  const prevStage = allStages[stageIdx - 1];
  const nextStage = allStages[stageIdx + 1];

  /* Card aging */
  let ageBadge = '';
  if (!done && task.stageEnteredAt) {
    const days = Math.floor((new Date(today) - new Date(task.stageEnteredAt)) / 86400000);
    const td   = currentStage.targetDays || 0;
    let ageCls = 'background:var(--bg-active);color:var(--ink-3)';
    if (td && days > td * 2)       ageCls = 'background:var(--red-light);color:var(--red)';
    else if (td && days > td * 1.5) ageCls = 'background:var(--amber-light);color:var(--amber)';
    ageBadge = `<span class="kb-age-badge" style="${ageCls}" title="${days} day${days!==1?'s':''} in this stage">
      <i class="ti ti-clock" style="font-size:9px"></i> ${days}d
    </span>`;
  }

  /* Stage gate check */
  const subtasks  = task.subtasks || [];
  const gated     = subtasks.length > 0 && subtasks.some(s => !s.done);
  const stGateHtml = (gated && nextStage && canEdit)
    ? `<span class="kb-gate-lock"><i class="ti ti-lock" style="font-size:10px"></i> ${subtasks.filter(s=>!s.done).length} remaining</span>`
    : '';

  /* Bulk select */
  const isSelected = _kbSelected.has(task.id);
  const selectHtml = _kbBulkMode
    ? `<div class="kb-card-select ${isSelected ? 'checked' : ''}"
         onclick="event.stopPropagation();toggleKanbanCardSelect('${task.id}')">
         <i class="ti ti-check" style="font-size:9px"></i>
       </div>` : '';

  /* Subtask progress mini bar */
  const stTotal = subtasks.length;
  const stDone  = subtasks.filter(s => s.done).length;
  const stBar   = stTotal > 0 ? `
    <div style="height:2px;background:var(--border);border-radius:2px;margin-top:7px;overflow:hidden">
      <div style="height:100%;width:${Math.round(stDone/stTotal*100)}%;background:${stDone===stTotal?'var(--accent)':'var(--amber)'};border-radius:2px"></div>
    </div>` : '';

  /* Card left stripe color by priority */
  const cardAccent = task.priority === 'high' ? '#ef4444' : task.priority === 'low' ? '#10b981' : '#6366f1';

  return `
  <div class="kanban-card ${over?'overdue':''} ${done?'done':''} ${isSelected?'kb-selected':''}"
       style="--card-accent:${cardAccent}"
       onclick="${_kbBulkMode ? `toggleKanbanCardSelect('${task.id}')` : `openTaskModal('${task.id}')`}"
       draggable="${!_kbBulkMode}"
       ondragstart="kanbanDragStart(event,'${task.id}')"
       ondragend="kanbanDragEnd(event)">

    <!-- Priority stripe -->
    <div style="position:absolute;left:0;top:0;bottom:0;width:3px;
      background:${over?'#ef4444':cardAccent};border-radius:12px 0 0 12px"></div>

    <!-- Header row: select + title -->
    <div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:8px;padding-left:2px">
      ${selectHtml}
      <div class="kanban-card-title" style="flex:1">${esc(task.title)}</div>
    </div>

    <!-- Tags row -->
    <div class="kanban-card-meta" style="padding-left:2px">
      ${client ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;
        background:${client.bg};color:${client.color}">${client.short}</span>` : ''}
      ${over ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;
        background:#fee2e2;color:#ef4444">Overdue</span>` : ''}
      ${ageBadge}
    </div>

    <!-- Sub-task progress -->
    ${stBar}

    <!-- Footer: date + assignee -->
    <div style="display:flex;align-items:center;justify-content:space-between;
      margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9;padding-left:2px">
      <span class="kanban-due ${over?'late':''}" style="display:flex;align-items:center;gap:4px">
        <i class="ti ti-calendar-event" style="font-size:10px"></i>
        ${fmtDate(task.dueDate)}
      </span>
      ${user ? `<div class="assign-chip ${user.avClass}" title="${user.name}"
        style="width:22px;height:22px;font-size:8px">${user.initials}</div>` : ''}
    </div>

    ${stGateHtml ? `<div style="margin-top:6px">${stGateHtml}</div>` : ''}

    <!-- Move buttons -->
    ${canEdit && !done && !_kbBulkMode ? `
    <div style="display:flex;gap:5px;margin-top:8px;padding-left:2px">
      ${prevStage ? `<button class="stage-move-btn" onclick="event.stopPropagation();moveCard('${task.id}','${prevStage.id}')">
        <i class="ti ti-arrow-left" style="font-size:10px"></i>
      </button>` : ''}
      ${nextStage ? `<button class="stage-move-btn" style="margin-left:auto;background:#eef2ff;border-color:#6366f1;color:#6366f1"
        onclick="event.stopPropagation();${gated?`confirmGatedMove('${task.id}','${nextStage.id}')`:``}${!gated?`moveCard('${task.id}','${nextStage.id}')`:``}">
        ${nextStage.name} <i class="ti ti-arrow-right" style="font-size:10px"></i>
      </button>` : `<span style="margin-left:auto;font-size:11px;color:#10b981;font-weight:700;
        display:flex;align-items:center;gap:4px">
        <i class="ti ti-check"></i> Final stage
      </span>`}
    </div>` : ''}
  </div>`;
}

async function moveCard(taskId, stageId) {
  await State.moveTaskStage(taskId, stageId);
  toast('Task moved!');
  renderKanbanBoard(State.activePipelineId);
}

async function confirmGatedMove(taskId, stageId) {
  const task = State.getTask(taskId);
  const remaining = (task?.subtasks||[]).filter(s=>!s.done).length;
  if (confirm(`${remaining} checklist item${remaining!==1?'s':''} still incomplete. Move anyway?`)) {
    await moveCard(taskId, stageId);
  }
}

/* ═══════════════════════════════════════════════════════════
   KANBAN VIEW SWITCHING
   ═══════════════════════════════════════════════════════════ */
function setKanbanView(view) {
  _kbView = view;
  document.querySelectorAll('.kb-view-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`kb-view-${view}`)?.classList.add('active');
  if (view === 'table')         renderKanbanTable();
  else if (view === 'analytics') renderKanbanAnalytics();
  else                           renderKanbanBoard(State.activePipelineId);
}

/* ═══════════════════════════════════════════════════════════
   KANBAN TABLE VIEW
   ═══════════════════════════════════════════════════════════ */
function renderKanbanTable() {
  const wrap = document.getElementById('kanban-board-wrap');
  if (!wrap) return;
  const pipelineId = State.activePipelineId;
  const today      = new Date().toISOString().slice(0,10);
  const clientFilter = document.getElementById('kb-client-filter')?.value || '';

  /* All pipeline tasks across all pipelines or current */
  let tasks = pipelineId
    ? State.getPipeTasks(pipelineId)
    : State.tasks.filter(t => t.pipelineId);
  if (clientFilter) tasks = tasks.filter(t => t.clientId === clientFilter);
  tasks = tasks.sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||''));

  if (!tasks.length) {
    wrap.innerHTML = `<div class="pipeline-empty"><i class="ti ti-table"></i><p>No pipeline cards found</p></div>`;
    return;
  }

  wrap.innerHTML = `
  <div style="overflow-x:auto">
  <table class="kb-table">
    <thead>
      <tr>
        <th>Task</th><th>Client</th><th>Pipeline</th><th>Stage</th>
        <th>Assignee</th><th>Due date</th><th>Age in stage</th><th>Priority</th>
      </tr>
    </thead>
    <tbody>
      ${tasks.map(t => {
        const c    = State.getClient(t.clientId);
        const u    = State.getUser(t.assigneeId);
        const pipe = State.getPipeline(t.pipelineId);
        const stage = State.stages.find(s => s.id === t.pipelineStageId);
        const over  = t.status !== 'done' && t.dueDate < today;
        const days  = t.stageEnteredAt
          ? Math.floor((new Date(today) - new Date(t.stageEnteredAt)) / 86400000) : null;
        const td    = stage?.targetDays || 0;
        let ageStyle = '';
        if (days !== null && td) {
          if (days > td*2)       ageStyle = 'color:var(--red);font-weight:600';
          else if (days > td*1.5) ageStyle = 'color:var(--amber);font-weight:600';
        }
        return `<tr>
          <td><span class="kb-title" onclick="openTaskModal('${t.id}')">${esc(t.title)}</span></td>
          <td>${c ? `<span class="tag tag-client" style="color:${c.color};background:${c.bg}">${c.short}</span>` : '—'}</td>
          <td style="font-size:12px;color:var(--ink-3)">${pipe?.name||'—'}</td>
          <td style="font-size:12px">${stage ? `<span style="display:inline-flex;align-items:center;gap:5px">${stage.color?`<span style="width:7px;height:7px;border-radius:50%;background:${stage.color}"></span>`:''} ${stage.name}</span>` : '—'}</td>
          <td>${u ? `<div style="display:flex;align-items:center;gap:5px"><div class="assign-chip ${u.avClass}" style="width:20px;height:20px;font-size:7px">${u.initials}</div>${u.name}</div>` : '—'}</td>
          <td style="${over?'color:var(--red);font-weight:500':''};font-family:var(--mono);font-size:12px">${fmtDate(t.dueDate)}</td>
          <td style="font-family:var(--mono);font-size:12px;${ageStyle}">${days !== null ? days+'d' : '—'}</td>
          <td>${priorityTag(t.priority)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   KANBAN ANALYTICS
   ═══════════════════════════════════════════════════════════ */
function renderKanbanAnalytics() {
  const wrap = document.getElementById('kanban-board-wrap');
  if (!wrap) return;
  const pipelineId = State.activePipelineId;
  if (!pipelineId) { wrap.innerHTML = '<div class="pipeline-empty"><i class="ti ti-chart-bar"></i><p>Select a pipeline to view analytics</p></div>'; return; }

  const stages     = State.getStages(pipelineId);
  const pipeTasks  = State.getPipeTasks(pipelineId);
  const today      = new Date().toISOString().slice(0,10);
  const total      = pipeTasks.length;
  const maxCards   = Math.max(...stages.map(s => pipeTasks.filter(t => t.pipelineStageId === s.id).length), 1);
  const done       = pipeTasks.filter(t => t.status === 'done').length;
  const overdue    = pipeTasks.filter(t => t.status !== 'done' && t.dueDate < today).length;

  wrap.innerHTML = `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
    ${[
      {val:total,   lbl:'Total cards',    color:'var(--ink)'},
      {val:done,    lbl:'Completed',      color:'var(--accent)'},
      {val:overdue, lbl:'Overdue',        color:'var(--red)'},
      {val:total-done-overdue, lbl:'Active (on track)', color:'var(--blue)'},
    ].map(s => `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;font-family:var(--mono);color:${s.color}">${s.val}</div>
      <div style="font-size:11px;color:var(--ink-3);margin-top:3px">${s.lbl}</div>
    </div>`).join('')}
  </div>

  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px">
    <div class="section-title" style="margin-bottom:16px">Cards per stage</div>
    <div class="kb-analytics">
      ${stages.map(stage => {
        const cards   = pipeTasks.filter(t => t.pipelineStageId === stage.id);
        const od      = cards.filter(t => t.dueDate < today && t.status !== 'done').length;
        const pct     = Math.round(cards.length / maxCards * 100);
        const avgDays = cards.filter(t=>t.stageEnteredAt).length
          ? (cards.filter(t=>t.stageEnteredAt).reduce((s,t)=>s+Math.floor((new Date(today)-new Date(t.stageEnteredAt))/86400000),0) / cards.filter(t=>t.stageEnteredAt).length).toFixed(1)
          : null;
        return `<div class="kb-analytics-bar">
          <div class="kb-analytics-stage">
            <span style="display:flex;align-items:center;gap:6px">
              ${stage.color?`<span style="width:8px;height:8px;border-radius:50%;background:${stage.color}"></span>`:''}
              ${stage.name}
              ${od ? `<span style="font-size:10px;color:var(--red);font-weight:600">${od} overdue</span>` : ''}
            </span>
            <span style="font-family:var(--mono);font-size:12px;color:var(--ink-3)">
              ${cards.length} card${cards.length!==1?'s':''}
              ${avgDays ? ` · avg ${avgDays}d` : ''}
              ${stage.targetDays ? ` · target ${stage.targetDays}d` : ''}
            </span>
          </div>
          <div class="kb-analytics-track">
            <div class="kb-analytics-fill" style="width:${pct}%;background:${od>0?'var(--red)':stage.color||'var(--accent)'}"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   PIPELINE TEMPLATES
   ═══════════════════════════════════════════════════════════ */
function openPipelineTemplatesModal() {
  const grid = document.getElementById('pipeline-templates-grid');
  if (grid) {
    grid.innerHTML = PIPELINE_TEMPLATES.map(tpl => `
    <div class="pipe-tpl-card" onclick="createFromTemplate('${tpl.id}')">
      <div class="pipe-tpl-icon" style="background:${tpl.color}22;color:${tpl.color}">
        <i class="ti ${tpl.icon}"></i>
      </div>
      <div class="pipe-tpl-name">${tpl.name}</div>
      <div class="pipe-tpl-desc">${tpl.desc}</div>
      <div class="pipe-tpl-stages">
        ${tpl.stages.map(s => `<span class="pipe-tpl-stage-tag">${s.name} (${s.targetDays}d)</span>`).join('')}
      </div>
    </div>`).join('');
  }
  document.getElementById('pipeline-templates-modal').classList.add('open');
}

function closePipelineTemplatesModal() {
  document.getElementById('pipeline-templates-modal').classList.remove('open');
}

async function createFromTemplate(templateId) {
  const tpl = PIPELINE_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return;
  const btn = document.querySelector(`[onclick="createFromTemplate('${templateId}')"]`);
  if (btn) { btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none'; }
  const pipeline = await State.createPipelineFromTemplate(templateId);
  closePipelineTemplatesModal();
  renderPipelinesPage();
  populateFormDropdowns();
  toast(`Pipeline "${tpl.name}" created from template!`);
}

/* ═══════════════════════════════════════════════════════════
   KANBAN BULK OPERATIONS
   ═══════════════════════════════════════════════════════════ */
function toggleKanbanBulk() {
  _kbBulkMode = !_kbBulkMode;
  if (!_kbBulkMode) { _kbSelected.clear(); updateKanbanBulkBar(); }
  const btn = document.getElementById('kb-bulk-btn');
  if (btn) {
    btn.innerHTML = _kbBulkMode ? '<i class="ti ti-checkbox"></i> Done' : '<i class="ti ti-checkbox"></i> Select';
    btn.style.background  = _kbBulkMode ? 'var(--ink)' : '';
    btn.style.color       = _kbBulkMode ? 'var(--bg-sidebar)' : '';
    btn.style.borderColor = _kbBulkMode ? 'var(--ink)' : '';
  }
  renderKanbanBoard(State.activePipelineId);
}

function toggleKanbanCardSelect(taskId) {
  if (_kbSelected.has(taskId)) _kbSelected.delete(taskId);
  else _kbSelected.add(taskId);
  updateKanbanBulkBar();
  renderKanbanBoard(State.activePipelineId);
}

function updateKanbanBulkBar() {
  const bar = document.getElementById('kb-bulk-bar');
  const cnt = _kbSelected.size;
  if (!bar) return;
  bar.style.display = (cnt > 0 && _kbBulkMode) ? 'flex' : 'none';
  const lbl = document.getElementById('kb-bulk-count');
  if (lbl) lbl.textContent = `${cnt} card${cnt!==1?'s':''} selected`;
  /* Populate stage selector */
  const stageSel = document.getElementById('kb-bulk-stage');
  if (stageSel && State.activePipelineId) {
    stageSel.innerHTML = `<option value="">Move to stage…</option>` +
      State.getStages(State.activePipelineId)
        .map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  }
}

function clearKanbanBulk() {
  _kbSelected.clear();
  _kbBulkMode = false;
  updateKanbanBulkBar();
  const btn = document.getElementById('kb-bulk-btn');
  if (btn) { btn.innerHTML='<i class="ti ti-checkbox"></i> Select'; btn.style.background=''; btn.style.color=''; btn.style.borderColor=''; }
  renderKanbanBoard(State.activePipelineId);
}

async function bulkMoveCards(stageId) {
  if (!stageId || !_kbSelected.size) return;
  const stage = State.stages.find(s => s.id === stageId);
  for (const id of [..._kbSelected]) await State.moveTaskStage(id, stageId);
  toast(`${_kbSelected.size} cards moved to "${stage?.name}"`);
  clearKanbanBulk();
  renderKanbanBoard(State.activePipelineId);
}

async function bulkCloseCards() {
  if (!_kbSelected.size) return;
  if (!confirm(`Close ${_kbSelected.size} pipeline cards?`)) return;
  for (const id of [..._kbSelected]) await State.closeTask(id, '');
  toast(`${_kbSelected.size} cards closed`);
  clearKanbanBulk();
  renderKanbanBoard(State.activePipelineId);
}

/* ── Drag & drop ────────────────────────────────────────── */
function kanbanDragStart(e, taskId) {
  _dragTaskId = taskId;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.target.classList.add('dragging'), 0);
}

function kanbanDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-col-body.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function kanbanDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function kanbanDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}

async function kanbanDrop(e, stageId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!_dragTaskId) return;
  const task = State.getTask(_dragTaskId);
  _dragTaskId = null;
  if (!task || task.pipelineStageId === stageId) return;
  await State.moveTaskStage(task.id, stageId);
  renderKanbanBoard(State.activePipelineId);
}

/* ── New pipeline modal ─────────────────────────────────── */
let stageCount       = 0;
let editPipelineId   = null;
let _removedStageIds = [];
let _dragTaskId      = null;

/* ── Kanban view state ──────────────────────────────────── */
let _kbView        = 'kanban'; /* 'kanban' | 'table' | 'analytics' */
let _kbBulkMode    = false;
const _kbSelected  = new Set();

function openNewPipelineModal() {
  editPipelineId   = null;
  _removedStageIds = [];
  stageCount       = 0;
  document.getElementById('pipeline-form-title').textContent = 'New pipeline';
  document.getElementById('pf-name').value = '';
  document.getElementById('pf-desc').value = '';
  document.getElementById('stage-list').innerHTML = '';
  addStageInput(''); addStageInput(''); addStageInput('');
  document.getElementById('pipeline-form-modal').classList.add('open');
  setTimeout(() => document.getElementById('pf-name').focus(), 100);
}

function openEditPipelineModal(pipelineId) {
  editPipelineId   = pipelineId;
  _removedStageIds = [];
  stageCount       = 0;
  const p = State.getPipeline(pipelineId);
  if (!p) return;
  document.getElementById('pipeline-form-title').textContent = 'Edit pipeline';
  document.getElementById('pf-name').value = p.name;
  document.getElementById('pf-desc').value = p.desc || '';
  document.getElementById('stage-list').innerHTML = '';
  State.getStages(pipelineId).forEach(s => addStageInput(s.name, s.color, s.id, s.targetDays||''));
  document.getElementById('pipeline-form-modal').classList.add('open');
  setTimeout(() => document.getElementById('pf-name').focus(), 100);
}

function closePipelineModal() {
  document.getElementById('pipeline-form-modal').classList.remove('open');
  editPipelineId   = null;
  _removedStageIds = [];
}

function addStageInput(val = '', color = '', stageId = '', targetDays = '') {
  stageCount++;
  const id  = 'stage-inp-' + stageCount;
  const iid = 'stage-item-' + stageCount;
  const item = document.createElement('div');
  item.className          = 'stage-item';
  item.id                 = iid;
  item.dataset.color      = color;
  item.dataset.stageId    = stageId;
  item.dataset.targetDays = targetDays;
  item.innerHTML = `
    <i class="ti ti-grip-vertical stage-item-drag" aria-hidden="true"></i>
    <input type="text" id="${id}" placeholder="Stage name" value="${val}" style="flex:1">
    <input type="number" id="${id}-days" placeholder="Days" min="0" value="${targetDays}"
      style="width:58px;background:var(--bg);border:1px solid var(--border-md);border-radius:var(--radius-sm);
        padding:6px 8px;font-size:12px;font-family:var(--mono);outline:none;color:var(--ink)"
      oninput="document.getElementById('${iid}').dataset.targetDays=this.value" title="Target days in this stage">
    <button class="stage-color-btn ${color ? 'has-color' : ''}" type="button"
      onclick="openStageColorPickerForInput('${iid}', this)" title="Set stage colour">
      <span class="stage-color-preview" style="${color ? `background:${color}` : ''}"></span>
    </button>
    <button class="stage-item-del" onclick="removeStageItem('${iid}')" aria-label="Remove stage">
      <i class="ti ti-trash" aria-hidden="true"></i>
    </button>`;
  document.getElementById('stage-list').appendChild(item);
}

function removeStageItem(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const sid = el.dataset.stageId;
  if (sid) _removedStageIds.push(sid);
  el.remove();
}

async function submitPipelineForm() {
  const name = document.getElementById('pf-name').value.trim();
  const desc = document.getElementById('pf-desc').value.trim();
  if (!name) { toast('Please enter a pipeline name', 'error'); return; }

  const stageItems = Array.from(document.querySelectorAll('#stage-list .stage-item'));
  const stageObjs  = stageItems
    .map(el => ({
      name:       el.querySelector('input[type=text]').value.trim(),
      color:      el.dataset.color      || '',
      stageId:    el.dataset.stageId    || '',
      targetDays: Number(el.dataset.targetDays) || 0,
    }))
    .filter(s => s.name);
  if (stageObjs.length < 2) { toast('Add at least 2 stages', 'error'); return; }

  const btn = document.querySelector('#pipeline-form-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  if (editPipelineId) {
    await State.updatePipeline(editPipelineId, { name, desc });
    for (const sid of _removedStageIds) await State.deleteStage(sid);
    for (let i = 0; i < stageObjs.length; i++) {
      const s = stageObjs[i];
      if (s.stageId) {
        await State.updateStageData(s.stageId, { name:s.name, color:s.color, order:i+1, targetDays:s.targetDays });
      } else {
        await State.addStage(editPipelineId, s.name, s.color, s.targetDays);
      }
    }
    State.activePipelineId = editPipelineId;
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save pipeline'; }
    closePipelineModal();
    renderPipelinesPage();
    populateFormDropdowns();
    toast(`Pipeline "${name}" updated!`);
  } else {
    const pipeline = await State.addPipeline(name, desc, stageObjs);
    State.activePipelineId = pipeline.id;
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save pipeline'; }
    closePipelineModal();
    renderPipelinesPage();
    populateFormDropdowns();
    toast(`Pipeline "${name}" created!`);
  }
}

/* ── Add task to pipeline modal ─────────────────────────── */
let activePipeStageId = null;
let activePipeId      = null;

function openPipeTaskModal(pipelineId, stageId) {
  activePipeId      = pipelineId;
  activePipeStageId = stageId;

  const ptClient   = document.getElementById('pt-client');
  const ptAssignee = document.getElementById('pt-assignee');
  ptClient.innerHTML   = `<option value="">Select client…</option>` +
    State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  ptAssignee.innerHTML = `<option value="">Assign to…</option>` +
    State.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

  document.getElementById('pt-title').value    = '';
  document.getElementById('pt-notes').value    = '';
  document.getElementById('pt-due').value      = '';
  document.getElementById('pt-priority').value = 'medium';
  document.getElementById('pipe-task-modal').classList.add('open');
  setTimeout(() => document.getElementById('pt-title').focus(), 100);
}

function closePipeTaskModal() {
  document.getElementById('pipe-task-modal').classList.remove('open');
  activePipeStageId = null;
  activePipeId      = null;
}

async function submitPipeTaskForm() {
  const title      = document.getElementById('pt-title').value.trim();
  const clientId   = document.getElementById('pt-client').value;
  const assigneeId = document.getElementById('pt-assignee').value;
  const priority   = document.getElementById('pt-priority').value;
  const dueDate    = document.getElementById('pt-due').value;
  const notes      = document.getElementById('pt-notes').value.trim();

  if (!title || !clientId || !assigneeId || !dueDate) {
    toast('Please fill in all required fields', 'error'); return;
  }

  const btn = document.querySelector('#pipe-task-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  await State.addTask({
    title, clientId, assigneeId, priority, dueDate, notes,
    type:            'oneoff',
    status:          'pending',
    pipelineId:      activePipeId,
    pipelineStageId: activePipeStageId,
  });

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Add task'; }
  closePipeTaskModal();
  renderKanbanBoard(activePipeId);
  toast('Task added to pipeline!');
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS PAGE
   ═══════════════════════════════════════════════════════════ */
function renderSettings() {
  renderSettingsDemoBanner();
  renderSettingsUsers();
  renderSettingsClients();
}

function renderSettingsDemoBanner() {
  const el = document.getElementById('settings-demo-banner');
  if (!el) return;
  const demoTaskIds   = new Set(DEMO.tasks.map(t => t.id));
  const demoClientIds = new Set(DEMO.clients.map(c => c.id));
  const hasDemoTasks   = State.tasks.some(t => demoTaskIds.has(t.id));
  const hasDemoClients = State.clients.some(c => demoClientIds.has(c.id));
  if (!hasDemoTasks && !hasDemoClients) { el.style.display = 'none'; return; }
  el.style.display = '';
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;
      background:var(--amber-light);border:1px solid rgba(183,105,26,0.25);
      border-radius:var(--radius);padding:12px 16px;margin-bottom:28px">
      <div>
        <div style="font-size:13px;font-weight:500;color:var(--amber)">
          <i class="ti ti-info-circle" style="font-size:14px;vertical-align:-2px"></i>
          Demo data is active
        </div>
        <div style="font-size:11.5px;color:var(--ink-2);margin-top:3px">
          ${hasDemoTasks ? `${State.tasks.filter(t => demoTaskIds.has(t.id)).length} demo tasks` : ''}
          ${hasDemoTasks && hasDemoClients ? ' · ' : ''}
          ${hasDemoClients ? `${State.clients.filter(c => demoClientIds.has(c.id)).length} demo clients` : ''}
          are showing. Clear them to start fresh.
        </div>
      </div>
      <button class="btn btn-sm" onclick="clearDemoData()"
        style="background:var(--amber);color:#fff;border:none;white-space:nowrap;flex-shrink:0">
        <i class="ti ti-trash"></i> Clear demo data
      </button>
    </div>`;
}

async function clearDemoData() {
  if (!confirm('Remove all demo tasks and demo clients? This cannot be undone.')) return;
  const demoTaskIds   = DEMO.tasks.map(t => t.id);
  const demoClientIds = DEMO.clients.map(c => c.id);

  for (const id of demoTaskIds) {
    if (State.getTask(id)) await State.deleteTask(id);
  }
  for (const id of demoClientIds) {
    if (State.getClient(id)) await State.deleteClient(id);
  }

  toast('Demo data cleared!');
  renderSettings();
  renderDashboard();
  renderAllTasks();
  renderClients();
}

function renderSettingsUsers() {
  const el = document.getElementById('settings-user-list');
  if (!el) return;
  const isAdmin = State.user?.role === 'admin';
  el.innerHTML = State.users.map(u => `
    <div class="settings-item" id="sui-${u.id}">
      <div class="settings-item-view">
        <div class="av-large ${u.avClass}"
             style="width:36px;height:36px;font-size:11px;flex-shrink:0">${u.initials}</div>
        <div class="settings-item-info">
          <div class="settings-item-name">${u.name}</div>
          <div class="settings-item-sub">${u.email}</div>
        </div>
        <span class="role-pill role-${u.role === 'admin' ? 'admin' : u.role === 'assistant' ? 'asst' : 'viewer'}"
              style="flex-shrink:0">
          <i class="ti ti-${u.role === 'admin' ? 'crown' : u.role === 'assistant' ? 'pencil' : 'eye'}"
             style="font-size:10px"></i>
          ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}
        </span>
        ${isAdmin ? `
        <div class="settings-item-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEditUserModal('${u.id}')">
            <i class="ti ti-edit"></i> Edit
          </button>
          ${u.id !== State.user?.id
            ? `<button class="btn btn-danger btn-sm" onclick="confirmDeleteUser('${u.id}')">
                 <i class="ti ti-trash"></i>
               </button>`
            : '<div style="width:32px"></div>'}
        </div>` : ''}
      </div>
    </div>`).join('');
}

function renderSettingsClients() {
  const el = document.getElementById('settings-client-list');
  if (!el) return;
  const isAdmin = State.user?.role === 'admin';
  el.innerHTML = State.clients.map(c => `
    <div class="settings-item" id="sci-${c.id}">
      <div class="settings-item-view">
        <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:${c.bg};
             display:flex;align-items:center;justify-content:center;font-family:var(--mono);
             font-size:10px;font-weight:600;color:${c.color};flex-shrink:0">${c.short}</div>
        <div class="settings-item-info">
          <div class="settings-item-name">${c.name}</div>
          <div class="settings-item-sub" style="display:flex;align-items:center;gap:5px">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;
                  background:${c.color};flex-shrink:0"></span>
            ${c.color} &middot; ${c.short}
          </div>
        </div>
        ${isAdmin ? `
        <div class="settings-item-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEditClientModal('${c.id}')">
            <i class="ti ti-edit"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteClient('${c.id}')">
            <i class="ti ti-trash"></i>
          </button>
        </div>` : ''}
      </div>
    </div>`).join('');
}

/* ── User modal (add & edit) ────────────────────────────── */
function openAddUserModal() {
  editUserId = null;
  document.getElementById('user-form-title').textContent = 'Add user';
  document.getElementById('uf-id').value       = '';
  document.getElementById('uf-name').value     = '';
  document.getElementById('uf-email').value    = '';
  document.getElementById('uf-role').value     = 'viewer';
  document.getElementById('uf-initials').value = '';
  document.getElementById('uf-avclass').value  = 'av-viewer';
  document.getElementById('uf-password').value = '';
  document.getElementById('uf-pw-star').style.display = '';
  document.getElementById('uf-pw-hint').textContent   = '';
  document.getElementById('uf-telegram').value        = '';
  document.getElementById('user-form-modal').classList.add('open');
  setTimeout(() => document.getElementById('uf-name').focus(), 100);
}

function openEditUserModal(userId) {
  editUserId = userId;
  const u = State.getUser(userId);
  if (!u) return;
  document.getElementById('user-form-title').textContent = 'Edit user';
  document.getElementById('uf-id').value       = u.id;
  document.getElementById('uf-name').value     = u.name;
  document.getElementById('uf-email').value    = u.email;
  document.getElementById('uf-role').value     = u.role;
  document.getElementById('uf-initials').value = u.initials;
  document.getElementById('uf-avclass').value  = u.avClass;
  document.getElementById('uf-password').value = '';
  document.getElementById('uf-pw-star').style.display  = 'none';
  document.getElementById('uf-pw-hint').textContent    = 'Leave blank to keep current password';
  document.getElementById('uf-telegram').value         = u.telegramChatId || '';
  document.getElementById('user-form-modal').classList.add('open');
}

function closeUserModal() {
  document.getElementById('user-form-modal').classList.remove('open');
  editUserId = null;
}

async function submitUserForm() {
  const name           = document.getElementById('uf-name').value.trim();
  const email          = document.getElementById('uf-email').value.trim();
  const role           = document.getElementById('uf-role').value;
  const initials       = document.getElementById('uf-initials').value.trim().toUpperCase();
  const avClass        = document.getElementById('uf-avclass').value;
  const password       = document.getElementById('uf-password').value;
  const telegramChatId = document.getElementById('uf-telegram').value.trim();

  if (!name || !email || !initials) {
    toast('Please fill in name, email and initials', 'error'); return;
  }
  if (!editUserId && !password) {
    toast('Password is required for new users', 'error'); return;
  }

  const btn = document.querySelector('#user-form-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  if (editUserId) {
    const patch = { name, email, role, initials, avClass, telegramChatId };
    if (password) patch.password = password;
    await State.updateUser(editUserId, patch);
    toast('User updated!');
  } else {
    await State.addUser({ name, email, role, initials, avClass, password, telegramChatId });
    toast(`User "${name}" added!`);
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save user'; }
  closeUserModal();
  renderSettingsUsers();
  renderUserSelectList();
  populateFormDropdowns();
}

async function confirmDeleteUser(userId) {
  const u = State.getUser(userId);
  if (!u) return;
  if (userId === State.user?.id) { toast('You cannot delete yourself', 'error'); return; }
  if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
  await State.deleteUser(userId);
  toast(`User "${u.name}" deleted`, 'error');
  renderSettingsUsers();
  renderUserSelectList();
  populateFormDropdowns();
}

/* ── Client edit from settings ──────────────────────────── */
function openEditClientModal(clientId) {
  editClientSettingsId = clientId;
  const c = State.getClient(clientId);
  if (!c) return;
  const modal = document.getElementById('client-form-modal');
  modal.querySelector('.modal-title').textContent = 'Edit client';
  modal.querySelector('.btn-primary').innerHTML   = '<i class="ti ti-circle-check"></i> Save changes';
  document.getElementById('cf-name').value  = c.name;
  document.getElementById('cf-short').value = c.short;
  document.getElementById('cf-color').value = c.color;
  document.getElementById('cf-tags').value  = (c.tags||[]).join(', ');
  modal.classList.add('open');
}

async function confirmDeleteClient(clientId) {
  const c = State.getClient(clientId);
  if (!c) return;
  const active = State.tasks.filter(t => t.clientId === clientId && t.status !== 'done').length;
  const msg = active > 0
    ? `Delete client "${c.name}"? There are ${active} active task${active !== 1 ? 's' : ''} for this client. This cannot be undone.`
    : `Delete client "${c.name}"? This cannot be undone.`;
  if (!confirm(msg)) return;
  await State.deleteClient(clientId);
  toast(`Client "${c.name}" deleted`, 'error');
  renderSettingsClients();
  renderClients();
  populateFormDropdowns();
}

/* ═══════════════════════════════════════════════════════════
   SUB-TASKS / CHECKLIST
   ═══════════════════════════════════════════════════════════ */
function _renderChecklistSection(task, canEdit) {
  const subtasks = task.subtasks || [];
  const done  = subtasks.filter(s => s.done).length;
  const total = subtasks.length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  return `
  <div class="subtask-section">
    <div class="subtask-head">
      <span style="font-size:11px;font-weight:600;color:var(--ink-2);text-transform:uppercase;letter-spacing:0.6px">
        <i class="ti ti-checklist" style="font-size:13px;vertical-align:-2px"></i> Checklist
      </span>
      ${total ? `<span style="font-size:11px;color:var(--ink-3);font-family:var(--mono)">${done}/${total}</span>` : ''}
    </div>
    ${total ? `<div class="subtask-progress-bar">
      <div class="subtask-progress-fill" style="width:${pct}%"></div>
    </div>` : ''}
    <div class="subtask-list" id="st-list-${task.id}">
      ${subtasks.map(s => `
        <div class="subtask-item" id="st-${s.id}">
          <div class="subtask-check ${s.done ? 'checked' : ''}"
            onclick="${canEdit ? `toggleSubtaskCheck('${task.id}','${s.id}')` : ''}">
            ${s.done ? '<i class="ti ti-check" style="font-size:9px"></i>' : ''}
          </div>
          <span class="subtask-text ${s.done ? 'done' : ''}">${esc(s.text)}</span>
          ${canEdit ? `<button class="subtask-del" onclick="deleteSubtaskItem('${task.id}','${s.id}')">
            <i class="ti ti-x"></i></button>` : ''}
        </div>`).join('')}
    </div>
    ${canEdit ? `
    <div style="display:flex;gap:8px">
      <input type="text" id="st-input-${task.id}" class="form-input"
        placeholder="Add checklist item…" style="height:32px;font-size:12px"
        onkeydown="if(event.key==='Enter'){event.preventDefault();addSubtaskItem('${task.id}')}">
      <button class="btn btn-ghost btn-sm" onclick="addSubtaskItem('${task.id}')">
        <i class="ti ti-plus"></i>
      </button>
    </div>` : ''}
  </div>`;
}

async function addSubtaskItem(taskId) {
  const inp  = document.getElementById(`st-input-${taskId}`);
  const text = inp?.value?.trim();
  if (!text) return;
  inp.value = '';
  await State.addSubtask(taskId, text);
  openTaskModal(taskId); /* re-render modal */
}

async function toggleSubtaskCheck(taskId, stId) {
  await State.toggleSubtask(taskId, stId);
  /* Auto-advance: if all subtasks done and task is in a pipeline, move to next stage */
  const task = State.getTask(taskId);
  if (task?.pipelineId && task?.pipelineStageId) {
    const subtasks = task.subtasks || [];
    if (subtasks.length > 0 && subtasks.every(s => s.done)) {
      const stages   = State.getStages(task.pipelineId);
      const idx      = stages.findIndex(s => s.id === task.pipelineStageId);
      const next     = stages[idx + 1];
      if (next) {
        await State.moveTaskStage(task.id, next.id);
        toast(`✓ All done — card advanced to "${next.name}"!`);
        renderKanbanBoard(State.activePipelineId);
      }
    }
  }
  openTaskModal(taskId);
}

async function deleteSubtaskItem(taskId, stId) {
  await State.deleteSubtask(taskId, stId);
  openTaskModal(taskId);
}

/* ═══════════════════════════════════════════════════════════
   ACTIVITY LOG
   ═══════════════════════════════════════════════════════════ */
function _renderActivitySection(taskId) {
  const events = State.activityLog.filter(e => e.taskId === taskId)
    .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  if (!events.length) return '';

  return `
  <div class="activity-section">
    <button class="activity-toggle" onclick="toggleActivity(this)">
      <i class="ti ti-history" style="font-size:13px"></i>
      Activity (${events.length})
      <i class="ti ti-chevron-down" id="act-chevron" style="font-size:11px;margin-left:auto"></i>
    </button>
    <div class="activity-list" id="activity-list" style="display:none">
      ${events.map(ev => {
        const u = State.getUser(ev.userId);
        return `<div class="activity-item">
          <div class="activity-dot"></div>
          <div class="activity-text">
            ${u ? `<strong>${u.name}</strong> — ` : ''}${esc(ev.text)}
          </div>
          <div class="activity-time">${ev.createdAt}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function toggleActivity(btn) {
  const list    = document.getElementById('activity-list');
  const chevron = document.getElementById('act-chevron');
  if (!list) return;
  const open = list.style.display === 'none';
  list.style.display    = open ? '' : 'none';
  chevron.className     = open ? 'ti ti-chevron-up' : 'ti ti-chevron-down';
  chevron.style.marginLeft = 'auto';
  chevron.style.fontSize   = '11px';
}

/* ═══════════════════════════════════════════════════════════
   DOCUMENTS PAGE
   ═══════════════════════════════════════════════════════════ */
const DOC_ICONS = {
  'Trade License':    { icon:'ti-building', bg:'var(--blue-light)',   color:'var(--blue)'   },
  'Emirates ID':      { icon:'ti-id-badge', bg:'var(--purple-light)', color:'var(--purple)' },
  'Visa':             { icon:'ti-plane',    bg:'var(--accent-light)', color:'var(--accent)' },
  'VAT Registration': { icon:'ti-receipt',  bg:'var(--amber-light)',  color:'var(--amber)'  },
  'TRN Certificate':  { icon:'ti-certificate', bg:'var(--amber-light)', color:'var(--amber)' },
  'Insurance':        { icon:'ti-shield',   bg:'var(--green-light)',  color:'var(--green)'  },
};

function renderDocuments() {
  const el    = document.getElementById('document-list');
  if (!el) return;
  const today = new Date().toISOString().slice(0,10);
  const soon  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0,10);

  /* Expiry alert badge in sidebar */
  const expiring = State.expiringDocuments(30).length;
  const db = document.getElementById('badge-documents');
  if (db) { db.textContent = expiring || ''; db.style.display = expiring ? '' : 'none'; }

  /* Dashboard alert */
  const alertEl = document.getElementById('doc-expiry-alert');
  if (alertEl) {
    const critical = State.expiringDocuments(30);
    if (critical.length) {
      alertEl.style.display = '';
      alertEl.innerHTML = `
        <div style="background:var(--amber-light);border:1px solid rgba(183,105,26,0.25);
          border-radius:var(--radius);padding:12px 16px;display:flex;align-items:center;gap:12px">
          <i class="ti ti-alert-triangle" style="font-size:18px;color:var(--amber);flex-shrink:0"></i>
          <div>
            <div style="font-size:13px;font-weight:500;color:var(--amber)">
              ${critical.length} document${critical.length !== 1 ? 's' : ''} expiring within 30 days
            </div>
            <div style="font-size:11.5px;color:var(--ink-2);margin-top:2px">
              ${critical.slice(0,3).map(d => {
                const c = State.getClient(d.clientId);
                return `${c?.short||'?'} · ${d.type}`;
              }).join(' &nbsp;·&nbsp; ')}
              ${critical.length > 3 ? ` and ${critical.length-3} more` : ''}
            </div>
          </div>
        </div>`;
    } else {
      alertEl.style.display = 'none';
    }
  }

  if (!State.documents.length) {
    el.innerHTML = `<div class="empty-state">
      <i class="ti ti-file-certificate"></i>
      <p>No documents added yet. Click <strong>Add document</strong> to start tracking expiry dates.</p>
    </div>`;
    return;
  }

  /* Group by client */
  const groups = {};
  State.documents.forEach(d => {
    (groups[d.clientId] = groups[d.clientId] || []).push(d);
  });

  el.innerHTML = Object.keys(groups).map(clientId => {
    const c = State.getClient(clientId);
    const isAdmin = State.user?.role === 'admin';
    return `
    <div class="doc-group-head">
      <span style="width:8px;height:8px;border-radius:50%;background:${c?.color||'var(--ink-4)'};flex-shrink:0"></span>
      <span class="doc-group-name">${c?.name || 'Unknown client'}</span>
    </div>
    <div class="doc-grid">
      ${groups[clientId].map(d => {
        const expired  = d.expiryDate < today;
        const expiring2 = !expired && d.expiryDate <= soon;
        const ic       = DOC_ICONS[d.type] || { icon:'ti-file', bg:'var(--bg-active)', color:'var(--ink-3)' };
        const daysLeft = Math.ceil((new Date(d.expiryDate) - new Date(today)) / 86400000);

        let badgeStyle, badgeText;
        if (expired) {
          badgeStyle = 'background:var(--red-light);color:var(--red)';
          badgeText  = 'Expired';
        } else if (expiring2) {
          badgeStyle = 'background:var(--amber-light);color:var(--amber)';
          badgeText  = `${daysLeft}d left`;
        } else {
          badgeStyle = 'background:var(--green-light);color:var(--green)';
          badgeText  = `${daysLeft}d`;
        }

        return `
        <div class="doc-card ${expired ? 'expired' : expiring2 ? 'expiring' : ''}">
          <div class="doc-icon" style="background:${ic.bg};color:${ic.color}">
            <i class="ti ${ic.icon}"></i>
          </div>
          <div class="doc-info">
            <div class="doc-type">${d.type}${d.number ? ` <span style="font-weight:400;color:var(--ink-3)">#${esc(d.number)}</span>` : ''}</div>
            <div class="doc-meta">Expires ${fmtDate(d.expiryDate)}${d.notes ? ` · ${esc(d.notes)}` : ''}</div>
          </div>
          <span class="doc-expiry-badge" style="${badgeStyle}">${badgeText}</span>
          ${isAdmin ? `
          <div class="doc-actions">
            <button class="btn btn-ghost btn-sm" onclick="openEditDocumentModal('${d.id}')">
              <i class="ti ti-edit"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="createRenewalTask('${d.id}')" title="Create renewal task">
              <i class="ti ti-refresh"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteDocument('${d.id}')">
              <i class="ti ti-trash"></i>
            </button>
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

/* ── Document modal ─────────────────────────────────────── */
let editDocumentId = null;

function openAddDocumentModal() {
  editDocumentId = null;
  document.getElementById('doc-form-title').textContent = 'Add document';
  document.getElementById('df-id').value     = '';
  document.getElementById('df-number').value = '';
  document.getElementById('df-expiry').value = '';
  document.getElementById('df-notes').value  = '';
  document.getElementById('df-type').value   = 'Trade License';
  const clientSel = document.getElementById('df-client');
  clientSel.innerHTML = `<option value="">Select client…</option>` +
    State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('document-form-modal').classList.add('open');
}

function openEditDocumentModal(docId) {
  editDocumentId = docId;
  const d = State.documents.find(x => x.id === docId);
  if (!d) return;
  document.getElementById('doc-form-title').textContent = 'Edit document';
  const clientSel = document.getElementById('df-client');
  clientSel.innerHTML = `<option value="">Select client…</option>` +
    State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('df-id').value     = d.id;
  document.getElementById('df-client').value = d.clientId;
  document.getElementById('df-type').value   = d.type;
  document.getElementById('df-number').value = d.number || '';
  document.getElementById('df-expiry').value = d.expiryDate;
  document.getElementById('df-notes').value  = d.notes || '';
  document.getElementById('document-form-modal').classList.add('open');
}

function closeDocumentModal() {
  document.getElementById('document-form-modal').classList.remove('open');
  editDocumentId = null;
}

async function submitDocumentForm() {
  const clientId   = document.getElementById('df-client').value;
  const type       = document.getElementById('df-type').value;
  const number     = document.getElementById('df-number').value.trim();
  const expiryDate = document.getElementById('df-expiry').value;
  const notes      = document.getElementById('df-notes').value.trim();

  if (!clientId || !expiryDate) { toast('Please fill in client and expiry date', 'error'); return; }

  const btn = document.querySelector('#document-form-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  if (editDocumentId) {
    await State.updateDocument(editDocumentId, { clientId, type, number, expiryDate, notes });
    toast('Document updated!');
  } else {
    await State.addDocument({ clientId, type, number, expiryDate, notes });
    toast('Document added!');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save document'; }
  closeDocumentModal();
  renderDocuments();
}

async function confirmDeleteDocument(docId) {
  if (!confirm('Delete this document? This cannot be undone.')) return;
  await State.deleteDocument(docId);
  toast('Document deleted', 'error');
  renderDocuments();
}

async function createRenewalTask(docId) {
  const d = State.documents.find(x => x.id === docId);
  if (!d) return;
  const c = State.getClient(d.clientId);
  const today = new Date().toISOString().slice(0,10);
  const due   = new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10);
  await State.addTask({
    title:      `Renew ${d.type} — ${c?.short || ''}`,
    clientId:   d.clientId,
    assigneeId: State.user?.id,
    type:       'oneoff',
    priority:   'high',
    dueDate:    due,
    notes:      `Renewal for ${d.type}${d.number ? ' #'+d.number : ''}. Current expiry: ${fmtDate(d.expiryDate)}`,
    status:     'pending',
  });
  toast(`Renewal task created for ${d.type}!`);
}

/* ═══════════════════════════════════════════════════════════
   MONTHLY CLOSE CHECKLIST
   ═══════════════════════════════════════════════════════════ */

const CLOSE_TEMPLATES = [
  { title: 'Bank reconciliation',     priority: 'high'   },
  { title: 'VAT review',              priority: 'medium' },
  { title: 'Payroll processing',      priority: 'high'   },
  { title: 'P&L report',              priority: 'medium' },
  { title: 'Accounts payable review', priority: 'medium' },
];

function renderClosePage() {
  /* Default month = previous month */
  const now  = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defaultMonth = prev.toISOString().slice(0, 7);

  const monthEl = document.getElementById('cl-month');
  if (monthEl && !monthEl.value) monthEl.value = defaultMonth;

  /* Assignee dropdown */
  const asel = document.getElementById('cl-assignee');
  if (asel) {
    asel.innerHTML = State.users.map(u =>
      `<option value="${u.id}">${u.name} (${u.role})</option>`
    ).join('');
  }

  /* Task type checkboxes */
  const tlist = document.getElementById('cl-task-list');
  if (tlist) {
    tlist.innerHTML = CLOSE_TEMPLATES.map((t, i) => {
      const badgeCls = t.priority === 'high'
        ? 'background:var(--red-light);color:var(--red)'
        : 'background:var(--amber-light);color:var(--amber)';
      return `
      <div class="close-check-item checked" id="clt-${i}" onclick="toggleCloseItem(this,'clt-${i}')">
        <input type="checkbox" checked data-title="${t.title}" data-priority="${t.priority}">
        <div class="close-check-box"><i class="ti ti-check" style="font-size:9px"></i></div>
        <span class="close-check-label">${t.title}</span>
        <span class="close-check-badge" style="${badgeCls}">${t.priority}</span>
      </div>`;
    }).join('');
  }

  /* Client checkboxes */
  const clist = document.getElementById('cl-client-list');
  if (clist) {
    clist.innerHTML = State.clients.map(c => `
      <div class="close-check-item checked" id="clc-${c.id}" onclick="toggleCloseItem(this,'clc-${c.id}')">
        <input type="checkbox" checked value="${c.id}">
        <div class="close-check-box"><i class="ti ti-check" style="font-size:9px"></i></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${c.color};flex-shrink:0"></div>
        <span class="close-check-label">${c.name}</span>
        <span class="close-check-badge" style="background:${c.bg};color:${c.color};font-family:var(--mono)">${c.short}</span>
      </div>`).join('');
  }

  document.getElementById('cl-result').style.display = 'none';
  updateCloseLabel();
}

function toggleCloseItem(el, id) {
  el.classList.toggle('checked');
  el.querySelector('input').checked = el.classList.contains('checked');
  updateCloseLabel();
}

let _allClientsSelected = true;
function toggleAllClients() {
  _allClientsSelected = !_allClientsSelected;
  document.querySelectorAll('#cl-client-list .close-check-item').forEach(el => {
    el.classList.toggle('checked', _allClientsSelected);
    el.querySelector('input').checked = _allClientsSelected;
  });
  document.getElementById('cl-toggle-btn').textContent =
    _allClientsSelected ? 'Deselect all' : 'Select all';
  updateCloseLabel();
}

function updateCloseLabel() {
  const tasks   = document.querySelectorAll('#cl-task-list   .close-check-item.checked').length;
  const clients = document.querySelectorAll('#cl-client-list .close-check-item.checked').length;
  const total   = tasks * clients;
  const lbl     = document.getElementById('cl-count-label');
  if (lbl) lbl.textContent = total > 0 ? `${total} task${total !== 1 ? 's' : ''} will be created` : '';
  const genLbl = document.getElementById('cl-gen-label');
  if (genLbl) genLbl.textContent = total > 0 ? `Generate ${total} tasks` : 'Generate checklist';
}

function _lastDayOfMonth(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m, 0).toISOString().slice(0, 10);
}

async function generateCloseChecklist() {
  const month      = document.getElementById('cl-month').value;
  const assigneeId = document.getElementById('cl-assignee').value;

  if (!month)      { toast('Please select a month', 'error');    return; }
  if (!assigneeId) { toast('Please select an assignee', 'error'); return; }

  const selectedTaskEls   = Array.from(document.querySelectorAll('#cl-task-list   .close-check-item.checked input'));
  const selectedClientEls = Array.from(document.querySelectorAll('#cl-client-list .close-check-item.checked input'));

  if (!selectedTaskEls.length)   { toast('Select at least one task type', 'error');   return; }
  if (!selectedClientEls.length) { toast('Select at least one client', 'error'); return; }

  const monthLabel = _monthLabel(month);
  const dueDate    = _lastDayOfMonth(month);

  const btn = document.getElementById('cl-gen-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Creating tasks…'; }

  const created = [];
  for (const clientEl of selectedClientEls) {
    for (const taskEl of selectedTaskEls) {
      const titleKey = `${taskEl.dataset.title} — ${monthLabel}`;
      const exists   = State.tasks.some(t => t.title === titleKey && t.clientId === clientEl.value);
      if (exists) continue;
      const task = await State.addTask({
        title:      titleKey,
        clientId:   clientEl.value,
        assigneeId,
        type:       'monthly',
        priority:   taskEl.dataset.priority,
        dueDate,
        notes:      `Monthly close · ${monthLabel}`,
        status:     'pending',
      });
      created.push(task);
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-sparkles"></i> <span id="cl-gen-label">Generate checklist</span>';
    updateCloseLabel();
  }

  toast(`${created.length} tasks created for ${monthLabel}!`);

  const result = document.getElementById('cl-result');
  result.style.display = '';
  document.getElementById('cl-result-title').textContent =
    `${created.length} tasks generated for ${monthLabel}`;
  renderTaskList(created, 'cl-task-results');
}

/* ═══════════════════════════════════════════════════════════
   STAGE COLOUR PICKER
   ═══════════════════════════════════════════════════════════ */
function _buildSwatches() {
  const sw = document.getElementById('stage-color-swatches');
  if (!sw) return;
  sw.innerHTML = STAGE_COLORS.map(c => `
    <div onclick="applyStageColor('${c}')" title="${c}"
      style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;
             border:2px solid transparent;transition:transform 110ms,border-color 110ms"
      onmouseover="this.style.transform='scale(1.2)';this.style.borderColor='#fff'"
      onmouseout ="this.style.transform='scale(1)';  this.style.borderColor='transparent'">
    </div>`).join('');
}

function openStageColorPicker(stageId, anchorEl) {
  _colorPickerTarget = { type:'stage', id:stageId };
  _positionAndShow(anchorEl);
}

function openStageColorPickerForInput(itemId, anchorEl) {
  _colorPickerTarget = { type:'input', id:itemId };
  _positionAndShow(anchorEl);
}

function _positionAndShow(anchorEl) {
  _buildSwatches();
  const picker = document.getElementById('stage-color-picker');
  picker.style.display = 'block';
  const rect = anchorEl.getBoundingClientRect();
  const top  = rect.bottom + 6;
  const left = Math.max(8, Math.min(rect.left - 70, window.innerWidth - 200));
  picker.style.top  = top  + 'px';
  picker.style.left = left + 'px';
}

function applyStageColor(color) {
  if (!_colorPickerTarget) return;
  if (_colorPickerTarget.type === 'stage') {
    State.updateStageColor(_colorPickerTarget.id, color);
    renderKanbanBoard(State.activePipelineId);
  } else {
    const item = document.getElementById(_colorPickerTarget.id);
    if (item) {
      item.dataset.color = color;
      const preview = item.querySelector('.stage-color-preview');
      const btn     = item.querySelector('.stage-color-btn');
      if (preview) preview.style.background = color || '';
      if (btn)     btn.classList.toggle('has-color', !!color);
    }
  }
  closeStageColorPicker();
}

function closeStageColorPicker() {
  const p = document.getElementById('stage-color-picker');
  if (p) p.style.display = 'none';
  _colorPickerTarget = null;
}

/* ═══════════════════════════════════════════════════════════
   TASK DEPENDENCIES
   ═══════════════════════════════════════════════════════════ */
function _renderDependenciesSection(task, canEdit) {
  const blockedBy = task.blockedBy || [];
  if (!blockedBy.length && !canEdit) return '';

  return `
  <div class="dep-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <span style="font-size:11px;font-weight:600;color:var(--ink-2);text-transform:uppercase;letter-spacing:0.6px">
        <i class="ti ti-link" style="font-size:12px;vertical-align:-1px"></i> Dependencies
        ${blockedBy.length ? `<span style="font-weight:400;color:var(--ink-3)">(${blockedBy.length})</span>` : ''}
      </span>
    </div>
    ${blockedBy.map(bid => {
      const blocker  = State.getTask(bid);
      const resolved = blocker?.status === 'done';
      return `
      <div class="dep-item ${resolved ? 'resolved' : ''}">
        <span class="dep-status" style="${resolved
          ? 'background:var(--green-light);color:var(--green)'
          : 'background:var(--red-light);color:var(--red)'}">
          ${resolved ? '✓ Done' : '⊘ Open'}
        </span>
        <span class="dep-item-title">${blocker ? esc(blocker.title) : `Task ${bid}`}</span>
        ${canEdit ? `<button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:11px"
          onclick="removeDependencyItem('${task.id}','${bid}')">
          <i class="ti ti-x" style="font-size:11px"></i>
        </button>` : ''}
      </div>`;
    }).join('')}
    ${canEdit ? `
    <div style="display:flex;gap:8px;margin-top:6px">
      <select id="dep-select-${task.id}" class="form-select" style="height:32px;font-size:12px">
        <option value="">Add blocked-by task…</option>
        ${State.tasks
          .filter(t => t.id !== task.id && !blockedBy.includes(t.id) && t.status !== 'done')
          .map(t => `<option value="${t.id}">${esc(t.title)}</option>`)
          .join('')}
      </select>
      <button class="btn btn-ghost btn-sm" onclick="addDependencyItem('${task.id}')">
        <i class="ti ti-plus"></i> Add
      </button>
    </div>` : ''}
  </div>`;
}

async function addDependencyItem(taskId) {
  const sel = document.getElementById(`dep-select-${taskId}`);
  const blockedById = sel?.value;
  if (!blockedById) return;
  await State.addDependency(taskId, blockedById);
  openTaskModal(taskId);
}

async function removeDependencyItem(taskId, blockedById) {
  await State.removeDependency(taskId, blockedById);
  openTaskModal(taskId);
}

/* ═══════════════════════════════════════════════════════════
   SAVED FILTER VIEWS
   ═══════════════════════════════════════════════════════════ */
let _activeSavedView = null;

function renderSavedViews() {
  const bar  = document.getElementById('saved-views-bar');
  const list = document.getElementById('saved-views-list');
  if (!bar || !list) return;
  const views = State.savedViews;
  bar.style.display = views.length ? 'flex' : 'none';
  list.innerHTML = views.map(v => `
    <span class="saved-view-chip ${_activeSavedView === v.id ? 'active' : ''}"
      onclick="applySavedView('${v.id}')">
      <i class="ti ti-bookmark" style="font-size:11px"></i>
      ${esc(v.name)}
      <button class="sv-del" onclick="event.stopPropagation();deleteSavedViewItem('${v.id}')">
        <i class="ti ti-x"></i>
      </button>
    </span>`).join('');
}

async function saveCurrentFilter() {
  const name = prompt('Name this view:', '');
  if (!name?.trim()) return;
  const filters = { ...taskFilter };
  await State.addSavedView(name.trim(), filters);
  renderSavedViews();
  toast(`View "${name.trim()}" saved!`);
}

function applySavedView(id) {
  const v = State.savedViews.find(x => x.id === id);
  if (!v) return;
  _activeSavedView = (_activeSavedView === id) ? null : id;
  if (_activeSavedView) {
    Object.assign(taskFilter, v.filters);
  } else {
    taskFilter = { status:'all', type:'all', clientId:'all', assigneeId:'all', search:'' };
  }
  renderAllTasks();
}

async function deleteSavedViewItem(id) {
  await State.deleteSavedView(id);
  if (_activeSavedView === id) {
    _activeSavedView = null;
    taskFilter = { status:'all', type:'all', clientId:'all', assigneeId:'all', search:'' };
  }
  renderSavedViews();
  renderAllTasks();
  toast('View deleted', 'error');
}

/* ═══════════════════════════════════════════════════════════
   TIME TRACKING
   ═══════════════════════════════════════════════════════════ */
function _renderTimeLogSection(task, canLog) {
  const logs  = State.getTaskTimeLogs(task.id);
  const total = logs.reduce((s, l) => s + l.hours, 0);

  return `
  <div class="timelog-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <span style="font-size:11px;font-weight:600;color:var(--ink-2);text-transform:uppercase;letter-spacing:0.6px">
        <i class="ti ti-clock" style="font-size:12px;vertical-align:-1px"></i> Time log
      </span>
      ${total > 0 ? `<span style="font-size:11px;font-family:var(--mono);color:var(--accent);font-weight:600">
        ${total.toFixed(1)}h total
      </span>` : ''}
    </div>
    ${logs.length ? `
      <div class="timelog-list">
        ${logs.map(l => {
          const u = State.getUser(l.userId);
          return `<div class="timelog-item">
            <span class="timelog-hours">${l.hours.toFixed(1)}h</span>
            <span class="timelog-desc">${esc(l.description) || '—'}
              ${l.billable ? '<span style="font-size:10px;color:var(--accent);margin-left:4px">● billable</span>' : ''}
            </span>
            <span class="timelog-meta">${u?.initials||'?'} · ${fmtDate(l.date)}</span>
            ${canLog && l.userId === State.user?.id ? `
            <button class="btn btn-ghost btn-sm" style="padding:2px 5px"
              onclick="deleteTimeEntry('${task.id}','${l.id}')">
              <i class="ti ti-x" style="font-size:11px"></i>
            </button>` : ''}
          </div>`;
        }).join('')}
      </div>` : ''}
    ${canLog ? `
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      <input type="number" id="tl-hours-${task.id}" class="form-input"
        placeholder="Hours" min="0.25" step="0.25"
        style="width:90px;height:32px;font-size:12px">
      <input type="text" id="tl-desc-${task.id}" class="form-input"
        placeholder="Description (optional)"
        style="flex:1;min-width:120px;height:32px;font-size:12px"
        onkeydown="if(event.key==='Enter')logTimeEntry('${task.id}')">
      <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-2);cursor:pointer;white-space:nowrap">
        <input type="checkbox" id="tl-bill-${task.id}" checked> Billable
      </label>
      <button class="btn btn-ghost btn-sm" onclick="logTimeEntry('${task.id}')">
        <i class="ti ti-plus"></i> Log
      </button>
    </div>` : ''}
  </div>`;
}

async function logTimeEntry(taskId) {
  const hoursEl = document.getElementById(`tl-hours-${taskId}`);
  const descEl  = document.getElementById(`tl-desc-${taskId}`);
  const billEl  = document.getElementById(`tl-bill-${taskId}`);
  const hours   = parseFloat(hoursEl?.value);
  if (!hours || hours <= 0) { toast('Enter valid hours', 'error'); return; }
  await State.addTimeLog({
    taskId,
    hours,
    description: descEl?.value?.trim() || '',
    date:        new Date().toISOString().slice(0,10),
    billable:    billEl?.checked !== false,
  });
  toast(`${hours}h logged!`);
  openTaskModal(taskId);
}

async function deleteTimeEntry(taskId, logId) {
  await State.deleteTimeLog(logId);
  openTaskModal(taskId);
}

/* ═══════════════════════════════════════════════════════════
   DUPLICATE TASK + SAVE AS TEMPLATE
   ═══════════════════════════════════════════════════════════ */
async function duplicateTask(taskId) {
  const src = State.getTask(taskId);
  if (!src) return;
  await State.addTask({
    title:      `${src.title} (Copy)`,
    clientId:   src.clientId,
    assigneeId: src.assigneeId,
    type:       src.type,
    priority:   src.priority,
    dueDate:    src.dueDate,
    notes:      src.notes || '',
    status:     'pending',
    subtasks:   (src.subtasks || []).map(s => ({ ...s, id:'st'+Date.now()+Math.random(), done:false })),
  });
  closeTaskModal();
  toast('Task duplicated!');
  refreshCurrentPage();
}

async function saveAsTemplate(taskId) {
  const src = State.getTask(taskId);
  if (!src) return;
  /* Pre-fill template form with task data */
  openNewTemplateModal();
  document.getElementById('template-form-modal-title').textContent = 'Save as template';
  document.getElementById('tmf-title').value    = src.title;
  document.getElementById('tmf-client').value   = src.clientId;
  document.getElementById('tmf-assignee').value = src.assigneeId;
  /* Open advanced section and fill it */
  document.getElementById('tmf-advanced').style.display = '';
  document.getElementById('tmf-priority').value  = src.priority || 'medium';
  document.getElementById('tmf-notes').value     = src.notes || '';
  document.getElementById('tmf-hours').value     = '';
  if (src.pipelineId) {
    document.getElementById('tmf-pipeline').value = src.pipelineId;
    onTemplatePipelineChange(src.pipelineId);
    setTimeout(() => { document.getElementById('tmf-stage').value = src.pipelineStageId || ''; }, 100);
  }
  /* Populate checklist */
  document.getElementById('tmf-subtask-list').innerHTML = '';
  (src.subtasks || []).forEach(s => _addTemplateChecklistRow(s.text));
  closeTaskModal();
  document.getElementById('template-form-modal').classList.add('open');
  toast('Task details loaded into template form — set the recurrence schedule and save');
}

/* ═══════════════════════════════════════════════════════════
   CLIENT PROFILE
   ═══════════════════════════════════════════════════════════ */
let _clientProfileId   = null;
let _clientProfileEdit = false;

let _clientActiveTab = 'overview';

function openClientProfile(clientId) {
  _clientProfileId   = clientId;
  _clientProfileEdit = false;
  _clientActiveTab   = 'overview';
  const c = State.getClient(clientId);
  if (!c) return;

  /* Header */
  document.getElementById('cp-modal-title').textContent = c.name;
  document.getElementById('cp-modal-sub').textContent   = c.short + ' · ' + (c.classification || 'Mainland');
  const av = document.getElementById('cp-modal-avatar');
  av.style.background = c.bg; av.style.color = c.color; av.textContent = c.short;

  /* Reset tabs */
  document.querySelectorAll('.cp-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'overview'));

  /* Admin-only edit button */
  const editBtn = document.getElementById('cp-edit-btn');
  if (editBtn) editBtn.style.display = State.user?.role === 'admin' ? '' : 'none';

  _renderClientTab(clientId, 'overview');
  document.getElementById('client-profile-modal').classList.add('open');
}

function switchClientTab(tab, el) {
  _clientActiveTab   = tab;
  _clientProfileEdit = false;
  document.querySelectorAll('.cp-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  const editBtn = document.getElementById('cp-edit-btn');
  if (editBtn) {
    editBtn.innerHTML = '<i class="ti ti-edit"></i> Edit';
    editBtn.style.display = (tab === 'overview' && State.user?.role === 'admin') ? '' : 'none';
  }
  _renderClientTab(_clientProfileId, tab);
}

function _renderClientTab(clientId, tab) {
  if (tab === 'overview')   _renderCPOverview(clientId);
  else if (tab === 'notes') _renderCPNotes(clientId);
  else if (tab === 'tasks') _renderCPTasks(clientId);
  else if (tab === 'documents') _renderCPDocuments(clientId);
  else if (tab === 'time')  _renderCPTime(clientId);
}

function closeClientProfile() {
  document.getElementById('client-profile-modal').classList.remove('open');
  _clientProfileId   = null;
  _clientProfileEdit = false;
}

function toggleClientProfileEdit() {
  _clientProfileEdit = !_clientProfileEdit;
  const btn = document.getElementById('cp-edit-btn');
  if (_clientProfileEdit) {
    _renderClientProfileEdit(_clientProfileId);
    if (btn) btn.innerHTML = '<i class="ti ti-x"></i> Cancel';
  } else {
    _renderClientProfileView(_clientProfileId);
    if (btn) btn.innerHTML = '<i class="ti ti-edit"></i> Edit';
  }
}

function _renderClientProfileView(clientId) { _renderCPOverview(clientId); } /* compat alias */

function _renderCPOverview(clientId) {
  const c        = State.getClient(clientId);
  const h        = State.clientHealth().find(x => x.id === clientId) || { total:0, done:0, overdue:0, pct:0 };
  const hs       = State.clientHealthScore(clientId);
  const hrs      = State.clientBillableHours(clientId);
  const vat      = State.vatNextDue(clientId);
  const today    = new Date().toISOString().slice(0,10);
  const isAdmin  = State.user?.role === 'admin';
  const assignee = State.getUser(c.assignedAccountantId);
  const docs     = State.getClientDocs(clientId);
  const expDocs  = docs.filter(d => d.expiryDate <= new Date(Date.now()+30*86400000).toISOString().slice(0,10));

  const clsBadge = {
    'Mainland':  'background:var(--blue-light);color:var(--blue)',
    'Free Zone': 'background:var(--purple-light);color:var(--purple)',
    'Offshore':  'background:var(--bg-active);color:var(--ink-2)',
  }[c.classification || 'Mainland'] || '';

  const services = [
    c.vatRegistered   && { label:'VAT Registered',  icon:'ti-receipt',   color:'var(--accent)'  },
    c.wpsRequired     && { label:'WPS Required',     icon:'ti-cash',      color:'var(--amber)'   },
    c.payrollManaged  && { label:'Payroll Managed',  icon:'ti-users',     color:'var(--blue)'    },
  ].filter(Boolean);

  const el = document.getElementById('cp-body');
  el.innerHTML = `
    <!-- Header -->
    <div class="cp-header">
      <div class="cp-avatar" style="background:${c.bg};color:${c.color}">${c.short}</div>
      <div>
        <div class="cp-name">${esc(c.name)}</div>
        <div class="cp-short">${c.short}</div>
        <div class="cp-class-badge" style="${clsBadge}">${c.classification || 'Mainland'}</div>
      </div>
      ${expDocs.length ? `<div style="margin-left:auto;font-size:11.5px;font-weight:600;
        color:var(--amber);background:var(--amber-light);border-radius:var(--radius-sm);
        padding:5px 10px;display:flex;align-items:center;gap:5px">
        <i class="ti ti-alert-triangle"></i> ${expDocs.length} doc${expDocs.length!==1?'s':''} expiring
      </div>` : ''}
    </div>

    <!-- Health score -->
    <div class="cp-section">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
        <div style="width:52px;height:52px;border-radius:50%;background:${hs.bg};
          display:flex;align-items:center;justify-content:center;
          font-size:24px;font-weight:800;font-family:var(--mono);color:${hs.color};flex-shrink:0">
          ${hs.score}
        </div>
        <div>
          <div style="font-size:14px;font-weight:600;color:${hs.color}">${hs.label}</div>
          <div style="font-size:11.5px;color:var(--ink-3);margin-top:2px">${hs.pct}% tasks completed · ${hs.overdue} overdue${hs.expired?' · '+hs.expired+' expired doc(s)':''}</div>
        </div>
        ${vat ? `<div style="margin-left:auto;text-align:right;flex-shrink:0">
          <div style="font-size:10px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.5px;font-weight:600">VAT due</div>
          <div style="font-size:13px;font-family:var(--mono);color:${vat<=new Date(Date.now()+14*86400000).toISOString().slice(0,10)?'var(--red)':'var(--ink)'};font-weight:600">${fmtDate(vat)}</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Stats row -->
    <div class="cp-section">
      <div class="cp-stat-row">
        <div class="cp-stat">
          <div class="cp-stat-val">${h.total}</div>
          <div class="cp-stat-lbl">Total tasks</div>
        </div>
        <div class="cp-stat">
          <div class="cp-stat-val" style="color:var(--accent)">${h.done}</div>
          <div class="cp-stat-lbl">Completed</div>
        </div>
        <div class="cp-stat">
          <div class="cp-stat-val" style="color:${h.overdue?'var(--red)':'var(--ink)'}">${h.overdue}</div>
          <div class="cp-stat-lbl">Overdue</div>
        </div>
        <div class="cp-stat">
          <div style="cp-stat-val" style="font-size:14px;font-weight:600;font-family:var(--mono)">
            ${hrs.thisMonth.toFixed(1)}h
            ${hrs.lastMonth > 0 ? `<span style="font-size:10px;color:var(--ink-3);font-weight:400;display:block">vs ${hrs.lastMonth.toFixed(1)}h last month</span>` : ''}
          </div>
          <div class="cp-stat-lbl">Hours this month</div>
        </div>
        <div class="cp-stat">
          <div class="cp-stat-val">${docs.length}</div>
          <div class="cp-stat-lbl">Documents</div>
        </div>
      </div>
    </div>

    <!-- Business details -->
    <div class="cp-section">
      <div class="cp-section-title"><i class="ti ti-building" style="font-size:11px"></i> Business details</div>
      <div class="cp-grid">
        ${_cpField('Trade License', c.tradeLicense)}
        ${_cpField('TRN', c.trn)}
        ${_cpField('CT Number', c.corporateTaxNo)}
        ${_cpField('Incorporated', c.incorporationDate ? fmtDate(c.incorporationDate) : '')}
        ${_cpField('Client since', c.clientSince ? fmtDate(c.clientSince) : '')}
        ${_cpField('Account manager', assignee?.name || '')}
      </div>
    </div>

    <!-- VAT & CT filing -->
    ${(c.vatRegistered || c.ctAnniversaryDate) ? `
    <div class="cp-section">
      <div class="cp-section-title"><i class="ti ti-receipt" style="font-size:11px"></i> Tax filing</div>
      ${c.vatRegistered ? `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:12.5px;font-weight:500;color:var(--ink)">VAT Return</div>
          <div style="font-size:11px;color:var(--ink-3)">Quarterly — next due: ${vat ? fmtDate(vat) : '—'}</div>
        </div>
        ${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="createVatFilingReminders('${c.id}')">
          <i class="ti ti-bell-plus"></i> Create reminders
        </button>` : ''}
      </div>` : ''}
      ${c.ctAnniversaryDate ? `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0">
        <div>
          <div style="font-size:12.5px;font-weight:500;color:var(--ink)">Corporate Tax</div>
          <div style="font-size:11px;color:var(--ink-3)">Yearly — year-end: ${fmtDate(c.ctAnniversaryDate)}</div>
        </div>
        ${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="createCtFilingReminder('${c.id}')">
          <i class="ti ti-bell-plus"></i> Create reminder
        </button>` : ''}
      </div>` : ''}
    </div>` : ''}

    <!-- Tags -->
    ${(c.tags||[]).length ? `
    <div class="cp-section">
      <div class="cp-section-title"><i class="ti ti-tag" style="font-size:11px"></i> Tags</div>
      <div class="client-tags-row">
        ${(c.tags).map(t => `<span class="client-tag">${esc(t)}</span>`).join('')}
      </div>
    </div>` : ''}

    <!-- Contact -->
    <div class="cp-section">
      <div class="cp-section-title"><i class="ti ti-phone" style="font-size:11px"></i> Contact</div>
      <div class="cp-grid">
        ${_cpField('Contact person', c.contactName)}
        ${_cpField('Phone', c.contactPhone)}
        ${_cpField('Email', c.contactEmail)}
        ${_cpField('WhatsApp', c.contactWhatsapp)}
      </div>
      ${c.contactWhatsapp ? `
      <div style="margin-top:10px">
        <a href="https://wa.me/${c.contactWhatsapp.replace(/\D/g,'')}" target="_blank"
          class="btn btn-success btn-sm">
          <i class="ti ti-brand-whatsapp"></i> Message on WhatsApp
        </a>
      </div>` : ''}
    </div>

    <!-- Services -->
    ${services.length ? `
    <div class="cp-section">
      <div class="cp-section-title"><i class="ti ti-settings" style="font-size:11px"></i> Services</div>
      <div class="cp-services">
        ${services.map(s => `
        <span class="cp-service-tag" style="background:var(--bg);border:1px solid var(--border-md);color:${s.color}">
          <i class="ti ${s.icon}" style="font-size:11px"></i> ${s.label}
        </span>`).join('')}
      </div>
    </div>` : ''}

    <!-- Quick actions -->
    <div class="cp-section" style="border-bottom:none;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-ghost btn-sm" onclick="filterByClient('${clientId}');closeClientProfile()">
        <i class="ti ti-list-check"></i> View tasks
      </button>
      <button class="btn btn-ghost btn-sm" onclick="closeClientProfile();showPage('documents',document.querySelector('[data-page=documents]'))">
        <i class="ti ti-file-certificate"></i> View documents
      </button>
      <button class="btn btn-primary btn-sm" data-admin-only onclick="closeClientProfile();openNewTaskModal();document.getElementById('tf-client').value='${clientId}'">
        <i class="ti ti-plus"></i> Add task
      </button>
      <div style="margin-left:auto;display:flex;gap:6px">
        ${isAdmin ? (c.active !== false
          ? `<button class="btn btn-ghost btn-sm" onclick="archiveClientAction('${clientId}')" title="Archive client — hides from main view, keeps all data">
               <i class="ti ti-archive"></i> Archive
             </button>`
          : `<button class="btn btn-success btn-sm" onclick="unarchiveClientAction('${clientId}')" title="Restore client">
               <i class="ti ti-archive-off"></i> Unarchive
             </button>`)
          : ''}
        ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteClientAction('${clientId}')">
          <i class="ti ti-trash"></i> Delete
        </button>` : ''}
      </div>
    </div>`;

  /* Apply admin-only visibility */
  if (State.user?.role !== 'admin') {
    el.querySelectorAll('[data-admin-only]').forEach(e => e.style.display = 'none');
  }
}

async function createVatFilingReminders(clientId) {
  const n = await State.createVatFilingReminders(clientId);
  toast(`${n} quarterly VAT reminders created!`);
}

async function createCtFilingReminder(clientId) {
  const n = await State.createCtFilingReminder(clientId);
  if (n) toast('Corporate Tax reminder created!');
  else toast('Set CT year-end date in profile first', 'error');
}

async function archiveClientAction(clientId) {
  const c = State.getClient(clientId);
  if (!confirm(`Archive "${c?.name}"? It will be hidden from the main view but all data is kept. You can unarchive anytime.`)) return;
  await State.archiveClient(clientId);
  toast(`"${c?.name}" archived`);
  closeClientProfile();
  renderClients();
  renderSettingsClients();
}

async function unarchiveClientAction(clientId) {
  const c = State.getClient(clientId);
  await State.unarchiveClient(clientId);
  toast(`"${c?.name}" restored`);
  closeClientProfile();
  renderClients();
  renderSettingsClients();
}

async function deleteClientAction(clientId) {
  const c      = State.getClient(clientId);
  const active = State.tasks.filter(t => t.clientId === clientId && t.status !== 'done').length;
  const msg    = active > 0
    ? `Delete "${c?.name}"? This client has ${active} active task${active!==1?'s':''}. All data will be permanently removed. Consider archiving instead.`
    : `Delete "${c?.name}"? This cannot be undone. Consider archiving instead.`;
  if (!confirm(msg)) return;
  await State.deleteClient(clientId);
  toast(`"${c?.name}" deleted`, 'error');
  closeClientProfile();
  renderClients();
  renderSettingsClients();
  populateFormDropdowns();
}

function _cpField(label, value) {
  const empty = !value || !String(value).trim();
  return `<div class="cp-field">
    <label>${label}</label>
    <span class="${empty ? 'empty' : ''}">${empty ? '—' : esc(String(value))}</span>
  </div>`;
}

function _renderClientProfileEdit(clientId) {
  const c  = State.getClient(clientId);
  const el = document.getElementById('cp-body');
  el.innerHTML = `
  <div style="padding:20px 22px">

    <div class="section-title" style="margin-bottom:12px">Basic info</div>
    <div class="form-group">
      <label class="form-label">Client full name</label>
      <input type="text" id="cpe-name" class="form-input" value="${esc(c.name||'')}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Short code</label>
        <input type="text" id="cpe-short" class="form-input" value="${esc(c.short||'')}" maxlength="5"
          style="font-family:var(--mono);text-transform:uppercase">
        <div style="font-size:10.5px;color:var(--ink-3);margin-top:3px">2-5 letters shown on task tags</div>
      </div>
      <div class="form-group">
        <label class="form-label">Accent colour</label>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="color" id="cpe-color" value="${c.color||'#4f8ef7'}"
            oninput="document.getElementById('cpe-color-preview').style.background=this.value"
            style="width:44px;height:36px;border:1px solid var(--border-md);border-radius:var(--radius-sm);
              padding:2px;cursor:pointer;background:var(--bg)">
          <div>
            <div style="font-size:12px;color:var(--ink-2)">Used for tags and card accent</div>
            <div style="margin-top:4px;display:flex;align-items:center;gap:6px">
              <div id="cpe-color-preview" style="width:20px;height:20px;border-radius:4px;background:${c.color}"></div>
              <span style="font-size:11px;color:var(--ink-3);font-family:var(--mono)">${c.color}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>
    <div class="section-title" style="margin-bottom:12px">Business details</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Trade License</label>
        <input type="text" id="cpe-tl" class="form-input" value="${esc(c.tradeLicense||'')}"></div>
      <div class="form-group"><label class="form-label">TRN</label>
        <input type="text" id="cpe-trn" class="form-input" value="${esc(c.trn||'')}" style="font-family:var(--mono)"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">CT Number</label>
        <input type="text" id="cpe-vat" class="form-input" value="${esc(c.corporateTaxNo||'')}" style="font-family:var(--mono)"></div>
      <div class="form-group"><label class="form-label">Classification</label>
        <select id="cpe-class" class="form-select">
          <option value="Mainland" ${(c.classification||'Mainland')==='Mainland'?'selected':''}>Mainland</option>
          <option value="Free Zone" ${c.classification==='Free Zone'?'selected':''}>Free Zone</option>
          <option value="Offshore"  ${c.classification==='Offshore'?'selected':''}>Offshore</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Incorporation date</label>
        <input type="date" id="cpe-inc" class="form-input" value="${c.incorporationDate||''}"></div>
      <div class="form-group"><label class="form-label">Client since</label>
        <input type="date" id="cpe-since" class="form-input" value="${c.clientSince||''}"></div>
    </div>
    <div class="divider"></div>
    <div class="section-title" style="margin-bottom:12px">Contact</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Contact person</label>
        <input type="text" id="cpe-cname" class="form-input" value="${esc(c.contactName||'')}"></div>
      <div class="form-group"><label class="form-label">Phone</label>
        <input type="tel" id="cpe-phone" class="form-input" value="${esc(c.contactPhone||'')}" style="font-family:var(--mono)"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Email</label>
        <input type="email" id="cpe-email" class="form-input" value="${esc(c.contactEmail||'')}"></div>
      <div class="form-group"><label class="form-label">WhatsApp</label>
        <input type="tel" id="cpe-wa" class="form-input" value="${esc(c.contactWhatsapp||'')}" style="font-family:var(--mono)" placeholder="+971 50 123 4567"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Account manager</label>
        <select id="cpe-acct" class="form-select">
          <option value="">—</option>
          ${State.users.map(u => `<option value="${u.id}" ${c.assignedAccountantId===u.id?'selected':''}>${u.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="divider"></div>
    <div class="section-title" style="margin-bottom:12px">Services &amp; tax filing</div>
    <div class="form-group">
      <label class="form-label">Services</label>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="cpe-vat-reg" ${c.vatRegistered?'checked':''}> VAT Registered
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="cpe-wps" ${c.wpsRequired?'checked':''}> WPS Required
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="cpe-pay" ${c.payrollManaged?'checked':''}> Payroll Managed
        </label>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">VAT registration date</label>
        <input type="date" id="cpe-vatstart" class="form-input" value="${c.vatStartDate||''}">
        <div style="font-size:10.5px;color:var(--ink-3);margin-top:3px">Used to calculate quarterly VAT due dates</div>
      </div>
      <div class="form-group"><label class="form-label">CT year-end date</label>
        <input type="date" id="cpe-ctdate" class="form-input" value="${c.ctAnniversaryDate||''}">
        <div style="font-size:10.5px;color:var(--ink-3);margin-top:3px">Corporate tax fiscal year-end</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tags <span style="color:var(--ink-3);font-weight:400;text-transform:none;letter-spacing:0">(comma separated)</span></label>
      <input type="text" id="cpe-tags" class="form-input" value="${esc((c.tags||[]).join(', '))}"
        placeholder="e.g. VAT, WPS, Payroll, Audit, Retail">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
      <button class="btn btn-ghost" onclick="toggleClientProfileEdit()">Cancel</button>
      <button class="btn btn-primary" onclick="saveClientProfile('${clientId}')">
        <i class="ti ti-circle-check"></i> Save
      </button>
    </div>
  </div>`;
}

async function saveClientProfile(clientId) {
  const tagsRaw = document.getElementById('cpe-tags')?.value || '';
  const newColor = document.getElementById('cpe-color')?.value || State.getClient(clientId)?.color;
  const patch = {
    name:                 document.getElementById('cpe-name')?.value.trim() || State.getClient(clientId)?.name,
    short:                (document.getElementById('cpe-short')?.value.trim() || State.getClient(clientId)?.short).toUpperCase(),
    color:                newColor,
    bg:                   hexToRgba(newColor, 0.12),
    tradeLicense:         document.getElementById('cpe-tl').value.trim(),
    trn:                  document.getElementById('cpe-trn').value.trim(),
    corporateTaxNo:       document.getElementById('cpe-vat').value.trim(),
    classification:       document.getElementById('cpe-class').value,
    incorporationDate:    document.getElementById('cpe-inc').value,
    clientSince:          document.getElementById('cpe-since').value,
    contactName:          document.getElementById('cpe-cname').value.trim(),
    contactPhone:         document.getElementById('cpe-phone').value.trim(),
    contactEmail:         document.getElementById('cpe-email').value.trim(),
    contactWhatsapp:      document.getElementById('cpe-wa').value.trim(),
    assignedAccountantId: document.getElementById('cpe-acct').value,
    vatRegistered:        document.getElementById('cpe-vat-reg').checked,
    wpsRequired:          document.getElementById('cpe-wps').checked,
    payrollManaged:       document.getElementById('cpe-pay').checked,
    vatStartDate:         document.getElementById('cpe-vatstart')?.value || '',
    ctAnniversaryDate:    document.getElementById('cpe-ctdate')?.value || '',
    tags:                 tagsRaw.split(',').map(t=>t.trim()).filter(Boolean),
  };
  const btn = document.querySelector('#cp-body .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }
  await State.updateClient(clientId, patch);
  toast('Client profile saved!');
  _clientProfileEdit = false;
  document.getElementById('cp-edit-btn').innerHTML = '<i class="ti ti-edit"></i> Edit';
  _renderCPOverview(clientId);
  renderClients();
  renderSettingsClients();
}

/* ── Client profile tab renderers ───────────────────────── */
function _renderCPNotes(clientId) {
  const el    = document.getElementById('cp-body');
  const notes = State.getClientNotes(clientId);
  const isAdmin = State.user?.role === 'admin';
  el.innerHTML = `
  <div class="cp-tab-content">
    ${isAdmin ? `
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <textarea id="cn-inp" class="form-textarea" rows="2"
        placeholder="Add a note — meeting summary, instructions, important info…"
        style="height:72px;font-size:13px;flex:1"></textarea>
      <button class="btn btn-primary btn-sm" style="align-self:flex-end"
        onclick="addClientNoteItem('${clientId}')">
        <i class="ti ti-plus"></i> Add
      </button>
    </div>` : ''}
    ${notes.length ? `
    <div class="cn-list">
      ${notes.map(n => {
        const u = State.getUser(n.userId);
        return `<div class="cn-item">
          <div class="cn-meta">
            <strong>${u?.name||'?'}</strong> · ${n.createdAt}
            ${isAdmin ? `<button style="float:right;background:none;border:none;cursor:pointer;
              color:var(--ink-4);font-size:12px" onclick="deleteClientNoteItem('${n.id}','${clientId}')">
              <i class="ti ti-trash"></i>
            </button>` : ''}
          </div>
          <div class="cn-text">${esc(n.text)}</div>
        </div>`;
      }).join('')}
    </div>` : `<div class="empty-state"><i class="ti ti-notes"></i><p>No notes yet</p></div>`}
  </div>`;
}

async function addClientNoteItem(clientId) {
  const inp  = document.getElementById('cn-inp');
  const text = inp?.value?.trim();
  if (!text) return;
  inp.value = '';
  await State.addClientNote(clientId, text);
  _renderCPNotes(clientId);
  toast('Note added');
}

async function deleteClientNoteItem(noteId, clientId) {
  if (!confirm('Delete this note?')) return;
  await State.deleteClientNote(noteId);
  _renderCPNotes(clientId);
}

function _renderCPTasks(clientId) {
  const el    = document.getElementById('cp-body');
  const today = new Date().toISOString().slice(0,10);
  const tasks = State.tasks
    .filter(t => t.clientId === clientId)
    .sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||''));
  el.innerHTML = `<div class="cp-tab-content">
    ${tasks.length
      ? `<div class="task-list">${tasks.map(renderTaskCard).join('')}</div>`
      : `<div class="empty-state"><i class="ti ti-clipboard-list"></i><p>No tasks for this client</p></div>`}
  </div>`;
}

function _renderCPDocuments(clientId) {
  const el   = document.getElementById('cp-body');
  const docs = State.getClientDocs(clientId);
  const today = new Date().toISOString().slice(0,10);
  const soon  = new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  el.innerHTML = `<div class="cp-tab-content">
    ${State.user?.role === 'admin' ? `
    <div style="margin-bottom:14px;display:flex;justify-content:flex-end">
      <button class="btn btn-primary btn-sm" onclick="openAddDocumentModal();
        setTimeout(()=>document.getElementById('df-client').value='${clientId}',50)">
        <i class="ti ti-plus"></i> Add document
      </button>
    </div>` : ''}
    ${docs.length ? docs.map(d => {
      const expired  = d.expiryDate < today;
      const expiring = !expired && d.expiryDate <= soon;
      const daysLeft = Math.ceil((new Date(d.expiryDate) - new Date(today)) / 86400000);
      return `<div class="doc-card ${expired?'expired':expiring?'expiring':''}" style="margin-bottom:6px">
        <div class="doc-info">
          <div class="doc-type">${esc(d.type)} ${d.number?`<span style="font-weight:400;color:var(--ink-3)">#${esc(d.number)}</span>`:''}</div>
          <div class="doc-meta">Expires ${fmtDate(d.expiryDate)}</div>
        </div>
        <span class="doc-expiry-badge" style="${expired?'background:var(--red-light);color:var(--red)':expiring?'background:var(--amber-light);color:var(--amber)':'background:var(--green-light);color:var(--green)'}">
          ${expired?'Expired':daysLeft+'d left'}
        </span>
      </div>`;
    }).join('')
    : `<div class="empty-state"><i class="ti ti-file-certificate"></i><p>No documents added yet</p></div>`}
  </div>`;
}

function _renderCPTime(clientId) {
  const el   = document.getElementById('cp-body');
  const hrs  = State.clientBillableHours(clientId);
  const logs = State.timeLogs.filter(l => {
    const task = State.getTask(l.taskId);
    return task?.clientId === clientId;
  }).sort((a,b) => b.date.localeCompare(a.date));

  el.innerHTML = `<div class="cp-tab-content">
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <div class="cp-stat" style="flex:1;border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center">
        <div class="cp-stat-val">${hrs.thisMonth.toFixed(1)}h</div>
        <div class="cp-stat-lbl">This month</div>
      </div>
      <div class="cp-stat" style="flex:1;border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center">
        <div class="cp-stat-val">${hrs.lastMonth.toFixed(1)}h</div>
        <div class="cp-stat-lbl">Last month</div>
      </div>
      <div class="cp-stat" style="flex:1;border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center">
        <div class="cp-stat-val">${hrs.total.toFixed(1)}h</div>
        <div class="cp-stat-lbl">Total</div>
      </div>
    </div>
    ${logs.length ? `
    <div class="timelog-list">
      ${logs.map(l => {
        const u    = State.getUser(l.userId);
        const task = State.getTask(l.taskId);
        return `<div class="timelog-item">
          <span class="timelog-hours">${l.hours.toFixed(1)}h</span>
          <div class="timelog-desc">
            ${esc(task?.title||'?')}
            ${l.description ? `<div style="font-size:11px;color:var(--ink-3)">${esc(l.description)}</div>` : ''}
          </div>
          <span class="timelog-meta">${u?.initials||'?'} · ${fmtDate(l.date)}</span>
        </div>`;
      }).join('')}
    </div>` : `<div class="empty-state"><i class="ti ti-clock"></i><p>No time logged yet</p></div>`}
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE ADVANCED FIELDS
   ═══════════════════════════════════════════════════════════ */
let _tmfSubtasks = []; /* checklist items in template form */

function _populateTemplateLists() {
  document.getElementById('tmf-client').innerHTML =
    `<option value="">Select client…</option>` +
    State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('tmf-assignee').innerHTML =
    `<option value="">Assign to…</option>` +
    State.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  /* Populate pipeline dropdown in template form */
  const psel = document.getElementById('tmf-pipeline');
  if (psel) {
    psel.innerHTML = `<option value="">No pipeline</option>` +
      State.pipelines.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    onTemplatePipelineChange('');
  }
}

function onTemplatePipelineChange(pipelineId) {
  const stageSel = document.getElementById('tmf-stage');
  if (!stageSel) return;
  if (!pipelineId) { stageSel.innerHTML = '<option value="">—</option>'; return; }
  stageSel.innerHTML = State.getStages(pipelineId)
    .map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function addTemplateChecklistItem() {
  const inp  = document.getElementById('tmf-subtask-inp');
  const text = inp?.value?.trim();
  if (!text) return;
  inp.value = '';
  _tmfSubtasks.push(text);
  _renderTemplatChecklist();
  inp.focus();
}

function _addTemplateChecklistRow(text) {
  _tmfSubtasks.push(text);
  _renderTemplatChecklist();
}

function removeTemplateChecklistItem(idx) {
  _tmfSubtasks.splice(idx, 1);
  _renderTemplatChecklist();
}

function _renderTemplatChecklist() {
  const el = document.getElementById('tmf-subtask-list');
  if (!el) return;
  el.innerHTML = _tmfSubtasks.map((text, i) => `
    <div style="display:flex;align-items:center;gap:7px;background:var(--bg);
      border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px">
      <i class="ti ti-check" style="font-size:11px;color:var(--accent)"></i>
      <span style="flex:1;font-size:12.5px;color:var(--ink)">${esc(text)}</span>
      <button type="button" class="subtask-del" style="opacity:1" onclick="removeTemplateChecklistItem(${i})">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════════════════
   REMINDERS MODULE
   ═══════════════════════════════════════════════════════════ */
const REM_CATS = {
  /* Payments */
  'PDC Cheque':        { icon:'ti-checkbook',     color:'#5b3fa6', bg:'var(--purple-light)' },
  'Credit Card':       { icon:'ti-credit-card',   color:'#c0392b', bg:'var(--red-light)'    },
  'Bank Transfer':     { icon:'ti-building-bank', color:'#1a5fb4', bg:'var(--blue-light)'   },
  'VAT Payment':       { icon:'ti-receipt',       color:'#0d7a6b', bg:'var(--accent-light)' },
  'WPS':               { icon:'ti-cash',          color:'#b7691a', bg:'var(--amber-light)'  },
  'Loan Payment':      { icon:'ti-coin',          color:'#c0392b', bg:'var(--red-light)'    },
  'Lease / Rent':      { icon:'ti-home',          color:'#1a5fb4', bg:'var(--blue-light)'   },
  'Supplier Payment':  { icon:'ti-truck',         color:'#5b3fa6', bg:'var(--purple-light)' },
  'Tax Payment':       { icon:'ti-calculator',    color:'#0d7a6b', bg:'var(--accent-light)' },
  /* Events & Follow-ups */
  'Meeting':           { icon:'ti-users',         color:'#1a5fb4', bg:'var(--blue-light)'   },
  'Client Call':       { icon:'ti-phone',         color:'#0d7a6b', bg:'var(--accent-light)' },
  'Follow-up':         { icon:'ti-arrow-forward', color:'#b7691a', bg:'var(--amber-light)'  },
  'Deadline':          { icon:'ti-alarm',         color:'#c0392b', bg:'var(--red-light)'    },
  'Document Request':  { icon:'ti-file-text',     color:'#5b3fa6', bg:'var(--purple-light)' },
  'Visa / Immigration':{ icon:'ti-plane',         color:'#1a5fb4', bg:'var(--blue-light)'   },
  'License Renewal':   { icon:'ti-license',       color:'#b7691a', bg:'var(--amber-light)'  },
  'Contract Renewal':  { icon:'ti-writing',       color:'#5b3fa6', bg:'var(--purple-light)' },
  /* Other */
  'Custom':            { icon:'ti-bell',          color:'#6b6760', bg:'var(--bg-active)'    },
};

let _remFilter = 'all';

function setReminderFilter(filter, el) {
  _remFilter = filter;
  if (el) {
    el.closest('.filter-bar').querySelectorAll('.filter-chip[data-filter="rem-status"]')
      .forEach(c => c.classList.remove('on'));
    el.classList.add('on');
  }
  renderReminders();
}

function renderReminders() {
  const el    = document.getElementById('reminder-list');
  if (!el) return;
  /* Filter by user: admin sees all, others see only their own */
  const myId    = State.user?.id;
  const isAdmin = State.user?.role === 'admin';
  const today = new Date().toISOString().slice(0,10);

  /* Each user sees only their own reminders; admin sees all */
  let rems = State.reminders.filter(r =>
    isAdmin || (r.assignedUserId === myId) || (!r.assignedUserId && r.assignedUserId !== 'admin')
  );
  if (_remFilter === 'upcoming') rems = rems.filter(r => r.active && !r.paidAt && r.eventDate >= today);
  else if (_remFilter === 'overdue') rems = rems.filter(r => r.active && !r.paidAt && r.eventDate < today);
  else if (_remFilter === 'done') rems = rems.filter(r => r.paidAt || !r.active);
  else rems = rems.filter(r => r.active || r.paidAt);

  rems.sort((a,b) => {
    if (a.paidAt && !b.paidAt) return 1;
    if (!a.paidAt && b.paidAt) return -1;
    return (a.eventDate||'').localeCompare(b.eventDate||'');
  });

  /* Update badge */
  const urgentCount = State.reminders.filter(r => {
    if (!r.active || r.paidAt) return false;
    const d = Math.ceil((new Date(r.eventDate) - new Date(today)) / 86400000);
    return d <= 7;
  }).length;
  const rb = document.getElementById('badge-reminders');
  if (rb) { rb.textContent = urgentCount||''; rb.style.display = urgentCount ? '' : 'none'; }

  if (!rems.length) {
    el.innerHTML = `<div class="empty-state">
      <i class="ti ti-bell"></i>
      <p>No reminders found. Click <strong>Add reminder</strong> to track payments.</p>
    </div>`;
    return;
  }

  el.innerHTML = rems.map(r => {
    const cat      = REM_CATS[r.category] || REM_CATS['Custom'];
    const c        = r.clientId ? State.getClient(r.clientId) : null;
    const assignee = r.assignedUserId ? State.getUser(r.assignedUserId) : null;
    const paid     = !!r.paidAt;
    const days = r.eventDate
      ? Math.ceil((new Date(r.eventDate) - new Date(today)) / 86400000) : null;

    /* Get occurrences for recurring reminders */
    const allDates   = _getOccurrenceDates(r);
    const paidDates  = r.paidDates || [];
    const isRecurring = r.recurrence && r.recurrence !== 'none';

    /* For display: next unpaid occurrence (or eventDate for one-time) */
    const displayDate = isRecurring
      ? (allDates.find(d => !paidDates.includes(d)) || allDates[allDates.length-1])
      : r.eventDate;
    const doneCount  = isRecurring ? paidDates.length : (paid ? 1 : 0);
    const totalCount = isRecurring ? allDates.length : 1;
    const allDone    = isRecurring ? (doneCount >= totalCount) : paid;

    const dispDays = displayDate
      ? Math.ceil((new Date(displayDate) - new Date(today)) / 86400000) : null;

    /* Days badge */
    let daysBadge = '';
    if (allDone) {
      daysBadge = `<span class="rem-days-badge" style="background:var(--green-light);color:var(--green)">✓ Done</span>`;
    } else if (dispDays === null) {
      daysBadge = '';
    } else if (dispDays < 0) {
      daysBadge = `<span class="rem-days-badge" style="background:var(--red-light);color:var(--red)">⚠ ${Math.abs(dispDays)}d overdue</span>`;
    } else if (dispDays === 0) {
      daysBadge = `<span class="rem-days-badge" style="background:var(--red-light);color:var(--red)">Today</span>`;
    } else if (dispDays <= 3) {
      daysBadge = `<span class="rem-days-badge" style="background:var(--red-light);color:var(--red)">${dispDays}d left</span>`;
    } else if (dispDays <= 7) {
      daysBadge = `<span class="rem-days-badge" style="background:var(--amber-light);color:var(--amber)">${dispDays}d left</span>`;
    } else {
      daysBadge = `<span class="rem-days-badge" style="background:var(--green-light);color:var(--green)">${dispDays}d away</span>`;
    }

    const cardCls = allDone ? 'paid' : dispDays !== null && dispDays < 0 ? 'overdue' : dispDays !== null && dispDays <= 7 ? 'due-soon' : '';

    /* Notify icons */
    const notifyHtml = `
      ${r.notifyEmail    ? '<i class="ti ti-mail" style="font-size:11px;color:var(--ink-4)" title="Email"></i>' : ''}
      ${r.notifyTelegram ? '<i class="ti ti-brand-telegram" style="font-size:11px;color:var(--ink-4)" title="Telegram"></i>' : ''}`;

    /* Recurrence label */
    const recLabel = isRecurring
      ? `<span style="font-size:10px;font-weight:600;background:var(--blue-light);color:var(--blue);
           padding:1px 7px;border-radius:20px">
           ${r.recurrence === 'monthly' ? '↻ Monthly' : r.recurrence === 'quarterly' ? '↻ Quarterly' : '↻ Custom'}
         </span>
         <span style="font-size:11px;color:var(--ink-3);font-family:var(--mono)">${doneCount}/${totalCount} done</span>`
      : '';

    /* Occurrence list for recurring — collapsed by default */
    const occurrenceHtml = isRecurring ? `
      <div style="margin-top:8px">
        <button type="button" onclick="event.stopPropagation();this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('i').className='ti '+(this.nextElementSibling.style.display==='none'?'ti-chevron-down':'ti-chevron-up')"
          style="background:none;border:none;font-size:11px;color:var(--ink-3);cursor:pointer;
            display:flex;align-items:center;gap:4px;font-family:var(--font);padding:0">
          <i class="ti ti-chevron-down" style="font-size:11px"></i>
          ${doneCount}/${totalCount} dates · ${allDates.filter(d=>!paidDates.includes(d)).length} remaining
        </button>
        <div style="display:none;margin-top:8px;border-top:1px solid var(--border);padding-top:8px">
        ${allDates.slice(0, 6).map(d => {
          const isDone = paidDates.includes(d);
          const dDays  = Math.ceil((new Date(d) - new Date(today)) / 86400000);
          const dStyle = isDone ? 'color:var(--ink-4);text-decoration:line-through' :
                         dDays < 0 ? 'color:var(--red);font-weight:500' :
                         dDays === 0 ? 'color:var(--red);font-weight:600' : 'color:var(--ink-2)';
          return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;
            border-bottom:1px solid var(--border)">
            <span style="font-size:12px;${dStyle};font-family:var(--mono);min-width:90px">${fmtDate(d)}</span>
            ${isDone
              ? `<span style="font-size:11px;color:var(--accent)"><i class="ti ti-check" style="font-size:11px"></i> Done</span>`
              : `<span style="font-size:11px;color:${dDays<0?'var(--red)':dDays<=7?'var(--amber)':'var(--ink-3)'}">${dDays<0?Math.abs(dDays)+'d overdue':dDays===0?'Today':dDays+'d away'}</span>`}
            ${isAdmin && !isDone ? `<button class="btn btn-success btn-sm" style="padding:2px 8px;font-size:11px;margin-left:auto"
              onclick="markOccurrenceDone('${r.id}','${d}')">
              <i class="ti ti-check"></i> Done
            </button>` : '<span style="margin-left:auto"></span>'}
          </div>`;
        }).join('')}
        ${allDates.length > 6 ? `<div style="font-size:11px;color:var(--ink-4);margin-top:6px;text-align:center">
          +${allDates.length - 6} more occurrences
        </div>` : ''}
        </div>
      </div>` : '';

    /* Schedule chips */
    const scheduleChips = [r.remind1, r.remind2, r.remind3].filter(Boolean)
      .map(d => `<span class="rem-schedule-chip"><i class="ti ti-bell" style="font-size:9px"></i> ${d}d before</span>`)
      .join('');

    return `
    <div class="rem-card ${cardCls}">
      <div class="rem-icon" style="background:${cat.bg};color:${cat.color}">
        <i class="ti ${cat.icon}"></i>
      </div>
      <div class="rem-body" style="flex:1">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
          <div style="flex:1;min-width:0">
            <div class="rem-title">${esc(r.title)}</div>
            <div class="rem-meta">
              <span style="background:${cat.bg};color:${cat.color};font-size:10px;font-weight:600;
                padding:1px 8px;border-radius:20px">${r.category}</span>
              ${recLabel}
              ${c ? `<span style="color:${c.color};font-size:11px">● ${c.name}</span>` : ''}
              ${!isRecurring ? `<span style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">${fmtDate(r.eventDate)}</span>` : ''}
              ${isAdmin && assignee ? `<div class="assign-chip ${assignee.avClass}" title="${assignee.name}" style="width:18px;height:18px;font-size:7px">${assignee.initials}</div>` : ''}
              ${notifyHtml}
            </div>
            ${r.amount ? `<div style="font-size:12px;font-weight:600;color:var(--ink);margin-top:3px;font-family:var(--mono)">${esc(String(r.amount))}</div>` : ''}
            ${scheduleChips ? `<div class="rem-schedule" style="margin-top:5px">${scheduleChips}</div>` : ''}
            ${r.notes ? `<div style="font-size:11.5px;color:var(--ink-3);margin-top:4px">${esc(r.notes)}</div>` : ''}
            ${occurrenceHtml}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
            ${daysBadge}
            ${isAdmin && !allDone ? `
            <div class="rem-actions">
              ${!isRecurring ? `<button class="btn btn-success btn-sm" onclick="markReminderDone('${r.id}')">
                <i class="ti ti-circle-check"></i> Done
              </button>` : ''}
              <button class="btn btn-ghost btn-sm" onclick="openEditReminderModal('${r.id}')">
                <i class="ti ti-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm" onclick="confirmDeleteReminder('${r.id}')">
                <i class="ti ti-trash"></i>
              </button>
            </div>` : isAdmin ? `
            <button class="btn btn-ghost btn-sm" onclick="confirmDeleteReminder('${r.id}')">
              <i class="ti ti-trash"></i>
            </button>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Reminder modal ─────────────────────────────────────── */
let _editReminderId  = null;
let _recurrenceType  = 'none';
let _recCustomDates  = [];

/* ── Recurrence helpers ─────────────────────────────────── */
function setRecurrenceType(type) {
  _recurrenceType = type;

  /* Toggle button styles */
  ['none','monthly','quarterly','custom'].forEach(t => {
    const btn = document.getElementById('rec-' + t);
    if (!btn) return;
    const on = (t === type);
    btn.style.background  = on ? 'var(--ink)' : '';
    btn.style.color       = on ? 'var(--bg-sidebar)' : '';
    btn.style.borderColor = on ? 'var(--ink)' : '';
  });

  /* Show/hide option panels */
  const mo = document.getElementById('rec-monthly-opts');
  const qo = document.getElementById('rec-quarterly-opts');
  const co = document.getElementById('rec-custom-opts');
  if (mo) mo.style.display = (type === 'monthly')   ? '' : 'none';
  if (qo) qo.style.display = (type === 'quarterly') ? '' : 'none';
  if (co) co.style.display = (type === 'custom')    ? '' : 'none';

  /* Save button label */
  const lbl = document.getElementById('rf-save-label');
  if (!lbl) return;
  if (type === 'monthly') {
    const n = parseInt(document.getElementById('rec-months')?.value) || 12;
    lbl.textContent = `Save — creates ${n} monthly reminders`;
  } else if (type === 'quarterly') {
    const n = parseInt(document.getElementById('rec-quarters')?.value) || 4;
    lbl.textContent = `Save — creates ${n} quarterly reminders`;
  } else if (type === 'custom') {
    const n = 1 + _recCustomDates.filter(Boolean).length;
    lbl.textContent = `Save — creates ${n} reminder${n !== 1 ? 's' : ''}`;
  } else {
    lbl.textContent = 'Save reminder';
  }
}

function addRecCustomDate() {
  _recCustomDates.push('');
  _renderRecCustomDates();
}

function removeRecCustomDate(idx) {
  _recCustomDates.splice(idx, 1);
  _renderRecCustomDates();
  setRecurrenceType('custom'); /* update label */
}

function _renderRecCustomDates() {
  const el = document.getElementById('rec-custom-dates');
  if (!el) return;
  el.innerHTML = _recCustomDates.map((d, i) => `
    <div style="display:flex;gap:7px;align-items:center">
      <input type="date" class="form-input" value="${d}" style="flex:1;height:34px"
        oninput="_recCustomDates[${i}]=this.value;setRecurrenceType('custom')">
      <button type="button" class="btn btn-ghost btn-sm" onclick="removeRecCustomDate(${i})">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join('');
}

function _resetRecurrence() {
  _recurrenceType = 'none';
  _recCustomDates = [];
  setRecurrenceType('none');
  const el = document.getElementById('rec-custom-dates');
  if (el) el.innerHTML = '';
}

function _generateDates(baseDate) {
  const dates = [baseDate];
  if (_recurrenceType === 'monthly') {
    const months = parseInt(document.getElementById('rec-months')?.value) || 12;
    const base   = new Date(baseDate);
    for (let i = 1; i < months; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, base.getDate());
      dates.push(d.toISOString().slice(0,10));
    }
  } else if (_recurrenceType === 'quarterly') {
    const qtrs = parseInt(document.getElementById('rec-quarters')?.value) || 4;
    const base = new Date(baseDate);
    for (let i = 1; i < qtrs; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + (i * 3), base.getDate());
      dates.push(d.toISOString().slice(0,10));
    }
  } else if (_recurrenceType === 'custom') {
    _recCustomDates.filter(Boolean).forEach(d => { if (!dates.includes(d)) dates.push(d); });
    dates.sort();
  }
  return dates;
}

function openAddReminderModal() {
  _editReminderId = null;
  document.getElementById('reminder-form-title').textContent = 'Add reminder';
  document.getElementById('rf-id').value         = '';
  document.getElementById('rf-title').value      = '';
  document.getElementById('rf-category').value   = 'PDC Cheque';
  document.getElementById('rf-amount').value     = '';
  document.getElementById('rf-date').value       = '';
  document.getElementById('rf-r1').value         = '7';
  document.getElementById('rf-r2').value         = '3';
  document.getElementById('rf-r3').value         = '1';
  document.getElementById('rf-email').checked    = true;
  document.getElementById('rf-telegram').checked = true;
  document.getElementById('rf-notes').value      = '';
  document.getElementById('rf-client').innerHTML =
    `<option value="">No client</option>` +
    State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  _populateReminderAssignee(State.user?.id);
  _resetRecurrence();
  document.getElementById('reminder-form-modal').classList.add('open');
  setTimeout(() => document.getElementById('rf-title').focus(), 100);
}

function _populateReminderAssignee(selectedId) {
  const group = document.getElementById('rf-assign-group');
  const sel   = document.getElementById('rf-assignee');
  if (!group || !sel) return;
  /* Only admin sees the assign dropdown; others auto-assign to themselves */
  if (State.user?.role !== 'admin') {
    group.style.display = 'none';
    sel.innerHTML = `<option value="${State.user?.id}">${State.user?.name}</option>`;
    return;
  }
  group.style.display = '';
  sel.innerHTML = State.users.map(u =>
    `<option value="${u.id}" ${u.id === selectedId ? 'selected' : ''}>${u.name} (${u.role})</option>`
  ).join('');
}

function openEditReminderModal(remId) {
  _editReminderId = remId;
  const r = State.reminders.find(x => x.id === remId);
  if (!r) return;
  document.getElementById('reminder-form-title').textContent = 'Edit reminder';
  document.getElementById('rf-id').value        = r.id;
  document.getElementById('rf-title').value     = r.title;
  document.getElementById('rf-category').value  = r.category;
  document.getElementById('rf-amount').value    = r.amount || '';
  document.getElementById('rf-date').value      = r.eventDate;
  document.getElementById('rf-r1').value        = r.remind1 || '';
  document.getElementById('rf-r2').value        = r.remind2 || '';
  document.getElementById('rf-r3').value        = r.remind3 || '';
  document.getElementById('rf-email').checked   = r.notifyEmail;
  document.getElementById('rf-telegram').checked = r.notifyTelegram;
  document.getElementById('rf-notes').value     = r.notes || '';
  document.getElementById('rf-client').innerHTML =
    `<option value="">No client</option>` +
    State.clients.map(c => `<option value="${c.id}" ${c.id===r.clientId?'selected':''}>${c.name}</option>`).join('');
  _populateReminderAssignee(r.assignedUserId || State.user?.id);
  _resetRecurrence(); /* edit mode = one-time only */
  document.getElementById('reminder-form-modal').classList.add('open');
}

function closeReminderModal() {
  document.getElementById('reminder-form-modal').classList.remove('open');
  _editReminderId = null;
}

async function submitReminderForm() {
  const title    = document.getElementById('rf-title').value.trim();
  const category = document.getElementById('rf-category').value;
  const amount   = document.getElementById('rf-amount').value.trim() || null;
  const clientId = document.getElementById('rf-client').value;
  const eventDate = document.getElementById('rf-date').value;
  const remind1  = parseInt(document.getElementById('rf-r1').value) || null;
  const remind2  = parseInt(document.getElementById('rf-r2').value) || null;
  const remind3  = parseInt(document.getElementById('rf-r3').value) || null;
  const notifyEmail    = document.getElementById('rf-email').checked;
  const notifyTelegram = document.getElementById('rf-telegram').checked;
  const notes          = document.getElementById('rf-notes').value.trim();
  const assignedUserId = document.getElementById('rf-assignee')?.value || State.user?.id;

  if (!title || !eventDate) { toast('Please fill in title and due date', 'error'); return; }

  const btn = document.querySelector('#reminder-form-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  /* Build recurrence config */
  let recurrenceConfig = null;
  if (_recurrenceType === 'monthly') {
    recurrenceConfig = { months: parseInt(document.getElementById('rec-months')?.value) || 12 };
  } else if (_recurrenceType === 'quarterly') {
    recurrenceConfig = { quarters: parseInt(document.getElementById('rec-quarters')?.value) || 4 };
  } else if (_recurrenceType === 'custom') {
    recurrenceConfig = { dates: _recCustomDates.filter(Boolean) };
  }

  const data = {
    title, category, amount, clientId, eventDate,
    remind1, remind2, remind3, notifyEmail, notifyTelegram, notes,
    recurrence: _recurrenceType || 'none',
    recurrenceConfig,
    paidDates: [],
    assignedUserId,
  };

  if (_editReminderId) {
    await State.updateReminder(_editReminderId, data);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save reminder'; }
    toast('Reminder updated!');
  } else {
    await State.addReminder(data);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save reminder'; }
    const allDates = _getOccurrenceDates({ ...data, eventDate });
    if (allDates.length > 1) toast(`Reminder created with ${allDates.length} occurrences!`);
    else toast('Reminder added!');
  }

  closeReminderModal();
  renderReminders();
}

async function markReminderDone(remId) {
  await State.markReminderPaid(remId); /* reuses existing paidAt field */
  toast('Marked as done! ✓');
  renderReminders();
}

async function markOccurrenceDone(remId, date) {
  await State.markOccurrencePaid(remId, date);
  toast(`${fmtDate(date)} marked as done ✓`);
  renderReminders();
}

async function confirmDeleteReminder(remId) {
  const r = State.reminders.find(x => x.id === remId);
  if (!confirm(`Delete reminder "${r?.title}"? This cannot be undone.`)) return;
  await State.deleteReminder(remId);
  toast('Reminder deleted', 'error');
  renderReminders();
}

/* ═══════════════════════════════════════════════════════════
   TEAM CHAT
   ═══════════════════════════════════════════════════════════ */
function toggleChat() {
  _chatOpen = !_chatOpen;
  document.getElementById('chat-panel')?.classList.toggle('open', _chatOpen);
  const overlay = document.getElementById('chat-overlay');
  if (overlay) overlay.style.display = _chatOpen ? 'block' : 'none';
  if (_chatOpen) {
    renderChatChannels();
    loadChatMessages(_chatChannel);
    _startChatPoll();
  } else {
    _stopChatPoll();
  }
}

function closeChat() {
  _chatOpen = false;
  document.getElementById('chat-panel')?.classList.remove('open');
  const overlay = document.getElementById('chat-overlay');
  if (overlay) overlay.style.display = 'none';
  _stopChatPoll();
}

function _startChatPoll() {
  _stopChatPoll();
  _chatPollTimer = setInterval(async () => {
    await _fetchNewMessages();
    renderChatMessages(_chatChannel);
    updateChatBadge();
  }, 15000);
}

function _stopChatPoll() {
  if (_chatPollTimer) { clearInterval(_chatPollTimer); _chatPollTimer = null; }
}

async function _fetchNewMessages() {
  if (!State.useSheets) return;
  try {
    const rows = await Sheets._get('Messages!A2:E');
    if (!rows || !rows.length) return;
    const existing = new Set(State.messages.map(m => m.id));
    rows.filter(r => r[0] && !existing.has(r[0])).forEach(r => {
      State.messages.push({ id:r[0]||'', fromUserId:r[1]||'', channel:r[2]||'', text:r[3]||'', createdAt:r[4]||'' });
    });
  } catch(e) {}
}

function _getChannelMsgs(channelId) {
  if (channelId === 'team') return State.messages.filter(m => m.channel === 'team');
  const myId = State.user?.id;
  return State.messages.filter(m =>
    (m.fromUserId === myId  && m.channel === channelId) ||
    (m.fromUserId === channelId && m.channel === myId)
  );
}

function _unreadCount(channelId) {
  const msgs      = _getChannelMsgs(channelId);
  const lastId    = _chatLastRead[channelId];
  const myId      = State.user?.id;
  if (!lastId) return msgs.filter(m => m.fromUserId !== myId).length;
  let lastIdx = -1;
  msgs.forEach((m, i) => { if (m.id === lastId) lastIdx = i; });
  return msgs.slice(lastIdx + 1).filter(m => m.fromUserId !== myId).length;
}

function renderChatChannels() {
  const el = document.getElementById('chat-channels-list');
  if (!el) return;
  const others = State.users.filter(u => u.id !== State.user?.id);
  const channels = [
    { id:'team', label:'# Team', icon:'ti-users', avClass:null },
    ...others.map(u => ({ id:u.id, label:u.name, icon:null, avClass:u.avClass, initials:u.initials })),
  ];
  el.innerHTML = channels.map(ch => {
    const unread = _unreadCount(ch.id);
    return `
    <button class="chat-channel-btn ${_chatChannel === ch.id ? 'active' : ''}"
      onclick="switchChatChannel('${ch.id}')">
      ${ch.icon
        ? `<i class="ti ${ch.icon}" style="font-size:13px;flex-shrink:0;opacity:0.7"></i>`
        : `<div class="avatar ${ch.avClass}" style="width:17px;height:17px;font-size:7px;flex-shrink:0">${ch.initials}</div>`}
      <span class="chat-ch-name">${ch.label}</span>
      ${unread ? `<div class="chat-unread-dot"></div>` : ''}
    </button>`;
  }).join('');
}

function switchChatChannel(channelId) {
  _chatChannel = channelId;
  renderChatChannels();
  loadChatMessages(channelId);
}

async function loadChatMessages(channelId) {
  await _fetchNewMessages();
  renderChatMessages(channelId);
  const msgs = _getChannelMsgs(channelId);
  if (msgs.length) _chatLastRead[channelId] = msgs[msgs.length - 1].id;
  updateChatBadge();
  renderChatChannels();
}

function renderChatMessages(channelId) {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  const msgs = _getChannelMsgs(channelId);

  /* Update header */
  const hdr = document.getElementById('chat-channel-header');
  if (hdr) {
    if (channelId === 'team') { hdr.textContent = '# Team channel'; }
    else { const u = State.getUser(channelId); hdr.textContent = u ? `@ ${u.name}` : 'Direct message'; }
  }

  if (!msgs.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px 20px;font-size:12.5px;color:var(--ink-4)">
      No messages yet. Say hello! 👋</div>`;
    return;
  }

  const myId = State.user?.id;
  el.innerHTML = msgs.map((m, i) => {
    const own  = m.fromUserId === myId;
    const from = State.getUser(m.fromUserId);
    /* Date separator — show when date part changes */
    const prevDate = i > 0 ? msgs[i-1].createdAt.slice(0,6) : null;
    const thisDate = m.createdAt.slice(0,6);
    const sep = (thisDate !== prevDate)
      ? `<div class="chat-date-sep">${thisDate}</div>` : '';
    /* Time — last 5 chars of createdAt e.g. "23:14" */
    const time = m.createdAt.length >= 5 ? m.createdAt.slice(-5) : m.createdAt;
    const meta = own
      ? time
      : `${from?.name || '?'} · ${time}`;

    return `${sep}
    <div class="chat-msg ${own ? 'own' : ''}">
      ${!own ? `<div class="chat-msg-avatar ${from?.avClass||'av-admin'}">${from?.initials||'?'}</div>` : ''}
      <div class="chat-msg-wrap">
        <div class="chat-bubble">${esc(m.text)}</div>
        <div class="chat-msg-meta">${meta}</div>
      </div>
    </div>`;
  }).join('');

  el.scrollTop = el.scrollHeight;
}

async function sendChatMessage() {
  const inp  = document.getElementById('chat-input-field');
  const text = inp?.value?.trim();
  if (!text) return;
  inp.value = '';

  const msg = {
    id:          'msg' + Date.now(),
    fromUserId:  State.user?.id || '',
    channel:     _chatChannel,
    text,
    createdAt:   new Date().toLocaleString('en-GB', {
      day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit',
    }),
  };

  State.messages.push(msg);
  _chatLastRead[_chatChannel] = msg.id;
  renderChatMessages(_chatChannel);
  if (State.useSheets) Sheets.sendMessage(msg);
}

function updateChatBadge() {
  const channels = ['team', ...State.users.filter(u => u.id !== State.user?.id).map(u => u.id)];
  const total    = channels.reduce((s, ch) => s + _unreadCount(ch), 0);
  const badge    = document.getElementById('chat-badge');
  if (badge) { badge.textContent = total || ''; badge.style.display = total ? '' : 'none'; }
}
