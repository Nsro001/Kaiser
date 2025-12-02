import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, FileText, CreditCard } from 'lucide-react';

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
        // Costo total = suma de precio base * cantidad
        const costoTotal = (c.items || []).reduce(
          (acc, item) => acc + item.precio * item.cantidad,
          0
        );

        // Margen calculado desde el costo
        const margenTotal = c.subtotal - costoTotal;

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
            <p className="text-sm text-slate-600">
              Cuando una cotización esté en estado <Badge>aprobada</Badge>, se considerará
              lista para pago y emisión de factura. En una siguiente fase se conectará este
              panel con un proveedor de facturación electrónica o la API del SII.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
