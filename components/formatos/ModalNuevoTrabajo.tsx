/**
 * @file components/formatos/ModalNuevoTrabajo.tsx
 * @description Modal para abrir un nuevo Expediente de Trabajo.
 *
 * FLUJO:
 *   1. El usuario escribe el título, área solicitante, prioridad y tipo de trabajo.
 *   2. Marca los formularios opcionales que apliquen al trabajo:
 *        - Registro de Maquinaria   → si el equipo es de producción
 *        - Solicitud de Compra      → si se necesitan refacciones
 *        - Registro Lab. / Prod.    → si el equipo es de laboratorio farmacéutico
 *   3. Al guardar, el trigger de Supabase crea automáticamente los registros_formato
 *      correspondientes (siempre: solicitud_trabajo + reporte_servicio, más los opcionales).
 *
 * RESPONSIVE:
 *   - En mobile ocupa la pantalla completa (w-full, rounded-none en la parte inferior).
 *   - En desktop se muestra como modal centrado de ancho máximo 512px.
 */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { X, Save, Loader2, Package, ShoppingCart, FlaskConical } from "lucide-react";

// ─── Props del componente ────────────────────────────────────────────────────
interface ModalNuevoTrabajoProps {
  /** Función llamada al cerrar el modal sin guardar */
  onClose: () => void;
  /** Función llamada después de guardar exitosamente; la página padre recarga la lista */
  onSaved: () => void;
}

export default function ModalNuevoTrabajo({ onClose, onSaved }: ModalNuevoTrabajoProps) {

  // ── Estado del formulario ─────────────────────────────────────────────────
  const [titulo,     setTitulo]     = useState("");
  const [area,       setArea]       = useState("");
  const [prioridad,  setPrioridad]  = useState("Normal");
  const [tipoTrab,   setTipoTrab]   = useState("Correctivo");
  const [saving,     setSaving]     = useState(false);

  // Flags de formularios opcionales
  const [conMaquinaria, setConMaquinaria] = useState(false);
  const [conCompra,     setConCompra]     = useState(false);
  const [conLab,        setConLab]        = useState(false);

  // ── Guardar el expediente en Supabase ─────────────────────────────────────
  const handleGuardar = async () => {
    if (!titulo.trim() || !area.trim()) {
      alert("La descripción del trabajo y el área son campos requeridos.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    /**
     * Al insertar en "trabajos", el trigger `tr_crear_formatos` de Supabase
     * crea automáticamente los registros_formato según los flags:
     *   - solicitud_trabajo y reporte_servicio → siempre
     *   - registro_maquinaria, solicitud_compra, registro_lab_produccion → según flags
     */
    const { error } = await supabase.from("trabajos").insert([{
      titulo:                       titulo.trim(),
      area_solicitante:             area.trim(),
      prioridad,
      tipo_trabajo:                 tipoTrab,
      requiere_registro_maquinaria: conMaquinaria,
      requiere_compra:              conCompra,
      requiere_registro_lab:        conLab,
      creado_por:                   user?.id ?? null,
    }]);

    if (error) {
      alert("Error al crear el expediente: " + error.message);
    } else {
      onSaved();
    }
    setSaving(false);
  };

  return (
    /**
     * Overlay con backdrop blur.
     * Clic fuera del modal cierra sin guardar.
     */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/*
       * Tarjeta del modal.
       * Mobile: sube desde abajo, esquinas superiores redondeadas, sin padding lateral extra.
       * Desktop (sm+): flotante centrado con bordes redondeados en todos los lados.
       */}
      <div className="relative bg-white w-full sm:max-w-lg
                      rounded-t-3xl sm:rounded-3xl
                      shadow-2xl overflow-hidden
                      max-h-[95vh] flex flex-col">

        {/* ── Cabecera ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-800">Abrir Nuevo Expediente</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Departamento de Mantenimiento
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cuerpo scrolleable ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* Nota informativa sobre los formularios automáticos */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-slate-600 leading-relaxed">
            Al crear el expediente se generan automáticamente los formularios
            <strong className="text-blue-700"> Solicitud de Trabajo</strong> y{" "}
            <strong className="text-blue-700">Reporte de Servicio</strong>.
            Marca abajo si el trabajo requiere formularios adicionales.
          </div>

          {/* ── Campo: Descripción del trabajo ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Descripción del Trabajo <span className="text-red-400">*</span>
            </label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej. Reparación de compresor sala de producción 3..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                         text-sm text-slate-700 outline-none
                         focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          {/* ── Campo: Área solicitante ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Área / Departamento Solicitante <span className="text-red-400">*</span>
            </label>
            <input
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="Ej. Producción, Almacén, Calidad..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                         text-sm text-slate-700 outline-none
                         focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          {/* ── Fila: Prioridad + Tipo de trabajo ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Prioridad
              </label>
              <select
                value={prioridad}
                onChange={e => setPrioridad(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3
                           text-sm text-slate-700 outline-none"
              >
                <option>Alta</option>
                <option>Normal</option>
                <option>Baja</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Tipo de Trabajo
              </label>
              <select
                value={tipoTrab}
                onChange={e => setTipoTrab(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3
                           text-sm text-slate-700 outline-none"
              >
                <option>Correctivo</option>
                <option>Preventivo</option>
                <option>Instalación</option>
                <option>Otro</option>
              </select>
            </div>
          </div>

          {/* ── Formularios adicionales ── */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Formularios Adicionales Requeridos
            </p>
            <div className="space-y-2">
              {[
                {
                  label: "Registro de Maquinaria de Producción",
                  sub:   "Si el equipo pertenece a líneas de producción",
                  Icon:  Package,
                  val:   conMaquinaria,
                  set:   setConMaquinaria,
                },
                {
                  label: "Solicitud de Compra",
                  sub:   "Si se requieren refacciones o materiales a comprar",
                  Icon:  ShoppingCart,
                  val:   conCompra,
                  set:   setConCompra,
                },
                {
                  label: "Registro Lab. Medicamentos / Prod. Terminados",
                  sub:   "Si el equipo es de laboratorio farmacéutico",
                  Icon:  FlaskConical,
                  val:   conLab,
                  set:   setConLab,
                },
              ].map(({ label, sub, Icon, val, set }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set(!val)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                    ${val
                      ? "bg-blue-50 border-blue-200"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                >
                  {/* Checkbox visual */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                      ${val ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
                    {val && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <Icon size={16} className={val ? "text-blue-600 flex-shrink-0 mt-0.5" : "text-slate-400 flex-shrink-0 mt-0.5"} />
                  <div>
                    <p className={`text-sm font-bold ${val ? "text-blue-700" : "text-slate-600"}`}>{label}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pie del modal: acciones ── */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                       px-5 py-2.5 rounded-xl font-bold text-sm
                       shadow-md shadow-blue-200 disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Creando..." : "Crear Expediente"}
          </button>
        </div>
      </div>
    </div>
  );
}