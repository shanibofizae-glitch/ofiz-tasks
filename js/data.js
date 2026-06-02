/* ============================================================
   OFIZ Tasks — Data Layer
   Fill in your 4 credentials in the CONFIG block below.
   ============================================================ */

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

  /* Load all tasks from sheet on login */
  async loadTasks() {
    const rows = await this._get('Tasks!A2:N');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({
        id:           r[0]  || '',
        title:        r[1]  || '',
        clientId:     r[2]  || '',
        type:         r[3]  || 'oneoff',
        status:       r[4]  || 'pending',
        priority:     r[5]  || 'medium',
        assigneeId:   r[6]  || '',
        dueDate:      r[7]  || '',
        notes:        r[8]  || '',
        createdAt:    r[9]  || '',
        closedAt:     r[10] || null,
        closeComment:    r[11] || '',
        pipelineId:      r[12] || null,
        pipelineStageId: r[13] || null,
      }));
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
      .filter(r => r[0] && r[0].trim() !== '')
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
    const rows = await this._get('Users!A2:G');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({
        id:       r[0] || '',
        name:     r[1] || '',
        email:    r[2] || '',
        role:     r[3] || 'viewer',
        initials: r[4] || '??',
        avClass:  r[5] || 'av-viewer',
        password: r[6] || '',
      }));
  },
};

/* ══════════════════════════════════════════════════════════
   State — in-memory store + all CRUD with Sheet sync
   ══════════════════════════════════════════════════════════ */
const State = {
  user:      null,
  tasks:     [...DEMO.tasks],
  comments:  [...DEMO.comments],
  clients:   [...DEMO.clients],
  users:     [...DEMO.users],
  templates: [...DEMO.templates],
  nextId:    100,
  useSheets: true,   /* ← keep true now that credentials are set */

  uid()  { return 't'  + (++this.nextId); },
  cmId() { return 'cm' + (++this.nextId); },

  /* ── Lookup helpers ──────────────────────────────────── */
  getTask(id)      { return this.tasks.find(t => t.id === id); },
  getClient(id)    { return this.clients.find(c => c.id === id); },
  getUser(id)      { return this.users.find(u => u.id === id); },
  getComments(tid) { return this.comments.filter(c => c.taskId === tid); },

  overdueTasks() {
    const today = new Date().toISOString().slice(0,10);
    return this.tasks.filter(t => t.status !== 'done' && t.dueDate < today);
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
      const [sheetTasks, sheetComments, sheetClients, sheetUsers] = await Promise.all([
        Sheets.loadTasks(),
        Sheets.loadComments(),
        Sheets.loadClients(),
        Sheets.loadUsers(),
      ]);
      if (sheetTasks.length > 0) {
        const sheetIds = new Set(sheetTasks.map(t => t.id));
        const demoOnly = DEMO.tasks.filter(t => !sheetIds.has(t.id));
        this.tasks = [...sheetTasks, ...demoOnly];
        console.log('[State] Loaded', sheetTasks.length, 'tasks from Sheets');
      } else {
        console.log('[State] No tasks in sheet yet — showing demo data');
      }
      if (sheetComments.length > 0) {
        this.comments = sheetComments;
        console.log('[State] Loaded', sheetComments.length, 'comments from Sheets');
      }
      if (sheetClients && sheetClients.length > 0) {
        const sheetIds = new Set(sheetClients.map(c => c.id));
        const demoOnly = DEMO.clients.filter(c => !sheetIds.has(c.id));
        this.clients = [...sheetClients, ...demoOnly];
        console.log('[State] Loaded', sheetClients.length, 'clients from Sheets');
      }
      if (sheetUsers && sheetUsers.length > 0) {
        this.users = sheetUsers;
        console.log('[State] Loaded', sheetUsers.length, 'users from Sheets');
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
    };
    this.tasks.unshift(task);
    if (this.useSheets) {
      const ok = await Sheets.addTask(task);
      if (!ok) console.warn('[State.addTask] Sheet write failed — task saved locally only');
    }
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
    return task;
  },

  /* ── Delete a task ───────────────────────────────────── */
  async deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.useSheets) {
      const ok = await Sheets.deleteTask(id);
      if (!ok) console.warn('[State.deleteTask] Sheet delete failed — deleted locally only');
    }
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
    return this.tasks.filter(t => {
      if (status     && status     !== 'all' && t.status     !== status)     return false;
      if (type       && type       !== 'all' && t.type       !== type)       return false;
      if (clientId   && clientId   !== 'all' && t.clientId   !== clientId)   return false;
      if (assigneeId && assigneeId !== 'all' && t.assigneeId !== assigneeId) return false;
      if (this.user?.role !== 'admin' && this.user?.role !== 'assistant') {
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
    const visible = this.user?.role === 'viewer'
      ? this.tasks.filter(t => t.assigneeId === this.user.id)
      : this.tasks;
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
  { id:'s1', pipelineId:'pipe1', order:1, name:'Documents collected' },
  { id:'s2', pipelineId:'pipe1', order:2, name:'Review & reconcile'  },
  { id:'s3', pipelineId:'pipe1', order:3, name:'Submit on FTA'       },
  { id:'s4', pipelineId:'pipe1', order:4, name:'Save confirmation'   },

  { id:'s5', pipelineId:'pipe2', order:1, name:'Statements received' },
  { id:'s6', pipelineId:'pipe2', order:2, name:'Transactions posted'  },
  { id:'s7', pipelineId:'pipe2', order:3, name:'Differences checked'  },
  { id:'s8', pipelineId:'pipe2', order:4, name:'Reconciled & signed'  },

  { id:'s9',  pipelineId:'pipe3', order:1, name:'Documents collected' },
  { id:'s10', pipelineId:'pipe3', order:2, name:'System setup'        },
  { id:'s11', pipelineId:'pipe3', order:3, name:'Opening balances'    },
  { id:'s12', pipelineId:'pipe3', order:4, name:'First month review'  },
];

/* Extend State with pipeline data */
State.pipelines      = [...DEMO_PIPELINES];
State.stages         = [...DEMO_STAGES];
State.activePipelineId = State.pipelines[0]?.id || null;

State.getPipeline  = function(id) { return this.pipelines.find(p => p.id === id); };
State.getStages    = function(pipelineId) { return this.stages.filter(s => s.pipelineId === pipelineId).sort((a,b) => a.order - b.order); };
State.getPipeTasks = function(pipelineId) { return this.tasks.filter(t => t.pipelineId === pipelineId); };

State.addPipeline = async function(name, desc, stageNames) {
  const id = 'pipe' + Date.now();
  const pipeline = { id, name, desc, active:true };
  this.pipelines.push(pipeline);
  stageNames.forEach((name, i) => {
    const stage = { id:'s'+Date.now()+i, pipelineId:id, order:i+1, name };
    this.stages.push(stage);
  });
  if (this.useSheets) {
    await Sheets._post({ action:'append', tab:'Pipelines', row:[pipeline.id, pipeline.name, pipeline.desc, 'true'] });
    for (const s of this.stages.filter(s => s.pipelineId === id)) {
      await Sheets._post({ action:'append', tab:'PipelineStages', row:[s.id, s.pipelineId, s.order, s.name] });
    }
  }
  return pipeline;
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
};
