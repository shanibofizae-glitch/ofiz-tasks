/* ═══════════════════════════════════════════════════════════
   OFIZ Tasks — Checklist extended fields (LOCAL-FIRST)
   ───────────────────────────────────────────────────────────
   Adds richer checklist data — per-item status & due dates,
   sheet priority/metadata, and an activity feed — WITHOUT
   touching the Supabase write path. Everything here persists in
   localStorage, so it never breaks cloud sync of the core
   columns (text / notes / done / assignee).

   Field names mirror the future DB columns so promoting this to
   real Supabase columns later is a straight copy:
     items  → { status, dueDate, description }
     sheets → { priority, projectCode, manager }
   Loaded after data.js, before ui.js.
   ═══════════════════════════════════════════════════════════ */

const ClLocal = {
  _KEY: 'ofiz_cl_ext_v1',
  _cache: null,

  _load() {
    if (this._cache) return this._cache;
    let c = {};
    try { c = JSON.parse(localStorage.getItem(this._KEY) || '{}'); } catch (e) { c = {}; }
    c.items    = c.items    || {};
    c.sheets   = c.sheets   || {};
    c.activity = c.activity || {};
    this._cache = c;
    return c;
  },
  _save() {
    try { localStorage.setItem(this._KEY, JSON.stringify(this._cache)); } catch (e) { /* quota / private mode */ }
  },

  /* ── Per-item extended fields ─────────────────────────── */
  item(id)            { return this._load().items[id] || {}; },
  setItem(id, patch)  {
    const d = this._load();
    d.items[id] = Object.assign({}, d.items[id], patch);
    this._save();
  },
  removeItem(id)      { const d = this._load(); delete d.items[id]; this._save(); },

  /* ── Per-sheet extended fields ────────────────────────── */
  sheet(id)           { return this._load().sheets[id] || {}; },
  setSheet(id, patch) {
    const d = this._load();
    d.sheets[id] = Object.assign({}, d.sheets[id], patch);
    this._save();
  },

  /* ── Activity feed (per sheet, newest first) ──────────── */
  activity(sheetId)   { return this._load().activity[sheetId] || []; },
  logActivity(sheetId, entry) {
    if (!sheetId) return;
    const d = this._load();
    const list = d.activity[sheetId] = d.activity[sheetId] || [];
    list.unshift(Object.assign({ at: Date.now() }, entry));
    d.activity[sheetId] = list.slice(0, 60);   /* cap history */
    this._save();
  },
};

/* ── Status model ───────────────────────────────────────── */
const CL_STATUS = {
  progress: { label: 'In Progress', cls: 'cl-st-progress' },
  blocked:  { label: 'Blocked',     cls: 'cl-st-blocked'  },
};
const CL_STATUS_CYCLE = ['todo', 'progress', 'blocked'];

/* ── Date helpers ───────────────────────────────────────── */
function _clTodayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}
function _clFmtDate(s) {
  if (!s) return '';
  const parts = s.split('-').map(Number);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parts[1] - 1] || '';
  return mo + ' ' + parts[2];
}

/* ── Item meta renderer (due chip + status badge) ───────── */
function _clItemMetaHtml(it, canEdit) {
  const ext       = it;   /* status / dueDate now live on the item itself (Supabase-synced) */
  const overdue   = !it.done && ext.dueDate && ext.dueDate < _clTodayStr();
  const hasStatus = !!(ext.status && ext.status !== 'todo');
  const hasContent = it.done || !!ext.dueDate || hasStatus;

  /* Viewers with nothing set get no meta line at all */
  if (!canEdit && !hasContent) return '';

  /* Empty + editable → collapsed line that reveals Due/Status prompts on hover */
  let html = '<span class="cl-meta' + (hasContent ? '' : ' cl-meta-empty') + '">';

  /* Due date — native picker overlaid on a compact chip */
  if (canEdit) {
    html += '<label class="cl-due' + (ext.dueDate ? ' set' : '') + (overdue ? ' overdue' : '') + '" title="Set due date">'
      +   '<i class="ti ti-' + (overdue ? 'alert-triangle' : 'calendar') + '"></i>'
      +   '<span class="cl-due-label">' + (ext.dueDate ? _clFmtDate(ext.dueDate) : 'Due') + '</span>'
      +   '<input type="date" class="cl-due-input" value="' + (ext.dueDate || '') + '"'
      +     ' onchange="setClDueDate(\'' + it.id + '\', this.value)">'
      + '</label>';
  } else if (ext.dueDate) {
    html += '<span class="cl-due set' + (overdue ? ' overdue' : '') + '">'
      +   '<i class="ti ti-' + (overdue ? 'alert-triangle' : 'calendar') + '"></i>'
      +   '<span class="cl-due-label">' + _clFmtDate(ext.dueDate) + '</span></span>';
  }

  /* Status badge — DONE follows the checkbox; otherwise click to cycle */
  if (it.done) {
    html += '<span class="cl-status cl-st-done">Done</span>';
  } else {
    const st = (ext.status && ext.status !== 'todo') ? CL_STATUS[ext.status] : null;
    if (canEdit) {
      html += '<button class="cl-status ' + (st ? st.cls : 'cl-st-todo') + '"'
        +   ' onclick="cycleClStatus(\'' + it.id + '\')" title="Click to change status">'
        +   (st ? st.label : 'Status') + '</button>';
    } else if (st) {
      html += '<span class="cl-status ' + st.cls + '">' + st.label + '</span>';
    }
  }

  html += '</span>';
  return html;
}

/* ── Actions (global, called from inline handlers) ──────── */
function cycleClStatus(id) {
  if (State.user && State.user.role === 'viewer') return;
  const it = State.checklistItems.find(x => x.id === id);
  if (!it) return;
  const next = CL_STATUS_CYCLE[(CL_STATUS_CYCLE.indexOf(it.status || 'todo') + 1) % CL_STATUS_CYCLE.length];
  State.updateChecklistItem(id, { status: next })
    .catch(function (e) { toast('Save failed: ' + e.message, 'error'); });
  ClLocal.logActivity(it.sheetId, {
    type: 'status', text: it.text || 'item', to: next,
    user: (State.user && State.user.name) || ''
  });
  if (typeof renderChecklists === 'function') renderChecklists();
}

function setClDueDate(id, val) {
  if (State.user && State.user.role === 'viewer') return;
  const it = State.checklistItems.find(x => x.id === id);
  if (!it) return;
  State.updateChecklistItem(id, { dueDate: val || '' })
    .catch(function (e) { toast('Save failed: ' + e.message, 'error'); });
  ClLocal.logActivity(it.sheetId, {
    type: 'due', text: it.text || 'item', to: val || '',
    user: (State.user && State.user.name) || ''
  });
  if (typeof renderChecklists === 'function') renderChecklists();
}

function toggleSheetPriority(id) {
  if (State.user && State.user.role === 'viewer') return;
  const s = State.checklistSheets.find(x => x.id === id);
  if (!s) return;
  State.updateChecklistSheet(id, { priority: !s.priority })
    .catch(function (e) { toast('Save failed: ' + e.message, 'error'); });
  if (typeof renderChecklists === 'function') renderChecklists();
}

/* ═══════════════════════════════════════════════════════════
   DETAIL SIDEBAR — progress donut + assignees + activity feed
   ═══════════════════════════════════════════════════════════ */

function _clRelTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts, MIN = 60000, HR = 3600000, DAY = 86400000;
  if (diff < MIN)     return 'just now';
  if (diff < HR)      return Math.floor(diff / MIN) + 'm ago';
  if (diff < DAY)     return Math.floor(diff / HR) + 'h ago';
  if (diff < 2 * DAY) return 'yesterday';
  if (diff < 7 * DAY) return Math.floor(diff / DAY) + 'd ago';
  const dt = new Date(ts);
  return _clFmtDate(dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'));
}

/* SVG progress ring */
function _clDonutHtml(pct, done, total) {
  const r = 32, circ = 2 * Math.PI * r, off = circ * (1 - pct / 100);
  return '<div class="cl-donut-wrap">'
    + '<svg class="cl-donut" viewBox="0 0 80 80">'
    +   '<circle class="cl-donut-bg" cx="40" cy="40" r="' + r + '"></circle>'
    +   '<circle class="cl-donut-fg" cx="40" cy="40" r="' + r + '"'
    +     ' stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>'
    +   '<text class="cl-donut-pct" x="40" y="40">' + pct + '%</text>'
    + '</svg>'
    + '<div class="cl-donut-cap"><strong>' + done + '</strong> / ' + total + ' tasks done</div>'
    + '</div>';
}

/* Assignees derived from the union of item owners in the sheet */
function _clAssigneesHtml(sheetId) {
  const counts = {};
  State.checklistItems
    .filter(i => i.sheetId === sheetId && i.assigneeId && i.itemType !== 'category')
    .forEach(i => { counts[i.assigneeId] = (counts[i.assigneeId] || 0) + 1; });
  const ids = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  if (!ids.length) {
    return '<div class="cl-side-empty">No one assigned yet — use the Owner column to assign tasks.</div>';
  }
  const roleLabel = { admin: 'Admin', assistant: 'Assistant', viewer: 'Viewer' };
  const shown = ids.slice(0, 5);
  let html = shown.map(function (id) {
    const u = State.getUser(id);
    if (!u) return '';
    const n = counts[id];
    return '<div class="cl-assignee-row">'
      + (typeof assigneeChip === 'function' ? assigneeChip(u.id) : '')
      + '<div class="cl-assignee-meta">'
      +   '<div class="cl-assignee-name">' + esc(u.name) + '</div>'
      +   '<div class="cl-assignee-role">' + (roleLabel[u.role] || u.role || 'Member') + ' · ' + n + ' task' + (n === 1 ? '' : 's') + '</div>'
      + '</div></div>';
  }).join('');
  if (ids.length > shown.length) {
    html += '<div class="cl-assignee-more">+' + (ids.length - shown.length) + ' more collaborators</div>';
  }
  return html;
}

/* Activity feed from ClLocal */
function _clActivityHtml(sheetId) {
  const list = ClLocal.activity(sheetId);
  if (!list.length) {
    return '<div class="cl-side-empty">No activity yet. Status changes, due dates, and completions appear here.</div>';
  }
  const icon = { status: 'ti-flag', due: 'ti-calendar', done: 'ti-circle-check', text: 'ti-pencil' };
  return list.slice(0, 14).map(function (a) {
    let desc;
    if      (a.type === 'status') desc = 'set status to <strong>' + (CL_STATUS[a.to] ? CL_STATUS[a.to].label : a.to) + '</strong>';
    else if (a.type === 'due')    desc = a.to ? 'set due <strong>' + _clFmtDate(a.to) + '</strong>' : 'cleared the due date';
    else if (a.type === 'done')   desc = a.to ? '<strong>completed</strong>' : 'reopened';
    else                          desc = esc(a.to || '');
    return '<div class="cl-act">'
      + '<span class="cl-act-icon"><i class="ti ' + (icon[a.type] || 'ti-point') + '"></i></span>'
      + '<div class="cl-act-body">'
      +   '<div class="cl-act-text"><strong>' + esc(a.user || 'Someone') + '</strong> ' + desc
      +     (a.text ? ' <span class="cl-act-item">' + esc(a.text) + '</span>' : '') + '</div>'
      +   '<div class="cl-act-time">' + _clRelTime(a.at) + '</div>'
      + '</div></div>';
  }).join('');
}

/* Full sidebar */
function _clSidebarHtml(sheetId) {
  const p = _clProgress(sheetId);
  return '<aside class="cl-detail-side">'
    + '<div class="cl-side-card">'
    +   '<div class="cl-side-title">Overall Progress</div>'
    +   _clDonutHtml(p.pct, p.done, p.total)
    + '</div>'
    + '<div class="cl-side-card">'
    +   '<div class="cl-side-title">Assignees</div>'
    +   _clAssigneesHtml(sheetId)
    + '</div>'
    + '<div class="cl-side-card">'
    +   '<div class="cl-side-title">Activity</div>'
    +   '<div class="cl-act-feed">' + _clActivityHtml(sheetId) + '</div>'
    + '</div>'
    + '</aside>';
}

/* ═══════════════════════════════════════════════════════════
   PHASE 3 — Daily Wins · Templates library · sheet metadata
   ═══════════════════════════════════════════════════════════ */

/* ── Template store (extends ClLocal) ───────────────────── */
ClLocal.templates      = function ()    { const d = this._load(); return (d.templates = d.templates || []); };
ClLocal.addTemplate    = function (t)   { const d = this._load(); (d.templates = d.templates || []).unshift(t); this._save(); };
ClLocal.removeTemplate = function (id)  { const d = this._load(); d.templates = (d.templates || []).filter(t => t.id !== id); this._save(); };

/* Built-in starter frameworks (accounting / compliance) */
const CL_BUILTIN_TEMPLATES = [
  { id: 'tpl-monthly-close', name: 'Monthly Close', desc: 'Standard month-end accounting close', builtin: true, items: [
    { itemType: 'category', text: 'Bank & Cash' },
    { itemType: 'task', text: 'Reconcile all bank accounts' },
    { itemType: 'task', text: 'Post bank charges & interest' },
    { itemType: 'category', text: 'Payables & Receivables' },
    { itemType: 'task', text: 'Review AP aging' },
    { itemType: 'task', text: 'Review AR aging & follow up' },
    { itemType: 'category', text: 'Journals & Review' },
    { itemType: 'task', text: 'Post accruals & prepayments' },
    { itemType: 'task', text: 'Post depreciation' },
    { itemType: 'task', text: 'Review P&L vs prior month' },
    { itemType: 'task', text: 'Prepare management report' },
  ] },
  { id: 'tpl-vat-return', name: 'VAT Return (UAE)', desc: 'Quarterly FTA VAT filing', builtin: true, items: [
    { itemType: 'category', text: 'Preparation' },
    { itemType: 'task', text: 'Reconcile output VAT (sales)' },
    { itemType: 'task', text: 'Reconcile input VAT (purchases)' },
    { itemType: 'task', text: 'Check reverse-charge entries' },
    { itemType: 'category', text: 'Filing' },
    { itemType: 'task', text: 'Prepare VAT 201 return' },
    { itemType: 'task', text: 'Internal review & approval' },
    { itemType: 'task', text: 'Submit on FTA portal' },
    { itemType: 'task', text: 'Arrange payment' },
  ] },
  { id: 'tpl-client-onboarding', name: 'Client Onboarding', desc: 'New accounting client setup', builtin: true, items: [
    { itemType: 'category', text: 'Documentation' },
    { itemType: 'task', text: 'Signed engagement letter' },
    { itemType: 'task', text: 'Trade license & ownership docs' },
    { itemType: 'task', text: 'Bank account details' },
    { itemType: 'category', text: 'System Setup' },
    { itemType: 'task', text: 'Create client in accounting system' },
    { itemType: 'task', text: 'Set up chart of accounts' },
    { itemType: 'task', text: 'Import opening balances' },
    { itemType: 'category', text: 'Handover' },
    { itemType: 'task', text: 'Assign account manager' },
    { itemType: 'task', text: 'Schedule kickoff meeting' },
  ] },
];

function _clAllTemplates() {
  return ClLocal.templates().concat(CL_BUILTIN_TEMPLATES);
}

/* Create a sheet's items from a template (preserves order) */
async function _clApplyTemplate(sheetId, tplId) {
  const tpl = _clAllTemplates().find(t => t.id === tplId);
  if (!tpl) return;
  for (let i = 0; i < tpl.items.length; i++) {
    await State.addChecklistItem(sheetId, null, tpl.items[i].text, tpl.items[i].itemType);
  }
}

/* ── Daily Wins ─────────────────────────────────────────── */
function _clDailyStats() {
  const today = _clTodayStr();
  const items = State.checklistItems.filter(function (i) {
    if (i.itemType === 'category') return false;
    const sh = State.checklistSheets.find(s => s.id === i.sheetId);
    return sh && sh.active !== false;
  });
  let done = 0, dueToday = 0, overdue = 0;
  items.forEach(function (i) {
    if (i.done) { done++; return; }
    const due = i.dueDate;
    if (due === today) dueToday++;
    else if (due && due < today) overdue++;
  });
  const total = items.length;
  return { done, total, pct: total ? Math.round(done / total * 100) : 0, dueToday, overdue };
}

function _clDailyWinsHtml() {
  const st = _clDailyStats();
  const active = State.checklistSheets.filter(s => s.active !== false);
  const tags = active.slice(0, 3).map(function (s) {
    return '<button class="cl-win-tag" onclick="openChecklistSheet(\'' + s.id + '\')">' + esc(s.name) + '</button>';
  }).join('');
  const more = active.length > 3 ? '<span class="cl-win-more">+' + (active.length - 3) + ' more</span>' : '';

  let sub;
  if (st.dueToday || st.overdue) {
    sub = [
      st.dueToday ? st.dueToday + ' due today' : '',
      st.overdue  ? '<span class="cl-win-overdue">' + st.overdue + ' overdue</span>' : ''
    ].filter(Boolean).join(' · ');
  } else {
    sub = st.total ? 'Nothing due today — you\'re all caught up 🎉' : 'Create a checklist to start tracking.';
  }

  return '<div class="cl-hero-card cl-win-card">'
    + _clDonutHtml(st.pct, st.done, st.total)
    + '<div class="cl-win-body">'
    +   '<div class="cl-win-title">Daily Wins</div>'
    +   '<div class="cl-win-sub">' + sub + '</div>'
    +   (tags ? '<div class="cl-win-tags">' + tags + more + '</div>' : '')
    + '</div>'
    + '</div>';
}

/* ── Templates card (landing hero) ──────────────────────── */
function _clTemplatesCardHtml(canEdit) {
  const n = _clAllTemplates().length;
  return '<div class="cl-hero-card cl-tpl-card" onclick="openClTemplates()">'
    + '<div class="cl-tpl-icon"><i class="ti ti-template"></i></div>'
    + '<div class="cl-tpl-body">'
    +   '<div class="cl-win-title">Templates</div>'
    +   '<div class="cl-win-sub">Reusable audit &amp; compliance frameworks. ' + n + ' available.</div>'
    +   '<button class="btn btn-ghost btn-sm cl-tpl-browse" onclick="event.stopPropagation();openClTemplates()">Browse library</button>'
    + '</div>'
    + '</div>';
}

/* ── Templates modal ────────────────────────────────────── */
function _clTemplatesModalHtml() {
  const user = ClLocal.templates();
  const rows = function (list) {
    return list.map(function (t) {
      const taskCount = t.items.filter(x => x.itemType !== 'category').length;
      const catCount  = t.items.filter(x => x.itemType === 'category').length;
      return '<div class="cl-tpl-row">'
        + '<div class="cl-tpl-row-main">'
        +   '<div class="cl-tpl-row-name">' + esc(t.name) + (t.builtin ? '<span class="cl-tpl-tag">Built-in</span>' : '') + '</div>'
        +   '<div class="cl-tpl-row-desc">' + esc(t.desc || '') + ' · ' + catCount + ' section' + (catCount === 1 ? '' : 's') + ' · ' + taskCount + ' task' + (taskCount === 1 ? '' : 's') + '</div>'
        + '</div>'
        + '<div class="cl-tpl-row-acts">'
        +   '<button class="btn btn-primary btn-sm" onclick="useClTemplate(\'' + t.id + '\')"><i class="ti ti-plus"></i> Use</button>'
        +   '<button class="cl-row-btn" title="' + (t.builtin ? 'Duplicate &amp; edit' : 'Edit') + '" onclick="openClTemplateEditor(\'' + t.id + '\')"><i class="ti ti-' + (t.builtin ? 'copy' : 'pencil') + '"></i></button>'
        +   (t.builtin ? '' : '<button class="cl-row-btn cl-del" title="Delete template" onclick="deleteClTemplate(\'' + t.id + '\')"><i class="ti ti-trash"></i></button>')
        + '</div>'
        + '</div>';
    }).join('');
  };
  return '<div class="modal-overlay" id="cl-templates-modal">'
    + '<div class="modal" style="max-width:560px">'
    + '<div class="modal-head">'
    +   '<div class="modal-title">Template library</div>'
    +   '<button class="btn btn-ghost btn-sm" onclick="closeClTemplates()"><i class="ti ti-x"></i></button>'
    + '</div>'
    + '<div class="modal-body">'
    +   (user.length ? '<div class="cl-tpl-group-title">Your templates</div>' + rows(user) : '')
    +   '<div class="cl-tpl-group-title">Starter frameworks</div>' + rows(CL_BUILTIN_TEMPLATES)
    + '</div>'
    + '<div class="modal-footer" style="justify-content:space-between">'
    +   '<button class="btn btn-ghost" onclick="openClTemplateEditor()"><i class="ti ti-plus"></i> New template</button>'
    +   '<button class="btn btn-ghost" onclick="closeClTemplates()">Close</button>'
    + '</div>'
    + '</div></div>'
    + _clTemplateEditorHtml();
}

function openClTemplates()  { document.getElementById('cl-templates-modal')?.classList.add('open'); }
function closeClTemplates() { document.getElementById('cl-templates-modal')?.classList.remove('open'); }

function useClTemplate(id) {
  if (State.user && State.user.role === 'viewer') return;
  const tpl = _clAllTemplates().find(t => t.id === id);
  if (!tpl) return;
  closeClTemplates();
  _clPendingTemplateId = id;
  if (typeof openNewChecklistSheetModal === 'function') {
    openNewChecklistSheetModal();
    setTimeout(function () {
      const nm = document.getElementById('cl-sheet-name');
      if (nm && !nm.value) nm.value = tpl.name;
    }, 120);
  }
}

function saveSheetAsTemplate(sheetId) {
  if (State.user && State.user.role === 'viewer') return;
  const sheet = State.checklistSheets.find(s => s.id === sheetId);
  if (!sheet) return;
  const rootItems = State.checklistItems
    .filter(i => i.sheetId === sheetId && !i.parentItemId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (!rootItems.length) { toast('Nothing to save — add some items first', 'error'); return; }
  const name = prompt('Save as template — name:', sheet.name);
  if (!name || !name.trim()) return;
  ClLocal.addTemplate({
    id: 'utpl-' + Date.now(),
    name: name.trim(),
    desc: 'Saved from “' + sheet.name + '”',
    builtin: false,
    items: rootItems.map(i => ({ itemType: i.itemType === 'category' ? 'category' : 'task', text: i.text || '' })),
  });
  toast('Saved as template — find it under Templates');
}

function deleteClTemplate(id) {
  if (!confirm('Delete this template? This cannot be undone.')) return;
  ClLocal.removeTemplate(id);
  if (typeof renderChecklists === 'function') renderChecklists();
  openClTemplates();
}

/* ── Sheet metadata (project code + manager) ────────────── */
function _clSheetMetaHtml(sheet, canEdit) {
  const meta = sheet;   /* projectCode / manager now live on the sheet itself (synced) */
  if (canEdit) {
    return '<div class="cl-sheet-meta">'
      + '<label class="cl-meta-field"><span>Project code</span>'
      +   '<input value="' + esc(meta.projectCode || '') + '" placeholder="e.g. AUD-2024-X"'
      +     ' onchange="setSheetProjectCode(\'' + sheet.id + '\', this.value)"></label>'
      + '<label class="cl-meta-field"><span>Manager</span>'
      +   '<input value="' + esc(meta.manager || '') + '" placeholder="e.g. Shanib"'
      +     ' onchange="setSheetManager(\'' + sheet.id + '\', this.value)"></label>'
      + '</div>';
  }
  const sub = [meta.projectCode, meta.manager ? 'Mgr: ' + meta.manager : ''].filter(Boolean).join(' · ');
  return sub ? '<div class="cl-sheet-meta-ro">' + esc(sub) + '</div>' : '';
}

function setSheetProjectCode(id, v) {
  if (State.user && State.user.role === 'viewer') return;
  State.updateChecklistSheet(id, { projectCode: (v || '').trim() })
    .catch(function (e) { toast('Save failed: ' + e.message, 'error'); });
  if (typeof renderChecklists === 'function') renderChecklists();
}
function setSheetManager(id, v) {
  if (State.user && State.user.role === 'viewer') return;
  State.updateChecklistSheet(id, { manager: (v || '').trim() })
    .catch(function (e) { toast('Save failed: ' + e.message, 'error'); });
  if (typeof renderChecklists === 'function') renderChecklists();
}

/* ── Template editor (create new / edit existing) ───────── */
let _clTplEditId = null;   /* null = creating new */
let _clTplRows   = [];     /* [{ type:'category'|'task', text }] */

function _clTemplateEditorHtml() {
  return '<div class="modal-overlay" id="cl-tpl-editor-modal">'
    + '<div class="modal" style="max-width:520px">'
    + '<div class="modal-head">'
    +   '<div class="modal-title" id="cl-tpl-editor-title">New template</div>'
    +   '<button class="btn btn-ghost btn-sm" onclick="closeClTemplateEditor()"><i class="ti ti-x"></i></button>'
    + '</div>'
    + '<div class="modal-body">'
    +   '<div class="form-group">'
    +     '<label class="form-label">Template name</label>'
    +     '<input id="cl-tpl-editor-name" class="form-input" placeholder="e.g. Monthly Close">'
    +   '</div>'
    +   '<label class="form-label">Sections &amp; tasks</label>'
    +   '<div id="cl-tpl-rows"></div>'
    +   '<div class="cl-tpl-add-row">'
    +     '<button class="btn btn-ghost btn-sm" onclick="_clTplAddRow(\'category\')"><i class="ti ti-plus"></i> Section</button>'
    +     '<button class="btn btn-ghost btn-sm" onclick="_clTplAddRow(\'task\')"><i class="ti ti-plus"></i> Task</button>'
    +   '</div>'
    + '</div>'
    + '<div class="modal-footer">'
    +   '<button class="btn btn-ghost" onclick="closeClTemplateEditor()">Cancel</button>'
    +   '<button class="btn btn-primary" onclick="saveClTemplateEditor()"><i class="ti ti-circle-check"></i> Save template</button>'
    + '</div>'
    + '</div></div>';
}

function _clRenderTplRows() {
  const c = document.getElementById('cl-tpl-rows');
  if (!c) return;
  if (!_clTplRows.length) {
    c.innerHTML = '<div class="cl-side-empty">No rows yet — add a section or task below.</div>';
    return;
  }
  c.innerHTML = _clTplRows.map(function (r, i) {
    return '<div class="cl-tpl-erow' + (r.type === 'category' ? ' is-cat' : '') + '">'
      + '<span class="cl-tpl-erow-type"><i class="ti ' + (r.type === 'category' ? 'ti-folder' : 'ti-circle') + '"></i></span>'
      + '<input class="cl-tpl-erow-input" id="cl-tplrow-' + i + '"'
      +   ' placeholder="' + (r.type === 'category' ? 'Section name…' : 'Task…') + '"'
      +   ' oninput="_clTplRows[' + i + '].text=this.value">'
      + '<button class="cl-row-btn" title="Move up" onclick="_clTplMoveRow(' + i + ',-1)"><i class="ti ti-chevron-up"></i></button>'
      + '<button class="cl-row-btn" title="Move down" onclick="_clTplMoveRow(' + i + ',1)"><i class="ti ti-chevron-down"></i></button>'
      + '<button class="cl-row-btn cl-del" title="Remove" onclick="_clTplRemoveRow(' + i + ')"><i class="ti ti-x"></i></button>'
      + '</div>';
  }).join('');
  /* set values via JS to dodge attribute-escaping issues */
  _clTplRows.forEach(function (r, i) {
    const el = document.getElementById('cl-tplrow-' + i);
    if (el) el.value = r.text || '';
  });
}

function _clTplAddRow(type) {
  _clTplRows.push({ type: type === 'category' ? 'category' : 'task', text: '' });
  _clRenderTplRows();
  const el = document.getElementById('cl-tplrow-' + (_clTplRows.length - 1));
  if (el) el.focus();
}
function _clTplRemoveRow(i) { _clTplRows.splice(i, 1); _clRenderTplRows(); }
function _clTplMoveRow(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= _clTplRows.length) return;
  const tmp = _clTplRows[i]; _clTplRows[i] = _clTplRows[j]; _clTplRows[j] = tmp;
  _clRenderTplRows();
}

function openClTemplateEditor(id) {
  if (State.user && State.user.role === 'viewer') return;
  closeClTemplates();
  const t = id ? _clAllTemplates().find(x => x.id === id) : null;
  let title, nameVal;
  if (t && t.builtin) {                       /* built-in → duplicate into a new editable copy */
    _clTplEditId = null;
    title = 'Duplicate template';
    nameVal = t.name + ' (copy)';
    _clTplRows = t.items.map(r => ({ type: r.itemType === 'category' ? 'category' : 'task', text: r.text || '' }));
  } else if (t) {                             /* existing user template → edit in place */
    _clTplEditId = t.id;
    title = 'Edit template';
    nameVal = t.name;
    _clTplRows = t.items.map(r => ({ type: r.itemType === 'category' ? 'category' : 'task', text: r.text || '' }));
  } else {                                    /* brand new */
    _clTplEditId = null;
    title = 'New template';
    nameVal = '';
    _clTplRows = [{ type: 'category', text: '' }, { type: 'task', text: '' }];
  }
  const tEl = document.getElementById('cl-tpl-editor-title'); if (tEl) tEl.textContent = title;
  const nEl = document.getElementById('cl-tpl-editor-name');  if (nEl) nEl.value = nameVal;
  _clRenderTplRows();
  document.getElementById('cl-tpl-editor-modal')?.classList.add('open');
}

function closeClTemplateEditor() { document.getElementById('cl-tpl-editor-modal')?.classList.remove('open'); }

function saveClTemplateEditor() {
  if (State.user && State.user.role === 'viewer') return;
  const name = (document.getElementById('cl-tpl-editor-name')?.value || '').trim();
  if (!name) { toast('Enter a template name', 'error'); return; }
  const rows = _clTplRows
    .map(r => ({ itemType: r.type === 'category' ? 'category' : 'task', text: (r.text || '').trim() }))
    .filter(r => r.text);
  if (!rows.some(r => r.itemType === 'task')) { toast('Add at least one task', 'error'); return; }

  if (_clTplEditId) {
    const d = ClLocal._load();
    const t = (d.templates || []).find(x => x.id === _clTplEditId);
    if (t) { t.name = name; t.items = rows; ClLocal._save(); }
  } else {
    ClLocal.addTemplate({ id: 'utpl-' + Date.now(), name: name, desc: 'Custom template', builtin: false, items: rows });
  }
  closeClTemplateEditor();
  if (typeof renderChecklists === 'function') renderChecklists();
  openClTemplates();
  toast('Template saved');
}
