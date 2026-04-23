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
  const today = new Date().toISOString().split('T')[0]

  // 1. Fetch jobs for today
  const { data: jobs, error } = await supabase
    .from('trabajos')
    .select(`
      *,
      clientes (nombre, apellido),
      catalogo_servicios (nombre)
    `)
    .eq('fecha_servicio', today)
    .neq('estado', 'completado')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ message: 'No jobs for today' })
  }

  // 2. Prepare summary message
  const jobsSummary = jobs.map(j => `- ${j.catalogo_servicios?.nombre} para ${j.clientes.nombre}`).join('\n')
  const payload = JSON.stringify({
    title: 'Agenda del Día - Epotech',
    body: `Hoy tienes ${jobs.length} servicios programados:\n${jobsSummary}`,
    icon: '/icons/icon-192x192.png',
    data: {
        url: '/agenda'
    }
  })

  // 3. Send to all subscribed users (Simplification: fetch from a 'subscriptions' table)
  // For now, returning the message as it would be sent
  
  return NextResponse.json({ 
    message: 'Summary prepared', 
    jobsCount: jobs.length,
    content: payload
  })
}
