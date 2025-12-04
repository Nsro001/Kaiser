
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  Package,
  Building2,
  Briefcase,
  ClipboardList,
  BarChart3,
  StickyNote, 
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Cotizacion {
  id: string;
  numero: string;
  cliente: {
    nombre: string;
    email: string;
    rut: string;
  } | null;
  items: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    total: number;
  }>;
  subtotal: number;
  iva: number;
  total: number;
  fecha: string;
  estado: string;
  margen?: number;
}

type DashboardEstadoId =
  | 'aprobada'
  | 'revisar'
  | 'en-proceso'
  | 'rechazada'
  | 'descartada'
  | 'expirada';

type EstadoStats = {
  total: number;
  cantidad: number;
};

const ESTADOS_CONFIG: { id: DashboardEstadoId; titulo: string; color: string; badge: string }[] = [
  { id: 'aprobada', titulo: 'Aprobada', color: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 'revisar', titulo: 'Revisar', color: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
  { id: 'en-proceso', titulo: 'En Proceso', color: 'bg-sky-50', badge: 'bg-sky-100 text-sky-800' },
  { id: 'rechazada', titulo: 'Rechazada', color: 'bg-rose-50', badge: 'bg-rose-100 text-rose-800' },
  { id: 'descartada', titulo: 'Descartada', color: 'bg-violet-50', badge: 'bg-violet-100 text-violet-800' },
  { id: 'expirada', titulo: 'Expirada', color: 'bg-slate-50', badge: 'bg-slate-100 text-slate-800' },
];

function mapEstadoCotizacionToDashboardId(estado: string): DashboardEstadoId | null {
  switch (estado) {
    case 'aprobada':
      return 'aprobada';
    case 'aceptada':
      return 'aprobada';
    case 'rechazada':
      return 'rechazada';
    case 'borrador':
      return 'revisar';
    case 'enviada':
      return 'en-proceso';
    default:
      return null;
  }
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Index() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);

  useEffect(() => {
    const guardadas = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    setCotizaciones(guardadas);
  }, []);

  const { estadosStats, totalGeneral, cantidadTotal, margenPromedio } = useMemo(() => {
    const baseStats: Record<DashboardEstadoId, EstadoStats> = {
      'aprobada': { total: 0, cantidad: 0 },
      'revisar': { total: 0, cantidad: 0 },
      'en-proceso': { total: 0, cantidad: 0 },
      'rechazada': { total: 0, cantidad: 0 },
      'descartada': { total: 0, cantidad: 0 },
      'expirada': { total: 0, cantidad: 0 },
    };

    let total = 0;
    let count = 0;
    let sumaMargen = 0;
    let countMargen = 0;

    (cotizaciones || []).forEach((c) => {
      total += c.total || 0;
      count += 1;
      if (typeof c.margen === 'number') {
        sumaMargen += c.margen;
        countMargen += 1;
      }

      const mapped = mapEstadoCotizacionToDashboardId(c.estado);
      if (mapped) {
        baseStats[mapped].total += c.total || 0;
        baseStats[mapped].cantidad += 1;
      }
    });

    return {
      estadosStats: baseStats,
      totalGeneral: total,
      cantidadTotal: count,
      margenPromedio: countMargen > 0 ? sumaMargen / countMargen : 0,
    };
  }, [cotizaciones]);

  const chartData = ESTADOS_CONFIG.map((estado) => ({
    nombre: estado.titulo,
    valor: estadosStats[estado.id].total,
    cantidad: estadosStats[estado.id].cantidad,
  }));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <img
            src="/kaiser-logo.png"
            alt="Káiser Ingeniería"
            className="h-10 object-contain"
          />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 text-sm">
          <SidebarLink to="/" icon={BarChart3} label="Dashboard" active />
          <SidebarLink to="/cotizaciones" icon={FileText} label="Cotizaciones" />
          <SidebarLink to="/estado-resultados" icon={StickyNote} label="Estado de Resultados" />
          <SidebarLink to="/crear-cotizacion" icon={ClipboardList} label="Nueva Cotización" />
          <SidebarLink to="/clientes" icon={Users} label="Clientes" />
          <SidebarLink to="/servicios-productos" icon={Package} label="Servicios / Productos" />
          <SidebarLink to="/proveedores" icon={Building2} label="Proveedores" />
          <SidebarLink to="/ordenes-compra" icon={Briefcase} label="Órdenes de Compra" />
          <SidebarLink to="/ordenes-trabajo" icon={Briefcase} label="Órdenes de Trabajo" />
          <SidebarLink to="/facturacion-sii" icon={FileText}  label="Facturación SII" 
/>
        </nav>

        <div className="px-4 py-4 border-t text-xs text-slate-500 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span>Sistema de Cotizaciones</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dashboard de Cotizaciones</h1>
            <p className="text-sm text-slate-500">
              Resumen general de valores, estados y comportamiento de tus cotizaciones.
            </p>
          </div>
          <Link to="/crear-cotizacion">
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm">
              Crear Cotización
            </Button>
          </Link>
        </header>

        {/* Dashboard grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPIs principales */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-emerald-100 bg-emerald-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">
                  Valor total cotizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCLP(totalGeneral)}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Incluye todas las cotizaciones registradas en el sistema.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">
                  Cantidad de cotizaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-900">
                  {cantidadTotal}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Total de cotizaciones creadas hasta ahora.
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">
                  Margen promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-900">
                  {margenPromedio.toFixed(1)}%
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Basado en las cotizaciones que tienen margen definido.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tarjetas por estado */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {ESTADOS_CONFIG.map((estado) => {
              const stats = estadosStats[estado.id];
              return (
                <Card key={estado.id} className={estado.color}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${estado.badge}`}>
                        {estado.titulo}
                      </span>
                      <span className="text-xs text-slate-500">Cantidad</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCLP(stats.total)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {stats.cantidad} cotizacione{stats.cantidad === 1 ? '' : 's'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Valores de Cotizaciones</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip
                      formatter={(value: any) => formatCLP(Number(value))}
                      labelStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="valor" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cantidades de Cotizaciones</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value: any) => `${value} cotiz.`}
                      labelStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="cantidad" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

type SidebarLinkProps = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
};

function SidebarLink({ to, icon: Icon, label, active }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
        ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}
