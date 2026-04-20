"use client";

import React, { useEffect, useState } from 'react';
import { 
  ArrowLeftRight, Search, User, Clock, 
  CheckCircle2, AlertCircle, Plus, Calendar 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import ModalGestion from '@/components/ModalGestion';

// Tipado estricto para evitar errores de compilación
interface Prestamo {
  id: number;
  fecha_prestamo: string; // La mapeamos desde fecha_salida
  fecha_devolucion_estimada: string;
  estado: string;
  cantidad: number;
  inventario: { 
    nombre: string; 
    clave: string; 
  };
  usuarios: { 
    nombre_completo: string; 
  };
}

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPrestamos();
  }, []);

  //  función fetchPrestamos 
const fetchPrestamos = async () => {
  try {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('prestamos')
      .select(`
        id,
        fecha_salida,
        estado,
        usuarios!usuario_id (
          nombre_completo
        ),
        detalle_prestamo (
          cantidad,
          inventario (
            id,
            nombre,
            clave
          )
        )
      `)
      .order('fecha_salida', { ascending: false });

    if (error) {
      console.error("Error de Supabase:", error.message);
      return;
    }

    const transformado: Prestamo[] = (data || []).map((item: any) => {
      const detalle = item.detalle_prestamo?.[0];
      
      return {
        id: item.id,
        fecha_prestamo: item.fecha_salida,
        fecha_devolucion_estimada: item.fecha_salida, 
        estado: item.estado,
        cantidad: detalle?.cantidad || 0,
        // Guardamos el ID real para la función de devolución
        inventario_id_real: detalle?.inventario?.id,
        inventario: detalle?.inventario || { nombre: 'N/A', clave: 'S/N' },
        usuarios: item.usuarios || { nombre_completo: 'Usuario Desconocido' }
      };
    });

    setPrestamos(transformado);
  } catch (err) {
    console.error('Error crítico:', err);
  } finally {
    setLoading(false);
  }
};
 const ejecutarDevolucion = async () => {
  if (!selectedPrestamo) return;
  
  try {
    setIsProcessing(true);

    // 1. Marcar cabecera como devuelta
    const { error: errP } = await supabase
      .from('prestamos')
      .update({ estado: 'devuelto', fecha_devolucion: new Date().toISOString() })
      .eq('id', selectedPrestamo.id);
    if (errP) throw errP;

    // 2. Actualizar detalle_prestamo usando el ID real que ya tenemos
    const { error: errD } = await supabase
      .from('detalle_prestamo')
      .update({ estado: 'devuelto', cantidad_devuelta: selectedPrestamo.cantidad })
      .eq('prestamo_id', selectedPrestamo.id)
      .eq('inventario_id', (selectedPrestamo as any).inventario_id_real); // Usamos el ID guardado
    if (errD) throw errD;

    // 3. Obtener stock actual para el cálculo
    const { data: inv } = await supabase
      .from('inventario')
      .select('stock_disponible')
      .eq('id', (selectedPrestamo as any).inventario_id_real)
      .single();

    const nuevoStock = (inv?.stock_disponible || 0) + selectedPrestamo.cantidad;

    // 4. Actualizar stock disponible
    await supabase
      .from('inventario')
      .update({ stock_disponible: nuevoStock })
      .eq('id', (selectedPrestamo as any).inventario_id_real);

    // 5. Historial
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('historial_inventario').insert([{
      inventario_id: (selectedPrestamo as any).inventario_id_real,
      usuario_id: userData.user?.id,
      tipo_movimiento: 'devolucion',
      cantidad: selectedPrestamo.cantidad,
      stock_antes: inv?.stock_disponible,
      stock_despues: nuevoStock,
      prestamo_id: selectedPrestamo.id
    }]);

    setSelectedPrestamo(null);
    fetchPrestamos();
    alert("Devolución exitosa");

  } catch (e) {
    console.error(e);
    alert("Error al procesar");
  } finally {
    setIsProcessing(false);
  }
};

  const filteredPrestamos = prestamos.filter(p => {
    const search = searchTerm.toLowerCase();
    return (
      (p.inventario?.nombre?.toLowerCase().includes(search) || p.usuarios?.nombre_completo?.toLowerCase().includes(search)) &&
      (filterStatus === "todos" ? true : p.estado === filterStatus)
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 lg:p-12 transition-all">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                <ArrowLeftRight size={24} />
              </div>
              Préstamos
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="w-full lg:w-72 pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none transition-all"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                <Plus size={20} /> Nueva Salida
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            {['todos', 'activo', 'atrasado', 'devuelto'].map((s) => (
              <button 
                key={s} 
                onClick={() => setFilterStatus(s)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Equipo</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Responsable</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Estado</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Entrega</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold">Cargando datos...</td></tr>
                  ) : filteredPrestamos.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/20 transition-all">
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-800">{p.inventario?.nombre}</p>
                        <p className="text-[10px] text-blue-500 font-black">REF: {p.inventario?.clave}</p>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-600">{p.usuarios?.nombre_completo}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${p.estado === 'devuelto' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold text-slate-400">
                        {new Date(p.fecha_devolucion_estimada).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => setSelectedPrestamo(p)}
                          disabled={p.estado === 'devuelto'}
                          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${p.estado === 'devuelto' ? 'bg-slate-50 text-slate-300' : 'bg-white border border-slate-200 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                        >
                          {p.estado === 'devuelto' ? 'Finalizado' : 'Gestionar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <ModalGestion 
        isOpen={!!selectedPrestamo}
        onClose={() => setSelectedPrestamo(null)}
        onConfirm={ejecutarDevolucion}
        loading={isProcessing}
        data={selectedPrestamo ? {
          nombre: selectedPrestamo.inventario.nombre,
          cantidad: selectedPrestamo.cantidad,
          responsable: selectedPrestamo.usuarios.nombre_completo,
          clave: selectedPrestamo.inventario.clave
        } : null}
      />
    </div>
  );
}