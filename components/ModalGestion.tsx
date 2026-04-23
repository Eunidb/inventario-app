/**
 * @file ModalGestion.tsx
 * @description Modal completo con todos los campos del inventario.
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import {
  X,
  Package,
  Tag,
  Hash,
  MapPin,
  BarChart3,
  Image as ImageIcon,
  Loader2,
  Info,
  Layers,
  Home,
  Ruler,
} from "lucide-react";

import type {
  InventarioItem,
  Categoria,
  Departamento,
  EstadoInventarioEnum,
} from "@/lib/supabase";

const supabase = createClient();

interface ModalGestionProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventarioItem | null;
  onSaved: () => void;
}

const FORM_INITIAL = {
  clave: "",
  nombre: "",
  descripcion: "",
  marca: "",
  modelo: "",
  numero_serie: "",
  stock_total: 0,
  stock_disponible: 0,
  stock_minimo: 1,
  unidad_medida: "pieza",
  ubicacion: "",
  estado: "activo" as EstadoInventarioEnum,
  imagen_url: "",
  categoria_id: 0,
  departamento_id: undefined as number | undefined,
};

export default function ModalGestion({
  isOpen,
  onClose,
  item,
  onSaved,
}: ModalGestionProps) {
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
    if (item) {
      setForm({
        clave: item.clave,
        nombre: item.nombre,
        descripcion: item.descripcion ?? "",
        marca: item.marca ?? "",
        modelo: item.modelo ?? "",
        numero_serie: item.numero_serie ?? "",
        stock_total: item.stock_total,
        stock_disponible: item.stock_disponible,
        stock_minimo: item.stock_minimo,
        unidad_medida: item.unidad_medida ?? "pieza",
        ubicacion: item.ubicacion ?? "",
        estado: item.estado,
        imagen_url: item.imagen_url ?? "",
        categoria_id: item.categoria_id,
        departamento_id: item.departamento_id,
      });
      setImagePreview(item.imagen_url ?? null);
    } else {
      setForm(FORM_INITIAL);
      setImagePreview(null);
    }
    setError(null);
  }, [item, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (!form.clave.trim() || !form.nombre.trim())
        throw new Error("Clave y nombre son obligatorios.");
      if (!form.categoria_id) throw new Error("Selecciona una categoría.");

      let imagenUrl = form.imagen_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("inventario")
          .upload(fileName, imageFile);
        if (!uploadError) {
          const { data } = supabase.storage
            .from("inventario")
            .getPublicUrl(fileName);
          imagenUrl = data.publicUrl;
        }
      }

      const payload = { ...form, imagen_url: imagenUrl };
      const { error: dbError } = item
        ? await supabase
            .from("inventario")
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq("id", item.id)
        : await supabase.from("inventario").insert(payload);

      if (dbError) throw dbError;
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {item ? "Editar Artículo" : "Nuevo Artículo"}
              </h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                GESTIÓN DE INVENTARIO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-white"
        >
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-center gap-2">
              <Info size={16} /> {error}
            </div>
          )}

          {/* Fila 1: Clave y Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Hash size={14} className="text-slate-400" /> Clave *
              </label>
              <input
                name="clave"
                value={form.clave}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ej: HERR-001"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Tag size={14} className="text-slate-400" /> Nombre *
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nombre del producto"
              />
            </div>
          </div>

          {/* Fila 2: Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Detalles técnicos o notas..."
            />
          </div>

          {/* Fila 3: Marca, Modelo, Serie */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-600">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Marca
              </label>
              <input
                name="marca"
                value={form.marca}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Modelo
              </label>
              <input
                name="modelo"
                value={form.modelo}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                N° Serie
              </label>
              <input
                name="numero_serie"
                value={form.numero_serie}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Fila 4: Stocks (Panel destacado) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Stock Total
              </label>
              <input
                type="number"
                name="stock_total"
                value={form.stock_total}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Disponible
              </label>
              <input
                type="number"
                name="stock_disponible"
                value={form.stock_disponible}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Mínimo
              </label>
              <input
                type="number"
                name="stock_minimo"
                value={form.stock_minimo}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Fila 5: Unidad Medida, Ubicación y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Ruler size={14} className="text-slate-400" /> Unidad
              </label>
              <input
                name="unidad_medida"
                value={form.unidad_medida}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: pieza"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" /> Ubicación
              </label>
              <input
                name="ubicacion"
                value={form.ubicacion}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Estante B-12"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <BarChart3 size={14} className="text-slate-400" /> Estado
              </label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="en_reparacion">Reparación</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="dado_de_baja">Dar de baja</option>
              </select>
            </div>
          </div>

          {/* Fila 6: Categoría y Departamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Layers size={14} className="text-slate-400" /> Categoría *
              </label>
              <select
                name="categoria_id"
                value={form.categoria_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0} disabled>
                  Seleccionar...
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Home size={14} className="text-slate-400" /> Departamento
              </label>
              <select
                name="departamento_id"
                value={form.departamento_id ?? ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sección: Imagen */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Imagen del artículo
            </label>
            <div className="flex items-center gap-5 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
              <div className="w-24 h-24 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={32} className="text-slate-200" />
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                  Subir Foto{" "}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-[10px] text-slate-400 font-medium">
                  Recomendado: 800x800px (Máx 5MB)
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {item ? "Guardar Cambios" : "Registrar Artículo"}
          </button>
        </div>
      </div>
    </div>
  );
}
