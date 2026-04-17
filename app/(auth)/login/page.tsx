'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Package, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // 1. Informamos a Next.js que los datos cambiaron
      router.refresh()
      
      // 2. Pequeña espera para asegurar que la cookie se asiente
      setTimeout(() => {
        // 3. Intentamos la redirección suave
        router.push('/dashboard')
        
        // 4. Si después de 500ms sigues en login, forzamos un hard reload
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            window.location.href = '/dashboard'
          }
        }, 500)
      }, 100)
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl overflow-hidden relative">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-600"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Inventario</h1>
          <p className="text-gray-500 text-sm">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
                placeholder="••••••••"
                required
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
            {loading ? 'Cargando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs italic">
            Mantenimiento & Control de Inventarios v2.0
          </p>
        </div>
      </div>
    </main>
  )
} 