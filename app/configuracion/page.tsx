"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Usuario, Departamento, Categoria, RolEnum } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Secciones del panel
// ---------------------------------------------------------------------------
type Seccion = "perfil" | "departamentos" | "categorias" | "usuarios";

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
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

  // Formulario de nuevo departamento
  const [nuevoDeptNombre, setNuevoDeptNombre] = useState("");
  const [nuevoDeptResp, setNuevoDeptResp]     = useState("");
  const [nuevoDeptDesc, setNuevoDeptDesc]     = useState("");

  // Formulario de nueva categoría
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [nuevaCatDesc, setNuevaCatDesc]     = useState("");

  // -------------------------------------------------------------------------
  // Cargar datos del usuario actual
  // -------------------------------------------------------------------------
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

  // Cargar datos de la sección activa
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

  // -------------------------------------------------------------------------
  // Mostrar mensaje temporal
  // -------------------------------------------------------------------------
  const showMsg = (texto: string, tipo: "ok" | "err" = "ok") => {
    setMensaje(texto);
    setMsgTipo(tipo);
    setTimeout(() => setMensaje(null), 3500);
  };

  // -------------------------------------------------------------------------
  // Guardar nombre del administrador
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Agregar departamento
  // -------------------------------------------------------------------------
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

  /** Eliminar departamento */
  const handleEliminarDept = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este departamento?")) return;
    const { error } = await supabase.from("departamentos").delete().eq("id", id);
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg("Departamento eliminado.");
      setDepartamentos((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // -------------------------------------------------------------------------
  // Agregar categoría
  // -------------------------------------------------------------------------
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

  /** Eliminar categoría */
  const handleEliminarCat = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg("Categoría eliminada.");
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // -------------------------------------------------------------------------
  // Cambiar rol de usuario
  // -------------------------------------------------------------------------
  const handleCambiarRol = async (userId: string, nuevoRol: RolEnum) => {
    const { error } = await supabase
      .from("usuarios")
      .update({ rol: nuevoRol, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg("Rol actualizado.");
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rol: nuevoRol } : u))
      );
    }
  };

  /** Activar/desactivar usuario */
  const handleToggleActivo = async (userId: string, activo: boolean) => {
    const { error } = await supabase
      .from("usuarios")
      .update({ activo: !activo, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) showMsg("Error: " + error.message, "err");
    else {
      showMsg(`Usuario ${!activo ? "activado" : "desactivado"}.`);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, activo: !activo } : u))
      );
    }
  };

  // -------------------------------------------------------------------------
  // Pantalla de carga
  // -------------------------------------------------------------------------
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Cargando configuración...</div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Acceso denegado (no admin)
  // -------------------------------------------------------------------------
  if (!esAdmin) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-semibold text-red-800 mb-2">Acceso restringido</h2>
          <p className="text-sm text-red-600">
            Esta sección es exclusiva para administradores del sistema.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render del panel de configuración (solo admin)
  // -------------------------------------------------------------------------
  const secciones: { id: Seccion; label: string }[] = [
    { id: "perfil",        label: "Mi perfil" },
    { id: "departamentos", label: "Departamentos" },
    { id: "categorias",    label: "Categorías" },
    { id: "usuarios",      label: "Usuarios" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Panel de administración del sistema</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Menú lateral */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {secciones.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeccion(s.id)}
                className={`
                  w-full text-left px-4 py-3 text-sm font-medium transition-colors
                  border-l-2
                  ${seccion === s.id
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de la sección */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {/* Mensaje global */}
          {mensaje && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              msgTipo === "ok"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {mensaje}
            </div>
          )}

          {/* ================================================================ */}
          {/* SECCIÓN: Mi perfil                                               */}
          {/* ================================================================ */}
          {seccion === "perfil" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900">Información del administrador</h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre completo</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={nombreEdit}
                    onChange={(e) => setNombreEdit(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleGuardarNombre}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Rol</p>
                  <p className="font-medium text-gray-900 capitalize">{usuario?.rol}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Estado</p>
                  <p className="font-medium text-emerald-700">{usuario?.activo ? "Activo" : "Inactivo"}</p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* SECCIÓN: Departamentos                                           */}
          {/* ================================================================ */}
          {seccion === "departamentos" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Gestión de departamentos</h2>

              {/* Formulario nuevo departamento */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nuevo departamento</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Nombre del departamento *"
                    value={nuevoDeptNombre}
                    onChange={(e) => setNuevoDeptNombre(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    placeholder="Responsable (opcional)"
                    value={nuevoDeptResp}
                    onChange={(e) => setNuevoDeptResp(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  placeholder="Descripción (opcional)"
                  value={nuevoDeptDesc}
                  onChange={(e) => setNuevoDeptDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAgregarDept}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Agregar departamento
                </button>
              </div>

              {/* Lista de departamentos */}
              <div className="space-y-2">
                {departamentos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No hay departamentos registrados</p>
                ) : (
                  departamentos.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.nombre}</p>
                        {d.responsable && <p className="text-xs text-gray-400">Responsable: {d.responsable}</p>}
                      </div>
                      <button
                        onClick={() => handleEliminarDept(d.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* SECCIÓN: Categorías                                              */}
          {/* ================================================================ */}
          {seccion === "categorias" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Gestión de categorías</h2>

              {/* Formulario nueva categoría */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nueva categoría</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Nombre de la categoría *"
                    value={nuevaCatNombre}
                    onChange={(e) => setNuevaCatNombre(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    placeholder="Descripción (opcional)"
                    value={nuevaCatDesc}
                    onChange={(e) => setNuevaCatDesc(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleAgregarCat}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Agregar categoría
                </button>
              </div>

              {/* Lista de categorías */}
              <div className="space-y-2">
                {categorias.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No hay categorías registradas</p>
                ) : (
                  categorias.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                        {c.descripcion && <p className="text-xs text-gray-400">{c.descripcion}</p>}
                      </div>
                      <button
                        onClick={() => handleEliminarCat(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* SECCIÓN: Usuarios                                                */}
          {/* ================================================================ */}
          {seccion === "usuarios" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900">Gestión de usuarios</h2>

              <div className="space-y-2">
                {usuarios.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No hay usuarios registrados</p>
                ) : (
                  usuarios.map((u) => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {u.nombre_completo?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{u.nombre_completo}</p>
                        <p className="text-xs text-gray-400">{u.username}</p>
                      </div>

                      {/* Rol */}
                      <select
                        value={u.rol}
                        onChange={(e) => handleCambiarRol(u.id, e.target.value as RolEnum)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="usuario">Usuario</option>
                        <option value="tecnico">Técnico</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Activar/desactivar */}
                      <button
                        onClick={() => handleToggleActivo(u.id, u.activo)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          u.activo
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-red-100 text-red-600 hover:bg-red-200"
                        }`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}