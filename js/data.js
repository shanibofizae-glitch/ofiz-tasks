/* ============================================================
   OFIZ Tasks — Data Layer
   Fill in your 4 credentials in the CONFIG block below.
   ============================================================ */

/* Parse subtasks JSON stored in sheet column */
function _parseSt(val) {
  if (!val || !String(val).trim()) return [];
  try { return JSON.parse(val); } catch(e) { return []; }
}

const CONFIG = {
  SHEET_ID:   '1flHjdPaidpBxm8n1ehimKinVFJpPPE0DsbmfQhegstc',
  API_KEY:    'AIzaSyA6Z0B8SAenTIy2kqPcJX0Jz5WXB6OCYls',
  CLIENT_ID:  '360095905997-73kqtothq7uibqm0m2qpp0dep8jae409.apps.googleusercontent.com',
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxu1jwOP52lZwRNebS5C6SvanYIVZ_RJ4Aq8gELwGLHG7aXTo3_Wl9pJl_Qo_MMF0ro/exec',
};

/* ── Demo seed data ─────────────────────────────────────── */
const DEMO = {
  users: [
    { id:'u1', name:'Shanib',      email:'shanib.ofizae@gmail.com', role:'admin',     initials:'SH', avClass:'av-admin', password:'Shani123'   },
    { id:'u2', name:'Shafeera',    email:'info.ofizae@gmail.com',   role:'assistant', initials:'SF', avClass:'av-asst',  password:'Shafee1234' },
    { id:'u3', name:'Assistant 1', email:'izofficeac@gmail.com',    role:'viewer',    initials:'RA', avClass:'av-viewer',password:'Admin1234'  },
  ],
  clients: [
    { id:'c1', name:'Sorry Guys Marketing Agency', short:'SGMA', color:'#4f8ef7', bg:'rgba(79,142,247,0.12)'  },
    { id:'c2', name:'The Den DXB',                 short:'DEN',  color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
    { id:'c3', name:'Into The Room',               short:'ITR',  color:'#34c27a', bg:'rgba(52,194,122,0.12)'  },
    { id:'c4', name:'Trade Capital Partners',      short:'TCP',  color:'#f5a623', bg:'rgba(245,166,35,0.12)'  },
    { id:'c5', name:'Global Data Comm. Services',  short:'GDCS', color:'#f05454', bg:'rgba(240,84,84,0.12)'   },
  ],
  tasks: [
    { id:'t1',  title:'Bank reconciliation',          clientId:'c2', type:'monthly', status:'overdue',  priority:'high',   assigneeId:'u2', dueDate:'2026-05-30', notes:'Waiting for May bank statement.',       createdAt:'2026-05-01', closedAt:null,         closeComment:'' },
    { id:'t2',  title:'VAT return filing',            clientId:'c4', type:'monthly', status:'progress', priority:'high',   assigneeId:'u1', dueDate:'2026-06-01', notes:'Q1 figures need to be reconciled first.',createdAt:'2026-05-28', closedAt:null,         closeComment:'' },
    { id:'t3',  title:'Payroll processing',           clientId:'c1', type:'monthly', status:'pending',  priority:'medium', assigneeId:'u1', dueDate:'2026-06-05', notes:'',                                      createdAt:'2026-05-28', closedAt:null,         closeComment:'' },
    { id:'t4',  title:'Invoice follow-up',            clientId:'c3', type:'weekly',  status:'pending',  priority:'medium', assigneeId:'u3', dueDate:'2026-06-02', notes:'Follow up on 3 outstanding invoices.',  createdAt:'2026-05-28', closedAt:null,         closeComment:'' },
    { id:'t5',  title:'Daily transaction posting',    clientId:'c5', type:'daily',   status:'done',     priority:'low',    assigneeId:'u3', dueDate:'2026-06-01', notes:'',                                      createdAt:'2026-06-01', closedAt:'2026-06-01', closeComment:'All transactions posted.' },
    { id:'t6',  title:'Monthly P&L report',           clientId:'c2', type:'monthly', status:'pending',  priority:'high',   assigneeId:'u1', dueDate:'2026-06-07', notes:'',                                      createdAt:'2026-05-28', closedAt:null,         closeComment:'' },
    { id:'t7',  title:'Accounts payable review',      clientId:'c4', type:'weekly',  status:'pending',  priority:'medium', assigneeId:'u2', dueDate:'2026-06-03', notes:'',                                      createdAt:'2026-05-28', closedAt:null,         closeComment:'' },
    { id:'t8',  title:'WPS salary transfer check',    clientId:'c5', type:'monthly', status:'progress', priority:'high',   assigneeId:'u1', dueDate:'2026-06-01', notes:'Verify salaries credited.',             createdAt:'2026-05-29', closedAt:null,         closeComment:'' },
    { id:'t9',  title:'Client ledger reconciliation', clientId:'c1', type:'monthly', status:'overdue',  priority:'high',   assigneeId:'u2', dueDate:'2026-05-28', notes:'',                                      createdAt:'2026-05-01', closedAt:null,         closeComment:'' },
    { id:'t10', title:'Daily expense entry',          clientId:'c3', type:'daily',   status:'done',     priority:'low',    assigneeId:'u3', dueDate:'2026-06-01', notes:'',                                      createdAt:'2026-06-01', closedAt:'2026-06-01', closeComment:'Posted.' },
    { id:'t11', title:'Supplier payment approval',    clientId:'c2', type:'oneoff',  status:'pending',  priority:'medium', assigneeId:'u1', dueDate:'2026-06-04', notes:'3 invoices pending approval above AED 10k.', createdAt:'2026-06-01', closedAt:null,    closeComment:'' },
    { id:'t12', title:'DIFC compliance filing',       clientId:'c4', type:'oneoff',  status:'overdue',  priority:'high',   assigneeId:'u1', dueDate:'2026-05-31', notes:'Annual compliance doc.',               createdAt:'2026-05-20', closedAt:null,         closeComment:'' },
  ],
  comments: [
    { id:'cm1', taskId:'t1', userId:'u1', text:'Please complete before EOD — client needs the report.', createdAt:'29 May 09:12' },
    { id:'cm2', taskId:'t1', userId:'u2', text:'Started. Waiting for May bank statement from client.',  createdAt:'29 May 14:40' },
    { id:'cm3', taskId:'t2', userId:'u1', text:'Q1 figures need to be reconciled first before filing.', createdAt:'28 May 11:00' },
    { id:'cm4', taskId:'t8', userId:'u1', text:'Check with HR that the payroll file is finalised.',     createdAt:'30 May 10:00' },
  ],
  templates: [
    { id:'tp1', title:'Bank reconciliation',       clientId:'c2', recurrence:'monthly', dayOfMonth:25,   dayOfWeek:null,  assigneeId:'u2', active:true },
    { id:'tp2', title:'VAT return filing',         clientId:'c4', recurrence:'monthly', dayOfMonth:1,    dayOfWeek:null,  assigneeId:'u1', active:true },
    { id:'tp3', title:'Daily transaction posting', clientId:'c5', recurrence:'daily',   dayOfMonth:null, dayOfWeek:null,  assigneeId:'u3', active:true },
    { id:'tp4', title:'Invoice follow-up',         clientId:'c3', recurrence:'weekly',  dayOfMonth:null, dayOfWeek:'Mon', assigneeId:'u3', active:true },
    { id:'tp5', title:'Payroll processing',        clientId:'c1', recurrence:'monthly', dayOfMonth:5,    dayOfWeek:null,  assigneeId:'u1', active:true },
  ],
};

/* ══════════════════════════════════════════════════════════
   Google Sheets API Layer
   - Reads  → direct Sheets REST API (API key, no auth needed)
   - Writes → Apps Script Web App (bypasses 401 auth issue)
   ══════════════════════════════════════════════════════════ */
const Sheets = {

  /* READ — uses API key directly, works fine for reading */
  async _get(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${range}?key=${CONFIG.API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        console.error('[Sheets._get] error:', err.error?.message);
        return null;
      }
      return (await res.json()).values || [];
    } catch(e) {
      console.error('[Sheets._get] fetch failed:', e);
      return null;
    }
  },

  /* WRITE — uses Apps Script Web App, handles auth internally */
  async _post(payload) {
    if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
      console.error('[Sheets._post] SCRIPT_URL not set in CONFIG');
      return false;
    }
    try {
      const res = await fetch(CONFIG.SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(payload),
        redirect: 'follow',
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); }
      catch(e) { console.error('[Sheets._post] bad JSON response:', text); return false; }
      if (!json.ok) { console.error('[Sheets._post] script error:', json.error); return false; }
      return json.data;
    } catch(e) {
      console.error('[Sheets._post] fetch failed:', e);
      return false;
    }
  },

  /* Find which row number a task ID is in (1-indexed) */
  async findTaskRow(taskId) {
    const result = await this._post({ action:'findRow', id:taskId });
    if (result === false || result === -1) return -1;
    return Number(result);
  },

  /* Find a row in any tab by ID (Apps Script must support tab param) */
  async findRow(tab, id) {
    const result = await this._post({ action:'findRow', tab, id });
    if (result === false || result === -1) return -1;
    return Number(result);
  },

  /* ── User writes ──────────────────────────────────── */
  async updateUser(user) {
    const rowNum = await this.findRow('Users', user.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Users', rowNum,
      row:[user.id, user.name, user.email, user.role, user.initials,
           user.avClass, user.password, user.telegramChatId||''] }));
  },

  async addUser(user) {
    return !!(await this._post({ action:'append', tab:'Users',
      row:[user.id, user.name, user.email, user.role, user.initials,
           user.avClass, user.password, user.telegramChatId||''] }));
  },

  async deleteUser(userId) {
    const rowNum = await this.findRow('Users', userId);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Users', rowNum,
      row:['','','','','','','',''] }));
  },

  /* ── Client writes ────────────────────────────────── */
  async updateClient(client) {
    const rowNum = await this.findRow('Clients', client.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Clients', rowNum,
      row:[client.id, client.name, client.short, client.color, client.bg, String(client.active)] }));
  },

  async deleteClient(clientId) {
    const rowNum = await this.findRow('Clients', clientId);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Clients', rowNum,
      row:['','','','','',''] }));
  },

  /* ── Pipeline delete ──────────────────────────────── */
  async deletePipeline(pipelineId) {
    const rowNum = await this.findRow('Pipelines', pipelineId);
    if (rowNum >= 0) {
      await this._post({ action:'update', tab:'Pipelines', rowNum, row:['','','',''] });
    }
    return true;
  },

  /* Convert task object to a flat array matching sheet columns */
  taskToRow(task) {
    return [
      task.id              || '',
      task.title           || '',
      task.clientId        || '',
      task.type            || '',
      task.status          || '',
      task.priority        || '',
      task.assigneeId      || '',
      task.dueDate         || '',
      task.notes           || '',
      task.createdAt       || '',
      task.closedAt        || '',
      task.closeComment    || '',
      task.pipelineId      || '',
      task.pipelineStageId || '',
      (task.subtasks  && task.subtasks.length)  ? JSON.stringify(task.subtasks)  : '',
      (task.blockedBy && task.blockedBy.length) ? JSON.stringify(task.blockedBy) : '',
    ];
  },

  /* Convert comment object to a flat array matching AuditLog columns */
  commentToRow(cm) {
    return [ cm.id, cm.taskId, cm.userId, cm.text, cm.createdAt ];
  },

  /* Append a new task row */
  async addTask(task) {
    console.log('[Sheets] Writing new task to sheet:', task.title);
    const result = await this._post({ action:'append', tab:'Tasks', row:this.taskToRow(task) });
    if (result !== false) console.log('[Sheets] Task written successfully');
    return result !== false;
  },

  /* Update an existing task row */
  async updateTask(task) {
    const rowNum = await this.findTaskRow(task.id);
    if (rowNum < 0) {
      console.warn('[Sheets] Task not found in sheet for update:', task.id);
      return false;
    }
    console.log('[Sheets] Updating task at row', rowNum);
    const result = await this._post({ action:'update', tab:'Tasks', rowNum, row:this.taskToRow(task) });
    if (result !== false) console.log('[Sheets] Task updated successfully');
    return result !== false;
  },

  /* Blank out a deleted task row */
  async deleteTask(taskId) {
    const rowNum = await this.findTaskRow(taskId);
    if (rowNum < 0) return false;
    return await this._post({
      action: 'update', tab:'Tasks', rowNum,
      row: ['','','','','','','','','','','',''],
    });
  },

  /* Append a comment to AuditLog */
  async addComment(cm) {
    return await this._post({ action:'append', tab:'AuditLog', row:this.commentToRow(cm) });
  },

  /* Update an existing comment's text */
  async updateComment(cm) {
    const rowNum = await this.findRow('AuditLog', cm.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'AuditLog', rowNum,
      row:[cm.id, cm.taskId, cm.userId, cm.text, cm.createdAt] }));
  },

  /* Load all tasks from sheet on login */
  async loadTasks() {
    const rows = await this._get('Tasks!A2:P');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '' && r[1] !== '__deleted__')
      .map(r => ({
        id:              r[0]  || '',
        title:           r[1]  || '',
        clientId:        r[2]  || '',
        type:            r[3]  || 'oneoff',
        status:          r[4]  || 'pending',
        priority:        r[5]  || 'medium',
        assigneeId:      r[6]  || '',
        dueDate:         r[7]  || '',
        notes:           r[8]  || '',
        createdAt:       r[9]  || '',
        closedAt:        r[10] || null,
        closeComment:    r[11] || '',
        pipelineId:      r[12] || null,
        pipelineStageId: r[13] || null,
        subtasks:        _parseSt(r[14]),
        blockedBy:       _parseSt(r[15]),
      }));
  },

  /* Load activity events from AuditLog (ev* entries) */
  async loadActivityLog() {
    const rows = await this._get('AuditLog!A2:E');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].startsWith('ev'))
      .map(r => ({ id:r[0]||'', taskId:r[1]||'', userId:r[2]||'', text:r[3]||'', createdAt:r[4]||'' }));
  },

  /* Load documents from Documents tab */
  async loadDocuments() {
    const rows = await this._get('Documents!A2:F');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({ id:r[0]||'', clientId:r[1]||'', type:r[2]||'', number:r[3]||'', expiryDate:r[4]||'', notes:r[5]||'' }));
  },

  async addDocument(doc) {
    return !!(await this._post({ action:'append', tab:'Documents',
      row:[doc.id, doc.clientId, doc.type, doc.number, doc.expiryDate, doc.notes||''] }));
  },

  async updateDocument(doc) {
    const rowNum = await this.findRow('Documents', doc.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Documents', rowNum,
      row:[doc.id, doc.clientId, doc.type, doc.number, doc.expiryDate, doc.notes||''] }));
  },

  async deleteDocument(docId) {
    const rowNum = await this.findRow('Documents', docId);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Documents', rowNum,
      row:['','','','','',''] }));
  },

  /* Load all comments from AuditLog on login */
  async loadComments() {
    const rows = await this._get('AuditLog!A2:E');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].startsWith('cm'))
      .map(r => ({
        id:        r[0] || '',
        taskId:    r[1] || '',
        userId:    r[2] || '',
        text:      r[3] || '',
        createdAt: r[4] || '',
      }));
  },

  /* Load all clients from Clients tab on login */
  async loadClients() {
    const rows = await this._get('Clients!A2:F');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '' && r[1] !== '__deleted__')
      .map(r => ({
        id:     r[0] || '',
        name:   r[1] || '',
        short:  r[2] || '',
        color:  r[3] || '#4f8ef7',
        bg:     r[4] || 'rgba(79,142,247,0.12)',
        active: r[5] !== 'false',
      }));
  },

  /* Load all users with passwords from Users tab */
  async loadUsers() {
    const rows = await this._get('Users!A2:H');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({
        id:             r[0] || '',
        name:           r[1] || '',
        email:          r[2] || '',
        role:           r[3] || 'viewer',
        initials:       r[4] || '??',
        avClass:        r[5] || 'av-viewer',
        password:       r[6] || '',
        telegramChatId: r[7] || '',
      }));
  },

  /* Saved filter views */
  async loadSavedViews() {
    const rows = await this._get('SavedViews!A2:D');
    if (!rows || rows.length === 0) return [];
    return rows.filter(r => r[0]).map(r => ({
      id: r[0]||'', name: r[1]||'', userId: r[2]||'', filters: _parseSt(r[3]),
    }));
  },
  async addSavedView(v) {
    return !!(await this._post({ action:'append', tab:'SavedViews',
      row:[v.id, v.name, v.userId, JSON.stringify(v.filters)] }));
  },
  async deleteSavedView(id) {
    const rowNum = await this.findRow('SavedViews', id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'SavedViews', rowNum, row:['','','',''] }));
  },

  /* Time logs */
  async loadTimeLogs() {
    const rows = await this._get('TimeLog!A2:G');
    if (!rows || rows.length === 0) return [];
    return rows.filter(r => r[0]).map(r => ({
      id: r[0]||'', taskId: r[1]||'', userId: r[2]||'',
      hours: Number(r[3])||0, description: r[4]||'',
      date: r[5]||'', billable: r[6] !== 'false',
    }));
  },
  async addTimeLog(log) {
    return !!(await this._post({ action:'append', tab:'TimeLog',
      row:[log.id, log.taskId, log.userId, log.hours, log.description||'', log.date, String(log.billable)] }));
  },
  async deleteTimeLog(logId) {
    const rowNum = await this.findRow('TimeLog', logId);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'TimeLog', rowNum,
      row:['','','','','','',''] }));
  },

  /* Load templates from Templates tab */
  async loadTemplates() {
    const rows = await this._get('Templates!A2:H');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({
        id:         r[0] || '',
        title:      r[1] || '',
        clientId:   r[2] || '',
        recurrence: r[3] || 'monthly',
        dayOfMonth: r[4] ? Number(r[4]) : null,
        dayOfWeek:  r[5] || null,
        assigneeId: r[6] || '',
        active:     r[7] !== 'false',
      }));
  },

  async addTemplate(template) {
    return !!(await this._post({ action:'append', tab:'Templates',
      row:[template.id, template.title, template.clientId, template.recurrence,
           template.dayOfMonth || '', template.dayOfWeek || '',
           template.assigneeId, String(template.active)] }));
  },

  async updateTemplate(template) {
    const rowNum = await this.findRow('Templates', template.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Templates', rowNum,
      row:[template.id, template.title, template.clientId, template.recurrence,
           template.dayOfMonth || '', template.dayOfWeek || '',
           template.assigneeId, String(template.active)] }));
  },

  async deleteTemplate(templateId) {
    const rowNum = await this.findRow('Templates', templateId);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Templates', rowNum,
      row:['','','','','','','',''] }));
  },

  /* Load pipelines from Pipelines tab */
  async loadPipelines() {
    const rows = await this._get('Pipelines!A2:D');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({
        id:     r[0] || '',
        name:   r[1] || '',
        desc:   r[2] || '',
        active: r[3] !== 'false',
      }));
  },

  /* Load stages from PipelineStages tab */
  async loadStages() {
    const rows = await this._get('PipelineStages!A2:E');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({
        id:         r[0] || '',
        pipelineId: r[1] || '',
        order:      Number(r[2]) || 0,
        name:       r[3] || '',
        color:      r[4] || '',
      }));
  },

  /* Update a stage row (for colour changes) */
  async updateStage(stage) {
    const rowNum = await this.findRow('PipelineStages', stage.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'PipelineStages', rowNum,
      row:[stage.id, stage.pipelineId, stage.order, stage.name, stage.color || ''] }));
  },
};

/* ══════════════════════════════════════════════════════════
   State — in-memory store + all CRUD with Sheet sync
   ══════════════════════════════════════════════════════════ */
const State = {
  user:        null,
  tasks:       [],          /* start empty — populated from Sheets on login */
  comments:    [],
  clients:     [...DEMO.clients],   /* fallback if Clients sheet is empty */
  users:       [...DEMO.users],     /* fallback for login if Sheets offline */
  templates:   [...DEMO.templates],
  activityLog: [],
  documents:   [],
  savedViews:  [],
  timeLogs:    [],
  nextId:      Math.floor(Date.now() / 1000),
  useSheets:   true,

  uid()  { return 't'  + (++this.nextId); },
  cmId() { return 'cm' + (++this.nextId); },

  /* ── Lookup helpers ──────────────────────────────────── */
  getTask(id)      { return this.tasks.find(t => t.id === id); },
  getClient(id)    { return this.clients.find(c => c.id === id); },
  getUser(id)      { return this.users.find(u => u.id === id); },
  getComments(tid) { return this.comments.filter(c => c.taskId === tid); },

  overdueTasks() {
    const today = new Date().toISOString().slice(0,10);
    const seen  = new Set();
    return this.tasks.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return t.status !== 'done' && t.dueDate < today;
    });
  },

  todayTasks() {
    const today = new Date().toISOString().slice(0,10);
    return this.tasks.filter(t => t.status !== 'done' && t.dueDate === today);
  },

  /* ── Load live data from Sheet after login ───────────── */
  async loadFromSheets() {
    if (!this.useSheets) return;
    try {
      console.log('[State] Loading from Google Sheets...');
      const [sheetTasks, sheetComments, sheetClients, sheetUsers,
             sheetPipelines, sheetStages, sheetTemplates,
             sheetActivity, sheetDocs, sheetViews, sheetTimeLogs] = await Promise.all([
        Sheets.loadTasks(),
        Sheets.loadComments(),
        Sheets.loadClients(),
        Sheets.loadUsers(),
        Sheets.loadPipelines(),
        Sheets.loadStages(),
        Sheets.loadTemplates(),
        Sheets.loadActivityLog(),
        Sheets.loadDocuments(),
        Sheets.loadSavedViews(),
        Sheets.loadTimeLogs(),
      ]);
      if (sheetTasks.length > 0) {
        /* Deduplicate by ID — first occurrence wins (original task) */
        const taskMap = new Map();
        sheetTasks.forEach(t => { if (!taskMap.has(t.id)) taskMap.set(t.id, t); });
        this.tasks = Array.from(taskMap.values());
        /* Advance nextId past every existing ID to prevent future collisions */
        this.tasks.forEach(t => {
          const m = t.id.match(/^[a-z]+(\d+)$/i);
          if (m) this.nextId = Math.max(this.nextId, parseInt(m[1], 10));
        });
        const dupes = sheetTasks.length - this.tasks.length;
        if (dupes > 0) console.warn(`[State] Removed ${dupes} duplicate task ID(s) from loaded data`);
        console.log('[State] Loaded', this.tasks.length, 'tasks from Sheets (nextId now', this.nextId, ')');
      } else {
        console.log('[State] Tasks sheet is empty — starting fresh');
      }
      if (sheetComments.length > 0) {
        /* Deduplicate comments by ID */
        const cmMap = new Map();
        sheetComments.forEach(c => { if (!cmMap.has(c.id)) cmMap.set(c.id, c); });
        this.comments = Array.from(cmMap.values());
        this.comments.forEach(c => {
          const m = c.id.match(/^[a-z]+(\d+)$/i);
          if (m) this.nextId = Math.max(this.nextId, parseInt(m[1], 10));
        });
        console.log('[State] Loaded', this.comments.length, 'comments from Sheets');
      }
      if (sheetClients && sheetClients.length > 0) {
        this.clients = sheetClients; /* sheet is the sole source of truth */
        console.log('[State] Loaded', sheetClients.length, 'clients from Sheets');
      }
      if (sheetUsers && sheetUsers.length > 0) {
        this.users = sheetUsers;
        console.log('[State] Loaded', sheetUsers.length, 'users from Sheets');
      }
      if (sheetPipelines && sheetPipelines.length > 0) {
        this.pipelines = sheetPipelines;
        if (!this.activePipelineId || !this.pipelines.find(p => p.id === this.activePipelineId)) {
          this.activePipelineId = this.pipelines[0]?.id || null;
        }
        console.log('[State] Loaded', sheetPipelines.length, 'pipelines from Sheets');
      }
      if (sheetStages && sheetStages.length > 0) {
        this.stages = sheetStages;
        console.log('[State] Loaded', sheetStages.length, 'stages from Sheets');
      }
      if (sheetTemplates && sheetTemplates.length > 0) {
        this.templates = sheetTemplates;
        console.log('[State] Loaded', sheetTemplates.length, 'templates from Sheets');
      }
      if (sheetActivity && sheetActivity.length > 0) {
        this.activityLog = sheetActivity;
      }
      if (sheetDocs && sheetDocs.length > 0) {
        this.documents = sheetDocs;
      }
      if (sheetViews && sheetViews.length > 0) {
        this.savedViews = sheetViews.filter(v => v.userId === this.user?.id || !v.userId);
      }
      if (sheetTimeLogs && sheetTimeLogs.length > 0) {
        this.timeLogs = sheetTimeLogs;
      }
    } catch(e) {
      console.error('[State.loadFromSheets] Failed:', e);
    }
  },

  /* ── Create new task ─────────────────────────────────── */
  async addTask(data) {
    const task = {
      id:           this.uid(),
      ...data,
      createdAt:    new Date().toISOString().slice(0,10),
      closedAt:     null,
      closeComment: '',
      subtasks:     data.subtasks || [],
    };
    this.tasks.unshift(task);
    if (this.useSheets) {
      const ok = await Sheets.addTask(task);
      if (!ok) console.warn('[State.addTask] Sheet write failed — task saved locally only');
    }
    await this.addActivity(task.id, 'Task created');
    return task;
  },

  /* ── Update any task fields ──────────────────────────── */
  async updateTask(id, patch) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx < 0) return null;
    Object.assign(this.tasks[idx], patch);
    if (this.useSheets) {
      const ok = await Sheets.updateTask(this.tasks[idx]);
      if (!ok) console.warn('[State.updateTask] Sheet update failed — updated locally only');
    }
    return this.tasks[idx];
  },

  /* ── Close a task with optional comment ─────────────── */
  async closeTask(id, comment) {
    const task = await this.updateTask(id, {
      status:       'done',
      closedAt:     new Date().toISOString().slice(0,10),
      closeComment: comment,
    });
    if (comment) await this.addComment(id, comment);
    await this.addActivity(id, `Task closed${comment ? ': ' + comment.slice(0,60) : ''}`);
    return task;
  },

  /* ── Delete a task ───────────────────────────────────── */
  async deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.useSheets) {
      const rowNum = await Sheets.findTaskRow(id);
      if (rowNum >= 0) {
        await Sheets._post({ action:'update', tab:'Tasks', rowNum,
          row:['','','','','','','','','','','','','',''] });
      } else {
        /* Demo task not in sheet — write tombstone so it won't reappear */
        await Sheets._post({ action:'append', tab:'Tasks',
          row:[id, '__deleted__', '', '', '', '', '', '', '', '', '', '', '', ''] });
      }
    }
  },

  /* ── Edit a comment ─────────────────────────────────── */
  async updateComment(id, text) {
    const cm = this.comments.find(c => c.id === id);
    if (!cm) return;
    cm.text = text;
    if (this.useSheets) Sheets.updateComment(cm);
  },

  /* ── Add a comment ───────────────────────────────────── */
  async addComment(taskId, text) {
    const cm = {
      id:        this.cmId(),
      taskId,
      userId:    this.user?.id || 'u1',
      text,
      createdAt: new Date().toLocaleString('en-GB', {
        day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit',
      }),
    };
    this.comments.push(cm);
    if (this.useSheets) await Sheets.addComment(cm);
    return cm;
  },

  /* ── Filter tasks for current view ──────────────────── */
  filterTasks({ status, type, clientId, assigneeId, search } = {}) {
    const seen = new Set();
    return this.tasks.filter(t => {
      if (seen.has(t.id)) return false; /* deduplicate */
      seen.add(t.id);
      if (status     && status     !== 'all' && t.status     !== status)     return false;
      if (type       && type       !== 'all' && t.type       !== type)       return false;
      if (clientId   && clientId   !== 'all' && t.clientId   !== clientId)   return false;
      if (assigneeId && assigneeId !== 'all' && t.assigneeId !== assigneeId) return false;
      if (this.user?.role !== 'admin') {
        if (t.assigneeId !== this.user?.id) return false;
      }
      if (search) {
        const q      = search.toLowerCase();
        const client = this.getClient(t.clientId);
        if (!t.title.toLowerCase().includes(q) &&
            !(client?.name.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  },

  /* ── Dashboard stats ─────────────────────────────────── */
  dashStats() {
    const today   = new Date().toISOString().slice(0,10);
    const visible = this.user?.role === 'admin'
      ? this.tasks
      : this.tasks.filter(t => t.assigneeId === this.user?.id);
    return {
      total:    visible.length,
      dueToday: visible.filter(t => t.status !== 'done' && t.dueDate === today).length,
      overdue:  visible.filter(t => t.status !== 'done' && t.dueDate <  today).length,
      done:     visible.filter(t => t.status === 'done').length,
    };
  },

  /* ── Client health scorecard ─────────────────────────── */
  clientHealth() {
    const today = new Date().toISOString().slice(0,10);
    return this.clients.map(c => {
      const all  = this.tasks.filter(t => t.clientId === c.id);
      const done = all.filter(t => t.status === 'done').length;
      const over = all.filter(t => t.status !== 'done' && t.dueDate < today).length;
      return {
        ...c,
        total:   all.length,
        done,
        overdue: over,
        pct:     all.length ? Math.round(done / all.length * 100) : 0,
      };
    });
  },
};

/* ═══════════════════════════════════════════════════════════
   PIPELINE DATA — added to State
   ═══════════════════════════════════════════════════════════ */
const DEMO_PIPELINES = [
  { id:'pipe1', name:'VAT Filing',          desc:'Monthly VAT return process', active:true },
  { id:'pipe2', name:'Bank Reconciliation', desc:'Monthly bank rec workflow',   active:true },
  { id:'pipe3', name:'Client Onboarding',   desc:'New client setup process',    active:true },
];

const DEMO_STAGES = [
  { id:'s1', pipelineId:'pipe1', order:1, name:'Documents collected', color:''         },
  { id:'s2', pipelineId:'pipe1', order:2, name:'Review & reconcile',  color:'#b7691a'  },
  { id:'s3', pipelineId:'pipe1', order:3, name:'Submit on FTA',       color:'#1a5fb4'  },
  { id:'s4', pipelineId:'pipe1', order:4, name:'Save confirmation',   color:'#1e6f3e'  },

  { id:'s5', pipelineId:'pipe2', order:1, name:'Statements received', color:''         },
  { id:'s6', pipelineId:'pipe2', order:2, name:'Transactions posted', color:'#b7691a'  },
  { id:'s7', pipelineId:'pipe2', order:3, name:'Differences checked', color:'#1a5fb4'  },
  { id:'s8', pipelineId:'pipe2', order:4, name:'Reconciled & signed', color:'#1e6f3e'  },

  { id:'s9',  pipelineId:'pipe3', order:1, name:'Documents collected', color:''        },
  { id:'s10', pipelineId:'pipe3', order:2, name:'System setup',        color:'#5b3fa6' },
  { id:'s11', pipelineId:'pipe3', order:3, name:'Opening balances',    color:'#1a5fb4' },
  { id:'s12', pipelineId:'pipe3', order:4, name:'First month review',  color:'#1e6f3e' },
];

/* Extend State with pipeline data */
State.pipelines      = [...DEMO_PIPELINES];
State.stages         = [...DEMO_STAGES];
State.activePipelineId = State.pipelines[0]?.id || null;

State.getPipeline  = function(id) { return this.pipelines.find(p => p.id === id); };
State.getStages    = function(pipelineId) { return this.stages.filter(s => s.pipelineId === pipelineId).sort((a,b) => a.order - b.order); };
State.getPipeTasks = function(pipelineId) {
  const seen = new Set();
  return this.tasks.filter(t => {
    if (t.pipelineId !== pipelineId || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

State.addPipeline = async function(name, desc, stageObjs) {
  const id = 'pipe' + Date.now();
  const pipeline = { id, name, desc, active:true };
  this.pipelines.push(pipeline);
  stageObjs.forEach((s, i) => {
    const stage = { id:'s'+Date.now()+i, pipelineId:id, order:i+1,
                    name: typeof s === 'string' ? s : s.name,
                    color: typeof s === 'string' ? '' : (s.color || '') };
    this.stages.push(stage);
  });
  if (this.useSheets) {
    await Sheets._post({ action:'append', tab:'Pipelines', row:[pipeline.id, pipeline.name, pipeline.desc, 'true'] });
    for (const s of this.stages.filter(s => s.pipelineId === id)) {
      await Sheets._post({ action:'append', tab:'PipelineStages', row:[s.id, s.pipelineId, s.order, s.name, s.color||''] });
    }
  }
  return pipeline;
};

State.updateStageColor = async function(stageId, color) {
  const stage = this.stages.find(s => s.id === stageId);
  if (!stage) return;
  stage.color = color || '';
  if (this.useSheets) Sheets.updateStage(stage);
};

State.moveTaskStage = async function(taskId, stageId) {
  const task = this.getTask(taskId);
  if (!task) return;
  task.pipelineStageId = stageId;
  task.status = 'progress';
  const stages = this.getStages(task.pipelineId);
  const lastStage = stages[stages.length - 1];
  if (lastStage && stageId === lastStage.id) task.status = 'done';
  if (this.useSheets) await Sheets.updateTask(task);
  const stageName = stages.find(s => s.id === stageId)?.name || stageId;
  await this.addActivity(taskId, `Moved to stage: ${stageName}`);
};

State.addTemplate = async function(data) {
  const template = { id:'tp' + Date.now(), ...data, active:true };
  this.templates.push(template);
  if (this.useSheets) Sheets.addTemplate(template);
  return template;
};

State.updateTemplate = async function(id, patch) {
  const idx = this.templates.findIndex(t => t.id === id);
  if (idx < 0) return null;
  Object.assign(this.templates[idx], patch);
  if (this.useSheets) Sheets.updateTemplate(this.templates[idx]);
  return this.templates[idx];
};

State.deleteTemplate = async function(id) {
  this.templates = this.templates.filter(t => t.id !== id);
  if (this.useSheets) Sheets.deleteTemplate(id);
};

State.updateUser = async function(id, patch) {
  const idx = this.users.findIndex(u => u.id === id);
  if (idx < 0) return null;
  Object.assign(this.users[idx], patch);
  if (this.useSheets) Sheets.updateUser(this.users[idx]);
  return this.users[idx];
};

State.addUser = async function(data) {
  const user = { id:'u' + Date.now(), ...data };
  this.users.push(user);
  if (this.useSheets) Sheets.addUser(user);
  return user;
};

State.deleteUser = async function(id) {
  this.users = this.users.filter(u => u.id !== id);
  if (this.useSheets) Sheets.deleteUser(id);
};

State.updateClient = async function(id, patch) {
  const idx = this.clients.findIndex(c => c.id === id);
  if (idx < 0) return null;
  Object.assign(this.clients[idx], patch);
  if (this.useSheets) Sheets.updateClient(this.clients[idx]);
  return this.clients[idx];
};

State.deleteClient = async function(id) {
  this.clients = this.clients.filter(c => c.id !== id);
  if (this.useSheets) {
    const rowNum = await Sheets.findRow('Clients', id);
    if (rowNum >= 0) {
      await Sheets._post({ action:'update', tab:'Clients', rowNum, row:['','','','','',''] });
    } else {
      /* Demo client not in sheet — write tombstone */
      await Sheets._post({ action:'append', tab:'Clients',
        row:[id, '__deleted__', '', '', '', ''] });
    }
  }
};

State.updatePipeline = async function(id, patch) {
  const p = this.pipelines.find(p => p.id === id);
  if (!p) return;
  Object.assign(p, patch);
  if (this.useSheets) {
    const rowNum = await Sheets.findRow('Pipelines', id);
    if (rowNum >= 0) {
      await Sheets._post({ action:'update', tab:'Pipelines', rowNum,
        row:[p.id, p.name, p.desc, String(p.active)] });
    }
  }
};

State.addStage = async function(pipelineId, name, color) {
  const existing = this.stages.filter(s => s.pipelineId === pipelineId);
  const order    = existing.length > 0 ? Math.max(...existing.map(s => s.order)) + 1 : 1;
  const stage    = { id:'s'+Date.now(), pipelineId, order, name, color: color||'' };
  this.stages.push(stage);
  if (this.useSheets) {
    await Sheets._post({ action:'append', tab:'PipelineStages',
      row:[stage.id, stage.pipelineId, stage.order, stage.name, stage.color] });
  }
  return stage;
};

State.deleteStage = async function(stageId) {
  this.tasks.forEach(t => { if (t.pipelineStageId === stageId) t.pipelineStageId = null; });
  this.stages = this.stages.filter(s => s.id !== stageId);
  if (this.useSheets) {
    const rowNum = await Sheets.findRow('PipelineStages', stageId);
    if (rowNum >= 0) {
      await Sheets._post({ action:'update', tab:'PipelineStages', rowNum, row:['','','','',''] });
    }
  }
};

State.updateStageData = async function(stageId, patch) {
  const stage = this.stages.find(s => s.id === stageId);
  if (!stage) return;
  Object.assign(stage, patch);
  if (this.useSheets) Sheets.updateStage(stage);
};

State.deletePipeline = async function(id) {
  this.tasks.forEach(t => {
    if (t.pipelineId === id) { t.pipelineId = null; t.pipelineStageId = null; }
  });
  this.stages = this.stages.filter(s => s.pipelineId !== id);
  this.pipelines = this.pipelines.filter(p => p.id !== id);
  if (this.activePipelineId === id) {
    this.activePipelineId = this.pipelines[0]?.id || null;
  }
  if (this.useSheets) Sheets.deletePipeline(id);
};

/* ─── Sub-tasks ─────────────────────────────────────────── */
State.addSubtask = async function(taskId, text) {
  const task = this.getTask(taskId);
  if (!task) return null;
  if (!task.subtasks) task.subtasks = [];
  const st = { id:'st'+Date.now(), text: text.trim(), done:false };
  task.subtasks.push(st);
  if (this.useSheets) Sheets.updateTask(task);
  return st;
};

State.toggleSubtask = async function(taskId, stId) {
  const task = this.getTask(taskId);
  const st   = task?.subtasks?.find(s => s.id === stId);
  if (!st) return;
  st.done = !st.done;
  if (this.useSheets) Sheets.updateTask(task);
};

State.deleteSubtask = async function(taskId, stId) {
  const task = this.getTask(taskId);
  if (!task) return;
  task.subtasks = (task.subtasks || []).filter(s => s.id !== stId);
  if (this.useSheets) Sheets.updateTask(task);
};

/* ─── Activity log ──────────────────────────────────────── */
State.activityLog = [];

State.addActivity = async function(taskId, text) {
  if (!this.user) return; /* skip during initial load */
  const ev = {
    id:        'ev' + (++this.nextId),
    taskId,
    userId:    this.user?.id || '',
    text,
    createdAt: new Date().toLocaleString('en-GB', {
      day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit',
    }),
  };
  this.activityLog.push(ev);
  if (this.useSheets) {
    Sheets._post({ action:'append', tab:'AuditLog',
      row:[ev.id, ev.taskId, ev.userId, ev.text, ev.createdAt] });
  }
};

/* ─── Documents ─────────────────────────────────────────── */
State.documents = [];

State.addDocument = async function(data) {
  const doc = { id:'doc'+Date.now(), ...data };
  this.documents.push(doc);
  if (this.useSheets) Sheets.addDocument(doc);
  return doc;
};

State.updateDocument = async function(id, patch) {
  const idx = this.documents.findIndex(d => d.id === id);
  if (idx < 0) return null;
  Object.assign(this.documents[idx], patch);
  if (this.useSheets) Sheets.updateDocument(this.documents[idx]);
  return this.documents[idx];
};

State.deleteDocument = async function(id) {
  this.documents = this.documents.filter(d => d.id !== id);
  if (this.useSheets) Sheets.deleteDocument(id);
};

State.getClientDocs = function(clientId) {
  return this.documents.filter(d => d.clientId === clientId);
};

State.expiringDocuments = function(days = 30) {
  const today = new Date().toISOString().slice(0,10);
  const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0,10);
  return this.documents
    .filter(d => d.expiryDate)
    .filter(d => d.expiryDate <= limit)
    .sort((a,b) => a.expiryDate.localeCompare(b.expiryDate));
};

/* ─── Task Dependencies ─────────────────────────────────── */
State.addDependency = async function(taskId, blockedById) {
  const task = this.getTask(taskId);
  if (!task) return;
  if (!task.blockedBy) task.blockedBy = [];
  if (!task.blockedBy.includes(blockedById)) {
    task.blockedBy.push(blockedById);
    if (this.useSheets) Sheets.updateTask(task);
    await this.addActivity(taskId, `Added dependency: blocked by task ${blockedById}`);
  }
};

State.removeDependency = async function(taskId, blockedById) {
  const task = this.getTask(taskId);
  if (!task) return;
  task.blockedBy = (task.blockedBy || []).filter(id => id !== blockedById);
  if (this.useSheets) Sheets.updateTask(task);
  await this.addActivity(taskId, `Removed dependency`);
};

State.isBlocked = function(taskId) {
  const task = this.getTask(taskId);
  if (!task?.blockedBy?.length) return false;
  return task.blockedBy.some(bid => {
    const blocker = this.getTask(bid);
    return blocker && blocker.status !== 'done';
  });
};

/* ─── Saved Filter Views ────────────────────────────────── */
State.addSavedView = async function(name, filters) {
  const v = { id:'sv'+Date.now(), name, userId: this.user?.id||'', filters };
  this.savedViews.push(v);
  if (this.useSheets) Sheets.addSavedView(v);
  return v;
};

State.deleteSavedView = async function(id) {
  this.savedViews = this.savedViews.filter(v => v.id !== id);
  if (this.useSheets) Sheets.deleteSavedView(id);
};

/* ─── Time Tracking ─────────────────────────────────────── */
State.addTimeLog = async function(data) {
  const log = {
    id:          'tl'+Date.now(),
    taskId:      data.taskId,
    userId:      this.user?.id || '',
    hours:       Number(data.hours) || 0,
    description: data.description || '',
    date:        data.date || new Date().toISOString().slice(0,10),
    billable:    data.billable !== false,
  };
  this.timeLogs.push(log);
  if (this.useSheets) Sheets.addTimeLog(log);
  await this.addActivity(data.taskId, `Time logged: ${log.hours}h${log.description ? ' — '+log.description.slice(0,50) : ''}`);
  return log;
};

State.deleteTimeLog = async function(id) {
  this.timeLogs = this.timeLogs.filter(l => l.id !== id);
  if (this.useSheets) Sheets.deleteTimeLog(id);
};

State.getTaskTimeLogs = function(taskId) {
  return this.timeLogs.filter(l => l.taskId === taskId)
    .sort((a,b) => b.date.localeCompare(a.date));
};

State.getUserHours = function(userId, month) {
  return this.timeLogs
    .filter(l => l.userId === userId && (!month || l.date.startsWith(month)))
    .reduce((sum, l) => sum + l.hours, 0);
};
