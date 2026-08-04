import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar web-push
webpush.setVapidDetails(
  'mailto:soporte@epotech.com', // Cambiar por correo real
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  // Asegurarnos de que la llamada proviene de un Cron autorizado (ej. Vercel Cron)
  // En producción, deberías verificar un header de autorización
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const currentDateStr = `${yyyy}-${mm}-${dd}`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}:00`;

    // 1. Buscar recordatorios vencidos y no notificados
    const { data: dueReminders, error: fetchError } = await supabase
      .from('recordatorios')
      .select('*')
      .eq('completado', false)
      .eq('notificado', false);

    if (fetchError) {
      throw fetchError;
    }

    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({ message: 'No hay recordatorios pendientes' });
    }

    // Filtrar los que ya pasaron de la hora exacta
    const remindersToNotify = dueReminders.filter((r: any) => {
      const isPastDate = r.fecha < currentDateStr;
      const isToday = r.fecha === currentDateStr;
      const isPastTime = isToday && r.hora <= currentTimeStr;
      return isPastDate || isPastTime;
    });

    if (remindersToNotify.length === 0) {
      return NextResponse.json({ message: 'Aún no es hora de notificar' });
    }

    // 2. Obtener TODAS las suscripciones (en una app real, filtrar por user_id)
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No hay dispositivos suscritos' });
    }

    // 3. Enviar Push Notifications
    let pushCount = 0;
    const notificationPromises = [];

    for (const reminder of remindersToNotify) {
      const payload = JSON.stringify({
        title: `🔔 Epotech: ${reminder.titulo}`,
        body: reminder.descripcion || 'Tienes una tarea programada para ahora.',
        icon: '/icon-192x192.png',
        url: '/recordatorios',
        tag: reminder.id
      });

      for (const sub of subscriptions) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        const pushPromise = webpush.sendNotification(pushSubscription, payload)
          .then(() => { pushCount++; })
          .catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              // La suscripción expiró o ya no es válida, eliminarla de la DB
              return supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            } else {
              console.error('Error enviando push:', err);
            }
          });
        
        notificationPromises.push(pushPromise);
      }

      // Marcar el recordatorio como notificado
      await supabase
        .from('recordatorios')
        .update({ notificado: true })
        .eq('id', reminder.id);
    }

    await Promise.all(notificationPromises);

    return NextResponse.json({ 
      success: true, 
      notifiedCount: remindersToNotify.length,
      pushesSent: pushCount
    });

  } catch (err) {
    console.error('Cron Error:', err);
    return NextResponse.json({ error: 'Error interno del Cron' }, { status: 500 });
  }
}
