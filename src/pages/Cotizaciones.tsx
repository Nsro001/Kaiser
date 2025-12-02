import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Eye, Edit, Trash2, Plus, Mail, FileText, Briefcase } from 'lucide-react';
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

  useEffect(() => {
    // Cargar cotizaciones desde localStorage y normalizar estados
    const cotizacionesGuardadas = JSON.parse(localStorage.getItem('cotizaciones') || '[]');

    const ahora = new Date();
    const normalizadas = (cotizacionesGuardadas as Cotizacion[]).map((c) => {
      // Migrar estados antiguos "aceptada" -> "aprobada"
      let estado = c.estado as Cotizacion['estado'] | 'aceptada';

      if (estado === 'aceptada') {
        estado = 'aprobada';
      }

      // Calcular expiración automática a los 30 días
      const fechaCot = new Date(c.fecha);
      const diffMs = ahora.getTime() - fechaCot.getTime();
      const diffDias = diffMs / (1000 * 60 * 60 * 24);

      if (
        diffDias >= 30 &&
        estado !== 'aprobada' &&
        estado !== 'rechazada' &&
        estado !== 'expirada'
      ) {
        estado = 'expirada';
      }

      return { ...c, estado };
    });

    setCotizaciones(normalizadas);
    localStorage.setItem('cotizaciones', JSON.stringify(normalizadas));
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      'borrador': 'bg-gray-100 text-gray-800',
      'enviada': 'bg-blue-100 text-blue-800',
      'aprobada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800',
      'expirada': 'bg-amber-100 text-amber-800'
    };

    return (
      <Badge className={colors[estado as keyof typeof colors]}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  const cotizacionesFiltradas = cotizaciones.filter(cotizacion => {
    const matchEstado = filtroEstado === 'todos' || cotizacion.estado === filtroEstado;
    const matchBusqueda = busqueda === '' || 
      cotizacion.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      cotizacion.cliente?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cotizacion.cliente?.rut.includes(busqueda);
    
    return matchEstado && matchBusqueda;
  });

  const eliminarCotizacion = (id: string) => {
    const nuevasCotizaciones = cotizaciones.filter(c => c.id !== id);
    setCotizaciones(nuevasCotizaciones);
    localStorage.setItem('cotizaciones', JSON.stringify(nuevasCotizaciones));
    toast.success('Cotización eliminada');
  };


  const actualizarEstadoCotizacion = (id: string, nuevoEstado: Cotizacion['estado']) => {
    const nuevasCotizaciones = cotizaciones.map((c) =>
      c.id === id ? { ...c, estado: nuevoEstado } : c
    );
    setCotizaciones(nuevasCotizaciones);
    localStorage.setItem('cotizaciones', JSON.stringify(nuevasCotizaciones));

    const estadoLabel =
      nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1);

    toast.success(`Estado actualizado a ${estadoLabel}`);

    // Nota: cuando la cotización está "aprobada", se considera lista para pago
    // y futura emisión de factura SII (integración pendiente).
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
      mensaje: `Estimado/a,\n\nAdjunto encontrará la cotización ${cotizacion.numero} por un valor total de ${formatPrice(cotizacion.total)}.\n\nQuedo atento a sus comentarios.\n\nSaludos cordiales.`
    });
    setIsEmailOpen(true);
  };

  const enviarEmail = () => {
    // Simulación de envío de email (aquí conectarías con un servicio real)
    toast.success(`Email enviado a ${emailData.destinatario}`);
    setIsEmailOpen(false);
    
    // Actualizar estado de la cotización
    if (cotizacionSeleccionada) {
      const nuevasCotizaciones = cotizaciones.map(c => 
        c.id === cotizacionSeleccionada.id 
          ? { ...c, estado: 'enviada' as const }
          : c
      );
      setCotizaciones(nuevasCotizaciones);
      localStorage.setItem('cotizaciones', JSON.stringify(nuevasCotizaciones));
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4 mb-4">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-40">
                <SelectValue />
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

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones ({cotizacionesFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cotizacionesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">
                  {cotizaciones.length === 0 
                    ? 'No hay cotizaciones creadas' 
                    : 'No se ha encontrado ningún resultado.'
                  }
                </div>
                <div className="text-sm">
                  {cotizaciones.length === 0 
                    ? 'Crea tu primera cotización haciendo clic en "Nueva Cotización"'
                    : '— Intenta cambiar el filtro de búsqueda.'
                  }
                </div>
              </div>
            </div>
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
                    <TableCell className="font-medium">{cotizacion.numero}</TableCell>
                    <TableCell>
                      {cotizacion.cliente ? (
                        <div>
                          <div className="font-medium">{cotizacion.cliente.nombre}</div>
                          <div className="text-sm text-gray-500">{cotizacion.cliente.rut}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin cliente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(cotizacion.fecha).toLocaleDateString('es-CL')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(cotizacion.total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {getEstadoBadge(cotizacion.estado)}
                        <Select
                          value={cotizacion.estado}
                          onValueChange={(value) =>
                            actualizarEstadoCotizacion(
                              cotizacion.id,
                              value as Cotizacion['estado']
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder="Cambiar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="borrador">Borrador</SelectItem>
                            <SelectItem value="enviada">Enviada</SelectItem>
                            <SelectItem value="aprobada">Aprobada</SelectItem>
                            <SelectItem value="rechazada">Rechazada</SelectItem>
                            <SelectItem value="expirada">Expirada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Ver"
                          onClick={() => verCotizacion(cotizacion)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Enviar por Email"
                          onClick={() => prepararEmail(cotizacion)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Select>
                          <SelectTrigger className="w-8 h-8 p-0">
                            <Plus className="w-4 h-4" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem 
                              value="orden-compra"
                              onClick={() => convertirAOrden(cotizacion, 'compra')}
                            >
                              Crear Orden de Compra
                            </SelectItem>
                            <SelectItem 
                              value="orden-trabajo"
                              onClick={() => convertirAOrden(cotizacion, 'trabajo')}
                            >
                              Crear Orden de Trabajo
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          title="Eliminar"
                          onClick={() => eliminarCotizacion(cotizacion.id)}
                        >
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

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa de Cotización</DialogTitle>
          </DialogHeader>
          {cotizacionSeleccionada && (
            <div className="space-y-6 p-6 bg-white">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">COTIZACIÓN</h2>
                <p className="text-lg">N° {cotizacionSeleccionada.numero}</p>
                <p className="text-sm text-gray-600">Fecha: {new Date(cotizacionSeleccionada.fecha).toLocaleDateString('es-CL')}</p>
              </div>

              {cotizacionSeleccionada.cliente && (
                <div>
                  <h3 className="font-semibold mb-2">Cliente:</h3>
                  <p>{cotizacionSeleccionada.cliente.nombre}</p>
                  <p>RUT: {cotizacionSeleccionada.cliente.rut}</p>
                  <p>Email: {cotizacionSeleccionada.cliente.email}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Detalle:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cotizacionSeleccionada.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{formatPrice(item.precio)}</TableCell>
                        <TableCell>{formatPrice(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 text-right space-y-2">
                <div>Subtotal: {formatPrice(cotizacionSeleccionada.subtotal)}</div>
                <div>IVA (19%): {formatPrice(cotizacionSeleccionada.iva)}</div>
                <div className="text-xl font-bold">Total: {formatPrice(cotizacionSeleccionada.total)}</div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => prepararEmail(cotizacionSeleccionada)} className="bg-blue-600 hover:bg-blue-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar por Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Cotización por Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="destinatario">Destinatario</Label>
              <Input
                id="destinatario"
                type="email"
                value={emailData.destinatario}
                onChange={(e) => setEmailData({...emailData, destinatario: e.target.value})}
                placeholder="cliente@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                value={emailData.asunto}
                onChange={(e) => setEmailData({...emailData, asunto: e.target.value})}
                placeholder="Asunto del email"
              />
            </div>
            <div>
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea
                id="mensaje"
                value={emailData.mensaje}
                onChange={(e) => setEmailData({...emailData, mensaje: e.target.value})}
                placeholder="Mensaje del email"
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEmailOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={enviarEmail} className="bg-green-600 hover:bg-green-700">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
