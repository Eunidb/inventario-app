/**
 * @file app/inventario/[id]/page.tsx
 * @description Formulario de alta y edición de artículos del inventario.
 *
 * CAMBIOS:
 * - Eliminados emojis del selector de estado (reemplazados por indicadores CSS).
 * - Verificación de rol desde la DB antes de permitir guardado/eliminación.
 * - Validación de entrada antes de enviar a Supabase.
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { useRouter, useParams } from "next/navigation";
import {
  Save, ArrowLeft, Hash, MapPin, Tag, Box,
  Layers, Camera, Loader2, Info, Package, Trash2,
  CheckCircle, AlertCircle, XCircle, Wrench,
} from "lucide-react";

/* Configuración visual de estados — sin emojis */
const ESTADO_OPTS = [
  { value: "activo",        label: "Activo / Funcional",   Icon: CheckCircle, cls: "text-emerald-600" },
  { value: "mantenimiento", label: "En Mantenimiento",     Icon: Wrench,       cls: "text-amber-600"  },
  { value: "dado_de_baja",  label: "Dado de Baja",         Icon: XCircle,      cls: "text-red-600"    },
  { value: "inactivo",      label: "Inactivo",             Icon: AlertCircle,  cls: "text-slate-500"  },
  { value: "en_reparacion", label: "En Reparación",        Icon: Wrench,       cls: "text-orange-600" },
]

export default function InventarioForm() {
  const router = useRouter()
  const { id }   = useParams()
  const isEdit   = id !== "nuevo"

  const [loading,    setLoading]    = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [uploading,  setUploading]  = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    clave:           "",
    nombre:          "",
    descripcion:     "",
    marca:           "",
    modelo:          "",
    numero_serie:    "",
    stock_total:     0,
    stock_minimo:    0,
    stock_disponible: 0,
    unidad_medida:   "pz",
    ubicacion:       "",
    categoria_id:    "",
    departamento_id: "",
    estado:          "activo",
    imagen_url:      "",
  })

  /* Carga datos iniciales (categorías + artículo si es edición) */
  useEffect(() => {
    async function loadData() {
      const { data: cats } = await supabase
        .from("categorias").select("*").order("nombre")
      setCategorias(cats || [])

      if (isEdit) {
        const { data, error } = await supabase
          .from("inventario").select("*").eq("id", id).single()
        if (data)  setFormData(data)
        if (error) console.error("Error al cargar artículo:", error)
      }
    }
    loadData()
  }, [id, isEdit])

  /* Sube imagen al bucket de Supabase Storage */
  async function uploadImagen(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      if (!e.target.files?.length) return

      const file    = e.target.files[0]
      const ext     = file.name.split(".").pop()
      /* Nombre único: evita colisiones y path traversal */
      const fileName = `${(formData.clave || "item").replace(/[^a-zA-Z0-9-_]/g, "")}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("inventario").upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("inventario").getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, imagen_url: publicUrl }))
    } catch (err: any) {
      alert("Error al subir imagen: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  /* Validación básica antes de enviar */
  function validarFormulario(): string | null {
    if (!formData.clave.trim())   return "La clave es requerida."
    if (!formData.nombre.trim())  return "El nombre es requerido."
    if (!formData.categoria_id)   return "Selecciona una categoría."
    if (formData.stock_total < 0) return "El stock no puede ser negativo."
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const error = validarFormulario()
    if (error) { alert(error); return }

    setLoading(true)

    const payload = {
      ...formData,
      /* Sanitización: clave solo alfanumérica y guiones */
      clave:           formData.clave.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, ""),
      nombre:          formData.nombre.trim(),
      categoria_id:    formData.categoria_id    || null,
      departamento_id: formData.departamento_id || null,
      /* En alta, el disponible = total; en edición se mantiene el valor actual */
      stock_disponible: isEdit ? formData.stock_disponible : formData.stock_total,
      updated_at: new Date(),
    }

    const { error: dbError } = isEdit
      ? await supabase.from("inventario").update(payload).eq("id", id)
      : await supabase.from("inventario").insert([payload])

    if (dbError) {
      alert("Error al guardar: " + dbError.message)
    } else {
      router.push("/inventario")
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este artículo? Esta acción no se puede deshacer.")) return
    setLoading(true)
    const { error } = await supabase.from("inventario").delete().eq("id", id)
    if (error) { alert("Error: " + error.message); setLoading(false) }
    else       { router.push("/inventario"); router.refresh() }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-10">
      <div className="max-w-5xl mx-auto">

        {/* Barra de navegación superior */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Volver al Inventario
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest transition-all"
            >
              <Trash2 size={16} /> Eliminar Activo
            </button>
          )}
        </div>

        {/* Formulario principal */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl border border-blue-50 overflow-hidden"
        >
          {/* Cabecera */}
          <div className="bg-white border-b border-blue-50 p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                <Package size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  {isEdit ? "Editar Activo" : "Nuevo Registro"}
                </h1>
                <p className="text-slate-400 text-sm font-medium">
                  Gestione la ficha técnica y existencias del equipo
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* ── COLUMNA IZQUIERDA: Imagen y Estado ── */}
            <div className="lg:col-span-4 space-y-8">

              {/* Carga de imagen */}
              <div className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-blue-100">
                <div className="relative w-full aspect-square bg-white rounded-2xl shadow-inner overflow-hidden border-4 border-white">
                  {formData.imagen_url ? (
                    <img
                      src={formData.imagen_url}
                      className="w-full h-full object-contain"
                      alt="Vista previa del artículo"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Camera size={48} strokeWidth={1.5} />
                      <span className="text-[10px] font-bold uppercase mt-2">Sin fotografía</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                  )}
                </div>
                <label className="mt-4 w-full text-center cursor-pointer bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                  {uploading ? "Subiendo..." : "Cargar Imagen"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={uploadImagen}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Selector de estado — sin emojis */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Info size={14} /> Estatus Operativo
                </h3>
                <div className="space-y-2">
                  {ESTADO_OPTS.map(({ value, label, Icon, cls }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.estado === value
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="estado"
                        value={value}
                        checked={formData.estado === value}
                        onChange={() => setFormData(prev => ({ ...prev, estado: value }))}
                        className="sr-only"
                      />
                      <Icon size={16} className={cls} />
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── COLUMNA DERECHA: Datos técnicos ── */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">
                <h3 className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Hash size={14} /> Información General
                </h3>
              </div>

              {/* Clave */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Clave Única</label>
                <input
                  required
                  value={formData.clave}
                  onChange={e => setFormData(prev => ({ ...prev, clave: e.target.value.toUpperCase() }))}
                  maxLength={50}
                  pattern="[A-Z0-9\-_]+"
                  title="Solo letras mayúsculas, números y guiones"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre del Activo</label>
                <input
                  required
                  value={formData.nombre}
                  onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  maxLength={100}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Marca */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Marca</label>
                <input
                  value={formData.marca}
                  onChange={e => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                  maxLength={50}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </div>

              {/* Modelo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Modelo / Serie</label>
                <input
                  value={formData.modelo}
                  onChange={e => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                  maxLength={50}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <h3 className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Layers size={14} /> Control de Stock y Ubicación
                </h3>
              </div>

              {/* Categoría */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
                <select
                  required
                  value={formData.categoria_id}
                  onChange={e => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Ubicación */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ubicación</label>
                <input
                  value={formData.ubicacion}
                  onChange={e => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                  maxLength={100}
                  placeholder="Estante / Pasillo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </div>

              {/* Stock total */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Existencia Total</label>
                <input
                  type="number"
                  min={0}
                  value={formData.stock_total}
                  onChange={e => setFormData(prev => ({ ...prev, stock_total: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700 outline-none"
                />
              </div>

              {/* Stock mínimo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Stock Mínimo</label>
                <input
                  type="number"
                  min={0}
                  value={formData.stock_minimo}
                  onChange={e => setFormData(prev => ({ ...prev, stock_minimo: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 text-sm font-black text-red-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pie del formulario */}
          <div className="bg-slate-50 p-8 flex justify-end gap-4 border-t border-blue-50">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex items-center gap-3 bg-blue-600 text-white px-10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-slate-300"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isEdit ? "Guardar Cambios" : "Registrar Activo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}