/* ============================================================
   OFIZ Tasks — App Bootstrap & Router  (Redesign v2)
   ============================================================ */

let currentPage = 'dashboard';

function showPage(pageId, navEl) {
  currentPage = pageId;

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
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[pageId] || '';

  /* Show search on tasks page */
  const searchBox = document.getElementById('global-search-box');
  if (searchBox) searchBox.style.display = pageId === 'tasks' ? 'flex' : 'none';

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
    case 'dashboard': renderDashboard();  break;
    case 'tasks':     renderAllTasks();   break;
    case 'clients':   renderClients();    break;
    case 'users':     renderUsers();      break;
    case 'templates': renderTemplates();  break;
  }
}

/* ── Login ──────────────────────────────────────────────── */
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
    await State.loadFromSheets();
  }

  showPage('dashboard');
}

function logout() {
  State.user = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display   = 'none';
}

/* ── Keyboard shortcuts ─────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (State.user?.role === 'admin') openNewTaskModal();
  }
});

/* ── Click outside modal ────────────────────────────────── */
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display   = 'none';
});
