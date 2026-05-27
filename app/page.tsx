/**
 * @file app/page.tsx
 * @description Página de bienvenida principal (Landing/Home) optimizada y responsiva.
 * Enlaza de forma intuitiva al Login y Registro con la identidad de Laboratorios Pier.
 */

import Link from "next/link";
import { LogIn, UserPlus, Box, ShieldAlert } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      
      {/* SECCIÓN IZQUIERDA: Control de accesos y Footer */}
      <div className="w-full md:w-[42%] lg:w-[38%] xl:w-[35%] flex flex-col min-h-screen border-r border-slate-100 bg-white">
        
        {/* Contenido Principal Centrado */}
        <div className="flex-grow flex flex-col justify-center px-6 sm:px-12 md:px-10 lg:px-16 py-16">
          <div className="max-w-sm w-full mx-auto md:mx-0">
            
            {/* Logo y Encabezado de la Marca */}
            <div className="mb-10 text-center md:text-left animate-fadeIn">
              <div className="inline-flex p-3.5 bg-[#014ba0]/10 rounded-2xl mb-5 text-[#014ba0] shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                Bienvenido
              </h1>
              
              <p className="text-slate-500 font-semibold text-sm mt-2.5 leading-relaxed">
                Accede al panel integral de gestión y control de activos de <span className="text-[#014ba0] font-bold">Laboratorios Pier</span>.
              </p>
            </div>

            {/* Enlaces de Acción Interactivos */}
            <div className="space-y-3.5 w-full">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2.5 w-full min-h-[50px] px-6 py-3.5 bg-[#014ba0] text-white font-bold rounded-xl shadow-lg shadow-[#014ba0]/10 hover:bg-[#004091] hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200 text-sm"
              >
                <LogIn size={18} />
                Iniciar Sesión
              </Link>

              <Link
                href="/register"
                className="flex items-center justify-center gap-2.5 w-full min-h-[50px] px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-bold rounded-xl bg-white hover:bg-slate-50 hover:border-[#014ba0] hover:text-[#014ba0] transition-all duration-200 text-sm"
              >
                <UserPlus size={18} />
                Crear una cuenta
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Institucional Adaptable */}
        <div className="p-6 sm:p-8 border-t border-slate-100 text-[11px] text-slate-400 text-center md:text-left bg-slate-50/50">
          <div className="max-w-sm mx-auto md:mx-0 font-medium">
            <p className="text-slate-600 font-bold">
              © 2026 Sistema de Inventario Laboratorios Pier.
            </p>
            <p className="text-slate-400 mt-0.5">Depto. Mantenimiento & Infraestructura</p>
            
            <div className="flex gap-4 mt-3 justify-center md:justify-start font-bold text-slate-400">
              <a href="#" className="hover:text-[#014ba0] transition-colors">Soporte Técnico</a>
              <span className="text-slate-200 font-light">|</span>
              <a href="#" className="hover:text-[#014ba0] transition-colors">Aviso de Privacidad</a>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Panel de Impacto Visual y Degradados Premium */}
      <div className="hidden md:flex md:flex-1 bg-gradient-to-br from-slate-950 via-[#013b82] to-[#014ba0] items-center justify-center relative overflow-hidden">
        
        {/* Esferas de luz ambiental fluidas */}
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full opacity-40 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#014ba0]/30 rounded-full opacity-30 blur-[100px] pointer-events-none"></div>

        {/* Bloque Informativo */}
        <div className="relative z-10 text-center px-8 lg:px-16 max-w-xl animate-fadeIn">
          <div className="mb-8 flex justify-center drop-shadow-2xl opacity-90">
            <div className="p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-inner">
              <svg className="w-32 h-32 text-white/40" fill="none" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-5 leading-tight tracking-tight">
            Control de inventario,<br />
            <span className="bg-gradient-to-r from-blue-200 to-indigo-100 bg-clip-text text-transparent opacity-90">
              Depto. Mantenimiento
            </span>
          </h2>
          
          <p className="text-blue-100/70 text-base lg:text-lg max-w-sm mx-auto font-medium leading-relaxed">
            Monitoreo de stock, auditorías de infraestructura y gestión técnica en tiempo real.
          </p>
        </div>
      </div>

    </div>
  );
}