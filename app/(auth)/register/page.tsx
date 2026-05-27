/**
 * @file app/(auth)/register/page.tsx
 * @description Página de registro optimizada y adaptada al diseño corporativo.
 * Registra al usuario en Supabase Auth respetando los metadatos y la lógica original.
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, Lock, User, ArrowLeft, Briefcase, Shield, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [deptId, setDeptId] = useState("");
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([]);
  const [rol, setRol] = useState("usuario");
  const [loading, setLoading] = useState(false);
  
  // Estados para alertas estilizadas de la interfaz
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchDepts = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("departamentos")
        .select("id, nombre")
        .order("nombre");

      if (error) {
        console.error("Error cargando departamentos:", error.message);
      } else {
        setDepartamentos(data || []);
      }
    };

    fetchDepts();
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 1. Solo registramos en Auth. 
    // El trigger en SQL creará la fila en la tabla 'usuarios' automáticamente.
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombre.trim() || "Nuevo Usuario",
          departamento_id: deptId,
          rol: rol,
        },
      },
    });

   if (authError) {
  // Captura el error de correo duplicado y dale un formato amigable
  if (authError.status === 422 || authError.message.toLowerCase().includes("already registered")) {
    setError("Este correo electrónico ya se encuentra registrado. Intenta iniciar sesión.");
  } else {
    setError(authError.message);
  }
  setLoading(false);
  return;
}

    setSuccess("¡Registro exitoso! Redirigiendo al inicio de sesión...");
    
    // Redirección limpia tras mostrar el mensaje de éxito estructurado
    setTimeout(() => {
      router.push("/login");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#013b82] to-[#014ba0] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md flex flex-col justify-center my-auto">
        
        {/* CABECERA Y LOGO */}
        <div className="text-center mb-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-black/10">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">InvControl</h1>
          <p className="text-blue-200/80 font-medium text-sm mt-1.5">Únete al sistema de control de inventario</p>
        </div>

        {/* TARJETA DEL FORMULARIO */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 p-6 sm:p-8 border border-slate-100 transition-all duration-300 w-full">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Crear cuenta</h2>
            <p className="text-slate-400 text-xs font-semibold mt-1">Registra un nuevo usuario con permisos específicos en la plataforma.</p>
          </div>

          {/* ALERTA DE ERROR */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl px-4 py-3.5 mb-5 flex items-start gap-3 shadow-sm animate-fadeIn">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-semibold leading-relaxed">
                Error: {error}
              </div>
            </div>
          )}

          {/* ALERTA DE ÉXITO */}
          {success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-xl px-4 py-3.5 mb-5 flex items-start gap-3 shadow-sm animate-fadeIn">
              <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-semibold leading-relaxed">
                {success}
              </div>
            </div>
          )}

          {/* FORMULARIO */}
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Nombre Completo */}
            <div className="flex flex-col">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Nombre Completo
              </label>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  required
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 min-h-[48px] py-3 text-sm font-medium outline-none transition-all
                             focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white
                             text-slate-900 placeholder-slate-400 [color-scheme:light]
                             [-webkit-text-fill-color:theme(colors.slate.900)] autofill:bg-white"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 min-h-[48px] py-3 text-sm font-medium outline-none transition-all
                             focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white
                             text-slate-900 placeholder-slate-400 [color-scheme:light]
                             [-webkit-text-fill-color:theme(colors.slate.900)] autofill:bg-white"
                />
              </div>
            </div>

            {/* Departamento */}
            <div className="flex flex-col">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Departamento
              </label>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Briefcase size={18} />
                </span>
                <select
                  required
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 min-h-[48px] py-3 text-sm font-medium outline-none transition-all
                             focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white
                             text-slate-900 [color-scheme:light] [-webkit-text-fill-color:theme(colors.slate.900)] cursor-pointer appearance-none"
                >
                  <option value="" className="text-slate-400">Selecciona tu departamento</option>
                  {departamentos.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.nombre}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 w-0 h-0" />
              </div>
            </div>

            {/* Rol de Usuario */}
            <div className="flex flex-col">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Tipo de Usuario (Rol)
              </label>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Shield size={18} />
                </span>
                <select
                  required
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 min-h-[48px] py-3 text-sm font-medium outline-none transition-all
                             focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white
                             text-slate-900 [color-scheme:light] [-webkit-text-fill-color:theme(colors.slate.900)] cursor-pointer appearance-none"
                >
                  <option value="usuario">Usuario Estándar</option>
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 w-0 h-0" />
              </div>
            </div>

            {/* Contraseña */}
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
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 min-h-[48px] py-3 text-sm font-medium outline-none transition-all
                             focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white
                             text-slate-900 placeholder-slate-400 [color-scheme:light]
                             [-webkit-text-fill-color:theme(colors.slate.900)] autofill:bg-white"
                />
              </div>
            </div>

            {/* Botón de Registro */}
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-[#014ba0] hover:bg-[#004091] text-white font-bold min-h-[48px] py-3 rounded-xl transition-all shadow-md shadow-[#014ba0]/20 disabled:opacity-60 flex items-center justify-center gap-2 mt-6 active:scale-[0.99]"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span>Completar Registro</span>
              )}
            </button>
          </form>

          {/* REGRESAR AL LOGIN */}
          <div className="border-t border-slate-100 mt-6 pt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#014ba0] hover:text-[#004091] font-bold transition-colors"
            >
              <ArrowLeft size={16} />
              Regresar al inicio de sesión
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}