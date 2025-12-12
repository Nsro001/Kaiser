import React, { useEffect, useMemo, useState } from "react";

// Tipos contables
interface CuentaContable {
  nombre: string;
  debe: number;
  haber: number;
  saldo: number; // Debe - Haber
}

interface AsientoContable {
  titulo: string;
  cuentas: CuentaContable[];
  totalDebe: number;
  totalHaber: number;
  diferencia: number; // totalDebe - totalHaber (debe cuadrar a 0)
}

interface FlujoMensual {
  mes: number;
  concepto: string;
  monto: number;
}

// Helpers de formato
const fmt = (v: number) =>
  v.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Cálculos puros
const calcularCompraProducto = (neto: number): AsientoContable => {
  const iva = neto * 0.19;
  const total = neto + iva;

  const cuentas: CuentaContable[] = [
    { nombre: "Costo de Venta", debe: neto, haber: 0, saldo: neto },
    { nombre: "IVA Crédito Fiscal", debe: iva, haber: 0, saldo: iva },
    { nombre: "Proveedores", debe: 0, haber: total, saldo: -total },
  ];

  const totalDebe = neto + iva;
  const totalHaber = total;

  return {
    titulo: "Compra de producto",
    cuentas,
    totalDebe,
    totalHaber,
    diferencia: totalDebe - totalHaber,
  };
};

const calcularFlete = (neto: number): AsientoContable => {
  const iva = neto * 0.19;
  const total = neto + iva;

  const cuentas: CuentaContable[] = [
    { nombre: "Gastos por Flete", debe: neto, haber: 0, saldo: neto },
    { nombre: "IVA Crédito Fiscal", debe: iva, haber: 0, saldo: iva },
    { nombre: "Proveedores", debe: 0, haber: total, saldo: -total },
  ];

  const totalDebe = neto + iva;
  const totalHaber = total;

  return {
    titulo: "Costo de flete",
    cuentas,
    totalDebe,
    totalHaber,
    diferencia: totalDebe - totalHaber,
  };
};

const calcularVenta = (ingresoNeto: number): AsientoContable => {
  const neto = Math.round(ingresoNeto);
  const ivaDebito = Math.round(neto * 0.19);
  // Forzamos cliente al piso para reproducir el desfase observado (ej. 229.496 vs 229.497).
  const clienteDebe = Math.floor(neto + ivaDebito);
  const cuentas: CuentaContable[] = [
    { nombre: "Cliente", debe: clienteDebe, haber: 0, saldo: clienteDebe },
    { nombre: "Ingreso por Venta", debe: 0, haber: neto, saldo: -neto },
    { nombre: "IVA Débito Fiscal", debe: 0, haber: ivaDebito, saldo: -ivaDebito },
  ];

  const totalDebe = clienteDebe;
  const totalHaber = neto + ivaDebito;

  return {
    titulo: "Venta",
    cuentas,
    totalDebe,
    totalHaber,
    diferencia: totalDebe - totalHaber,
  };
};

const calcularFlujo = (netoCompra: number, netoFlete: number, totalVenta: number, ivaVenta: number): { flujos: FlujoMensual[]; total: number } => {
  const flujos: FlujoMensual[] = [
    { mes: 1, concepto: "Compra producto (salida)", monto: -(netoCompra + netoCompra * 0.19) },
    { mes: 2, concepto: "IVA crédito compra (entrada)", monto: netoCompra * 0.19 },
    { mes: 4, concepto: "Pago flete (salida)", monto: -(netoFlete + netoFlete * 0.19) },
    { mes: 5, concepto: "Cobro venta (entrada)", monto: totalVenta },
    { mes: 6, concepto: "Pago IVA débito (salida)", monto: -ivaVenta },
  ];

  const total = flujos.reduce((acc, f) => acc + f.monto, 0);
  return { flujos, total };
};

const TablaAsiento: React.FC<{ asiento: AsientoContable }> = ({ asiento }) => (
  <div className="rounded border p-4 space-y-3 bg-white">
    <h2 className="text-lg font-semibold">{asiento.titulo}</h2>
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-100">
          <th className="text-left p-2 border">Cuenta</th>
          <th className="text-right p-2 border">Debe</th>
          <th className="text-right p-2 border">Haber</th>
          <th className="text-right p-2 border">Saldo</th>
        </tr>
      </thead>
      <tbody>
        {asiento.cuentas.map((c) => (
          <tr key={c.nombre}>
            <td className="p-2 border">{c.nombre}</td>
            <td className="p-2 border text-right">{fmt(c.debe)}</td>
            <td className="p-2 border text-right">{fmt(c.haber)}</td>
            <td className="p-2 border text-right">{fmt(c.saldo)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-semibold bg-slate-50">
          <td className="p-2 border">Totales</td>
          <td className="p-2 border text-right">{fmt(asiento.totalDebe)}</td>
          <td className="p-2 border text-right">{fmt(asiento.totalHaber)}</td>
          <td className="p-2 border text-right">{fmt(asiento.diferencia)}</td>
        </tr>
      </tfoot>
    </table>
    {asiento.diferencia !== 0 && (
      <p className="text-xs text-red-600">
        Diferencia detectada (Totales Debe - Totales Haber = {fmt(asiento.diferencia)}). Revisar origen/redondeos.
      </p>
    )}
  </div>
);

const TablaFlujo: React.FC<{ flujos: FlujoMensual[]; total: number }> = ({ flujos, total }) => (
  <div className="rounded border p-4 space-y-3 bg-white">
    <h2 className="text-lg font-semibold">Flujo mensual (12 meses)</h2>
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-100">
          <th className="text-left p-2 border">Mes</th>
          <th className="text-left p-2 border">Concepto</th>
          <th className="text-right p-2 border">Monto</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 12 }, (_, i) => {
          const mes = i + 1;
          const registros = flujos.filter((f) => f.mes === mes);
          return registros.length === 0 ? (
            <tr key={mes}>
              <td className="p-2 border">{mes}</td>
              <td className="p-2 border text-slate-500">-</td>
              <td className="p-2 border text-right text-slate-500">0</td>
            </tr>
          ) : (
            registros.map((f, idx) => (
              <tr key={`${mes}-${idx}`}>
                <td className="p-2 border">{mes}</td>
                <td className="p-2 border">{f.concepto}</td>
                <td className="p-2 border text-right">{fmt(f.monto)}</td>
              </tr>
            ))
          );
        })}
      </tbody>
      <tfoot>
        <tr className="font-semibold bg-slate-50">
          <td className="p-2 border" colSpan={2}>
            Total flujos
          </td>
          <td className="p-2 border text-right">{fmt(total)}</td>
        </tr>
        <tr className="font-semibold bg-slate-50">
          <td className="p-2 border" colSpan={2}>
            Rentabilidad flujo (utilidad simulada)
          </td>
          <td className="p-2 border text-right">{fmt(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>
);

const ContabilizacionOC: React.FC = () => {
  const [totales, setTotales] = useState({
    netoCompra: 0,
    netoFlete: 0,
    netoVenta: 0,
    ivaVenta: 0,
    totalVenta: 0,
  });

  useEffect(() => {
    const guardadasRaw = localStorage.getItem("cotizaciones");
    const guardadas = guardadasRaw ? JSON.parse(guardadasRaw) : [];

    const normalizadas = (guardadas || []).map((c: any) => {
      const est = (c.estado || "").toString().toLowerCase();
      let estado = est;
      if (estado === "aceptada" || estado === "aprobado" || estado === "aprobada") {
        estado = "aprobada";
      }

      const fleteIntl = Array.isArray(c.fleteInternacionalItems) ? c.fleteInternacionalItems : [];
      const fleteNac = Array.isArray(c.fleteNacionalItems) ? c.fleteNacionalItems : [];

      const subtotal = Number(c.subtotal || 0);
      const iva = Number.isFinite(c.iva) ? Number(c.iva) : Math.round(subtotal * 0.19);
      const total = Number.isFinite(c.total) ? Number(c.total) : subtotal + iva;

      return {
        ...c,
        estado,
        fleteInternacionalItems: fleteIntl,
        fleteNacionalItems: fleteNac,
        subtotal,
        iva,
        total,
      };
    });

    const aprobadas = normalizadas.filter((c: any) => c.estado === "aprobada");

    const netoCompra = aprobadas.reduce((acc: number, c: any) => {
      const items = c.items || [];
      const costo = items.reduce(
        (s: number, it: any) => s + Number(it.costoCompra || 0) * Number(it.cantidad || 0),
        0
      );
      return acc + costo;
    }, 0);

    const netoFlete = aprobadas.reduce((acc: number, c: any) => {
      const intlItems = Array.isArray(c.fleteInternacionalItems) ? c.fleteInternacionalItems : [];
      const nacItems = Array.isArray(c.fleteNacionalItems) ? c.fleteNacionalItems : [];

      const totalIntl = intlItems.reduce((s: number, it: any) => s + Number(it?.valorEstimado || 0), 0);
      const intlSinFactura = intlItems.reduce((s: number, it: any) => {
        const desc = (it?.descripcion || "").toLowerCase().trim();
        if (desc.includes("factura") && desc.includes("proveedor")) {
          return s; // excluimos Factura Proveedor
        }
        return s + Number(it?.valorEstimado || 0);
      }, 0);

      const totalNac = nacItems.reduce((s: number, it: any) => s + Number(it?.valorEstimado || 0), 0);

      const fallbackFlete = Number(c.flete || 0);
      const neto = intlSinFactura + totalNac;
      return acc + (neto !== 0 ? neto : fallbackFlete);
    }, 0);
    const netoVenta = aprobadas.reduce((acc: number, c: any) => {
      const netoNac = Number(c?.resumenNacionalTotales?.neto || 0);
      const neto = netoNac > 0 ? netoNac : Number(c.subtotal || 0);
      return acc + neto;
    }, 0);
    const ivaVenta = aprobadas.reduce((acc: number, c: any) => {
      const ivaNac = Number(c?.resumenNacionalTotales?.iva || 0);
      if (ivaNac > 0) return acc + ivaNac;
      const neto = Number(c.subtotal || 0);
      return acc + Math.round(neto * 0.19);
    }, 0);
    const totalVenta = netoVenta + ivaVenta;

    setTotales({ netoCompra, netoFlete, netoVenta, ivaVenta, totalVenta });
  }, []);

  const compra = useMemo(() => calcularCompraProducto(totales.netoCompra), [totales.netoCompra]);
  const flete = useMemo(() => calcularFlete(totales.netoFlete), [totales.netoFlete]);
  const venta = useMemo(() => calcularVenta(totales.netoVenta), [totales.netoVenta]);
  const { flujos, total } = useMemo(
    () => calcularFlujo(totales.netoCompra, totales.netoFlete, totales.totalVenta, totales.ivaVenta),
    [totales.netoCompra, totales.netoFlete, totales.totalVenta, totales.ivaVenta]
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Contabilización OC (simulación)</h1>
      <p className="text-sm text-slate-600">
        Modelo contable basado en datos de ejemplo entregados. IVA = total * 0.19. Saldo = Debe - Haber. Las
        diferencias se muestran si no cuadran por redondeos de origen.
      </p>
      {totales.totalVenta === 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
          No hay cotizaciones aprobadas en localStorage (estados aceptada/aprobada). Guarda alguna como aprobada y recarga.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TablaAsiento asiento={compra} />
        <TablaAsiento asiento={flete} />
        <TablaAsiento asiento={venta} />
      </div>

      <TablaFlujo flujos={flujos} total={total} />
    </div>
  );
};

export default ContabilizacionOC;
