'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import StatsCard from '@/components/StatsCard'
import { Box, FileText, History, RefreshCcw } from 'lucide-react'

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    inventario: 0,
    reportes: 0,
    historial: 0,
    prestamos: 0
  })

  useEffect(() => {
    async function fetchStats() {
      // Obtenemos los conteos de cada tabla en paralelo
      const [inv, hist, prest] = await Promise.all([
        supabase.from('inventario').select('*', { count: 'exact', head: true }),
        supabase.from('historial_inventario').select('*', { count: 'exact', head: true }),
        supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'activo')
      ])

      setCounts({
        inventario: inv.count || 0,
        reportes: 0, // Aquí podrías contar registros de una tabla de reportes si la tienes
        historial: hist.count || 0,
        prestamos: prest.count || 0
      })
    }
    fetchStats()
  }, [])

  return (
    <div className="p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Panel de control</h1>
      </div>

      {/* Grid de Cards (Ahora con datos de Supabase) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard title="Inventario" count={counts.inventario} icon={<Box size={24}/>} />
        <StatsCard title="Reportes" count={counts.reportes} icon={<FileText size={24}/>} />
        <StatsCard title="Historial" count={counts.historial} icon={<History size={24}/>} />
        <StatsCard title="Préstamos" count={counts.prestamos} icon={<RefreshCcw size={24}/>} />
      </div>

      {/* Próximo paso: La tabla de movimientos aquí abajo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-700">Movimientos Recientes</h3>
        <p className="text-gray-400 text-sm italic">Aquí conectaremos la tabla de historial...</p>
      </div>
    </div>
  )
}