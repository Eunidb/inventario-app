'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) alert('Error: ' + error.message)
    else {
      alert('Sesión iniciada')
      router.push('/dashboard') // O la ruta que prefieras
    }
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8 max-w-md">
      <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
      <input type="email" placeholder="Correo" onChange={e => setEmail(e.target.value)} className="border p-2" />
      <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} className="border p-2" />
      <button type="submit" className="bg-green-500 text-white p-2">Entrar</button>
    </form>
  )
}