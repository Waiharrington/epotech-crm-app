export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nombre: string
          apellido: string
          telefono: string
          ciudad: string | null
          direccion: string | null
          tipo_propiedad: 'residencial' | 'comercial' | null
          metros_cuadrados: number | null
          sqft: number | null
          tipo_superficie: string | null
          estilo_piso: string | null
          num_pisos: number | null
          obs_propiedad: string | null
          fuente_adq: string | null
          costo_lead: number | null
          notas_estrategicas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          apellido: string
          telefono: string
          ciudad?: string | null
          direccion?: string | null
          tipo_propiedad?: 'residencial' | 'comercial' | null
          metros_cuadrados?: number | null
          sqft?: number | null
          tipo_superficie?: string | null
          estilo_piso?: string | null
          num_pisos?: number | null
          obs_propiedad?: string | null
          fuente_adq?: string | null
          costo_lead?: number | null
          notas_estrategicas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          apellido?: string
          telefono?: string
          ciudad?: string | null
          direccion?: string | null
          tipo_propiedad?: 'residencial' | 'comercial' | null
          metros_cuadrados?: number | null
          sqft?: number | null
          tipo_superficie?: string | null
          estilo_piso?: string | null
          num_pisos?: number | null
          obs_propiedad?: string | null
          fuente_adq?: string | null
          costo_lead?: number | null
          notas_estrategicas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      catalogo_servicios: {
        Row: {
          id: string
          nombre: string
          categoria: 'lavado' | 'limpieza' | 'epoxico' | 'pintura' | 'otro' | null
          icono: string | null
          precio_venta: number
          costo_materiales_est: number | null
          gastos_adicionales: number | null
          descripcion_interna: string | null
          activo: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          categoria?: 'lavado' | 'limpieza' | 'epoxico' | 'pintura' | 'otro' | null
          icono?: string | null
          precio_venta?: number
          costo_materiales_est?: number | null
          gastos_adicionales?: number | null
          descripcion_interna?: string | null
          activo?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          categoria?: 'lavado' | 'limpieza' | 'epoxico' | 'pintura' | 'otro' | null
          icono?: string | null
          precio_venta?: number
          costo_materiales_est?: number | null
          gastos_adicionales?: number | null
          descripcion_interna?: string | null
          activo?: boolean | null
          created_at?: string
        }
      }
      stock: {
        Row: {
          id: string
          nombre: string
          tipo: 'consumible' | 'herramienta' | 'maquinaria'
          unidad_medida: string | null
          cantidad_actual: number | null
          cantidad_minima: number | null
          precio_costo: number | null
          descripcion: string | null
          foto_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          tipo: 'consumible' | 'herramienta' | 'maquinaria'
          unidad_medida?: string | null
          cantidad_actual?: number | null
          cantidad_minima?: number | null
          precio_costo?: number | null
          descripcion?: string | null
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          tipo?: 'consumible' | 'herramienta' | 'maquinaria'
          unidad_medida?: string | null
          cantidad_actual?: number | null
          cantidad_minima?: number | null
          precio_costo?: number | null
          descripcion?: string | null
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trabajos: {
        Row: {
          id: string
          cliente_id: string
          servicio_id: string | null
          estado: 'proximo' | 'en_progreso' | 'completado' | null
          prioridad: 'urgente' | 'estandar' | 'baja' | null
          fecha_servicio: string
          hora_servicio: string | null
          es_recurrente: boolean | null
          frecuencia_dias: number | null
          plan_recurrente_id: string | null
          notas_pre: string | null
          precio_acordado: number | null
          precio_cobrado: number | null
          costo_lead: number | null
          notas_post: string | null
          maquina_usada: string | null
          presion_agua: string | null
          quimicos_aplicados: string | null
          fecha_proximo_serv: string | null
          completado_at: string | null
          materiales_utilizados: Json | null
          archivado: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          servicio_id?: string | null
          estado?: 'proximo' | 'en_progreso' | 'completado' | null
          prioridad?: 'urgente' | 'estandar' | 'baja' | null
          fecha_servicio: string
          hora_servicio?: string | null
          es_recurrente?: boolean | null
          frecuencia_dias?: number | null
          plan_recurrente_id?: string | null
          notas_pre?: string | null
          precio_acordado?: number | null
          precio_cobrado?: number | null
          costo_lead?: number | null
          notas_post?: string | null
          maquina_usada?: string | null
          presion_agua?: string | null
          quimicos_aplicados?: string | null
          fecha_proximo_serv?: string | null
          completado_at?: string | null
          materiales_utilizados?: Json | null
          archivado?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          servicio_id?: string | null
          estado?: 'proximo' | 'en_progreso' | 'completado' | null
          prioridad?: 'urgente' | 'estandar' | 'baja' | null
          fecha_servicio?: string
          hora_servicio?: string | null
          es_recurrente?: boolean | null
          frecuencia_dias?: number | null
          plan_recurrente_id?: string | null
          notas_pre?: string | null
          precio_acordado?: number | null
          precio_cobrado?: number | null
          costo_lead?: number | null
          notas_post?: string | null
          maquina_usada?: string | null
          presion_agua?: string | null
          quimicos_aplicados?: string | null
          fecha_proximo_serv?: string | null
          completado_at?: string | null
          materiales_utilizados?: Json | null
          archivado?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      caja: {
        Row: {
          id: string
          tipo: 'ingreso' | 'egreso'
          monto: number
          fecha: string
          categoria: string
          trabajo_id: string | null
          stock_id: string | null
          notas: string | null
          es_automatico: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo: 'ingreso' | 'egreso'
          monto: number
          fecha?: string
          categoria: string
          trabajo_id?: string | null
          stock_id?: string | null
          notas?: string | null
          es_automatico?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: 'ingreso' | 'egreso'
          monto?: number
          fecha?: string
          categoria?: string
          trabajo_id?: string | null
          stock_id?: string | null
          notas?: string | null
          es_automatico?: boolean | null
          created_at?: string
        }
      }
      stock_movimientos: {
        Row: {
          id: string
          stock_id: string
          trabajo_id: string | null
          tipo: 'entrada' | 'salida'
          cantidad: number
          cantidad_resultante: number
          motivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          stock_id: string
          trabajo_id?: string | null
          tipo: 'entrada' | 'salida'
          cantidad: number
          cantidad_resultante: number
          motivo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          stock_id?: string
          trabajo_id?: string | null
          tipo?: 'entrada' | 'salida'
          cantidad?: number
          cantidad_resultante?: number
          motivo?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
