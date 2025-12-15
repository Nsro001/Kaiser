import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, FileText, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ItemCotizacion {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
}

interface Cliente {
  nombre: string;
  rut: string;
}

interface Cotizacion {
  id: string;
  numero: string;
  cliente: Cliente | null;
  items: ItemCotizacion[];
  subtotal: number;
  iva: number;
  total: number;
  fecha: string;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'expirada';
  margen: number;
  flete: number;
  incluirFlete: boolean;
  resumenNacionalTotales?: {
    neto: number;
    iva: number;
    total: number;
    valorNetoRent?: number;
    valorIvaRent?: number;
    valorBrutoRent?: number;
    fleteIntl?: number;
    fleteNac?: number;
  };
  fleteInternacionalDistribuido?: number;
}

type Venta = {
  id: string;
  numero: string;
  fecha: string;
  cliente: string;
  totalVenta: number;
  costoTotal: number;
  margenTotal: number;
  iva: number;
  flete: number;
};

const formatearCLP = (valor: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(valor || 0);

export default function EstadoResultados() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);

  useEffect(() => {
    const guardadas = JSON.parse(localStorage.getItem('cotizaciones') || '[]');

    const normalizadas = (guardadas as Cotizacion[]).map((c) => {
      let estado = c.estado as Cotizacion['estado'] | 'aceptada';

      if (estado === 'aceptada') {
        estado = 'aprobada';
      }

      return { ...c, estado };
    });

    setCotizaciones(normalizadas);
  }, []);

  const ventas: Venta[] = useMemo(() => {
    return (cotizaciones || [])
      .filter((c) => c.estado === 'aprobada')
      .map((c) => {
        // Costo total: usa costo proveedor si está, si no costoCompra por item, si no precio
        const items = c.items || [];
        const productosAprobados = Array.isArray((c as any).productosAprobados)
          ? (c as any).productosAprobados
          : [];
        const costoProveedorTotal = Number((c as any).costoProveedorTotal || 0);
        const costoAprobados = productosAprobados.reduce(
          (acc: number, it: any) => acc + Number(it?.valorNetoProveedor || 0),
          0
        );
        const costoItems = items.reduce(
          (acc, item: any) =>
            acc +
            (Number(item?.costoCompra ?? item?.precio ?? 0) * Number(item?.cantidad ?? 0)),
          0
        );
        const costoTotal =
          costoProveedorTotal > 0
            ? costoProveedorTotal
            : costoAprobados > 0
              ? costoAprobados
              : costoItems;

        // Margen calculado desde el costo
        const margenCalculado = items.reduce((acc, it: any) => {
          const pct =
            Number.isFinite(it?.margenItem) ? Number(it.margenItem) : Number((c as any)?.margen ?? 0);
          const ctoFin = Number.isFinite(it?.ctoFinanciero) ? Number(it.ctoFinanciero) : 0;
          const totalPct = (pct + ctoFin) / 100;
          const costo = (Number(it?.costoCompra ?? it?.precio ?? 0) * Number(it?.cantidad ?? 0)) || 0;
          if (totalPct >= 1 || totalPct < 0) return acc;
          const margenItem = costo * (totalPct / (1 - totalPct));
          return acc + margenItem;
        }, 0);

        const margenTotal = margenCalculado > 0 ? margenCalculado : c.subtotal - costoTotal;

        return {
          id: c.id,
          numero: c.numero,
          fecha: c.fecha,
          cliente: c.cliente?.nombre || 'Sin cliente',
          totalVenta: c.total,
          costoTotal,
          margenTotal,
          iva: c.iva,
          flete: c.flete || 0,
        };
      });
  }, [cotizaciones]);

  const resumen = useMemo(() => {
    return ventas.reduce(
      (acc, v) => {
        acc.totalVentas += v.totalVenta;
        acc.totalCostos += v.costoTotal;
        acc.totalMargen += v.margenTotal;
        acc.totalIva += v.iva;
        acc.totalFlete += v.flete;
        return acc;
      },
      {
        totalVentas: 0,
        totalCostos: 0,
        totalMargen: 0,
        totalIva: 0,
        totalFlete: 0,
      }
    );
  }, [ventas]);

  // Utilidades separadas
  const utilidades = useMemo(() => {
    let netoAntes = 0;
    let netoDespues = 0;
    let fleteIntlCosto = 0;
    let fleteNacCosto = 0;
    let fleteAplicadoTotal = 0;
    let fleteAplicadoIntl = 0;

    cotizaciones
      .filter((c) => c.estado === 'aprobada')
      .forEach((c) => {
        const items = c.items || [];
        const productosAprobados = Array.isArray((c as any).productosAprobados)
          ? (c as any).productosAprobados
          : [];
        const costoBaseProveedor =
          Number((c as any).costoProveedorTotal || 0) > 0
            ? Number((c as any).costoProveedorTotal)
            : productosAprobados.reduce((s: number, it: any) => s + Number(it?.valorNetoProveedor || 0), 0);
        // Valor neto antes del margen: usa valorNetoProveedor si está presente; si no, costoCompra*cantidad (o precio)
        const costoBase =
          costoBaseProveedor > 0
            ? costoBaseProveedor
            : items.reduce(
                (s, it: any) =>
                  s + (Number(it.costoCompra ?? it.precio ?? 0) * Number(it.cantidad ?? 0)),
                0
              );
        netoAntes += costoBase;

        // Valor neto después del margen (rent): (Valor bruto - IVA rent)
        const brutoRentRaw = (c as any)?.resumenNacionalTotales?.valorBrutoRent;
        const totalRentRaw = (c as any)?.resumenNacionalTotales?.total;
        const brutoRent = Number(
          brutoRentRaw ?? (totalRentRaw ?? 0)
        );
        const ivaRentRaw = (c as any)?.resumenNacionalTotales?.valorIvaRent;
        const ivaRentFallback = (c as any)?.resumenNacionalTotales?.iva;
        const ivaRent = Number(
          ivaRentRaw ?? (ivaRentFallback ?? 0)
        );
        const netoRent =
          brutoRent > 0 && ivaRent >= 0
            ? brutoRent - ivaRent
            : Number(c.subtotal || 0);
        netoDespues += netoRent;

        const intlItems = Array.isArray((c as any).fleteInternacionalItems)
          ? (c as any).fleteInternacionalItems
          : [];
        const nacItems = Array.isArray((c as any).fleteNacionalItems)
          ? (c as any).fleteNacionalItems
          : [];

        const intlSinFactura = intlItems.reduce((s: number, it: any) => {
          const desc = (it?.descripcion || '').toLowerCase();
          if (desc.includes('factura') && desc.includes('proveedor')) return s;
          return s + Number(it?.valorEstimado || 0);
        }, 0);
        const totalNac = nacItems.reduce(
          (s: number, it: any) => s + Number(it?.valorEstimado || 0),
          0
        );

        fleteIntlCosto += intlSinFactura;
        fleteNacCosto += totalNac;
        const fleteConMargen =
          Number((c as any)?.resumenNacionalTotales?.flete ?? c.flete ?? 0);
        const fleteIntlAplicado =
          Number((c as any)?.fleteInternacionalDistribuido ??
            (c as any)?.fleteInternacionalAplicado ??
            fleteConMargen);
        fleteAplicadoTotal += fleteConMargen;
        fleteAplicadoIntl += fleteIntlAplicado;
      });

    const utilNeto = netoDespues - netoAntes;
    const utilNetoIVA = utilNeto * 0.19;
    const utilNetoBruto = utilNeto + utilNetoIVA;

    // Flete internacional con margen: se muestra el total aplicado (no utilidad).
    // Utilidad de flete internacional: si el aplicado es igual al costo (datos antiguos sin markup),
    // usa el porcentaje de margen/financiero como respaldo para estimar la utilidad como en la hoja.
    const calcularPctFlete = () => {
      // Toma margen global y promedio de cto financiero por item (si existe).
      const margenGlobal = Number((cotizaciones[0] as any)?.margen ?? 0);
      let sumaPct = 0;
      let sumaPeso = 0;
      (cotizaciones[0]?.items || []).forEach((it: any) => {
        const pct = Number(it?.margenItem ?? margenGlobal) + Number(it?.ctoFinanciero ?? 0);
        const peso = Number(it?.costoCompra ?? it?.precio ?? 0) * Number(it?.cantidad ?? 1);
        sumaPct += pct * (peso || 1);
        sumaPeso += peso || 1;
      });
      const pctProm = sumaPeso > 0 ? sumaPct / sumaPeso : margenGlobal;
      return pctProm / 100;
    };

    const rawUtilFleteIntl = fleteAplicadoIntl - fleteIntlCosto;
    const pctFallback = calcularPctFlete();
    const shouldEstim = fleteIntlCosto > 0 && pctFallback > 0 && (fleteAplicadoIntl <= 0 || Math.abs(rawUtilFleteIntl) < 1);
    const utilEstimado = shouldEstim
      ? (fleteIntlCosto / (1 - pctFallback)) - fleteIntlCosto
      : rawUtilFleteIntl;

    const utilFleteIntl = utilEstimado;
    const utilFleteIntlIVA = Math.round(utilFleteIntl * 0.19);
    const utilFleteIntlBruto = utilFleteIntl + utilFleteIntlIVA;

    const utilFleteNac = fleteAplicadoTotal - fleteNacCosto;
    const utilFleteNacIVA = utilFleteNac * 0.19;
    const utilFleteNacBruto = utilFleteNac + utilFleteNacIVA;

    return {
      neto: { neto: utilNeto, iva: utilNetoIVA, bruto: utilNetoBruto },
      fleteIntl: { neto: utilFleteIntl, iva: utilFleteIntlIVA, bruto: utilFleteIntlBruto },
      fleteNac: { neto: utilFleteNac, iva: utilFleteNacIVA, bruto: utilFleteNacBruto },
    };
  }, [cotizaciones]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="max-w-6xl mx-auto w-full py-8 px-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Registro de Ventas</h1>
            <p className="text-sm text-slate-500">
              Resumen de cotizaciones aprobadas: costos, márgenes y totales.
            </p>
          </div>
          <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">
            Volver al dashboard
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase">
                Total Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">
                {formatearCLP(resumen.totalVentas)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase">
                Costos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">
                {formatearCLP(resumen.totalCostos)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase">
                Margen Bruto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-emerald-700">
                {formatearCLP(resumen.totalMargen)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase">
                IVA Calculado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">
                {formatearCLP(resumen.totalIva)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Detalle de Ventas (Cotizaciones Aprobadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ventas.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no hay cotizaciones aprobadas. Cambia el estado de una cotización a
                <span className="font-semibold"> "aprobada"</span> para que aparezca aquí.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total Venta</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Margen</TableHead>
                    <TableHead>IVA</TableHead>
                    <TableHead>Flete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        {new Date(v.fecha).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="font-medium">{v.numero}</TableCell>
                      <TableCell>{v.cliente}</TableCell>
                      <TableCell>{formatearCLP(v.totalVenta)}</TableCell>
                      <TableCell>{formatearCLP(v.costoTotal)}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-700">
                          {formatearCLP(v.margenTotal)}
                        </span>
                      </TableCell>
                      <TableCell>{formatearCLP(v.iva)}</TableCell>
                      <TableCell>{formatearCLP(v.flete)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Módulo de Pago y Facturación SII (Próximamente)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Integración pendiente</AlertTitle>
              <AlertDescription>
                Aquí se mostrará el estado de pago de las cotizaciones aprobadas y la
                integración con la facturación electrónica del SII. Por ahora, este módulo
                es solo informativo y no realiza conexiones reales.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-slate-600">
              Cuando una cotización esté en estado <span className="align-middle"><Badge>aprobada</Badge></span>, se considerará
              lista para pago y emisión de factura. En una siguiente fase se conectará este
              panel con un proveedor de facturación electrónica o la API del SII.
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Margen de compra productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">Totales</TableCell>
                    <TableCell className="text-right">{formatearCLP(resumen.totalCostos)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-yellow-300" style={{ background: "#fffbe6" }}>
            <CardHeader>
              <CardTitle className="text-center">UTILIDAD</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valor Neto</TableHead>
                    <TableHead>Valor IVA</TableHead>
                    <TableHead>Valor C IVA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{formatearCLP(utilidades.neto.neto)}</TableCell>
                    <TableCell>{formatearCLP(utilidades.neto.iva)}</TableCell>
                    <TableCell>{formatearCLP(utilidades.neto.bruto)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de flete internacional por producto</CardTitle>
            </CardHeader>
            <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">FLETE INTERNACIONAL</TableCell>
                <TableCell className="text-right">{formatearCLP(utilidades.fleteIntl.neto)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Totales</TableCell>
                <TableCell className="text-right">{formatearCLP(utilidades.fleteIntl.neto)}</TableCell>
              </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">UTILIDAD</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valor Neto</TableHead>
                    <TableHead>Valor IVA</TableHead>
                    <TableHead>Valor C IVA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{formatearCLP(utilidades.fleteIntl.neto)}</TableCell>
                    <TableCell>{formatearCLP(utilidades.fleteIntl.iva)}</TableCell>
                    <TableCell>{formatearCLP(utilidades.fleteIntl.bruto)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de flete nacional por producto</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">FLETE NACIONAL</TableCell>
                    <TableCell className="text-right">{formatearCLP(utilidades.fleteNac.neto)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Totales</TableCell>
                    <TableCell className="text-right">{formatearCLP(utilidades.fleteNac.neto)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">UTILIDAD</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valor Neto</TableHead>
                    <TableHead>Valor IVA</TableHead>
                    <TableHead>Valor C IVA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{formatearCLP(utilidades.fleteNac.neto)}</TableCell>
                    <TableCell>{formatearCLP(utilidades.fleteNac.iva)}</TableCell>
                    <TableCell>{formatearCLP(utilidades.fleteNac.bruto)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
