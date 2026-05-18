/**
 * @file components/formatos/ModalNuevoTrabajo.tsx
 */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { X, Save, Loader2, Package, ShoppingCart, FlaskConical } from "lucide-react";

interface ModalNuevoTrabajoProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ModalNuevoTrabajo({ onClose, onSaved }: ModalNuevoTrabajoProps) {
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("");
  const [prioridad, setPrioridad] = useState("Normal");
  const [tipoTrab, setTipoTrab] = useState("Correctivo");
  const [saving, setSaving] = useState(false);

  const [conMaquinaria, setConMaquinaria] = useState(false);
  const [conCompra, setConCompra] = useState(false);
  const [conLab, setConLab] = useState(false);

  const handleGuardar = async () => {
    // Sanitización básica de cadenas vacías
    const tituloLimpio = titulo.trim();
    const areaLimpia = area.trim();

    if (!tituloLimpio || !areaLimpia) {
      alert("Por favor rellene los campos mandatorios.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Inserción segura parametrizada automáticamente por Supabase
    const { error } = await supabase.from("trabajos").insert([
      {
        titulo: tituloLimpio,
        area_solicitante: areaLimpia,
        prioridad,
        tipo_trabajo: tipoTrab,
        requiere_registro_maquinaria: conMaquinaria,
        requiere_compra: conCompra,
        requiere_registro_lab: conLab,
        creado_por: user?.id ?? null,
      },
    ]);

    if (!error) onSaved();
    else alert("Error: " + error.message);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-xl h-[92dvh] sm:h-auto max-h-[95vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-linear-to-b from-slate-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-800">Apertura de Expediente</h2>
            <p className="text-[10px] text-slate-400 font-medium">Asignación automática de formatos base</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 active:scale-95 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Formulario Cuerpo */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Descripción de la Tarea *</label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej. Diagnóstico y cambio de baleros en motor principal"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-700 outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Área Solicitante *</label>
            <input
              type="text"
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="Ej. Línea 2 - Empaque"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-700 outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Prioridad</label>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer">
                <option>Alta</option> <option>Normal</option> <option>Baja</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tipo</label>
              <select value={tipoTrab} onChange={e => setTipoTrab(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer">
                <option>Correctivo</option> <option>Preventivo</option> <option>Mejora</option>
              </select>
            </div>
          </div>

          {/* Opciones Adicionales */}
          <div className="border-t border-slate-100 pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Formatos Complementarios</span>
            <div className="space-y-2">
              {[
                { label: "Gestión de Maquinaria", Icon: Package, val: conMaquinaria, set: setConMaquinaria },
                { label: "Requerimiento de Compra", Icon: ShoppingCart, val: conCompra, set: setConCompra },
                { label: "Módulo Farmacéutico / Lab", Icon: FlaskConical, val: conLab, set: setConLab },
              ].map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => row.set(!row.val)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all
                    ${row.val ? "bg-blue-50/70 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  <row.Icon size={16} className={row.val ? "text-blue-600" : "text-slate-400"} />
                  <span className="text-xs font-semibold flex-1">{row.label}</span>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center text-white text-[10px] ${row.val ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
                    {row.val && "✓"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <span>Abrir Expediente</span>
          </button>
        </div>

      </div>
    </div>
  );
}