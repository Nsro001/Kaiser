Sistema de Cotizaciones - TODO
Archivos a crear:
src/pages/Index.tsx - Dashboard principal con métricas y gráficos
src/pages/Cotizaciones.tsx - Lista de cotizaciones con filtros
src/pages/CrearCotizacion.tsx - Formulario para crear nueva cotización
src/components/Sidebar.tsx - Barra lateral de navegación
src/components/Header.tsx - Header con logo y usuario
src/components/DashboardCards.tsx - Tarjetas de métricas del dashboard
src/components/Charts.tsx - Gráficos de barras para el dashboard
src/App.tsx - Actualizar rutas y layout principal
Funcionalidades principales:
Dashboard con métricas de cotizaciones (Aceptadas, Revisar, En Proceso, etc.)
Lista de cotizaciones con filtros por estado
Formulario de creación de cotizaciones con:
Información del cliente
Configuración de monedas
Editor de texto enriquecido
Tipos de visualización
Navegación entre secciones
Diseño responsive similar al original
Estructura de datos:
Estados: Aceptadas, Revisar, En Proceso, Rechazada, Descartada, Expirada
Campos: Autor, Referencia, Fecha emisión, Cliente, Moneda, etc.