/**
 * @file components/formatos/ModalNuevoTrabajo.tsx
 * @description Modal altamente optimizado y 100% responsive para abrir un expediente.
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
  // ── Estado del formulario ─────────────────────────────────────────────────
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("");
  const [prioridad, setPrioridad] = useState("Normal");
  const [tipoTrab, setTipoTrab] = useState("Correctivo");
  const [saving, setSaving] = useState(false);

  // Flags de formularios opcionales
  const [conMaquinaria, setConMaquinaria] = useState(false);
  const [conCompra, setConCompra] = useState(false);
  const [conLab, setConLab] = useState(false);

  // ── Guardar el expediente en Supabase ─────────────────────────────────────
  const handleGuardar = async () => {
    if (!titulo.trim() || !area.trim()) {
      alert("La descripción del trabajo y el área son campos requeridos.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("trabajos").insert([{
      titulo: titulo.trim(),
      area_solicitante: area.trim(),
      prioridad,
      tipo_trabajo: tipoTrab,
      requiere_registro_maquinaria: conMaquinaria,
      requiere_compra: conCompra,
      requiere_registro_lab: conLab,
      creado_por: user?.id ?? null,
    }]);

    if (error) {
      alert("Error al crear el expediente: " + error.message);
    } else {
      onSaved();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Fondo difuminado */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Tarjeta del modal adaptable */}
      <div className="relative bg-white w-full sm:max-w-xl h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200">
        
        {/* ── Cabecera ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
          <div>
            <h2 className="text-base font-black text-slate-800">Abrir Nuevo Expediente</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
              Departamento de Mantenimiento
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cuerpo Scrolleable ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-white">
          
          {/* Nota informativa */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl sm:rounded-2xl px-4 py-2.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            Se generarán automáticamente los formatos de <strong className="text-blue-700">Solicitud de Trabajo</strong> y <strong className="text-blue-700">Reporte de Servicio</strong>, marca abajo si el trabajo requiere formularios adicionales.
          </div>

          {/* Campo: Descripción */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Descripción del Trabajo <span className="text-red-400">*</span>
            </label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej. Reparación de compresor sala de producción 3..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Campo: Área */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Área / Departamento Solicitante <span className="text-red-400">*</span>
            </label>
            <input
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="Ej. Producción, Almacén, Calidad..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Fila: Prioridad + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Prioridad
              </label>
              <select
                value={prioridad}
                onChange={e => setPrioridad(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer"
              >
                <option>Alta</option>
                <option>Normal</option>
                <option>Baja</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tipo de Trabajo
              </label>
              <select
                value={tipoTrab}
                onChange={e => setTipoTrab(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer"
              >
                <option>Correctivo</option>
                <option>Preventivo</option>
                <option>Instalación</option>
                <option>Otro</option>
              </select>
            </div>
          </div>

          {/* Formularios adicionales */}
          <div className="border-t border-slate-100 pt-3.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
              Formularios Adicionales Requeridos
            </p>
            <div className="space-y-2">
              {[
                {
                  label: "Registro de Maquinaria de Producción",
                  sub: "Si el equipo pertenece a líneas de producción",
                  Icon: Package,
                  val: conMaquinaria,
                  set: setConMaquinaria,
                },
                {
                  label: "Solicitud de Compra",
                  sub: "Si se requieren refacciones o materiales a comprar",
                  Icon: ShoppingCart,
                  val: conCompra,
                  set: setConCompra,
                },
                {
                  label: "Registro Lab. Medicamentos / Productos",
                  sub: "Si el equipo es de laboratorio farmacéutico",
                  Icon: FlaskConical,
                  val: conLab,
                  set: setConLab,
                },
              ].map(({ label, sub, Icon, val, set }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set(!val)}
                  className={`w-full flex items-center sm:items-start gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.99]
                    ${val ? "bg-blue-50/60 border-blue-200" : "bg-slate-50/60 border-slate-200 hover:border-slate-300"}`}
                >
                  {/* Checkbox visual */}
                  <div className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                      ${val ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
                    {val && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  
                  <Icon size={16} className={`flex-shrink-0 ${val ? "text-blue-600" : "text-slate-400"}`} />
                  
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-bold truncate sm:whitespace-normal ${val ? "text-blue-700" : "text-slate-600"}`}>
                      {label}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate sm:whitespace-normal mt-0.5 hidden xs:block">
                      {sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pie del Modal fijo ── */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 flex-shrink-0 pb-safe">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-500 font-bold text-xs sm:text-sm hover:text-slate-700 transition-colors active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                       px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm min-w-[140px]
                       shadow-md shadow-blue-200 disabled:opacity-60 transition-all active:scale-95"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? "Creando..." : "Crear Expediente"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}