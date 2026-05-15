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
        .from('departamentos')
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
    // El trigger en SQL creará la fila en la tabla 'usuarios' automáticamente.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
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
    router.push('/login')
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 p-4">
      <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-blue-600 rounded-t-2xl"></div>

        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mb-3">
            <UserPlus className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Crear Cuenta</h1>
          <p className="text-slate-400 text-sm text-center mt-0.5">Registra un nuevo usuario para el sistema</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* Nombre Completo */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nombre Completo</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                required
                onChange={(e) => setNombre(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all
                           text-slate-900 bg-white placeholder-slate-400 [color-scheme:light] [-webkit-text-fill-color:theme(colors.slate.900)] autofill:bg-white"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all
                           text-slate-900 bg-white placeholder-slate-400 [color-scheme:light] [-webkit-text-fill-color:theme(colors.slate.900)] autofill:bg-white"
              />
            </div>
          </div>

          {/* Selector de Departamento (Dinámico) */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Departamento</label>
            <select
              required
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all
                         text-slate-900 bg-white [color-scheme:light] [-webkit-text-fill-color:theme(colors.slate.900)] cursor-pointer"
            >
              <option value="" className="text-slate-400">Selecciona tu departamento</option>
              {departamentos.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Usuario */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tipo de Usuario (Rol)</label>
            <select
              required
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all
                         text-slate-900 bg-white [color-scheme:light] [-webkit-text-fill-color:theme(colors.slate.900)] cursor-pointer"
            >
              <option value="usuario">Usuario Estándar</option>
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Contraseña */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all
                           text-slate-900 bg-white placeholder-slate-400 [color-scheme:light] [-webkit-text-fill-color:theme(colors.slate.900)] autofill:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 mt-3"
          >
            {loading ? 'Creando perfil...' : 'Completar Registro'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors">
            <ArrowLeft size={16} />
            Regresar al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  )
}