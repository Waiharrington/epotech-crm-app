import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'

// Configure VAPID keys (Should be in env)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

webpush.setVapidDetails(
  'mailto:sebastian@epotech.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Calculate the date exactly 3 months ago
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const targetDateStr = threeMonthsAgo.toISOString().split('T')[0]

  // Find jobs completed exactly 3 months ago where the client hasn't had another job since
  // Note: For a robust system, we would do a more complex query or DB View
  const { data: jobs, error } = await supabase
    .from('trabajos')
    .select(`
      id,
      cliente_id,
      fecha_servicio,
      clientes (nombre, apellido)
    `)
    .eq('estado', 'completado')
    .eq('fecha_servicio', targetDateStr)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ message: 'No inactive clients found for this date.' })
  }

  // Filter out clients who have had a more recent job
  const inactiveClients = []
  
  for (const job of jobs as any[]) {
      const { data: recentJobs } = await supabase
        .from('trabajos')
        .select('id')
        .eq('cliente_id', job.cliente_id)
        .gt('fecha_servicio', targetDateStr)
        .limit(1)

      if (!recentJobs || recentJobs.length === 0) {
          inactiveClients.push(job.clientes)
      }
  }

  if (inactiveClients.length === 0) {
      return NextResponse.json({ message: 'All found clients have been active since.' })
  }

  // Prepare notification payload
  const clientsSummary = inactiveClients.map(c => `- ${c?.nombre} ${c?.apellido}`).join('\n')
  
  const payload = JSON.stringify({
    title: 'Recordatorio Estratégico',
    body: `Hay ${inactiveClients.length} clientes inactivos hace 3 meses. ¿Ofrecemos un nuevo servicio?\n\n${clientsSummary}`,
    icon: '/icons/icon-192x192.png',
    data: {
        url: '/clientes'
    }
  })

  // 3. Send to all subscribed push users (Implementation depends on the subscription table)
  
  return NextResponse.json({ 
    message: 'Reminders prepared', 
    count: inactiveClients.length,
    content: payload
  })
}
