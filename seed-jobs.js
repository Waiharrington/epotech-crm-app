import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function seed() {
  console.log('Fetching clients and services...')
  const { data: clients } = await supabase.from('clientes').select('id')
  const { data: services } = await supabase.from('catalogo_servicios').select('id, precio_venta')

  if (!clients?.length || !services?.length) {
    console.error('Please create at least 1 client and 1 service first via the UI.')
    return
  }

  console.log('Generating jobs...')
  const jobsToInsert = []
  const today = new Date()

  // Generate jobs for today and the next few days
  for (let i = 0; i < 5; i++) {
    const currentDay = new Date(today)
    currentDay.setDate(today.getDate() + i)
    const dateStr = currentDay.toISOString().split('T')[0]

    // Create 3-6 jobs per day
    const numJobs = Math.floor(Math.random() * 4) + 3

    for (let j = 0; j < numJobs; j++) {
      const client = clients[Math.floor(Math.random() * clients.length)]
      const service = services[Math.floor(Math.random() * services.length)]
      
      // Random hour between 08:00 and 17:00
      const hour = Math.floor(Math.random() * 10) + 8
      const minute = Math.random() > 0.5 ? '00' : '30'
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`

      const states = ['proximo', 'en_progreso', 'completado']
      const state = i === 0 ? states[Math.floor(Math.random() * states.length)] : 'proximo'

      jobsToInsert.push({
        cliente_id: client.id,
        servicio_id: service.id,
        fecha_servicio: dateStr,
        hora_servicio: timeStr,
        estado: state,
        prioridad: Math.random() > 0.8 ? 'alta' : 'estandar',
        precio_acordado: service.precio_venta || 0,
        es_recurrente: false
      })
    }
  }

  console.log(`Inserting ${jobsToInsert.length} jobs...`)
  const { error } = await supabase.from('trabajos').insert(jobsToInsert)

  if (error) {
    console.error('Error inserting jobs:', error)
  } else {
    console.log('Success! Refreshed the calendar.')
  }
}

seed()
