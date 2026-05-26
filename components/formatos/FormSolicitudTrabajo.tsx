"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import {
  Save, Loader2, Camera, CheckCircle2, ClipboardList, Trash2, X
} from "lucide-react";

export default function FormSolicitudTrabajo({ registro, trabajoId, onSaved, onClose }: FormProps & { onClose?: () => void }) {
  const supabase = createClient();

  // ── Campos del formulario ─────────────────────────────────────────────────
  const [area, setArea] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [descripcion, setDescripcion] = useState("");
  const [material, setMaterial] = useState("");
  const [vobo, setVobo] = useState("");
  const [autorizo, setAutorizo] = useState("");

  // ── Estado de la imagen ───────────────────────────────────────────────────
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const eliminarFoto = () => setImagenUrl(null);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("registros_formato")
      .update({
        datos_json: { area, fecha, descripcion, material, vobo, autorizo },
        imagen_url: imagenUrl,
        completado: true,
        completado_por: user?.id ?? null,
        fecha_llenado: new Date().toISOString(),
      })
      .eq("id", registro.id);
    setLoading(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center p-0 sm:p-4 transition-opacity">
      
      {/* Contenedor Principal del Modal Centrado */}
      <div className="relative flex flex-col w-full max-w-2xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Indicador de arrastre (Solo Mobile) */}
        <div className="flex justify-center py-2 sm:hidden bg-slate-50 border-b border-slate-100">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* 1. Encabezado Fijo */}
        <div className="relative p-5 sm:p-6 border-b border-slate-100 bg-white z-10 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <FormHeader
              titulo="Solicitud de Trabajo"
              subtitulo="Formato 3 · Departamento de Mantenimiento · Folio 2813"
              Icon={ClipboardList}
              color="blue"
              completado={registro?.completado}
            />
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="ml-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Cuerpo con Scroll Aislado */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          
          {/* Datos de la solicitud */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Datos de la Solicitud
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Área que solicita">
                <input value={area} onChange={e => setArea(e.target.value)}
                  placeholder="Ej. Producción" className={inputCls} />
              </Field>
              <Field label="Fecha">
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Requerimientos detallados */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Especificaciones Técnicas
            </p>
            <Field label="Descripción del trabajo solicitado">
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                rows={3} placeholder="Describa detalladamente el trabajo requerido..."
                className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Material para el trabajo">
              <textarea value={material} onChange={e => setMaterial(e.target.value)}
                rows={2} placeholder="Materiales, refacciones o insumos necesarios..."
                className={`${inputCls} resize-none`} />
            </Field>
          </div>

          {/* Autorizaciones */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Validación y Firmas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Vo.Bo.">
                <input value={vobo} onChange={e => setVobo(e.target.value)}
                  placeholder="Nombre y firma de visto bueno" className={inputCls} />
              </Field>
              <Field label="Autorizó">
                <input value={autorizo} onChange={e => setAutorizo(e.target.value)}
                  placeholder="Nombre del autorizador" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Carga de Formato Físico */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <FotoFormato
              imagenUrl={imagenUrl}
              uploading={uploading}
              onUpload={uploadFoto}
              onDelete={eliminarFoto}
              color="blue"
            />
          </div>
        </div>

        {/* 3. Footer Fijo */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white z-10 flex justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="w-full sm:w-auto min-w-[150px]">
            <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} color="blue" />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Componentes auxiliares compartidos y optimizados ─────────────────────────────────────

export function FormHeader({ titulo, subtitulo, Icon, color, completado }: {
  titulo: string; subtitulo: string;
  Icon: React.FC<any>; color: string; completado?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue:   "bg-blue-600",
    purple: "bg-purple-600",
    orange: "bg-orange-600",
    teal:   "bg-teal-600",
    rose:   "bg-rose-600",
  };
  return (
    <div className="flex items-start gap-4">
      <div className={`p-3 ${colorMap[color] ?? "bg-slate-600"} rounded-2xl text-white flex-shrink-0 shadow-sm`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight truncate">{titulo}</h3>
          {completado && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
              <CheckCircle2 size={10} /> Completado
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{subtitulo}</p>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function FotoFormato({ imagenUrl, uploading, onUpload, onDelete, color = "blue" }: {
  imagenUrl: string | null;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  color?: string;
}) {
  const borderMap: Record<string, string> = {
    blue: "hover:border-blue-300 hover:bg-blue-50/20",
    purple: "hover:border-purple-300 hover:bg-purple-50/20",
    orange: "hover:border-orange-300 hover:bg-orange-50/20",
    teal: "hover:border-teal-300 hover:bg-teal-50/20",
  };
  
  const textMap: Record<string, string> = {
    blue: "text-blue-500", purple: "text-purple-500", orange: "text-orange-500", teal: "text-teal-500"
  };

  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
        Evidencia: foto del formato físico firmado
      </p>
      {imagenUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
          <img src={imagenUrl} alt="Formato firmado" className="w-full object-contain max-h-64 mx-auto" />
          <button
            type="button"
            onClick={onDelete}
            className="absolute top-3 right-3 p-2 bg-red-600/90 text-white rounded-xl hover:bg-red-700 shadow-md transition-colors backdrop-blur-sm"
            title="Eliminar foto"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer transition-all ${borderMap[color] ?? borderMap.blue}`}>
          {uploading
            ? <Loader2 size={24} className={`animate-spin ${textMap[color] ?? textMap.blue}`} />
            : <Camera size={24} className="text-slate-300" />
          }
          <span className="text-xs sm:text-sm font-semibold text-slate-400 text-center">
            {uploading ? "Subiendo archivo..." : "Toca para adjuntar foto del formato"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

export function SaveButton({ loading, onSave, completado, color = "blue" }: {
  loading: boolean; onSave: () => void; completado?: boolean; color?: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    purple: "bg-purple-600 hover:bg-purple-700 shadow-purple-200",
    orange: "bg-orange-600 hover:bg-orange-700 shadow-orange-200",
    teal: "bg-teal-600 hover:bg-teal-700 shadow-teal-200",
  };

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={onSave}
        disabled={loading}
        className={`flex items-center justify-center gap-2 text-white w-full sm:w-auto
          px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]
          disabled:opacity-60 ${bgMap[color] ?? bgMap.blue}`}
      >
        {loading
          ? <Loader2 size={16} className="animate-spin" />
          : completado ? <CheckCircle2 size={16} /> : <Save size={16} />
        }
        <span>{loading ? "Guardando..." : completado ? "Actualizar Formulario" : "Guardar Formulario"}</span>
      </button>
    </div>
  );
}

// ─── Clase base de inputs ────────────────────────────────────────────────────
export const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm " +
  "text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";