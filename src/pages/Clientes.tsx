import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  rut: string;
  telefono: string;
  direccion: string;
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rut: '',
    telefono: '',
    direccion: ''
  });

  useEffect(() => {
    // Cargar clientes desde localStorage
    const clientesGuardados = JSON.parse(localStorage.getItem('clientes') || '[]');
    setClientes(clientesGuardados);
  }, []);

  const guardarClientes = (nuevosClientes: Cliente[]) => {
    setClientes(nuevosClientes);
    localStorage.setItem('clientes', JSON.stringify(nuevosClientes));
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.rut.includes(busqueda)
  );

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      rut: '',
      telefono: '',
      direccion: ''
    });
    setClienteEditando(null);
  };

  const abrirDialogo = (cliente?: Cliente) => {
    if (cliente) {
      setClienteEditando(cliente);
      setFormData({
        nombre: cliente.nombre,
        email: cliente.email,
        rut: cliente.rut,
        telefono: cliente.telefono,
        direccion: cliente.direccion
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const guardarCliente = () => {
    if (!formData.nombre || !formData.email || !formData.rut) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    if (clienteEditando) {
      // Editar cliente existente
      const nuevosClientes = clientes.map(c =>
        c.id === clienteEditando.id
          ? { ...c, ...formData }
          : c
      );
      guardarClientes(nuevosClientes);
      toast.success('Cliente actualizado exitosamente');
    } else {
      // Crear nuevo cliente
      const nuevoCliente: Cliente = {
        id: Date.now().toString(),
        ...formData,
        estado: 'activo',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      guardarClientes([...clientes, nuevoCliente]);
      toast.success('Cliente creado exitosamente');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const eliminarCliente = (id: string) => {
    const nuevosClientes = clientes.filter(c => c.id !== id);
    guardarClientes(nuevosClientes);
    toast.success('Cliente eliminado');
  };

  const toggleEstado = (id: string) => {
    const nuevosClientes = clientes.map(c =>
      c.id === id
        ? { ...c, estado: c.estado === 'activo' ? 'inactivo' as const : 'activo' as const }
        : c
    );
    guardarClientes(nuevosClientes);
    toast.success('Estado del cliente actualizado');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gestión de Clientes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirDialogo()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {clienteEditando ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Empresa ABC S.A."
                />
              </div>
              <div>
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => setFormData({...formData, rut: e.target.value})}
                  placeholder="Ej: 12.345.678-9"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="contacto@empresa.cl"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Dirección completa"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarCliente} className="bg-green-600 hover:bg-green-700">
                  {clienteEditando ? 'Actualizar' : 'Crear'} Cliente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o RUT..."
              className="pl-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({clientesFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">
                  {clientes.length === 0 
                    ? 'No hay clientes registrados' 
                    : 'No se encontraron resultados'
                  }
                </div>
                <div className="text-sm">
                  {clientes.length === 0 
                    ? 'Crea tu primer cliente haciendo clic en "Nuevo Cliente"'
                    : 'Intenta cambiar los términos de búsqueda'
                  }
                </div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cliente.nombre}</div>
                        <div className="text-sm text-gray-500">
                          Creado: {new Date(cliente.fechaCreacion).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{cliente.rut}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{cliente.email}</div>
                        {cliente.telefono && (
                          <div className="text-gray-500">{cliente.telefono}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {cliente.direccion || 'No especificada'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEstado(cliente.id)}
                      >
                        <Badge 
                          className={cliente.estado === 'activo' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }
                        >
                          {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => abrirDialogo(cliente)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => eliminarCliente(cliente.id)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{clientes.length}</div>
              <div className="text-sm text-gray-500">Total Clientes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {clientes.filter(c => c.estado === 'activo').length}
              </div>
              <div className="text-sm text-gray-500">Clientes Activos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {clientes.filter(c => c.estado === 'inactivo').length}
              </div>
              <div className="text-sm text-gray-500">Clientes Inactivos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}