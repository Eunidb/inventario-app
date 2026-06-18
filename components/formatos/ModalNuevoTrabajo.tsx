"use client";

/**
 * @file components/formatos/ModalNuevoTrabajo.tsx
 *
 * Crea o edita un expediente de trabajo.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type TrabajoExpediente } from "./types";
import {
  X, Save, Loader2, FolderOpen, FolderEdit, Info,
} from "lucide-react";

// ─── Estilos compartidos ───────────────────────────────────────────────────
const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm " +
  "text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";

interface Props {
  trabajo: TrabajoExpediente | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ModalNuevoTrabajo({ trabajo, onClose, onSaved }: Props) {
  const supabase = createClient();
  const isEdit = trabajo !== null;

  // ─── Estado del formulario ───────────────────────────────────────────────
  const [titulo,       setTitulo]       = useState("");
  const [area,         setArea]         = useState("");
  const [maquina,      setMaquina]      = useState("");
  const [tipoTrabajo,  setTipoTrabajo]  = useState("Correctivo");
  const [prioridad,    setPrioridad]    = useState("Normal");
  const [observaciones, setObservaciones] = useState("");
  const [deptId,       setDeptId]       = useState("");
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [currentUser,  setCurrentUser]  = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);

  // ─── Carga inicial: catálogos + datos del expediente si es edición ───────
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
      }
    };
    init();
  }, [trabajo]);

  // ─── Guardado ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!titulo.trim()) { alert("El título es obligatorio."); return; }
    setLoading(true);

    const payload = {
      titulo:           titulo.trim(),
      area_solicitante: area.trim()         || null,
      maquina:          maquina.trim()      || null,
      tipo_trabajo:     tipoTrabajo,
      prioridad,
      observaciones:    observaciones.trim() || null,
      departamento_id:  deptId ? parseInt(deptId) : null,
    };

    let error;

    if (isEdit) {
      // Edición: solo actualiza los datos del expediente, no toca formatos
      ({ error } = await supabase
        .from("trabajos")
        .update(payload)
        .eq("id", trabajo!.id));
    } else {
      // Creación: el trigger `tr_crear_formatos` genera solicitud_trabajo
      // y reporte_servicio automáticamente al insertar.
      ({ error } = await supabase.from("trabajos").insert([{
        ...payload,
        creado_por: currentUser,
      }]));
    }

    setLoading(false);
    if (error) { alert("Error al guardar: " + error.message); return; }
    onSaved();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center p-0 sm:p-4">
      {/* Cierre al hacer clic en el backdrop */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      <div className="relative z-10 flex flex-col w-full max-w-xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 fade-in duration-200">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white ${isEdit ? "bg-amber-500" : "bg-blue-600"}`}>
              {isEdit ? <FolderEdit size={18} /> : <FolderOpen size={18} />}
            </div>
            <div>
              <h2 className="text-base font-black">
                {isEdit ? "Editar Expediente" : "Abrir Expediente"}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {isEdit
                  ? `Folio: ${trabajo?.folio ?? "#" + trabajo?.id}`
                  : "Nuevo expediente de mantenimiento"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            type="button"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cuerpo ─────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 bg-slate-50/50">

          {/* Datos principales del trabajo */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <Field label="Título del trabajo *">
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej. Reparación de compresor línea 3"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Área solicitante">
                <input
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  placeholder="Ej. Inyectables, Bacterinas..."
                  className={inputCls}
                />
              </Field>

              <Field label="Departamento">
                <select
                  value={deptId}
                  onChange={e => setDeptId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Sin asignar</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </Field>

              <Field label="Máquina / Equipo">
                <input
                  value={maquina}
                  onChange={e => setMaquina(e.target.value)}
                  placeholder="Ej. Liofilizador #2, Autoclave..."
                  className={inputCls}
                />
              </Field>

              <Field label="Tipo de trabajo">
                <select
                  value={tipoTrabajo}
                  onChange={e => setTipoTrabajo(e.target.value)}
                  className={inputCls}
                >
                  <option>Correctivo</option>
                  <option>Preventivo</option>
                  <option>Instalación</option>
                  <option>Calibración</option>
                </select>
              </Field>

              <Field label="Prioridad">
                <select
                  value={prioridad}
                  onChange={e => setPrioridad(e.target.value)}
                  className={inputCls}
                >
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
                rows={2}
                placeholder="Descripción del problema o contexto del trabajo..."
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>

          {/* Nota informativa — solo visible al crear */}
          {!isEdit && (
            <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              <Info size={15} className="shrink-0 mt-0.5 text-blue-500" />
              <p className="font-medium leading-relaxed">
                Al abrir el expediente se generan automáticamente los formatos base:{" "}
                <strong>Solicitud de Trabajo</strong> y{" "}
                <strong>Reporte de Servicio</strong>. Si el trabajo requiere
                compra de material, registro de maquinaria o lab., podrás
                agregar esos formatos desde el panel del expediente.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end items-center gap-3 px-5 py-4 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${
              isEdit ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componente Field ─────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}