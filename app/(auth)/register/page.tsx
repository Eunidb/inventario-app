'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombre || 'Sin nombre',
        },
      },
    })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    alert('¡Registro exitoso! Por favor, verifica tu correo si es necesario.')
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 p-4">
      {/* Tarjeta del Formulario */}
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative">
        
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-blue-600"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm text-center">Registra un nuevo usuario para el sistema de inventario</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          {/* Campo de Nombre */}
          <div className="relative">
            <label className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1 block">
              Nombre Completo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Juan Pérez"
                required
                onChange={(e) => setNombre(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Campo de Email */}
          <div className="relative">
            <label className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1 block">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div className="relative">
            <label className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1 block">
              Contraseña
            </label>
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
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Procesando...' : 'Completar Registro'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Ya tengo una cuenta, iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  )
}