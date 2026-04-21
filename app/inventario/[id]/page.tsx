'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { 
  Save, ArrowLeft, Hash, MapPin, Tag, Box, 
  Layers, Camera, Loader2, Info, Package, Trash2 
} from 'lucide-react'

export default function InventarioForm() {
  const router = useRouter()
  const { id } = useParams()
  const isEdit = id !== 'nuevo'

  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    clave: '',
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    stock_total: 0,
    stock_minimo: 0,
    stock_disponible: 0,
    unidad_medida: 'pz',
    ubicacion: '',
    categoria_id: '',
    departamento_id: '',
    estado: 'activo',
    imagen_url: ''
  })

  useEffect(() => {
    async function loadData() {
      const { data: cats } = await supabase.from('categorias').select('*').order('nombre', { ascending: true });
      const { data: deptos } = await supabase.from('departamentos').select('*')
      setCategorias(cats || [])
      setDepartamentos(deptos || [])

      if (isEdit) {
        const { data, error } = await supabase.from('inventario').select('*').eq('id', id).single()
        if (data) setFormData(data)
        if (error) console.error("Error al cargar item:", error)
      }
    }
    loadData()
  }, [id, isEdit])

  // --- FUNCIÓN PARA ELIMINAR ---
  async function handleDelete() {
    const confirmacion = confirm("¿Estás seguro de eliminar este artículo? Esta acción no se puede deshacer.")
    if (!confirmacion) return

    setLoading(true)
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Error al eliminar: " + error.message)
      setLoading(false)
    } else {
      router.push('/inventario')
      router.refresh()
    }
  }

  async function uploadImagen(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${formData.clave || 'item'}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('imagenes_inventario')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('imagenes_inventario')
        .getPublicUrl(fileName)

      setFormData({ ...formData, imagen_url: publicUrl })
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...formData,
      categoria_id: formData.categoria_id || null,
      departamento_id: formData.departamento_id || null,
      stock_disponible: isEdit ? formData.stock_disponible : formData.stock_total,
      updated_at: new Date()
    }

    const { error } = isEdit 
      ? await supabase.from('inventario').update(payload).eq('id', id)
      : await supabase.from('inventario').insert([payload])

    if (error) {
      alert("Error: " + error.message)
    } else {
      router.push('/inventario')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F0F5FA] p-4 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Volver al Inventario
          </button>

          {/* BOTÓN ELIMINAR (Solo en edición) */}
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

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-100 overflow-hidden">
          {/* Header del Formulario */}
          <div className="bg-white border-b border-blue-50 p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                <Package size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  {isEdit ? 'Editar Activo' : 'Nuevo Registro'}
                </h1>
                <p className="text-slate-400 text-sm font-medium">Gestione la ficha técnica y existencias del equipo</p>
              </div>
            </div>
          </div>

          {/* ... (Mismo contenido del grid que ya tenías) ... */}
          <div className="p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* COLUMNA IZQUIERDA: IMAGEN Y ESTADO */}
            <div className="lg:col-span-4 space-y-8">
              <div className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-blue-100">
                <div className="relative w-full aspect-square bg-white rounded-2xl shadow-inner overflow-hidden border-4 border-white">
                  {formData.imagen_url ? (
                    <img src={formData.imagen_url} className="w-full h-full object-contain" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Camera size={48} strokeWidth={1.5} />
                      <span className="text-[10px] font-bold uppercase mt-2">Sin Fotografía</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                  )}
                </div>
                <label className="mt-4 w-full text-center cursor-pointer bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                  {uploading ? 'Subiendo...' : 'Cargar Imagen'}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImagen} disabled={uploading} />
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Info size={14} /> Estatus Operativo
                </h3>
                <select 
                  value={formData.estado} 
                  onChange={e => setFormData({...formData, estado: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="activo">🟢 Activo / Funcional</option>
                  <option value="mantenimiento">🟡 En Mantenimiento</option>
                  <option value="dado_de_baja">🔴 Dado de Baja</option>
                </select>
              </div>
            </div>

            {/* COLUMNA DERECHA: DATOS TÉCNICOS */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Hash size={14} /> Información General
                </h3>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Clave Única</label>
                <input required value={formData.clave} onChange={e => setFormData({...formData, clave: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre del Activo</label>
                <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Marca</label>
                <input value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Modelo / Serie</label>
                <input value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none" />
              </div>

              <div className="md:col-span-2 pt-4">
                <h3 className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Layers size={14} /> Control de Stock y Ubicación
                </h3>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
                <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none">
                  <option value="">Seleccionar...</option>
                 {categorias.length > 0 ? (
    categorias.map(c => (
      <option key={c.id} value={c.id}>{c.nombre}</option>
    ))
  ) : (
    <option disabled>Cargando categorías...</option>
  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ubicación</label>
                <input value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none" placeholder="Estante/Pasillo" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Existencia Total</label>
                <input type="number" value={formData.stock_total} onChange={e => setFormData({...formData, stock_total: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Stock Mínimo</label>
                <input type="number" value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: parseInt(e.target.value) || 0})}
                  className="w-full bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 text-sm font-black text-red-600 outline-none" />
              </div>
            </div>
          </div>

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
              {isEdit ? 'Guardar Cambios' : 'Registrar Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}