import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Eye, Edit, Trash2, Plus, Mail, FileText, Briefcase, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'expirada';
  margen: number;
  flete: number;
  incluirFlete: boolean;
}

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<Cotizacion | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    destinatario: '',
    asunto: '',
    mensaje: ''
  });

  // Cargar cotizaciones
  useEffect(() => {
    const cotizacionesGuardadas = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const ahora = new Date();

    const normalizadas = (cotizacionesGuardadas as Cotizacion[]).map((c) => {
      let estado = c.estado as Cotizacion['estado'] | 'aceptada';
      if (estado === 'aceptada') estado = 'aprobada';

      const fechaCot = new Date(c.fecha);
      const diffMs = ahora.getTime() - fechaCot.getTime();
      const diffDias = diffMs / (1000 * 60 * 60 * 24);

      if (diffDias >= 30 && estado !== 'aprobada' && estado !== 'rechazada' && estado !== 'expirada') {
        estado = 'expirada';
      }

      return { ...c, estado };
    });

    setCotizaciones(normalizadas);
    localStorage.setItem('cotizaciones', JSON.stringify(normalizadas));
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
  };

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      borrador: 'bg-gray-100 text-gray-800',
      enviada: 'bg-blue-100 text-blue-800',
      aprobada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800',
      expirada: 'bg-amber-100 text-amber-800'
    };

    return <Badge className={colors[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>;
  };

  const cotizacionesFiltradas = cotizaciones.filter((c) => {
    const matchEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
    const matchBusqueda =
      busqueda === '' ||
      c.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cliente?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cliente?.rut.includes(busqueda);

    return matchEstado && matchBusqueda;
  });

  const eliminarCotizacion = (id: string) => {
    const nuevas = cotizaciones.filter((c) => c.id !== id);
    setCotizaciones(nuevas);
    localStorage.setItem('cotizaciones', JSON.stringify(nuevas));
    toast.success('Cotización eliminada');
  };

  const actualizarEstadoCotizacion = (id: string, nuevoEstado: Cotizacion['estado']) => {
    const nuevas = cotizaciones.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c));
    setCotizaciones(nuevas);
    localStorage.setItem('cotizaciones', JSON.stringify(nuevas));
    toast.success(`Estado actualizado a ${nuevoEstado}`);
  };

  const verCotizacion = (cotizacion: Cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setIsPreviewOpen(true);
  };

  const prepararEmail = (cotizacion: Cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setEmailData({
      destinatario: cotizacion.cliente?.email || '',
      asunto: `Cotización ${cotizacion.numero} - ${cotizacion.cliente?.nombre}`,
      mensaje: `Estimado/a,\n\nAdjunto encontrará la cotización ${cotizacion.numero} por un total de ${formatPrice(
        cotizacion.total
      )}.\n\nSaludos cordiales.`
    });
    setIsEmailOpen(true);
  };

  const enviarEmail = () => {
    toast.success(`Email enviado a ${emailData.destinatario}`);
    setIsEmailOpen(false);
    
    if (cotizacionSeleccionada) {
      const nuevas = cotizaciones.map((c) =>
        c.id === cotizacionSeleccionada.id ? { ...c, estado: 'enviada' as const } : c
      );
      setCotizaciones(nuevas);
      localStorage.setItem('cotizaciones', JSON.stringify(nuevas));
    }
  };
const convertirAOrden = (cotizacion: Cotizacion, tipo: 'compra' | 'trabajo') => {
    const ordenes = JSON.parse(localStorage.getItem(`ordenes_${tipo}`) || '[]');

    const nuevaOrden = {
      ...cotizacion,
      id: Date.now().toString(),
      numero: `O${tipo === 'compra' ? 'C' : 'T'}-${Date.now()}`,
      cotizacionOriginal: cotizacion.numero,
      fechaCreacion: new Date().toISOString().split('T')[0],
      estado: 'pendiente'
    };

    ordenes.push(nuevaOrden);
    localStorage.setItem(`ordenes_${tipo}`, JSON.stringify(ordenes));

    toast.success(`Orden de ${tipo} creada: ${nuevaOrden.numero}`);
  };
  return (
    <div className="p-6">

      {/* 🔵 BOTÓN VOLVER */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cotizaciones</h1>
        <div className="flex space-x-2">
          <Link to="/ordenes-compra">
            <Button variant="outline">
              <Briefcase className="w-4 h-4 mr-2" />
              Órdenes de Compra
            </Button>
          </Link>
          <Link to="/ordenes-trabajo">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Órdenes de Trabajo
            </Button>
          </Link>
          <Link to="/crear-cotizacion">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cotización
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4 mb-4">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
                <SelectItem value="expirada">Expirada</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por número, cliente o RUT..."
                className="pl-10"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLA */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones ({cotizacionesFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cotizacionesFiltradas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron cotizaciones</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizacionesFiltradas.map((cotizacion) => (
                  <TableRow key={cotizacion.id}>
                    <TableCell>{cotizacion.numero}</TableCell>
                    <TableCell>
                      <div className="font-medium">{cotizacion.cliente?.nombre || 'Sin cliente'}</div>
                      <div className="text-sm text-gray-500">{cotizacion.cliente?.rut}</div>
                    </TableCell>
                    <TableCell>{new Date(cotizacion.fecha).toLocaleDateString('es-CL')}</TableCell>
                    <TableCell>{formatPrice(cotizacion.total)}</TableCell>
                    <TableCell>{getEstadoBadge(cotizacion.estado)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => verCotizacion(cotizacion)}>
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button size="sm" variant="ghost" onClick={() => prepararEmail(cotizacion)}>
                          <Mail className="w-4 h-4" />
                        </Button>

                        <Select>
                          <SelectTrigger className="w-8 h-8 p-0">
                            <Plus className="w-4 h-4" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="orden-compra" onClick={() => convertirAOrden(cotizacion, 'compra')}>
                              Crear Orden de Compra
                            </SelectItem>
                            <SelectItem value="orden-trabajo" onClick={() => convertirAOrden(cotizacion, 'trabajo')}>
                              Crear Orden de Trabajo
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => eliminarCotizacion(cotizacion.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
