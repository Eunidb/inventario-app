'use client'

import { useState, useEffect } from 'react'

import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [deptId, setDeptId] = useState('')
  const [departamentos, setDepartamentos] = useState<{id: number, nombre: string}[]>([])
  const [rol, setRol] = useState('usuario')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
    const supabase = createClient()


useEffect(() => {
  const fetchDepts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('departamentos') // Asegúrate que el nombre de la tabla sea idéntico
      .select('id, nombre')
      .order('nombre');

    if (error) {
      console.error("Error cargando departamentos:", error.message);
    } else {
      setDepartamentos(data || []);
    }
  };

  fetchDepts();
}, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
  

    // 1. Solo registramos en Auth. 
    // El trigger que pusiste en SQL creará la fila en la tabla 'usuarios' automáticamente.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // Es vital que este nombre coincida con lo que pusiste en el Trigger:
          // new.raw_user_meta_data->>'nombre_completo'
          nombre_completo: nombre.trim() || 'Nuevo Usuario',
          departamento_id: deptId,
          rol: rol,
        },
      },
    })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    alert('¡Registro exitoso! Ya puedes iniciar sesión.')
    // Redirigimos al login para que el usuario entre formalmente
    router.push('/login')
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-blue-600"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm text-center">Registra un nuevo usuario para el sistema</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          {/* Nombre Completo */}
          <div>
            <label className="text-xs font-semibold text-blue-900 uppercase mb-1 block">Nombre Completo</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                required
                onChange={(e) => setNombre(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-blue-900 uppercase mb-1 block">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              />
            </div>
          </div>

          {/* Selector de Departamento */}
      <div>
        <label className="text-xs font-semibold text-blue-900 uppercase mb-1 block">Departamento</label>
        <select
          required
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
        >
          <option value="">Selecciona tu departamento</option>
          <option value="1">Mantenimiento</option>
        </select>
      </div>

      <div>
  <label className="text-xs font-semibold text-blue-900 uppercase mb-1 block">Tipo de Usuario (Rol)</label>
  <select
    required
    value={rol}
    onChange={(e) => setRol(e.target.value)}
    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
  >
    <option value="usuario">Usuario Estándar</option>
    <option value="tecnico">Técnico</option>
    <option value="admin">Administrador</option>
  </select>
</div>
          {/* Contraseña */}
          <div>
            <label className="text-xs font-semibold text-blue-900 uppercase mb-1 block">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creando perfil...' : 'Completar Registro'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeft size={16} />
            Regresar al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  )
}