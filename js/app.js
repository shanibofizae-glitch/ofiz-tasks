/* ============================================================
   OFIZ Tasks — App Bootstrap & Router  (Redesign v2)
   ============================================================ */

let currentPage = 'dashboard';

function showPage(pageId, navEl) {
  currentPage = pageId;
  closeSidebar();

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  else {
    const match = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (match) match.classList.add('active');
  }

  const titles = {
    dashboard: 'Dashboard',
    tasks:     'All tasks',
    clients:   'Clients',
    users:     'Users & roles',
    templates: 'Recurring tasks',
    pipelines: 'Pipelines',
    settings:  'Settings',
    close:     'Monthly close',
    documents: 'Documents',
    reminders: 'Reminders',
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[pageId] || '';

  /* Show search + print on tasks page */
  const searchBox = document.getElementById('global-search-box');
  if (searchBox) searchBox.style.display = pageId === 'tasks' ? 'flex' : 'none';
  const printBtn = document.getElementById('print-btn');
  if (printBtn) printBtn.style.display = pageId === 'tasks' ? '' : 'none';

  /* Re-apply admin-only visibility */
  if (State.user) {
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      el.style.display = State.user.role === 'admin' ? '' : 'none';
    });
  }

  refreshCurrentPage();
}

function refreshCurrentPage() {
  switch (currentPage) {
    case 'dashboard': renderDashboard();      break;
    case 'tasks':     renderAllTasks();       break;
    case 'clients':   renderClients();        break;
    case 'users':     renderUsers();          break;
    case 'templates': renderTemplates();      break;
    case 'pipelines': renderPipelinesPage();  break;
    case 'settings':  renderSettings();        break;
    case 'close':     renderClosePage();      break;
    case 'documents': renderDocuments();      break;
    case 'reminders': renderReminders();      break;
  }
}

/* ── Login flow ─────────────────────────────────────────── */
let selectedUserId = null;

function renderUserSelectList() {
  const list = document.getElementById('user-select-list');
  if (!list) return;
  list.innerHTML = State.users.map(u => `
    <button class="demo-user-btn" onclick="selectUser('${u.id}')">
      <div class="avatar ${u.avClass}" style="width:34px;height:34px;font-size:11px">${u.initials}</div>
      <div>
        <div style="font-weight:600;font-size:13px">${u.name}</div>
        <div style="font-size:11px;color:var(--ink-3)">${u.email}</div>
      </div>
      <span class="demo-role" style="text-transform:capitalize">${u.role}</span>
    </button>`).join('');
}

function selectUser(userId) {
  selectedUserId = userId;
  const user = State.users.find(u => u.id === userId);
  if (!user) return;

  /* Show selected user */
  document.getElementById('selected-user-display').innerHTML = `
    <div class="avatar ${user.avClass}" style="width:34px;height:34px;font-size:11px">${user.initials}</div>
    <div>
      <div style="font-weight:600;font-size:13px">${user.name}</div>
      <div style="font-size:11px;color:var(--ink-3)">${user.email}</div>
    </div>
    <span style="margin-left:auto;font-size:10.5px;font-weight:600;color:var(--ink-3);text-transform:capitalize">${user.role}</span>
  `;

  /* Switch to password step */
  document.getElementById('login-step-1').style.display = 'none';
  document.getElementById('login-step-2').style.display = 'block';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
  setTimeout(() => document.getElementById('login-password').focus(), 100);
}

function backToUserSelect() {
  selectedUserId = null;
  document.getElementById('login-step-1').style.display = 'block';
  document.getElementById('login-step-2').style.display = 'none';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
}

function togglePasswordVisibility() {
  const input = document.getElementById('login-password');
  const icon  = document.getElementById('pw-toggle-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'ti ti-eye-off';
  } else {
    input.type = 'password';
    icon.className = 'ti ti-eye';
  }
}

async function submitPassword() {
  if (!selectedUserId) return;
  const user     = State.users.find(u => u.id === selectedUserId);
  const entered  = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');
  const btn      = document.querySelector('#login-step-2 .btn-primary');

  if (!entered) {
    errorEl.style.display = 'block';
    errorEl.innerHTML = '<i class="ti ti-alert-circle" style="font-size:13px;vertical-align:-2px"></i> Please enter your password.';
    return;
  }

  /* Check password */
  if (entered !== user.password) {
    errorEl.style.display = 'block';
    errorEl.innerHTML = '<i class="ti ti-alert-circle" style="font-size:13px;vertical-align:-2px"></i> Incorrect password. Please try again.';
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
    return;
  }

  /* Password correct — log in */
  errorEl.style.display = 'none';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Signing in…'; }
  await loginAs(selectedUserId);
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-login"></i> Sign in'; }
}

async function loginAs(userId) {
  const user = State.users.find(u => u.id === userId);
  if (!user) return;
  State.user = user;

  document.getElementById('login-screen').style.display  = 'none';
  document.getElementById('app-screen').style.display    = 'flex';

  document.getElementById('sidebar-user-initials').textContent = user.initials;
  document.getElementById('sidebar-user-initials').className   = `avatar ${user.avClass}`;
  document.getElementById('sidebar-user-name').textContent     = user.name;
  document.getElementById('sidebar-user-role').textContent     = user.role;

  document.querySelectorAll('[data-admin-only]').forEach(el => {
    el.style.display = user.role === 'admin' ? '' : 'none';
  });
  document.querySelectorAll('[data-hide-viewer]').forEach(el => {
    el.style.display = user.role === 'viewer' ? 'none' : '';
  });

  populateFormDropdowns();

  if (State.useSheets) {
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'Loading…';
    /* Show skeleton while loading */
    renderSkeleton('dash-task-list', 6);
    await State.loadFromSheets();
    if (titleEl) titleEl.textContent = 'Dashboard';
  }

  showPage('dashboard');
  setTimeout(updateChatBadge, 500);
  _startClock();
  _startAutoSync();
  const si = document.getElementById('sync-indicator');
  if (si) si.style.display = '';
}

let _clockTimer    = null;
let _autoSyncTimer = null;

function _startAutoSync() {
  if (_autoSyncTimer) clearInterval(_autoSyncTimer);
  _autoSyncTimer = setInterval(async () => {
    if (!State.user || !State.useSheets) return;
    await State.loadFromSheets();
    refreshCurrentPage();
  }, 90000); /* refresh every 90 seconds */
}


function _startClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  el.style.display = '';
  const tick = () => {
    const now  = new Date();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const mons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const hh   = String(now.getHours()).padStart(2,'0');
    const mm   = String(now.getMinutes()).padStart(2,'0');
    el.textContent = `${days[now.getDay()]} ${now.getDate()} ${mons[now.getMonth()]} ${now.getFullYear()}  ${hh}:${mm}`;
  };
  tick();
  _clockTimer = setInterval(tick, 60000);
}

function logout() {
  if (_clockTimer)    { clearInterval(_clockTimer);    _clockTimer    = null; }
  if (_autoSyncTimer) { clearInterval(_autoSyncTimer); _autoSyncTimer = null; }
  const si = document.getElementById('sync-indicator');
  if (si) si.style.display = 'none';
  document.getElementById('live-clock').style.display = 'none';
  closeChat();
  State.user     = null;
  selectedUserId = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display   = 'none';
  document.getElementById('login-step-1').style.display = 'block';
  document.getElementById('login-step-2').style.display = 'none';
  document.getElementById('login-password').value       = '';
  renderUserSelectList();
}

/* ── Mobile sidebar ─────────────────────────────────────── */
function toggleSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const isOpen   = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('visible', !isOpen);
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

/* ── Keyboard shortcut modal ────────────────────────────── */
function openShortcutModal()  { document.getElementById('shortcut-modal').classList.add('open'); }
function closeShortcutModal() { document.getElementById('shortcut-modal').classList.remove('open'); }

/* ── Keyboard shortcuts ─────────────────────────────────── */
document.addEventListener('keydown', e => {
  const inInput = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    closeSidebar();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (State.user?.role === 'admin') openNewTaskModal();
  }
  if (e.key === '?' && !inInput && !e.ctrlKey && !e.metaKey && State.user) {
    openShortcutModal();
  }
  if (e.key === 'r' && !inInput && !e.ctrlKey && !e.metaKey && State.user) {
    refreshCurrentPage();
  }
});

/* ── Click outside modal / colour picker ────────────────── */
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
  /* Close stage colour picker if click is outside it */
  const picker = document.getElementById('stage-color-picker');
  if (picker && picker.style.display !== 'none') {
    if (!picker.contains(e.target) &&
        !e.target.classList.contains('stage-color-dot') &&
        !e.target.classList.contains('stage-color-btn') &&
        !e.target.classList.contains('stage-color-preview')) {
      closeStageColorPicker();
    }
  }
});

/* ── Sync helpers (used by data.js) ────────────────────── */
let _syncErrorTimer = null;

function _updateSyncTime() {
  State.lastSyncAt = new Date();
  const el = document.getElementById('sync-indicator');
  if (el) { el.textContent = 'Synced just now'; el.style.display = ''; }
  /* Update to relative time after 1 min */
  setTimeout(() => {
    if (el && State.lastSyncAt) {
      const mins = Math.round((Date.now() - State.lastSyncAt) / 60000);
      if (mins < 60) el.textContent = `Synced ${mins}m ago`;
    }
  }, 60000);
}

function _showSyncError(msg) {
  if (_syncErrorTimer) clearTimeout(_syncErrorTimer);
  let banner = document.getElementById('sync-error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'sync-error-banner';
    banner.className = 'sync-error-banner';
    document.body.appendChild(banner);
  }
  banner.innerHTML = `<i class="ti ti-wifi-off"></i> ${msg}`;
  _syncErrorTimer = setTimeout(() => banner.remove(), 6000);
}

async function manualRefresh() {
  const btn = document.getElementById('refresh-btn');
  if (btn) { btn.querySelector('i').style.animation = 'spin 0.8s linear infinite'; }
  if (State.useSheets) await State.loadFromSheets();
  refreshCurrentPage();
  if (btn) { btn.querySelector('i').style.animation = ''; }
}

/* ── PWA Service Worker ─────────────────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ofiz-tasks/sw.js').catch(() => {});
}

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display   = 'none';
  renderUserSelectList();
});
