import CotizacionActions from '@/components/CotizacionActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Plus, Trash2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  rut: string;
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  tipo: string;
  descripcion?: string;
  categoria: string;
}

interface ItemCotizacion {
  id: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
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
  estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  margen: number;
  flete: number;
  incluirFlete: boolean;
}

export default function CrearCotizacion() {
  const navigate = useNavigate();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [margenGanancia, setMargenGanancia] = useState<number>(20);
  const [tieneFlete, setTieneFlete] = useState<boolean>(false);
  const [montoFlete, setMontoFlete] = useState<number>(0);

  // Estados para crear cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    email: '',
    rut: '',
    telefono: '',
    direccion: ''
  });
  
  // Estados para crear producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    tipo: 'producto' as 'producto' | 'servicio',
    categoria: ''
  });

  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Datos del formulario de cotización
  const [formData, setFormData] = useState({
    referencia: '',
    fecha: new Date().toISOString().split('T')[0],
    prefijo: '',
    factura: '',
    compra: '',
    introduccion: 'Introducción predeterminada',
    notaInterna: '',
    linkCotizacion: true,
    monedaEntrada: 'clp',
    monedaPdf: 'clp',
    tipoVisualizacion: 'todo'
  });

  useEffect(() => {
    // Cargar clientes y productos desde localStorage
    const clientesGuardados = JSON.parse(localStorage.getItem('clientes') || '[]');
    const productosGuardados = JSON.parse(localStorage.getItem('productos') || '[]');
    
    setClientes(clientesGuardados);
    setProductos(productosGuardados);
  }, []);

  const agregarItem = (producto: Producto) => {
    const nuevoItem: ItemCotizacion = {
      id: Date.now().toString(),
      productoId: producto.id,
      nombre: producto.nombre,
      cantidad: 1,
      precio: producto.precio,
      total: producto.precio
    };
    setItems([...items, nuevoItem]);
    toast.success(`${producto.nombre} agregado a la cotización`);
  };

  const actualizarCantidad = (id: string, cantidad: number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, cantidad, total: cantidad * item.precio }
        : item
    ));
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success('Item eliminado de la cotización');
  };

  const subtotal = items.reduce((sum, item) => {
    const precioVenta = item.precio * (1 + margenGanancia / 100);
    return sum + precioVenta * item.cantidad;
  }, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva + (tieneFlete ? montoFlete : 0);

  const handleCrearCliente = () => {
    if (nuevoCliente.nombre && nuevoCliente.email && nuevoCliente.rut) {
      const cliente: Cliente = {
        id: Date.now().toString(),
        nombre: nuevoCliente.nombre,
        email: nuevoCliente.email,
        rut: nuevoCliente.rut
      };
      
      // Guardar en localStorage
      const clientesActuales = JSON.parse(localStorage.getItem('clientes') || '[]');
      const nuevosClientes = [...clientesActuales, cliente];
      localStorage.setItem('clientes', JSON.stringify(nuevosClientes));
      
      setClientes(nuevosClientes);
      setSelectedClient(cliente.id);
      setNuevoCliente({
        nombre: '',
        email: '',
        rut: '',
        telefono: '',
        direccion: ''
      });
      setIsClientDialogOpen(false);
      toast.success('Cliente creado exitosamente');
    } else {
      toast.error('Por favor completa los campos obligatorios');
    }
  };

  const handleCrearProducto = () => {
    if (nuevoProducto.nombre && nuevoProducto.precio && nuevoProducto.categoria) {
      const producto: Producto = {
        id: Date.now().toString(),
        ...nuevoProducto,
        precio: parseFloat(nuevoProducto.precio),
        descripcion: nuevoProducto.descripcion || ''
      };
      
      // Guardar en localStorage
      const productosActuales = JSON.parse(localStorage.getItem('productos') || '[]');
      const nuevosProductos = [...productosActuales, producto];
      localStorage.setItem('productos', JSON.stringify(nuevosProductos));
      
      setProductos(nuevosProductos);
      setNuevoProducto({
        nombre: '',
        descripcion: '',
        precio: '',
        tipo: 'producto',
        categoria: ''
      });
      setIsProductDialogOpen(false);
      toast.success('Producto/Servicio creado exitosamente');
    } else {
      toast.error('Por favor completa los campos obligatorios');
    }
  };

  const handleCrearCotizacion = () => {
    if (!selectedClient) {
      toast.error('Por favor selecciona un cliente');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Por favor agrega al menos un producto o servicio');
      return;
    }

    const cliente = clientes.find(c => c.id === selectedClient);
    const cotizacion: Cotizacion = {
      id: Date.now().toString(),
      numero: `COT-${Date.now()}`,
      cliente: cliente || null,
      items: items,
      subtotal: subtotal,
      iva: iva,
      total: total,
      fecha: formData.fecha,
      estado: 'enviada',
      margen: margenGanancia,
      flete: tieneFlete ? montoFlete : 0,
      incluirFlete: tieneFlete
    };

    // Guardar en localStorage
    const cotizacionesExistentes = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    cotizacionesExistentes.push(cotizacion);
    localStorage.setItem('cotizaciones', JSON.stringify(cotizacionesExistentes));

    toast.success('Cotización creada exitosamente');
    navigate('/cotizaciones');
  };

  const handleCrearYVisualizar = () => {
    if (!selectedClient) {
      toast.error('Por favor selecciona un cliente');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Por favor agrega al menos un producto o servicio');
      return;
    }

    const cliente = clientes.find(c => c.id === selectedClient);
    const cotizacion: Cotizacion = {
      id: Date.now().toString(),
      numero: `COT-${Date.now()}`,
      cliente: cliente || null,
      items: items,
      subtotal: subtotal,
      iva: iva,
      total: total,
      fecha: formData.fecha,
      estado: 'borrador',
      margen: margenGanancia,
      flete: tieneFlete ? montoFlete : 0,
      incluirFlete: tieneFlete
    };

    // Guardar en localStorage
    const cotizacionesExistentes = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    cotizacionesExistentes.push(cotizacion);
    localStorage.setItem('cotizaciones', JSON.stringify(cotizacionesExistentes));

    // Mostrar vista previa
    setIsPreviewOpen(true);
    setPreviewCotizacion(cotizacion);
    toast.success('Cotización creada. Mostrando vista previa...');
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewCotizacion, setPreviewCotizacion] = useState<Cotizacion | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/cotizaciones">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Crear Cotización</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="autor">Autor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="jonathan.madrid.ara@gmail.com" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jonathan">jonathan.madrid.ara@gmail.com</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="referencia">Referencia</Label>
                  <Input 
                    placeholder="referencia de búsqueda (opcional)" 
                    value={formData.referencia}
                    onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="fecha">Fecha emisión</Label>
                  <Input 
                    type="date" 
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-6">
                <Checkbox 
                  id="link-cotizacion" 
                  checked={formData.linkCotizacion}
                  onCheckedChange={(checked) => setFormData({...formData, linkCotizacion: !!checked})}
                />
                <Label htmlFor="link-cotizacion">Link de Cotización</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="prefijo">Prefijo Numero</Label>
                  <Input 
                    placeholder="(opcional)" 
                    value={formData.prefijo}
                    onChange={(e) => setFormData({...formData, prefijo: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="factura">N° Factura</Label>
                  <Input 
                    placeholder="(opcional)" 
                    value={formData.factura}
                    onChange={(e) => setFormData({...formData, factura: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="compra">N° O.Compra</Label>
                  <Input 
                    placeholder="(opcional)" 
                    value={formData.compra}
                    onChange={(e) => setFormData({...formData, compra: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="margen">Margen de ganancia (%) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={margenGanancia}
                    onChange={(e) => setMargenGanancia(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="flete">Flete (CLP)</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tiene-flete"
                      checked={tieneFlete}
                      onCheckedChange={(checked) => setTieneFlete(!!checked)}
                    />
                    <span className="text-sm">Incluir flete</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    disabled={!tieneFlete}
                    value={montoFlete}
                    onChange={(e) => setMontoFlete(Number(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="empresa-cliente">
                <TabsList>
                  <TabsTrigger value="empresa-cliente">Empresa/Cliente</TabsTrigger>
                  <TabsTrigger value="crear-empresa">Crear Empresa/Cliente</TabsTrigger>
                </TabsList>
                <TabsContent value="empresa-cliente" className="mt-4">
                  <div>
                    <Label>Selecciona la Empresa/Cliente</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre} • {cliente.rut} • {cliente.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="crear-empresa" className="mt-4">
                  <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Nuevo Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                          <Input
                            id="nombre"
                            value={nuevoCliente.nombre}
                            onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                            placeholder="Ej: Empresa ABC S.A."
                          />
                        </div>
                        <div>
                          <Label htmlFor="rut">RUT *</Label>
                          <Input
                            id="rut"
                            value={nuevoCliente.rut}
                            onChange={(e) => setNuevoCliente({...nuevoCliente, rut: e.target.value})}
                            placeholder="Ej: 12.345.678-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={nuevoCliente.email}
                            onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})}
                            placeholder="contacto@empresa.cl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefono">Teléfono</Label>
                          <Input
                            id="telefono"
                            value={nuevoCliente.telefono}
                            onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                            placeholder="+56 9 1234 5678"
                          />
                        </div>
                        <div>
                          <Label htmlFor="direccion">Dirección</Label>
                          <Input
                            id="direccion"
                            value={nuevoCliente.direccion}
                            onChange={(e) => setNuevoCliente({...nuevoCliente, direccion: e.target.value})}
                            placeholder="Dirección completa"
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCrearCliente} className="bg-green-600 hover:bg-green-700">
                            Crear Cliente
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Products/Services */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Productos y Servicios</CardTitle>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Producto/Servicio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo">Tipo *</Label>
                        <Select value={nuevoProducto.tipo} onValueChange={(value: 'producto' | 'servicio') => setNuevoProducto({...nuevoProducto, tipo: value})}>
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
                          value={nuevoProducto.nombre}
                          onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                          placeholder="Nombre del producto/servicio"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoria">Categoría *</Label>
                        <Input
                          id="categoria"
                          value={nuevoProducto.categoria}
                          onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                          placeholder="Ej: Desarrollo, Hardware, Consultoría"
                        />
                      </div>
                      <div>
                        <Label htmlFor="precio">Precio (CLP) *</Label>
                        <Input
                          id="precio"
                          type="number"
                          value={nuevoProducto.precio}
                          onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          value={nuevoProducto.descripcion}
                          onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                          placeholder="Descripción detallada"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCrearProducto} className="bg-green-600 hover:bg-green-700">
                          Crear
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Agregar Producto/Servicio</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {productos.map(producto => (
                    <Button
                      key={producto.id}
                      variant="outline"
                      onClick={() => agregarItem(producto)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="text-left">
                        <div className="font-medium">{producto.nombre}</div>
                        <div className="text-sm text-gray-500">{formatPrice(producto.precio)}</div>
                        <div className="text-xs text-gray-400">{producto.categoria}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {items.length > 0 && (
                <div className="mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto/Servicio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Costo Neto</TableHead>
                        <TableHead>Precio Venta</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                              min="1"
                            />
                          </TableCell>
                          <TableCell>{formatPrice(item.precio)}</TableCell>
                          <TableCell>{formatPrice(item.precio * (1 + margenGanancia / 100))}</TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(item.precio * (1 + margenGanancia / 100) * item.cantidad)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarItem(item.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 space-y-2 text-right">
                    <div>Subtotal: {formatPrice(subtotal)}</div>
                    <div>IVA (19%): {formatPrice(iva)}</div>
                    <div className="text-lg font-bold">Total: {formatPrice(total)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Currency Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración Monedas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Moneda de Entrada</Label>
                  <Select value={formData.monedaEntrada} onValueChange={(value) => setFormData({...formData, monedaEntrada: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clp">CLP (Peso Chileno)</SelectItem>
                      <SelectItem value="usd">USD (Dólar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Moneda de PDF</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xs">PDF</span>
                    </div>
                    <Select value={formData.monedaPdf} onValueChange={(value) => setFormData({...formData, monedaPdf: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clp">CLP (Peso Chileno)</SelectItem>
                        <SelectItem value="usd">USD (Dólar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Introduction Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Introducción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Button variant="outline" size="sm">nuevo texto</Button>
                <Button variant="outline" size="sm">nueva imagen</Button>
              </div>

              {/* Rich Text Editor Toolbar */}
              <div className="border rounded-t-md p-2 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Underline className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-gray-300 mx-2"></div>
                  <Button variant="ghost" size="sm">
                    <List className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-gray-300 mx-2"></div>
                  <Button variant="ghost" size="sm">
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Textarea 
                className="rounded-t-none min-h-32" 
                value={formData.introduccion}
                onChange={(e) => setFormData({...formData, introduccion: e.target.value})}
                placeholder="Introducción predeterminada"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nota Interna</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Rich Text Editor Toolbar */}
              <div className="border rounded-t-md p-2 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Textarea 
                className="rounded-t-none min-h-24" 
                value={formData.notaInterna}
                onChange={(e) => setFormData({...formData, notaInterna: e.target.value})}
                placeholder="Notas internas (no aparecen en el PDF)"
              />
            </CardContent>
          </Card>

          {/* Visualization Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de visualización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center">
                  <div className={`border-2 rounded-lg p-4 ${formData.tipoVisualizacion === 'todo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded"></div>
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <input 
                      type="radio" 
                      name="visualization" 
                      value="todo"
                      checked={formData.tipoVisualizacion === 'todo'}
                      onChange={(e) => setFormData({...formData, tipoVisualizacion: e.target.value})}
                      className="mr-2" 
                    />
                    <span className="text-sm">Todo</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`border-2 rounded-lg p-4 ${formData.tipoVisualizacion === 'total' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 rounded"></div>
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <input 
                      type="radio" 
                      name="visualization" 
                      value="total"
                      checked={formData.tipoVisualizacion === 'total'}
                      onChange={(e) => setFormData({...formData, tipoVisualizacion: e.target.value})}
                      className="mr-2" 
                    />
                    <span className="text-sm">Solo total</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`border-2 rounded-lg p-4 ${formData.tipoVisualizacion === 'items' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 rounded"></div>
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <input 
                      type="radio" 
                      name="visualization" 
                      value="items"
                      checked={formData.tipoVisualizacion === 'items'}
                      onChange={(e) => setFormData({...formData, tipoVisualizacion: e.target.value})}
                      className="mr-2" 
                    />
                    <span className="text-sm">Solo ítems</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span>{formatPrice(iva)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8">
        <Button variant="outline" onClick={handleCrearYVisualizar}>
          <Eye className="w-4 h-4 mr-2" />
          Crear y Visualizar
        </Button>
        <Button onClick={handleCrearCotizacion} className="bg-green-600 hover:bg-green-700">
          Crear
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa de Cotización</DialogTitle>
          </DialogHeader>
          {previewCotizacion && (
            <div className="space-y-6 p-6 bg-white">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">COTIZACIÓN</h2>
                <p className="text-lg">N° {previewCotizacion.numero}</p>
                <p className="text-sm text-gray-600">Fecha: {new Date(previewCotizacion.fecha).toLocaleDateString('es-CL')}</p>
              </div>

              {previewCotizacion.cliente && (
                <div>
                  <h3 className="font-semibold mb-2">Cliente:</h3>
                  <p>{previewCotizacion.cliente.nombre}</p>
                  <p>RUT: {previewCotizacion.cliente.rut}</p>
                  <p>Email: {previewCotizacion.cliente.email}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Detalle:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Neto</TableHead>
                        <TableHead>Precio Venta</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewCotizacion.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{formatPrice(item.precio)}</TableCell>
                        <TableCell>{formatPrice(item.precio * (1 + margenGanancia / 100))}</TableCell>
                        <TableCell>{formatPrice(item.precio * (1 + margenGanancia / 100) * item.cantidad)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 text-right space-y-2">
                <div>Subtotal: {formatPrice(previewCotizacion.subtotal)}</div>
                <div>IVA (19%): {formatPrice(previewCotizacion.iva)}</div>
                {previewCotizacion.incluirFlete && (
                  <div>Flete: {formatPrice(previewCotizacion.flete)}</div>
                )}
                <div className="text-xl font-bold">Total: {formatPrice(previewCotizacion.total)}</div>
              </div>


              <CotizacionActions
                cotizacion={{
                  cliente: previewCotizacion.cliente?.nombre || '',
                  rut: previewCotizacion.cliente?.rut || '',
                  direccion: previewCotizacion.cliente?.direccion || '',
                  email: previewCotizacion.cliente?.email || '',
                  telefono: previewCotizacion.cliente?.telefono || '',
                  productos: previewCotizacion.items.map(item => ({
                    nombre: item.nombre,
                    costoCompra: item.precio,
                    cantidad: item.cantidad
                  })),
                  margen: margenGanancia,
                  flete: previewCotizacion.flete,
                  incluirFlete: previewCotizacion.incluirFlete,
                  numeroCotizacion: previewCotizacion.numero,
                  fecha: previewCotizacion.fecha
                }}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => navigate('/cotizaciones')} className="bg-blue-600 hover:bg-blue-700">
                  Ir a Cotizaciones
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
