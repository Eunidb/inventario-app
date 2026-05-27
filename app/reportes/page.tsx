"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import {
  Calendar,
  FileText,
  Package,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  BarChart2,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  Filter,
} from "lucide-react";
import { type TipoFormato, type TrabajoExpediente } from "@/components/formatos/types";

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------
type TipoReporte = "inventario" | "historial" | "prestamos" | "expedientes";

interface ReportStats {
  totalArticulos: number;
  unidadesTotales: number;
  stockBajo: number;
  prestamosActivos: number;
  dadosBaja: number;
  totalExpedientes: number;
}

// ---------------------------------------------------------------------------
// Helpers de formato
// ---------------------------------------------------------------------------
const fmtFecha = (f?: string) =>
  f
    ? new Date(f).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// Función: Imprimir Expediente Individual Detallado en PDF (Tonos Corporativos)
// ---------------------------------------------------------------------------
async function generarPDFExpediente(trabajo: TrabajoExpediente) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Encabezado principal (#004091)
  doc.setFillColor(0, 64, 145); 
  doc.rect(0, 0, 210, 25, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("LABORATORIOS PIER", 15, 11);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`EXPEDIENTE TÉCNICO DE TRABAJO — FOLIO: ${trabajo.folio ?? `#${trabajo.id}`}`, 15, 18);

  // Bloque Izquierdo: Información General (#014ba0)
  autoTable(doc, {
    startY: 32,
    margin: { left: 15, right: 15 },
    head: [["DATOS GENERALES DEL EXPEDIENTE", ""]],
    body: [
      ["Título del Trabajo:", trabajo.titulo],
      ["Tipo de Mantenimiento:", trabajo.tipo_trabajo ?? "—"],
      ["Prioridad Asignada:", trabajo.prioridad ?? "—"],
      ["Estado Actual:", trabajo.estado.toUpperCase().replace(/_/g, " ")],
    ],
    theme: "plain",
    headStyles: { fillColor: [1, 75, 160], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } }, 
  });

  let campoY = (doc as any).lastAutoTable.finalY;

  // Bloque Derecho: Origen y Logística (#004091)
  autoTable(doc, {
    startY: campoY + 5,
    margin: { left: 15, right: 15 },
    head: [["CONTROL INTERNO Y LOGÍSTICA", ""]],
    body: [
      ["Área Solicitante:", trabajo.area_solicitante ?? "—"],
      ["Máquina / Equipo:", trabajo.maquina ?? "—"],
      ["Departamento:", trabajo.departamento?.nombre ?? "—"],
      ["Creado Por:", trabajo.creador?.nombre_completo ?? "—"],
      ["Fecha de Apertura:", fmtFecha(trabajo.fecha_apertura)],
      ["Fecha de Cierre:", trabajo.fecha_cierre ? fmtFecha(trabajo.fecha_cierre) : "Abierto / En proceso"],
    ],
    theme: "plain",
    headStyles: { fillColor: [0, 64, 145], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
  });

  campoY = (doc as any).lastAutoTable.finalY;

  // Observaciones
  if (trabajo.observaciones) {
    autoTable(doc, {
      startY: campoY + 5,
      margin: { left: 15, right: 15 },
      head: [["OBSERVACIONES INICIALES"]],
      body: [[trabajo.observaciones]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
    });
    campoY = (doc as any).lastAutoTable.finalY;
  }

  // Tabla de Formularios Asociados
  const filasFormatos = (trabajo.registros_formato || []).map((f, index) => [
    index + 1,
    cap(f.tipo.replace(/_/g, " ")),
    f.fecha_llenado ? fmtFecha(f.fecha_llenado) : "—",
    f.completado ? "COMPLETADO" : "PENDIENTE",
  ]);

  autoTable(doc, {
    startY: campoY + 8,
    margin: { left: 15, right: 15 },
    head: [["#", "Formulario Vinculado", "Fecha de Llenado", "Estatus"]],
    body: filasFormatos,
    headStyles: { fillColor: [1, 75, 160], fontStyle: "bold", fontSize: 9, halign: "center" },
    alternateRowStyles: { fillColor: [240, 246, 255] },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: { 0: { halign: "center", cellWidth: 10 }, 2: { halign: "center" }, 3: { halign: "center" } },
  });

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Documento de control interno Laboratorios Pier. Página ${i} de ${paginas}`, 105, 287, { align: "center" });
  }

  doc.save(`Expediente_${trabajo.folio ?? trabajo.id}.pdf`);
}

// ---------------------------------------------------------------------------
// Función: generar PDF con jsPDF + autoTable (Estilo Corporativo Unificado)
// ---------------------------------------------------------------------------
async function generarPDF(
  titulo: string,
  cabeceras: string[],
  filas: (string | number)[][],
  fileName: string
) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Encabezado del documento (#004091)
  doc.setFillColor(0, 64, 145); 
  doc.rect(0, 0, 297, 22, "F");

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("LABORATORIOS PIER — Sistema de Inventario", 14, 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(titulo, 14, 17);

  // Fecha de generación
  const hoy = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generado: ${hoy}`, 297 - 14, 17, { align: "right" });

  autoTable(doc, {
    head: [cabeceras],
    body: filas,
    startY: 28,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [1, 75, 160],   // #014ba0
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [240, 246, 255], // Fondo suave para cebras
    },
    bodyStyles: {
      textColor: [30, 41, 59],    // slate-800
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data: any) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        297 / 2,
        doc.internal.pageSize.height - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`${fileName}.pdf`);
}

// ---------------------------------------------------------------------------
// Función: generar XLS con ExcelJS (Estilo Corporativo Coincidente)
// ---------------------------------------------------------------------------
async function generarXLS(
  titulo: string,
  cabeceras: string[],
  filas: (string | number)[][],
  fileName: string
) {
  const ExcelJS = (await import("exceljs")).default;
  const { saveAs } = (await import("file-saver")).default;

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Reporte");

  ws.views = [{ showGridLines: true }];

  // 1. Título del Reporte (#004091)
  const filaTitulo = ws.addRow([titulo]);
  filaTitulo.height = 30;
  ws.mergeCells(1, 1, 1, cabeceras.length);
  
  const celdaTitulo = ws.getCell(1, 1);
  celdaTitulo.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FF004091" } }; 
  celdaTitulo.alignment = { vertical: "middle", horizontal: "left" };

  ws.addRow([]);

  // 2. Cabeceras de la Tabla (#014ba0)
  const filaCabecera = ws.addRow(cabeceras);
  filaCabecera.height = 24;

  filaCabecera.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF014BA0" }, 
    };
    cell.font = {
      name: "Segoe UI",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF004091" } },
    };
  });

  // 3. Filas de Datos
  filas.forEach((filaDatos, index) => {
    const row = ws.addRow(filaDatos);
    row.height = 20;

    const esPar = index % 2 === 1;
    const colorFondo = esPar ? "FFF0F6FF" : "FFFFFFFF";

    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colorFondo },
      };
      cell.font = {
        name: "Segoe UI",
        size: 10,
        color: { argb: "FF1E293B" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      if (typeof cell.value === "number") {
        cell.alignment = { vertical: "middle", horizontal: "right" };
      }
    });
  });

  ws.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: false }, (cell, rowNum) => {
      if (rowNum === 1) return;
      const cellLength = cell.value ? String(cell.value).length : 0;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = maxLength < 12 ? 14 : Math.min(maxLength + 4, 45);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${fileName}.xlsx`);
}

// ---------------------------------------------------------------------------
// Componente de Vista de Página
// ---------------------------------------------------------------------------
export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tipoActivo, setTipoActivo] = useState<TipoReporte>("inventario");
  
  const [formularioSeleccionado, setFormularioSeleccionado] = useState<string>("todos");
  const [listaFormularios, setListaFormularios] = useState<string[]>([]);

  const [stats, setStats] = useState<ReportStats>({
    totalArticulos: 0,
    unidadesTotales: 0,
    stockBajo: 0,
    prestamosActivos: 0,
    dadosBaja: 0,
    totalExpedientes: 0,
  });

  const [dataInventario, setDataInventario] = useState<any[]>([]);
  const [dataHistorial, setDataHistorial] = useState<any[]>([]);
  const [dataPrestamos, setDataPrestamos] = useState<any[]>([]);
  const [dataExpedientes, setDataExpedientes] = useState<any[]>([]);

  const conteos: Record<TipoReporte, number> = {
    inventario: dataInventario.length,
    historial: dataHistorial.length,
    prestamos: dataPrestamos.length,
    expedientes: dataExpedientes.length,
  };

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: inv } = await supabase
        .from("inventario")
        .select("*, categorias(nombre), departamentos(nombre)")
        .order("nombre");

      const { count: prestamosActivos } = await supabase
        .from("prestamos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "activo");

      const { count: bajasCount } = await supabase
        .from("inventario")
        .select("*", { count: "exact", head: true })
        .eq("estado", "dado_de_baja");

      const activosConStock = (inv ?? []).filter(
        (i) => i.estado === "activo" && Number(i.stock_disponible) <= Number(i.stock_minimo)
      );

      let qExp = supabase
        .from("trabajos")
        .select(`
          *,
          creador:creado_por(nombre_completo),
          departamento:departamento_id(nombre),
          registros_formato(*)
        `)
        .order("fecha_apertura", { ascending: false });
        
      if (fechaDesde) qExp = qExp.gte("fecha_apertura", fechaDesde);
      if (fechaHasta) qExp = qExp.lte("fecha_apertura", fechaHasta + "T23:59:59");
      
      const { data: exp } = await qExp;
      let expFiltrados = (exp as unknown as TrabajoExpediente[]) ?? [];

      if (formularioSeleccionado !== "todos") {
        expFiltrados = expFiltrados.filter(e => 
          e.registros_formato?.some(r => r.tipo === formularioSeleccionado)
        );
      }
      setDataExpedientes(expFiltrados);

      const { data: todosLosFormatos } = await supabase.from("registros_formato").select("tipo");
      if (todosLosFormatos) {
        const unicos = Array.from(new Set(todosLosFormatos.map(e => e.tipo).filter(Boolean)));
        setListaFormularios(unicos);
      }

      setStats({
        totalArticulos: inv?.length ?? 0,
        unidadesTotales: (inv ?? []).reduce((a, i) => a + Number(i.stock_disponible), 0),
        stockBajo: activosConStock.length,
        prestamosActivos: prestamosActivos ?? 0,
        dadosBaja: bajasCount ?? 0,
        totalExpedientes: expFiltrados.length,
      });

      setDataInventario(inv ?? []);

      let qHist = supabase
        .from("historial_inventario")
        .select("*, inventario(nombre, clave), usuarios(nombre_completo)")
        .order("fecha", { ascending: false });
      if (fechaDesde) qHist = qHist.gte("fecha", fechaDesde);
      if (fechaHasta) qHist = qHist.lte("fecha", fechaHasta + "T23:59:59");
      const { data: hist } = await qHist;
      setDataHistorial(hist ?? []);

      let qPre = supabase
        .from("prestamos")
        .select(`
          id, fecha_salida, fecha_devolucion, estado, observaciones,
          solicitante:usuario_id(nombre_completo),
          departamento:departamento_id(nombre),
          autorizador:autorizado_por(nombre_completo)
        `)
        .order("created_at", { ascending: false });
      if (fechaDesde) qPre = qPre.gte("fecha_salida", fechaDesde);
      if (fechaHasta) qPre = qPre.lte("fecha_salida", fechaHasta + "T23:59:59");
      const { data: pre } = await qPre;
      setDataPrestamos(pre ?? []);

    } catch (err) {
      console.error("Error cargando datos de reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fechaDesde, fechaHasta, formularioSeleccionado]);

  const estructuraTablas = {
    inventario: () => ({
      cabeceras: ["Clave", "Nombre", "Marca", "Categoría", "Ubicación", "Stock Total", "Disponible", "Mín.", "Estado"],
      filas: dataInventario.map((i) => [
        i.clave ?? "—",
        i.nombre ?? "—",
        i.marca ?? "—",
        (i.categorias as any)?.nombre ?? "—",
        i.ubicacion ?? "—",
        Number(i.stock_total || 0),
        Number(i.stock_disponible || 0),
        Number(i.stock_minimo || 0),
        cap(i.estado.replace(/_/g, " ")),
      ]),
    }),
    historial: () => ({
      cabeceras: ["ID", "Artículo", "Clave", "Tipo Movimiento", "Cantidad", "Stock Antes", "Stock Después", "Usuario", "Fecha", "Observaciones"],
      filas: dataHistorial.map((m) => [
        m.id,
        (m.inventario as any)?.nombre ?? "—",
        (m.inventario as any)?.clave ?? "—",
        cap(m.tipo_movimiento || "—"),
        Number(m.cantidad || 0),
        m.stock_antes !== null ? Number(m.stock_antes) : "—",
        m.stock_despues !== null ? Number(m.stock_despues) : "—",
        (m.usuarios as any)?.nombre_completo ?? "—",
        fmtFecha(m.fecha),
        m.observaciones ?? "—",
      ]),
    }),
    prestamos: () => ({
      cabeceras: ["ID", "Solicitante", "Departamento", "Autorizó", "Fecha Salida", "Fecha Devolución", "Estado", "Observaciones"],
      filas: dataPrestamos.map((p) => [
        p.id,
        (p.solicitante as any)?.nombre_completo ?? "Externo",
        (p.departamento as any)?.nombre ?? "—",
        (p.autorizador as any)?.nombre_completo ?? "—",
        fmtFecha(p.fecha_salida),
        fmtFecha(p.fecha_devolucion),
        cap(p.estado || "—"),
        p.observaciones ?? "—",
      ]),
    }),
    expedientes: () => ({
      cabeceras: ["Folio / ID", "Título de Trabajo", "Área Solicitante", "Máquina", "Responsable", "Apertura", "Estado"],
      filas: dataExpedientes.map((e) => [
        e.folio ?? `#${e.id}`,
        e.titulo ?? "—",
        e.area_solicitante ?? "—",
        e.maquina ?? "—",
        e.creador?.nombre_completo ?? "—",
        fmtFecha(e.fecha_apertura),
        cap(e.estado || "—").replace(/_/g, " "),
      ]),
    }),
  };

  const configs: Record<TipoReporte, {
    label: string;
    Icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
    titulo: () => string;
    fileName: () => string;
  }> = {
    inventario: {
      label: "Inventario",
      Icon: Package,
      color: "text-[#014ba0]",
      bgColor: "bg-[#014ba0]/5",
      borderColor: "border-[#014ba0]/20",
      titulo: () => "Reporte de Inventario General (Estado Actual)",
      fileName: () => `inventario_${new Date().toISOString().split("T")[0]}`,
    },
    historial: {
      label: "Historial de Movimientos",
      Icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      titulo: () =>
        fechaDesde && fechaHasta
          ? `Historial de Movimientos: ${fmtFecha(fechaDesde)} al ${fmtFecha(fechaHasta)}`
          : "Historial de Movimientos Completo",
      fileName: () => `historial_movimientos_${new Date().toISOString().split("T")[0]}`,
    },
    prestamos: {
      label: "Reporte de Préstamos",
      Icon: RefreshCw,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      titulo: () =>
        fechaDesde && fechaHasta
          ? `Reporte de Préstamos: ${fmtFecha(fechaDesde)} al ${fmtFecha(fechaHasta)}`
          : "Reporte de Préstamos Completo",
      fileName: () => `reporte_prestamos_${new Date().toISOString().split("T")[0]}`,
    },
    expedientes: {
      label: "Reporte de Expedientes y Formatos",
      Icon: ClipboardList,
      color: "text-[#004091]",
      bgColor: "bg-[#004091]/5",
      borderColor: "border-[#004091]/20",
      titulo: () => {
        const txtFormato = formularioSeleccionado === "todos" ? "Todos los Formatos" : `Formato: ${cap(formularioSeleccionado).replace(/_/g, " ")}`;
        return fechaDesde && fechaHasta
          ? `Auditoría - ${txtFormato}: ${fmtFecha(fechaDesde)} al ${fmtFecha(fechaHasta)}`
          : `Reporte Global - ${txtFormato}`;
      },
      fileName: () => `reporte_expedientes_${formularioSeleccionado}`,
    },
  };

  const handleExportar = async (tipo: TipoReporte, formato: "pdf" | "xls") => {
    setExportLoading(`${tipo}-${formato}`);
    try {
      const cfg = configs[tipo];
      const { cabeceras, filas } = estructuraTablas[tipo]();

      if (formato === "pdf") {
        await generarPDF(cfg.titulo(), cabeceras, filas, cfg.fileName());
      } else {
        await generarXLS(cfg.titulo(), cabeceras, filas, cfg.fileName());
      }
    } catch (err) {
      console.error(`Error exportando ${formato}:`, err);
      alert("Hubo un error procesando el archivo.");
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          
          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart2 size={28} className="text-[#004091]" />
              Centro de Reportes
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Exporta listados limpios, historiales, expedientes y auditorías en PDF o Excel estructurado.
            </p>
          </div>

          {/* Mosaico Estadístico */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Total artículos", val: stats.totalArticulos, Icon: Package, color: "text-slate-800", bg: "bg-white" },
              { label: "Unidades totales", val: stats.unidadesTotales, Icon: BarChart2, color: "text-[#014ba0]", bg: "bg-[#014ba0]/5" },
              { label: "Stock bajo", val: stats.stockBajo, Icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Préstamos activos", val: stats.prestamosActivos, Icon: RefreshCw, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Dados de baja", val: stats.dadosBaja, Icon: TrendingUp, color: "text-red-500", bg: "bg-red-50" },
              { label: "Total Filtrado", val: stats.totalExpedientes, Icon: ClipboardList, color: "text-[#004091]", bg: "bg-[#004091]/5" },
            ].map(({ label, val, Icon, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl border border-slate-100 shadow-sm p-5 transition-all duration-200`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className={`text-2xl font-black mt-2 ${color}`}>
                      {loading ? <Loader2 size={20} className="animate-spin" /> : val}
                    </p>
                  </div>
                  <Icon size={18} className={`${color} mt-1`} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Filtros Izquierdos */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Filtro por Fechas */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-[#014ba0]" />
                  Periodo de Búsqueda
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0] transition-all"
                    />
                  </div>
                  {(fechaDesde || fechaHasta) && (
                    <button
                      onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
                      className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 rounded-xl transition-colors duration-200"
                    >
                      Limpiar rango temporal
                    </button>
                  )}
                </div>
              </div>

              {/* Selector de Formularios Específicos */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Filter size={16} className="text-[#004091]" />
                  Especificar Formulario
                </h2>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Selecciona Plantilla</label>
                  <select
                    value={formularioSeleccionado}
                    onChange={(e) => {
                      setFormularioSeleccionado(e.target.value);
                      setTipoActivo("expedientes"); 
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#004091]/10 focus:border-[#004091] cursor-pointer transition-all"
                  >
                    <option value="todos">Todos los Formularios / Expedientes</option>
                    {listaFormularios.map((form) => (
                      <option key={form} value={form}>
                        {cap(form.replace(/_/g, " "))}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Menú de Módulos */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-[#014ba0]" />
                  Módulos Disponibles
                </h2>
                <div className="space-y-2">
                  {(Object.keys(configs) as TipoReporte[]).map((tipo) => {
                    const cfg = configs[tipo];
                    const Icon = cfg.Icon;
                    const activo = tipoActivo === tipo;
                    return (
                      <button
                        key={tipo}
                        onClick={() => setTipoActivo(tipo)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 ${
                          activo ? `${cfg.bgColor} ${cfg.borderColor} shadow-sm` : "bg-slate-50 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className={activo ? cfg.color : "text-slate-400"} />
                          <div>
                            <p className={`text-sm font-bold ${activo ? "text-slate-800" : "text-slate-600"}`}>{cfg.label}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{loading ? "..." : `${conteos[tipo]} registros`}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className={activo ? cfg.color : "text-slate-300"} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contenedor de Gestión Visual (Derecha) */}
            <div className="lg:col-span-2 space-y-4">
              {(Object.keys(configs) as TipoReporte[]).map((tipo) => {
                const cfg = configs[tipo];
                const Icon = cfg.Icon;
                const activo = tipoActivo === tipo;

                return (
                  <div
                    key={tipo}
                    className={`bg-white rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden ${
                      activo ? `${cfg.borderColor} shadow-md` : "border-slate-100 opacity-50 pointer-events-none"
                    }`}
                  >
                    <div className={`px-6 py-4 flex items-center justify-between transition-colors duration-200 ${activo ? cfg.bgColor : "bg-slate-50"}`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm">
                          <Icon size={18} className={cfg.color} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{cfg.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {loading ? "Sincronizando..." : `${conteos[tipo]} filas encontradas`}
                          </p>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`transition-transform duration-200 ${activo ? "rotate-180 " + cfg.color : "text-slate-300"}`} />
                    </div>

                    {activo && (
                      <div className="px-6 py-5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                          {tipo === "inventario" && "Reporte estático del catálogo actual en almacén. Muestra claves únicas, marcas asociadas, existencias y umbrales mínimos."}
                          {tipo === "historial" && "Auditoría de trazabilidad de insumos. Registra incrementos, mermas y reajustes con marcas temporales e identificación de usuario."}
                          {tipo === "prestamos" && "Listado pormenorizado del flujo de equipos o reactivos prestados hacia departamentos internos o agentes externos."}
                          {tipo === "expedientes" && (
                            formularioSeleccionado === "todos" 
                              ? "Índice de auditoría global de expedientes técnicos, solicitudes de mantenimiento, formatos y órdenes de servicio." 
                              : `Filtrado activo exclusivo para el formato corporativo: "${cap(formularioSeleccionado).replace(/_/g, " ")}".`
                          )}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Botón Exportación PDF */}
                          <button
                            onClick={() => handleExportar(tipo, "pdf")}
                            disabled={exportLoading !== null || conteos[tipo] === 0}
                            className="flex items-center justify-between gap-3 p-4 bg-[#014ba0] hover:bg-[#004091] disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all duration-200 shadow-sm disabled:shadow-none"
                          >
                            <span className="text-sm">Exportar Reporte PDF</span>
                            {exportLoading === `${tipo}-pdf` ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <FileText size={18} />
                            )}
                          </button>

                          {/* Botón Exportación Excel */}
                          <button
                            onClick={() => handleExportar(tipo, "xls")}
                            disabled={exportLoading !== null || conteos[tipo] === 0}
                            className="flex items-center justify-between gap-3 p-4 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 font-bold rounded-2xl transition-all duration-200 border border-slate-200 shadow-sm disabled:shadow-none"
                          >
                            <span className="text-sm">Exportar Matriz Excel</span>
                            {exportLoading === `${tipo}-xls` ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <BarChart2 size={18} />
                            )}
                          </button>
                        </div>

                        {/* Módulo de Vista Previa de Datos */}
                        <div className="mt-6 border-t border-slate-100 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Muestra Temporal de Registros
                            </h3>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                              {conteos[tipo]} disponibles
                            </span>
                          </div>

                          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-slate-50/50">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                  {estructuraTablas[tipo]().cabeceras.slice(0, 4).map((cabecera) => (
                                    <th key={cabecera} className="p-3.5 text-xs font-bold text-slate-500 whitespace-nowrap">
                                      {cabecera}
                                    </th>
                                  ))}
                                  {tipo === "expedientes" && (
                                    <th className="p-3.5 text-xs font-bold text-slate-500 text-center whitespace-nowrap">
                                      Dossier
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {conteos[tipo] === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={tipo === "expedientes" ? 5 : 4}
                                      className="p-8 text-center text-sm font-medium text-slate-400 italic"
                                    >
                                      Ningún registro coincide con el rango de fechas seleccionado.
                                    </td>
                                  </tr>
                                ) : (
                                  estructuraTablas[tipo]().filas.slice(0, 5).map((fila, indexFila) => (
                                    <tr
                                      key={indexFila}
                                      className="border-b border-slate-100 last:border-none hover:bg-white transition-colors duration-150"
                                    >
                                      {fila.slice(0, 4).map((celda, indexCelda) => (
                                        <td key={indexCelda} className="p-3.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                                          {celda}
                                        </td>
                                      ))}
                                      {tipo === "expedientes" && (
                                        <td className="p-2 text-center whitespace-nowrap">
                                          <button
                                            onClick={() => generarPDFExpediente(dataExpedientes[indexFila])}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#014ba0]/10 text-[#014ba0] hover:bg-[#014ba0]/20 rounded-xl text-xs font-bold transition-all duration-200"
                                          >
                                            <FileText size={13} />
                                            Ficha PDF
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          
                          {conteos[tipo] > 5 && (
                            <p className="text-[11px] text-slate-400 font-medium italic mt-3 text-right">
                              * Mostrando una vista previa de los primeros 5 elementos. La exportación final procesará el total de las filas.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}