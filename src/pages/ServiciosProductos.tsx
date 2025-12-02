import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Package, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tipo: 'producto' | 'servicio';
  categoria: string;
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
  proveedor?: string;
}

export default function ServiciosProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    tipo: 'producto' as 'producto' | 'servicio',
    categoria: '',
    proveedor: ''
  });

  useEffect(() => {
    // Cargar productos desde localStorage
    const productosGuardados = JSON.parse(localStorage.getItem('productos') || '[]');
    setProductos(productosGuardados);
  }, []);

  const guardarProductos = (nuevosProductos: Producto[]) => {
    setProductos(nuevosProductos);
    localStorage.setItem('productos', JSON.stringify(nuevosProductos));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const productosFiltrados = productos.filter(producto => {
    const matchTipo = filtroTipo === 'todos' || producto.tipo === filtroTipo;
    const matchBusqueda = busqueda === '' || 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.proveedor && producto.proveedor.toLowerCase().includes(busqueda.toLowerCase()));
    
    return matchTipo && matchBusqueda;
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      tipo: 'producto',
      categoria: '',
      proveedor: ''
    });
    setProductoEditando(null);
  };

  const abrirDialogo = (producto?: Producto) => {
    if (producto) {
      setProductoEditando(producto);
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio.toString(),
        tipo: producto.tipo,
        categoria: producto.categoria,
        proveedor: producto.proveedor || ''
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const guardarProducto = () => {
    if (!formData.nombre || !formData.precio || !formData.categoria) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    if (productoEditando) {
      // Editar producto existente
      const nuevosProductos = productos.map(p =>
        p.id === productoEditando.id
          ? { 
              ...p, 
              ...formData, 
              precio: parseFloat(formData.precio)
            }
          : p
      );
      guardarProductos(nuevosProductos);
      toast.success('Producto/Servicio actualizado exitosamente');
    } else {
      // Crear nuevo producto
      const nuevoProducto: Producto = {
        id: Date.now().toString(),
        ...formData,
        precio: parseFloat(formData.precio),
        estado: 'activo',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      guardarProductos([...productos, nuevoProducto]);
      toast.success('Producto/Servicio creado exitosamente');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const eliminarProducto = (id: string) => {
    const nuevosProductos = productos.filter(p => p.id !== id);
    guardarProductos(nuevosProductos);
    toast.success('Producto/Servicio eliminado');
  };

  const toggleEstado = (id: string) => {
    const nuevosProductos = productos.map(p =>
      p.id === id
        ? { ...p, estado: p.estado === 'activo' ? 'inactivo' as const : 'activo' as const }
        : p
    );
    guardarProductos(nuevosProductos);
    toast.success('Estado actualizado');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Servicios y Productos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirDialogo()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto/Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {productoEditando ? 'Editar Producto/Servicio' : 'Crear Nuevo Producto/Servicio'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value: 'producto' | 'servicio') => setFormData({...formData, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producto">Producto</SelectItem>
                    <SelectItem value="servicio">Servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Nombre del producto/servicio"
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  placeholder="Ej: Desarrollo, Hardware, Consultoría"
                />
              </div>
              <div>
                <Label htmlFor="precio">Costo neto (CLP) *</Label>
                <Input
                  id="precio"
                  type="number"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  placeholder="Nombre del proveedor (opcional)"
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción detallada"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarProducto} className="bg-green-600 hover:bg-green-700">
                  {productoEditando ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="producto">Productos</SelectItem>
                <SelectItem value="servicio">Servicios</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, categoría o proveedor..."
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
          <CardTitle>Lista de Productos y Servicios ({productosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {productosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">
                  {productos.length === 0 
                    ? 'No hay productos o servicios registrados' 
                    : 'No se encontraron resultados'
                  }
                </div>
                <div className="text-sm">
                  {productos.length === 0 
                    ? 'Crea tu primer producto/servicio haciendo clic en "Nuevo Producto/Servicio"'
                    : 'Intenta cambiar los filtros de búsqueda'
                  }
                </div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto/Servicio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{producto.nombre}</div>
                        {producto.descripcion && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {producto.descripcion}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Creado: {new Date(producto.fechaCreacion).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={producto.tipo === 'producto' ? 'default' : 'secondary'}>
                        {producto.tipo === 'producto' ? (
                          <>
                            <Package className="w-3 h-3 mr-1" />
                            Producto
                          </>
                        ) : (
                          <>
                            <Settings className="w-3 h-3 mr-1" />
                            Servicio
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{producto.categoria}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(producto.precio)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {producto.proveedor || (
                          <span className="text-gray-400">Sin proveedor</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEstado(producto.id)}
                      >
                        <Badge 
                          className={producto.estado === 'activo' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }
                        >
                          {producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => abrirDialogo(producto)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => eliminarProducto(producto.id)}
                          title="Eliminar"
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

      {/* Stats Card */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{productos.length}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {productos.filter(p => p.tipo === 'producto').length}
              </div>
              <div className="text-sm text-gray-500">Productos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {productos.filter(p => p.tipo === 'servicio').length}
              </div>
              <div className="text-sm text-gray-500">Servicios</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {productos.filter(p => p.proveedor).length}
              </div>
              <div className="text-sm text-gray-500">Con Proveedor</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}