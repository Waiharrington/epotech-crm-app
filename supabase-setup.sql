-- SQL Schema for Epotech CRM
-- Run this entire script in your Supabase SQL Editor

-- 1. Create Clientes table
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT NOT NULL,
    ciudad TEXT,
    direccion TEXT,
    tipo_propiedad TEXT CHECK (tipo_propiedad IN ('residencial', 'comercial', NULL)),
    metros_cuadrados NUMERIC,
    sqft NUMERIC,
    tipo_superficie TEXT,
    estilo_piso TEXT,
    num_pisos NUMERIC,
    obs_propiedad TEXT,
    fuente_adq TEXT,
    costo_lead NUMERIC,
    notas_estrategicas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Catalogo de Servicios table
CREATE TABLE IF NOT EXISTS public.catalogo_servicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT CHECK (categoria IN ('lavado', 'limpieza', 'epoxico', 'pintura', 'otro', NULL)),
    icono TEXT,
    precio_venta NUMERIC NOT NULL,
    costo_materiales_est NUMERIC,
    gastos_adicionales NUMERIC,
    descripcion_interna TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Trabajos (Agenda/Kanban) table
CREATE TABLE IF NOT EXISTS public.trabajos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    servicio_id UUID REFERENCES public.catalogo_servicios(id) ON DELETE SET NULL,
    estado TEXT CHECK (estado IN ('proximo', 'en_progreso', 'completado', 'agendado', NULL)),
    prioridad TEXT CHECK (prioridad IN ('urgente', 'estandar', 'baja', NULL)),
    fecha_servicio DATE NOT NULL,
    hora_servicio TIME,
    es_recurrente BOOLEAN DEFAULT false,
    frecuencia_dias NUMERIC,
    plan_recurrente_id UUID,
    notas_pre TEXT,
    precio_acordado NUMERIC,
    precio_cobrado NUMERIC,
    costo_lead NUMERIC,
    notas_post TEXT,
    maquina_usada TEXT,
    presion_agua TEXT,
    quimicos_aplicados TEXT,
    fecha_proximo_serv DATE,
    completado_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Stock table
CREATE TABLE IF NOT EXISTS public.stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('consumible', 'herramienta', 'maquinaria')),
    unidad_medida TEXT,
    cantidad_actual NUMERIC DEFAULT 0,
    cantidad_minima NUMERIC DEFAULT 0,
    precio_costo NUMERIC DEFAULT 0,
    descripcion TEXT,
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Caja (Finances) table
CREATE TABLE IF NOT EXISTS public.caja (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto NUMERIC NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    categoria TEXT NOT NULL,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    stock_id UUID REFERENCES public.stock(id) ON DELETE SET NULL,
    notas TEXT,
    es_automatico BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Presupuestos (Quotes) table
CREATE TABLE IF NOT EXISTS public.presupuestos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    validez_dias NUMERIC DEFAULT 30,
    estado TEXT CHECK (estado IN ('borrador', 'pendiente', 'aprobado', 'rechazado', NULL)),
    monto_subtotal NUMERIC NOT NULL,
    monto_descuento NUMERIC DEFAULT 0,
    monto_total NUMERIC NOT NULL,
    items_detalle JSONB,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Add sample Data for Catalogo de Servicios (Optional but recommended to start)
INSERT INTO public.catalogo_servicios (nombre, categoria, precio_venta, activo)
VALUES 
('Lavado a Presión - Driveway', 'lavado', 150.00, true),
('Pintura Exterior Comercial', 'pintura', 850.00, true),
('Epoxico Garaje Estandar', 'epoxico', 1200.00, true);

-- Enable RLS (Row Level Security) and configure permissive policies (for MVP phase)
-- You can tighten these rules later from the Supabase Dashboard
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow ALL on clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Allow ALL on catalogo_servicios" ON public.catalogo_servicios FOR ALL USING (true);
CREATE POLICY "Allow ALL on trabajos" ON public.trabajos FOR ALL USING (true);
CREATE POLICY "Allow ALL on stock" ON public.stock FOR ALL USING (true);
CREATE POLICY "Allow ALL on caja" ON public.caja FOR ALL USING (true);
CREATE POLICY "Allow ALL on presupuestos" ON public.presupuestos FOR ALL USING (true);
