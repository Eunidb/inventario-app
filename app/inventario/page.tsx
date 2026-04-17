'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Sidebar from '@/components/sidebar'
import { 
  Search, Plus, Edit3, Trash2, MapPin, Tag, 
  Box, ImageOff, AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'


export default function InventarioPage() {
    const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchInventario()
  }, [])

  async function fetchInventario() {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventario')
      .select('*, categorias(nombre)')
      .order('nombre', { ascending: true })

    if (!error) setItems(data || [])
    setLoading(false)
  }

  async function eliminarItem(id: string, clave: string) {
  const confirmar = confirm(`¿Estás seguro de eliminar el artículo ${clave}?`);
  if (!confirmar) return;

  const { error } = await supabase
    .from('inventario')
    .delete()
    .eq('id', id);

  if (error) {
    alert("Error al eliminar: " + error.message);
  }else {
      router.push('/inventario')
      router.refresh()
    }
}
  const filteredItems = items.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.marca && item.marca.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex min-h-screen bg-[#F0F5FA]">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 p-4 lg:p-6 transition-all">
        {/* HEADER COMPACTO Y PROFESIONAL */}
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6 bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Box size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Panel de Control</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventario General</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* BUSCADOR MÁS ESTILIZADO Y PEQUEÑO */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar activo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-400" 
              />
            </div>
            
            {/* BOTÓN "NUEVO" REDUCIDO */}
            <Link href="/inventario/nuevo" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap">
              <Plus size={16} /> Nuevo
            </Link>
          </div>
        </div>

        {/* CONTENEDOR DE TABLA ULTRA-ADAPTADO */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-blue-50/50 border-b border-blue-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-blue-900/60 uppercase tracking-widest">Producto</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-blue-900/60 uppercase tracking-widest text-center">Categoría</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-blue-900/60 uppercase tracking-widest text-center">Marca</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-blue-900/60 uppercase tracking-widest text-center">Stock</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-blue-900/60 uppercase tracking-widest text-center">Disponible</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-blue-900/60 uppercase tracking-widest">Ubicación</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-blue-900/60 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-blue-900/60 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    {/* PRODUCTO */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {item.imagen_url ? (
                            <img src={item.imagen_url} className="w-full h-full object-cover" />
                          ) : (
                            <ImageOff size={16} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-bold text-xs line-clamp-1">{item.nombre}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">ID: {item.clave}</span>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORÍA */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 uppercase">
                        {item.categorias?.nombre || 'Gral'}
                      </span>
                    </td>

                    {/* MARCA */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-medium text-slate-500 uppercase">{item.marca || '-'}</span>
                    </td>

                    {/* STOCK TOTAL */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-slate-600">{item.stock_total || 0}</span>
                    </td>

                    {/* DISPONIBLE */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-black ${item.stock_disponible <= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                          {item.stock_disponible}
                        </span>
                        <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.stock_disponible <= 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((item.stock_disponible / (item.stock_total || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* UBICACIÓN */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin size={12} className="text-blue-400" />
                        <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">{item.ubicacion || 'N/A'}</span>
                      </div>
                    </td>

                    {/* ESTADO */}
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${item.estado === 'dado_de_baja' ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} title={item.estado} />
                    </td>

                    {/* ACCIONES COMPACTAS */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link 
                          href={`/inventario/${item.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                        >
                          <Edit3 size={14} />
                        </Link>
                        <button 
                            onClick={() => eliminarItem(item.id, item.clave)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                         >
                             <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RESUMEN DE PIE */}
        <div className="mt-4 flex justify-between items-center px-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
            Sistema Gestión de Mantenimiento <span className="text-blue-200">|</span> v2.0
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-50">
            TOTAL: {filteredItems.length} ITEMS
          </div>
        </div>
      </main>
    </div>
  )
}