"use client";

import { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Download, FileSpreadsheet, Loader2, Calendar } from "lucide-react";

export default function ComponentesExportacion({ 
  dataInventario, 
  dataMovimientos, 
  dataPrestamos,
  rangoFechas 
}: { 
  dataInventario: any[], 
  dataMovimientos: any[], 
  dataPrestamos: any[],
  rangoFechas: { desde: string, hasta: string } 
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const generarExcel = async (tipo: 'inventario' | 'movimientos' | 'prestamos') => {
    const workbook = new ExcelJS.Workbook();
    const nombreArchivo = `${tipo}_${rangoFechas.desde || 'completo'}_al_${rangoFechas.hasta || 'hoy'}`;
    
    if (tipo === 'inventario') {
      const ws = workbook.addWorksheet("Inventario Actual");
      ws.columns = [
        { header: "CLAVE", key: "clave", width: 15 },
        { header: "NOMBRE", key: "nombre", width: 30 },
        { header: "STOCK TOTAL", key: "total", width: 15 },
        { header: "DISPONIBLE", key: "disponible", width: 15 },
        { header: "ESTADO", key: "estado", width: 15 }
      ];
      dataInventario.forEach(i => ws.addRow({
        clave: i.clave, nombre: i.nombre, total: i.stock_total, disponible: i.stock_disponible, estado: i.estado
      }));
    } 
    
    if (tipo === 'movimientos') {
      const ws = workbook.addWorksheet("Historial de Movimientos");
      ws.columns = [
        { header: "FECHA", key: "fecha", width: 20 },
        { header: "ARTÍCULO", key: "articulo", width: 30 },
        { header: "TIPO", key: "tipo", width: 15 },
        { header: "CANTIDAD", key: "cant", width: 12 },
        { header: "USUARIO", key: "user", width: 25 }
      ];
      dataMovimientos.forEach(m => ws.addRow({
        fecha: new Date(m.fecha).toLocaleString(), articulo: m.inventario?.nombre, tipo: m.tipo_movimiento, cant: m.cantidad, user: m.usuarios?.nombre_completo
      }));
    }

    if (tipo === 'prestamos') {
      const ws = workbook.addWorksheet("Reporte de Préstamos");
      ws.columns = [
        { header: "FECHA SALIDA", key: "salida", width: 20 },
        { header: "SOLICITANTE", key: "quien", width: 30 },
        { header: "ESTADO", key: "estado", width: 15 },
        { header: "OBSERVACIONES", key: "obs", width: 40 }
      ];
      dataPrestamos.forEach(p => ws.addRow({
        salida: new Date(p.fecha_salida).toLocaleString(), quien: p.solicitante_externo || p.usuarios?.nombre_completo, estado: p.estado, obs: p.observaciones
      }));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${nombreArchivo}.xlsx`);
  };

  if (!isClient) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button onClick={() => generarExcel('inventario')} className="flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100 transition-all">
        <FileSpreadsheet className="text-blue-600" />
        <div className="text-left"><p className="text-sm font-bold text-slate-800">Inventario</p><p className="text-[10px] text-slate-500">Stock actual completo</p></div>
      </button>

      <button onClick={() => generarExcel('movimientos')} className="flex items-center gap-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 transition-all">
        <FileSpreadsheet className="text-emerald-600" />
        <div className="text-left"><p className="text-sm font-bold text-slate-800">Movimientos</p><p className="text-[10px] text-slate-500">Entradas, salidas y ajustes</p></div>
      </button>

      <button onClick={() => generarExcel('prestamos')} className="flex items-center gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 transition-all">
        <FileSpreadsheet className="text-amber-600" />
        <div className="text-left"><p className="text-sm font-bold text-slate-800">Préstamos</p><p className="text-[10px] text-slate-500">Historial de préstamos</p></div>
      </button>
    </div>
  );
}