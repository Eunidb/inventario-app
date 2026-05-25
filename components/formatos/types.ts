/**
 * @file components/formatos/types.ts
 * @description Tipos, interfaces y configuraciones visuales compartidos
 *   por todos los componentes del módulo de Formatos de Trabajo.
 *
 * ¿Por qué centralizar aquí?
 *   - Evita duplicar tipos entre page.tsx, PanelExpediente y cada Form*.
 *   - El page.tsx importa TrabajoExpediente para tipado estricto de useState.
 *   - ESTADO_CONFIG y FORMATO_CONFIG son la única fuente de verdad para
 *     etiquetas, íconos y clases CSS de badges en toda la UI del módulo.
 */

import {
  ClipboardList,  // Solicitud de Trabajo
  Wrench,         // Reporte de Servicio
  Cog,            // Registro de Maquinaria
  ShoppingCart,   // Solicitud de Compra
  FlaskConical,   // Registro de Lab.
  Clock,          // Estado: Abierto
  PlayCircle,     // Estado: En Proceso
  PauseCircle,    // Estado: En Espera
  CheckCircle2,   // Estado: Completado
  XCircle,        // Estado: Cancelado
} from "lucide-react";

// ─── Enums de estado y tipo ──────────────────────────────────────────────────

/** Estados posibles de un expediente de trabajo (espejo del ENUM en Supabase) */
export type EstadoTrabajo =
  | "abierto"
  | "en_proceso"
  | "en_espera"
  | "completado"
  | "cancelado";

/** Tipos de formulario físico (espejo del ENUM tipo_formato_enum en Supabase) */
export type TipoFormato =
  | "solicitud_trabajo"
  | "reporte_servicio"
  | "registro_maquinaria"
  | "solicitud_compra"
  | "registro_lab_produccion";

// ─── Interfaces de las tablas ────────────────────────────────────────────────

/** Fila de registros_formato tal como la devuelve el SELECT del page */
export interface RegistroFormato {
  id: number;
  tipo: TipoFormato;
  completado: boolean;
  imagen_url: string | null;
  datos_json?: Record<string, any>;
  fecha_llenado?: string | null;
  completado_por?: string | null;
  trabajo_id?: number;
  updated_at?: string;
}

/**
 * Expediente de trabajo con las relaciones que trae el SELECT del page.
 * Se usa como tipo de useState<TrabajoExpediente[]> y para los props
 * de ModalNuevoTrabajo y PanelExpediente.
 */
export interface TrabajoExpediente {
  id: number;
  folio: string | null;
  titulo: string;
  estado: EstadoTrabajo;
  area_solicitante: string | null;
  prioridad: string | null;
  tipo_trabajo: string | null;
  maquina: string | null;           // Nombre/referencia de la máquina (campo opcional)
  observaciones: string | null;
  requiere_compra: boolean;
  requiere_registro_maquinaria: boolean;
  requiere_registro_lab: boolean;
  departamento_id: number | null;
  creado_por: string | null;
  atendido_por: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  updated_at: string;
  // Relaciones JOIN incluidas en el SELECT
  creador: { nombre_completo: string } | null;
  departamento: { nombre: string } | null;
  registros_formato: RegistroFormato[];
}

// ─── Configuración visual por estado del expediente ─────────────────────────
//   Usado en: badges de la tabla, selector de estado en PanelExpediente,
//             opción del <select> de filtro en page.tsx.
export const ESTADO_CONFIG: Record<
  EstadoTrabajo,
  { label: string; cls: string; Icon: React.FC<any> }
> = {
  abierto: {
    label: "Abierto",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    Icon: Clock,
  },
  en_proceso: {
    label: "En Proceso",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: PlayCircle,
  },
  en_espera: {
    label: "En Espera",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
    Icon: PauseCircle,
  },
  completado: {
    label: "Completado",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: CheckCircle2,
  },
  cancelado: {
    label: "Cancelado",
    cls: "bg-red-50 text-red-700 border-red-200",
    Icon: XCircle,
  },
};

// ─── Configuración visual por tipo de formulario ─────────────────────────────
//   Usado en: íconos apilados de progreso en la tabla, lista del PanelExpediente.
export const FORMATO_CONFIG: Record<
  TipoFormato,
  { label: string; Icon: React.FC<any>; color: string }
> = {
  solicitud_trabajo: {
    label: "Solicitud de Trabajo",
    Icon: ClipboardList,
    color: "text-blue-600",
  },
  reporte_servicio: {
    label: "Reporte de Servicio",
    Icon: Wrench,
    color: "text-purple-600",
  },
  registro_maquinaria: {
    label: "Registro de Maquinaria",
    Icon: Cog,
    color: "text-orange-600",
  },
  solicitud_compra: {
    label: "Solicitud de Compra",
    Icon: ShoppingCart,
    color: "text-teal-600",
  },
  registro_lab_produccion: {
    label: "Registro de Lab. Producción",
    Icon: FlaskConical,
    color: "text-rose-600",
  },
};