/**
 * @file app/(auth)/login/page.tsx
 * @description Página de inicio de sesión optimizada para móviles y escritorio.
 * Autentica al usuario con Supabase y redirige al dashboard sin alterar la lógica.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/client";
import { Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Correo o contraseña incorrectos.");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#013b82] to-[#014ba0] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md flex flex-col justify-center">
        
        {/* LOGO Y CABECERA */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-black/10">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">InvControl</h1>
          <p className="text-blue-200/80 font-medium text-sm mt-1.5">Sistema de gestión de inventario profesional</p>
        </div>

        {/* TARJETA PRINCIPAL */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 p-6 sm:p-8 border border-slate-100 transition-all duration-300 w-full">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Iniciar sesión</h2>
            <p className="text-slate-400 text-xs font-semibold mt-1">Ingresa tus credenciales para acceder al panel administrativo.</p>
          </div>

          {/* ALERTAS SEMÁNTICAS */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl px-4 py-3.5 mb-5 flex items-start gap-3 shadow-sm animate-fadeIn">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-semibold leading-relaxed">
                {error}
              </div>
            </div>
          )}

          {/* FORMULARIO */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Input: Correo Electrónico */}
            <div className="flex flex-col">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Correo electrónico
              </label>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                  autoComplete="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 min-h-[48px] py-3 text-sm font-medium outline-none transition-all
                             focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white
                             text-slate-900 placeholder-slate-400 [color-scheme:light]
                             [-webkit-text-fill-color:theme(colors.slate.900)] autofill:bg-white"
                />
              </div>
            </div>

            {/* Input: Contraseña */}
            <div className="flex flex-col">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 min-h-[48px] py-3 text-sm font-medium outline-none transition-all
                             focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white
                             text-slate-900 placeholder-slate-400 [color-scheme:light]
                             [-webkit-text-fill-color:theme(colors.slate.900)] autofill:bg-white"
                />
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#014ba0] hover:bg-[#004091] text-white font-bold min-h-[48px] py-3 rounded-xl transition-all shadow-md shadow-[#014ba0]/20 disabled:opacity-60 flex items-center justify-center gap-2 mt-6 active:scale-[0.99]"
            >
              {isLoading ? (
                <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight size={16} className="mt-0.5" />
                </>
              )}
            </button>
          </form>

          {/* FOOTER DE LA TARJETA */}
          <div className="border-t border-slate-100 mt-6 pt-5 text-center">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-[#014ba0] hover:text-[#004091] font-bold transition-colors inline-flex items-center gap-0.5">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}