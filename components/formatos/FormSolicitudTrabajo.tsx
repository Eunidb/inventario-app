"use client";

/**
 * @file components/formatos/FormSolicitudTrabajo.tsx
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import {
  Save, Loader2, Camera, Trash2, X, ClipboardList,
} from "lucide-react";

type ColorKey = "blue" | "purple" | "orange" | "teal" | "rose";

// Forzamos a que onClose sea obligatorio para unificar la robustez de la app
export default function FormSolicitudTrabajo({
  registro, trabajoId, onSaved, onClose,
}: FormProps & { onClose: () => void }) { // <-- Removido el signo "?" para consistencia estructural
  const supabase = createClient();

  const [area,        setArea]        = useState("");
  const [fecha,       setFecha]       = useState(new Date().toISOString().split("T")[0]);
  const [descripcion, setDescripcion] = useState("");
  const [material,    setMaterial]    = useState("");
  const [vobo,        setVobo]        = useState("");
  const [autorizo,    setAutorizo]    = useState("");
  const [imagenUrl,   setImagenUrl]   = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    const d = registro?.datos_json ?? {};
    setArea(d.area ?? "");
    setFecha(d.fecha ?? new Date().toISOString().split("T")[0]);
    setDescripcion(d.descripcion ?? "");
    setMaterial(d.material ?? "");
    setVobo(d.vobo ?? "");
    setAutorizo(d.autorizo ?? "");
    setImagenUrl(registro?.imagen_url ?? null);
  }, [registro]);

  const uploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `trabajos/${trabajoId}/solicitud-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("formatos").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("formatos").getPublicUrl(path);
      setImagenUrl(publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("registros_formato").update({
      datos_json:     { area, fecha, descripcion, material, vobo, autorizo },
      imagen_url:     imagenUrl,
      completado:     true,
      completado_por: user?.id ?? null,
      fecha_llenado:  new Date().toISOString(),
    }).eq("id", registro.id);
    setLoading(false);
    onSaved();
  };

  return (
    // Wrapper de modal a pantalla completa
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop: cierra el modal de forma segura al hacer clic fuera */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Tarjeta del formulario */}
      <div className="relative flex flex-col w-full max-w-2xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">

        {/* Indicador de arrastre en móvil */}
        <div className="flex justify-center py-2 sm:hidden bg-slate-50 border-b border-slate-100">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header con título y botón X */}
        <div className="relative p-5 sm:p-6 border-b border-slate-100 bg-white z-10 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <FormHeader
              titulo="Solicitud de Trabajo"
              subtitulo="Formato 3 · Departamento de Mantenimiento"
              Icon={ClipboardList}
              color="blue"
              completado={registro?.completado}
            />
          </div>
          {/* Botón X — Siempre visible y renderizado */}
          <button
            onClick={onClose}
            className="ml-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            type="button"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5 bg-slate-50/50">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Datos de la Solicitud</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Área que solicita">
                <input value={area} onChange={e => setArea(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Fecha">
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Especificaciones Técnicas</p>
            <Field label="Descripción del trabajo">
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Material para el trabajo">
              <textarea value={material} onChange={e => setMaterial(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </Field>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Validación y Firmas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Vo.Bo.">
                <input value={vobo} onChange={e => setVobo(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Autorizó">
                <input value={autorizo} onChange={e => setAutorizo(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <FotoFormato imagenUrl={imagenUrl} uploading={uploading} onUpload={uploadFoto} onDelete={() => setImagenUrl(null)} color="blue" />
          </div>
        </div>

        {/* Footer con botones de control */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white z-10 flex justify-end items-center gap-3">
          {/* Botón Cancelar Explícito */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} color="blue" />
        </div>
      </div>
    </div>
  );
}

// ─── Helpers compartidos (exportados para uso en otros formularios) ────────────

/** Encabezado de formulario con ícono y badge de completado */
export function FormHeader({
  titulo, subtitulo, Icon, color, completado,
}: {
  titulo: string;
  subtitulo: string;
  Icon: React.ElementType;
  color: ColorKey;
  completado?: boolean;
}) {
  const colorMap: Record<ColorKey, string> = {
    blue:   "bg-blue-600",
    purple: "bg-purple-600",
    orange: "bg-orange-600",
    teal:   "bg-teal-600",
    rose:   "bg-rose-600",
  };
  return (
    <div className="flex items-start gap-4">
      <div className={`p-3 ${colorMap[color]} rounded-2xl text-white flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-800">{titulo}</h3>
        <p className="text-[11px] text-slate-400 font-medium">{subtitulo}</p>
        {completado && (
          <span className="inline-block mt-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            COMPLETADO
          </span>
        )}
      </div>
    </div>
  );
}

/** Contenedor de campo con etiqueta */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/** Selector / visualizador de fotografía del formato */
export function FotoFormato({
  imagenUrl, uploading, onUpload, onDelete, color = "blue",
}: {
  imagenUrl: string | null;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  color?: ColorKey;
}) {
  const borderMap: Record<ColorKey, string> = {
    blue:   "hover:border-blue-300 hover:bg-blue-50/20",
    purple: "hover:border-purple-300 hover:bg-purple-50/20",
    orange: "hover:border-orange-300 hover:bg-orange-50/20",
    teal:   "hover:border-teal-300 hover:bg-teal-50/20",
    rose:   "hover:border-rose-300 hover:bg-rose-50/20",
  };

  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2.5">Evidencia: foto del formato</p>
      {imagenUrl ? (
        <div className="relative rounded-xl border border-slate-200 p-1">
          <img src={imagenUrl} alt="Evidencia" className="w-full h-40 object-cover rounded-lg" />
          <button onClick={onDelete} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-lg">
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer transition-all ${borderMap[color]}`}>
          {uploading
            ? <Loader2 size={24} className="animate-spin text-slate-400" />
            : <Camera size={24} className="text-slate-300" />
          }
          <span className="text-xs text-slate-400 font-medium">
            {uploading ? "Subiendo..." : "Cargar fotografía del formato"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

/** Botón de guardar con estado de carga */
export function SaveButton({
  loading, onSave, completado, color = "blue",
}: {
  loading: boolean;
  onSave: () => void;
  completado?: boolean;
  color?: ColorKey;
}) {
  const bgMap: Record<ColorKey, string> = {
    blue:   "bg-blue-600 hover:bg-blue-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    orange: "bg-orange-600 hover:bg-orange-700",
    teal:   "bg-teal-600 hover:bg-teal-700",
    rose:   "bg-rose-600 hover:bg-rose-700",
  };
  return (
    <button
      onClick={onSave}
      disabled={loading}
      className={`flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${bgMap[color]}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {loading ? "Guardando..." : completado ? "Actualizar" : "Guardar"}
    </button>
  );
}

/** Clase base de inputs del formulario */
export const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 " +
  "outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";