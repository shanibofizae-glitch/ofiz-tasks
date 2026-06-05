/* ============================================================
   OFIZ Tasks — Data Layer
   Fill in your 4 credentials in the CONFIG block below.
   ============================================================ */

/* Generate all occurrence dates for a reminder */
function _getOccurrenceDates(rem) {
  if (!rem.recurrence || rem.recurrence === 'none') {
    return rem.eventDate ? [rem.eventDate] : [];
  }
  const cfg  = rem.recurrenceConfig || {};
  const base = new Date(rem.eventDate);
  const dates = [];
  if (rem.recurrence === 'monthly') {
    const n = cfg.months || 12;
    for (let i = 0; i < n; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, base.getDate());
      dates.push(d.toISOString().slice(0, 10));
    }
  } else if (rem.recurrence === 'quarterly') {
    const n = cfg.quarters || 4;
    for (let i = 0; i < n; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + (i * 3), base.getDate());
      dates.push(d.toISOString().slice(0, 10));
    }
  } else if (rem.recurrence === 'custom') {
    dates.push(rem.eventDate);
    (cfg.dates || []).forEach(d => { if (d && !dates.includes(d)) dates.push(d); });
    dates.sort();
  }
  return dates;
}

/* Parse subtasks JSON stored in sheet column */
function _parseSt(val) {
  if (!val || !String(val).trim()) return [];
  try { return JSON.parse(val); } catch(e) { return []; }
}

const CONFIG = {
  SUPABASE_URL: 'https://xtgywfvcemnnamtjybts.supabase.co',
  SUPABASE_KEY: 'sb_publishable_BEzuQYssb6I0I8rLg5atNw_Txhw1PsF',
  /* Apps Script kept for email/telegram notifications only */
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
    { id:'c1', name:'Sorry Guys Marketing Agency', short:'SGMA', color:'#4f8ef7', bg:'rgba(79,142,247,0.12)',  active:true, tradeLicense:'', trn:'', corporateTaxNo:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'', sortOrder:0, vatStartDate:'', ctAnniversaryDate:'', tags:[] },
    { id:'c2', name:'The Den DXB',                 short:'DEN',  color:'#a78bfa', bg:'rgba(167,139,250,0.12)', active:true, tradeLicense:'', trn:'', corporateTaxNo:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'', sortOrder:1, vatStartDate:'', ctAnniversaryDate:'', tags:[] },
    { id:'c3', name:'Into The Room',               short:'ITR',  color:'#34c27a', bg:'rgba(52,194,122,0.12)',  active:true, tradeLicense:'', trn:'', corporateTaxNo:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'', sortOrder:2, vatStartDate:'', ctAnniversaryDate:'', tags:[] },
    { id:'c4', name:'Trade Capital Partners',      short:'TCP',  color:'#f5a623', bg:'rgba(245,166,35,0.12)',  active:true, tradeLicense:'', trn:'', corporateTaxNo:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'', sortOrder:3, vatStartDate:'', ctAnniversaryDate:'', tags:[] },
    { id:'c5', name:'Global Data Comm. Services',  short:'GDCS', color:'#f05454', bg:'rgba(240,84,84,0.12)',   active:true, tradeLicense:'', trn:'', corporateTaxNo:'', incorporationDate:'', contactName:'', contactPhone:'', contactEmail:'', contactWhatsapp:'', classification:'Mainland', vatRegistered:false, wpsRequired:false, payrollManaged:false, assignedAccountantId:'', clientSince:'', sortOrder:4, vatStartDate:'', ctAnniversaryDate:'', tags:[] },
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
   Supabase Data Layer  (replaces Google Sheets)
   All reads + writes go to Supabase PostgreSQL.
   Apps Script is kept only for email/telegram notifications.
   ══════════════════════════════════════════════════════════ */

/* ── Field mappers: DB (snake_case) ↔ JS (camelCase) ─── */
function _taskFromDb(r)    { return { id:r.id, title:r.title, clientId:r.client_id, type:r.type||'oneoff', status:r.status||'pending', priority:r.priority||'medium', assigneeId:r.assignee_id, dueDate:r.due_date||'', startDate:r.start_date||'', notes:r.notes||'', createdAt:r.created_at||'', closedAt:r.closed_at, closeComment:r.close_comment||'', previousStatus:r.previous_status||'', pipelineId:r.pipeline_id, pipelineStageId:r.pipeline_stage_id, subtasks:Array.isArray(r.subtasks)?r.subtasks:[], blockedBy:Array.isArray(r.blocked_by)?r.blocked_by:[], stageEnteredAt:r.stage_entered_at||null }; }
function _taskToDb(t)      { return { id:t.id, title:t.title, client_id:t.clientId||null, type:t.type, status:t.status, priority:t.priority, assignee_id:t.assigneeId||null, due_date:t.dueDate||null, start_date:t.startDate||null, notes:t.notes||'', created_at:t.createdAt, closed_at:t.closedAt||null, close_comment:t.closeComment||'', previous_status:t.previousStatus||null, pipeline_id:t.pipelineId||null, pipeline_stage_id:t.pipelineStageId||null, subtasks:t.subtasks||[], blocked_by:t.blockedBy||[], stage_entered_at:t.stageEnteredAt||null }; }
function _clientFromDb(r)  { return { id:r.id, name:r.name, short:r.short, color:r.color, bg:r.bg, active:r.active, shareholders:Array.isArray(r.shareholders)?r.shareholders:[], tradeLicense:r.trade_license||'', tradeLicenseExpiry:r.trade_license_expiry||'', trn:r.trn||'', corporateTaxNo:r.corporate_tax_no||'', incorporationDate:r.incorporation_date||'', contactName:r.contact_name||'', contactPhone:r.contact_phone||'', contactEmail:r.contact_email||'', contactWhatsapp:r.contact_whatsapp||'', classification:r.classification||'Mainland', vatRegistered:!!r.vat_registered, wpsRequired:!!r.wps_required, payrollManaged:!!r.payroll_managed, assignedAccountantId:r.assigned_accountant_id||'', clientSince:r.client_since||'', sortOrder:r.sort_order??999, vatStartDate:r.vat_start_date||'', ctAnniversaryDate:r.ct_anniversary_date||'', tags:Array.isArray(r.tags)?r.tags:[] }; }
function _clientToDb(c)    { return { id:c.id, name:c.name, short:c.short, color:c.color, bg:c.bg, active:c.active!==false, shareholders:c.shareholders||[], trade_license:c.tradeLicense||'', trade_license_expiry:c.tradeLicenseExpiry||null, trn:c.trn||'', corporate_tax_no:c.corporateTaxNo||'', incorporation_date:c.incorporationDate||null, contact_name:c.contactName||'', contact_phone:c.contactPhone||'', contact_email:c.contactEmail||'', contact_whatsapp:c.contactWhatsapp||'', classification:c.classification||'Mainland', vat_registered:!!c.vatRegistered, wps_required:!!c.wpsRequired, payroll_managed:!!c.payrollManaged, assigned_accountant_id:c.assignedAccountantId||null, client_since:c.clientSince||null, sort_order:c.sortOrder??0, vat_start_date:c.vatStartDate||null, ct_anniversary_date:c.ctAnniversaryDate||null, tags:c.tags||[] }; }
function _userFromDb(r)    { return { id:r.id, name:r.name, email:r.email, role:r.role||'viewer', initials:r.initials||'?', avClass:r.av_class||'av-viewer', password:r.password||'', telegramChatId:r.telegram_chat_id||'' }; }
function _userToDb(u)      { return { id:u.id, name:u.name, email:u.email, role:u.role, initials:u.initials, av_class:u.avClass, password:u.password, telegram_chat_id:u.telegramChatId||'' }; }
function _commentFromDb(r) { return { id:r.id, taskId:r.task_id, userId:r.user_id, text:r.text, createdAt:r.created_at }; }
function _commentToDb(c)   { return { id:c.id, task_id:c.taskId, user_id:c.userId, text:c.text, created_at:c.createdAt }; }
function _pipeFromDb(r)    { return { id:r.id, name:r.name, desc:r.description||'', active:r.active!==false }; }
function _stageFromDb(r)   { return { id:r.id, pipelineId:r.pipeline_id, order:r.order||0, name:r.name, color:r.color||'', targetDays:r.target_days||0 }; }
function _stageToDb(s)     { return { id:s.id, pipeline_id:s.pipelineId, order:s.order, name:s.name, color:s.color||'', target_days:s.targetDays||0 }; }
function _tplFromDb(r)     { return { id:r.id, title:r.title, clientId:r.client_id, recurrence:r.recurrence||'monthly', dayOfMonth:r.day_of_month||null, dayOfWeek:r.day_of_week||null, quarterStartMonth:r.quarter_start_month||1, titleMonthOffset:r.title_month_offset??0, assigneeId:r.assignee_id, active:r.active!==false, priority:r.priority||'medium', notes:r.notes||'', subtasks:Array.isArray(r.subtasks)?r.subtasks:[], pipelineId:r.pipeline_id||'', pipelineStageId:r.pipeline_stage_id||'', estimatedHours:r.estimated_hours||0, startOffsetDays:r.start_offset_days||0, defaultComments:Array.isArray(r.default_comments)?r.default_comments:[], templateDependencies:Array.isArray(r.template_dependencies)?r.template_dependencies:[] }; }
function _tplToDb(t)       { return { id:t.id, title:t.title, client_id:t.clientId, recurrence:t.recurrence, day_of_month:t.dayOfMonth||null, day_of_week:t.dayOfWeek||null, quarter_start_month:t.quarterStartMonth||1, title_month_offset:t.titleMonthOffset||0, assignee_id:t.assigneeId, active:t.active!==false, priority:t.priority||'medium', notes:t.notes||'', subtasks:t.subtasks||[], pipeline_id:t.pipelineId||null, pipeline_stage_id:t.pipelineStageId||null, estimated_hours:t.estimatedHours||0, start_offset_days:t.startOffsetDays||0, default_comments:t.defaultComments||[], template_dependencies:t.templateDependencies||[] }; }
function _docFromDb(r)     { return { id:r.id, clientId:r.client_id, type:r.type, number:r.number||'', expiryDate:r.expiry_date, notes:r.notes||'' }; }
function _tlFromDb(r)      { return { id:r.id, taskId:r.task_id, userId:r.user_id, hours:r.hours||0, description:r.description||'', date:r.date, billable:r.billable!==false }; }
function _msgFromDb(r)     { return { id:r.id, fromUserId:r.from_user_id, channel:r.channel, text:r.text, createdAt:r.created_at }; }
function _cnoteFromDb(r)   { return { id:r.id, clientId:r.client_id, userId:r.user_id, text:r.text, createdAt:r.created_at }; }
function _remFromDb(r)     { return { id:r.id, title:r.title, category:r.category||'Custom', amount:r.amount, clientId:r.client_id||'', eventDate:r.event_date, remind1:r.remind1, remind2:r.remind2, remind3:r.remind3, notifyEmail:r.notify_email!==false, notifyTelegram:r.notify_telegram!==false, notes:r.notes||'', active:r.active!==false, paidAt:r.paid_at||'', recurrence:r.recurrence||'none', recurrenceConfig:r.recurrence_config||null, paidDates:Array.isArray(r.paid_dates)?r.paid_dates:[], assignedUserId:r.assigned_user_id||'' }; }
function _remToDb(r)       { return { id:r.id, title:r.title, category:r.category, amount:r.amount||null, client_id:r.clientId||null, event_date:r.eventDate, remind1:r.remind1||null, remind2:r.remind2||null, remind3:r.remind3||null, notify_email:r.notifyEmail!==false, notify_telegram:r.notifyTelegram!==false, notes:r.notes||'', active:r.active!==false, paid_at:r.paidAt||null, recurrence:r.recurrence||'none', recurrence_config:r.recurrenceConfig||null, paid_dates:r.paidDates||[], assigned_user_id:r.assignedUserId||null }; }
function _svFromDb(r)      { return { id:r.id, name:r.name, userId:r.user_id, filters:r.filters||{} }; }

const Sheets = {
  _sb: null,

  init() {
    if (typeof window !== 'undefined' && window.supabase) {
      this._sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }
  },

  _q(table) { return this._sb.from(table); },

  /* Keep _post for Apps Script notifications (email/telegram) only */
  async _post(payload) {
    if (!CONFIG.SCRIPT_URL) return false;
    try {
      const res = await fetch(CONFIG.SCRIPT_URL, { method:'POST', headers:{'Content-Type':'text/plain'}, body:JSON.stringify(payload), redirect:'follow' });
      const json = await res.json().catch(()=>({ok:false}));
      return json.ok ? json.data : false;
    } catch(e) { return false; }
  },

  /* ── Tasks ─────────────────────────────────────── */
  async loadTasks() {
    const { data, error } = await this._q('tasks').select('*').order('created_at', {ascending:false});
    if (error) { console.error('[DB] loadTasks:', error.message); return []; }
    return (data||[]).map(_taskFromDb);
  },
  async addTask(task)    { const {error} = await this._q('tasks').insert(_taskToDb(task)); if(error) console.error('[DB] addTask:', error.message); _updateSyncTime(); },
  async updateTask(task) { const {error} = await this._q('tasks').upsert(_taskToDb(task)); if(error) console.error('[DB] updateTask:', error.message); _updateSyncTime(); },
  async deleteTask(id)   { const {error} = await this._q('tasks').delete().eq('id',id); if(error) console.error('[DB] deleteTask:', error.message); _updateSyncTime(); },

  /* ── Comments / Audit ──────────────────────────── */
  async loadComments() {
    const { data, error } = await this._q('audit_log').select('*').like('id','cm%');
    if (error) return [];
    return (data||[]).map(_commentFromDb);
  },
  async addComment(cm)       { await this._q('audit_log').insert(_commentToDb(cm)); },
  async updateComment(cm)    { await this._q('audit_log').upsert(_commentToDb(cm)); },
  async loadActivityLog()    { const {data} = await this._q('audit_log').select('*').like('id','ev%'); return (data||[]).map(_commentFromDb); },

  /* ── Clients ────────────────────────────────────── */
  async loadClients() {
    const { data, error } = await this._q('clients').select('*').order('sort_order');
    if (error) return [];
    return (data||[]).map(_clientFromDb);
  },
  async addClient(c)    { await this._q('clients').insert(_clientToDb(c)); },
  async updateClient(c) { await this._q('clients').upsert(_clientToDb(c)); _updateSyncTime(); },
  async deleteClient(id){ await this._q('clients').delete().eq('id',id); _updateSyncTime(); },

  /* ── Users ──────────────────────────────────────── */
  async loadUsers() {
    const { data, error } = await this._q('users').select('*');
    if (error) return [];
    return (data||[]).map(_userFromDb);
  },
  async addUser(u)    { await this._q('users').insert(_userToDb(u)); },
  async updateUser(u) { await this._q('users').upsert(_userToDb(u)); },
  async deleteUser(id){ await this._q('users').delete().eq('id',id); },

  /* ── Pipelines + Stages ─────────────────────────── */
  async loadPipelines() {
    const { data } = await this._q('pipelines').select('*').eq('active',true);
    return (data||[]).map(_pipeFromDb);
  },
  async loadStages() {
    const { data } = await this._q('pipeline_stages').select('*').order('order');
    return (data||[]).map(_stageFromDb);
  },
  async addStage(s)    { await this._q('pipeline_stages').insert(_stageToDb(s)); },
  async updateStage(s) { await this._q('pipeline_stages').upsert(_stageToDb(s)); },
  async deleteStage(id){ await this._q('pipeline_stages').delete().eq('id',id); },
  async deletePipeline(id) {
    await this._q('pipeline_stages').delete().eq('pipeline_id',id);
    await this._q('pipelines').delete().eq('id',id);
  },
  async addPipelineRow(p) { await this._q('pipelines').insert({id:p.id,name:p.name,description:p.desc||'',active:true}); },
  async updatePipelineRow(p) { await this._q('pipelines').upsert({id:p.id,name:p.name,description:p.desc||'',active:p.active}); },

  /* ── Templates ──────────────────────────────────── */
  async loadTemplates() {
    const { data } = await this._q('templates').select('*');
    return (data||[]).map(_tplFromDb);
  },
  async addTemplate(t)    { const {error} = await this._q('templates').insert(_tplToDb(t)); if(error) { console.error('[DB] addTemplate:', error.message); throw new Error(error.message); } },
  async updateTemplate(t) { const {error} = await this._q('templates').upsert(_tplToDb(t)); if(error) { console.error('[DB] updateTemplate:', error.message); throw new Error(error.message); } },
  async deleteTemplate(id){ await this._q('templates').delete().eq('id',id); },

  /* ── Documents ──────────────────────────────────── */
  async loadDocuments() {
    const { data } = await this._q('documents').select('*');
    return (data||[]).map(_docFromDb);
  },
  async addDocument(d)    { await this._q('documents').insert({id:d.id,client_id:d.clientId,type:d.type,number:d.number||'',expiry_date:d.expiryDate,notes:d.notes||''}); },
  async updateDocument(d) { await this._q('documents').upsert({id:d.id,client_id:d.clientId,type:d.type,number:d.number||'',expiry_date:d.expiryDate,notes:d.notes||''}); },
  async deleteDocument(id){ await this._q('documents').delete().eq('id',id); },

  /* ── Saved views ────────────────────────────────── */
  async loadSavedViews() {
    const { data } = await this._q('saved_views').select('*');
    return (data||[]).map(_svFromDb);
  },
  async addSavedView(v)    { await this._q('saved_views').insert({id:v.id,name:v.name,user_id:v.userId,filters:v.filters}); },
  async deleteSavedView(id){ await this._q('saved_views').delete().eq('id',id); },

  /* ── Time logs ──────────────────────────────────── */
  async loadTimeLogs() {
    const { data } = await this._q('time_log').select('*').order('date',{ascending:false});
    return (data||[]).map(_tlFromDb);
  },
  async addTimeLog(l)    { await this._q('time_log').insert({id:l.id,task_id:l.taskId,user_id:l.userId,hours:l.hours,description:l.description||'',date:l.date,billable:l.billable!==false}); },
  async deleteTimeLog(id){ await this._q('time_log').delete().eq('id',id); },

  /* ── Messages ───────────────────────────────────── */
  async loadMessages() {
    const { data } = await this._q('messages').select('*').order('id',{ascending:true}).limit(200);
    return (data||[]).map(_msgFromDb);
  },
  async sendMessage(m) { await this._q('messages').insert({id:m.id,from_user_id:m.fromUserId,channel:m.channel,text:m.text,created_at:m.createdAt}); },

  /* ── Client notes ───────────────────────────────── */
  async loadClientNotes() {
    const { data } = await this._q('client_notes').select('*').order('created_at',{ascending:false});
    return (data||[]).map(_cnoteFromDb);
  },
  async addClientNote(n)    { await this._q('client_notes').insert({id:n.id,client_id:n.clientId,user_id:n.userId,text:n.text,created_at:n.createdAt}); },
  async deleteClientNote(id){ await this._q('client_notes').delete().eq('id',id); },

  /* ── Reminders ──────────────────────────────────── */
  async loadReminders() {
    const { data } = await this._q('reminders').select('*').order('event_date');
    return (data||[]).map(_remFromDb);
  },
  async addReminder(r)    { const {error} = await this._q('reminders').insert(_remToDb(r)); if(error) console.error('[DB] addReminder:',error.message); },
  async updateReminder(r) { await this._q('reminders').upsert(_remToDb(r)); },
  async deleteReminder(id){ await this._q('reminders').delete().eq('id',id); },

  /* ── Real-time subscriptions ────────────────────── */
  subscribeRealtime() {
    if (!this._sb) return;
    this._sb.channel('db-live')
      .on('postgres_changes', {event:'*', schema:'public', table:'tasks'},
        () => { if (State.user) State.loadFromDb().then(() => refreshCurrentPage()); })
      .on('postgres_changes', {event:'INSERT', schema:'public', table:'messages'},
        payload => {
          const msg = _msgFromDb(payload.new);
          if (!State.messages.find(m => m.id === msg.id)) {
            State.messages.push(msg);
            if (typeof renderChatMessages === 'function') renderChatMessages(_chatChannel||'team');
            if (typeof updateChatBadge  === 'function') updateChatBadge();
          }
        })
      .subscribe();
  },
};

/* ══════════════════════════════════════════════════════════
   State — in-memory store + all CRUD with Sheet sync
   ══════════════════════════════════════════════════════════ */
const State = {
  user:        null,
  tasks:       [],          /* start empty — populated from Supabase on login */
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
  lastSyncAt:  null,

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

  /* ── Load all data from Supabase after login ────────── */
  async loadFromDb()     { return this.loadFromSheets(); }, /* alias */
  async loadFromSheets() {
    if (!this.useSheets) return;
    try {
      // data loaded
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
        // data loaded
      } else {
        // data loaded
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
        // data loaded
      }
      if (sheetClients && sheetClients.length > 0) {
        this.clients = sheetClients; /* sheet is the sole source of truth */
        // data loaded
      }
      if (sheetUsers && sheetUsers.length > 0) {
        this.users = sheetUsers;
        // data loaded
      }
      if (sheetPipelines && sheetPipelines.length > 0) {
        this.pipelines = sheetPipelines;
        if (!this.activePipelineId || !this.pipelines.find(p => p.id === this.activePipelineId)) {
          this.activePipelineId = this.pipelines[0]?.id || null;
        }
        // data loaded
      }
      if (sheetStages && sheetStages.length > 0) {
        this.stages = sheetStages;
        // data loaded
      }
      if (sheetTemplates && sheetTemplates.length > 0) {
        this.templates = sheetTemplates;
        // data loaded
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
      this.lastSyncAt = new Date();
      _updateSyncTime();
    } catch(e) {
      console.error('[State.loadFromSheets] Failed:', e);
      _showSyncError('Failed to load data from Supabase');
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
    const existing = this.getTask(id);
    const task = await this.updateTask(id, {
      status:         'done',
      previousStatus: existing?.status || 'pending',
      closedAt:       new Date().toISOString().slice(0,10),
      closeComment:   comment,
    });
    if (comment) await this.addComment(id, comment);
    await this.addActivity(id, `Task closed${comment ? ': ' + comment.slice(0,60) : ''}`);
    return task;
  },

  /* ── Reopen a done task back to active ──────────────── */
  async reopenTask(id) {
    const existing = this.getTask(id);
    /* Restore to the status saved before closing, fallback to 'pending' */
    const restoreStatus = existing?.previousStatus || 'pending';
    const task = await this.updateTask(id, {
      status:         restoreStatus,
      closedAt:       null,
      closeComment:   null,
      previousStatus: null,
    });
    await this.addActivity(id, 'Task reopened');
    return task;
  },

  /* ── Delete a task ───────────────────────────────────── */
  async deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.useSheets) await Sheets.deleteTask(id);
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
    const todayDate  = new Date(today);
    const daysToSun  = todayDate.getDay() === 0 ? 0 : 7 - todayDate.getDay(); /* 0 on Sunday */
    const sunday     = new Date(todayDate);
    sunday.setDate(todayDate.getDate() + daysToSun);
    const sundayStr  = sunday.toISOString().slice(0,10);
    return {
      totalCount:  visible.length,
      active:      visible.filter(t => t.status !== 'done').length,
      dueToday:    visible.filter(t => t.status !== 'done' && t.dueDate === today).length,
      dueThisWeek: visible.filter(t => t.status !== 'done' && t.dueDate >= today && t.dueDate <= sundayStr).length,
      overdue:     visible.filter(t => t.status !== 'done' && t.dueDate <  today).length,
      done:        visible.filter(t => t.status === 'done').length,
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
    await Sheets.addPipelineRow(pipeline);
    for (const s of this.stages.filter(s => s.pipelineId === id)) {
      await Sheets.addStage(s);
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
  if (this.useSheets) {
    try {
      await Sheets.addTemplate(template);
    } catch(e) {
      /* Remove from local state if DB save failed */
      this.templates = this.templates.filter(t => t.id !== template.id);
      throw e;
    }
  }
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

State.archiveClient = async function(id) {
  return await this.updateClient(id, { active: false });
};

State.unarchiveClient = async function(id) {
  return await this.updateClient(id, { active: true });
};

State.saveClientOrder = async function() {
  /* Write sortOrder for every client — fires in parallel */
  this.clients.forEach((c, i) => { c.sortOrder = i; });
  if (this.useSheets) {
    await Promise.all(this.clients.map(c => Sheets.updateClient(c)));
  }
};

State.updateClient = async function(id, patch) {
  const idx = this.clients.findIndex(c => c.id === id);
  if (idx < 0) return null;
  Object.assign(this.clients[idx], patch);
  if (this.useSheets) await Sheets.updateClient(this.clients[idx]);
  return this.clients[idx];
};

State.deleteClient = async function(id) {
  /* Unassign tasks that belong to this client */
  this.tasks.forEach(t => { if (t.clientId === id) t.clientId = ''; });
  this.clients = this.clients.filter(c => c.id !== id);
  if (this.useSheets) await Sheets.deleteClient(id);
};

State.updatePipeline = async function(id, patch) {
  const p = this.pipelines.find(p => p.id === id);
  if (!p) return;
  Object.assign(p, patch);
  if (this.useSheets) await Sheets.updatePipelineRow(p);
};

State.addStage = async function(pipelineId, name, color, targetDays) {
  const existing = this.stages.filter(s => s.pipelineId === pipelineId);
  const order    = existing.length > 0 ? Math.max(...existing.map(s => s.order)) + 1 : 1;
  const stage    = { id:'s'+Date.now(), pipelineId, order, name, color: color||'', targetDays: targetDays||0 };
  this.stages.push(stage);
  if (this.useSheets) await Sheets.addStage(stage);
  return stage;
};

State.deleteStage = async function(stageId) {
  this.tasks.forEach(t => { if (t.pipelineStageId === stageId) t.pipelineStageId = null; });
  this.stages = this.stages.filter(s => s.id !== stageId);
  if (this.useSheets) await Sheets.deleteStage(stageId);
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
/* State.activityLog already declared in State object above */

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
    Sheets.addComment(ev);
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
  const rem = {
    id: 'rem'+Date.now(), ...data, active:true, paidAt:'',
    assignedUserId: data.assignedUserId || this.user?.id || '',
  };
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

State.markOccurrencePaid = async function(id, date) {
  const rem = this.reminders.find(r => r.id === id);
  if (!rem) return;
  const paidDates = [...(rem.paidDates || [])];
  if (!paidDates.includes(date)) paidDates.push(date);
  rem.paidDates = paidDates;
  /* Mark overall active=false only when all occurrences are paid */
  const allDates = _getOccurrenceDates(rem);
  if (allDates.length > 0 && allDates.every(d => paidDates.includes(d))) {
    rem.active = false;
  }
  if (this.useSheets) Sheets.updateReminder(rem);
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

/* ─── Client tags ────────────────────────────────────────── */
State.allClientTags = function() {
  const tags = new Set();
  this.clients.forEach(c => (c.tags||[]).forEach(t => tags.add(t)));
  return [...tags].sort();
};

/* ─── VAT / CT filing reminders ─────────────────────────── */
State.nextVatDueDates = function(clientId) {
  /* UAE VAT quarters: Q1 ends Mar, Q2 ends Jun, Q3 ends Sep, Q4 ends Dec — due 28 days after */
  const today = new Date();
  const dates = [];
  const year  = today.getFullYear();
  const quarterEnds = [
    new Date(year, 2, 31), new Date(year, 5, 30),
    new Date(year, 8, 30), new Date(year, 11, 31),
    new Date(year+1, 2, 31), new Date(year+1, 5, 30),
  ];
  quarterEnds.forEach(qe => {
    const due = new Date(qe.getTime() + 28*86400000);
    if (due >= today) dates.push(due.toISOString().slice(0,10));
  });
  return dates.slice(0, 4); /* next 4 quarters */
};

State.createVatFilingReminders = async function(clientId) {
  const c     = this.getClient(clientId);
  if (!c?.vatRegistered) return 0;
  const dates = this.nextVatDueDates(clientId);
  for (const date of dates) {
    await this.addReminder({
      title:          `VAT Return Filing — ${c.short}`,
      category:       'VAT Payment',
      amount:         null,
      clientId,
      eventDate:      date,
      remind1:        14, remind2:7, remind3:1,
      notifyEmail:    true, notifyTelegram:true,
      notes:          'Quarterly VAT return — UAE FTA deadline',
      recurrence:     'none',
      recurrenceConfig: null,
      paidDates:      [],
      assignedUserId: this.user?.id || '',
    });
  }
  return dates.length;
};

State.createCtFilingReminder = async function(clientId) {
  const c = this.getClient(clientId);
  if (!c?.ctAnniversaryDate) return 0;
  /* CT filing: typically 9 months after year-end */
  const yearEnd = new Date(c.ctAnniversaryDate);
  const dueDate = new Date(yearEnd.getFullYear()+1, yearEnd.getMonth()+9, yearEnd.getDate());
  const today   = new Date();
  /* If past, move to next year */
  const filing  = dueDate < today
    ? new Date(dueDate.setFullYear(dueDate.getFullYear()+1))
    : dueDate;
  await this.addReminder({
    title:          `Corporate Tax Filing — ${c.short}`,
    category:       'Tax Payment',
    amount:         null,
    clientId,
    eventDate:      filing.toISOString().slice(0,10),
    remind1:        30, remind2:14, remind3:7,
    notifyEmail:    true, notifyTelegram:true,
    notes:          `Annual CT return. CT No: ${c.corporateTaxNo||'—'}`,
    recurrence:     'none',
    recurrenceConfig: null,
    paidDates:      [],
    assignedUserId: this.user?.id || '',
  });
  return 1;
};

State.expiringDocuments = function(days) {
  /* Use saved setting if no override passed */
  if (days === undefined) {
    try {
      const s = JSON.parse(localStorage.getItem('ofiz_app_settings') || '{}');
      days = s.expiryWarningDays || 30;
    } catch(e) { days = 30; }
  }
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
