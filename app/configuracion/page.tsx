"use client";

import { useEffect, useState } from "react";
import { createClient } from '@/lib/client'
import Sidebar from "@/components/sidebar";
import ModalConfirmar from "@/components/ModalConfirmar"; // Importamos el nuevo componente

import type { Usuario, Departamento, Categoria, RolEnum } from "@/lib/supabase";

const supabase = createClient()

type Seccion = "perfil" | "departamentos" | "categorias" | "usuarios";

export default function ConfiguracionPage() {
  const [seccion, setSeccion]   = useState<Seccion>("perfil");
  const [usuario, setUsuario]   = useState<Usuario | null>(null);
  const [esAdmin, setEsAdmin]   = useState(false);
  const [cargando, setCargando] = useState(true);

  // Datos de secciones
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [categorias, setCategorias]       = useState<Categoria[]>([]);
  const [usuarios, setUsuarios]           = useState<Usuario[]>([]);

  // Estados de formularios
  const [nombreEdit, setNombreEdit]     = useState("");
  const [saving, setSaving]             = useState(false);
  const [mensaje, setMensaje]           = useState<string | null>(null);
  const [msgTipo, setMsgTipo]           = useState<"ok" | "err">("ok");

  // Estados para el Modal de Confirmación
  const [modalOpen, setModalOpen] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<{ id: number; tipo: "dept" | "cat" } | null>(null);

  const [nuevoDeptNombre, setNuevoDeptNombre] = useState("");
  const [nuevoDeptResp, setNuevoDeptResp]     = useState("");
  const [nuevoDeptDesc, setNuevoDeptDesc]     = useState("");

  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [nuevaCatDesc, setNuevaCatDesc]     = useState("");

  useEffect(() => {
    const init = async () => {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from("usuarios")
        .select(`*, departamentos(nombre)`)
        .eq("id", user.id)
        .single();

      if (perfil) {
        setUsuario(perfil as Usuario);
        setNombreEdit(perfil.nombre_completo);
        setEsAdmin(perfil.rol === "admin");
      }
      setCargando(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!esAdmin) return;
    if (seccion === "departamentos") {
      supabase.from("departamentos").select("*").order("nombre").then(({ data }) => setDepartamentos(data ?? []));
    } else if (seccion === "categorias") {
      supabase.from("categorias").select("*").order("nombre").then(({ data }) => setCategorias(data ?? []));
    } else if (seccion === "usuarios") {
      supabase.from("usuarios").select("*, departamentos(nombre)").order("nombre_completo").then(({ data }) => setUsuarios(data as Usuario[] ?? []));
    }
  }, [seccion, esAdmin]);

  const showMsg = (texto: string, tipo: "ok" | "err" = "ok") => {
    setMensaje(texto);
    setMsgTipo(tipo);
    setTimeout(() => setMensaje(null), 3500);
  };

  const handleGuardarNombre = async () => {
    if (!nombreEdit.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("usuarios")
      .update({ nombre_completo: nombreEdit, updated_at: new Date().toISOString() })
      .eq("id", usuario!.id);
    setSaving(false);
    if (error) showMsg("Error al guardar: " + error.message, "err");
    else showMsg("Nombre actualizado correctamente.");
  };

  // --- Lógica de Eliminación Mejorada ---
  
  const abrirConfirmacion = (id: number, tipo: "dept" | "cat") => {
    setItemAEliminar({ id, tipo });
    setModalOpen(true);
  };

  const ejecutarEliminacion = async () => {
    if (!itemAEliminar) return;
    const { id, tipo } = itemAEliminar;
    const tabla = tipo === "dept" ? "departamentos" : "categorias";

    const { error } = await supabase.from(tabla).delete().eq("id", id);
    
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg(`${tipo === "dept" ? "Departamento" : "Categoría"} eliminado.`);
      if (tipo === "dept") setDepartamentos(prev => prev.filter(d => d.id !== id));
      else setCategorias(prev => prev.filter(c => c.id !== id));
    }
    setItemAEliminar(null);
  };

  // --- Fin Lógica Eliminación ---

  const handleAgregarDept = async () => {
    if (!nuevoDeptNombre.trim()) return;
    const { error } = await supabase.from("departamentos").insert({
      nombre: nuevoDeptNombre.trim(),
      responsable: nuevoDeptResp.trim() || null,
      descripcion: nuevoDeptDesc.trim() || null,
    });
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg("Departamento agregado.");
      setNuevoDeptNombre(""); setNuevoDeptResp(""); setNuevoDeptDesc("");
      const { data } = await supabase.from("departamentos").select("*").order("nombre");
      setDepartamentos(data ?? []);
    }
  };

  const handleAgregarCat = async () => {
    if (!nuevaCatNombre.trim()) return;
    const { error } = await supabase.from("categorias").insert({
      nombre: nuevaCatNombre.trim(),
      descripcion: nuevaCatDesc.trim() || null,
    });
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg("Categoría agregada.");
      setNuevaCatNombre(""); setNuevaCatDesc("");
      const { data } = await supabase.from("categorias").select("*").order("nombre");
      setCategorias(data ?? []);
    }
  };

  const handleCambiarRol = async (userId: string, nuevoRol: RolEnum) => {
    const { error } = await supabase
      .from("usuarios")
      .update({ rol: nuevoRol, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg("Rol actualizado.");
      setUsuarios(prev => prev.map(u => (u.id === userId ? { ...u, rol: nuevoRol } : u)));
    }
  };

  const handleToggleActivo = async (userId: string, activo: boolean) => {
    const { error } = await supabase
      .from("usuarios")
      .update({ activo: !activo, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg(`Usuario ${!activo ? "activado" : "desactivado"}.`);
      setUsuarios(prev => prev.map(u => (u.id === userId ? { ...u, activo: !activo } : u)));
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-gray-400 text-sm animate-pulse">Cargando configuración...</div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto h-screen flex items-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center w-full shadow-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Acceso restringido</h2>
          <p className="text-sm text-red-600">Esta sección es exclusiva para administradores.</p>
        </div>
      </div>
    );
  }

  const secciones: { id: Seccion; label: string }[] = [
    { id: "perfil", label: "Mi perfil" },
    { id: "departamentos", label: "Departamentos" },
    { id: "categorias", label: "Categorías" },
    { id: "usuarios", label: "Usuarios" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configuración</h1>
            <p className="text-gray-500 mt-1">Administra los parámetros globales del sistema de inventario.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Menú de Navegación Interna */}
            <div className="lg:w-64 flex-shrink-0">
              <nav className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 space-y-1">
                {secciones.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSeccion(s.id)}
                    className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                      seccion === s.id
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Panel de Contenido */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                {mensaje && (
                  <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium animate-in slide-in-from-top duration-300 ${
                    msgTipo === "ok" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-700"
                  }`}>
                    {mensaje}
                  </div>
                )}

                {/* --- SECCIÓN PERFIL --- */}
                {seccion === "perfil" && (
                  <div className="max-w-xl space-y-6">
                    <h2 className="text-lg font-bold text-gray-900">Información Personal</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre completo</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={nombreEdit}
                            onChange={(e) => setNombreEdit(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                          <button
                            onClick={handleGuardarNombre}
                            disabled={saving}
                            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all"
                          >
                            {saving ? "..." : "Actualizar"}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rol Actual</p>
                          <p className="text-sm font-bold text-gray-800 capitalize mt-1">{usuario?.rol}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado de cuenta</p>
                          <p className="text-sm font-bold text-emerald-600 mt-1">{usuario?.activo ? "Verificada / Activa" : "Inactiva"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SECCIÓN DEPARTAMENTOS --- */}
                {seccion === "departamentos" && (
                  <div className="space-y-8">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-gray-100">
                      <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-tight">Crear nuevo departamento</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          placeholder="Nombre *"
                          value={nuevoDeptNombre}
                          onChange={(e) => setNuevoDeptNombre(e.target.value)}
                          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          placeholder="Responsable"
                          value={nuevoDeptResp}
                          onChange={(e) => setNuevoDeptResp(e.target.value)}
                          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        placeholder="Descripción corta"
                        value={nuevoDeptDesc}
                        onChange={(e) => setNuevoDeptDesc(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={handleAgregarDept} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all">
                        Registrar Departamento
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {departamentos.map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                          <div className="truncate mr-4">
                            <p className="text-sm font-bold text-gray-900 truncate">{d.nombre}</p>
                            <p className="text-xs text-gray-400">{d.responsable || "Sin responsable"}</p>
                          </div>
                          <button onClick={() => abrirConfirmacion(d.id, "dept")} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- SECCIÓN CATEGORÍAS --- */}
                {seccion === "categorias" && (
                  <div className="space-y-8">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-gray-100">
                      <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-tight">Nueva Categoría</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          placeholder="Nombre *"
                          value={nuevaCatNombre}
                          onChange={(e) => setNuevaCatNombre(e.target.value)}
                          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          placeholder="Descripción"
                          value={nuevaCatDesc}
                          onChange={(e) => setNuevaCatDesc(e.target.value)}
                          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button onClick={handleAgregarCat} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all">
                        Crear Categoría
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categorias.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{c.nombre}</p>
                            <p className="text-xs text-gray-400">{c.descripcion || "Sin descripción"}</p>
                          </div>
                          <button onClick={() => abrirConfirmacion(c.id, "cat")} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- SECCIÓN USUARIOS --- */}
                {seccion === "usuarios" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">Gestión de Accesos</h2>
                    <div className="space-y-3">
                      {usuarios.map((u) => (
                        <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-slate-50 transition-all">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {u.nombre_completo?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{u.nombre_completo}</p>
                            <p className="text-xs text-gray-400 italic">@{u.username}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={u.rol}
                              onChange={(e) => handleCambiarRol(u.id, e.target.value as RolEnum)}
                              className="text-xs font-bold border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="usuario">Usuario</option>
                              <option value="tecnico">Técnico</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleToggleActivo(u.id, u.activo)}
                              className={`text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg transition-all ${
                                u.activo ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                              }`}
                            >
                              {u.activo ? "Activo" : "Suspendido"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Renderizado del Modal de Confirmación Único */}
      <ModalConfirmar
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={ejecutarEliminacion}
        titulo={`¿Eliminar ${itemAEliminar?.tipo === "dept" ? "Departamento" : "Categoría"}?`}
        mensaje="Esta acción es permanente y podría afectar a los activos que dependen de este registro. ¿Deseas continuar?"
      />
    </div>
  );
}