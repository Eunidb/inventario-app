/**
 * @file components/ModalNuevoTrabajo.tsx
 * @description Modal para creación y edición de expedientes con tipado estricto.
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type TrabajoExpediente } from "./types";
import {
  X, Save, Loader2, FolderOpen, FolderEdit,
  ShoppingCart, Cog, FlaskConical,
} from "lucide-react";

// Estilos compartidos
const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm " +
  "text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";

interface Props {
  trabajo: TrabajoExpediente | null;
  onClose: () => void;
  onSaved: () => void;
}

// Tipos para el componente auxiliar
type ColorKey = "teal" | "orange" | "rose";

export default function ModalNuevoTrabajo({ trabajo, onClose, onSaved }: Props) {
  const supabase = createClient();
  const isEdit = trabajo !== null;

  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("");
  const [maquina, setMaquina] = useState("");
  const [tipoTrabajo, setTipoTrabajo] = useState("Correctivo");
  const [prioridad, setPrioridad] = useState("Normal");
  const [observaciones, setObservaciones] = useState("");
  const [deptId, setDeptId] = useState("");

  const [reqCompra, setReqCompra] = useState(false);
  const [reqMaquinaria, setReqMaquinaria] = useState(false);
  const [reqLab, setReqLab] = useState(false);

  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  }, [trabajo, supabase]);

  const handleSave = async () => {
    if (!titulo.trim()) { alert("El título es obligatorio."); return; }
    setLoading(true);

    const payload = {
      titulo: titulo.trim(),
      area_solicitante: area.trim() || null,
      maquina: maquina.trim() || null,
      tipo_trabajo: tipoTrabajo,
      prioridad,
      observaciones: observaciones.trim() || null,
      departamento_id: deptId ? parseInt(deptId) : null,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("trabajos").update(payload).eq("id", trabajo!.id));
    } else {
      ({ error } = await supabase.from("trabajos").insert([{
        ...payload,
        creado_por: currentUser,
        requiere_compra: reqCompra,
        requiere_registro_maquinaria: reqMaquinaria,
        requiere_registro_lab: reqLab,
      }]));
    }

    setLoading(false);
    if (error) { alert("Error al guardar: " + error.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex flex-col w-full max-w-xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 fade-in duration-200">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white ${isEdit ? "bg-amber-500" : "bg-blue-600"}`}>
              {isEdit ? <FolderEdit size={18} /> : <FolderOpen size={18} />}
            </div>
            <div>
              <h2 className="text-base font-black">{isEdit ? "Editar Expediente" : "Abrir Expediente"}</h2>
              <p className="text-[11px] text-slate-400 font-medium">{isEdit ? `Folio: ${trabajo?.folio ?? "#" + trabajo?.id}` : "Generación de nuevos formatos"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 bg-slate-50/50">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <Field label="Título del trabajo *">
              <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej. Reparación de equipo..." className={inputCls} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Área">
                <input value={area} onChange={e => setArea(e.target.value)} placeholder="Ej. Producción" className={inputCls} />
              </Field>
              <Field label="Departamento">
                <select value={deptId} onChange={e => setDeptId(e.target.value)} className={inputCls}>
                  <option value="">Sin asignar</option>
                  {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {!isEdit && (
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Formularios requeridos</p>
              <FlagCheckbox checked={reqCompra} onChange={setReqCompra} Icon={ShoppingCart} label="Solicitud de Compra" desc="Materiales o refacciones" color="teal" />
              <FlagCheckbox checked={reqMaquinaria} onChange={setReqMaquinaria} Icon={Cog} label="Registro de Maquinaria" desc="Equipo de línea" color="orange" />
              <FlagCheckbox checked={reqLab} onChange={setReqLab} Icon={FlaskConical} label="Registro de Lab." desc="Equipo de laboratorio" color="rose" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-white">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold text-sm rounded-xl hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-bold text-sm ${isEdit ? "bg-amber-500" : "bg-blue-600"}`}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">{label}</label>{children}</div>;
}

function FlagCheckbox({ checked, onChange, Icon, label, desc, color }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  Icon: React.ElementType;
  label: string;
  desc: string;
  color: ColorKey;
}) {
  const colorMap: Record<ColorKey, string> = {
    teal: "bg-teal-50/60 text-teal-700 border-teal-200",
    orange: "bg-orange-50/60 text-orange-700 border-orange-200",
    rose: "bg-rose-50/60 text-rose-700 border-rose-200",
  };
  return (
    <label className={`flex items-start gap-3.5 p-3 rounded-xl border cursor-pointer transition-all ${checked ? colorMap[color] : "bg-slate-50 border-slate-200"}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1" />
      <Icon size={16} className="mt-1" />
      <div><p className="text-xs font-bold">{label}</p><p className="text-[10px] opacity-70">{desc}</p></div>
    </label>
  );
}