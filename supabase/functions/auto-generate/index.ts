/**
 * OFIZ Tasks — Auto-Generation Edge Function
 * Runs on Supabase cron at 7:00 AM (Dubai time = UTC+4 = 03:00 UTC)
 *
 * Cron schedule (set in Supabase Dashboard → Edge Functions → Schedules):
 *   Daily   : "0 3 * * *"       — every day at 03:00 UTC (7:00 AM Dubai)
 *   Weekly  : "0 3 * * 1"       — every Monday at 03:00 UTC
 *   Monthly : "0 3 1 * *"       — 1st of each month at 03:00 UTC
 *
 * Or use a single schedule "0 3 * * *" and let the function decide which
 * template types to generate based on the current day/date.
 *
 * Deploy:
 *   supabase functions deploy auto-generate
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SERVICE_ROLE_KEY')! // service role for writes

Deno.serve(async (_req) => {
  const sb    = createClient(SUPABASE_URL, SUPABASE_KEY)
  const now   = new Date()

  // Dubai is UTC+4
  const dubaiOffset = 4 * 60
  const dubai = new Date(now.getTime() + dubaiOffset * 60000)

  const today     = dubai.toISOString().slice(0, 10)           // YYYY-MM-DD
  const month     = today.slice(0, 7)                          // YYYY-MM
  const dayOfWeek = dubai.getDay()                             // 0=Sun, 1=Mon
  const dayOfMonth= dubai.getDate()

  // Figure out this week's Monday
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monDate = new Date(dubai.getTime() + diff * 86400000)
  const thisMonday = monDate.toISOString().slice(0, 10)

  // Load active templates
  const { data: templates, error: tErr } = await sb
    .from('templates')
    .select('*')
    .eq('active', true)

  if (tErr || !templates?.length) {
    return new Response(JSON.stringify({ ok: true, generated: 0, note: 'No active templates' }))
  }

  // Load existing tasks for duplicate check
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const dueDate0 = `${month}-01`
  const dueDate1 = `${month}-${String(lastDay).padStart(2, '0')}`

  const { data: existingTasks } = await sb
    .from('tasks')
    .select('title, client_id, due_date')
    .gte('due_date', dueDate0)
    .lte('due_date', dueDate1)

  const monthLabel = dubai.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  let totalCreated = 0
  const toInsert: Record<string, unknown>[] = []

  for (const tp of templates) {
    const monthNum = dubai.getMonth() + 1 /* 1-12 */
    const qStart   = tp.quarter_start_month || 1
    const isQuarterMonth = (monthNum - qStart) % 3 === 0

    const shouldGen =
      (tp.recurrence === 'daily') ||
      (tp.recurrence === 'weekly'     && dayOfWeek  === 1) ||
      (tp.recurrence === 'monthly'    && dayOfMonth === 1) ||
      (tp.recurrence === 'quarterly'  && dayOfMonth === 1 && isQuarterMonth)

    if (!shouldGen) continue

    // Calculate due date
    let dueDate: string
    if (tp.recurrence === 'daily') {
      dueDate = today
    } else if (tp.recurrence === 'weekly') {
      dueDate = thisMonday
    } else {
      // monthly or quarterly — same due date logic
      const day = Math.min(tp.day_of_month || lastDay, lastDay)
      dueDate = `${month}-${String(day).padStart(2, '0')}`
    }

    const titleKey = `${tp.title} — ${monthLabel}`

    // Duplicate check
    const exists = existingTasks?.some(t =>
      t.client_id === tp.client_id &&
      (t.title === titleKey || (t.due_date >= dueDate0 && t.due_date <= dueDate1 && t.title?.startsWith(tp.title)))
    )
    if (exists) continue

    // Calculate start date
    let startDate: string | null = null
    if (tp.start_offset_days > 0) {
      const d = new Date(dueDate)
      d.setDate(d.getDate() - tp.start_offset_days)
      startDate = d.toISOString().slice(0, 10)
    }

    toInsert.push({
      id:                 'ag' + Date.now().toString(36) + Math.random().toString(36).slice(2),
      title:              titleKey,
      client_id:          tp.client_id,
      assignee_id:        tp.assignee_id,
      type:               tp.recurrence,
      status:             'pending',
      priority:           tp.priority || 'medium',
      due_date:           dueDate,
      start_date:         startDate,
      notes:              tp.notes || '',
      created_at:         today,
      subtasks:           tp.subtasks || [],
      blocked_by:         [],
      pipeline_id:        tp.pipeline_id || null,
      pipeline_stage_id:  tp.pipeline_stage_id || null,
    })
    totalCreated++
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await sb.from('tasks').insert(toInsert)
    if (insertErr) {
      console.error('Insert error:', insertErr.message)
      return new Response(JSON.stringify({ ok: false, error: insertErr.message }), { status: 500 })
    }
  }

  console.log(`[auto-generate] ${today} — created ${totalCreated} tasks`)
  return new Response(
    JSON.stringify({ ok: true, date: today, generated: totalCreated }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
