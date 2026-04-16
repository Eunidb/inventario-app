'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')

  const handleRegister = async (e: React.SubmitEvent) => {
    e.preventDefault()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Esto es lo que lee el TRIGGER que creamos en SQL
        data: {
          nombre_completo: nombre
        }
      }
    })

    if (error) alert(error.message)
    else alert('¡Registro exitoso! Revisa tu correo para confirmar.')
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4 p-8 max-w-md">
      <h1 className="text-2xl font-bold">Registro de Inventario</h1>
      <input type="text" placeholder="Nombre Completo" onChange={e => setNombre(e.target.value)} className="border p-2" />
      <input type="email" placeholder="Correo" onChange={e => setEmail(e.target.value)} className="border p-2" />
      <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} className="border p-2" />
      <button type="submit" className="bg-blue-500 text-white p-2">Registrarse</button>
    </form>
  )
}