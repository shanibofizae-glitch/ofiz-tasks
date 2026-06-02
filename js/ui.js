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

/* ── Date formatter ─────────────────────────────────────── */
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

  return `
  <div class="task-card ${done ? 'done' : ''} ${over ? 'overdue' : ''}"
       data-id="${task.id}" onclick="openTaskModal('${task.id}')">
    <div class="task-row">
      <div class="task-check ${done ? 'checked' : ''}"
           onclick="event.stopPropagation();${done ? '' : canClose ? `quickClose('${task.id}')` : ''}"
           title="${done ? 'Completed' : canClose ? 'Mark done' : 'Read only'}">
        ${done ? '<i class="ti ti-check" style="font-size:9px"></i>' : ''}
      </div>
      <div class="task-body">
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
          ${clientTag(task.clientId)}
          ${typeTag(task.type)}
          ${statusTag(task.status, task.dueDate)}
          ${priorityTag(task.priority)}
          <span class="task-due ${over ? 'late' : ''}">
            <i class="ti ti-calendar-event" style="font-size:10px;vertical-align:-1px"></i>
            ${fmtDate(task.dueDate)}
          </span>
        </div>
      </div>
      <div class="task-actions-col">
        ${assigneeChip(task.assigneeId)}
        ${!done && canClose
          ? `<button class="btn btn-success btn-sm"
               onclick="event.stopPropagation();openTaskModal('${task.id}','close')">
               <i class="ti ti-circle-check"></i> Close
             </button>`
          : ''}
      </div>
    </div>
  </div>`;
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

  renderTaskList(priority, 'dash-task-list');

  const od = State.overdueTasks().length;
  document.querySelectorAll('.badge-overdue').forEach(el => {
    el.textContent  = od || '';
    el.style.display = od ? '' : 'none';
  });
}

/* ── All tasks page ─────────────────────────────────────── */
let taskFilter = { status:'all', type:'all', clientId:'all', search:'' };

function renderAllTasks() {
  const tasks = State.filterTasks(taskFilter);
  renderTaskList(tasks, 'all-task-list');
  const lbl = document.getElementById('task-count-label');
  if (lbl) lbl.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
}

function setFilter(key, val, el) {
  taskFilter[key] = val;
  if (el) {
    el.closest('.filter-bar').querySelectorAll('.filter-chip').forEach(c => c.classList.remove('on'));
    el.classList.add('on');
  }
  renderAllTasks();
}

/* ── Clients page ───────────────────────────────────────── */
function renderClients() {
  const el     = document.getElementById('client-grid');
  if (!el) return;
  const health = State.clientHealth();
  el.innerHTML = health.map(c => `
    <div class="client-card" onclick="filterByClient('${c.id}')">
      <div class="client-initial" style="background:${c.bg};color:${c.color}">${c.short}</div>
      <div class="client-name">${c.name}</div>
      <div class="client-stats">
        <span>${c.total} task${c.total !== 1 ? 's' : ''} total</span>
        <span style="color:var(--accent)">${c.done} completed</span>
        ${c.overdue ? `<span style="color:var(--red)">${c.overdue} overdue</span>` : ''}
      </div>
      <div class="progress-wrap">
        <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--ink-3)">
          <span>Completion</span><span style="font-family:var(--mono)">${c.pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"
               style="width:${c.pct}%;background:${c.overdue ? 'var(--amber)' : 'var(--accent)'}"></div>
        </div>
      </div>
    </div>`).join('');
}

function filterByClient(clientId) {
  taskFilter.clientId = clientId;
  taskFilter.status   = 'all';
  taskFilter.type     = 'all';
  showPage('tasks', document.querySelector('[data-page=tasks]'));
  setTimeout(renderAllTasks, 50);
}

/* ── New client modal ───────────────────────────────────── */
function openNewClientModal() {
  document.getElementById('cf-name').value  = '';
  document.getElementById('cf-short').value = '';
  document.getElementById('cf-color').value = '#4f8ef7';
  document.getElementById('client-form-modal').classList.add('open');
}

function closeClientForm() {
  document.getElementById('client-form-modal').classList.remove('open');
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

  if (!name || !short) {
    toast('Please fill in name and short code', 'error');
    return;
  }
  if (short.length < 2) {
    toast('Short code must be at least 2 letters', 'error');
    return;
  }
  if (State.clients.find(c => c.short === short)) {
    toast(`Short code "${short}" is already used`, 'error');
    return;
  }

  const saveBtn = document.querySelector('#client-form-modal .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  const bg = hexToRgba(color, 0.12);
  const newClient = {
    id:     'c' + Date.now(),
    name,
    short,
    color,
    bg,
    active: true,
  };

  State.clients.push(newClient);

  /* Write to Google Sheets Clients tab */
  if (State.useSheets) {
    await Sheets._post({
      action: 'append',
      tab:    'Clients',
      row:    [newClient.id, newClient.name, newClient.short, newClient.color, newClient.bg, 'true'],
    });
  }

  if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="ti ti-circle-check"></i> Add client'; }
  closeClientForm();
  populateFormDropdowns();
  renderClients();
  toast(`Client "${name}" added!`);
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
  const el = document.getElementById('template-list');
  if (!el) return;
  el.innerHTML = State.templates.map(tp => {
    const client   = State.getClient(tp.clientId);
    const recLabel = { daily:'Every day', weekly:`Every ${tp.dayOfWeek||'Mon'}`, monthly:`Day ${tp.dayOfMonth} of each month` };
    return `
    <div class="task-card" style="cursor:default">
      <div class="task-row">
        <div style="color:var(--ink-3);flex-shrink:0;font-size:16px;margin-top:1px">
          <i class="ti ti-repeat"></i>
        </div>
        <div class="task-body">
          <div class="task-title">${tp.title}</div>
          <div class="task-meta">
            ${client ? `<span class="tag tag-client" style="color:${client.color};background:${client.bg}">${client.short}</span>` : ''}
            <span class="tag tag-${tp.recurrence}">${tp.recurrence.charAt(0).toUpperCase()+tp.recurrence.slice(1)}</span>
            <span style="font-size:11px;color:var(--ink-3)">${recLabel[tp.recurrence]||''}</span>
          </div>
        </div>
        <div class="task-actions-col">
          ${assigneeChip(tp.assigneeId)}
          <span style="font-size:10.5px;padding:3px 9px;border-radius:20px;font-weight:600;
            ${tp.active
              ? 'background:var(--green-light);color:var(--green)'
              : 'background:var(--bg);color:var(--ink-3);border:1px solid var(--border-md)'}">
            ${tp.active ? 'Active' : 'Paused'}
          </span>
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

  document.getElementById('modal-task-title').textContent = task.title;

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
    </div>

    ${task.notes ? `
      <p style="font-size:13px;color:var(--ink-2);margin-bottom:18px;line-height:1.65;
        padding:12px 14px;background:var(--bg);border-radius:var(--radius-sm);
        border-left:2px solid var(--border-md)">${task.notes}</p>` : ''}

    ${comments.length ? `
      <div class="section-title" style="margin-bottom:12px">Comments</div>
      <div class="comment-thread">
        ${comments.map(cm => {
          const u = State.getUser(cm.userId);
          return `<div class="comment-item">
            <div class="avatar ${u?.avClass||'av-admin'}" style="width:26px;height:26px;font-size:9px;flex-shrink:0">${u?.initials||'?'}</div>
            <div class="comment-body">
              <span class="comment-who">${u?.name||'Unknown'}</span>
              <span class="comment-when">${cm.createdAt}</span>
              <div class="comment-text">${cm.text}</div>
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
  `;

  document.getElementById('modal-task-footer').innerHTML = `
    <span style="font-size:11px;color:var(--ink-3);font-family:var(--mono)">
      Created ${fmtDate(task.createdAt)}
    </span>
    <div style="display:flex;gap:7px">
      ${canEdit ? `<button class="btn btn-ghost btn-sm" onclick="openEditModal('${task.id}')">
        <i class="ti ti-edit"></i> Edit
      </button>` : ''}
      ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">
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
  document.getElementById('task-form-modal').classList.add('open');
}

function openEditModal(taskId) {
  editTaskId = taskId;
  const task = State.getTask(taskId);
  if (!task) return;
  closeTaskModal();
  document.getElementById('task-form-title').textContent = 'Edit task';
  document.getElementById('tf-title').value    = task.title;
  document.getElementById('tf-client').value   = task.clientId;
  document.getElementById('tf-assignee').value = task.assigneeId;
  document.getElementById('tf-type').value     = task.type;
  document.getElementById('tf-priority').value = task.priority;
  document.getElementById('tf-due').value      = task.dueDate;
  document.getElementById('tf-notes').value    = task.notes || '';
  document.getElementById('task-form-modal').classList.add('open');
}

function closeTaskForm() {
  document.getElementById('task-form-modal').classList.remove('open');
  editTaskId = null;
}

async function submitTaskForm() {
  const title      = document.getElementById('tf-title').value.trim();
  const clientId   = document.getElementById('tf-client').value;
  const assigneeId = document.getElementById('tf-assignee').value;
  const type       = document.getElementById('tf-type').value;
  const priority   = document.getElementById('tf-priority').value;
  const dueDate    = document.getElementById('tf-due').value;
  const notes      = document.getElementById('tf-notes').value.trim();

  if (!title || !clientId || !assigneeId || !dueDate) {
    toast('Please fill in all required fields', 'error'); return;
  }

  const saveBtn = document.querySelector('#task-form-modal .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  if (editTaskId) {
    await State.updateTask(editTaskId, { title, clientId, assigneeId, type, priority, dueDate, notes });
    toast('Task updated!');
  } else {
    await State.addTask({ title, clientId, assigneeId, type, priority, dueDate, notes, status:'pending' });
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

  clientSel.innerHTML = `<option value="">Select client…</option>` +
    State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  assigneeSel.innerHTML = `<option value="">Assign to…</option>` +
    State.users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('');

  if (filterSel) {
    filterSel.innerHTML = `<option value="all">All clients</option>` +
      State.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    filterSel.onchange = e => { taskFilter.clientId = e.target.value; renderAllTasks(); };
  }
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
  renderKanbanBoard(State.activePipelineId);
}

function renderPipelineTabs() {
  const el = document.getElementById('pipeline-tabs');
  if (!el) return;
  el.innerHTML = State.pipelines.map(p => `
    <div class="pipeline-tab ${p.id === State.activePipelineId ? 'active' : ''}"
         onclick="switchPipeline('${p.id}')">
      ${p.name}
    </div>`).join('');
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

  const stages = State.getStages(pipelineId);
  const pipeTasks = State.getPipeTasks(pipelineId);
  const today = new Date().toISOString().slice(0,10);
  const canEdit = State.user?.role !== 'viewer';

  if (!stages.length) {
    wrap.innerHTML = `<div class="pipeline-empty"><i class="ti ti-columns"></i><p>No stages defined for this pipeline.</p></div>`;
    return;
  }

  wrap.innerHTML = `<div class="kanban-board">${stages.map((stage, idx) => {
    const cards = pipeTasks.filter(t => t.pipelineStageId === stage.id);
    const isLast = idx === stages.length - 1;

    return `
    <div class="kanban-col">
      <div class="kanban-col-head">
        <span class="kanban-col-title">${stage.name}</span>
        <span class="kanban-col-count">${cards.length}</span>
      </div>
      <div class="kanban-col-body">
        ${cards.length ? cards.map(task => renderKanbanCard(task, stage, stages, today, canEdit)).join('') : `
          <div style="text-align:center;padding:20px 10px;font-size:12px;color:var(--ink-4)">No tasks</div>`}
      </div>
      ${canEdit ? `<button class="kanban-add-card" onclick="openPipeTaskModal('${pipelineId}','${stage.id}')">
        <i class="ti ti-plus"></i> Add task
      </button>` : ''}
    </div>`;
  }).join('')}</div>`;
}

function renderKanbanCard(task, currentStage, allStages, today, canEdit) {
  const over   = task.status !== 'done' && task.dueDate < today;
  const done   = task.status === 'done';
  const client = State.getClient(task.clientId);
  const user   = State.getUser(task.assigneeId);
  const stageIdx = allStages.findIndex(s => s.id === currentStage.id);
  const prevStage = allStages[stageIdx - 1];
  const nextStage = allStages[stageIdx + 1];

  return `
  <div class="kanban-card ${over ? 'overdue' : ''} ${done ? 'done' : ''}"
       onclick="openTaskModal('${task.id}')">
    <div class="kanban-card-title">${task.title}</div>
    <div class="kanban-card-meta">
      ${client ? `<span class="tag tag-client" style="color:${client.color};background:${client.bg}">${client.short}</span>` : ''}
      ${priorityTag(task.priority)}
      ${over ? `<span class="tag tag-overdue">Overdue</span>` : ''}
    </div>
    <div class="kanban-card-foot">
      <span class="kanban-due ${over ? 'late' : ''}">${fmtDate(task.dueDate)}</span>
      ${user ? `<div class="assign-chip ${user.avClass}" title="${user.name}">${user.initials}</div>` : ''}
    </div>
    ${canEdit && !done ? `
    <div style="display:flex;gap:5px;margin-top:8px;border-top:1px solid var(--border);padding-top:7px">
      ${prevStage ? `<button class="stage-move-btn" onclick="event.stopPropagation();moveCard('${task.id}','${prevStage.id}')">
        <i class="ti ti-arrow-left" style="font-size:11px"></i> ${prevStage.name}
      </button>` : ''}
      ${nextStage ? `<button class="stage-move-btn" style="margin-left:auto" onclick="event.stopPropagation();moveCard('${task.id}','${nextStage.id}')">
        ${nextStage.name} <i class="ti ti-arrow-right" style="font-size:11px"></i>
      </button>` : `<span style="margin-left:auto;font-size:11px;color:var(--green);font-weight:500">
        <i class="ti ti-check" style="font-size:11px"></i> Final stage
      </span>`}
    </div>` : ''}
  </div>`;
}

async function moveCard(taskId, stageId) {
  await State.moveTaskStage(taskId, stageId);
  toast('Task moved!');
  renderKanbanBoard(State.activePipelineId);
}

/* ── New pipeline modal ─────────────────────────────────── */
let stageCount = 0;

function openNewPipelineModal() {
  stageCount = 0;
  document.getElementById('pf-name').value = '';
  document.getElementById('pf-desc').value = '';
  document.getElementById('stage-list').innerHTML = '';
  addStageInput('');
  addStageInput('');
  addStageInput('');
  document.getElementById('pipeline-form-modal').classList.add('open');
  setTimeout(() => document.getElementById('pf-name').focus(), 100);
}

function closePipelineModal() {
  document.getElementById('pipeline-form-modal').classList.remove('open');
}

function addStageInput(val = '') {
  stageCount++;
  const id = 'stage-inp-' + stageCount;
  const item = document.createElement('div');
  item.className = 'stage-item';
  item.id = 'stage-item-' + stageCount;
  item.innerHTML = `
    <i class="ti ti-grip-vertical stage-item-drag" aria-hidden="true"></i>
    <input type="text" id="${id}" placeholder="Stage name e.g. Documents collected" value="${val}">
    <button class="stage-item-del" onclick="removeStageItem('stage-item-${stageCount}')" aria-label="Remove stage">
      <i class="ti ti-trash" aria-hidden="true"></i>
    </button>`;
  document.getElementById('stage-list').appendChild(item);
}

function removeStageItem(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

async function submitPipelineForm() {
  const name = document.getElementById('pf-name').value.trim();
  const desc = document.getElementById('pf-desc').value.trim();
  if (!name) { toast('Please enter a pipeline name', 'error'); return; }

  const stageInputs = document.querySelectorAll('#stage-list input[type=text]');
  const stageNames  = Array.from(stageInputs).map(i => i.value.trim()).filter(Boolean);
  if (stageNames.length < 2) { toast('Add at least 2 stages', 'error'); return; }

  const btn = document.querySelector('#pipeline-form-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Saving…'; }

  const pipeline = await State.addPipeline(name, desc, stageNames);
  State.activePipelineId = pipeline.id;

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-circle-check"></i> Save pipeline'; }
  closePipelineModal();
  renderPipelinesPage();
  toast(`Pipeline "${name}" created!`);
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
