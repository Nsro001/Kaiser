import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Proveedor {
  id: string;
  nombre: string;
  email: string;
  rut: string;
  telefono: string;
  direccion: string;
  contacto: string;
  categoria: string;
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
}

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rut: '',
    telefono: '',
    direccion: '',
    contacto: '',
    categoria: ''
  });

  useEffect(() => {
    // Cargar proveedores desde localStorage
    const proveedoresGuardados = JSON.parse(localStorage.getItem('proveedores') || '[]');
    setProveedores(proveedoresGuardados);
  }, []);

  const guardarProveedores = (nuevosProveedores: Proveedor[]) => {
    setProveedores(nuevosProveedores);
    localStorage.setItem('proveedores', JSON.stringify(nuevosProveedores));
  };

  const proveedoresFiltrados = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    proveedor.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    proveedor.rut.includes(busqueda) ||
    proveedor.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      rut: '',
      telefono: '',
      direccion: '',
      contacto: '',
      categoria: ''
    });
    setProveedorEditando(null);
  };

  const abrirDialogo = (proveedor?: Proveedor) => {
    if (proveedor) {
      setProveedorEditando(proveedor);
      setFormData({
        nombre: proveedor.nombre,
        email: proveedor.email,
        rut: proveedor.rut,
        telefono: proveedor.telefono,
        direccion: proveedor.direccion,
        contacto: proveedor.contacto,
        categoria: proveedor.categoria
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const guardarProveedor = () => {
    if (!formData.nombre || !formData.email || !formData.categoria) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    if (proveedorEditando) {
      // Editar proveedor existente
      const nuevosProveedores = proveedores.map(p =>
        p.id === proveedorEditando.id
          ? { ...p, ...formData }
          : p
      );
      guardarProveedores(nuevosProveedores);
      toast.success('Proveedor actualizado exitosamente');
    } else {
      // Crear nuevo proveedor
      const nuevoProveedor: Proveedor = {
        id: Date.now().toString(),
        ...formData,
        estado: 'activo',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      guardarProveedores([...proveedores, nuevoProveedor]);
      toast.success('Proveedor creado exitosamente');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const eliminarProveedor = (id: string) => {
    const nuevosProveedores = proveedores.filter(p => p.id !== id);
    guardarProveedores(nuevosProveedores);
    toast.success('Proveedor eliminado');
  };

  const toggleEstado = (id: string) => {
    const nuevosProveedores = proveedores.map(p =>
      p.id === id
        ? { ...p, estado: p.estado === 'activo' ? 'inactivo' as const : 'activo' as const }
        : p
    );
    guardarProveedores(nuevosProveedores);
    toast.success('Estado del proveedor actualizado');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gestión de Proveedores</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirDialogo()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {proveedorEditando ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Proveedor ABC S.A."
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  placeholder="Ej: Hardware, Software, Servicios"
                />
              </div>
              <div>
                <Label htmlFor="rut">RUT</Label>
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
                  placeholder="contacto@proveedor.cl"
                />
              </div>
              <div>
                <Label htmlFor="contacto">Persona de Contacto</Label>
                <Input
                  id="contacto"
                  value={formData.contacto}
                  onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                  placeholder="Nombre del contacto principal"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  placeholder="+56 2 1234 5678"
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
                <Button onClick={guardarProveedor} className="bg-green-600 hover:bg-green-700">
                  {proveedorEditando ? 'Actualizar' : 'Crear'} Proveedor
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
              placeholder="Buscar por nombre, email, RUT o categoría..."
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
          <CardTitle>Lista de Proveedores ({proveedoresFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {proveedoresFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">
                  {proveedores.length === 0 
                    ? 'No hay proveedores registrados' 
                    : 'No se encontraron resultados'
                  }
                </div>
                <div className="text-sm">
                  {proveedores.length === 0 
                    ? 'Crea tu primer proveedor haciendo clic en "Nuevo Proveedor"'
                    : 'Intenta cambiar los términos de búsqueda'
                  }
                </div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedoresFiltrados.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{proveedor.nombre}</div>
                        <div className="text-sm text-gray-500">
                          Creado: {new Date(proveedor.fechaCreacion).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{proveedor.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{proveedor.email}</div>
                        {proveedor.contacto && (
                          <div className="text-gray-500">{proveedor.contacto}</div>
                        )}
                        {proveedor.telefono && (
                          <div className="text-gray-500">{proveedor.telefono}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {proveedor.rut || 'No especificado'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEstado(proveedor.id)}
                      >
                        <Badge 
                          className={proveedor.estado === 'activo' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }
                        >
                          {proveedor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => abrirDialogo(proveedor)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => eliminarProveedor(proveedor.id)}
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
              <div className="text-2xl font-bold text-blue-600">{proveedores.length}</div>
              <div className="text-sm text-gray-500">Total Proveedores</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {proveedores.filter(p => p.estado === 'activo').length}
              </div>
              <div className="text-sm text-gray-500">Proveedores Activos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(proveedores.map(p => p.categoria)).size}
              </div>
              <div className="text-sm text-gray-500">Categorías</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}