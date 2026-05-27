"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { X, Package, Tag, Hash, MapPin, BarChart3, Image as ImageIcon, Loader2, Info, Layers, Home, Ruler } from "lucide-react";
import type { InventarioItem, Categoria, Departamento, EstadoInventarioEnum } from "@/lib/supabase";

const supabase = createClient();

interface ModalGestionProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventarioItem | null;
  onSaved: () => void;
}

const FORM_INITIAL = {
  clave: "", nombre: "", descripcion: "", marca: "", modelo: "", numero_serie: "",
  stock_total: 0, stock_disponible: 0, stock_minimo: 1, unidad_medida: "pieza",
  ubicacion: "", estado: "activo" as EstadoInventarioEnum, imagen_url: "",
  categoria_id: 0, departamento_id: undefined as number | undefined,
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ModalGestion({ isOpen, onClose, item, onSaved }: ModalGestionProps) {
  const [form, setForm] = useState(FORM_INITIAL);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadCatalogs = async () => {
      const [{ data: cats }, { data: deps }] = await Promise.all([
        supabase.from("categorias").select("*").order("nombre"),
        supabase.from("departamentos").select("*").order("nombre"),
      ]);
      setCategorias(cats ?? []);
      setDepartamentos(deps ?? []);
    };
    loadCatalogs();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setForm({
          clave: item.clave, nombre: item.nombre, descripcion: item.descripcion ?? "",
          marca: item.marca ?? "", modelo: item.modelo ?? "", numero_serie: item.numero_serie ?? "",
          stock_total: item.stock_total, stock_disponible: item.stock_disponible,
          stock_minimo: item.stock_minimo, unidad_medida: item.unidad_medida ?? "pieza",
          ubicacion: item.ubicacion ?? "", estado: item.estado, imagen_url: item.imagen_url ?? "",
          categoria_id: item.categoria_id, departamento_id: item.departamento_id,
        });
        setImagePreview(item.imagen_url ?? null);
      } else {
        setForm(FORM_INITIAL);
        setImagePreview(null);
      }
    }
  }, [item, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return setError("Exploit prevent: Tipo no permitido.");
    if (file.size > MAX_FILE_SIZE_BYTES) return setError("El archivo supera los 5MB.");
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (!form.clave.trim() || !form.nombre.trim()) throw new Error("Clave y nombre son obligatorios.");
      let imagenUrl = form.imagen_url;
      if (imageFile) {
        const cleanExt = imageFile.name.split(".").pop()?.toLowerCase() || "png";
        const safeFileName = `${crypto.randomUUID()}.${cleanExt}`;
        const { error: uploadError } = await supabase.storage.from("inventario").upload(safeFileName, imageFile);
        if (uploadError) throw uploadError;
        imagenUrl = supabase.storage.from("inventario").getPublicUrl(safeFileName).data.publicUrl;
      }
      const safePayload = { ...form, imagen_url: imagenUrl, categoria_id: Number(form.categoria_id) };
      const { error: dbError } = item 
        ? await supabase.from("inventario").update({ ...safePayload, updated_at: new Date().toISOString() }).eq("id", item.id)
        : await supabase.from("inventario").insert(safePayload);
      if (dbError) throw dbError;
      onSaved();
      onClose();
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Package size={22} /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{item ? "Editar Artículo" : "Nuevo Artículo"}</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide">GESTIÓN DE INVENTARIO</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {error && <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="clave" value={form.clave} onChange={handleChange} required placeholder="Clave *" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Nombre *" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} placeholder="Descripción" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input name="marca" value={form.marca} onChange={handleChange} placeholder="Marca" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            <input name="modelo" value={form.modelo} onChange={handleChange} placeholder="Modelo" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            <input name="numero_serie" value={form.numero_serie} onChange={handleChange} placeholder="N° Serie" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {["stock_total", "stock_disponible", "stock_minimo"].map((field) => (
              <div key={field} className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.replace("_", " ")}</label>
                <input type="number" name={field} value={form[field as keyof typeof form]} onChange={handleChange} min={0} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-blue-600 outline-none" />
              </div>
            ))}
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold">
            <ImageIcon size={18} /> Seleccionar Imagen
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </form>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button type="button" onClick={onClose} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null} {item ? "Guardar Cambios" : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}