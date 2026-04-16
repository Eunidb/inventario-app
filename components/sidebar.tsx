'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
// Importa tus iconos aquí 
import { Home, Box, History, FileText, Settings, LogOut } from 'lucide-react'

const menuItems = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Inventario', href: '/inventario', icon: Box },
  { name: 'Historial', href: '/historial', icon: History },
  { name: 'Préstamos', href: '/prestamos', icon: Box },
  { name: 'Reportes', href: '/reportes', icon: FileText },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-[#f0f9ff] border-r border-gray-100 flex flex-col p-4 fixed left-0 top-0">
      {/* Perfil del Usuario (Parte superior) */}
      <div className="flex flex-col items-center my-8">
        <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-4 border-2 border-white shadow-sm">
           <img src="/avatar-placeholder.png" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="font-bold text-gray-800 text-center">Administrador Principal</h2>
        <span className="text-blue-500 text-xs font-semibold">Admin</span>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-[#00aaff] text-white shadow-md' // Estilo activo (como tu imagen)
                  : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600' // Estilo inactivo
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Botón Cerrar Sesión */}
      <button className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-500 mt-auto">
        <LogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  )
}