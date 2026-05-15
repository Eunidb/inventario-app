/**
 * @file components/formatos/PanelExpediente.tsx
 * @description Panel lateral deslizable para ver y gestionar un expediente de trabajo.
 *
 * Se abre al dar clic en el botón 👁 de un expediente en la tabla.
 * Carga todos los registros_formato del trabajo y los muestra en acordeón,
 * uno por cada tipo de formulario que aplica a ese trabajo.
 *
 * FUNCIONALIDAD:
 *   - Muestra el folio, título, área, prioridad y tipo del expediente.
 *   - Barra de progreso que indica cuántos formularios están completados.
 *   - Selector para cambiar el estado del expediente (abierto → completado, etc.).
 *   - Renderiza un <FormularioAcordeon> por cada registro_formato del trabajo.
 *
 * RESPONSIVE:
 *   - Mobile: ocupa toda la pantalla (w-full).
 *   - Desktop (lg+): panel lateral derecho de 672px de ancho (max-w-2xl).
 *   - El overlay oscuro cierra el panel al hacer clic fuera.
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { X, Save, Loader2 } from "lucide-react";
import FormularioAcordeon from "./FormularioAcordeon";
import { ESTADO_CONFIG, type EstadoTrabajo, type TipoFormato } from "./types";

// ─── Props del componente ────────────────────────────────────────────────────
interface PanelExpedienteProps {
  /** Objeto del expediente de trabajo (fila de la tabla "trabajos") */
  trabajo: {
    id: number;
    folio: string;
    titulo: string;
    area_solicitante: string;
    tipo_trabajo: string;
    prioridad: string;
    estado: EstadoTrabajo;
  };
  /** Función para cerrar el panel */
  onClose: () => void;
  /**
   * Función llamada después de guardar cambios.
   * La página padre recarga la lista de expedientes.
   */
  onUpdated: () => void;
}

export default function PanelExpediente({ trabajo, onClose, onUpdated }: PanelExpedienteProps) {

  // ── Estado del panel ──────────────────────────────────────────────────────
  const [formatos, setFormatos]           = useState<any[]>([]);
  const [loadingFormatos, setLoadingFormatos] = useState(true);

  // Estado editable del expediente (para el selector de estado)
  const [estado, setEstado]   = useState<EstadoTrabajo>(trabajo.estado);
  const [saving, setSaving]   = useState(false);

  // ID del formulario cuyo acordeón está abierto (solo uno a la vez)
  const [acordeonAbierto, setAcordeonAbierto] = useState<number | null>(null);

  // ── Cargar los formularios del expediente desde Supabase ─────────────────
  useEffect(() => {
    const cargarFormatos = async () => {
      setLoadingFormatos(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("registros_formato")
        .select("*")
        .eq("trabajo_id", trabajo.id)
        .order("id"); // Ordenar por ID mantiene el orden de creación

      if (!error) setFormatos(data ?? []);
      setLoadingFormatos(false);
    };
    cargarFormatos();
  }, [trabajo.id]);

  // ── Guardar cambio de estado del expediente ───────────────────────────────
  const handleCambiarEstado = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("trabajos")
      .update({
        estado,
        // Si se marca como completado, registrar la fecha de cierre
        fecha_cierre: estado === "completado" ? new Date().toISOString() : null,
      })
      .eq("id", trabajo.id);

    if (!error) onUpdated();
    setSaving(false);
  };

  // ── Recargar formularios tras guardar uno ─────────────────────────────────
  const recargarFormatos = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("registros_formato")
      .select("*")
      .eq("trabajo_id", trabajo.id)
      .order("id");
    setFormatos(data ?? []);
    onUpdated(); // Actualiza la barra de progreso en la tabla principal
  };

  // ── Cálculos de progreso ──────────────────────────────────────────────────
  const total     = formatos.length;
  const completos = formatos.filter(f => f.completado).length;
  const pctProgreso = total > 0 ? Math.round((completos / total) * 100) : 0;

  // Color de la barra de progreso según el porcentaje
  const colorBarra =
    pctProgreso === 100 ? "bg-emerald-500" :
    pctProgreso >= 50   ? "bg-blue-500"    :
    "bg-amber-500";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay — clic fuera cierra el panel */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/*
       * Panel lateral.
       * Mobile:   ocupa toda la pantalla (w-full).
       * Desktop:  se desliza desde la derecha con max-w-2xl (672px).
       */}
      <div className="ml-auto relative bg-white w-full max-w-2xl h-full
                      flex flex-col shadow-2xl overflow-hidden">

        {/* ── Cabecera del expediente ── */}
        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">

          {/* Fila: folio + título + botón cerrar */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Folio con estilo monoespaciado */}
              <span className="font-mono text-xs font-black text-blue-600 bg-blue-50
                               px-2.5 py-1 rounded-lg inline-block">
                {trabajo.folio}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-800 mt-2 leading-tight">
                {trabajo.titulo}
              </h2>
              {/* Meta del expediente en una línea */}
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                {trabajo.area_solicitante}
                {" · "}
                {trabajo.tipo_trabajo}
                {" · Prioridad: "}
                {trabajo.prioridad}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Barra de progreso de formularios ── */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
              <span>Formularios completados</span>
              <span>{completos} de {total}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colorBarra}`}
                style={{ width: `${pctProgreso}%` }}
              />
            </div>
          </div>

          {/* ── Selector de estado del expediente ── */}
          <div className="flex items-center gap-2 mt-4">
            <select
              value={estado}
              onChange={e => setEstado(e.target.value as EstadoTrabajo)}
              className="flex-1 bg-white border border-slate-200 rounded-xl
                         px-3 py-2 text-sm text-slate-700 outline-none
                         focus:ring-2 focus:ring-blue-100"
            >
              {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            <button
              onClick={handleCambiarEstado}
              disabled={saving || estado === trabajo.estado}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white
                         px-4 py-2 rounded-xl text-sm font-bold
                         disabled:opacity-50 transition-all flex-shrink-0"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="hidden sm:inline">Guardar</span>
            </button>
          </div>
        </div>

        {/* ── Lista de formularios en acordeón ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loadingFormatos ? (
            // Esqueleto de carga mientras se obtienen los formularios
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : formatos.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm font-medium">
              No se encontraron formularios para este expediente
            </div>
          ) : (
            formatos.map(formato => (
              <FormularioAcordeon
                key={formato.id}
                formato={formato}
                abierto={acordeonAbierto === formato.id}
                onToggle={() =>
                  setAcordeonAbierto(
                    acordeonAbierto === formato.id ? null : formato.id
                  )
                }
                onSaved={recargarFormatos}
              />
            ))
          )}
        </div>

        {/* ── Pie del panel ── */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-mono">
              Expediente #{trabajo.id}
            </p>
            {/* Resumen rápido de progreso */}
            <p className="text-xs font-bold text-slate-500">
              {pctProgreso === 100
                ? "✓ Todos los formularios completados"
                : `${total - completos} formulario${total - completos !== 1 ? "s" : ""} pendiente${total - completos !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}