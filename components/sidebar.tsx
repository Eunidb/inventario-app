'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  History, 
  FileText, 
  Settings, 
  LogOut, 
  ArrowLeftRight,
  UserCircle
} from 'lucide-react'

const menuItems = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventario', href: '/inventario', icon: Package },
  { name: 'Historial', href: '/historial', icon: History },
  { name: 'Préstamos', href: '/prestamos', icon: ArrowLeftRight },
  { name: 'Reportes', href: '/reportes', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
      
      {/* Header del Sidebar / Logo */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package className="text-white" size={20} />
          </div>
          <span className="font-bold text-xl text-gray-800 tracking-tight">
           Lab Pier <span className="text-blue-600 text-sm font-medium">Inventario</span>
          </span>
        </div>
      </div>

      {/* Perfil del Usuario - Más compacto y elegante */}
      <div className="px-6 py-8">
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
              A
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-gray-800 truncate">Admin Principal</span>
            <span className="text-[10px] uppercase font-bold text-blue-500 tracking-widest">Mantenimiento</span>
          </div>
        </div>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Menú principal</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
              <span className={`font-semibold text-sm ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}

        <div className="pt-4 mt-4 border-t border-gray-50">
          <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Preferencias</p>
          <Link
            href="/configuracion"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/configuracion' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <Settings size={20} />
            <span className="font-semibold text-sm">Configuración</span>
          </Link>
        </div>
      </nav>

      {/* Botón Cerrar Sesión - Más destacado */}
      <div className="p-4 border-t border-gray-50">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}