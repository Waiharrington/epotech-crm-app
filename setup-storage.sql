-- Script para habilitar la Galería de Fotos (Supabase Storage)
-- 1. Crear la tabla de referencias de fotos
CREATE TABLE IF NOT EXISTS public.fotos_trabajos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    url_foto TEXT NOT NULL,
    etiqueta TEXT DEFAULT 'general', -- 'antes', 'despues', 'durante', 'general'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS en la tabla
ALTER TABLE public.fotos_trabajos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow ALL on fotos_trabajos" ON public.fotos_trabajos FOR ALL USING (true);

-- NOTA: El Bucket de Storage se debe crear manualmente en el Dashboard de Supabase:
-- Ve a 'Storage' -> 'New Bucket' -> Nombre: 'galeria' -> Hazlo PUBLICO.
-- Esto permitirá que el CRM guarde y lea las fotos sin restricciones de sesión.
