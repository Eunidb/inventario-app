"use client";

import React from "react";
import Sidebar from "@/components/sidebar";
import { Settings, User, Building2, Tag, ShieldCheck } from "lucide-react";

export default function ConfigPage() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-10">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-black text-slate-900">Configuración</h1>
            <p className="text-slate-500">Gestiona los parámetros globales de tu sistema de inventario.</p>
          </header>

          <div className="grid gap-6">
            {/* Sección Perfil */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <User size={20} />
                </div>
                <h2 className="font-bold text-lg">Mi Perfil</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                  <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 ring-blue-500 outline-none" placeholder="Jonathan ..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rol de Usuario</label>
                  <input type="text" disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500" value="Administrador" />
                </div>
              </div>
            </section>

            {/* Gestión de Catálogos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group">
                <Building2 className="text-slate-400 group-hover:text-blue-600 mb-4 transition-colors" size={24} />
                <h3 className="font-bold text-slate-800">Departamentos</h3>
                <p className="text-sm text-slate-500 mb-4">Administra las áreas (Mantenimiento, IT, etc.)</p>
                <span className="text-xs font-bold text-blue-600">Gestionar →</span>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group">
                <Tag className="text-slate-400 group-hover:text-blue-600 mb-4 transition-colors" size={24} />
                <h3 className="font-bold text-slate-800">Categorías</h3>
                <p className="text-sm text-slate-500 mb-4">Define etiquetas (Consumibles, Herramientas)</p>
                <span className="text-xs font-bold text-blue-600">Gestionar →</span>
              </div>
            </div>

            {/* Seguridad */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="font-bold text-lg">Seguridad y Sistema</h2>
              </div>
              <button className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                Cerrar todas las sesiones activas
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}