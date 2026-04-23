/**
 * @file supabase.ts
 * @description Cliente de Supabase configurado para el sistema de inventario.
 * Exporta el cliente singleton y los tipos de base de datos.
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Variables de entorno (definidas en .env.local)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

// ---------------------------------------------------------------------------
// Cliente singleton de Supabase
// ---------------------------------------------------------------------------
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------------------------------------------------------------------------
// Tipos derivados de la estructura de tablas
// ---------------------------------------------------------------------------

/** Roles disponibles en el sistema */
export type RolEnum = "admin" | "usuario" | "tecnico";

/** Estados posibles de un artículo en inventario */
export type EstadoInventarioEnum =
  | "activo"
  | "inactivo"
  | "en_reparacion"
  | "dado_de_baja"
  | "mantenimiento";

/** Estados posibles de un préstamo */
export type EstadoPrestamoEnum =
  | "activo"
  | "devuelto"
  | "atrasado"
  | "cancelado";

/** Estados posibles del detalle de un préstamo */
export type EstadoDetallePrestamoEnum =
  | "pendiente"
  | "devuelto"
  | "devuelto_parcial"
  | "dañado";

/** Tipos de movimiento en el historial */
export type TipoMovimientoEnum =
  | "entrada"
  | "salida"
  | "prestamo"
  | "devolucion"
  | "ajuste"
  | "baja";

// ---------------------------------------------------------------------------
// Interfaces de cada tabla
// ---------------------------------------------------------------------------

export interface Departamento {
  id: number;
  nombre: string;
  descripcion?: string;
  responsable?: string;
  created_at?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Usuario {
  id: string;
  username?: string;
  nombre_completo: string;
  rol: RolEnum;
  departamento_id?: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  departamentos?: Departamento;
}

export interface InventarioItem {
  id: number;
  clave: string;
  nombre: string;
  descripcion?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  stock_total: number;
  stock_disponible: number;
  stock_minimo: number;
  unidad_medida?: string;
  ubicacion?: string;
  estado: EstadoInventarioEnum;
  imagen_url?: string;
  categoria_id: number;
  departamento_id?: number;
  fecha_creacion?: string;
  updated_at?: string;
  categorias?: Categoria;
  departamentos?: Departamento;
}

export interface Prestamo {
  id: number;
  usuario_id: string;
  departamento_id?: number;
  autorizado_por?: string;
  registrado_por?: string;
  fecha_salida: string;
  fecha_devolucion?: string;
  estado: EstadoPrestamoEnum;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  usuarios?: Usuario;
  departamentos?: Departamento;
  detalle_prestamo?: DetallePrestamo[];
}

export interface DetallePrestamo {
  id: number;
  prestamo_id: number;
  inventario_id: number;
  cantidad: number;
  cantidad_devuelta: number;
  estado: EstadoDetallePrestamoEnum;
  observaciones?: string;
  inventario?: InventarioItem;
}

export interface HistorialMovimiento {
  id: number;
  inventario_id: number;
  usuario_id: string;
  tipo_movimiento: TipoMovimientoEnum;
  departamento_origen?: number;
  departamento_destino?: number;
  cantidad: number;
  stock_antes?: number;
  stock_despues?: number;
  fecha: string;
  observaciones?: string;
  prestamo_id?: number;
  inventario?: InventarioItem;
  usuarios?: Usuario;
}
