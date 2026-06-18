/* ============================================================
   OFIZ Tasks — UI Components & Renderers  (Redesign v2)
   ============================================================ */

/* ── Toast ──────────────────────────────────────────────── */
function toast(msg, type = 'success', action) {
  const wrap = document.getElementById('toast-wrap');
  const el   = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="ti ti-${type === 'success' ? 'circle-check' : 'alert-circle'}"></i><span>${msg}</span>${
    action ? `<button class="toast-action-btn" style="margin-left:10px;background:none;border:none;
      color:inherit;font-weight:700;font-size:12px;cursor:pointer;text-decoration:underline;
      font-family:inherit;padding:0">${action.label}</button>` : ''}`;
  if (action) {
    el.querySelector('.toast-action-btn').addEventListener('click', () => {
      action.fn();
      el.classList.add('hiding');
      setTimeout(() => el.remove(), 200);
    });
  }
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('hiding'); setTimeout(() => el.remove(), 200); }, 3200);
}

async function quickClose(taskId) {
  await State.closeTask(taskId, '');
  refreshCurrentPage();
  toast('Task marked as done!', 'success', {
    label: 'Undo',
    fn: async () => { await State.reopenTask(taskId); refreshCurrentPage(); },
  });
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

/* ── Task title label ────────────────────────────────────────
   Generates the suffix appended to the task title on generation.

   titleMonthOffset values:
     0  = empty — no label (default)
    -1  = previous month / previous quarter
     2  = this month / this quarter
     1  = next month (monthly only)
     3  = month + week number (weekly only)
   ──────────────────────────────────────────────────────────── */
function _taskTitleLabel(tp, yearMonth, dueDate) {
  const v = tp.titleMonthOffset ?? 0;
  if (v === 0) return ''; /* empty — nothing appended */

  const [y, m] = yearMonth.split('-').map(Number);
  const MS      = _MONTHS.map(function(n){ return n.slice(0,3); });

  /* ── WEEKLY: Month + Week number ──────────────────────────── */
  if (tp.recurrence === 'weekly' && v === 3) {
    if (!dueDate) return _monthLabel(yearMonth);
    const day     = parseInt((dueDate || '').split('-')[2]) || 1;
    const weekNum = Math.ceil(day / 7);
    return `${_MONTHS[m-1]} W${weekNum} ${y}`;
  }

  /* ── QUARTERLY ─────────────────────────────────────────────── */
  if (tp.recurrence === 'quarterly') {
    const qStart   = tp.quarterStartMonth || 1;
    /* Which quarter index (0–3) does the due month fall in? */
    const qIdx     = Math.floor(((m - qStart + 12) % 12) / 3);
    /* Offset in quarters: -1 = prev, 0 already handled above, 2 = this */
    const qOff     = v === -1 ? -1 : 0; /* only prev or this make sense */
    const targetQIdx = qIdx + qOff;

    /* Start month of the target quarter (1-based) */
    const smRaw  = qStart + targetQIdx * 3;
    const sm     = ((smRaw - 1 + 120) % 12) + 1;
    const em     = ((sm - 1 + 2)       % 12) + 1;

    /* Year: quarters can cross year boundaries */
    const totalM  = (y * 12 + (m - 1)) + qOff * 3;
    const qYear   = Math.floor(totalM / 12);
    const endYear = em < sm ? qYear + 1 : qYear;

    return `${MS[sm-1]}–${MS[em-1]} ${em < sm ? endYear : qYear}`;
  }

  /* ── MONTHLY (and fallback) ─────────────────────────────────── */
  /* -1=prev, 2=this, 1=next */
  const mOff        = v === -1 ? -1 : v === 1 ? 1 : 0;
  const totalMonths = y * 12 + (m - 1) + mOff;
  const newYear     = Math.floor(totalMonths / 12);
  const newMonth    = (totalMonths % 12 + 12) % 12 + 1;
  return `${_MONTHS[newMonth - 1]} ${newYear}`;
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
  const map = { daily:'Daily', weekly:'Weekly', monthly:'Monthly', oneoff:'One-off', quarterly:'Quarterly' };
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

function pipelineTag(pipelineId, stageId) {
  if (!pipelineId) return '';
  const pipeline   = State.getPipeline(pipelineId);
  if (!pipeline) return '';
  const stages     = State.getStages(pipelineId);
  const stage      = stageId ? stages.find(s => s.id === stageId) : null;
  const stageColor = stage?.color || '#6366f1';
  const stageName  = stage?.name  || '';
  const stageIdx   = stage ? stages.findIndex(s => s.id === stageId) + 1 : 0;
  const stageTotal = stages.length;

  /* Full info in tooltip */
  const tooltip = pipeline.name + (stageName ? ' · ' + stageName : '') + (stageIdx ? ' (' + stageIdx + '/' + stageTotal + ')' : '');

  /* Stage dots — filled up to current stage */
  const dots = stageTotal > 0
    ? stages.map(function(s, i) {
        const filled = i < stageIdx;
        return '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;margin:0 1px;'
          + 'background:' + (filled ? stageColor : stageColor + '30') + '"></span>';
      }).join('')
    : '';

  /* Truncate pipeline name to ~12 chars */
  const shortName = pipeline.name.length > 12 ? pipeline.name.slice(0,11) + '…' : pipeline.name;

  return `<span class="tag tag-pipeline" title="${esc(tooltip)}"
    style="border-color:${stageColor}44;background:${stageColor}12;gap:5px">
    <i class="ti ti-layout-kanban" style="font-size:9px;color:${stageColor}"></i>
    <span style="color:${stageColor};font-weight:600;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(shortName)}</span>
    <span style="display:inline-flex;align-items:center;gap:1px">${dots}</span>
    <span style="color:${stageColor};font-family:var(--mono);font-size:9px;opacity:0.8">${stageIdx}/${stageTotal}</span>
  </span>`;
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
           onclick="event.stopPropagation();${done ? canClose ? `reopenTask('${task.id}')` : '' : canClose ? `quickClose('${task.id}')` : ''}"
           title="${done ? canClose ? 'Click to reopen' : 'Completed' : canClose ? 'Mark done' : 'Read only'}">
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
        ${pipelineTag(task.pipelineId, task.pipelineStageId)}
        ${hasSubtasks ? `<span class="tc-st-badge ${stDone===stTotal?'complete':''}">✓ ${stDone}/${stTotal}</span>` : ''}
        ${isBlocked ? `<span class="tc-st-badge" style="background:var(--bg);color:var(--ink-3);border:1px solid var(--border-md)">
          <i class="ti ti-lock" style="font-size:9px"></i> Blocked
        </span>` : ''}
      </div>
      <div class="tc-right">
        ${task.startDate && task.startDate !== task.dueDate ? `
          <span style="font-size:10.5px;color:var(--ink-3)">
            <i class="ti ti-player-play" style="font-size:9px;vertical-align:-1px"></i>
            ${fmtDate(task.startDate)}
          </span>` : ''}
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
/* Load persisted read state from localStorage — survives page reloads */
let _chatLastRead = (function() {
  try { return JSON.parse(localStorage.getItem('ofiz_chat_read') || '{}'); }
  catch(e) { return {}; }
})();

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
  const s     = State.dashStats();
  const today = new Date().toISOString().slice(0,10);

  /* Stat cards */
  document.getElementById('stat-active').textContent    = s.active;
  document.getElementById('stat-today').textContent     = s.dueToday;
  document.getElementById('stat-week').textContent      = s.dueThisWeek;
  document.getElementById('stat-overdue').textContent   = s.overdue;
  const totalDoneEl = document.getElementById('stat-total-done');
  if (totalDoneEl) totalDoneEl.textContent = (s.done ?? 0) + ' / ' + (s.totalCount ?? s.total ?? 0);

  /* All 8 dashboard sections */
  _renderDashGreeting();
  _renderDashTimeline();
  _renderDashClientHealth();
  _renderDashReminders();
  _renderDashExpDocs();
  renderWorkload();
  renderCompletionChart();
  _renderDashActivity();

  /* Priority tasks */
  const priority = State.filterTasks()
    .filter(t => t.status !== 'done')
    .sort((a,b) => {
      const pw = { high:0, medium:1, low:2 };
      if (isOverdue(a) && !isOverdue(b)) return -1;
      if (!isOverdue(a) && isOverdue(b)) return 1;
      return (pw[a.priority]||1) - (pw[b.priority]||1);
    })
    .slice(0, 8);
  _renderDashboardTaskTable(priority);

  /* Sidebar badges */
  const od = State.overdueTasks().length;
  document.querySelectorAll('.badge-overdue').forEach(el => {
    el.textContent = od || '';
    el.style.display = od ? '' : 'none';
  });
  const pipeOD = State.tasks.filter(t => t.pipelineId && t.status !== 'done' && t.dueDate < today).length;
  const pb = document.getElementById('badge-pipelines');
  if (pb) { pb.textContent = pipeOD ? String(pipeOD) : '!'; pb.style.display = pipeOD ? '' : 'none'; }

  const myId    = State.user?.id;
  const isAdmin = State.user?.role === 'admin';
  const urgentRem = State.reminders.filter(r => {
    if (!r.active || r.paidAt) return false;
    if (!isAdmin && r.assignedUserId !== myId) return false;
    return Math.ceil((new Date(r.eventDate) - new Date(today)) / 86400000) <= 7;
  }).length;
  const rb = document.getElementById('badge-reminders');
  if (rb) { rb.textContent = urgentRem||''; rb.style.display = urgentRem ? '' : 'none'; }

  const expDocs = State.expiringDocuments(30).length;
  const db = document.getElementById('badge-documents');
  if (db) { db.textContent = expDocs || ''; db.style.display = expDocs ? '' : 'none'; }
}

/* ── 1. Good morning greeting ───────────────────────────── */
function _renderDashGreeting() {
  const el = document.getElementById('dash-greeting');
  if (!el) return;
  const h    = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name  = State.user?.name?.split(' ')[0] || '';
  const today = new Date().toISOString().slice(0,10);

  const overdueCount = State.overdueTasks().length;
  const todayCount   = State.tasks.filter(t => t.status !== 'done' && t.dueDate === today).length;

  let sub = '';
  if (overdueCount > 0 && todayCount > 0)
    sub = `You have <strong>${todayCount}</strong> task${todayCount!==1?'s':''} due today and <strong style="color:var(--red)">${overdueCount}</strong> overdue.`;
  else if (overdueCount > 0)
    sub = `You have <strong style="color:var(--red)">${overdueCount}</strong> overdue task${overdueCount!==1?'s':''}.`;
  else if (todayCount > 0)
    sub = `You have <strong>${todayCount}</strong> task${todayCount!==1?'s':''} due today.`;
  else
    sub = `All caught up — no tasks due today. 🎉`;

  el.innerHTML = `<div class="dash-greeting-text">${greet}, ${esc(name)}.</div>
    <div class="dash-greeting-sub">${sub}</div>`;
}

/* ── 2. Upcoming 7-day timeline ────────────────────────── */
function _renderDashTimeline() {
  const el = document.getElementById('dash-timeline');
  if (!el) return;
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const days = Array.from({ length: 7 }, function(_, i) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const ds = d.toISOString().slice(0,10);
    const tasks = State.tasks.filter(function(t) {
      return t.status !== 'done' && t.dueDate === ds;
    });
    return {
      date:     ds,
      label:    i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()],
      dateNum:  d.getDate(),
      tasks:    tasks,
      hasOverdue: tasks.some(function(t){ return t.dueDate < todayStr; }),
    };
  });

  el.innerHTML = days.map(function(d) {
    const count   = d.tasks.length;
    const isEmpty = count === 0;
    const isToday = d.label === 'Today';
    return '<div class="dash-day' + (isToday ? ' dash-day-today' : '') + (isEmpty ? ' dash-day-empty' : '') + '"'
      + ' onclick="' + (count > 0 ? 'showPage(\'tasks\',document.querySelector(\'[data-page=tasks]\'));setTimeout(function(){setFilter(\'status\',\'all\',null);},100)' : '') + '">'
      + '<div class="dash-day-label">' + d.label + '</div>'
      + '<div class="dash-day-num">' + d.dateNum + '</div>'
      + '<div class="dash-day-count' + (count > 0 ? ' has-tasks' : '') + '">' + (count > 0 ? count : '·') + '</div>'
      + '</div>';
  }).join('');
}

/* ── 3. Client health summary ───────────────────────────── */
function _renderDashClientHealth() {
  const el = document.getElementById('dash-client-health');
  if (!el) return;
  const scores = State.clients.filter(function(c){ return c.active; }).map(function(c) {
    return { c: c, hs: State.clientHealthScore(c.id) };
  });
  const groups = { D: [], C: [], B: [], A: [] };
  scores.forEach(function(x){ groups[x.hs.score]?.push(x); });

  const rows = [
    { score:'D', label:'Critical',        color:'var(--red)',    bg:'var(--red-light)'    },
    { score:'C', label:'Needs attention', color:'var(--amber)',  bg:'var(--amber-light)'  },
    { score:'B', label:'Good',            color:'var(--blue)',   bg:'var(--blue-light)'   },
    { score:'A', label:'Excellent',       color:'var(--green)',  bg:'var(--green-light)'  },
  ];

  el.innerHTML = rows.map(function(r) {
    const clients = groups[r.score] || [];
    if (!clients.length) return '';
    return '<div class="dash-health-row" onclick="showPage(\'clients\',document.querySelector(\'[data-page=clients]\'))">'
      + '<div class="dash-health-badge" style="background:' + r.bg + ';color:' + r.color + '">' + r.score + '</div>'
      + '<div class="dash-health-label">' + r.label + '</div>'
      + '<div class="dash-health-clients">'
      + clients.slice(0,4).map(function(x){
          return '<span class="tag tag-client" style="color:' + x.c.color + ';background:' + x.c.bg + '">' + x.c.short + '</span>';
        }).join('')
      + (clients.length > 4 ? '<span style="font-size:11px;color:var(--ink-3)">+' + (clients.length-4) + '</span>' : '')
      + '</div>'
      + '<div class="dash-health-count" style="color:' + r.color + '">' + clients.length + '</div>'
      + '</div>';
  }).join('') || '<div class="dash-empty-sm">No client data yet</div>';
}

/* ── 4. Reminders due soon ──────────────────────────────── */
function _renderDashReminders() {
  const el = document.getElementById('dash-reminders');
  if (!el) return;
  const today   = new Date().toISOString().slice(0,10);
  const soon    = new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10);
  const myId    = State.user?.id;
  const isAdmin = State.user?.role === 'admin';

  const rems = State.reminders.filter(function(r) {
    if (!r.active || r.paidAt) return false;
    if (!isAdmin && r.assignedUserId !== myId) return false;
    return r.eventDate >= today && r.eventDate <= soon;
  }).sort(function(a,b){ return a.eventDate.localeCompare(b.eventDate); }).slice(0,5);

  if (!rems.length) {
    el.innerHTML = '<div class="dash-empty-sm"><i class="ti ti-bell-off"></i> No reminders due in 14 days</div>';
    return;
  }

  el.innerHTML = rems.map(function(r) {
    const days    = Math.ceil((new Date(r.eventDate) - new Date(today)) / 86400000);
    const client  = State.getClient(r.clientId);
    const urgent  = days <= 3;
    return '<div class="dash-rem-row" onclick="showPage(\'reminders\',document.querySelector(\'[data-page=reminders]\'))">'
      + '<div class="dash-rem-info">'
      + '<div class="dash-rem-title">' + esc(r.title) + '</div>'
      + (client ? '<div class="dash-rem-client">' + esc(client.name) + '</div>' : '')
      + '</div>'
      + '<div class="dash-rem-days' + (urgent ? ' urgent' : '') + '">'
      + (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days + 'd')
      + '</div>'
      + '</div>';
  }).join('');
}

/* ── 5. Expiring documents ──────────────────────────────── */
function _renderDashExpDocs() {
  const el = document.getElementById('dash-exp-docs');
  if (!el) return;
  const today = new Date().toISOString().slice(0,10);
  const docs  = State.expiringDocuments(60).slice(0,5);

  if (!docs.length) {
    el.innerHTML = '<div class="dash-empty-sm"><i class="ti ti-circle-check"></i> No documents expiring soon</div>';
    return;
  }

  el.innerHTML = docs.map(function(d) {
    const client  = State.getClient(d.clientId);
    const days    = Math.ceil((new Date(d.expiryDate) - new Date(today)) / 86400000);
    const expired = days < 0;
    const urgent  = days >= 0 && days <= 14;
    return '<div class="dash-doc-row" onclick="showPage(\'documents\',document.querySelector(\'[data-page=documents]\'))">'
      + '<div class="dash-doc-info">'
      + '<div class="dash-doc-type">' + esc(d.type) + '</div>'
      + (client ? '<div class="dash-doc-client">' + esc(client.name) + '</div>' : '')
      + '</div>'
      + '<div class="dash-doc-days' + (expired ? ' expired' : urgent ? ' urgent' : '') + '">'
      + (expired ? 'Expired' : days === 0 ? 'Today' : days + 'd')
      + '</div>'
      + '</div>';
  }).join('');
}

/* ── 8. Recent activity feed ────────────────────────────── */
function _renderDashActivity() {
  const el = document.getElementById('dash-activity');
  if (!el) return;
  const log = (State.activityLog || []).slice().reverse().slice(0, 8);

  if (!log.length) {
    el.innerHTML = '<div class="dash-empty-sm">No recent activity</div>';
    return;
  }

  el.innerHTML = '<div class="dash-activity-list">'
    + log.map(function(a) {
        const user   = State.getUser(a.userId);
        const task   = State.getTask(a.taskId);
        return '<div class="dash-activity-row">'
          + '<div class="avatar ' + (user?.avClass||'av-admin') + '" style="width:20px;height:20px;font-size:7px;flex-shrink:0">'
          + (user?.initials||'?') + '</div>'
          + '<div class="dash-act-text">'
          + '<span class="dash-act-name">' + esc(user?.name||'?') + '</span> '
          + esc(a.text||'')
          + (task ? ' <span style="color:var(--ink-3)">· ' + esc(task.title) + '</span>' : '')
          + '</div>'
          + '<div class="dash-act-time">' + (a.createdAt||'').slice(-5) + '</div>'
          + '</div>';
      }).join('')
    + '</div>';
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
        <td class="tt-title">
          ${esc(t.title)}
          ${t.pipelineId ? pipelineTag(t.pipelineId, t.pipelineStageId) : ''}
        </td>
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

  /* Target / average line */
  const totalCompleted = data.reduce((s, d) => s + d.count, 0);
  const withTasks = data.filter(d => d.count > 0).length;
  if (withTasks > 1) {
    const avg    = totalCompleted / withTasks;
    const avgH   = Math.round(avg / maxVal * maxH);
    const avgY   = baseY - avgH;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#81D8D0';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, avgY);
    ctx.lineTo(W - pad, avgY);
    ctx.stroke();
    ctx.restore();
    /* Label */
    ctx.font      = '600 9px "Geist Mono",monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#81D8D0';
    ctx.fillText('avg ' + Math.round(avg), W - pad - 42, avgY - 4);
  }

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
  const pip   = task.pipelineId ? pipelineTag(task.pipelineId, task.pipelineStageId) : '';

  if (!total && !pip) return `<span style="color:var(--ink-4);font-size:12px">—</span>`;

  const done  = subs.filter(s => s.done).length;
  const pct   = total ? Math.round(done / total * 100) : 0;
  const color = pct === 100 ? 'var(--accent)' : pct > 50 ? 'var(--blue)' : 'var(--amber)';

  return `<div style="display:flex;flex-direction:column;gap:4px">
    ${pip}
    ${total ? `<div class="tt-progress-wrap">
      <div class="tt-progress-bar"><div class="tt-progress-fill" style="width:${pct}%;background:${color}"></div></div>
      <span>${done}/${total}</span>
    </div>` : ''}
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
let _clientSort      = sessionStorage.getItem('ofiz_client_sort') || 'manual';

function setClientSort(sort) {
  _clientSort = sort;
  sessionStorage.setItem('ofiz_client_sort', sort);
  /* Update button states */
  ['manual','az','tasks'].forEach(s => {
    const btn = document.getElementById(`csort-${s}`);
    if (!btn) return;
    const on = s === sort;
    btn.style.background  = on ? 'linear-gradient(135deg,#81D8D0,#3db5ad)' : '';
    btn.style.color       = on ? '#1a2e2c' : '';
    btn.style.borderColor = on ? 'transparent' : '';
    btn.style.fontWeight  = on ? '700' : '';
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

  /* Build a colour palette per tag from the clients that use it */
  const TAG_PALETTE = [
    { bg:'#dbeafe', color:'#1d4ed8', border:'#93c5fd' }, /* blue    */
    { bg:'#d1fae5', color:'#065f46', border:'#6ee7b7' }, /* green   */
    { bg:'#fce7f3', color:'#9d174d', border:'#f9a8d4' }, /* pink    */
    { bg:'#ede9fe', color:'#5b21b6', border:'#c4b5fd' }, /* purple  */
    { bg:'#fef3c7', color:'#92400e', border:'#fcd34d' }, /* amber   */
    { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5' }, /* red     */
    { bg:'#ccfbf1', color:'#134e4a', border:'#6ee7b7' }, /* teal    */
    { bg:'#f0fdf4', color:'#166534', border:'#86efac' }, /* lime    */
  ];

  chips.innerHTML = tags.map((t, idx) => {
    const isOn = _activeClientTag === t;
    const pal  = TAG_PALETTE[idx % TAG_PALETTE.length];
    const style = isOn
      ? `background:${pal.bg};color:${pal.color};border-color:${pal.border};font-weight:700`
      : `background:var(--bg-card);color:var(--ink-3);border-color:var(--border)`;
    return `<button class="filter-chip tag-filter-chip" style="${style}"
      onclick="setClientTagFilter('${esc(t)}')">${esc(t)}</button>`;
  }).join('');
}

function renderClients() {
  const el = document.getElementById('client-grid');
  if (!el) return;

  /* Sync sort buttons to persisted sort state */
  ['manual','az','tasks'].forEach(s => {
    const btn = document.getElementById(`csort-${s}`);
    if (!btn) return;
    const on = s === _clientSort;
    btn.style.background  = on ? 'linear-gradient(135deg,#81D8D0,#3db5ad)' : '';
    btn.style.color       = on ? '#1a2e2c' : '';
    btn.style.borderColor = on ? 'transparent' : '';
    btn.style.fontWeight  = on ? '700' : '';
  });

  renderClientTagFilter();

  const archivedCount = State.clients.filter(c => !c.active).length;
  const archBtn = document.getElementById('archived-toggle-btn');
  const archLbl = document.getElementById('archived-toggle-label');

  /* If no archived clients exist but we're in archived view, auto-reset */
  if (archivedCount === 0 && _showArchived) {
    _showArchived = false;
    if (archBtn) {
      archBtn.style.background  = '';
      archBtn.style.color       = '';
      archBtn.style.borderColor = '';
    }
  }

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
  const tlEl = document.getElementById('cf-trade-license');
  const tlExpEl = document.getElementById('cf-tl-expiry');
  if (tlEl) tlEl.value = '';
  if (tlExpEl) tlExpEl.value = '';
  document.getElementById('client-form-modal').classList.add('open');
}

function closeClientForm() {
  editClientSettingsId = null;
  const modal = document.getElementById('client-form-modal');
  if (modal) {
    modal.querySelector('.modal-title').textContent = 'New client';
    modal.querySelector('.btn-primary').innerHTML   = '<i class="ti ti-circle-check"></i> Add client';
  }
  _closeModal('client-form-modal');
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Sync trade licence to Documents table ──────────────────
   Called after any client save that includes tradeLicenseExpiry.
   Finds or creates the "Trade License" doc for the client,
   then sets number + expiryDate from the client card values.   */
async function _syncTradeLicenseDoc(clientId, licenseNo, expiryDate) {
  if (!clientId) return;
  const existing = State.documents.find(
    d => d.clientId === clientId && d.type === 'Trade License'
  );
  if (existing) {
    /* Update the existing document */
    await State.updateDocument(existing.id, {
      number:     licenseNo  || existing.number,
      expiryDate: expiryDate || existing.expiryDate,
    });
  } else if (expiryDate) {
    /* Only create if there is actually an expiry date to store */
    await State.addDocument({
      clientId,
      type:       'Trade License',
      number:     licenseNo || '',
      expiryDate: expiryDate,
      notes:      'Auto-created from client card',
    });
  }
}

async function submitClientForm() {
  const name  = document.getElementById('cf-name').value.trim();
  const short = document.getElementById('cf-short').value.trim().toUpperCase();
  const color = document.getElementById('cf-color').value;
  const tags           = (document.getElementById('cf-tags').value||'').split(',').map(t=>t.trim()).filter(Boolean);
  const tradeLicense   = (document.getElementById('cf-trade-license')?.value || '').trim();
  const tlExpiry       = document.getElementById('cf-tl-expiry')?.value || '';

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
    await State.updateClient(editClientSettingsId, { name, short, color, bg, tags, tradeLicense, tradeLicenseExpiry: tlExpiry });
    await _syncTradeLicenseDoc(editClientSettingsId, tradeLicense, tlExpiry);
    if (saveBtn) { saveBtn.disabled = false; }
    closeClientForm();
    renderSettingsClients();
    populateFormDropdowns();
    renderClients();
    toast('Client updated!');
  } else {
    const newClient = { id:'c' + Date.now(), name, short, color, bg, active:true, tags, tradeLicense, tradeLicenseExpiry: tlExpiry, sortOrder: State.clients.length };
    State.clients.push(newClient);
    if (State.useSheets) {
      await Sheets.addClient(newClient); /* Supabase insert */
    }
    await _syncTradeLicenseDoc(newClient.id, tradeLicense, tlExpiry);
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
let _tplFilter       = 'all';   /* 'all' | 'daily' | 'weekly' | 'monthly' */
let _tplStatusFilter = 'all';   /* 'all' | 'active' | 'paused' */

function setTplFilter(val, el) {
  _tplFilter = val;
  document.querySelectorAll('[data-tpl-filter]').forEach(b => b.classList.toggle('on', b.dataset.tplFilter === val));
  renderTemplates();
}

function setTplStatusFilter(val, el) {
  _tplStatusFilter = val;
  document.querySelectorAll('[data-tpl-status]').forEach(b => b.classList.toggle('on', b.dataset.tplStatus === val));
  renderTemplates();
}

function renderTemplates() {
  /* Set default month on the generate bar */
  const tgMonth = document.getElementById('tg-month');
  if (tgMonth && !tgMonth.value) tgMonth.value = new Date().toISOString().slice(0, 7);

  /* Populate client filter dropdown */
  const clientSel = document.getElementById('tpl-client-filter');
  if (clientSel && clientSel.options.length <= 1) {
    State.clients.filter(c => c.active).sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.name;
      clientSel.appendChild(opt);
    });
  }

  const el = document.getElementById('template-list');
  if (!el) return;

  const clientFilter = clientSel?.value || 'all';
  const isAdmin = State.user?.role === 'admin';

  let templates = State.templates.slice();
  if (clientFilter !== 'all')   templates = templates.filter(t => t.clientId === clientFilter);
  if (_tplFilter  !== 'all')    templates = templates.filter(t => t.recurrence === _tplFilter);
  if (_tplStatusFilter === 'active') templates = templates.filter(t =>  t.active);
  if (_tplStatusFilter === 'paused') templates = templates.filter(t => !t.active);

  const sortVal = document.getElementById('tpl-sort')?.value || 'default';
  const recOrder = { daily: 0, weekly: 1, monthly: 2 };
  if (sortVal === 'client') {
    templates.sort((a,b) => {
      const ca = State.getClient(a.clientId)?.name || '';
      const cb = State.getClient(b.clientId)?.name || '';
      return ca.localeCompare(cb);
    });
  } else if (sortVal === 'title') {
    templates.sort((a,b) => a.title.localeCompare(b.title));
  } else if (sortVal === 'recurrence') {
    templates.sort((a,b) => (recOrder[a.recurrence]??9) - (recOrder[b.recurrence]??9));
  }

  if (!templates.length) {
    el.innerHTML = '<div class="empty-state"><i class="ti ti-repeat"></i><p>No templates match the filters</p></div>';
    return;
  }

  const recLabel = function(tp) {
    if (tp.recurrence === 'daily')     return 'Every day';
    if (tp.recurrence === 'weekly')    return 'Every ' + (tp.dayOfWeek || 'Mon');
    if (tp.recurrence === 'monthly')   return tp.dayOfMonth ? 'Day ' + tp.dayOfMonth + ' monthly' : 'Monthly';
    if (tp.recurrence === 'quarterly') return _quarterLabel(tp.quarterStartMonth) + (tp.dayOfMonth ? ' · Day ' + tp.dayOfMonth : '');
    return tp.recurrence;
  };

  const recIcon = { daily:'ti-sun', weekly:'ti-calendar-week', monthly:'ti-calendar-month', quarterly:'ti-calendar-repeat' };
  const recColor = { daily:'var(--amber)', weekly:'var(--blue)', monthly:'var(--accent)' };

  el.innerHTML =
    '<div class="tpl-table">'
    + '<div class="tpl-header">'
    +   '<div class="tpl-col-name">Template</div>'
    +   '<div class="tpl-col-client">Client</div>'
    +   '<div class="tpl-col-rec">Recurrence</div>'
    +   '<div class="tpl-col-sched">Schedule</div>'
    +   '<div class="tpl-col-assign">Assigned to</div>'
    +   '<div class="tpl-col-status">Status</div>'
    +   '<div class="tpl-col-actions"></div>'
    + '</div>'
    + templates.map(function(tp) {
        const client   = State.getClient(tp.clientId);
        const assignee = State.getUser(tp.assigneeId);
        const icon     = recIcon[tp.recurrence]  || 'ti-repeat';
        const color    = recColor[tp.recurrence] || 'var(--ink-3)';
        return '<div class="tpl-row">'
          +   '<div class="tpl-col-name">'
          +     '<div class="tpl-icon" style="background:' + color + '22;color:' + color + '">'
          +       '<i class="ti ' + icon + '"></i>'
          +     '</div>'
          +     '<span class="tpl-title">' + esc(tp.title) + '</span>'
          +   '</div>'
          +   '<div class="tpl-col-client">'
          +     (client
                ? '<span class="tag tag-client" style="color:' + client.color + ';background:' + client.bg + '">'
                  + esc(client.name) + '</span>'
                : '<span style="color:var(--ink-4)">—</span>')
          +   '</div>'
          +   '<div class="tpl-col-rec">'
          +     '<span class="tag tag-' + tp.recurrence + '">'
          +       tp.recurrence.charAt(0).toUpperCase() + tp.recurrence.slice(1)
          +     '</span>'
          +   '</div>'
          +   '<div class="tpl-col-sched" style="font-size:11.5px;color:var(--ink-3)">' + recLabel(tp) + '</div>'
          +   '<div class="tpl-col-assign">' + assigneeChip(tp.assigneeId) + '</div>'
          +   '<div class="tpl-col-status">'
          +     '<span class="tpl-status-badge ' + (tp.active ? 'tpl-active' : 'tpl-paused') + '">'
          +       (tp.active ? 'Active' : 'Paused')
          +     '</span>'
          +   '</div>'
          +   '<div class="tpl-col-actions">'
          +     (isAdmin
                ? '<button class="btn btn-ghost btn-sm" title="' + (tp.active ? 'Pause template' : 'Activate template') + '"'
                  + ' onclick="toggleTemplateActive(\'' + tp.id + '\')">'
                  + '<i class="ti ' + (tp.active ? 'ti-player-pause' : 'ti-player-play') + '"></i></button>'
                  + '<button class="btn btn-ghost btn-sm" onclick="openEditTemplateModal(\'' + tp.id + '\')">'
                  + '<i class="ti ti-edit"></i></button>'
                  + '<button class="btn btn-danger btn-sm" onclick="confirmDeleteTemplate(\'' + tp.id + '\')">'
                  + '<i class="ti ti-trash"></i></button>'
                : '')
          +   '</div>'
          + '</div>';
      }).join('')
    + '</div>';
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
      ${task.startDate && task.startDate !== task.dueDate ? `
      <div class="detail-meta-item">
        <label>Start date</label>
        <span><i class="ti ti-player-play" style="font-size:11px;color:var(--accent);margin-right:3px"></i>${fmtDate(task.startDate)}</span>
      </div>` : ''}
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
      ${done && canClose ? `
        <button class="btn btn-ghost btn-sm" onclick="reopenTask('${task.id}')">
          <i class="ti ti-rotate-clockwise"></i> Reopen
        </button>` : ''}
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

/* ── Shared modal closer — single source of truth ────────── */
function _closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function closeTaskModal() {
  _closeModal('task-detail-modal');
  activeTaskId = null;
}

async function reopenTask(taskId) {
  await State.reopenTask(taskId);
  closeTaskModal();
  toast('Task moved back to active.');
  refreshCurrentPage();
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
  /* Apply default assignee from settings */
  const defAssignee = getSettings().defaultAssigneeId;
  if (defAssignee) {
    const sel = document.getElementById('tf-assignee');
    if (sel) sel.value = defAssignee;
  }
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
  _closeModal('task-form-modal');
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
  document.getElementById('tmf-hours').value          = '';
  document.getElementById('tmf-start-offset').value   = '';
  document.getElementById('tmf-comments').value       = '';
  const qs = document.getElementById('tmf-quarter-start');
  if (qs) qs.value = '1';
  _updateLabelDropdown('monthly');
  const tmo = document.getElementById('tmf-title-month-offset');
  if (tmo) tmo.value = '0';
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
  document.getElementById('tmf-priority').value      = tp.priority || 'medium';
  document.getElementById('tmf-notes').value         = tp.notes || '';
  document.getElementById('tmf-hours').value         = tp.estimatedHours || '';
  document.getElementById('tmf-start-offset').value  = tp.startOffsetDays || '';
  if (tp.recurrence === 'quarterly') {
    const qs = document.getElementById('tmf-quarter-start');
    if (qs) qs.value = tp.quarterStartMonth || 1;
  }
  _updateLabelDropdown(tp.recurrence);
  const tmo = document.getElementById('tmf-title-month-offset');
  if (tmo) tmo.value = tp.titleMonthOffset ?? 0;
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
  _closeModal('template-form-modal');
  editTemplateId = null;
}

function onTemplateRecurrenceChange(val) {
  const dayGroup  = document.getElementById('tmf-day-group');
  const monthInp  = document.getElementById('tmf-day-month');
  const weekSel   = document.getElementById('tmf-day-week');
  const dayLabel  = document.getElementById('tmf-day-label');
  const qtrGroup  = document.getElementById('tmf-quarter-group');

  /* Reset */
  if (qtrGroup) qtrGroup.style.display = 'none';

  if (val === 'daily') {
    dayGroup.style.display = 'none';
  } else if (val === 'weekly') {
    dayGroup.style.display = '';
    monthInp.style.display = 'none';
    weekSel.style.display  = '';
    dayLabel.textContent   = 'Day of week';
  } else if (val === 'quarterly') {
    dayGroup.style.display = '';
    monthInp.style.display = '';
    weekSel.style.display  = 'none';
    dayLabel.textContent   = 'Due day of month';
    if (qtrGroup) qtrGroup.style.display = '';
  } else {
    /* monthly */
    dayGroup.style.display = '';
    monthInp.style.display = '';
    weekSel.style.display  = 'none';
    dayLabel.textContent   = 'Day of month';
  }

  /* Rebuild label dropdown options based on recurrence */
  _updateLabelDropdown(val);
}

function _updateLabelDropdown(recurrence) {
  const sel  = document.getElementById('tmf-title-month-offset');
  const hint = document.getElementById('tmf-label-hint');
  if (!sel) return;

  const current = sel.value; /* preserve selection if possible */

  const opts = { daily: [
      { v:'0', l:'— No label' },
    ], weekly: [
      { v:'0', l:'— No label' },
      { v:'3', l:'Month + Week number  e.g. "June W2 2026"' },
    ], monthly: [
      { v:'0',  l:'— No label' },
      { v:'-1', l:'Previous month  e.g. "May 2026"' },
      { v:'2',  l:'This month (due month)  e.g. "June 2026"' },
      { v:'1',  l:'Next month  e.g. "July 2026"' },
    ], quarterly: [
      { v:'0',  l:'— No label' },
      { v:'-1', l:'Previous quarter  e.g. "Jan–Mar 2026"' },
      { v:'2',  l:'This quarter  e.g. "Apr–Jun 2026"' },
    ]
  };

  const list = opts[recurrence] || opts.monthly;
  sel.innerHTML = list.map(function(o) {
    return '<option value="' + o.v + '"' + (o.v === current ? ' selected' : '') + '>' + o.l + '</option>';
  }).join('');

  /* Contextual hint */
  const hints = {
    weekly:    'Use <strong>Month + Week</strong> for recurring weekly tasks like invoice follow-ups',
    monthly:   'Use <strong>Previous month</strong> for closing/reconciliation tasks opened in the following month',
    quarterly: 'Use <strong>Previous quarter</strong> for VAT filing tasks — Jan–Mar VAT is filed in April',
    daily:     '',
  };
  if (hint) hint.innerHTML = hints[recurrence] || '';
}

async function submitTemplateForm() {
  const title      = document.getElementById('tmf-title').value.trim();
  const clientId   = document.getElementById('tmf-client').value;
  const assigneeId = document.getElementById('tmf-assignee').value;
  const recurrence = document.getElementById('tmf-recurrence').value;
  const dayOfMonth       = (recurrence === 'monthly' || recurrence === 'quarterly')
    ? (Number(document.getElementById('tmf-day-month').value) || null) : null;
  const dayOfWeek        = recurrence === 'weekly'    ? document.getElementById('tmf-day-week').value : null;
  const quarterStartMonth= recurrence === 'quarterly' ? (parseInt(document.getElementById('tmf-quarter-start')?.value) || 1) : null;

  if (!title || !clientId || !assigneeId) {
    toast('Please fill in title, client and assignee', 'error'); return;
  }

  const priority         = document.getElementById('tmf-priority')?.value || 'medium';
  const notes            = document.getElementById('tmf-notes')?.value.trim() || '';
  const estimatedHours   = parseFloat(document.getElementById('tmf-hours')?.value) || 0;
  const startOffsetDays  = parseInt(document.getElementById('tmf-start-offset')?.value) || 0;
  const titleMonthOffset = parseInt(document.getElementById('tmf-title-month-offset')?.value) || 0;
  const pipelineId      = document.getElementById('tmf-pipeline')?.value || '';
  const pipelineStageId = document.getElementById('tmf-stage')?.value || '';
  const commentsRaw     = document.getElementById('tmf-comments')?.value.trim() || '';
  const defaultComments = commentsRaw ? commentsRaw.split('\n').map(s=>s.trim()).filter(Boolean) : [];
  const subtasks        = _tmfSubtasks.map((text,i) => ({ id:'st'+Date.now()+i, text, done:false }));

  const templateData = { title, clientId, assigneeId, recurrence, dayOfMonth, dayOfWeek,
    quarterStartMonth, titleMonthOffset, priority, notes, subtasks, pipelineId, pipelineStageId,
    estimatedHours, startOffsetDays, defaultComments, templateDependencies:[] };

  const btn = document.querySelector('#template-form-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  try {
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
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save template'; }
    toast('Failed to save template: ' + e.message, 'error');
  }
}

async function toggleTemplateActive(templateId) {
  const tp = State.templates.find(t => t.id === templateId);
  if (!tp) return;
  await State.updateTemplate(templateId, { active: !tp.active });
  toast(tp.active ? 'Template paused' : 'Template activated');
  renderTemplates();
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

  const CAPACITY  = 20; /* assumed max tasks per person */
  const maxTasks  = Math.max(...data.map(u => u.total), 1);
  el.innerHTML = `
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px">
    ${data.map((u, idx) => {
      const pct      = Math.round(u.total   / maxTasks * 100);
      const odPct    = Math.round(u.overdue / maxTasks * 100);
      const utilPct  = Math.min(Math.round(u.total / CAPACITY * 100), 100);
      const utilCol  = utilPct >= 90 ? 'var(--red)' : utilPct >= 70 ? 'var(--amber)' : 'var(--green)';
      return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:${idx < data.length-1 ? '12' : '0'}px">
        <div class="avatar ${u.avClass}" style="width:26px;height:26px;font-size:9px;flex-shrink:0">${u.initials}</div>
        <div style="font-size:var(--text-sm);color:var(--ink-2);width:72px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}</div>
        <div style="flex:1;background:var(--bg);border-radius:4px;height:8px;overflow:hidden;position:relative">
          <div style="height:100%;width:${pct}%;background:${u.overdue?'var(--amber)':'var(--accent)'};border-radius:4px;transition:width 600ms var(--ease)"></div>
          ${u.overdue ? `<div style="position:absolute;top:0;left:0;height:100%;width:${odPct}%;background:var(--red);border-radius:4px"></div>` : ''}
        </div>
        <div style="font-size:var(--text-sm);font-family:var(--mono);color:var(--ink-3);text-align:right;flex-shrink:0;min-width:32px">${u.total}</div>
        <div style="font-size:10px;font-weight:700;color:${utilCol};min-width:34px;text-align:right;flex-shrink:0">${utilPct}%</div>
      </div>`;
    }).join('')}
    <div style="font-size:10px;color:var(--ink-4);margin-top:10px;text-align:right">% = utilisation of ${CAPACITY} task capacity</div>
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

  const dueDate0   = `${month}-01`;
  const dueDate1   = _lastDayOfMonth(month);
  const created    = [];
  const skipped    = [];

  for (const tp of active) {
    const dueDate  = _templateDueDate(tp, month);
    if (!dueDate) continue;
    const lbl      = _taskTitleLabel(tp, month, dueDate);
    const titleKey = lbl ? `${tp.title} — ${lbl}` : tp.title;
    /* Duplicate check: match title + client OR same template+client with a due date in this month */
    const exists = State.tasks.some(t =>
      t.clientId === tp.clientId &&
      (t.title === titleKey ||
       (t.dueDate >= dueDate0 && t.dueDate <= dueDate1 &&
        t.title.startsWith(tp.title))));
    if (exists) { skipped.push(tp.title); continue; }
    /* Calculate startDate from offset */
    let startDate = '';
    if (dueDate && tp.startOffsetDays > 0) {
      const d = new Date(dueDate);
      d.setDate(d.getDate() - tp.startOffsetDays);
      startDate = d.toISOString().slice(0,10);
    }

    const task = await State.addTask({
      title:           titleKey,
      clientId:        tp.clientId,
      assigneeId:      tp.assigneeId,
      type:            tp.recurrence,
      priority:        tp.priority || 'medium',
      dueDate,
      startDate,
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

/* Returns true if yearMonth is a due quarter month for this template */
function _isQuarterlyDueMonth(tp, yearMonth) {
  const m = parseInt(yearMonth.split('-')[1]); /* 1-12 */
  const s = tp.quarterStartMonth || 1;          /* 1, 2, or 3 */
  return (m - s) % 3 === 0;
}

/* Returns the quarterly months as a readable label e.g. "Jan · Apr · Jul · Oct" */
function _quarterLabel(startMonth) {
  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const s = (startMonth || 1) - 1; /* 0-indexed */
  return [s, s+3, s+6, s+9].map(i => MONTH_SHORT[i % 12]).join(' · ');
}

function _templateDueDate(tp, yearMonth, overrideDate) {
  /* overrideDate: use this exact date instead of calculating (for daily/weekly auto-gen) */
  if (overrideDate) return overrideDate;

  const [y, m] = yearMonth.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();

  if (tp.recurrence === 'monthly') {
    const day = Math.min(tp.dayOfMonth || lastDay, lastDay);
    return `${yearMonth}-${String(day).padStart(2, '0')}`;
  }
  if (tp.recurrence === 'quarterly') {
    /* Only generate if this month is a due quarter month */
    if (!_isQuarterlyDueMonth(tp, yearMonth)) return null;
    const day = Math.min(tp.dayOfMonth || lastDay, lastDay);
    return `${yearMonth}-${String(day).padStart(2, '0')}`;
  }
  if (tp.recurrence === 'weekly') {
    return _firstWeekdayInMonth(yearMonth, tp.dayOfWeek || 'Mon');
  }
  if (tp.recurrence === 'daily') {
    return `${yearMonth}-01`; /* manual generate: first day of month */
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

/* ══════════════════════════════════════════════════════════
   AUTO-GENERATION ENGINE
   Runs silently on login. Each type tracked separately.
   ══════════════════════════════════════════════════════════ */

async function _runAutoGeneration() {
  const s     = getSettings();
  const today = new Date().toISOString().slice(0,10);
  const now   = new Date();
  const month = today.slice(0,7);

  /* Get this week's Monday date */
  const dow  = now.getDay(); /* 0=Sun, 1=Mon … */
  const diff = dow === 0 ? -6 : 1 - dow; /* days back to Monday */
  const mon  = new Date(now); mon.setDate(now.getDate() + diff);
  const thisMonday = mon.toISOString().slice(0,10);

  const results = [];

  /* ── DAILY ─────────────────────────────────────────────── */
  if (s.autoGenDaily !== false) {
    const lastDaily = localStorage.getItem('ofiz_ag_daily');
    if (lastDaily !== today) {
      const count = await _autoGenByType('daily', today, today);
      localStorage.setItem('ofiz_ag_daily', today);
      if (count > 0) results.push(`${count} daily task${count!==1?'s':''}`);
    }
  }

  /* ── WEEKLY — only on Mondays ──────────────────────────── */
  if (s.autoGenWeekly !== false && now.getDay() === 1) {
    const lastWeekly = localStorage.getItem('ofiz_ag_weekly');
    if (lastWeekly !== thisMonday) {
      const count = await _autoGenByType('weekly', month, thisMonday);
      localStorage.setItem('ofiz_ag_weekly', thisMonday);
      if (count > 0) results.push(`${count} weekly task${count!==1?'s':''}`);
    }
  }

  /* ── MONTHLY — only on the 1st ─────────────────────────── */
  if (s.autoGenMonthly !== false && now.getDate() === 1) {
    const lastMonthly = localStorage.getItem('ofiz_ag_monthly');
    if (lastMonthly !== month) {
      const count = await _autoGenByType('monthly', month, null);
      localStorage.setItem('ofiz_ag_monthly', month);
      if (count > 0) results.push(`${count} monthly task${count!==1?'s':''}`);
    }
  }

  /* ── QUARTERLY — on the 1st, only for due quarter months ── */
  if (now.getDate() === 1) {
    const lastQuarterly = localStorage.getItem('ofiz_ag_quarterly');
    if (lastQuarterly !== month) {
      const count = await _autoGenByType('quarterly', month, null);
      localStorage.setItem('ofiz_ag_quarterly', month);
      if (count > 0) results.push(`${count} quarterly task${count!==1?'s':''}`);
    }
  }

  /* Show toast if anything was generated */
  if (results.length) {
    toast(`Auto-generated: ${results.join(', ')} ✓`);
    refreshCurrentPage();
  }
}

async function _autoGenByType(recurrence, yearMonth, overrideDate) {
  const today    = new Date().toISOString().slice(0,10);
  const dueDate0 = `${yearMonth}-01`;
  const dueDate1 = _lastDayOfMonth(yearMonth);
  /* monthLbl defined per-template below using _taskTitleLabel */
  let   created  = 0;

  const templates = State.templates.filter(tp => tp.active && tp.recurrence === recurrence);

  for (const tp of templates) {
    const dueDate = _templateDueDate(tp, yearMonth, overrideDate);
    if (!dueDate) continue;

    /* Duplicate check */
    const lbl2     = _taskTitleLabel(tp, yearMonth, dueDate);
    const titleKey = lbl2 ? `${tp.title} — ${lbl2}` : tp.title;
    const exists   = State.tasks.some(t =>
      t.clientId === tp.clientId &&
      (t.title === titleKey ||
       (t.dueDate >= dueDate0 && t.dueDate <= dueDate1 && t.title.startsWith(tp.title)))
    );
    if (exists) continue;

    /* Calculate start date */
    let startDate = '';
    if (tp.startOffsetDays > 0) {
      const d = new Date(dueDate);
      d.setDate(d.getDate() - tp.startOffsetDays);
      startDate = d.toISOString().slice(0,10);
    }

    await State.addTask({
      title:           titleKey,
      clientId:        tp.clientId,
      assigneeId:      tp.assigneeId,
      type:            tp.recurrence,
      priority:        tp.priority || 'medium',
      dueDate,
      startDate,
      notes:           tp.notes || '',
      status:          'pending',
      subtasks:        (tp.subtasks||[]).map(s => ({...s, id:'st'+Date.now()+Math.random(), done:false})),
      pipelineId:      tp.pipelineId || null,
      pipelineStageId: tp.pipelineStageId || null,
    });
    created++;
  }
  return created;
}

/* ── Search ─────────────────────────────────────────────── */
let _searchTimer = null;
function handleSearch(val) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function() {
    taskFilter.search = val;
    renderAllTasks();
  }, 220);
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

/* Preset palette for pipeline tab colours — cycles if more pipelines than colours */
const _PIP_PALETTE = [
  { bg:'#dbeafe', text:'#1e40af', active:'#1d4ed8', shadow:'rgba(29,78,216,0.35)' },  /* blue    */
  { bg:'#d1fae5', text:'#065f46', active:'#059669', shadow:'rgba(5,150,105,0.35)'  },  /* green   */
  { bg:'#fce7f3', text:'#9d174d', active:'#db2777', shadow:'rgba(219,39,119,0.35)' },  /* pink    */
  { bg:'#ede9fe', text:'#4c1d95', active:'#7c3aed', shadow:'rgba(124,58,237,0.35)' },  /* purple  */
  { bg:'#fef3c7', text:'#92400e', active:'#d97706', shadow:'rgba(217,119,6,0.35)'  },  /* amber   */
  { bg:'#fee2e2', text:'#991b1b', active:'#dc2626', shadow:'rgba(220,38,38,0.35)'  },  /* red     */
  { bg:'#ccfbf1', text:'#134e4a', active:'#0d9488', shadow:'rgba(13,148,136,0.35)' },  /* teal    */
  { bg:'#f0fdf4', text:'#166534', active:'#16a34a', shadow:'rgba(22,163,74,0.35)'  },  /* lime    */
];

function renderPipelineTabs() {
  const el = document.getElementById('pipeline-tabs');
  if (!el) return;
  const today   = new Date().toISOString().slice(0,10);
  const isAdmin = State.user?.role === 'admin';

  el.innerHTML = State.pipelines.map((p, idx) => {
    const pal      = _PIP_PALETTE[idx % _PIP_PALETTE.length];
    const cards    = State.tasks.filter(t => t.pipelineId === p.id && t.status !== 'done');
    const hasOD    = cards.some(t => t.dueDate < today);
    const cnt      = cards.length;
    const isActive = p.id === State.activePipelineId;

    const bg      = isActive ? pal.active : pal.bg;
    const color   = isActive ? '#fff'     : pal.text;
    const shadow  = isActive ? `0 3px 12px ${pal.shadow}` : 'none';
    const border  = isActive ? `2px solid transparent` : `2px solid ${pal.bg}`;

    const cntBadge = cnt > 0
      ? `<span style="font-size:10px;font-family:var(--mono);font-weight:700;
           padding:1px 7px;border-radius:20px;
           background:${isActive ? 'rgba(255,255,255,0.25)' : hasOD ? '#fee2e2' : 'rgba(0,0,0,0.07)'};
           color:${isActive ? '#fff' : hasOD ? '#ef4444' : pal.text}">${cnt}</span>`
      : '';

    const actions = isAdmin
      ? `<span class="pip-tab-actions">
           <span class="pip-tab-btn" onclick="event.stopPropagation();openEditPipelineModal('${p.id}')" title="Edit">
             <i class="ti ti-pencil" style="font-size:11px"></i>
           </span>
           <span class="pip-tab-btn pip-tab-del" onclick="event.stopPropagation();confirmDeletePipeline('${p.id}')" title="Delete">
             <i class="ti ti-trash" style="font-size:11px"></i>
           </span>
         </span>` : '';

    return `<div class="pipeline-tab ${isActive ? 'active' : ''}"
         draggable="${isAdmin}"
         onclick="switchPipeline('${p.id}')"
         ondragstart="pipTabDragStart(event,'${p.id}')"
         ondragend="pipTabDragEnd(event)"
         ondragover="pipTabDragOver(event)"
         ondrop="pipTabDrop(event,'${p.id}')"
         style="background:${bg};color:${color};border:${border};box-shadow:${shadow}">
      <span class="pip-tab-name">${p.name}</span>
      ${cntBadge}
      ${actions}
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
    btn.style.background  = _kbBulkMode ? 'linear-gradient(135deg,#81D8D0,#3db5ad)' : '';
    btn.style.color       = _kbBulkMode ? '#1a2e2c' : '';
    btn.style.borderColor = _kbBulkMode ? 'transparent' : '';
    btn.style.fontWeight  = _kbBulkMode ? '700' : '';
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
  _closeModal('pipeline-form-modal');
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
/* ══════════════════════════════════════════════════════════
   APP SETTINGS — stored in localStorage
   ══════════════════════════════════════════════════════════ */
const _SETTINGS_KEY = 'ofiz_app_settings';

function getSettings() {
  try { return Object.assign({
    theme:              'light',
    expiryWarningDays:  30,
    defaultAssigneeId:  '',
    fyStartMonth:       1,
    workingDays:        [1,2,3,4,5],
    autoGenDaily:       true,
    autoGenWeekly:      true,
    autoGenMonthly:     true,
    companyName:        'OFIZ Accounting',
    vatNo:              '',
    address:            '',
  }, JSON.parse(localStorage.getItem(_SETTINGS_KEY) || '{}')); }
  catch(e) { return {}; }
}

function saveSetting(key, value) {
  const s = getSettings();
  s[key] = value;
  localStorage.setItem(_SETTINGS_KEY, JSON.stringify(s));
}

function saveAllSettings() {
  const s = getSettings();
  /* Company profile */
  s.companyName = document.getElementById('st-company-name')?.value.trim() || '';
  s.vatNo       = document.getElementById('st-vat-no')?.value.trim() || '';
  s.address     = document.getElementById('st-address')?.value.trim() || '';
  /* Workflow */
  s.defaultAssigneeId = document.getElementById('st-def-assignee')?.value || '';
  s.expiryWarningDays = parseInt(document.getElementById('st-expiry-days')?.value) || 30;
  s.fyStartMonth      = parseInt(document.getElementById('st-fy-month')?.value) || 1;
  s.autoGenDaily      = document.getElementById('st-auto-daily')?.checked ?? true;
  s.autoGenWeekly     = document.getElementById('st-auto-weekly')?.checked ?? true;
  s.autoGenMonthly    = document.getElementById('st-auto-monthly')?.checked ?? true;
  const wdChecks = document.querySelectorAll('.st-wd-check');
  s.workingDays = [];
  wdChecks.forEach(cb => { if (cb.checked) s.workingDays.push(parseInt(cb.value)); });
  localStorage.setItem(_SETTINGS_KEY, JSON.stringify(s));
  _applySettings();
  toast('Settings saved!');
}

function _applySettings() {
  const s = getSettings();
  /* Theme */
  if (s.theme === 'dark') {
    document.body.classList.add('dark');
  } else if (s.theme === 'light') {
    document.body.classList.remove('dark');
  } else {
    /* auto — follow system */
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark', prefersDark);
  }
  /* Dark button icon in topbar */
  const btn = document.getElementById('dark-btn');
  if (btn) btn.innerHTML = document.body.classList.contains('dark')
    ? '<i class="ti ti-sun"></i>' : '<i class="ti ti-moon"></i>';
}

function setTheme(theme) {
  saveSetting('theme', theme);
  _applySettings();
  /* Update active state on theme buttons */
  document.querySelectorAll('.st-theme-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.theme === theme);
  });
}

/* Export tasks to CSV */
function exportTasksCSV() {
  const today = new Date().toISOString().slice(0,10);
  const headers = ['Title','Client','Assignee','Type','Status','Priority','Due Date','Start Date','Created'];
  const rows = State.tasks.map(t => [
    '"' + (t.title||'').replace(/"/g,'""') + '"',
    '"' + (State.getClient(t.clientId)?.name||'') + '"',
    '"' + (State.getUser(t.assigneeId)?.name||'') + '"',
    t.type, t.status, t.priority, t.dueDate||'', t.startDate||'', t.createdAt||''
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  _downloadCSV(csv, 'ofiz-tasks-' + today + '.csv');
}

function exportClientsCSV() {
  const today = new Date().toISOString().slice(0,10);
  const headers = ['Name','Short','Classification','TRN','Trade License','TL Expiry','VAT Registered','Contact','Email','Phone'];
  const rows = State.clients.map(c => [
    '"' + (c.name||'').replace(/"/g,'""') + '"',
    c.short||'', c.classification||'', c.trn||'', c.tradeLicense||'', c.tradeLicenseExpiry||'',
    c.vatRegistered ? 'Yes' : 'No',
    '"' + (c.contactName||'') + '"', c.contactEmail||'', c.contactPhone||''
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  _downloadCSV(csv, 'ofiz-clients-' + today + '.csv');
}

function _downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function renderSettings() {
  renderSettingsDemoBanner();
  renderSettingsPreferences();
  renderSettingsUsers();
}

function renderSettingsPreferences() {
  const s   = getSettings();
  const el  = document.getElementById('settings-preferences');
  if (!el) return;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = [
    { v:1, l:'Mon' }, { v:2, l:'Tue' }, { v:3, l:'Wed' },
    { v:4, l:'Thu' }, { v:5, l:'Fri' }, { v:6, l:'Sat' }, { v:0, l:'Sun' },
  ];

  el.innerHTML = `
  <!-- Company profile -->
  <div class="settings-section" style="margin-bottom:32px">
    <div class="section-head" style="margin-bottom:16px">
      <span class="section-title">Company profile</span>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Company name</label>
        <input id="st-company-name" class="form-input" value="${esc(s.companyName||'')}" placeholder="OFIZ Accounting">
      </div>
      <div class="form-group">
        <label class="form-label">VAT registration no.</label>
        <input id="st-vat-no" class="form-input" value="${esc(s.vatNo||'')}" placeholder="100XXXXXXXXX" style="font-family:var(--mono)">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Office address</label>
      <textarea id="st-address" class="form-textarea" rows="2" placeholder="Office 101, Business Bay, Dubai, UAE">${esc(s.address||'')}</textarea>
    </div>
  </div>

  <!-- Theme -->
  <div class="settings-section" style="margin-bottom:32px">
    <div class="section-head" style="margin-bottom:16px">
      <span class="section-title">Appearance</span>
    </div>
    <div class="form-group">
      <label class="form-label">Theme</label>
      <div style="display:flex;gap:8px;margin-top:6px">
        ${['light','dark','auto'].map(t => `
          <button class="filter-chip st-theme-btn${s.theme===t?' on':''}" data-theme="${t}"
            onclick="setTheme('${t}')">
            <i class="ti ti-${t==='light'?'sun':t==='dark'?'moon':'device-laptop'}" style="font-size:12px"></i>
            ${t.charAt(0).toUpperCase()+t.slice(1)}
          </button>`).join('')}
      </div>
    </div>
  </div>

  <!-- Workflow defaults -->
  <div class="settings-section" style="margin-bottom:32px">
    <div class="section-head" style="margin-bottom:16px">
      <span class="section-title">Workflow defaults</span>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Default task assignee</label>
        <select id="st-def-assignee" class="form-select">
          <option value="">No default</option>
          ${State.users.map(u => `<option value="${u.id}" ${s.defaultAssigneeId===u.id?'selected':''}>${u.name}</option>`).join('')}
        </select>
        <div style="font-size:11px;color:var(--ink-3);margin-top:4px">Pre-selected when creating a new task</div>
      </div>
      <div class="form-group">
        <label class="form-label">Document expiry warning</label>
        <div style="display:flex;align-items:center;gap:8px">
          <input id="st-expiry-days" type="number" class="form-input" min="7" max="180"
            value="${s.expiryWarningDays||30}" style="width:80px">
          <span style="font-size:13px;color:var(--ink-2)">days before expiry</span>
        </div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:4px">Affects sidebar badge, health score, expiry alerts</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Financial year start</label>
        <select id="st-fy-month" class="form-select">
          ${MONTHS.map((m,i) => `<option value="${i+1}" ${s.fyStartMonth===(i+1)?'selected':''}>${m}</option>`).join('')}
        </select>
        <div style="font-size:11px;color:var(--ink-3);margin-top:4px">Used for CT and VAT period calculations</div>
      </div>
      <div class="form-group">
        <label class="form-label">Working days</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
          ${DAYS.map(d => `
            <label style="display:flex;align-items:center;gap:5px;font-size:12.5px;cursor:pointer">
              <input type="checkbox" class="st-wd-check" value="${d.v}"
                ${(s.workingDays||[1,2,3,4,5]).includes(d.v)?'checked':''}>
              ${d.l}
            </label>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:6px">Affects overdue calculations</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" style="margin-bottom:10px">Auto-generation schedule</label>
      <div style="display:flex;flex-direction:column;gap:10px">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
          <input type="checkbox" id="st-auto-daily" ${s.autoGenDaily!==false?'checked':''}
            style="width:16px;height:16px;flex-shrink:0">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--ink)">
              <i class="ti ti-sun" style="color:var(--amber);margin-right:4px"></i> Daily tasks
            </div>
            <div style="font-size:11.5px;color:var(--ink-3)">Generate daily templates every morning — creates task due today on first login</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
          <input type="checkbox" id="st-auto-weekly" ${s.autoGenWeekly!==false?'checked':''}
            style="width:16px;height:16px;flex-shrink:0">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--ink)">
              <i class="ti ti-calendar-week" style="color:var(--blue);margin-right:4px"></i> Weekly tasks
            </div>
            <div style="font-size:11.5px;color:var(--ink-3)">Generate weekly templates every Monday morning — creates task due that day</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
          <input type="checkbox" id="st-auto-monthly" ${s.autoGenMonthly!==false?'checked':''}
            style="width:16px;height:16px;flex-shrink:0">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--ink)">
              <i class="ti ti-calendar-month" style="color:var(--accent);margin-right:4px"></i> Monthly tasks
            </div>
            <div style="font-size:11.5px;color:var(--ink-3)">Generate monthly templates on the 1st of each month — creates tasks for the full month</div>
          </div>
        </label>
      </div>
      <div style="font-size:11px;color:var(--ink-3);margin-top:8px;padding-left:2px">
        <i class="ti ti-info-circle" style="font-size:12px;vertical-align:-1px"></i>
        Runs silently on first login of the day. When deployed, Supabase cron runs at exactly 7:00 AM.
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-primary" onclick="saveAllSettings()">
        <i class="ti ti-circle-check"></i> Save settings
      </button>
    </div>
  </div>

  <!-- Export -->
  <div class="settings-section" style="margin-bottom:32px">
    <div class="section-head" style="margin-bottom:16px">
      <span class="section-title">Export data</span>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-ghost" onclick="exportTasksCSV()">
        <i class="ti ti-table-export"></i> Export all tasks (CSV)
      </button>
      <button class="btn btn-ghost" onclick="exportClientsCSV()">
        <i class="ti ti-building-export"></i> Export clients (CSV)
      </button>
    </div>
  </div>`;
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
  _closeModal('user-form-modal');
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
          ${canEdit
            ? `<input class="subtask-text-input ${s.done ? 'done' : ''}" value="${esc(s.text)}"
                onchange="editSubtaskText('${task.id}','${s.id}',this.value)"
                onkeydown="if(event.key==='Enter')this.blur()">`
            : `<span class="subtask-text ${s.done ? 'done' : ''}">${esc(s.text)}</span>`}
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

async function editSubtaskText(taskId, stId, newText) {
  const text = (newText || '').trim();
  if (!text) return;
  const task = State.getTask(taskId);
  if (!task) return;
  const st = (task.subtasks || []).find(s => s.id === stId);
  if (st) {
    st.text = text;
    await State.updateTask(taskId, { subtasks: task.subtasks });
  }
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

let _docFilter = 'all';

function setDocFilter(val, btn) {
  _docFilter = val;
  document.querySelectorAll('[data-doc-filter]').forEach(b => b.classList.toggle('on', b.dataset.docFilter === val));
  renderDocuments();
}

function renderDocuments() {
  const el    = document.getElementById('document-list');
  if (!el) return;
  const today = new Date().toISOString().slice(0,10);
  const soon  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0,10);

  /* Expiry alert badge in sidebar */
  const expiring = State.expiringDocuments(30).length;
  const db = document.getElementById('badge-documents');
  if (db) { db.textContent = expiring || ''; db.style.display = expiring ? '' : 'none'; }

  /* Dashboard alert — split expired vs expiring */
  const alertEl = document.getElementById('doc-expiry-alert');
  if (alertEl) {
    const allDocs    = State.expiringDocuments(30);
    const expired    = allDocs.filter(d => d.expiryDate < today);
    const expiringSoon = allDocs.filter(d => d.expiryDate >= today);

    const _docRow = (docs, color, bg, border, icon, label) => {
      if (!docs.length) return '';
      return `<div style="background:${bg};border:1px solid ${border};
        border-radius:var(--radius);padding:11px 16px;display:flex;align-items:center;gap:12px">
        <i class="ti ${icon}" style="font-size:17px;color:${color};flex-shrink:0"></i>
        <div>
          <div style="font-size:13px;font-weight:600;color:${color}">
            ${docs.length} document${docs.length!==1?'s':''} ${label}
          </div>
          <div style="font-size:11.5px;color:var(--ink-2);margin-top:2px">
            ${docs.slice(0,3).map(d => {
              const c = State.getClient(d.clientId);
              return `${c?.short||'?'} · ${d.type}`;
            }).join(' &nbsp;·&nbsp; ')}
            ${docs.length > 3 ? ` and ${docs.length-3} more` : ''}
          </div>
        </div>
      </div>`;
    };

    const rows = [
      _docRow(expired,     'var(--red)',   'var(--red-light)',   'rgba(192,57,43,0.25)',   'ti-alert-circle',   'already expired'),
      _docRow(expiringSoon,'var(--amber)', 'var(--amber-light)', 'rgba(183,105,26,0.25)', 'ti-alert-triangle', 'expiring within 30 days'),
    ].filter(Boolean).join('');

    if (rows) {
      alertEl.style.display = '';
      alertEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:4px">${rows}</div>`;
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

  /* Apply filter then group by client */
  const filtered = State.documents.filter(d => {
    if (_docFilter === 'all')      return true;
    if (_docFilter === 'expired')  return d.expiryDate && d.expiryDate < today;
    if (_docFilter === 'expiring') return d.expiryDate && d.expiryDate >= today && d.expiryDate <= soon;
    if (_docFilter === 'valid')    return !d.expiryDate || d.expiryDate > soon;
    return true;
  });

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state">
      <i class="ti ti-file-certificate"></i>
      <p>No ${_docFilter === 'all' ? '' : _docFilter + ' '}documents found.</p>
    </div>`;
    return;
  }

  /* Sort: expired first, then by expiry date ascending, then no-expiry last */
  const sortedFiltered = filtered.slice().sort((a, b) => {
    const aExp = a.expiryDate || '9999-12-31';
    const bExp = b.expiryDate || '9999-12-31';
    return aExp.localeCompare(bExp);
  });

  const groups = {};
  sortedFiltered.forEach(d => {
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
  _closeModal('document-form-modal');
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

/* Monthly Close removed — use Recurring Templates instead */

function _lastDayOfMonth(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m, 0).toISOString().slice(0, 10);
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
  if (tab === 'overview')          _renderCPOverview(clientId);
  else if (tab === 'notes')        _renderCPNotes(clientId);
  else if (tab === 'tasks')        _renderCPTasks(clientId);
  else if (tab === 'shareholders') _renderCPShareholders(clientId);
  else if (tab === 'documents')    _renderCPDocuments(clientId);
  else if (tab === 'time')         _renderCPTime(clientId);
}

function closeClientProfile() {
  _closeModal('client-profile-modal');
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
        ${(function() {
          if (!c.tradeLicenseExpiry) return _cpField('TL Expiry', '');
          const today30 = new Date(); today30.setDate(today30.getDate() + 30);
          const expDate = new Date(c.tradeLicenseExpiry);
          const isExp   = expDate < new Date();
          const isSoon  = !isExp && expDate <= today30;
          const badge   = isExp  ? ' <span style="color:var(--red);font-size:10px;font-weight:700">EXPIRED</span>'
                        : isSoon ? ' <span style="color:var(--amber);font-size:10px;font-weight:700">EXPIRING SOON</span>'
                        : '';
          return _cpField('TL Expiry', fmtDate(c.tradeLicenseExpiry) + badge);
        })()}
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
      <div class="form-group"><label class="form-label">Trade License No.</label>
        <input type="text" id="cpe-tl" class="form-input" value="${esc(c.tradeLicense||'')}"></div>
      <div class="form-group"><label class="form-label">Trade License Expiry</label>
        <input type="date" id="cpe-tl-expiry" class="form-input" value="${c.tradeLicenseExpiry||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">TRN</label>
        <input type="text" id="cpe-trn" class="form-input" value="${esc(c.trn||'')}" style="font-family:var(--mono)"></div>
      <div class="form-group"><label class="form-label">CT Number</label>
        <input type="text" id="cpe-vat" class="form-input" value="${esc(c.corporateTaxNo||'')}" style="font-family:var(--mono)"></div>
    </div>
    <div class="form-row">
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
    tradeLicense:         document.getElementById('cpe-tl')?.value.trim() || '',
    tradeLicenseExpiry:   document.getElementById('cpe-tl-expiry')?.value || '',
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
  await _syncTradeLicenseDoc(clientId, patch.tradeLicense, patch.tradeLicenseExpiry);
  toast('Client profile saved!');
  _clientProfileEdit = false;
  document.getElementById('cp-edit-btn').innerHTML = '<i class="ti ti-edit"></i> Edit';
  _renderCPOverview(clientId);
  renderClients();
  renderSettingsClients();
}

/* ── Client profile tab renderers ───────────────────────── */
/* ══════════════════════════════════════════════════════════
   SHAREHOLDERS TAB  — per-shareholder multi-document model
   Each shareholder has their own documents array.
   All documents with expiry sync to the global Documents table
   so sidebar badges, health scores & expiry warnings all work.
   ══════════════════════════════════════════════════════════ */
const _SH_DOC_TYPES = [
  'Emirates ID', 'Passport', 'Residency Visa',
  'Investor Visa', 'Entry Permit', 'Trade License', 'Other'
];

/* ── helpers ─────────────────────────────────────────────── */
function _shExpiryBadge(expiry) {
  if (!expiry) return '';
  const today = new Date().toISOString().slice(0,10);
  const soon  = new Date(Date.now() + 60 * 86400000).toISOString().slice(0,10);
  if (expiry < today)  return '<span class="sh-badge sh-expired">Expired</span>';
  if (expiry <= soon)  return '<span class="sh-badge sh-expiring">Expiring soon</span>';
  return '<span class="sh-badge sh-valid">Valid</span>';
}

function _shUID() {
  return 'sh' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ── main render ─────────────────────────────────────────── */
function _renderCPShareholders(clientId) {
  const el           = document.getElementById('cp-body');
  const c            = State.getClient(clientId);
  const isAdmin      = State.user?.role === 'admin';
  const shareholders = c?.shareholders || [];

  /* Build shareholder cards */
  const cards = shareholders.length
    ? shareholders.map(function(sh, si) {
        const docs    = sh.documents || [];
        const hasExp  = docs.some(function(d){ return d.expiryDate; });
        const expBadge= docs.reduce(function(worst, d) {
          const b = _shExpiryBadge(d.expiryDate);
          if (b.includes('sh-expired'))  return '<span class="sh-badge sh-expired">Has expired</span>';
          if (b.includes('sh-expiring') && !worst.includes('sh-expired'))
            return '<span class="sh-badge sh-expiring">Expiring soon</span>';
          return worst;
        }, '');

        const docTypeOpts = _SH_DOC_TYPES.map(function(t){ return '<option>' + t + '</option>'; }).join('');

        const docRows = docs.length
          ? docs.map(function(d, di) {
              return '<div class="sh-doc-row">'
                + '<div class="sh-doc-type">' + esc(d.type||'') + '</div>'
                + '<div class="sh-doc-num">' + (d.number ? esc(d.number) : '—') + '</div>'
                + '<div class="sh-doc-exp">'
                +   (d.expiryDate ? fmtDate(d.expiryDate) : '—')
                +   ' ' + _shExpiryBadge(d.expiryDate)
                + '</div>'
                + (isAdmin
                  ? '<div class="sh-doc-actions">'
                    + '<button class="btn btn-ghost btn-sm" onclick="shEditDoc(\'' + clientId + '\',' + si + ',' + di + ')" title="Edit"><i class="ti ti-edit" style="font-size:11px"></i></button>'
                    + '<button class="btn btn-danger btn-sm" onclick="shDeleteDoc(\'' + clientId + '\',' + si + ',' + di + ')" title="Delete"><i class="ti ti-trash" style="font-size:11px"></i></button>'
                  + '</div>'
                  : '')
                + '</div>';
            }).join('')
          : '<div style="font-size:12px;color:var(--ink-4);padding:8px 0">No documents yet'
            + (isAdmin ? ' — click <strong>Add document</strong>' : '') + '</div>';

        return '<div class="sh-card" id="sh-card-' + si + '">'
          /* Shareholder header */
          + '<div class="sh-card-head">'
          +   '<div class="sh-avatar">' + (sh.name||'?').charAt(0).toUpperCase() + '</div>'
          +   '<div style="flex:1;min-width:0">'
          +     '<div class="sh-name">' + esc(sh.name||'') + '</div>'
          +     '<div class="sh-meta">'
          +       (sh.nationality ? esc(sh.nationality) : '')
          +       (sh.sharePercent != null ? (sh.nationality ? ' · ' : '') + sh.sharePercent + '% share' : '')
          +     '</div>'
          +   '</div>'
          +   expBadge
          +   '<button class="btn btn-ghost btn-sm" onclick="shCopyToClipboard(' + si + ',\'' + clientId + '\')" title="Copy shareholder to another client" style="color:var(--accent)">'
          +     '<i class="ti ti-copy"></i>'
          +   '</button>'
          +   (isAdmin
              ? '<button class="btn btn-ghost btn-sm" onclick="shEditPerson(\'' + clientId + '\',' + si + ')" title="Edit shareholder"><i class="ti ti-edit"></i></button>'
                + '<button class="btn btn-danger btn-sm" onclick="shDeletePerson(\'' + clientId + '\',' + si + ')" title="Remove"><i class="ti ti-trash"></i></button>'
              : '')
          + '</div>'

          /* Documents sub-section */
          + '<div class="sh-docs-section">'
          +   '<div class="sh-docs-header">'
          +     '<span style="font-size:11px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.5px">Documents</span>'
          +     (isAdmin
                ? '<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="shOpenDocForm(\'' + clientId + '\',' + si + ')">'
                  + '<i class="ti ti-plus"></i> Add document</button>'
                : '')
          +   '</div>'

          /* Inline doc form */
          +   '<div id="sh-doc-form-' + si + '" class="sh-doc-form" style="display:none">'
          +     '<div class="sh-doc-form-grid">'
          +       '<div class="form-group"><label class="form-label">Document type</label>'
          +         '<select id="sh-df-type-' + si + '" class="form-select">' + docTypeOpts + '</select></div>'
          +       '<div class="form-group"><label class="form-label">Number / Reference</label>'
          +         '<input id="sh-df-num-' + si + '" class="form-input" placeholder="e.g. 784-1234-XXXXXXX-X" style="font-family:var(--mono)"></div>'
          +       '<div class="form-group"><label class="form-label">Expiry date</label>'
          +         '<input id="sh-df-exp-' + si + '" type="date" class="form-input"></div>'
          +     '</div>'
          +     '<div style="display:flex;gap:7px;justify-content:flex-end;margin-top:8px">'
          +       '<button class="btn btn-ghost btn-sm" onclick="shCloseDocForm(' + si + ')">Cancel</button>'
          +       '<button class="btn btn-primary btn-sm" onclick="shSaveDoc(\'' + clientId + '\',' + si + ')">'
          +         '<i class="ti ti-check"></i> Save</button>'
          +     '</div>'
          +   '</div>'

          /* Doc table */
          +   '<div class="sh-doc-table">'
          +     '<div class="sh-doc-header"><div>Type</div><div>Number</div><div>Expiry</div>' + (isAdmin ? '<div></div>' : '') + '</div>'
          +     docRows
          +   '</div>'
          + '</div>'
          + '</div>';
      }).join('')
    : '<div class="sh-empty"><i class="ti ti-users" style="font-size:28px;opacity:0.2;display:block;margin-bottom:8px"></i>'
      + 'No shareholders yet' + (isAdmin ? ' — click <strong>Add shareholder</strong>' : '') + '</div>';

  el.innerHTML =
    '<div class="cp-tab-content">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    +   '<div style="font-size:13px;font-weight:600;color:var(--ink)">'
    +     shareholders.length + ' shareholder' + (shareholders.length !== 1 ? 's' : '')
    +   '</div>'
    +   (isAdmin
        ? '<div style="display:flex;gap:6px">'
          + (_shClipboard
              ? '<button class="btn btn-ghost btn-sm" onclick="shPasteFromClipboard(\'' + clientId + '\')"'
                + ' style="border-color:var(--accent);color:var(--accent)">'
                + '<i class="ti ti-clipboard"></i> Paste: ' + esc(_shClipboard.name) + '</button>'
              : '')
          + '<button class="btn btn-primary btn-sm" onclick="shOpenPersonForm(\'' + clientId + '\')">'
          + '<i class="ti ti-user-plus"></i> Add shareholder</button>'
          + '</div>'
        : '')
    + '</div>'

    /* Add/edit shareholder person form */
    + '<div id="sh-person-form" class="sh-form" style="display:none">'
    +   '<div class="sh-form-grid">'
    +     '<div class="form-group"><label class="form-label">Full name <span style="color:var(--red)">*</span></label>'
    +       '<input id="sh-pf-name" class="form-input" placeholder="e.g. Ahmed Al Rashid"></div>'
    +     '<div class="form-group"><label class="form-label">Nationality</label>'
    +       '<input id="sh-pf-nat" class="form-input" placeholder="e.g. UAE"></div>'
    +     '<div class="form-group"><label class="form-label">Share %</label>'
    +       '<input id="sh-pf-share" type="number" class="form-input" min="0" max="100" step="0.01" placeholder="e.g. 51"></div>'
    +   '</div>'
    +   '<div style="display:flex;gap:7px;justify-content:flex-end;margin-top:10px">'
    +     '<button class="btn btn-ghost btn-sm" onclick="shClosePersonForm()">Cancel</button>'
    +     '<button class="btn btn-primary btn-sm" id="sh-pf-save" onclick="shSavePerson(\'' + clientId + '\')">'
    +       '<i class="ti ti-check"></i> Save</button>'
    +   '</div>'
    + '</div>'

    + cards
    + '</div>';
}

/* ── Shareholder clipboard (copy/paste across clients) ────── */
let _shClipboard = null; /* stores a copied shareholder object */

function shCopyToClipboard(si, clientId) {
  const c  = State.getClient(clientId);
  const sh = (c?.shareholders || [])[si];
  if (!sh) return;
  /* Deep copy — give new IDs so it's independent */
  _shClipboard = JSON.parse(JSON.stringify(sh));
  toast('Shareholder "' + sh.name + '" copied — open another client to paste');
  /* Re-render current tab to show paste button */
  _renderCPShareholders(clientId);
}

async function shPasteFromClipboard(clientId) {
  if (!_shClipboard) return;
  const c            = State.getClient(clientId);
  const shareholders = JSON.parse(JSON.stringify(c?.shareholders || []));

  /* Check if already added */
  const exists = shareholders.some(function(s){
    return s.name.toLowerCase() === _shClipboard.name.toLowerCase();
  });
  if (exists) {
    toast('"' + _shClipboard.name + '" is already a shareholder of this client', 'error');
    return;
  }

  /* Generate fresh IDs for the pasted shareholder and their docs */
  const pasted = JSON.parse(JSON.stringify(_shClipboard));
  pasted.id    = _shUID();
  pasted.sharePercent = null; /* reset share % — will differ per client */
  if (Array.isArray(pasted.documents)) {
    pasted.documents = pasted.documents.map(function(d) {
      return Object.assign({}, d, { id: _shUID() });
    });
  }

  shareholders.push(pasted);
  await State.updateClient(clientId, { shareholders });
  await _syncShareholderDocs(clientId, shareholders);
  _renderCPShareholders(clientId);
  toast('"' + pasted.name + '" pasted with ' + (pasted.documents?.length || 0) + ' document(s). Update share % if needed.');
}

/* ── Shareholder person CRUD ─────────────────────────────── */
let _shPersonEditIdx = null;
let _shDocEditIdx    = null;   /* doc index within shareholder */

function shOpenPersonForm(clientId) {
  _shPersonEditIdx = null;
  ['sh-pf-name','sh-pf-nat','sh-pf-share'].forEach(id => { const e = document.getElementById(id); if(e) e.value=''; });
  const f = document.getElementById('sh-person-form');
  if (f) { f.style.display = ''; document.getElementById('sh-pf-name')?.focus(); }
}

function shEditPerson(clientId, si) {
  _shPersonEditIdx = si;
  const sh = (State.getClient(clientId)?.shareholders || [])[si];
  if (!sh) return;
  document.getElementById('sh-pf-name').value  = sh.name         || '';
  document.getElementById('sh-pf-nat').value   = sh.nationality  || '';
  document.getElementById('sh-pf-share').value = sh.sharePercent != null ? sh.sharePercent : '';
  const f = document.getElementById('sh-person-form');
  if (f) { f.style.display = ''; document.getElementById('sh-pf-name')?.focus(); }
}

function shClosePersonForm() {
  const f = document.getElementById('sh-person-form');
  if (f) f.style.display = 'none';
  _shPersonEditIdx = null;
}

async function shSavePerson(clientId) {
  const name = (document.getElementById('sh-pf-name')?.value || '').trim();
  if (!name) { toast('Name is required', 'error'); return; }
  const c            = State.getClient(clientId);
  const shareholders = JSON.parse(JSON.stringify(c?.shareholders || []));

  if (_shPersonEditIdx !== null) {
    shareholders[_shPersonEditIdx].name         = name;
    shareholders[_shPersonEditIdx].nationality  = (document.getElementById('sh-pf-nat')?.value||'').trim();
    shareholders[_shPersonEditIdx].sharePercent = parseFloat(document.getElementById('sh-pf-share')?.value)||null;
  } else {
    shareholders.push({
      id:           _shUID(),
      name,
      nationality:  (document.getElementById('sh-pf-nat')?.value||'').trim(),
      sharePercent: parseFloat(document.getElementById('sh-pf-share')?.value)||null,
      documents:    [],
    });
  }

  const btn = document.getElementById('sh-pf-save');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }
  await State.updateClient(clientId, { shareholders });
  shClosePersonForm();
  _renderCPShareholders(clientId);
  toast('Shareholder saved!');
}

async function shDeletePerson(clientId, si) {
  if (!confirm('Remove this shareholder and all their documents?')) return;
  const c            = State.getClient(clientId);
  const shareholders = (c?.shareholders||[]).filter(function(_,i){ return i!==si; });
  await State.updateClient(clientId, { shareholders });
  await _syncShareholderDocs(clientId, shareholders);
  _renderCPShareholders(clientId);
  toast('Shareholder removed');
}

/* ── Per-shareholder document CRUD ──────────────────────── */
function shOpenDocForm(clientId, si) {
  _shDocEditIdx = null;
  ['sh-df-num-'+si,'sh-df-exp-'+si].forEach(function(id){
    const e = document.getElementById(id); if(e) e.value='';
  });
  const typeEl = document.getElementById('sh-df-type-'+si);
  if (typeEl) typeEl.value = 'Emirates ID';
  const f = document.getElementById('sh-doc-form-'+si);
  if (f) { f.style.display = ''; document.getElementById('sh-df-type-'+si)?.focus(); }
}

function shEditDoc(clientId, si, di) {
  _shDocEditIdx = di;
  const sh  = (State.getClient(clientId)?.shareholders||[])[si];
  const doc = (sh?.documents||[])[di];
  if (!doc) return;
  const typeEl = document.getElementById('sh-df-type-'+si);
  const numEl  = document.getElementById('sh-df-num-'+si);
  const expEl  = document.getElementById('sh-df-exp-'+si);
  if (typeEl) typeEl.value = doc.type       || 'Emirates ID';
  if (numEl)  numEl.value  = doc.number     || '';
  if (expEl)  expEl.value  = doc.expiryDate || '';
  const f = document.getElementById('sh-doc-form-'+si);
  if (f) { f.style.display = ''; typeEl?.focus(); }
}

function shCloseDocForm(si) {
  const f = document.getElementById('sh-doc-form-'+si);
  if (f) f.style.display = 'none';
  _shDocEditIdx = null;
}

async function shSaveDoc(clientId, si) {
  const type   = document.getElementById('sh-df-type-'+si)?.value || 'Emirates ID';
  const number = (document.getElementById('sh-df-num-'+si)?.value  || '').trim();
  const expiry = document.getElementById('sh-df-exp-'+si)?.value   || '';

  const c            = State.getClient(clientId);
  const shareholders = JSON.parse(JSON.stringify(c?.shareholders || []));
  if (!shareholders[si]) return;

  const docs = shareholders[si].documents || [];
  const newDoc = { id: _shUID(), type, number, expiryDate: expiry };

  if (_shDocEditIdx !== null) {
    newDoc.id = docs[_shDocEditIdx].id;
    docs[_shDocEditIdx] = newDoc;
  } else {
    docs.push(newDoc);
  }
  shareholders[si].documents = docs;

  await State.updateClient(clientId, { shareholders });
  await _syncShareholderDocs(clientId, shareholders);
  shCloseDocForm(si);
  _renderCPShareholders(clientId);
  toast('Document saved!');
}

async function shDeleteDoc(clientId, si, di) {
  if (!confirm('Delete this document?')) return;
  const c            = State.getClient(clientId);
  const shareholders = JSON.parse(JSON.stringify(c?.shareholders || []));
  shareholders[si].documents = (shareholders[si].documents||[]).filter(function(_,i){ return i!==di; });
  await State.updateClient(clientId, { shareholders });
  await _syncShareholderDocs(clientId, shareholders);
  _renderCPShareholders(clientId);
  toast('Document removed');
}

/* ── Sync all shareholder docs → global Documents table ──── */
async function _syncShareholderDocs(clientId, shareholders) {
  for (const sh of shareholders) {
    for (const doc of (sh.documents || [])) {
      if (!doc.expiryDate) continue;
      /* Unique key: clientId + shareholderId + docId */
      const noteKey = 'SH:' + sh.id + ':' + doc.id;
      const existing = State.documents.find(function(d){
        return d.clientId === clientId && d.notes === noteKey;
      });
      if (existing) {
        await State.updateDocument(existing.id, {
          type:       doc.type,
          number:     doc.number || '',
          expiryDate: doc.expiryDate,
          notes:      noteKey,
        });
      } else {
        await State.addDocument({
          clientId,
          type:       doc.type,
          number:     doc.number || '',
          expiryDate: doc.expiryDate,
          notes:      noteKey,
        });
      }
    }
  }
}

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
      <i class="ti ti-check" style="font-size:11px;color:var(--accent);flex-shrink:0"></i>
      <input class="subtask-text-input" value="${esc(text)}" style="flex:1"
        onchange="_tmfSubtasks[${i}]=this.value.trim()||_tmfSubtasks[${i}]"
        onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}">
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
    btn.style.background  = on ? 'linear-gradient(135deg,#81D8D0,#3db5ad)' : '';
    btn.style.color       = on ? '#1a2e2c' : '';
    btn.style.borderColor = on ? 'transparent' : '';
    btn.style.fontWeight  = on ? '700' : '';
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
  _closeModal('reminder-form-modal');
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
  let msgs;
  if (channelId === 'team') {
    msgs = State.messages.filter(m => m.channel === 'team');
  } else {
    const myId = State.user?.id;
    msgs = State.messages.filter(m =>
      (m.fromUserId === myId  && m.channel === channelId) ||
      (m.fromUserId === channelId && m.channel === myId)
    );
  }
  /* Sort chronologically by message ID (contains Date.now() timestamp) */
  return msgs.sort(function(a, b) {
    const aNum = parseInt((a.id || '').replace('msg','')) || 0;
    const bNum = parseInt((b.id || '').replace('msg','')) || 0;
    return aNum - bNum;
  });
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
  if (msgs.length) _markChannelRead(channelId, msgs[msgs.length - 1].id);
  updateChatBadge();
  renderChatChannels();
}

function _markChannelRead(channelId, msgId) {
  _chatLastRead[channelId] = msgId;
  try { localStorage.setItem('ofiz_chat_read', JSON.stringify(_chatLastRead)); } catch(e) {}
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
  _markChannelRead(_chatChannel, msg.id);
  renderChatMessages(_chatChannel);
  if (State.useSheets) Sheets.sendMessage(msg);
}

function updateChatBadge() {
  const channels = ['team', ...State.users.filter(u => u.id !== State.user?.id).map(u => u.id)];
  const total    = channels.reduce((s, ch) => s + _unreadCount(ch), 0);
  const badge    = document.getElementById('chat-badge');
  if (badge) { badge.textContent = total || ''; badge.style.display = total ? '' : 'none'; }
}


/* ══════════════════════════════════════════════════════════
   NOTEPAD — scratch pad + sticky notes (localStorage)
   Google Keep-inspired design
   ══════════════════════════════════════════════════════════ */
/* Keys are per-user — each person sees only their own notes */
function _npScratchKey() { return 'ofiz_notepad_scratch_' + (State.user?.id || 'guest'); }
function _npStickyKey()  { return 'ofiz_notepad_stickies_' + (State.user?.id || 'guest'); }
/* Legacy aliases for saveNotepadScratch() compatibility */
const _NP_SCRATCH = 'ofiz_notepad_scratch'; /* unused after migration */
const _NP_STICKY  = 'ofiz_notepad_stickies'; /* unused after migration */

/* Soft pastel palette matching OFIZ brand */
const _NP_COLORS = [
  { id:'yellow', bg:'#fef9c3', accent:'#d97706', label:'Yellow' },
  { id:'teal',   bg:'#ccfbf1', accent:'#0f766e', label:'Teal'   },
  { id:'blue',   bg:'#dbeafe', accent:'#1d4ed8', label:'Blue'   },
  { id:'pink',   bg:'#fce7f3', accent:'#be185d', label:'Pink'   },
  { id:'purple', bg:'#ede9fe', accent:'#6d28d9', label:'Purple' },
  { id:'peach',  bg:'#ffedd5', accent:'#c2410c', label:'Peach'  },
  { id:'white',  bg:'#f8fafc', accent:'#475569', label:'White'  },
];

function _npGetStickies() {
  try { return JSON.parse(localStorage.getItem(_npStickyKey()) || '[]'); }
  catch(e) { return []; }
}
function _npSave(arr) { localStorage.setItem(_npStickyKey(), JSON.stringify(arr)); _npSyncCloud(); }
function _npColor(id) { return _NP_COLORS.find(c => c.id === id) || _NP_COLORS[0]; }

/* Push current local notepad (scratch + stickies) to Supabase — debounced in State */
function _npSyncCloud() {
  if (typeof State === 'undefined' || typeof State.saveNotepad !== 'function') return;
  const scratch = localStorage.getItem(_npScratchKey()) || '';
  State.saveNotepad(scratch, _npGetStickies());
}
function npOnScratchInput(val) {
  localStorage.setItem(_npScratchKey(), val);
  _npSyncCloud();
}

/* ── Main render entry point ────────────────────────────── */
function renderNotepad() {
  const el = document.getElementById('page-notepad');
  if (!el) return;

  /* Pre-build color dots HTML — avoids nested template literals */
  const colorDots = _NP_COLORS.map(function(c) {
    return '<button class="np-color-dot" data-color="' + c.id + '"'
      + ' style="background:' + c.bg + ';border-color:' + c.accent + '"'
      + ' title="' + c.label + '"'
      + ' onclick="npSetNewColor(\'' + c.id + '\')"></button>';
  }).join('');

  const notes   = _npGetStickies();
  const pinned  = notes.filter(function(n){ return n.pinned; });
  const regular = notes.filter(function(n){ return !n.pinned; });
  const count   = notes.length;

  el.innerHTML =
    '<div class="np-layout">'

    /* ── LEFT: Scratch pad ── */
    + '<div class="np-scratch-col">'
    +   '<div class="np-col-head">'
    +     '<i class="ti ti-pencil"></i> Scratch pad'
    +     '<span class="np-autosave-badge"><i class="ti ti-cloud-check" style="font-size:11px;vertical-align:-1px"></i> synced</span>'
    +   '</div>'
    +   '<textarea id="np-scratch" class="np-scratch-area"'
    +     ' placeholder="Jot anything here — quick thoughts, copy-paste, to-do lists…"'
    +     ' oninput="npOnScratchInput(this.value)"></textarea>'
    + '</div>'

    /* ── RIGHT: Sticky notes ── */
    + '<div class="np-sticky-col">'
    +   '<div class="np-col-head">'
    +     '<i class="ti ti-pin"></i> Sticky notes'
    +     (count ? '<span class="np-autosave-badge">' + count + ' note' + (count!==1?'s':'') + '</span>' : '')
    +     '<div style="display:flex;gap:6px;margin-left:auto">'
    +       '<input id="np-search" class="np-search-box" placeholder="Search notes…"'
    +         ' oninput="_npRenderGrid()" style="width:140px">'
    +       '<button class="btn btn-primary btn-sm" id="np-add-btn">'
    +         '<i class="ti ti-plus"></i> New note'
    +       '</button>'
    +     '</div>'
    +   '</div>'

    /* Composer */
    +   '<div id="np-composer" class="np-composer" style="display:none">'
    +     '<input id="np-new-title" class="np-composer-title" placeholder="Title (optional)" maxlength="100">'
    +     '<textarea id="np-new-body" class="np-composer-body" placeholder="Take a note…" rows="5"></textarea>'
    +     '<div class="np-composer-footer">'
    +       '<div class="np-color-row" id="np-color-row">' + colorDots + '</div>'
    +       '<div style="display:flex;gap:6px">'
    +         '<button class="btn btn-ghost btn-sm" onclick="npCloseComposer()">Cancel</button>'
    +         '<button class="btn btn-primary btn-sm" onclick="npSaveNew()">'
    +           '<i class="ti ti-check"></i> Save'
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +   '</div>'

    /* Notes grid */
    +   '<div id="np-notes-grid" class="np-notes-grid"></div>'
    + '</div>'
    + '</div>';

  /* Restore scratch */
  const scratchEl = document.getElementById('np-scratch');
  if (scratchEl) scratchEl.value = localStorage.getItem(_npScratchKey()) || '';

  /* Wire add button */
  document.getElementById('np-add-btn').addEventListener('click', npOpenComposer);

  /* Render notes grid */
  _npRenderGrid();
}

let _npNewColor = 'yellow';

function npOpenComposer() {
  const c = document.getElementById('np-composer');
  if (!c) return;
  c.style.display = 'block';
  _npNewColor = 'yellow';
  _npHighlightColor('yellow');
  document.getElementById('np-new-body')?.focus();
}

function npCloseComposer() {
  const c = document.getElementById('np-composer');
  if (c) c.style.display = 'none';
  const t = document.getElementById('np-new-title');
  const b = document.getElementById('np-new-body');
  if (t) t.value = '';
  if (b) b.value = '';
  _npNewColor = 'yellow';
}

function npSetNewColor(id) {
  _npNewColor = id;
  _npHighlightColor(id);
}

function _npHighlightColor(id) {
  document.querySelectorAll('#np-color-row .np-color-dot').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === id);
  });
}

function npSaveNew() {
  const title = (document.getElementById('np-new-title')?.value || '').trim();
  const body  = (document.getElementById('np-new-body')?.value  || '').trim();
  if (!title && !body) { toast('Write something first!'); return; }
  const arr = _npGetStickies();
  arr.unshift({
    id:        Date.now().toString(36) + Math.random().toString(36).slice(2),
    title,
    body,
    color:     _npNewColor,
    createdAt: new Date().toISOString(),
  });
  _npSave(arr);
  npCloseComposer();
  _npRenderGrid();
}

function _npRenderGrid() {
  const grid = document.getElementById('np-notes-grid');
  if (!grid) return;

  const query  = (document.getElementById('np-search')?.value || '').toLowerCase();
  let   notes  = _npGetStickies();

  /* Apply search filter */
  if (query) {
    notes = notes.filter(function(n) {
      return (n.title || '').toLowerCase().includes(query)
          || (n.body  || '').toLowerCase().includes(query);
    });
  }

  /* Pinned first */
  const pinned  = notes.filter(function(n){ return n.pinned; });
  const regular = notes.filter(function(n){ return !n.pinned; });
  const sorted  = pinned.concat(regular);

  if (!sorted.length) {
    grid.innerHTML = '<div class="np-empty">'
      + '<i class="ti ti-pin" style="font-size:28px;opacity:0.25;display:block;margin-bottom:8px"></i>'
      + (query ? 'No notes match your search' : 'No notes yet — click <strong>New note</strong> to add one')
      + '</div>';
    return;
  }

  grid.innerHTML = '';
  sorted.forEach(function(note) {
    const col  = _npColor(note.color);
    const card = document.createElement('div');
    card.className = 'np-card' + (note.pinned ? ' np-card-pinned' : '');
    card.style.background  = col.bg;
    card.style.borderColor = col.accent + '55';

    const dateStr = note.createdAt
      ? new Date(note.createdAt).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})
      : '';

    card.innerHTML =
        '<div class="np-card-inner">'
      +   '<div class="np-card-header">'
      +     '<input class="np-card-title-input" placeholder="Title…"'
      +       ' style="color:' + col.accent + ';border-bottom:1px solid ' + col.accent + '33">'
      +     '<div class="np-card-actions">'
      +       '<button class="np-card-btn np-pin-btn" title="' + (note.pinned ? 'Unpin' : 'Pin') + '"'
      +         ' onclick="npTogglePin(\'' + note.id + '\')">'
      +         '<i class="ti ' + (note.pinned ? 'ti-pinned-filled' : 'ti-pin') + '" style="font-size:12px"></i>'
      +       '</button>'
      +       '<button class="np-card-btn" title="Delete note" onclick="npDeleteNote(\'' + note.id + '\')">'
      +         '<i class="ti ti-trash" style="font-size:12px"></i>'
      +       '</button>'
      +     '</div>'
      +   '</div>'
      +   '<textarea class="np-card-body" rows="4" placeholder="Write your note…"></textarea>'
      +   '<div class="np-card-footer">'
      +     '<span class="np-card-date" style="color:' + col.accent + '88">' + dateStr + '</span>'
      +     '<div class="np-color-row np-card-color-row">'
      +       _NP_COLORS.map(function(c) {
              return '<button class="np-color-dot np-card-color-dot'
                + (note.color === c.id ? ' active' : '') + '"'
                + ' data-color="' + c.id + '"'
                + ' style="background:' + c.bg + ';border-color:' + c.accent + '"'
                + ' title="' + c.label + '"'
                + ' onclick="npChangeColor(\'' + note.id + '\',\'' + c.id + '\')"></button>';
            }).join('')
      +     '</div>'
      +   '</div>'
      + '</div>';

    /* Set values safely via .value */
    card.querySelector('.np-card-title-input').value = note.title || '';
    card.querySelector('.np-card-body').value         = note.body  || '';

    card.querySelector('.np-card-title-input').addEventListener('input', function() { npUpdateTitle(note.id, this.value); });
    card.querySelector('.np-card-body').addEventListener('input',        function() { npUpdateBody(note.id,  this.value); });

    /* ── Drag to reorder ── */
    card.setAttribute('draggable', 'true');
    card.dataset.noteId = note.id;

    card.addEventListener('dragstart', function(e) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', note.id);
      setTimeout(function() { card.classList.add('dragging'); }, 0);
    });
    card.addEventListener('dragend', function() {
      card.classList.remove('dragging');
      document.querySelectorAll('.np-card').forEach(function(c){ c.classList.remove('drag-over'); });
    });
    card.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.np-card').forEach(function(c){ c.classList.remove('drag-over'); });
      card.classList.add('drag-over');
    });
    card.addEventListener('drop', function(e) {
      e.preventDefault();
      card.classList.remove('drag-over');
      const fromId = e.dataTransfer.getData('text/plain');
      const toId   = note.id;
      if (fromId === toId) return;
      const arr    = _npGetStickies();
      const fromIdx = arr.findIndex(function(x){ return x.id === fromId; });
      const toIdx   = arr.findIndex(function(x){ return x.id === toId; });
      if (fromIdx < 0 || toIdx < 0) return;
      const moved = arr.splice(fromIdx, 1)[0];
      arr.splice(toIdx, 0, moved);
      _npSave(arr);
      _npRenderGrid();
    });

    grid.appendChild(card);
  });
}

function npTogglePin(id) {
  const arr = _npGetStickies();
  const n = arr.find(function(x){ return x.id === id; });
  if (n) { n.pinned = !n.pinned; _npSave(arr); _npRenderGrid(); }
}

function npChangeColor(id, colorId) {
  const arr = _npGetStickies();
  const n = arr.find(function(x){ return x.id === id; });
  if (n) { n.color = colorId; _npSave(arr); _npRenderGrid(); }
}

function npUpdateTitle(id, text) {
  const arr = _npGetStickies();
  const n = arr.find(x => x.id === id);
  if (n) { n.title = text; _npSave(arr); }
}

function npUpdateBody(id, text) {
  const arr = _npGetStickies();
  const n = arr.find(x => x.id === id);
  if (n) { n.body = text; _npSave(arr); }
}

function npDeleteNote(id) {
  const deleted = _npGetStickies().find(x => x.id === id);
  const arr = _npGetStickies().filter(x => x.id !== id);
  _npSave(arr);
  _npRenderGrid();
  toast('Note deleted', 'error', {
    label: 'Undo',
    fn: () => {
      const cur = _npGetStickies();
      cur.unshift(deleted);
      _npSave(cur);
      _npRenderGrid();
    },
  });
}

/* Legacy aliases so any old HTML onclick calls don't break */
function addStickyNote()       { npOpenComposer(); }
function saveNotepadScratch()  { localStorage.setItem(_npScratchKey(), document.getElementById('np-scratch')?.value || ''); }

/* ══════════════════════════════════════════════════════════
   CHECKLISTS — process tracking with unlimited nesting
   Sheets (one per process/client) shown as colourful tabs.
   Items nest via parentItemId; rendered recursively.
   ══════════════════════════════════════════════════════════ */

/* View state: 'grid' (card landing) or 'sheet' (single sheet detail) */
let _clView      = 'grid';
let _clFilter    = 'active';            /* 'active' | 'archived' */
let _clSearch    = '';                  /* landing search query */
let _clPendingTemplateId = null;        /* template to apply on next sheet create */
const _clCollapsed = new Set();         /* collapsed category ids */

/* ── Main render entry point ────────────────────────────── */
function renderChecklists() {
  const el = document.getElementById('page-checklists');
  if (!el) return;

  /* If the open sheet vanished or got archived, fall back to the grid */
  if (_clView === 'sheet') {
    const cur = State.checklistSheets.find(s => s.id === State.activeChecklistSheetId);
    if (!cur) _clView = 'grid';
  }

  if (_clView === 'sheet') _renderChecklistSheet(el);
  else                     _renderChecklistGrid(el);
}

/* ── Landing grid: square cards grouped by client ───────── */
function _renderChecklistGrid(el) {
  const canEdit  = State.user?.role !== 'viewer';
  const archived = _clFilter === 'archived';
  let   sheets   = State.checklistSheets.filter(s => archived ? s.active === false : s.active !== false);
  const activeCount   = State.checklistSheets.filter(s => s.active !== false).length;
  const archivedCount = State.checklistSheets.filter(s => s.active === false).length;

  /* Search filter — by sheet name, client name, or project code */
  const q = _clSearch.trim().toLowerCase();
  if (q) {
    sheets = sheets.filter(function(s) {
      const c = s.clientId ? State.getClient(s.clientId) : null;
      return (s.name || '').toLowerCase().includes(q)
        || (c ? c.name.toLowerCase().includes(q) : false)
        || (s.projectCode || '').toLowerCase().includes(q)
        || (s.manager || '').toLowerCase().includes(q);
    });
  }

  /* group by client, sorted by client name (no-client group last) */
  const groups = {};
  sheets.forEach(function(s) {
    const c   = s.clientId ? State.getClient(s.clientId) : null;
    const key = c ? c.name : '￿No client';
    (groups[key] = groups[key] || { name: c ? c.name : 'No client', items: [] }).items.push(s);
  });
  const groupKeys = Object.keys(groups).sort();

  let body;
  if (!sheets.length) {
    body = '<div class="empty-state"><i class="ti ti-checklist"></i><p>'
      + (q ? 'No checklists match “' + esc(_clSearch.trim()) + '”.'
           : (archived ? 'No archived checklists.' : 'No active checklists yet. Create one to track a full process — e.g. "Monthly Closing — The Den DXB".'))
      + '</p></div>';
  } else {
    body = groupKeys.map(function(k) {
      const g = groups[k];
      return '<div class="cl-card-group">'
        + '<div class="cl-card-group-title"><i class="ti ti-building"></i> ' + esc(g.name) + '</div>'
        + '<div class="cl-card-grid">'
        + g.items.map(s => _renderClCard(s, canEdit, archived)).join('')
        + '</div></div>';
    }).join('');
  }

  el.innerHTML =
    '<div class="section-head" style="margin-bottom:14px">'
    + '<span class="section-title">Checklists</span>'
    + '<div style="display:flex;gap:8px;align-items:center">'
    +   '<div class="cl-search"><i class="ti ti-search"></i>'
    +     '<input id="cl-search-input" placeholder="Search checklists…" value="' + esc(_clSearch) + '"'
    +       ' oninput="setChecklistSearch(this.value)">'
    +     (_clSearch ? '<button class="cl-search-clear" onclick="setChecklistSearch(\'\')"><i class="ti ti-x"></i></button>' : '')
    +   '</div>'
    +   (canEdit ? '<button class="btn btn-primary btn-sm" onclick="openNewChecklistSheetModal()">'
        + '<i class="ti ti-plus"></i> New sheet</button>' : '')
    + '</div>'
    + '</div>'

    /* Hero row — Daily Wins + Templates (active view only, no search) */
    + ((!archived && !q) ? '<div class="cl-hero">' + _clDailyWinsHtml() + _clTemplatesCardHtml(canEdit) + '</div>' : '')

    /* Filter pills */
    + '<div class="cl-filter-bar">'
    +   '<button class="cl-filter' + (!archived ? ' active' : '') + '" onclick="setChecklistFilter(\'active\')">'
    +     'Active <span class="cl-filter-count">' + activeCount + '</span></button>'
    +   '<button class="cl-filter' + (archived ? ' active' : '') + '" onclick="setChecklistFilter(\'archived\')">'
    +     'Archived <span class="cl-filter-count">' + archivedCount + '</span></button>'
    + '</div>'

    + body
    + _clSheetModalHtml()
    + _clTemplatesModalHtml();

  /* Keep focus + caret in the search box across re-renders */
  if (q) {
    const si = document.getElementById('cl-search-input');
    if (si) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); }
  }
}

function setChecklistSearch(v) {
  _clSearch = v || '';
  renderChecklists();
}

/* One sheet card — progress ring hero + category dots + due chips */
function _renderClCard(s, canEdit, archived) {
  const p   = _clProgress(s.id);
  const idx = State.checklistSheets.filter(x => x.active !== false).indexOf(s);
  const pal = _PIP_PALETTE[(idx < 0 ? 0 : idx) % _PIP_PALETTE.length];
  const meta = s;   /* priority / projectCode / manager now live on the sheet (synced) */
  const pri  = !!s.priority;
  const sub  = [s.projectCode, s.manager ? 'Mgr: ' + s.manager : ''].filter(Boolean).join(' · ');

  /* category color dots (cycle the palette in category order) */
  const catItems = State.checklistItems
    .filter(i => i.sheetId === s.id && i.itemType === 'category')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const dots = catItems.slice(0, 6).map(function(c, i) {
    const cp = _PIP_PALETTE[i % _PIP_PALETTE.length];
    return '<span class="cl-card-dot" style="background:' + cp.active + '" title="' + esc(c.text || 'Section') + '"></span>';
  }).join('') + (catItems.length > 6 ? '<span class="cl-card-dot-more">+' + (catItems.length - 6) + '</span>' : '');

  /* due / overdue rollup from ClLocal */
  const today = _clTodayStr();
  let overdue = 0, dueToday = 0;
  State.checklistItems
    .filter(i => i.sheetId === s.id && i.itemType !== 'category' && !i.done)
    .forEach(function(i) {
      const d = i.dueDate;
      if (d && d < today) overdue++; else if (d === today) dueToday++;
    });
  let chip = '';
  if (overdue)       chip = '<span class="cl-card-chip cl-card-chip-overdue"><i class="ti ti-alert-triangle"></i> ' + overdue + ' overdue</span>';
  else if (dueToday) chip = '<span class="cl-card-chip cl-card-chip-due"><i class="ti ti-calendar"></i> ' + dueToday + ' due today</span>';
  else if (p.total && p.done === p.total) chip = '<span class="cl-card-chip cl-card-chip-done"><i class="ti ti-circle-check"></i> Complete</span>';

  /* hero progress ring */
  const r = 30, circ = 2 * Math.PI * r, off = circ * (1 - p.pct / 100);
  const ring = '<svg class="cl-card-ring-svg" viewBox="0 0 76 76">'
    + '<circle class="cl-card-ring-bg" cx="38" cy="38" r="' + r + '"></circle>'
    + '<circle class="cl-card-ring-fg" cx="38" cy="38" r="' + r + '" stroke="' + pal.active + '"'
    +   ' stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>'
    + '<text class="cl-card-ring-pct" x="38" y="34">' + p.pct + '%</text>'
    + '<text class="cl-card-ring-sub" x="38" y="48">' + p.done + '/' + p.total + '</text>'
    + '</svg>';

  return '<div class="cl-card' + (pri ? ' cl-card-priority' : '') + '" onclick="openChecklistSheet(\'' + s.id + '\')"'
    +   ' style="--cl-accent:' + pal.active + ';--cl-tint:' + pal.bg + ';border-top:4px solid ' + pal.active + '">'
    + '<div class="cl-card-top">'
    +   (pri ? '<span class="cl-pri-badge">Priority</span>' : '<span class="cl-card-cats-dots">' + dots + '</span>')
    +   (canEdit
        ? '<div class="cl-card-acts" onclick="event.stopPropagation()">'
          + (archived
            ? '<button class="cl-row-btn" title="Restore" onclick="unarchiveChecklistSheetUI(\'' + s.id + '\')"><i class="ti ti-archive-off"></i></button>'
              + '<button class="cl-row-btn cl-del" title="Delete permanently" onclick="confirmDeleteChecklistSheet(\'' + s.id + '\')"><i class="ti ti-trash"></i></button>'
            : '<button class="cl-row-btn" title="Duplicate" onclick="duplicateChecklistSheetUI(\'' + s.id + '\')"><i class="ti ti-copy"></i></button>'
              + '<button class="cl-row-btn" title="Archive" onclick="archiveChecklistSheetUI(\'' + s.id + '\')"><i class="ti ti-archive"></i></button>')
          + '</div>'
        : '')
    + '</div>'
    + '<div class="cl-card-ring">' + ring + '</div>'
    + '<div class="cl-card-name">' + esc(s.name) + '</div>'
    + (sub ? '<div class="cl-card-code">' + esc(sub) + '</div>' : '')
    + '<div class="cl-card-foot">'
    +   '<span class="cl-card-meta">' + (catItems.length ? catItems.length + ' · ' : '') + p.total + ' item' + (p.total === 1 ? '' : 's') + '</span>'
    +   chip
    + '</div>'
    + '</div>';
}

/* ── Single sheet detail view ───────────────────────────── */
function _renderChecklistSheet(el) {
  const canEdit  = State.user?.role !== 'viewer';
  const activeId = State.activeChecklistSheetId;
  const sheet    = State.checklistSheets.find(s => s.id === activeId);
  if (!sheet) { _clView = 'grid'; renderChecklists(); return; }

  const prog     = _clProgress(activeId);
  const byParent = _clTree(activeId);
  _clBuildCatColors(byParent);
  const client   = sheet.clientId ? State.getClient(sheet.clientId) : null;
  const isArchived = sheet.active === false;
  const pri        = !!sheet.priority;

  el.innerHTML =
    '<div class="section-head" style="margin-bottom:14px">'
    + '<button class="btn btn-ghost btn-sm" onclick="backToChecklistGrid()"><i class="ti ti-arrow-left"></i> All checklists</button>'
    + (canEdit ? '<button class="btn btn-primary btn-sm" onclick="openNewChecklistSheetModal()">'
      + '<i class="ti ti-plus"></i> New sheet</button>' : '')
    + '</div>'

    + '<div class="cl-sheet-body">'
    +   '<div class="cl-sheet-head">'
    +     '<div style="flex:1;min-width:0">'
    +       '<div style="font-size:var(--text-md);font-weight:700;color:var(--ink)">'
    +         (pri ? '<span class="cl-pri-badge">Priority</span> ' : '') + esc(sheet.name)
    +         (isArchived ? ' <span class="cl-archived-tag">Archived</span>' : '') + '</div>'
    +       '<div style="font-size:var(--text-sm);color:var(--ink-3);margin-top:2px">'
    +         (client ? esc(client.name) + ' · ' : '')
    +         prog.done + '/' + prog.total + ' done'
    +       '</div>'
    +       _clSheetMetaHtml(sheet, canEdit)
    +     '</div>'
    +     (canEdit
        ? '<div style="display:flex;gap:6px;flex-shrink:0">'
          + '<button class="btn btn-ghost btn-sm" onclick="toggleSheetPriority(\'' + sheet.id + '\')" title="' + (pri ? 'Remove priority' : 'Mark as priority') + '"><i class="ti ti-flag' + (pri ? '-filled' : '') + '"' + (pri ? ' style="color:#c0392b"' : '') + '></i></button>'
          + '<button class="btn btn-ghost btn-sm" onclick="renameChecklistSheetUI(\'' + sheet.id + '\')" title="Rename"><i class="ti ti-pencil"></i></button>'
          + '<button class="btn btn-ghost btn-sm" onclick="duplicateChecklistSheetUI(\'' + sheet.id + '\')" title="Duplicate — fresh copy, all unchecked"><i class="ti ti-copy"></i></button>'
          + '<button class="btn btn-ghost btn-sm" onclick="saveSheetAsTemplate(\'' + sheet.id + '\')" title="Save as template"><i class="ti ti-template"></i></button>'
          + (isArchived
            ? '<button class="btn btn-ghost btn-sm" onclick="unarchiveChecklistSheetUI(\'' + sheet.id + '\')" title="Restore"><i class="ti ti-archive-off"></i></button>'
            : '<button class="btn btn-ghost btn-sm" onclick="archiveChecklistSheetUI(\'' + sheet.id + '\')" title="Archive"><i class="ti ti-archive"></i></button>')
          + '<button class="btn btn-danger btn-sm" onclick="confirmDeleteChecklistSheet(\'' + sheet.id + '\')" title="Delete sheet"><i class="ti ti-trash"></i></button>'
          + '</div>'
        : '')
    +   '</div>'

    /* Two-column body: item tree (left) + insight sidebar (right) */
    +   '<div class="cl-detail-cols">'
    +   '<div class="cl-detail-main">'

    /* Item tree (column grid) */
    +   '<div class="cl-grid">'
    +     ((byParent['root'] && byParent['root'].length)
          ? '<div class="cl-head-row">'
            + '<div class="cl-h">Task / Step</div>'
            + '<div class="cl-h">Notes</div>'
            + '<div class="cl-h">Comments</div>'
            + '<div class="cl-h">Owner</div>'
            + '<div class="cl-h"></div>'
            + '</div>'
            + _renderClItems(byParent, 'root', 0, canEdit, [], null)
          : '<div style="font-size:var(--text-sm);color:var(--ink-4);padding:16px 0;text-align:center">No items yet'
            + (canEdit ? ' — click <strong>Add item</strong> or <strong>Add category</strong> below' : '') + '</div>')
    +   '</div>'

    /* Add root item / category */
    +   (canEdit
        ? '<div style="display:flex;gap:8px;margin-top:10px">'
          + '<button class="btn btn-ghost btn-sm" onclick="addChecklistItemUI(\'' + sheet.id + '\', null)">'
          + '<i class="ti ti-plus"></i> Add item</button>'
          + '<button class="btn btn-ghost btn-sm" onclick="addChecklistItemUI(\'' + sheet.id + '\', null, \'category\')">'
          + '<i class="ti ti-plus"></i> Add category</button>'
          + '</div>'
        : '')
    +   '</div>'                          /* /cl-detail-main */
    +   _clSidebarHtml(sheet.id)
    +   '</div>'                          /* /cl-detail-cols */
    + '</div>'                            /* /cl-sheet-body  */
    + _clSheetModalHtml();

  /* Set input values via JS — avoids HTML-encoding issues */
  _clHydrateValues(activeId);
}

/* ── Grid/detail navigation & filters ───────────────────── */
function openChecklistSheet(id) {
  State.activeChecklistSheetId = id;
  _clView = 'sheet';
  renderChecklists();
}
function backToChecklistGrid() {
  _clView = 'grid';
  renderChecklists();
}
function setChecklistFilter(f) {
  _clFilter = f;
  renderChecklists();
}
async function archiveChecklistSheetUI(id) {
  if (State.user?.role === 'viewer') return;
  try {
    await State.updateChecklistSheet(id, { active: false });
    if (_clView === 'sheet') _clView = 'grid';
    renderChecklists();
    toast('Checklist archived');
  } catch(e) { toast('Archive failed: ' + e.message, 'error'); }
}
async function unarchiveChecklistSheetUI(id) {
  if (State.user?.role === 'viewer') return;
  try {
    await State.updateChecklistSheet(id, { active: true });
    renderChecklists();
    toast('Checklist restored');
  } catch(e) { toast('Restore failed: ' + e.message, 'error'); }
}
function toggleClCategory(id) {
  if (_clCollapsed.has(id)) _clCollapsed.delete(id);
  else _clCollapsed.add(id);
  renderChecklists();
}

/* ── Sheet tabs (pipeline-tab style with palette cycling) ── */
function _renderChecklistTabs(sheets, activeId, canEdit) {
  return sheets.map(function(s, idx) {
    const pal      = _PIP_PALETTE[idx % _PIP_PALETTE.length];
    const isActive = s.id === activeId;
    const p        = _clProgress(s.id);
    const bg       = isActive ? pal.active : pal.bg;
    const color    = isActive ? '#fff'     : pal.text;
    const shadow   = isActive ? '0 3px 12px ' + pal.shadow : 'none';
    const border   = isActive ? '2px solid transparent' : '2px solid ' + pal.bg;
    const badge    = p.total > 0
      ? '<span style="font-size:10px;font-family:var(--mono);font-weight:700;padding:1px 7px;border-radius:20px;'
        + 'background:' + (isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.07)') + ';'
        + 'color:' + (isActive ? '#fff' : pal.text) + '">' + p.done + '/' + p.total + '</span>'
      : '';
    return '<div class="pipeline-tab' + (isActive ? ' active' : '') + '"'
      + ' onclick="switchChecklistSheet(\'' + s.id + '\')"'
      + ' style="background:' + bg + ';color:' + color + ';border:' + border + ';box-shadow:' + shadow + '">'
      + '<span>' + esc(s.name) + '</span>'
      + badge
      + '</div>';
  }).join('');
}

function switchChecklistSheet(id) {
  State.activeChecklistSheetId = id;
  renderChecklists();
}

/* ── Tree build & recursive render ──────────────────────── */
function _clTree(sheetId) {
  const byParent = {};
  State.checklistItems
    .filter(i => i.sheetId === sheetId)
    .forEach(function(i) {
      const k = i.parentItemId || 'root';
      (byParent[k] = byParent[k] || []).push(i);
    });
  Object.values(byParent).forEach(a => a.sort((x, y) => x.sortOrder - y.sortOrder));
  return byParent;
}

function _clProgress(sheetId) {
  const items = State.checklistItems.filter(i => i.sheetId === sheetId && i.itemType !== 'category');
  const done  = items.filter(i => i.done).length;
  return { done, total: items.length, pct: items.length ? Math.round(done / items.length * 100) : 0 };
}

/*
 * Progress for one category "section". Categories act as section headers:
 * a category owns every following root-level item up to the next category
 * (plus any legacy true children parented directly to it), and all of their
 * descendants.
 */
function _clSectionProgress(byParent, catId) {
  let done = 0, total = 0;
  const root = byParent['root'] || [];
  const idx  = root.findIndex(x => x.id === catId);
  const walk = function(it) {
    if (it.itemType === 'category') return;
    total++; if (it.done) done++;
    (byParent[it.id] || []).forEach(walk);
  };
  if (idx >= 0) {
    for (let j = idx + 1; j < root.length; j++) {
      if (root[j].itemType === 'category') break;     /* next section starts */
      walk(root[j]);
    }
  }
  (byParent[catId] || []).forEach(walk);              /* legacy true children */
  return { done, total };
}

/* Assign a cycling palette colour to each category in the active sheet */
let _clCatColors = {};
function _clBuildCatColors(byParent) {
  _clCatColors = {};
  let idx = 0;
  (byParent['root'] || []).forEach(function(it) {
    if (it.itemType === 'category') {
      _clCatColors[it.id] = _PIP_PALETTE[idx % _PIP_PALETTE.length];
      idx++;
    }
  });
}

/*
 * Recursive row renderer.
 *  guides   — array (one per ancestor level) of bools: does that ancestor have a following sibling?
 *  catColor — palette object inherited from the enclosing category (null at the bare root level).
 */
function _renderClItems(byParent, parentKey, depth, canEdit, guides, catColor) {
  const sibs = byParent[parentKey] || [];
  /* Track the active section while iterating root-level siblings.
     Categories are section headers: each owns the items that follow it
     until the next category. Collapsing a category hides that whole run. */
  let sectionCat       = catColor;
  let sectionCollapsed = false;
  let out = '';

  sibs.forEach(function(it, i) {
    const isLast = i === sibs.length - 1;
    const kids   = byParent[it.id] || [];

    /* ── Category header row ─────────────────────────────── */
    if (it.itemType === 'category') {
      const pal       = _clCatColors[it.id] || _PIP_PALETTE[0];
      const cp        = _clSectionProgress(byParent, it.id);
      const collapsed = _clCollapsed.has(it.id);
      sectionCat       = pal;
      sectionCollapsed = collapsed;
      out += '<div class="cl-category' + (collapsed ? ' collapsed' : '') + '"'
        + ' style="--cat:' + pal.active + ';background:' + pal.bg + ';color:' + pal.text + '"'
        + (canEdit ? ' draggable="true" ondragstart="clItemDragStart(event,\'' + it.id + '\')"'
          + ' ondragover="clItemDragOver(event)" ondrop="clItemDrop(event,\'' + it.id + '\')" ondragend="clItemDragEnd(event)"' : '')
        + '>'
        + '<button class="cl-cat-toggle" title="' + (collapsed ? 'Expand' : 'Collapse') + '" onclick="toggleClCategory(\'' + it.id + '\')">'
        +   '<i class="ti ti-chevron-' + (collapsed ? 'right' : 'down') + '"></i></button>'
        + (canEdit ? '<span class="cl-handle" title="Drag to reorder"><i class="ti ti-grip-vertical"></i></span>' : '')
        + (canEdit
          ? '<input class="cl-cat-name" id="cl-txt-' + it.id + '" placeholder="Category name…"'
            + ' style="color:' + pal.text + '"'
            + ' onchange="updateChecklistItemText(\'' + it.id + '\', this.value)"'
            + ' onkeydown="if(event.key===\'Enter\')this.blur()">'
          : '<span class="cl-cat-name" id="cl-txt-' + it.id + '"></span>')
        + '<span class="cl-cat-prog">' + cp.done + '/' + cp.total + '</span>'
        + (canEdit
          ? '<span class="cl-cat-acts">'
            + '<button class="cl-row-btn" title="Move up"   onclick="moveChecklistItemUI(\'' + it.id + '\',-1)"><i class="ti ti-chevron-up"></i></button>'
            + '<button class="cl-row-btn" title="Move down" onclick="moveChecklistItemUI(\'' + it.id + '\',1)"><i class="ti ti-chevron-down"></i></button>'
            + '<button class="cl-row-btn" title="Add task"  onclick="addChecklistItemUI(\'' + it.sheetId + '\',\'' + it.id + '\')"><i class="ti ti-plus"></i></button>'
            + '<button class="cl-row-btn cl-del" title="Delete category (and its tasks)" onclick="deleteChecklistItemUI(\'' + it.id + '\')"><i class="ti ti-x"></i></button>'
            + '</span>'
          : '')
        + '</div>';
      /* legacy: items parented directly to the category */
      if (!collapsed) out += _renderClItems(byParent, it.id, 0, canEdit, [], pal);
      return;
    }

    /* Items belonging to a collapsed section are hidden */
    if (sectionCollapsed) return;

    /* ── Task / subtask row ──────────────────────────────── */
    const rowColor = sectionCat;
    const kidsDone = kids.length > 0 && kids.every(k => k.done && k.itemType !== 'category');
    const user     = it.assigneeId ? State.getUser(it.assigneeId) : null;
    const barCss   = rowColor ? 'border-left:3px solid ' + rowColor.active + ';' : '';

    /* tree-guide segments (indentation lives here, Task column only) */
    let guideHtml = '';
    for (let g = 0; g < depth; g++) {
      if (g === depth - 1) guideHtml += '<span class="cl-guide ' + (isLast ? 'elbow' : 'tee') + '"></span>';
      else                 guideHtml += '<span class="cl-guide' + (guides[g] ? ' line' : '') + '"></span>';
    }

    const row = '<div class="cl-item' + (it.done ? ' done' : '') + (kidsDone && !it.done ? ' kids-done' : '') + '"'
      + (canEdit ? ' draggable="true" ondragstart="clItemDragStart(event,\'' + it.id + '\')"'
        + ' ondragover="clItemDragOver(event)" ondrop="clItemDrop(event,\'' + it.id + '\')" ondragend="clItemDragEnd(event)"' : '')
      + '>'

      /* Column 1 — task cell (guides + handle + checkbox + text) */
      + '<div class="cl-task-cell" style="' + barCss + '">'
      +   guideHtml
      +   (canEdit ? '<span class="cl-handle" title="Drag to reorder"><i class="ti ti-grip-vertical"></i></span>' : '')
      +   '<div class="subtask-check' + (it.done ? ' checked' : '') + '"'
      +     (canEdit ? ' onclick="toggleChecklistItemUI(\'' + it.id + '\')"' : '')
      +     ' style="' + (canEdit ? 'cursor:pointer' : 'cursor:default;opacity:0.6') + '">'
      +     (it.done ? '<i class="ti ti-check" style="font-size:9px"></i>' : '')
      +   '</div>'
      +   '<div class="cl-task-main">'
      +     (canEdit
          ? '<input class="subtask-text-input' + (it.done ? ' done' : '') + '" id="cl-txt-' + it.id + '"'
            + ' placeholder="Describe the step…"'
            + ' onchange="updateChecklistItemText(\'' + it.id + '\', this.value)"'
            + ' onkeydown="if(event.key===\'Enter\')this.blur()">'
          : '<span class="subtask-text' + (it.done ? ' done' : '') + '" id="cl-txt-' + it.id + '"></span>')
      +     _clItemMetaHtml(it, canEdit)
      +   '</div>'
      + '</div>'

      /* Column 2 — notes */
      + '<div class="cl-cell cl-notes-cell">'
      +   (canEdit
          ? '<textarea class="cl-celltext" rows="1" id="cl-notes-' + it.id + '" placeholder="Add note…"'
            + ' oninput="_clAutoGrow(this)"'
            + ' onchange="updateChecklistItemNotes(\'' + it.id + '\', this.value)"></textarea>'
          : '<div class="cl-celltext ro" id="cl-notes-' + it.id + '"></div>')
      + '</div>'

      /* Column 3 — comments */
      + '<div class="cl-cell cl-comments-cell">'
      +   (canEdit
          ? '<textarea class="cl-celltext" rows="1" id="cl-comments-' + it.id + '" placeholder="Add comment…"'
            + ' oninput="_clAutoGrow(this)"'
            + ' onchange="updateChecklistItemComments(\'' + it.id + '\', this.value)"></textarea>'
          : '<div class="cl-celltext ro" id="cl-comments-' + it.id + '"></div>')
      + '</div>'

      /* Column 4 — owner */
      + '<div class="cl-owner-cell">'
      +   (user ? assigneeChip(user.id) : '')
      +   (canEdit
          ? '<select class="cl-assignee-sel" onchange="setChecklistItemAssignee(\'' + it.id + '\', this.value)" title="Assign">'
            + '<option value=""' + (!it.assigneeId ? ' selected' : '') + '>—</option>'
            + State.users.map(function(u) {
                return '<option value="' + u.id + '"' + (it.assigneeId === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>';
              }).join('')
            + '</select>'
          : '')
      + '</div>'

      /* Column 5 — actions */
      + '<div class="cl-actions">'
      +   (canEdit
          ? '<button class="cl-row-btn" title="Move up"      onclick="moveChecklistItemUI(\'' + it.id + '\',-1)"><i class="ti ti-chevron-up"></i></button>'
            + '<button class="cl-row-btn" title="Move down"  onclick="moveChecklistItemUI(\'' + it.id + '\',1)"><i class="ti ti-chevron-down"></i></button>'
            + '<button class="cl-row-btn" title="Add sub-item" onclick="addChecklistItemUI(\'' + it.sheetId + '\',\'' + it.id + '\')"><i class="ti ti-plus"></i></button>'
            + '<button class="cl-row-btn cl-del" title="Delete (children too)" onclick="deleteChecklistItemUI(\'' + it.id + '\')"><i class="ti ti-x"></i></button>'
          : '')
      + '</div>'

      + '</div>';

    out += row + _renderClItems(byParent, it.id, depth + 1, canEdit, guides.concat(!isLast), rowColor);
  });
  return out;
}

/* Auto-grow a single-line cell textarea to fit its content */
function _clAutoGrow(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
}

/* Set text/notes/comments values via JS after render — avoids HTML-encoding issues */
function _clHydrateValues(sheetId) {
  State.checklistItems
    .filter(i => i.sheetId === sheetId)
    .forEach(function(i) {
      const txtEl = document.getElementById('cl-txt-' + i.id);
      if (txtEl) {
        if (txtEl.tagName === 'INPUT') txtEl.value = i.text || '';
        else txtEl.textContent = i.text || '';
      }
      const ntEl = document.getElementById('cl-notes-' + i.id);
      if (ntEl) {
        if (ntEl.tagName === 'TEXTAREA') { ntEl.value = i.notes || ''; _clAutoGrow(ntEl); }
        else ntEl.textContent = i.notes || '';
      }
      const cmEl = document.getElementById('cl-comments-' + i.id);
      if (cmEl) {
        if (cmEl.tagName === 'TEXTAREA') { cmEl.value = i.comments || ''; _clAutoGrow(cmEl); }
        else cmEl.textContent = i.comments || '';
      }
    });
}

/* ── Sheet modal (new sheet) ────────────────────────────── */
function _clSheetModalHtml() {
  return '<div class="modal-overlay" id="cl-sheet-modal">'
    + '<div class="modal" style="max-width:420px">'
    + '<div class="modal-head">'
    +   '<div class="modal-title">New checklist sheet</div>'
    +   '<button class="btn btn-ghost btn-sm" onclick="_closeModal(\'cl-sheet-modal\')"><i class="ti ti-x"></i></button>'
    + '</div>'
    + '<div class="modal-body">'
    +   '<div class="form-group">'
    +     '<label class="form-label">Sheet name <span style="color:var(--red)">*</span></label>'
    +     '<input id="cl-sheet-name" class="form-input" placeholder="e.g. Monthly Closing — The Den DXB">'
    +   '</div>'
    +   '<div class="form-group">'
    +     '<label class="form-label">Client <span style="color:var(--ink-4)">(optional)</span></label>'
    +     '<select id="cl-sheet-client" class="form-select">'
    +       '<option value="">No client</option>'
    +       State.clients.filter(c => c.active !== false)
            .map(c => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('')
    +     '</select>'
    +   '</div>'
    + '</div>'
    + '<div class="modal-footer">'
    +   '<button class="btn btn-ghost" onclick="_closeModal(\'cl-sheet-modal\')">Cancel</button>'
    +   '<button class="btn btn-primary" onclick="submitNewChecklistSheet()"><i class="ti ti-circle-check"></i> Create sheet</button>'
    + '</div>'
    + '</div></div>';
}

function openNewChecklistSheetModal() {
  if (State.user?.role === 'viewer') return;
  const nm = document.getElementById('cl-sheet-name');
  const cs = document.getElementById('cl-sheet-client');
  if (nm) nm.value = '';
  if (cs) cs.value = '';
  document.getElementById('cl-sheet-modal')?.classList.add('open');
  setTimeout(function(){ document.getElementById('cl-sheet-name')?.focus(); }, 100);
}

async function submitNewChecklistSheet() {
  if (State.user?.role === 'viewer') return;
  const name     = (document.getElementById('cl-sheet-name')?.value || '').trim();
  const clientId = document.getElementById('cl-sheet-client')?.value || '';
  if (!name) { toast('Please enter a sheet name', 'error'); return; }
  try {
    const sheet = await State.addChecklistSheet({ name, clientId });
    /* Apply a checklist template if one is pending (from the library) */
    if (_clPendingTemplateId) {
      const tplId = _clPendingTemplateId;
      _clPendingTemplateId = null;
      await _clApplyTemplate(sheet.id, tplId);
    }
    State.activeChecklistSheetId = sheet.id;
    _clView = 'sheet';
    _closeModal('cl-sheet-modal');
    renderChecklists();
    toast('Sheet "' + name + '" created!');
  } catch(e) {
    _clPendingTemplateId = null;
    toast('Failed to create sheet: ' + e.message, 'error');
  }
}

/* ── Sheet actions ──────────────────────────────────────── */
async function renameChecklistSheetUI(sheetId) {
  if (State.user?.role === 'viewer') return;
  const sheet = State.checklistSheets.find(s => s.id === sheetId);
  if (!sheet) return;
  const name = prompt('Rename sheet:', sheet.name);
  if (!name || !name.trim() || name.trim() === sheet.name) return;
  try {
    await State.updateChecklistSheet(sheetId, { name: name.trim() });
    renderChecklists();
    toast('Sheet renamed');
  } catch(e) { toast('Rename failed: ' + e.message, 'error'); }
}

async function duplicateChecklistSheetUI(sheetId) {
  if (State.user?.role === 'viewer') return;
  try {
    const newId = await State.duplicateChecklistSheet(sheetId);
    if (newId) {
      State.activeChecklistSheetId = newId;
      renderChecklists();
      toast('Sheet duplicated — all items unchecked. Rename it for the new period.');
    }
  } catch(e) { toast('Duplicate failed: ' + e.message, 'error'); }
}

async function confirmDeleteChecklistSheet(sheetId) {
  if (State.user?.role === 'viewer') return;
  const sheet = State.checklistSheets.find(s => s.id === sheetId);
  if (!sheet) return;
  const count = State.checklistItems.filter(i => i.sheetId === sheetId).length;
  if (!confirm('Delete sheet "' + sheet.name + '" and its ' + count + ' item(s)? This cannot be undone.')) return;
  try {
    await State.deleteChecklistSheet(sheetId);
    State.activeChecklistSheetId = null;
    renderChecklists();
    toast('Sheet deleted', 'error');
  } catch(e) { toast('Delete failed: ' + e.message, 'error'); }
}

/* ── Item actions ───────────────────────────────────────── */
async function toggleChecklistItemUI(itemId) {
  if (State.user?.role === 'viewer') return;
  const item = State.checklistItems.find(i => i.id === itemId);
  if (!item) return;
  try {
    const nowDone = !item.done;
    await State.updateChecklistItem(itemId, { done: nowDone });
    if (item.itemType !== 'category') {
      ClLocal.logActivity(item.sheetId, {
        type: 'done', text: item.text || 'item', to: nowDone,
        user: (State.user && State.user.name) || ''
      });
    }
    renderChecklists();
  } catch(e) { toast('Update failed: ' + e.message, 'error'); }
}

async function updateChecklistItemText(itemId, value) {
  if (State.user?.role === 'viewer') return;
  const text = (value || '').trim();
  if (!text) return;
  try { await State.updateChecklistItem(itemId, { text }); }
  catch(e) { toast('Save failed: ' + e.message, 'error'); }
}

async function updateChecklistItemNotes(itemId, value) {
  if (State.user?.role === 'viewer') return;
  try {
    await State.updateChecklistItem(itemId, { notes: (value || '').trim() });
  } catch(e) { toast('Save failed: ' + e.message, 'error'); }
}

async function updateChecklistItemComments(itemId, value) {
  if (State.user?.role === 'viewer') return;
  try {
    await State.updateChecklistItem(itemId, { comments: (value || '').trim() });
  } catch(e) { toast('Save failed: ' + e.message, 'error'); }
}

async function setChecklistItemAssignee(itemId, userId) {
  if (State.user?.role === 'viewer') return;
  try {
    await State.updateChecklistItem(itemId, { assigneeId: userId || '' });
    renderChecklists();
  } catch(e) { toast('Save failed: ' + e.message, 'error'); }
}

/* Reorder via up/down arrows */
async function moveChecklistItemUI(itemId, dir) {
  if (State.user?.role === 'viewer') return;
  try {
    const moved = await State.moveChecklistItem(itemId, dir);
    if (moved) renderChecklists();
  } catch(e) { toast('Move failed: ' + e.message, 'error'); }
}

/* Reorder via drag & drop */
let _clDragId = null;
function clItemDragStart(e, id) {
  _clDragId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
  setTimeout(() => e.currentTarget?.classList.add('dragging'), 0);
}
function clItemDragEnd(e) {
  e.currentTarget?.classList.remove('dragging');
  document.querySelectorAll('.cl-item.drag-over, .cl-category.drag-over')
    .forEach(el => el.classList.remove('drag-over'));
}
function clItemDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}
async function clItemDrop(e, targetId) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  if (!_clDragId || _clDragId === targetId) { _clDragId = null; return; }
  const id = _clDragId;
  _clDragId = null;
  try {
    const ok = await State.reorderChecklistItemDrop(id, targetId);
    if (ok) renderChecklists();
  } catch(err) { toast('Reorder failed: ' + err.message, 'error'); }
}

async function addChecklistItemUI(sheetId, parentItemId, itemType) {
  if (State.user?.role === 'viewer') return;
  try {
    const item = await State.addChecklistItem(sheetId, parentItemId, '', itemType);
    renderChecklists();
    setTimeout(function() {
      document.getElementById('cl-txt-' + item.id)?.focus();
    }, 60);
  } catch(e) { toast('Add failed: ' + e.message, 'error'); }
}

async function deleteChecklistItemUI(itemId) {
  if (State.user?.role === 'viewer') return;
  const kids = State.checklistItems.filter(i => i.parentItemId === itemId).length;
  const msg  = kids > 0
    ? 'Delete this item and its ' + kids + ' sub-item(s)?'
    : 'Delete this item?';
  if (!confirm(msg)) return;
  try {
    await State.deleteChecklistItem(itemId);
    renderChecklists();
  } catch(e) { toast('Delete failed: ' + e.message, 'error'); }
}
