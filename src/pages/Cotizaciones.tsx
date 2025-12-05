import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Search,
  Eye,
  Mail,
  Trash2,
  Plus,
  FileText,
  Briefcase,
  ArrowLeft
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

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
  estado: "borrador" | "enviada" | "aprobada" | "rechazada" | "expirada";
  margen: number;
  flete: number;
  incluirFlete: boolean;
}

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [cotizacionSeleccionada, setCotizacionSeleccionada] =
    useState<Cotizacion | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const [emailData, setEmailData] = useState({
    destinatario: "",
    asunto: "",
    mensaje: ""
  });

  // ============================
  // CARGA DE COTIZACIONES
  // ============================
  useEffect(() => {
    const guardadas = JSON.parse(
      localStorage.getItem("cotizaciones") || "[]"
    ) as Cotizacion[];
    const ahora = new Date();

    const procesadas = guardadas.map((c) => {
      // Migra estados antiguos y marca expiradas
      let estado = c.estado as string;

      // Si en datos viejos venía "aceptada", ahora será "aprobada"
      if (estado === "aceptada") estado = "aprobada";

      const diffMs = ahora.getTime() - new Date(c.fecha).getTime();
      const diffDias = diffMs / (1000 * 60 * 60 * 24);

      if (
        diffDias >= 30 &&
        !["aprobada", "rechazada", "expirada"].includes(estado)
      ) {
        estado = "expirada";
      }

      return { ...c, estado: estado as Cotizacion["estado"] };
    });

    setCotizaciones(procesadas);
    localStorage.setItem("cotizaciones", JSON.stringify(procesadas));
  }, []);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP"
    }).format(p);

  const getEstadoBadge = (estado: Cotizacion["estado"]) => {
    const colors: Record<Cotizacion["estado"], string> = {
      borrador: "bg-gray-100 text-gray-800",
      enviada: "bg-blue-100 text-blue-800",
      aprobada: "bg-green-100 text-green-800",
      rechazada: "bg-red-100 text-red-800",
      expirada: "bg-amber-100 text-amber-800"
    };

    const label =
      estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();

    return <Badge className={colors[estado]}>{label}</Badge>;
  };

  // ============================
  // ACTUALIZAR ESTADO
  // ============================
  const actualizarEstadoCotizacion = (
    id: string,
    nuevoEstado: Cotizacion["estado"]
  ) => {
    const nuevas = cotizaciones.map((c) =>
      c.id === id ? { ...c, estado: nuevoEstado } : c
    );

    setCotizaciones(nuevas);
    localStorage.setItem("cotizaciones", JSON.stringify(nuevas));
    toast.success(`Estado actualizado a: ${nuevoEstado}`);
  };

  // ============================
  // CREAR ORDEN
  // ============================
  const convertirAOrden = (cot: Cotizacion, tipo: "compra" | "trabajo") => {
    const key = tipo === "compra" ? "ordenes_compra" : "ordenes_trabajo";
    const ordenes = JSON.parse(localStorage.getItem(key) || "[]");

    const nuevaOrden = {
      ...cot,
      id: Date.now().toString(),
      numero: `O${tipo === "compra" ? "C" : "T"}-${Date.now()}`,
      cotizacionOriginal: cot.numero,
      fechaCreacion: new Date().toISOString().split("T")[0],
      estado: "pendiente"
    };

    ordenes.push(nuevaOrden);
    localStorage.setItem(key, JSON.stringify(ordenes));

    toast.success(`Orden de ${tipo} creada: ${nuevaOrden.numero}`);
  };

  // ============================
  // ENVIAR EMAIL
  // ============================
  const prepararEmail = (c: Cotizacion) => {
    setCotizacionSeleccionada(c);
    setEmailData({
      destinatario: c.cliente?.email || "",
      asunto: `Cotización ${c.numero} - ${c.cliente?.nombre}`,
      mensaje: `Estimado/a,\n\nAdjunto encontrará la cotización ${
        c.numero
      } por un total de ${formatPrice(
        c.total
      )}.\n\nQuedamos atentos a sus comentarios.\n\nSaludos cordiales.`
    });
    setIsEmailOpen(true);
  };

  const enviarEmail = async () => {
    if (!cotizacionSeleccionada) return;

    try {
      // 🔵 Aquí deberías llamar a tu backend real (Supabase / Node / etc.)
      // Ejemplo:
      // await fetch("https://tu-backend.com/enviar-email", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     to: emailData.destinatario,
      //     subject: emailData.asunto,
      //     message: emailData.mensaje,
      //     cotizacion: cotizacionSeleccionada,
      //   }),
      // });

      // Por ahora solo simulamos:
      toast.success(`Email enviado a ${emailData.destinatario}`);

      // Cerrar modal
      setIsEmailOpen(false);

      // Actualizar estado a "enviada"
      actualizarEstadoCotizacion(cotizacionSeleccionada.id, "enviada");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo enviar el email");
    }
  };

  // ============================
  // ELIMINAR COTIZACIÓN
  // ============================
  const eliminarCotizacion = (id: string) => {
    const nuevas = cotizaciones.filter((c) => c.id !== id);
    setCotizaciones(nuevas);
    localStorage.setItem("cotizaciones", JSON.stringify(nuevas));
    toast.success("Cotización eliminada");
  };

  // ============================
  // FILTROS
  // ============================
  const filtradas = cotizaciones.filter((c) => {
    const estadoOK = filtroEstado === "todos" || c.estado === filtroEstado;
    const busquedaOK =
      busqueda === "" ||
      c.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cliente?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cliente?.rut.includes(busqueda);

    return estadoOK && busquedaOK;
  });

  // ============================
  // MODAL VISTA PREVIA
  // ============================
  const abrirPreview = (c: Cotizacion) => {
    setCotizacionSeleccionada(c);
    setIsPreviewOpen(true);
  };

  const modalPreview = (
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vista previa de cotización</DialogTitle>
        </DialogHeader>

        {cotizacionSeleccionada && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold">
                Cotización {cotizacionSeleccionada.numero}
              </h2>
              <p className="text-sm text-gray-500">
                Fecha:{" "}
                {new Date(
                  cotizacionSeleccionada.fecha
                ).toLocaleDateString("es-CL")}
              </p>
            </div>

            {cotizacionSeleccionada.cliente && (
              <div>
                <h3 className="font-semibold mb-1">Cliente</h3>
                <p>{cotizacionSeleccionada.cliente.nombre}</p>
                <p>RUT: {cotizacionSeleccionada.cliente.rut}</p>
                <p>Email: {cotizacionSeleccionada.cliente.email}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Detalle</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio unitario</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacionSeleccionada.items.map((item) => (
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

            <div className="border-t pt-4 text-right space-y-1">
              <div>Subtotal: {formatPrice(cotizacionSeleccionada.subtotal)}</div>
              <div>IVA (19%): {formatPrice(cotizacionSeleccionada.iva)}</div>
              <div className="font-bold text-lg">
                Total: {formatPrice(cotizacionSeleccionada.total)}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // ============================
  // MODAL EMAIL
  // ============================
  const modalEmail = (
    <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar Cotización por Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Destinatario</Label>
            <Input
              type="email"
              value={emailData.destinatario}
              onChange={(e) =>
                setEmailData({ ...emailData, destinatario: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Asunto</Label>
            <Input
              value={emailData.asunto}
              onChange={(e) =>
                setEmailData({ ...emailData, asunto: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Mensaje</Label>
            <Textarea
              rows={6}
              value={emailData.mensaje}
              onChange={(e) =>
                setEmailData({ ...emailData, mensaje: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEmailOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={enviarEmail} className="bg-green-600 text-white">
              <Mail className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ============================
  // RENDER
  // ============================
  return (
    <div className="p-6">
      {modalPreview}
      {modalEmail}

      {/* BOTÓN VOLVER */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Link>
      </div>

      {/* HEADER */}
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
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cotización
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
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
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

      {/* LISTADO */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones ({filtradas.length})</CardTitle>
        </CardHeader>

        <CardContent>
          {filtradas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay cotizaciones encontradas
            </p>
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
                {filtradas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.numero}</TableCell>

                    <TableCell>
                      <div className="font-medium">{c.cliente?.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {c.cliente?.rut}
                      </div>
                    </TableCell>

                    <TableCell>
                      {new Date(c.fecha).toLocaleDateString("es-CL")}
                    </TableCell>

                    <TableCell>{formatPrice(c.total)}</TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getEstadoBadge(c.estado)}

                        <Select
                          value={c.estado}
                          onValueChange={(nuevo) =>
                            actualizarEstadoCotizacion(
                              c.id,
                              nuevo as Cotizacion["estado"]
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue />
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
                          onClick={() => abrirPreview(c)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => prepararEmail(c)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => convertirAOrden(c, "compra")}
                            >
                              Crear Orden de Compra
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => convertirAOrden(c, "trabajo")}
                            >
                              Crear Orden de Trabajo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => eliminarCotizacion(c.id)}
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
    </div>
  );
}
