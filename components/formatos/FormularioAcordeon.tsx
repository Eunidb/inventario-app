/**
 * @file components/formatos/FormularioAcordeon.tsx
 */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { ChevronDown, ChevronUp, CheckCircle2, Camera, Upload, Loader2, Save, Trash2 } from "lucide-react";
import { FORMATO_CONFIG, CAMPOS_FORMULARIO, type RegistroFormato } from "./types";

interface FormularioAcordeonProps {
  formato: RegistroFormato;
  abierto: boolean;
  onToggle: () => void;
  onSaved: () => void;
}

export default function FormularioAcordeon({ formato, abierto, onToggle, onSaved }: FormularioAcordeonProps) {
  const cfg = FORMATO_CONFIG[formato.tipo];
  const campos = CAMPOS_FORMULARIO[formato.tipo] ?? [];
  const Icon = cfg?.Icon;

  const [datos, setDatos] = useState<Record<string, any>>(formato.datos_json ?? {});
  const [imageUrl, setImageUrl] = useState<string>(formato.imagen_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${formato.tipo}-${formato.id}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("formatos").upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("formatos").getPublicUrl(fileName);
      setImageUrl(publicUrl);
    } else {
      alert("Error: " + error.message);
    }
    setUploading(false);
  };

  const handleGuardar = async () => {
    // Validación estricta en base al mapa de configuración de campos
    const faltantes = campos.filter(c => c.requerido && !datos[c.key]?.toString().trim());
    if (faltantes.length > 0) {
      alert(`Por favor, complete: ${faltantes.map(f => f.label).join(", ")}`);
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

    if (!error) onSaved();
    else alert("Error de guardado: " + error.message);
    setSaving(false);
  };

  const updateField = (key: string, val: any) => {
    setDatos(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="border border-slate-200/70 rounded-xl overflow-hidden bg-white shadow-2xs">
      
      {/* Botón de Activación */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors active:bg-slate-50 select-none
          ${abierto ? "bg-slate-50/50 border-b border-slate-100" : "hover:bg-slate-50/40"}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${cfg?.bg} ${cfg?.border} ${cfg?.color}`}>
          {Icon && <Icon size={15} />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-slate-700 truncate">{cfg?.label}</h4>
          <p className="text-[10px] text-slate-400 font-medium">
            {formato.completado ? "✓ Diligenciado" : "Falta información"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {formato.completado && <CheckCircle2 size={14} className="text-emerald-500" />}
          {imageUrl && <Camera size={13} className="text-blue-500" />}
          <div className="p-1 text-slate-400">{abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
        </div>
      </button>

      {/* Contenedor del Cuerpo */}
      {abierto && (
        <div className="p-3.5 sm:p-4 bg-linear-to-b from-slate-50/30 to-white space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campos.map((campo) => (
              <div key={campo.key} className={campo.tipo === "textarea" || campo.tipo === "checkboxes" ? "sm:col-span-2" : ""}>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {campo.label} {campo.requerido && "*"}
                </label>

                {campo.tipo === "textarea" && (
                  <textarea
                    value={datos[campo.key] ?? ""}
                    rows={2}
                    onChange={e => updateField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs sm:text-sm text-slate-700 outline-hidden focus:border-blue-500 transition-all"
                  />
                )}

                {campo.tipo === "select" && (
                  <select
                    value={datos[campo.key] ?? ""}
                    onChange={e => updateField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs sm:text-sm text-slate-700 outline-hidden focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Seleccione...</option>
                    {campo.opciones?.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                )}

                {campo.tipo === "checkboxes" && (
                  <div className="flex flex-wrap gap-1.5">
                    {campo.opciones?.map(op => {
                      const list: string[] = datos[campo.key] ?? [];
                      const active = list.includes(op);
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => updateField(campo.key, active ? list.filter(x => x !== op) : [...list, op])}
                          className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all active:scale-95
                            ${active ? "bg-blue-600 border-blue-600 text-white shadow-2xs" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                        >
                          {op}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(campo.tipo === "text" || campo.tipo === "date") && (
                  <input
                    type={campo.tipo}
                    value={datos[campo.key] ?? ""}
                    onChange={e => updateField(campo.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs sm:text-sm text-slate-700 outline-hidden focus:border-blue-500 transition-all"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Adjuntar Archivos / Fotos */}
          <div className="border-t border-slate-100 pt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : <Camera size={16} className="text-slate-300" />}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <label className={`px-3 py-1.5 rounded-lg border text-xs font-bold shadow-2xs cursor-pointer select-none transition-all active:scale-95
                ${uploading ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>
                {uploading ? "Subiendo..." : "Subir Documento / Firma"}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl("")} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="border-t border-slate-100 pt-3 flex justify-end">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-2xs active:scale-95"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Guardar Módulo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}