import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, Edit, Trash2, Plus, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface OrdenCompra {
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
  fechaCreacion: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'completada';
  cotizacionOriginal?: string;
}

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompra | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    // Cargar órdenes de compra desde localStorage
    const ordenesGuardadas = JSON.parse(localStorage.getItem('ordenes_compra') || '[]');
    setOrdenes(ordenesGuardadas);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getEstadoBadge = (estado: string) => {
    const colors = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'aprobada': 'bg-blue-100 text-blue-800',
      'rechazada': 'bg-red-100 text-red-800',
      'completada': 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={colors[estado as keyof typeof colors]}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    const matchEstado = filtroEstado === 'todos' || orden.estado === filtroEstado;
    const matchBusqueda = busqueda === '' || 
      orden.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.cliente?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.cotizacionOriginal?.toLowerCase().includes(busqueda.toLowerCase());
    
    return matchEstado && matchBusqueda;
  });

  const eliminarOrden = (id: string) => {
    const nuevasOrdenes = ordenes.filter(o => o.id !== id);
    setOrdenes(nuevasOrdenes);
    localStorage.setItem('ordenes_compra', JSON.stringify(nuevasOrdenes));
    toast.success('Orden de compra eliminada');
  };

  const verOrden = (orden: OrdenCompra) => {
    setOrdenSeleccionada(orden);
    setIsPreviewOpen(true);
  };

  const cambiarEstado = (id: string, nuevoEstado: string) => {
    const nuevasOrdenes = ordenes.map(o =>
      o.id === id
        ? { ...o, estado: nuevoEstado as OrdenCompra['estado'] }
        : o
    );
    setOrdenes(nuevasOrdenes);
    localStorage.setItem('ordenes_compra', JSON.stringify(nuevasOrdenes));
    toast.success(`Estado cambiado a ${nuevoEstado}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/cotizaciones">
            <Button variant="ghost" size="sm">
              ← Volver a Cotizaciones
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Órdenes de Compra</h1>
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
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por número, cliente o cotización..."
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
          <CardTitle>Lista de Órdenes de Compra ({ordenesFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {ordenesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">
                  {ordenes.length === 0 
                    ? 'No hay órdenes de compra creadas' 
                    : 'No se ha encontrado ningún resultado.'
                  }
                </div>
                <div className="text-sm">
                  {ordenes.length === 0 
                    ? 'Las órdenes de compra se crean desde las cotizaciones'
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
                  <TableHead>Cotización Original</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenesFiltradas.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell className="font-medium">{orden.numero}</TableCell>
                    <TableCell>
                      {orden.cliente ? (
                        <div>
                          <div className="font-medium">{orden.cliente.nombre}</div>
                          <div className="text-sm text-gray-500">{orden.cliente.rut}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin cliente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {orden.cotizacionOriginal ? (
                        <Badge variant="outline">{orden.cotizacionOriginal}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(orden.fechaCreacion).toLocaleDateString('es-CL')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(orden.total)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={orden.estado}
                        onValueChange={(value) => cambiarEstado(orden.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          {getEstadoBadge(orden.estado)}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="aprobada">Aprobada</SelectItem>
                          <SelectItem value="rechazada">Rechazada</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Ver"
                          onClick={() => verOrden(orden)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          title="Eliminar"
                          onClick={() => eliminarOrden(orden.id)}
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
            <DialogTitle>Vista Previa - Orden de Compra</DialogTitle>
          </DialogHeader>
          {ordenSeleccionada && (
            <div className="space-y-6 p-6 bg-white">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">ORDEN DE COMPRA</h2>
                <p className="text-lg">N° {ordenSeleccionada.numero}</p>
                <p className="text-sm text-gray-600">
                  Fecha: {new Date(ordenSeleccionada.fechaCreacion).toLocaleDateString('es-CL')}
                </p>
                {ordenSeleccionada.cotizacionOriginal && (
                  <p className="text-sm text-blue-600">
                    Basada en cotización: {ordenSeleccionada.cotizacionOriginal}
                  </p>
                )}
              </div>

              {ordenSeleccionada.cliente && (
                <div>
                  <h3 className="font-semibold mb-2">Cliente:</h3>
                  <p>{ordenSeleccionada.cliente.nombre}</p>
                  <p>RUT: {ordenSeleccionada.cliente.rut}</p>
                  <p>Email: {ordenSeleccionada.cliente.email}</p>
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
                    {ordenSeleccionada.items.map(item => (
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
                <div>Subtotal: {formatPrice(ordenSeleccionada.subtotal)}</div>
                <div>IVA (19%): {formatPrice(ordenSeleccionada.iva)}</div>
                <div className="text-xl font-bold">Total: {formatPrice(ordenSeleccionada.total)}</div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Estado actual: </span>
                    {getEstadoBadge(ordenSeleccionada.estado)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Card */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{ordenes.length}</div>
              <div className="text-sm text-gray-500">Total Órdenes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {ordenes.filter(o => o.estado === 'pendiente').length}
              </div>
              <div className="text-sm text-gray-500">Pendientes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {ordenes.filter(o => o.estado === 'completada').length}
              </div>
              <div className="text-sm text-gray-500">Completadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {formatPrice(ordenes.reduce((sum, o) => sum + o.total, 0))}
              </div>
              <div className="text-sm text-gray-500">Valor Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}