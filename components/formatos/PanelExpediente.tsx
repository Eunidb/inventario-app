/**
 * @file components/formatos/PanelExpediente.tsx
 * @description Panel lateral deslizable para ver y gestionar un expediente de trabajo.
 *
 * Se abre al dar clic en el botón 👁 de un expediente en la tabla.
 * Carga todos los registros_formato del trabajo y los muestra en acordeón,
 * uno por cada tipo de formulario que aplica a ese trabajo.
 *
 * RESPONSIVE:
 *   - Mobile: ocupa toda la pantalla (w-full).
 *   - Desktop (lg+): panel lateral derecho de 672px de ancho (max-w-2xl).
 *   - Contenedores de inputs y listas optimizados con espaciados táctiles.
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { X, Save, Loader2 } from "lucide-react";
import FormularioAcordeon from "./FormularioAcordeon";
import { ESTADO_CONFIG, type EstadoTrabajo } from "./types";

interface PanelExpedienteProps {
  trabajo: {
    id: number;
    folio: string;
    titulo: string;
    area_solicitante: string;
    tipo_trabajo: string;
    prioridad: string;
    estado: EstadoTrabajo;
  };
  onClose: () => void;
  onUpdated: () => void;
}

export default function PanelExpediente({ trabajo, onClose, onUpdated }: PanelExpedienteProps) {
  // ── Estados locales ───────────────────────────────────────────────────────
  const [formatos, setFormatos] = useState<any[]>([]);
  const [loadingFormatos, setLoadingFormatos] = useState(true);
  const [estado, setEstado] = useState<EstadoTrabajo>(trabajo.estado);
  const [saving, setSaving] = useState(false);
  const [acordeonAbierto, setAcordeonAbierto] = useState<number | null>(null);

  // ── Cargar formularios desde Supabase ─────────────────────────────────────
  useEffect(() => {
    const cargarFormatos = async () => {
      setLoadingFormatos(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("registros_formato")
        .select("*")
        .eq("trabajo_id", trabajo.id)
        .order("id");

      if (!error) setFormatos(data ?? []);
      setLoadingFormatos(false);
    };
    cargarFormatos();
  }, [trabajo.id]);

  // ── Actualizar estado global del expediente ──────────────────────────────
  const handleCambiarEstado = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("trabajos")
      .update({
        estado,
        fecha_cierre: estado === "completado" ? new Date().toISOString() : null,
      })
      .eq("id", trabajo.id);

    if (!error) onUpdated();
    setSaving(false);
  };

  // ── Recargar al salvar un acordeón interno ────────────────────────────────
  const recargarFormatos = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("registros_formato")
      .select("*")
      .eq("trabajo_id", trabajo.id)
      .order("id");
    setFormatos(data ?? []);
    onUpdated();
  };

  // ── Cálculos de métricas de progreso ──────────────────────────────────────
  const total = formatos.length;
  const completos = formatos.filter((f) => f.completado).length;
  const pctProgreso = total > 0 ? Math.round((completos / total) * 100) : 0;

  const colorBarra =
    pctProgreso === 100 ? "bg-emerald-500" :
    pctProgreso >= 50   ? "bg-blue-500"    :
    "bg-amber-500";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fondo traslúcido difuminado (Overlay) */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Contenedor principal del Panel Deslizable */}
      <div className="relative bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl z-10 animate-slide-in">
        
        {/* ── Cabecera Superior Fija ── */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
          
          {/* Fila superior: Meta info y botón de salida */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="font-mono text-[10px] sm:text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-md inline-block">
                {trabajo.folio}
              </span>
              <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-800 mt-1.5 leading-snug break-words">
                {trabajo.titulo}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                {trabajo.area_solicitante} · {trabajo.tipo_trabajo} · <span className="font-semibold text-slate-500">Prioridad: {trabajo.prioridad}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 -mr-1 rounded-xl hover:bg-slate-200/70 text-slate-400 active:scale-95 transition-all flex-shrink-0"
              aria-label="Cerrar panel"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sección de Progreso */}
          <div className="mt-4 bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 shadow-sm">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              <span>Progreso de gestión</span>
              <span className="text-slate-600">{completos} / {total} Completos</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${colorBarra}`}
                style={{ width: `${pctProgreso}%` }}
              />
            </div>
          </div>

          {/* Barra de herramientas / Selector de estado global */}
          <div className="flex items-center gap-2 mt-3.5">
            <div className="relative flex-1">
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoTrabajo)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium outline-none appearance-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer transition-all"
              >
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <button
              onClick={handleCambiarEstado}
              disabled={saving || estado === trabajo.estado}
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 transition-all active:scale-95 flex-shrink-0 shadow-sm"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="hidden xs:inline">Guardar Estado</span>
            </button>
          </div>

        </div>

        {/* ── Zona Central de Acordeones (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {loadingFormatos ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white border border-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : formatos.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs sm:text-sm font-medium">
              No hay formatos dinámicos asignados a este tipo de expediente.
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {formatos.map((formato) => (
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
              ))}
            </div>
          )}
        </div>

        {/* ── Pie de Panel Fijo ── */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">
              ID SISTEMA: #{trabajo.id}
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {pctProgreso === 100
                ? "✓ Todo completado"
                : `Pendientes: ${total - completos} módulo(s)`}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}