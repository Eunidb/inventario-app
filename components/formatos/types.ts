/**
 * @file components/formatos/types.ts
 */
import { LucideIcon, ClipboardList, FileCheck, Package, ShoppingCart, FlaskConical } from "lucide-react";

export type EstadoTrabajo = "pendiente" | "en_progreso" | "completado";

export interface RegistroFormato {
  id: number;
  trabajo_id: number;
  tipo: "solicitud" | "reporte" | "maquinaria" | "compra" | "laboratorio";
  datos_json: Record<string, any>;
  imagen_url: string | null;
  completado: boolean;
  completado_por: string | null;
  fecha_llenado: string | null;
}

export const ESTADO_CONFIG: Record<EstadoTrabajo, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "text-amber-600 bg-amber-50 border-amber-100" },
  en_progreso: { label: "En Progreso", color: "text-blue-600 bg-blue-50 border-blue-100" },
  completado: { label: "Completado", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
};

export const FORMATO_CONFIG: Record<string, { label: string; bg: string; border: string; color: string; Icon: LucideIcon }> = {
  solicitud: { label: "Solicitud de Trabajo", bg: "bg-blue-50", border: "border-blue-100", color: "text-blue-600", Icon: ClipboardList },
  reporte: { label: "Reporte de Servicio", bg: "bg-indigo-50", border: "border-indigo-100", color: "text-indigo-600", Icon: FileCheck },
  maquinaria: { label: "Registro de Maquinaria", bg: "bg-sky-50", border: "border-sky-100", color: "text-sky-600", Icon: Package },
  compra: { label: "Solicitud de Compra", bg: "bg-cyan-50", border: "border-cyan-100", color: "text-cyan-600", Icon: ShoppingCart },
  laboratorio: { label: "Registro Lab. Medicamentos", bg: "bg-teal-50", border: "border-teal-100", color: "text-teal-600", Icon: FlaskConical },
};

export const CAMPOS_FORMULARIO: Record<string, Array<{ key: string; label: string; tipo: "text" | "textarea" | "select" | "date" | "checkboxes"; requerido: boolean; opciones?: string[] }>> = {
  solicitud: [
    { key: "solicitante", label: "Nombre del Solicitante", tipo: "text", requerido: true },
    { key: "descripcion_falla", label: "Descripción Detallada de la Falla", tipo: "textarea", requerido: true },
    { key: "equipo_afectado", label: "Tag / Identificador del Equipo", tipo: "text", requerido: true }
  ],
  reporte: [
    { key: "tecnico", label: "Técnico Asignado", tipo: "text", requerido: true },
    { key: "acciones_tomadas", label: "Acciones Correctivas Realizadas", tipo: "textarea", requerido: true },
    { key: "tipo_paro", label: "Impacto en Producción", tipo: "select", requerido: true, opciones: ["Sin Paro", "Paro Parcial", "Paro Total"] },
    { key: "fecha_reparacion", label: "Fecha de Finalización", tipo: "date", requerido: true }
  ],
  maquinaria: [
    { key: "horas_maquina", label: "Horómetro Actual (Hrs)", tipo: "text", requerido: true },
    { key: "condicion", label: "Condición del Equipo", tipo: "select", requerido: true, opciones: ["Operativo", "Degradado", "Fuera de Servicio"] },
    { key: "puntos_inspeccion", label: "Puntos de Inspección Críticos", tipo: "checkboxes", requerido: true, opciones: ["Lubricación", "Alineación", "Aislamiento Eléctrico", "Fugas"] }
  ],
  compra: [
    { key: "refaccion", label: "Refacción o Material Requerido", tipo: "text", requerido: true },
    { key: "cantidad", label: "Cantidad Solicitada", tipo: "text", requerido: true },
    { key: "proveedor_sugerido", label: "Proveedor Sugerido", tipo: "text", requerido: false }
  ],
  laboratorio: [
    { key: "no_lote", label: "Número de Lote Afectado", tipo: "text", requerido: true },
    { key: "desinfeccion", label: "Protocolo de Sanitización Aplicado", tipo: "select", requerido: true, opciones: ["Alineado a NOM-059", "Limpieza Estándar", "N/A"] }
  ]
};