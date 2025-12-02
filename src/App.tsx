import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Cotizaciones from './pages/Cotizaciones';
import CrearCotizacion from './pages/CrearCotizacion';
import Clientes from './pages/Clientes';
import ServiciosProductos from './pages/ServiciosProductos';
import Proveedores from './pages/Proveedores';
import OrdenesCompra from './pages/OrdenesCompra';
import OrdenesTrabajo from './pages/OrdenesTrabajo';
import EstadoResultados from './pages/EstadoResultados';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/crear-cotizacion" element={<CrearCotizacion />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/servicios-productos" element={<ServiciosProductos />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/ordenes-compra" element={<OrdenesCompra />} />
          <Route path="/ordenes-trabajo" element={<OrdenesTrabajo />} />
          <Route path="/estado-resultados" element={<EstadoResultados />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;