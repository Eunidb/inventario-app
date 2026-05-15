/**
 * @file app/(auth)/login/page.tsx
 * @description Página de inicio de sesión optimizada para móviles.
 * Autentica al usuario con Supabase y redirige al dashboard.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/client";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">InvControl</h1>
          <p className="text-blue-300 text-sm mt-1">Sistema de gestión de inventario</p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input: Correo Electrónico */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
                autoComplete="email"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all
                           focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white
                           
                           /* ── SOLUCIÓN MOBILE PARA TEXTO INVISIBLE ── */
                           text-slate-900 placeholder-slate-400 [color-scheme:light]
                           [-webkit-text-fill-color:theme(colors.slate.900)]
                           autofill:bg-white"
              />
            </div>

            {/* Input: Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all
                           focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white
                           
                           /* ── SOLUCIÓN MOBILE PARA TEXTO INVISIBLE ── */
                           text-slate-900 placeholder-slate-400 [color-scheme:light]
                           [-webkit-text-fill-color:theme(colors.slate.900)]
                           autofill:bg-white"
              />
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-all shadow-md shadow-blue-100 disabled:opacity-60 flex items-center justify-center gap-2 mt-4 active:scale-[0.99]"
            >
              {isLoading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <span>{isLoading ? "Iniciando sesión..." : "Ingresar"}</span>
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-slate-500 mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}