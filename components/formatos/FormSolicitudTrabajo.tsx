/**
 * @file components/formatos/FormSolicitudTrabajo.tsx
 * @description Digitalización del formato físico "Solicitud de Trabajo"
 *   (Formato 3 / Folio 2813).
 *
 * Campos del formato original:
 *   - Área que solicita
 *   - Fecha
 *   - Descripción del trabajo solicitado
 *   - Material para el trabajo
 *   - Vo.Bo. (nombre de quien da visto bueno)
 *   - Autorizó (nombre del autorizador)
 *   - Foto del formato físico firmado (evidencia)
 *
 * ¿Cómo guarda?
 *   Los campos se almacenan en `registros_formato.datos_json`.
 *   La foto se sube a Supabase Storage (bucket "formatos") y su URL
 *   queda en `registros_formato.imagen_url`.
 *   Al guardar se marca `completado = true` y se registra `fecha_llenado`.
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import {
  Save, Loader2, Camera, CheckCircle2, ClipboardList, Trash2,
} from "lucide-react";

export default function FormSolicitudTrabajo({ registro, trabajoId, onSaved }: FormProps) {
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

  // Carga los datos previamente guardados en datos_json
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

  // ── Sube foto del formato físico al bucket "formatos" ─────────────────────
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

  // ── Elimina la imagen actual ──────────────────────────────────────────────
  const eliminarFoto = () => setImagenUrl(null);

  // ── Guarda el formulario ──────────────────────────────────────────────────
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
    <div className="space-y-6">
      {/* ── Cabecera del formulario ─────────────────────────────────────── */}
      <FormHeader
        titulo="Solicitud de Trabajo"
        subtitulo="Formato 3 · Departamento de Mantenimiento"
        Icon={ClipboardList}
        color="blue"
        completado={registro?.completado}
      />

      {/* ── Datos de la solicitud ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Área que solicita">
          <input value={area} onChange={e => setArea(e.target.value)}
            placeholder="Ej. Producción" className={inputCls} />
        </Field>
        <Field label="Fecha">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="Descripción del trabajo solicitado">
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
          rows={4} placeholder="Describa detalladamente el trabajo requerido..."
          className={`${inputCls} resize-none`} />
      </Field>

      <Field label="Material para el trabajo">
        <textarea value={material} onChange={e => setMaterial(e.target.value)}
          rows={3} placeholder="Materiales, refacciones o insumos necesarios..."
          className={`${inputCls} resize-none`} />
      </Field>

      {/* ── Autorizaciones ────────────────────────────────────────────────── */}
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

      {/* ── Foto del formato físico firmado ───────────────────────────────── */}
      <FotoFormato
        imagenUrl={imagenUrl}
        uploading={uploading}
        onUpload={uploadFoto}
        onDelete={eliminarFoto}
      />

      {/* ── Botón guardar ─────────────────────────────────────────────────── */}
      <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} />
    </div>
  );
}

// ─── Componentes auxiliares compartidos ─────────────────────────────────────
// Se definen aquí para no crear un archivo extra; también se usan en los demás Form*.

/** Cabecera visual del formulario */
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
      <div className={`p-3 ${colorMap[color] ?? "bg-slate-600"} rounded-2xl text-white flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-black text-slate-800">{titulo}</h3>
          {completado && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
              <CheckCircle2 size={10} /> Completado
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{subtitulo}</p>
      </div>
    </div>
  );
}

/** Campo con label */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Sección de carga y previsualización de foto del formato físico */
export function FotoFormato({ imagenUrl, uploading, onUpload, onDelete }: {
  imagenUrl: string | null;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        Evidencia: foto del formato físico firmado
      </p>
      {imagenUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <img src={imagenUrl} alt="Formato firmado" className="w-full object-contain max-h-64" />
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            title="Eliminar foto"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-all">
          {uploading
            ? <Loader2 size={24} className="animate-spin text-blue-500" />
            : <Camera size={24} className="text-slate-300" />
          }
          <span className="text-sm font-semibold text-slate-400">
            {uploading ? "Subiendo imagen..." : "Toca para adjuntar foto del formato"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

/** Botón de guardar reutilizable */
export function SaveButton({ loading, onSave, completado }: {
  loading: boolean; onSave: () => void; completado?: boolean;
}) {
  return (
    <div className="flex justify-end pt-2 border-t border-slate-100">
      <button
        onClick={onSave}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                   px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-200
                   disabled:opacity-60 transition-all active:scale-95"
      >
        {loading
          ? <Loader2 size={16} className="animate-spin" />
          : completado ? <CheckCircle2 size={16} /> : <Save size={16} />
        }
        {loading ? "Guardando..." : completado ? "Actualizar Formulario" : "Guardar Formulario"}
      </button>
    </div>
  );
}

// ─── Clase base de inputs ────────────────────────────────────────────────────
export const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm " +
  "text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";
