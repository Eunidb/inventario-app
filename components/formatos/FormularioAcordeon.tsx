/**
 * @file components/formatos/FormularioAcordeon.tsx
 * @description Componente acordeón optimizado y 100% responsive para formularios en expedientes.
 */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Camera,
  Upload,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { FORMATO_CONFIG, CAMPOS_FORMULARIO, type TipoFormato } from "./types";

interface FormularioAcordeonProps {
  formato: {
    id: number;
    tipo: TipoFormato;
    datos_json: Record<string, any>;
    imagen_url: string | null;
    completado: boolean;
    fecha_llenado: string | null;
  };
  abierto: boolean;
  onToggle: () => void;
  onSaved: () => void;
}

export default function FormularioAcordeon({
  formato,
  abierto,
  onToggle,
  onSaved,
}: FormularioAcordeonProps) {
  const cfg = FORMATO_CONFIG[formato.tipo];
  const campos = CAMPOS_FORMULARIO[formato.tipo] ?? [];
  const Icon = cfg?.Icon;

  // ── Estado local del formulario ───────────────────────────────────────────
  const [datos, setDatos] = useState<Record<string, any>>(formato.datos_json ?? {});
  const [imageUrl, setImageUrl] = useState<string>(formato.imagen_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Subir foto del formato físico firmado ─────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${formato.tipo}-${formato.id}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("formatos")
      .upload(fileName, file);
      
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("formatos").getPublicUrl(fileName);
      setImageUrl(publicUrl);
    } else {
      alert("Error al subir la imagen: " + error.message);
    }
    setUploading(false);
  };

  // ── Guardar el formulario ─────────────────────────────────────────────────
  const handleGuardar = async () => {
    const faltantes = campos.filter(
      (c) => c.requerido && !datos[c.key]?.toString().trim(),
    );
    if (faltantes.length > 0) {
      alert(`Completa los campos requeridos: ${faltantes.map((f) => f.label).join(", ")}`);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("registros_formato")
      .update({
        datos_json: datos,
        imagen_url: imageUrl || null,
        completado: true,
        completado_por: user?.id ?? null,
        fecha_llenado: new Date().toISOString(),
      })
      .eq("id", formato.id);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      onSaved();
    }
    setSaving(false);
  };

  const setField = (key: string, value: any) =>
    setDatos((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-200">
      
      {/* ── Cabecera del acordeón ── */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-4 text-left transition-colors active:bg-slate-100 select-none
                    ${abierto ? "bg-slate-50/80 border-b border-slate-100" : "hover:bg-slate-50"}`}
      >
        {/* Ícono del tipo de formulario */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg?.bg} ${cfg?.border} border shadow-sm`}>
          {Icon && <Icon size={16} className={cfg?.color} />}
        </div>

        {/* Nombre y estado */}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
            {cfg?.label}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {formato.completado && formato.fecha_llenado
              ? `Completado · ${new Date(formato.fecha_llenado).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`
              : "Pendiente de llenar"}
          </p>
        </div>

        {/* Indicadores visuales agrupados */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-1">
          {formato.completado && <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />}
          {imageUrl && <Camera size={14} className="text-blue-500 flex-shrink-0" />}
          <div className="p-1 rounded-lg bg-slate-100/50 text-slate-400">
            {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      {/* ── Contenido expandible ── */}
      {abierto && (
        <div className="px-3 sm:px-5 pb-5 space-y-5 bg-slate-50/30 animate-fade-in">
          
          {/* Grid de Campos Dinámicos */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {campos.map((campo) => (
              <div
                key={campo.key}
                className={campo.tipo === "textarea" || campo.tipo === "checkboxes" ? "sm:col-span-2" : ""}
              >
                {/* Etiqueta del campo */}
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {campo.label} {campo.requerido && <span className="text-red-400 ml-0.5">*</span>}
                </label>

                {/* Tipo: Textarea */}
                {campo.tipo === "textarea" && (
                  <textarea
                    value={datos[campo.key] ?? ""}
                    rows={3}
                    onChange={(e) => setField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                )}

                {/* Tipo: Select */}
                {campo.tipo === "select" && (
                  <select
                    value={datos[campo.key] ?? ""}
                    onChange={(e) => setField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer"
                  >
                    <option value="">Seleccionar...</option>
                    {campo.opciones?.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                )}

                {/* Tipo: Checkboxes múltiples */}
                {campo.tipo === "checkboxes" && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {campo.opciones?.map((op) => {
                      const arr: string[] = datos[campo.key] ?? [];
                      const marcado: boolean = arr.includes(op);
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => {
                            setField(
                              campo.key,
                              marcado ? arr.filter((x) => x !== op) : [...arr, op],
                            );
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left text-xs font-bold transition-all active:scale-95
                                      ${marcado ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border ${marcado ? "bg-white border-white text-blue-600" : "border-slate-300 bg-slate-50"}`}>
                            {marcado && (
                              <svg width="8" height="8" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="truncate max-w-[180px] xs:max-w-none">{op}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tipo: Inputs estándares (text, date) */}
                {(campo.tipo === "text" || campo.tipo === "date") && (
                  <input
                    type={campo.tipo}
                    value={datos[campo.key] ?? ""}
                    onChange={(e) => setField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 sm:py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Sección: Evidencia Fotográfica / Adjunto ── */}
          <div className="border-t border-slate-100 pt-4.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
              Foto del Formato Físico Firmado
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3.5">
              {/* Miniatura / Placeholder */}
              <div className="w-full sm:w-20 h-28 sm:h-20 rounded-xl bg-white border border-dashed border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center bg-slate-50/50 shadow-inner">
                {imageUrl ? (
                  <img src={imageUrl} alt="Evidencia digital" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={20} className="text-slate-300" />
                )}
              </div>

              {/* Textos y Acciones de Archivo */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <p className="text-[11px] sm:text-xs text-slate-400 mb-2.5 leading-normal">
                  Respaldo con firmas. Acepta imágenes (JPG, PNG) o archivos PDF.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón estructural de Carga */}
                  <label
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm
                                ${uploading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-800 hover:bg-slate-700 text-white"}`}
                  >
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    <span>{uploading ? "Subiendo..." : imageUrl ? "Cambiar archivo" : "Adjuntar foto"}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </label>

                  {/* Acciones adicionales si ya existe una URL */}
                  {imageUrl && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start mt-1 sm:mt-0">
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-[11px] text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-colors"
                      >
                        Ver archivo →
                      </a>
                      <button
                        onClick={() => setImageUrl("")}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar adjunto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Botón de Guardado o Acción final ── */}
          <div className="flex justify-end pt-1 border-t border-slate-100/60">
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                         px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-100 disabled:opacity-60 transition-all active:scale-[0.98]"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>
                {saving
                  ? "Guardando..."
                  : formato.completado
                    ? "Actualizar Formulario"
                    : "Marcar como Completado"}
              </span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}