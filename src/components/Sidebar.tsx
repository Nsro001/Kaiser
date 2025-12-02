import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  LayoutDashboard, 
  FileText, 
  ShoppingCart, 
  Briefcase, 
  Users, 
  Package, 
  UserCheck, 
  StickyNote 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Cotizaciones', path: '/cotizaciones' },
  { icon: ShoppingCart, label: 'Órdenes de Compras', path: '/ordenes-compras' },
  { icon: Briefcase, label: 'Órdenes de Trabajos', path: '/ordenes-trabajos' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: Package, label: 'Servicios/Productos', path: '/servicios-productos' },
  { icon: StickyNote, label: 'Estado de Resultados', path: '/estado-resultados' },
  { icon: UserCheck, label: 'Proveedores', path: '/proveedores' },
  { icon: StickyNote, label: 'Notas', path: '/notas' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">CW</span>
          </div>
          <span className="font-semibold text-gray-800">cotizaciónweb</span>
        </div>
      </div>

      {/* Create Button */}
      <div className="p-4">
        <Link to="/crear-cotizacion">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Crear
          </Button>
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}