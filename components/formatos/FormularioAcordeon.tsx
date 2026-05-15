/**
 * @file components/formatos/FormularioAcordeon.tsx
 * @description Componente acordeón para un formulario individual dentro de un expediente.
 *
 * Cada instancia de este componente representa un registro_formato de la BD.
 * Al expandirse muestra los campos específicos del tipo de formulario físico,
 * la sección para adjuntar la foto del formato físico firmado, y el botón de guardado.
 *
 * FUNCIONALIDAD:
 *   - Carga los datos_json del formato (campos ya llenados previamente).
 *   - Renderiza campos de tipo: text, textarea, date, select y checkboxes.
 *   - Sube la imagen al bucket "formatos" de Supabase Storage.
 *   - Al guardar marca el formulario como `completado = true` en la BD.
 *
 * RESPONSIVE:
 *   - Los campos se distribuyen en 1 columna en mobile y 2 en sm+.
 *   - Los checkboxes se adaptan en wrap para pantallas pequeñas.
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
} from "lucide-react";
import { FORMATO_CONFIG, CAMPOS_FORMULARIO, type TipoFormato } from "./types";

// ─── Props del componente ────────────────────────────────────────────────────
interface FormularioAcordeonProps {
  /** Registro de la tabla registros_formato */
  formato: {
    id: number;
    tipo: TipoFormato;
    datos_json: Record<string, any>;
    imagen_url: string | null;
    completado: boolean;
    fecha_llenado: string | null;
  };
  /** Si el acordeón está expandido */
  abierto: boolean;
  /** Callback para expandir o contraer */
  onToggle: () => void;
  /** Callback llamado tras guardar exitosamente para recargar la lista */
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
  // Se inicializa con los datos ya guardados en la BD para permitir edición posterior.
  const [datos, setDatos] = useState<Record<string, any>>(
    formato.datos_json ?? {},
  );
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
    // Nombre único usando tipo + id + timestamp para evitar colisiones en Storage
    const fileName = `${formato.tipo}-${formato.id}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("formatos")
      .upload(fileName, file);
    if (!error) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("formatos").getPublicUrl(fileName);
      setImageUrl(publicUrl);
    } else {
      alert("Error al subir la imagen: " + error.message);
    }
    setUploading(false);
  };

  // ── Guardar el formulario ─────────────────────────────────────────────────
  const handleGuardar = async () => {
    // Validar solo los campos marcados como requeridos
    const faltantes = campos.filter(
      (c) => c.requerido && !datos[c.key]?.toString().trim(),
    );
    if (faltantes.length > 0) {
      alert(
        `Completa los campos requeridos: ${faltantes.map((f) => f.label).join(", ")}`,
      );
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  // ── Helper: actualizar un campo del objeto datos ──────────────────────────
  const setField = (key: string, value: any) =>
    setDatos((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      {/* ── Cabecera del acordeón (siempre visible) ── */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 text-left
                    transition-colors hover:bg-slate-50
                    ${abierto ? "bg-slate-50" : ""}`}
      >
        {/* Ícono del tipo de formulario */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${cfg?.bg} ${cfg?.border} border`}
        >
          {Icon && <Icon size={16} className={cfg?.color} />}
        </div>

        {/* Nombre y estado del formulario */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {cfg?.label}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {formato.completado && formato.fecha_llenado
              ? `Completado · ${new Date(formato.fecha_llenado).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}`
              : "Pendiente de llenar"}
          </p>
        </div>

        {/* Indicadores: completado y/o tiene imagen */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {formato.completado && (
            <CheckCircle2 size={15} className="text-emerald-500" />
          )}

          {formato.imagen_url && (
            <span title="Tiene imagen adjunta">
              <Camera size={13} className="text-blue-400" />
            </span>
          )}

          {abierto ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* ── Contenido expandible ── */}
      {abierto && (
        <div className="px-4 sm:px-6 pb-6 space-y-5 bg-slate-50/50 border-t border-slate-100">
          {/* ── Campos dinámicos del formulario ── */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campos.map((campo) => (
              <div
                key={campo.key}
                className={
                  campo.tipo === "textarea" || campo.tipo === "checkboxes"
                    ? "sm:col-span-2"
                    : ""
                }
              >
                {/* Etiqueta del campo */}
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {campo.label}
                  {campo.requerido && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>

                {/* ── Área de texto ── */}
                {campo.tipo === "textarea" && (
                  <textarea
                    value={datos[campo.key] ?? ""}
                    rows={3}
                    onChange={(e) => setField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5
                               text-sm text-slate-700 outline-none resize-none
                               focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                )}

                {/* ── Selector ── */}
                {campo.tipo === "select" && (
                  <select
                    value={datos[campo.key] ?? ""}
                    onChange={(e) => setField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5
                               text-sm text-slate-700 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {campo.opciones?.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                )}

                {/*
                 * ── Checkboxes múltiples ──
                 * Replica exactamente las casillas del formato físico de papel.
                 * Los valores seleccionados se guardan como array en datos_json.
                 */}
                {campo.tipo === "checkboxes" && (
                  <div className="flex flex-wrap gap-2">
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
                              marcado
                                ? arr.filter((x) => x !== op)
                                : [...arr, op],
                            );
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border
                                      text-xs font-bold transition-all
                                      ${
                                        marcado
                                          ? "bg-blue-600 border-blue-600 text-white"
                                          : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                                      }`}
                        >
                          {/* Caja visual del checkbox */}
                          <div
                            className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center
                              ${marcado ? "bg-white border-white" : "border-slate-300"}`}
                          >
                            {marcado && (
                              <svg
                                width="8"
                                height="8"
                                fill="none"
                                viewBox="0 0 12 12"
                              >
                                <path
                                  d="M2 6l3 3 5-5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          {op}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── Input texto, fecha o número ── */}
                {(campo.tipo === "text" || campo.tipo === "date") && (
                  <input
                    type={campo.tipo}
                    value={datos[campo.key] ?? ""}
                    onChange={(e) => setField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5
                               text-sm text-slate-700 outline-none
                               focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Sección: Adjuntar foto del formato físico firmado ── */}
          <div className="border-t border-slate-200 pt-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Foto del Formato Físico Firmado (Evidencia)
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/*
               * Miniatura de la imagen adjunta.
               * Si no hay imagen muestra el ícono de cámara como placeholder.
               */}
              <div
                className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl bg-white border-2 border-dashed
                              border-slate-200 flex-shrink-0 overflow-hidden
                              flex items-center justify-center"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Formato físico adjunto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera size={24} className="text-slate-300" />
                )}
              </div>

              {/* Controles de carga y acceso */}
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Adjunta la foto o escaneo del formato físico con firmas como
                  respaldo digital. Acepta imágenes JPG, PNG o PDF.
                </p>

                {/* Botón de carga de archivo (label actúa como botón del input oculto) */}
                <label
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                   text-xs font-bold cursor-pointer transition-all
                                   ${
                                     uploading
                                       ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                       : "bg-slate-800 hover:bg-slate-700 text-white"
                                   }`}
                >
                  {uploading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  {uploading
                    ? "Subiendo..."
                    : imageUrl
                      ? "Cambiar foto"
                      : "Adjuntar foto"}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>

                {/* Enlace para ver el adjunto en pestaña nueva */}
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-500 hover:underline font-bold"
                    >
                      Ver adjunto completo →
                    </a>
                    <button
                      onClick={() => setImageUrl("")}
                      className="text-[11px] text-red-400 hover:text-red-600 font-bold"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Botón de guardado ── */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                         px-5 py-2.5 rounded-xl font-bold text-sm
                         shadow-md shadow-blue-200 disabled:opacity-60 transition-all"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving
                ? "Guardando..."
                : formato.completado
                  ? "Actualizar Formulario"
                  : "Marcar como Completado"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
