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
    { id:'c1', name:'Sorry Guys Marketing Agency', short:'SGMA', color:'#4f8ef7', bg:'rgba(79,142,247,0.12)',  active:true, tradeLicense:'', trn:'', vatNumber:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'' },
    { id:'c2', name:'The Den DXB',                 short:'DEN',  color:'#a78bfa', bg:'rgba(167,139,250,0.12)', active:true, tradeLicense:'', trn:'', vatNumber:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'' },
    { id:'c3', name:'Into The Room',               short:'ITR',  color:'#34c27a', bg:'rgba(52,194,122,0.12)',  active:true, tradeLicense:'', trn:'', vatNumber:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'' },
    { id:'c4', name:'Trade Capital Partners',      short:'TCP',  color:'#f5a623', bg:'rgba(245,166,35,0.12)',  active:true, tradeLicense:'', trn:'', vatNumber:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'' },
    { id:'c5', name:'Global Data Comm. Services',  short:'GDCS', color:'#f05454', bg:'rgba(240,84,84,0.12)',   active:true, tradeLicense:'', trn:'', vatNumber:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'' },
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
  _clientRow(c) {
    return [
      c.id, c.name, c.short, c.color, c.bg, String(c.active),
      c.tradeLicense||'', c.trn||'', c.vatNumber||'', c.incorporationDate||'',
      c.contactName||'', c.contactPhone||'', c.contactEmail||'', c.contactWhatsapp||'',
      c.classification||'Mainland', String(c.vatRegistered||false),
      String(c.wpsRequired||false), String(c.payrollManaged||false),
      c.assignedAccountantId||'', c.clientSince||'',
    ];
  },

  async updateClient(client) {
    const rowNum = await this.findRow('Clients', client.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Clients', rowNum, row:this._clientRow(client) }));
  },

  async deleteClient(clientId) {
    const rowNum = await this.findRow('Clients', clientId);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Clients', rowNum,
      row:['','','','','','','','','','','','','','','','','','','',''] }));
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
      task.stageEnteredAt || '',
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
    const rows = await this._get('Tasks!A2:Q');
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
        stageEnteredAt:  r[16] || null,
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

  /* Reminders */
  async loadReminders() {
    const rows = await this._get('Reminders!A2:N');
    if (!rows || !rows.length) return [];
    return rows.filter(r => r[0]).map(r => ({
      id:              r[0]  || '',
      title:           r[1]  || '',
      category:        r[2]  || 'Custom',
      amount:          r[3]  ? Number(r[3]) : null,
      clientId:        r[4]  || '',
      eventDate:       r[5] || '',
      remind1:         r[6]  ? Number(r[6]) : null,
      remind2:         r[7]  ? Number(r[7]) : null,
      remind3:         r[8]  ? Number(r[8]) : null,
      notifyEmail:     r[9]  !== 'false' && r[9]  !== false,
      notifyTelegram:  r[10] !== 'false' && r[10] !== false,
      notes:           r[11] || '',
      active:          r[12] !== 'false' && r[12] !== false,
      paidAt:          r[13] || '',
    }));
  },
  async addReminder(rem) {
    return !!(await this._post({ action:'append', tab:'Reminders',
      row:[rem.id, rem.title, rem.category, rem.amount||'', rem.clientId||'',
           rem.eventDate, rem.remind1||'', rem.remind2||'', rem.remind3||'',
           String(rem.notifyEmail), String(rem.notifyTelegram),
           rem.notes||'', 'true', ''] }));
  },
  async updateReminder(rem) {
    const rowNum = await this.findRow('Reminders', rem.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Reminders', rowNum,
      row:[rem.id, rem.title, rem.category, rem.amount||'', rem.clientId||'',
           rem.eventDate, rem.remind1||'', rem.remind2||'', rem.remind3||'',
           String(rem.notifyEmail), String(rem.notifyTelegram),
           rem.notes||'', String(rem.active), rem.paidAt||''] }));
  },
  async deleteReminder(id) {
    const rowNum = await this.findRow('Reminders', id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Reminders', rowNum,
      row:['','','','','','','','','','','','','',''] }));
  },

  /* Client notes */
  async loadClientNotes() {
    const rows = await this._get('ClientNotes!A2:E');
    if (!rows || !rows.length) return [];
    return rows.filter(r => r[0]).map(r => ({
      id:r[0]||'', clientId:r[1]||'', userId:r[2]||'', text:r[3]||'', createdAt:r[4]||''
    }));
  },
  async addClientNote(note) {
    return !!(await this._post({ action:'append', tab:'ClientNotes',
      row:[note.id, note.clientId, note.userId, note.text, note.createdAt] }));
  },
  async deleteClientNote(id) {
    const rowNum = await this.findRow('ClientNotes', id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'ClientNotes', rowNum,
      row:['','','','',''] }));
  },

  /* Messages */
  async loadMessages() {
    const rows = await this._get('Messages!A2:E');
    if (!rows || rows.length === 0) return [];
    return rows.filter(r => r[0]).map(r => ({
      id: r[0]||'', fromUserId: r[1]||'', channel: r[2]||'', text: r[3]||'', createdAt: r[4]||''
    }));
  },
  async sendMessage(msg) {
    return !!(await this._post({ action:'append', tab:'Messages',
      row:[msg.id, msg.fromUserId, msg.channel, msg.text, msg.createdAt] }));
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
    const rows = await this._get('Clients!A2:T');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '' && r[1] !== '__deleted__')
      .map(r => ({
        id:                   r[0]  || '',
        name:                 r[1]  || '',
        short:                r[2]  || '',
        color:                r[3]  || '#4f8ef7',
        bg:                   r[4]  || 'rgba(79,142,247,0.12)',
        active:               r[5]  !== 'false',
        tradeLicense:         r[6]  || '',
        trn:                  r[7]  || '',
        vatNumber:            r[8]  || '',
        incorporationDate:    r[9]  || '',
        contactName:          r[10] || '',
        contactPhone:         r[11] || '',
        contactEmail:         r[12] || '',
        contactWhatsapp:      r[13] || '',
        classification:       r[14] || 'Mainland',
        vatRegistered:        r[15] === 'true',
        wpsRequired:          r[16] === 'true',
        payrollManaged:       r[17] === 'true',
        assignedAccountantId: r[18] || '',
        clientSince:          r[19] || '',
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
    const rows = await this._get('Templates!A2:P');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({
        id:                   r[0]  || '',
        title:                r[1]  || '',
        clientId:             r[2]  || '',
        recurrence:           r[3]  || 'monthly',
        dayOfMonth:           r[4]  ? Number(r[4]) : null,
        dayOfWeek:            r[5]  || null,
        assigneeId:           r[6]  || '',
        active:               r[7]  !== 'false',
        priority:             r[8]  || 'medium',
        notes:                r[9]  || '',
        subtasks:             _parseSt(r[10]),
        pipelineId:           r[11] || '',
        pipelineStageId:      r[12] || '',
        estimatedHours:       r[13] ? Number(r[13]) : 0,
        defaultComments:      _parseSt(r[14]),
        templateDependencies: _parseSt(r[15]),
      }));
  },

  _templateRow(t) {
    return [
      t.id, t.title, t.clientId, t.recurrence,
      t.dayOfMonth || '', t.dayOfWeek || '', t.assigneeId, String(t.active),
      t.priority || 'medium', t.notes || '',
      (t.subtasks?.length)             ? JSON.stringify(t.subtasks)             : '',
      t.pipelineId || '', t.pipelineStageId || '',
      t.estimatedHours || '',
      (t.defaultComments?.length)      ? JSON.stringify(t.defaultComments)      : '',
      (t.templateDependencies?.length) ? JSON.stringify(t.templateDependencies) : '',
    ];
  },

  async addTemplate(template) {
    return !!(await this._post({ action:'append', tab:'Templates', row:this._templateRow(template) }));
  },

  async updateTemplate(template) {
    const rowNum = await this.findRow('Templates', template.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Templates', rowNum, row:this._templateRow(template) }));
  },

  async deleteTemplate(templateId) {
    const rowNum = await this.findRow('Templates', templateId);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'Templates', rowNum,
      row:['','','','','','','','','','','','','','','',''] }));
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
    const rows = await this._get('PipelineStages!A2:F');
    if (!rows || rows.length === 0) return [];
    return rows
      .filter(r => r[0] && r[0].trim() !== '')
      .map(r => ({
        id:         r[0] || '',
        pipelineId: r[1] || '',
        order:      Number(r[2]) || 0,
        name:       r[3] || '',
        color:      r[4] || '',
        targetDays: r[5] ? Number(r[5]) : 0,
      }));
  },

  /* Update a stage row */
  async updateStage(stage) {
    const rowNum = await this.findRow('PipelineStages', stage.id);
    if (rowNum < 0) return false;
    return !!(await this._post({ action:'update', tab:'PipelineStages', rowNum,
      row:[stage.id, stage.pipelineId, stage.order, stage.name, stage.color||'', stage.targetDays||''] }));
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
  messages:    [],
  clientNotes: [],
  reminders:   [],
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
             sheetActivity, sheetDocs, sheetViews, sheetTimeLogs,
             sheetMessages, sheetClientNotes, sheetReminders] = await Promise.all([
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
        Sheets.loadMessages(),
        Sheets.loadClientNotes(),
        Sheets.loadReminders(),
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
      if (sheetMessages) {
        this.messages = sheetMessages;
      }
      if (sheetClientNotes && sheetClientNotes.length > 0) {
        this.clientNotes = sheetClientNotes;
      }
      if (sheetReminders) {
        this.reminders = sheetReminders;
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
      createdAt:      new Date().toISOString().slice(0,10),
      closedAt:       null,
      closeComment:   '',
      subtasks:       data.subtasks || [],
      stageEnteredAt: data.pipelineId ? new Date().toISOString().slice(0,10) : null,
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
    const today = new Date().toISOString().slice(0,10);
    const seen  = new Set();
    return this.tasks.filter(t => {
      if (seen.has(t.id)) return false; /* deduplicate */
      seen.add(t.id);

      /* Status filter — derives effective status from date + status field */
      if (status && status !== 'all') {
        const isDone    = t.status === 'done';
        const isOverdue = !isDone && t.dueDate && t.dueDate < today;
        const isInProg  = !isDone && !isOverdue && t.status === 'progress';
        const isPending = !isDone && !isOverdue && !isInProg;
        if (status === 'active'   && isDone)    return false;
        if (status === 'done'     && !isDone)   return false;
        if (status === 'overdue'  && !isOverdue) return false;
        if (status === 'progress' && !isInProg) return false;
        if (status === 'pending'  && !isPending) return false;
      }

      if (type && type !== 'all' && t.type !== type) return false;
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
  { id:'s1', pipelineId:'pipe1', order:1, name:'Documents collected', color:'',        targetDays:2 },
  { id:'s2', pipelineId:'pipe1', order:2, name:'Review & reconcile',  color:'#b7691a', targetDays:3 },
  { id:'s3', pipelineId:'pipe1', order:3, name:'Submit on FTA',       color:'#1a5fb4', targetDays:1 },
  { id:'s4', pipelineId:'pipe1', order:4, name:'Save confirmation',   color:'#1e6f3e', targetDays:1 },

  { id:'s5', pipelineId:'pipe2', order:1, name:'Statements received', color:'',        targetDays:1 },
  { id:'s6', pipelineId:'pipe2', order:2, name:'Transactions posted', color:'#b7691a', targetDays:3 },
  { id:'s7', pipelineId:'pipe2', order:3, name:'Differences checked', color:'#1a5fb4', targetDays:2 },
  { id:'s8', pipelineId:'pipe2', order:4, name:'Reconciled & signed', color:'#1e6f3e', targetDays:1 },

  { id:'s9',  pipelineId:'pipe3', order:1, name:'Documents collected', color:'',        targetDays:3 },
  { id:'s10', pipelineId:'pipe3', order:2, name:'System setup',        color:'#5b3fa6', targetDays:2 },
  { id:'s11', pipelineId:'pipe3', order:3, name:'Opening balances',    color:'#1a5fb4', targetDays:3 },
  { id:'s12', pipelineId:'pipe3', order:4, name:'First month review',  color:'#1e6f3e', targetDays:2 },
];

/* Pre-built pipeline templates */
const PIPELINE_TEMPLATES = [
  { id:'tpl1', name:'VAT Filing',          desc:'Monthly/quarterly VAT return process',    icon:'ti-receipt',         color:'#1a5fb4',
    stages:[{name:'Documents collected',color:'',targetDays:2},{name:'Review & reconcile',color:'#b7691a',targetDays:3},{name:'Submit on FTA',color:'#1a5fb4',targetDays:1},{name:'Confirmation saved',color:'#1e6f3e',targetDays:1}] },
  { id:'tpl2', name:'Bank Reconciliation', desc:'Monthly bank reconciliation workflow',    icon:'ti-building-bank',   color:'#0d7a6b',
    stages:[{name:'Statements received',color:'',targetDays:1},{name:'Transactions posted',color:'#b7691a',targetDays:3},{name:'Differences checked',color:'#1a5fb4',targetDays:2},{name:'Reconciled & signed',color:'#1e6f3e',targetDays:1}] },
  { id:'tpl3', name:'Payroll Processing',  desc:'Monthly payroll and WPS submission',      icon:'ti-cash',            color:'#b7691a',
    stages:[{name:'Hours collected',color:'',targetDays:2},{name:'Payroll calculated',color:'#b7691a',targetDays:2},{name:'WPS transferred',color:'#1a5fb4',targetDays:1},{name:'Filed & confirmed',color:'#1e6f3e',targetDays:1}] },
  { id:'tpl4', name:'Client Onboarding',   desc:'New client setup and opening balances',   icon:'ti-user-plus',       color:'#5b3fa6',
    stages:[{name:'KYC & documents',color:'',targetDays:3},{name:'System setup',color:'#5b3fa6',targetDays:2},{name:'Opening balances',color:'#1a5fb4',targetDays:3},{name:'Chart of accounts',color:'#b7691a',targetDays:2},{name:'First month review',color:'#1e6f3e',targetDays:2}] },
  { id:'tpl5', name:'Year-End Closing',    desc:'Annual accounts preparation and filing',  icon:'ti-calendar-check',  color:'#c0392b',
    stages:[{name:'Data collection',color:'',targetDays:5},{name:'Adjustments',color:'#b7691a',targetDays:3},{name:'Trial balance',color:'#1a5fb4',targetDays:2},{name:'Management report',color:'#5b3fa6',targetDays:2},{name:'Client sign-off',color:'#1e6f3e',targetDays:3}] },
  { id:'tpl6', name:'Corporate Tax',       desc:'UAE corporate tax return preparation',    icon:'ti-building',        color:'#c2185b',
    stages:[{name:'P&L review',color:'',targetDays:3},{name:'Tax calculation',color:'#b7691a',targetDays:3},{name:'EmaraTax submission',color:'#1a5fb4',targetDays:2},{name:'Filing confirmed',color:'#1e6f3e',targetDays:1}] },
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
                    name:       typeof s === 'string' ? s : s.name,
                    color:      typeof s === 'string' ? '' : (s.color || ''),
                    targetDays: typeof s === 'string' ? 0  : (s.targetDays || 0) };
    this.stages.push(stage);
  });
  if (this.useSheets) {
    await Sheets._post({ action:'append', tab:'Pipelines', row:[pipeline.id, pipeline.name, pipeline.desc, 'true'] });
    for (const s of this.stages.filter(s => s.pipelineId === id)) {
      await Sheets._post({ action:'append', tab:'PipelineStages', row:[s.id, s.pipelineId, s.order, s.name, s.color||'', s.targetDays||''] });
    }
  }
  return pipeline;
};

State.createPipelineFromTemplate = async function(templateId) {
  const tpl = PIPELINE_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return;
  const pipeline = await this.addPipeline(tpl.name, tpl.desc, tpl.stages);
  this.activePipelineId = pipeline.id;
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
  task.stageEnteredAt  = new Date().toISOString().slice(0,10);
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
  if (this.useSheets) await Sheets.updateClient(this.clients[idx]);
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
        row:[id, '__deleted__', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] });
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

State.addStage = async function(pipelineId, name, color, targetDays) {
  const existing = this.stages.filter(s => s.pipelineId === pipelineId);
  const order    = existing.length > 0 ? Math.max(...existing.map(s => s.order)) + 1 : 1;
  const stage    = { id:'s'+Date.now(), pipelineId, order, name, color: color||'', targetDays: targetDays||0 };
  this.stages.push(stage);
  if (this.useSheets) {
    await Sheets._post({ action:'append', tab:'PipelineStages',
      row:[stage.id, stage.pipelineId, stage.order, stage.name, stage.color, stage.targetDays||''] });
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

/* ─── Reminders ─────────────────────────────────────────── */
State.addReminder = async function(data) {
  const rem = { id:'rem'+Date.now(), ...data, active:true, paidAt:'' };
  this.reminders.push(rem);
  if (this.useSheets) Sheets.addReminder(rem);
  return rem;
};

State.updateReminder = async function(id, patch) {
  const idx = this.reminders.findIndex(r => r.id === id);
  if (idx < 0) return null;
  Object.assign(this.reminders[idx], patch);
  if (this.useSheets) Sheets.updateReminder(this.reminders[idx]);
  return this.reminders[idx];
};

State.deleteReminder = async function(id) {
  this.reminders = this.reminders.filter(r => r.id !== id);
  if (this.useSheets) Sheets.deleteReminder(id);
};

State.markReminderPaid = async function(id) {
  const today = new Date().toISOString().slice(0,10);
  return await this.updateReminder(id, { paidAt: today, active: false });
};

State.upcomingReminders = function() {
  const today = new Date().toISOString().slice(0,10);
  return this.reminders
    .filter(r => r.active && !r.paidAt)
    .sort((a,b) => (a.eventDate||'').localeCompare(b.eventDate||''));
};

/* ─── Client Notes ──────────────────────────────────────── */
State.getClientNotes = function(clientId) {
  return this.clientNotes
    .filter(n => n.clientId === clientId)
    .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
};

State.addClientNote = async function(clientId, text) {
  const note = {
    id:        'cn' + Date.now(),
    clientId,
    userId:    this.user?.id || '',
    text,
    createdAt: new Date().toLocaleString('en-GB', {
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit',
    }),
  };
  this.clientNotes.push(note);
  if (this.useSheets) Sheets.addClientNote(note);
  return note;
};

State.deleteClientNote = async function(id) {
  this.clientNotes = this.clientNotes.filter(n => n.id !== id);
  if (this.useSheets) Sheets.deleteClientNote(id);
};

/* ─── Client Health Score ───────────────────────────────── */
State.clientHealthScore = function(clientId) {
  const today    = new Date().toISOString().slice(0,10);
  const soon     = new Date(Date.now() + 14*86400000).toISOString().slice(0,10);
  const tasks    = this.tasks.filter(t => t.clientId === clientId);
  const open     = tasks.filter(t => t.status !== 'done');
  const overdue  = open.filter(t => t.dueDate && t.dueDate < today).length;
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === 'done').length;
  const pct      = total ? Math.round(done / total * 100) : 100;
  const docs     = this.getClientDocs(clientId);
  const expired  = docs.filter(d => d.expiryDate && d.expiryDate < today).length;
  const expiring = docs.filter(d => d.expiryDate && d.expiryDate >= today && d.expiryDate <= soon).length;

  let score, label, color, bg;
  if (expired > 0 || overdue >= 5 || pct < 30) {
    score='D'; label='Critical';     color='var(--red)';    bg='var(--red-light)';
  } else if (overdue >= 3 || pct < 50 || expiring > 0) {
    score='C'; label='Needs attention'; color='var(--amber)'; bg='var(--amber-light)';
  } else if (overdue >= 1 || pct < 75) {
    score='B'; label='Good';         color='var(--blue)';   bg='var(--blue-light)';
  } else {
    score='A'; label='Excellent';    color='var(--green)';  bg='var(--green-light)';
  }
  return { score, label, color, bg, pct, overdue, expired, expiring };
};

/* ─── VAT Next Due Date ─────────────────────────────────── */
State.vatNextDue = function(clientId) {
  const c = this.getClient(clientId);
  if (!c?.vatRegistered) return null;
  const now = new Date();
  const m   = now.getMonth(); // 0-11
  const y   = now.getFullYear();
  // UAE VAT quarters end: Mar(2), Jun(5), Sep(8), Dec(11)
  let qEnd;
  if      (m <= 2)  qEnd = new Date(y, 3, 0);   // Mar 31
  else if (m <= 5)  qEnd = new Date(y, 6, 0);   // Jun 30
  else if (m <= 8)  qEnd = new Date(y, 9, 0);   // Sep 30
  else              qEnd = new Date(y, 12, 0);   // Dec 31
  let due = new Date(qEnd.getTime() + 28*86400000);
  if (due < now) {
    qEnd = new Date(qEnd.getFullYear(), qEnd.getMonth() + 3 + 1, 0);
    due  = new Date(qEnd.getTime() + 28*86400000);
  }
  return due.toISOString().slice(0,10);
};

/* ─── Client Billable Hours ─────────────────────────────── */
State.clientBillableHours = function(clientId) {
  const now    = new Date();
  const thisM  = now.toISOString().slice(0,7);
  const lastM  = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString().slice(0,7);
  const logs   = this.timeLogs.filter(l => {
    const task = this.getTask(l.taskId);
    return task?.clientId === clientId;
  });
  return {
    thisMonth: logs.filter(l => l.date?.startsWith(thisM)).reduce((s,l)=>s+l.hours,0),
    lastMonth: logs.filter(l => l.date?.startsWith(lastM)).reduce((s,l)=>s+l.hours,0),
    total:     logs.reduce((s,l)=>s+l.hours,0),
  };
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
