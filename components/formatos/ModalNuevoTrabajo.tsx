/**
 * @file components/formatos/ModalNuevoTrabajo.tsx
 * @description Modal para crear O editar un expediente de trabajo.
 *
 * Modo NUEVO (trabajo = null):
 *   Inserta en `trabajos`. El trigger `tr_crear_formatos` genera los
 *   registros_formato según los flags marcados.
 *
 * Modo EDICIÓN (trabajo = TrabajoExpediente):
 *   Actualiza los campos del expediente existente.
 *   NO recrea los registros_formato (ya existen); solo modifica los flags
 *   si el trigger lo permite, o se omiten en el UPDATE.
 *
 * Props:
 *   trabajo  → null (nuevo) | TrabajoExpediente (editar)
 *   onClose  → cierra el modal sin guardar
 *   onSaved  → refresca la tabla tras guardar
 */

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

      // Pre-rellena los campos si estamos editando
      if (trabajo) {
        setTitulo(trabajo.titulo);
        setArea(trabajo.area_solicitante ?? "");
        setMaquina(trabajo.maquina ?? "");
        setTipoTrabajo(trabajo.tipo_trabajo ?? "Correctivo");
        setPrioridad(trabajo.prioridad ?? "Normal");
        setObservaciones(trabajo.observaciones ?? "");
        setDeptId(trabajo.departamento_id ? String(trabajo.departamento_id) : "");
        // Refleja los flags actuales del expediente
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
      // EDICIÓN: actualiza solo los campos editables; los flags no se modifican
      // porque los registros_formato ya fueron creados por el trigger al abrir.
      ({ error } = await supabase
        .from("trabajos")
        .update(payload)
        .eq("id", trabajo!.id));
    } else {
      // NUEVO: inserta con los flags; el trigger creará los registros_formato
      ({ error } = await supabase.from("trabajos").insert([{
        ...payload,
        creado_por:                   currentUser,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay con blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Cabecera ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              {isEdit ? <FolderEdit size={18} /> : <FolderOpen size={18} />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">
                {isEdit ? "Editar Expediente" : "Abrir Expediente"}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isEdit
                  ? `Folio: ${trabajo?.folio ?? "#" + trabajo?.id}`
                  : "Se generarán los formularios automáticamente"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Cuerpo con scroll ────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Título — obligatorio */}
          <Field label="Título del trabajo *">
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej. Reparación de bomba dosificadora"
              className={inputCls}
            />
          </Field>

          {/* Área y departamento */}
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

          {/* Máquina (campo nuevo para búsqueda rápida en la tabla) */}
          <Field label="Máquina / Equipo">
            <input
              value={maquina}
              onChange={e => setMaquina(e.target.value)}
              placeholder="Ej. Fermentador F-02, Compresor atlas"
              className={inputCls}
            />
          </Field>

          {/* Tipo y prioridad */}
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

          {/* Observaciones iniciales */}
          <Field label="Observaciones iniciales">
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Descripción breve del problema o trabajo a realizar..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* ── Formularios adicionales (solo en modo NUEVO) ──────────────
              En modo edición se ocultan porque los registros_formato ya
              existen y no deben regenerarse.
          */}
          {!isEdit && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Formularios adicionales
              </p>
              <div className="space-y-2">
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
              <p className="text-[10px] text-slate-400 mt-3 italic leading-relaxed">
                * <strong>Solicitud de Trabajo</strong> y <strong>Reporte de Servicio</strong> se generan siempre.
              </p>
            </div>
          )}
        </div>

        {/* ── Pie ─────────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                       px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-200
                       disabled:opacity-60 transition-all"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {loading ? "Guardando..." : isEdit ? "Guardar Cambios" : "Abrir Expediente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
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
    teal:   "bg-teal-50 text-teal-700 border-teal-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    rose:   "bg-rose-50 text-rose-700 border-rose-100",
  };
  const iconMap: Record<string, string> = {
    teal: "text-teal-500", orange: "text-orange-500", rose: "text-rose-500",
  };
  return (
    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
      checked ? `${colorMap[color]} border` : "bg-slate-50 border-slate-200 hover:border-slate-300"
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 rounded accent-blue-600 w-4 h-4 flex-shrink-0"
      />
      <Icon size={16} className={`mt-0.5 flex-shrink-0 ${checked ? iconMap[color] : "text-slate-400"}`} />
      <div>
        <p className={`text-sm font-bold ${checked ? "text-slate-800" : "text-slate-600"}`}>{label}</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </label>
  );
}

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm " +
  "text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";