/**
 * @file components/formatos/PanelExpediente.tsx
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { X, Save, Loader2, AlertCircle } from "lucide-react";
import FormularioAcordeon from "./FormularioAcordeon";
import { ESTADO_CONFIG, type EstadoTrabajo, type RegistroFormato } from "./types";

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
  const [formatos, setFormatos] = useState<RegistroFormato[]>([]);
  const [loadingFormatos, setLoadingFormatos] = useState(true);
  const [estado, setEstado] = useState<EstadoTrabajo>(trabajo.estado);
  const [saving, setSaving] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [acordeonAbierto, setAcordeonAbierto] = useState<number | null>(null);

  useEffect(() => {
    const cargarFormatos = async () => {
      setLoadingFormatos(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("registros_formato")
        .select("*")
        .eq("trabajo_id", trabajo.id)
        .order("id");

      if (!error) setFormatos((data as RegistroFormato[]) ?? []);
      setLoadingFormatos(false);
    };
    cargarFormatos();
  }, [trabajo.id]);

  const handleCambiarEstado = async () => {
    setErrorValidacion(null);

    // Filtro de seguridad del negocio: Evita cierres prematuros
    if (estado === "completado") {
      const tienePendientes = formatos.some((f) => !f.completado);
      if (tienePendientes) {
        setErrorValidacion("No puedes completar el expediente. Existen formatos internos pendientes.");
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("trabajos")
      .update({
        estado,
        fecha_cierre: estado === "completado" ? new Date().toISOString() : null,
      })
      .eq("id", trabajo.id);

    if (!error) {
      onUpdated();
    }
    setSaving(false);
  };

  const recargarFormatos = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("registros_formato")
      .select("*")
      .eq("trabajo_id", trabajo.id)
      .order("id");
    setFormatos((data as RegistroFormato[]) ?? []);
    onUpdated();
  };

  const total = formatos.length;
  const completos = formatos.filter((f) => f.completado).length;
  const pctProgreso = total > 0 ? Math.round((completos / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl h-[100dvh] flex flex-col shadow-2xl z-10">
        
        {/* Cabecera */}
        <div className="px-4 py-4 sm:px-6 border-b border-slate-100 bg-linear-to-b from-slate-50 to-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md inline-block">
                {trabajo.folio}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-800 mt-1 leading-snug break-words">
                {trabajo.titulo}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                {trabajo.area_solicitante} · <span className="text-slate-500">{trabajo.tipo_trabajo}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 -mr-1 rounded-xl hover:bg-slate-100 text-slate-400 active:scale-95 transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Progreso */}
          <div className="mt-4 bg-white border border-slate-200/60 rounded-xl p-3 shadow-2xs">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              <span>Progreso de formatos</span>
              <span className="text-blue-600">{completos} de {total} listos</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out" 
                style={{ width: `${pctProgreso}%` }} 
              />
            </div>
          </div>

          {/* Selector de Estado */}
          <div className="flex flex-col gap-2 mt-3.5">
            <div className="flex items-center gap-2">
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoTrabajo)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-semibold outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-50 cursor-pointer transition-all"
              >
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <button
                onClick={handleCambiarEstado}
                disabled={saving || estado === trabajo.estado}
                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Guardar</span>
              </button>
            </div>
            
            {errorValidacion && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-semibold bg-red-50 border border-red-100 rounded-lg p-2 mt-1 animate-fade-in">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{errorValidacion}</span>
              </div>
            )}
          </div>
        </div>

        {/* Formularios (Scroll) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          {loadingFormatos ? (
            [1, 2].map((i) => <div key={i} className="h-16 bg-white border border-slate-100 rounded-xl animate-pulse" />)
          ) : formatos.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-10">Ningún formato dinámico asignado.</div>
          ) : (
            formatos.map((formato) => (
              <FormularioAcordeon
                key={formato.id}
                formato={formato}
                abierto={acordeonAbierto === formato.id}
                onToggle={() => setAcordeonAbierto(acordeonAbierto === formato.id ? null : formato.id)}
                onSaved={recargarFormatos}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 border-t border-slate-100 bg-white flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>EXP-ID: #{trabajo.id}</span>
          <span className="font-sans font-semibold text-slate-500">Mantenimiento v2.6</span>
        </div>
      </div>
    </div>
  );
}