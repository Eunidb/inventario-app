/**
 * @file components/formatos/types.ts
 * @description Tipos, constantes y configuración de campos para el módulo de Formatos.
 *
 * Este archivo centraliza toda la configuración de los 5 tipos de formulario físico
 * que maneja el Departamento de Mantenimiento de Laboratorios Pier S.A. de C.V.
 * Al estar aquí, cualquier cambio en campos o estilos se propaga a todos los componentes.
 *
 * EXPORTA:
 *   - Tipos: EstadoTrabajo, TipoFormato, CampoFormulario
 *   - Constantes: ESTADO_CONFIG, FORMATO_CONFIG, CAMPOS_FORMULARIO
 */

import {
  Clock, AlertCircle, CheckCircle2, XCircle,
  ClipboardList, Wrench, Package, FlaskConical, ShoppingCart,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS BASE
// ─────────────────────────────────────────────────────────────────────────────

/** Estados posibles de un expediente de trabajo */
export type EstadoTrabajo =
  | "abierto"
  | "en_proceso"
  | "en_espera"
  | "completado"
  | "cancelado";

/** Identificadores de los 5 tipos de formulario físico */
export type TipoFormato =
  | "solicitud_trabajo"
  | "reporte_servicio"
  | "registro_maquinaria"
  | "solicitud_compra"
  | "registro_lab_produccion";

/** Definición de un campo individual dentro de un formulario */
export interface CampoFormulario {
  key: string;
  label: string;
  /** "text" | "textarea" | "date" | "select" | "checkboxes" */
  tipo: "text" | "textarea" | "date" | "select" | "checkboxes";
  requerido?: boolean;
  /** Solo para tipo "select" y "checkboxes" */
  opciones?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE ESTADOS
// Define el label, los estilos CSS y el ícono de cada estado del expediente.
// ─────────────────────────────────────────────────────────────────────────────
export const ESTADO_CONFIG: Record<EstadoTrabajo, {
  label: string;
  cls: string;
  Icon: any;
}> = {
  abierto:    { label: "Abierto",    cls: "bg-blue-50 text-blue-700 border-blue-100",         Icon: Clock },
  en_proceso: { label: "En Proceso", cls: "bg-amber-50 text-amber-700 border-amber-100",      Icon: AlertCircle },
  en_espera:  { label: "En Espera",  cls: "bg-purple-50 text-purple-700 border-purple-100",   Icon: Clock },
  completado: { label: "Completado", cls: "bg-emerald-50 text-emerald-700 border-emerald-100",Icon: CheckCircle2 },
  cancelado:  { label: "Cancelado",  cls: "bg-slate-100 text-slate-500 border-slate-200",     Icon: XCircle },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN VISUAL DE FORMULARIOS
// Define el label, colores, borde e ícono de cada tipo de formato físico.
// ─────────────────────────────────────────────────────────────────────────────
export const FORMATO_CONFIG: Record<TipoFormato, {
  label: string;
  color: string;
  bg: string;
  border: string;
  Icon: any;
}> = {
  solicitud_trabajo:       { label: "Solicitud de Trabajo",                 color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    Icon: ClipboardList },
  reporte_servicio:        { label: "Reporte de Servicio",                  color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200",   Icon: Wrench },
  registro_maquinaria:     { label: "Registro de Maquinaria de Producción", color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200",  Icon: Package },
  solicitud_compra:        { label: "Solicitud de Compra",                  color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   Icon: ShoppingCart },
  registro_lab_produccion: { label: "Registro Lab. Medicamentos / Prod.",   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", Icon: FlaskConical },
};

// ─────────────────────────────────────────────────────────────────────────────
// CAMPOS DE CADA FORMULARIO FÍSICO
//
// Los campos replican exactamente lo que aparece en los formatos físicos de papel
// de Laboratorios Pier. Cada entrada corresponde a una sección del formato real:
//
//   solicitud_trabajo      → Folio 2813 (imagen 3)
//   reporte_servicio       → Folio 0214 (imagen 1)
//   registro_maquinaria    → Registro de Maquinaria de Producción (imagen 2)
//   solicitud_compra       → 4° formato (cuando se requieren refacciones)
//   registro_lab_produccion→ 5° formato (equipos de laboratorio farmacéutico)
// ─────────────────────────────────────────────────────────────────────────────
export const CAMPOS_FORMULARIO: Record<TipoFormato, CampoFormulario[]> = {

  // ── Solicitud de Trabajo (Folio 2813) ────────────────────────────────────
  solicitud_trabajo: [
    { key: "area_destino",          label: "Solicitud de Trabajo para el Área de", tipo: "text",     requerido: true },
    { key: "descripcion_trabajo",   label: "Descripción del Trabajo Solicitado",   tipo: "textarea", requerido: true },
    { key: "material_para_trabajo", label: "Material para el Trabajo",             tipo: "textarea" },
    { key: "area_que_solicita",     label: "Área que Solicita",                    tipo: "text",     requerido: true },
    { key: "fecha",                 label: "Fecha",                                tipo: "date",     requerido: true },
    { key: "vobo",                  label: "Vo.Bo.",                               tipo: "text" },
    { key: "autorizo",              label: "Autorizó",                             tipo: "text" },
  ],

  // ── Reporte de Servicio / Orden Interna (Folio 0214) ─────────────────────
  reporte_servicio: [
    { key: "departamento",            label: "Departamento",                               tipo: "text",     requerido: true },
    { key: "nombre_reporta",          label: "Nombre de Quien Reporta",                   tipo: "text",     requerido: true },
    { key: "equipo",                  label: "Equipo",                                    tipo: "text",     requerido: true },
    { key: "prioridad",               label: "Prioridad",                                 tipo: "select",   opciones: ["Alta", "Media", "Baja"] },
    { key: "tipo_mantenimiento",      label: "Tipo de Mantenimiento",                     tipo: "select",   requerido: true, opciones: ["Preventivo", "Correctivo"] },
    { key: "datos_equipo",            label: "Datos del Equipo (marca, modelo, estado)",  tipo: "textarea", requerido: true },
    { key: "descripcion_falla",       label: "Descripción de la Falla",                   tipo: "textarea", requerido: true },
    { key: "acciones_realizadas",     label: "Acciones Realizadas",                       tipo: "textarea" },
    { key: "refacciones_requeridas",  label: "Refacciones Requeridas",                    tipo: "textarea" },
    { key: "personal_mantenimiento",  label: "Personal que Realizó el Mantenimiento",     tipo: "text" },
    { key: "observaciones",           label: "Observaciones y Datos Adicionales",         tipo: "textarea" },
    { key: "fecha_inicio",            label: "Fecha de Inicio",                           tipo: "date" },
    { key: "fecha_final",             label: "Fecha Final",                               tipo: "date" },
    { key: "fecha_solicitud",         label: "Fecha de Solicitud (Recibida por Mant.)",   tipo: "date" },
    { key: "nombre_recibe_solicitud", label: "Nombre de Quien Recibe Solicitud",          tipo: "text" },
    { key: "firma_inicio_servicio",   label: "Mantenimiento al Inicio de Servicio (firma)", tipo: "text" },
    { key: "firma_termino_servicio",  label: "Solicitante al Término de Servicio (firma)", tipo: "text" },
    { key: "vobo",                    label: "VoBo",                                      tipo: "text" },
  ],

  // ── Registro de Maquinaria de Producción ─────────────────────────────────
  // Los checkboxes del formato físico (Correctivo, Preventivo, etc.) se manejan
  // con el tipo "checkboxes" que permite marcar múltiples opciones.
  registro_maquinaria: [
    { key: "fecha",               label: "Fecha",                 tipo: "date",       requerido: true },
    { key: "maquina",             label: "Máquina",               tipo: "text",       requerido: true },
    { key: "marca",               label: "Marca",                 tipo: "text" },
    { key: "modelo",              label: "Modelo",                tipo: "text" },
    { key: "serie",               label: "Serie",                 tipo: "text" },
    { key: "area_produccion",     label: "Área de Producción",    tipo: "text",       requerido: true },
    { key: "tipos_mantenimiento", label: "Tipo de Mantenimiento",
      tipo: "checkboxes", opciones: ["Correctivo", "Preventivo", "Mecánico", "Eléctrico", "Electrónico"] },
    { key: "descripcion_trabajo", label: "Descripción del Trabajo Realizado", tipo: "textarea", requerido: true },
    { key: "observaciones",       label: "Observaciones",         tipo: "textarea" },
    { key: "efectuo",             label: "Efectuó",               tipo: "text" },
    { key: "recibio",             label: "Recibió",               tipo: "text" },
  ],

  // ── Solicitud de Compra (cuando se requieren refacciones o materiales) ───
  solicitud_compra: [
    { key: "departamento_solicitante", label: "Departamento Solicitante",                    tipo: "text",     requerido: true },
    { key: "solicitado_por",           label: "Solicitado Por",                              tipo: "text",     requerido: true },
    { key: "fecha",                    label: "Fecha",                                       tipo: "date",     requerido: true },
    { key: "trabajo_relacionado",      label: "Trabajo / Equipo Relacionado",                tipo: "text" },
    { key: "articulos",                label: "Artículos / Refacciones (cantidad, descripción, especificaciones)", tipo: "textarea", requerido: true },
    { key: "proveedor_sugerido",       label: "Proveedor Sugerido",                          tipo: "text" },
    { key: "precio_estimado",          label: "Precio Estimado Total ($)",                   tipo: "text" },
    { key: "justificacion",            label: "Justificación",                               tipo: "textarea", requerido: true },
    { key: "autorizo",                 label: "Autorizó",                                    tipo: "text" },
  ],

  // ── Registro Lab. Medicamentos / Productos Terminados ────────────────────
  // Para trabajos en equipos del laboratorio farmacéutico.
  registro_lab_produccion: [
    { key: "fecha",                   label: "Fecha",                              tipo: "date",       requerido: true },
    { key: "maquina",                 label: "Máquina / Equipo",                   tipo: "text",       requerido: true },
    { key: "marca",                   label: "Marca",                              tipo: "text" },
    { key: "modelo",                  label: "Modelo",                             tipo: "text" },
    { key: "serie",                   label: "Serie",                              tipo: "text" },
    { key: "area_produccion",         label: "Área de Producción",                 tipo: "text",       requerido: true },
    { key: "tipo_mantenimiento",      label: "Tipo de Mantenimiento",
      tipo: "checkboxes", opciones: ["Correctivo", "Preventivo", "Mecánico", "Eléctrico", "Electrónico"] },
    { key: "descripcion_trabajo",     label: "Descripción del Trabajo Realizado",  tipo: "textarea",   requerido: true },
    { key: "verificacion_post",       label: "Verificación Post-Mantenimiento",    tipo: "textarea" },
    { key: "observaciones",           label: "Observaciones",                      tipo: "textarea" },
    { key: "responsable_produccion",  label: "Responsable de Producción",          tipo: "text" },
    { key: "responsable_mant",        label: "Responsable de Mantenimiento",       tipo: "text" },
    { key: "aprobo",                  label: "Aprobó",                             tipo: "text" },
  ],
};