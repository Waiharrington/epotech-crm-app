import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: Request) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Step 1: Transcribe with Groq Whisper
    const transcriptionFormData = new FormData()
    transcriptionFormData.append('file', audioFile)
    transcriptionFormData.append('model', 'whisper-large-v3')
    transcriptionFormData.append('language', 'es')
    transcriptionFormData.append('response_format', 'json')

    const transcriptionResponse = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: transcriptionFormData,
      }
    )

    if (!transcriptionResponse.ok) {
      const errText = await transcriptionResponse.text()
      console.error('Groq transcription error:', errText)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
    }

    const transcriptionData = await transcriptionResponse.json()
    const transcribedText = transcriptionData.text

    if (!transcribedText || transcribedText.trim().length === 0) {
      return NextResponse.json({ error: 'No speech detected in audio' }, { status: 400 })
    }

    // Step 2: Extract reminder details with Groq LLM
    const today = new Date().toISOString().substring(0, 10)
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const dayOfWeek = now.toLocaleDateString('es-ES', { weekday: 'long' })

    const extractionPrompt = `Eres un asistente extrae datos de recordatorios del audio transcrito. Fecha de hoy: ${today} (${dayOfWeek}). Hora actual: ${currentHour}:${String(currentMinute).padStart(2, '0')}.

Texto transcrito: "${transcribedText}"

Extrae los siguientes campos y responde SOLO con un JSON válido (sin markdown, sin backticks):

{
  "titulo": "título breve del recordatorio (máx 60 chars)",
  "descripcion": "descripción detallada si la hay, o string vacío",
  "fecha": "YYYY-MM-DD (usa 'hoy' o 'mañana' si se mencionan, calcula la fecha real)",
  "hora": "HH:MM en formato 24h (estima una hora razonable si no se especifica, ej: 09:00, 14:00)",
  "prioridad": "baja|normal|alta|urgente (estima según la urgencia del lenguaje)"
}

Reglas:
- Si dice "mañana" → suma 1 día a hoy
- Si dice "el lunes", "el martes", etc. → calcula la próxima ocurrencia de ese día
- Si no especifica hora → usa 09:00 para recordatorios generales, 14:00 paraAfternoon
- Si dice "ahora", "ya", "urgente" → prioridad "urgente"
- Si dice "importante", "no olvidar" → prioridad "alta"
- Si no hay indicación de prioridad → "normal"
- El título debe ser claro y descriptivo, no una copia literal del audio`

    const llmResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Eres un asistente que extrae datos de recordatorios. Responde siempre con JSON válido, sin markdown ni backticks.' },
            { role: 'user', content: extractionPrompt }
          ],
          temperature: 0.2,
          max_completion_tokens: 512,
        }),
      }
    )

    if (!llmResponse.ok) {
      const errText = await llmResponse.text()
      console.error('Groq LLM error:', errText)
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    const llmData = await llmResponse.json()
    const content = llmData.choices?.[0]?.message?.content || ''

    // Parse the JSON response (handle potential markdown wrapping)
    let extracted
    try {
      const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      extracted = JSON.parse(cleaned)
    } catch {
      // Fallback: try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({
          transcripcion: transcribedText,
          error: 'Could not parse AI response',
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      transcripcion: transcribedText,
      recordatorio: {
        titulo: extracted.titulo || transcribedText.substring(0, 60),
        descripcion: extracted.descripcion || '',
        fecha: extracted.fecha || today,
        hora: extracted.hora || '09:00',
        prioridad: extracted.prioridad || 'normal',
      }
    })

  } catch (error) {
    console.error('Voice reminder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
