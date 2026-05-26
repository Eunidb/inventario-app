"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type TrabajoExpediente } from "./types";
import {
  X, Save, Loader2, FolderOpen, FolderEdit,
  ShoppingCart, Cog, FlaskConical,
} from "lucide-react";

interface Props {
  trabajo: TrabajoExpediente | null;  // null = crear, objeto = editar
  onClose: () => void;
  onSaved: () => void;
}

export default function ModalNuevoTrabajo({ trabajo, onClose, onSaved }: Props) {
  const supabase  = createClient();
  const isEdit    = trabajo !== null; // true cuando se edita un expediente

  // ── Campos del formulario ─────────────────────────────────────────────────
  const [titulo,       setTitulo]       = useState("");
  const [area,         setArea]         = useState("");
  const [maquina,      setMaquina]      = useState("");
  const [tipoTrabajo,  setTipoTrabajo]  = useState("Correctivo");
  const [prioridad,    setPrioridad]    = useState("Normal");
  const [observaciones,setObservaciones]= useState("");
  const [deptId,       setDeptId]       = useState("");

  // ── Flags de formularios adicionales (solo en modo NUEVO) ────────────────
  const [reqCompra,     setReqCompra]     = useState(false);
  const [reqMaquinaria, setReqMaquinaria] = useState(false);
  const [reqLab,        setReqLab]        = useState(false);

  // ── Datos externos ────────────────────────────────────────────────────────
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [currentUser,   setCurrentUser]   = useState<string | null>(null);
  const [loading,       setLoading]       = useState(false);

  // Carga departamentos, usuario y (si edición) datos actuales del trabajo
  useEffect(() => {
    const init = async () => {
      const [{ data: deptos }, { data: { user } }] = await Promise.all([
        supabase.from("departamentos").select("id, nombre").order("nombre"),
        supabase.auth.getUser(),
      ]);
      setDepartamentos(deptos ?? []);
      setCurrentUser(user?.id ?? null);

      if (trabajo) {
        setTitulo(trabajo.titulo);
        setArea(trabajo.area_solicitante ?? "");
        setMaquina(trabajo.maquina ?? "");
        setTipoTrabajo(trabajo.tipo_trabajo ?? "Correctivo");
        setPrioridad(trabajo.prioridad ?? "Normal");
        setObservaciones(trabajo.observaciones ?? "");
        setDeptId(trabajo.departamento_id ? String(trabajo.departamento_id) : "");
        setReqCompra(trabajo.requiere_compra);
        setReqMaquinaria(trabajo.requiere_registro_maquinaria);
        setReqLab(trabajo.requiere_registro_lab);
      }
    };
    init();
  }, [trabajo]);

  // ── Guardar (INSERT o UPDATE) ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!titulo.trim()) { alert("El título es obligatorio."); return; }
    setLoading(true);

    const payload = {
      titulo:        titulo.trim(),
      area_solicitante: area.trim() || null,
      maquina:       maquina.trim() || null,
      tipo_trabajo:  tipoTrabajo,
      prioridad,
      observaciones: observaciones.trim() || null,
      departamento_id: deptId ? parseInt(deptId) : null,
    };

    let error;

    if (isEdit) {
      ({ error } = await supabase
        .from("trabajos")
        .update(payload)
        .eq("id", trabajo!.id));
    } else {
      ({ error } = await supabase.from("trabajos").insert([{
        ...payload,
        creado_por:                  currentUser,
        requiere_compra:              reqCompra,
        requiere_registro_maquinaria: reqMaquinaria,
        requiere_registro_lab:        reqLab,
      }]));
    }

    setLoading(false);
    if (error) { alert("Error al guardar: " + error.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center p-0 sm:p-4 transition-opacity">
      {/* Overlay con click-to-close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Contenedor Principal del Modal Centrado */}
      <div className="relative flex flex-col w-full max-w-xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Pestaña táctil superior (Solo Mobile) */}
        <div className="flex justify-center py-2 sm:hidden bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* 1. Cabecera Fija */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-white z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl text-white flex-shrink-0 shadow-sm ${isEdit ? "bg-amber-500" : "bg-blue-600"}`}>
              {isEdit ? <FolderEdit size={18} /> : <FolderOpen size={18} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-800 truncate">
                {isEdit ? "Editar Expediente" : "Abrir Expediente"}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                {isEdit
                  ? `Folio: ${trabajo?.folio ?? "#" + trabajo?.id}`
                  : "Se generarán los formularios automáticamente"}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Cuerpo con Scroll Independiente */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-5 sm:p-6 space-y-5 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">

          {/* Bloque: Información Principal */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <Field label="Título del trabajo *">
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej. Reparación de bomba dosificadora"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Área solicitante">
                <input value={area} onChange={e => setArea(e.target.value)}
                  placeholder="Ej. Producción" className={inputCls} />
              </Field>
              <Field label="Departamento">
                <select value={deptId} onChange={e => setDeptId(e.target.value)} className={inputCls}>
                  <option value="">Sin asignar</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Máquina / Equipo">
              <input
                value={maquina}
                onChange={e => setMaquina(e.target.value)}
                placeholder="Ej. Fermentador F-02, Compresor atlas"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Bloque: Logística */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tipo de mantenimiento">
                <select value={tipoTrabajo} onChange={e => setTipoTrabajo(e.target.value)} className={inputCls}>
                  <option>Correctivo</option>
                  <option>Preventivo</option>
                  <option>Instalación</option>
                  <option>Calibración</option>
                  <option>Eléctrico</option>
                </select>
              </Field>
              <Field label="Prioridad">
                <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className={inputCls}>
                  <option>Alta</option>
                  <option>Normal</option>
                  <option>Baja</option>
                </select>
              </Field>
            </div>

            <Field label="Observaciones iniciales">
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Descripción breve del problema o trabajo a realizar..."
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>

          {/* Bloque: Flags de formularios adicionales */}
          {!isEdit && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Formularios adicionales requeridos
              </p>
              <div className="space-y-2.5">
                <FlagCheckbox
                  checked={reqCompra}
                  onChange={setReqCompra}
                  Icon={ShoppingCart}
                  label="Solicitud de Compra"
                  desc="Se necesitan refacciones o materiales a adquirir"
                  color="teal"
                />
                <FlagCheckbox
                  checked={reqMaquinaria}
                  onChange={setReqMaquinaria}
                  Icon={Cog}
                  label="Registro de Maquinaria de Producción"
                  desc="El equipo pertenece a la línea de producción"
                  color="orange"
                />
                <FlagCheckbox
                  checked={reqLab}
                  onChange={setReqLab}
                  Icon={FlaskConical}
                  label="Registro de Lab. de Producción"
                  desc="Equipo de laboratorio de medicamentos o prod. terminados"
                  color="rose"
                />
              </div>
              <p className="text-[10px] text-slate-400 pt-2 italic leading-relaxed border-t border-slate-50">
                * El <strong>Formato de Solicitud de Trabajo</strong> y el <strong>Reporte de Servicio</strong> se generan de manera obligatoria en cada alta.
              </p>
            </div>
          )}
        </div>

        {/* 3. Pie de Formulario Fijo */}
        <div className="flex justify-end items-center gap-3 px-5 py-4 sm:px-6 border-t border-slate-100 bg-white flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-60 ${
              isEdit ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
            }`}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{loading ? "Guardando..." : isEdit ? "Guardar Cambios" : "Abrir Expediente"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componentes auxiliares locales ──────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function FlagCheckbox({ checked, onChange, Icon, label, desc, color }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  Icon: React.FC<any>;
  label: string;
  desc: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    teal:   "bg-teal-50/60 text-teal-700 border-teal-200/80",
    orange: "bg-orange-50/60 text-orange-700 border-orange-200/80",
    rose:   "bg-rose-50/60 text-rose-700 border-rose-200/80",
  };
  const iconMap: Record<string, string> = {
    teal: "text-teal-500", orange: "text-orange-500", rose: "text-rose-500",
  };
  return (
    <label className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
      checked ? `${colorMap[color]} shadow-sm` : "bg-slate-50/50 border-slate-200/80 hover:border-slate-300 hover:bg-white"
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 rounded accent-blue-600 w-4 h-4 flex-shrink-0 transition-transform active:scale-95"
      />
      <Icon size={16} className={`mt-0.5 flex-shrink-0 transition-colors ${checked ? iconMap[color] : "text-slate-400"}`} />
      <div className="min-w-0">
        <p className={`text-xs font-bold transition-colors ${checked ? "text-slate-800" : "text-slate-600"}`}>{label}</p>
        <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{desc}</p>
      </div>
    </label>
  );
}

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm " +
  "text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";