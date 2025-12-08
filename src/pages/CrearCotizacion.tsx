import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";

import CotizacionActions from "@/components/CotizacionActions";
import { generateCotizacionPDF } from "@/utils/generateCotizacionPDF";

const defaultExchange = { clp: 1, usd: 900, eur: 1000 };

type Moneda = "clp" | "usd" | "eur";

interface Cliente {
  id: string;
  nombre: string;
  rut: string;
  email: string;
  telefono?: string;
  direccion?: string;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  moneda: Moneda;
  costoCompra: number;
  proveedor?: string;
  codigo?: string;
  plazo?: number;
  margenItem?: number;
  fleteItem?: number; // porcentaje de flete
}

interface CotizacionGuardada {
  id: string;
  numero: string;
  fecha: string;
  estado: "borrador" | "enviada" | "aceptada";
  cliente: Cliente | null;
  items: Producto[];
  subtotal: number;
  iva: number;
  flete: number;
  total: number;
  monedaEntrada: Moneda;
  monedaPdf: Moneda;
  margen: number;
  ivaPorcentaje: number;
  exchangeRates: typeof defaultExchange;
}

const today = new Date().toISOString().split("T")[0];

const getCounter = () => Number(localStorage.getItem("contador_cotizaciones") || "1");
const formatCounter = (n: number) => `COT-${n.toString().padStart(4, "0")}`;
const consumeCounter = () => {
  const next = getCounter() + 1;
  localStorage.setItem("contador_cotizaciones", String(next));
  return next;
};

const toNumber = (value: string | number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const convertCurrency = (
  amount: number,
  from: Moneda,
  to: Moneda,
  rates: typeof defaultExchange
) => {
  if (!Number.isFinite(amount)) return 0;
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  return (amount * fromRate) / toRate;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(Number.isFinite(value) ? value : 0));

export default function CrearCotizacion() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [items, setItems] = useState<Producto[]>([]);
  const [exchangeRates, setExchangeRates] = useState(defaultExchange);
  const [showProductos, setShowProductos] = useState(true);

  const [formData, setFormData] = useState({
    autor: "",
    referencia: "",
    fechaEmision: today,
    monedaEntrada: "eur" as Moneda,
    monedaPdf: "clp" as Moneda,
    iva: 19,
    margen: 20, // margen global por defecto, editable por item
  });

  const [numeroCotizacion, setNumeroCotizacion] = useState(formatCounter(getCounter()));

  const [nuevoCliente, setNuevoCliente] = useState<Cliente>({
    id: "",
    nombre: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  const [nuevoProducto, setNuevoProducto] = useState<Producto>({
    id: "",
    nombre: "",
    descripcion: "",
    cantidad: 1,
    moneda: "clp",
    costoCompra: 0,
    proveedor: "",
    codigo: "",
    plazo: 0,
  });

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isProductoModal, setIsProductoModal] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Cargar datos guardados
  useEffect(() => {
    const storedClientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    const storedProductos = JSON.parse(localStorage.getItem("productos") || "[]");
    setClientes(storedClientes);
    setProductos(storedProductos);
  }, []);

  // Traer tipos de cambio actuales (si hay red)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://mindicador.cl/api");
        if (!res.ok) throw new Error("No se pudo obtener indicadores");
        const data = await res.json();
        const usd = Number(data.dolar?.valor) || defaultExchange.usd;
        const eur = Number(data.euro?.valor) || defaultExchange.eur;
        setExchangeRates({ clp: 1, usd, eur });
      } catch (err) {
        console.warn("No se pudieron actualizar tasas, usando valores locales", err);
      }
    };
    fetchRates();
  }, []);

  const selectedClient = clientes.find((c) => c.id === selectedClientId) || null;

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const from = item.moneda || formData.monedaEntrada;
      const costoEnPdf = convertCurrency(
        Number.isFinite(item.costoCompra) ? Number(item.costoCompra) : 0,
        from,
        formData.monedaPdf,
        exchangeRates
      );
      const margenItem = Number.isFinite(item.margenItem) ? Number(item.margenItem) : formData.margen;
      const precioVenta = costoEnPdf * (1 + margenItem / 100);
      const cantidad = Number.isFinite(item.cantidad) ? Number(item.cantidad) : 0;
      return acc + precioVenta * cantidad;
    }, 0);
  }, [items, formData.monedaPdf, formData.margen, exchangeRates]);

  const calcFleteMonto = (item: Producto, baseSubtotal: number) => {
    const from = item.moneda || formData.monedaEntrada;
    const costoEnPdf = convertCurrency(
      Number.isFinite(item.costoCompra) ? Number(item.costoCompra) : 0,
      from,
      formData.monedaPdf,
      exchangeRates
    );
    const margenItem = Number.isFinite(item.margenItem) ? Number(item.margenItem) : formData.margen;
    const precioVenta = costoEnPdf * (1 + margenItem / 100);
    const cantidad = Number.isFinite(item.cantidad) ? Number(item.cantidad) : 0;
    const netoItem = precioVenta * cantidad;
    const defaultPct = subtotal > 0 ? (netoItem / subtotal) * 100 : 0;
    const pct = Number.isFinite(item.fleteItem) ? Number(item.fleteItem) : defaultPct;
    return {
      netoItem,
      fletePct: pct,
      fleteMonto: netoItem * (pct / 100),
      precioUnit: precioVenta,
    };
  };

  const fleteTotal = items.reduce((acc, item) => {
    const { fleteMonto } = calcFleteMonto(item, subtotal);
    return acc + fleteMonto;
  }, 0);
  const ivaMonto = subtotal * (formData.iva / 100);
  const total = subtotal + ivaMonto + fleteTotal;

  const guardarProductoNuevo = () => {
    if (!nuevoProducto.nombre) {
      toast.error("Ingresa un nombre de producto");
      return;
    }

    const productoFinal = {
      ...nuevoProducto,
      id: `p-${Date.now()}`,
    };

    const actualizados = [...productos, productoFinal];
    setProductos(actualizados);
    localStorage.setItem("productos", JSON.stringify(actualizados));
    setNuevoProducto({
      id: "",
      nombre: "",
      descripcion: "",
      cantidad: 1,
      moneda: formData.monedaEntrada,
      costoCompra: 0,
      proveedor: "",
      codigo: "",
      plazo: 0,
    });
    setIsProductoModal(false);
    toast.success("Producto creado");
  };

  const agregarItem = (p: Producto) => {
    setItems((prev) => [
      ...prev,
      {
        ...p,
        id: `item-${Date.now()}`,
        margenItem: Number.isFinite(p.margenItem) ? p.margenItem : formData.margen,
        fleteItem: Number.isFinite(p.fleteItem) ? p.fleteItem : 0,
      },
    ]);
  };

  const actualizarItem = (id: string, data: Partial<Producto>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...data } : it)));
  };

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleExcelChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

    const nuevos: Producto[] = rows.map((row, idx) => {
      const moneda = String(row["moneda"] || row["Moneda"] || formData.monedaEntrada).toLowerCase() as Moneda;
      const valorOrigen =
        row["Valor Unitario ORIGEN"] ??
        row["valor unitario origen"] ??
        row["valor_unitario_origen"] ??
        row["Valor Unitario"] ??
        row["valor"] ??
        row["costo"] ??
        0;
      return {
        id: `excel-${Date.now()}-${idx}`,
        nombre: row["nombre"] || row["Producto"] || row["descripcion"] || "Producto",
        descripcion: row["descripcion"] || row["Descripcion"] || "",
        cantidad: toNumber(row["cantidad"] || row["Cantidad"] || 1),
        moneda: ["clp", "usd", "eur"].includes(moneda) ? moneda : formData.monedaEntrada,
        costoCompra: toNumber(valorOrigen),
        proveedor: row["proveedor"] || row["Proveedor"] || row["Nombre Proveedor"] || "",
        codigo: row["codigo"] || row["Codigo"] || "",
        plazo: toNumber(row["plazo"] || row["Plazo"] || row["Plazo Días"] || 0),
        margenItem: formData.margen,
        fleteItem: 0,
      };
    });

    const actualizados = [...productos, ...nuevos];
    setProductos(actualizados);
    localStorage.setItem("productos", JSON.stringify(actualizados));
    toast.success("Productos importados desde Excel");
    event.target.value = "";
  };

  const guardarCliente = () => {
    if (!nuevoCliente.nombre || !nuevoCliente.rut) {
      toast.error("Completa nombre y RUT del cliente");
      return;
    }
    const clienteFinal = { ...nuevoCliente, id: `cli-${Date.now()}` };
    const actualizados = [...clientes, clienteFinal];
    setClientes(actualizados);
    localStorage.setItem("clientes", JSON.stringify(actualizados));
    setSelectedClientId(clienteFinal.id);
    setNuevoCliente({ id: "", nombre: "", rut: "", email: "", telefono: "", direccion: "" });
    toast.success("Cliente creado");
  };

  const cotizacionActual: CotizacionGuardada | null = useMemo(() => {
    if (!selectedClient) return null;
    return {
      id: `cot-${Date.now()}`,
      numero: numeroCotizacion,
      fecha: formData.fechaEmision,
      estado: "borrador",
      cliente: selectedClient,
      items,
      subtotal,
      iva: ivaMonto,
      flete: fleteTotal,
      total,
      monedaEntrada: formData.monedaEntrada,
      monedaPdf: formData.monedaPdf,
      margen: formData.margen,
      ivaPorcentaje: formData.iva,
      incluirFlete: true,
      exchangeRates,
    };
  }, [selectedClient, numeroCotizacion, formData, items, subtotal, ivaMonto, fleteTotal, total, exchangeRates]);

  const guardarCotizacion = (estado: CotizacionGuardada["estado"], irLista = false) => {
    if (!cotizacionActual) {
      toast.error("Selecciona un cliente y agrega productos");
      return;
    }

    const counter = consumeCounter();
    const numero = formatCounter(counter);
    setNumeroCotizacion(numero);

    const nueva = { ...cotizacionActual, estado, numero };
    const guardadas: CotizacionGuardada[] = JSON.parse(
      localStorage.getItem("cotizaciones") || "[]"
    );

    guardadas.push(nueva);
    localStorage.setItem("cotizaciones", JSON.stringify(guardadas));
    toast.success(`Cotizacion ${numero} guardada`);

    if (irLista) navigate("/cotizaciones");
    return numero;
  };

  const verPDF = async () => {
    if (!cotizacionActual) {
      toast.error("Falta cliente o productos");
      return;
    }
    const pdf = await generateCotizacionPDF({
      cliente: cotizacionActual.cliente?.nombre,
      rut: cotizacionActual.cliente?.rut,
      direccion: cotizacionActual.cliente?.direccion,
      email: cotizacionActual.cliente?.email,
      telefono: cotizacionActual.cliente?.telefono,
      productos: cotizacionActual.items,
      margen: formData.margen,
      flete: fleteTotal,
      incluirFlete: true,
      numeroCotizacion,
      fecha: formData.fechaEmision,
      monedaPdf: formData.monedaPdf,
      exchangeRates,
    });
    pdf?.download("cotizacion.pdf");
  };

  const enviarEmailConPDF = async (numeroOverride?: string) => {
    if (!cotizacionActual || !cotizacionActual.cliente?.email) {
      toast.error("Falta correo del cliente para enviar");
      return;
    }
    const num = numeroOverride || cotizacionActual.numero;
    const pdf = await generateCotizacionPDF({
      cliente: cotizacionActual.cliente?.nombre,
      rut: cotizacionActual.cliente?.rut,
      direccion: cotizacionActual.cliente?.direccion,
      email: cotizacionActual.cliente?.email,
      telefono: cotizacionActual.cliente?.telefono,
      productos: cotizacionActual.items,
      margen: formData.margen,
      flete: fleteTotal,
      incluirFlete: true,
      numeroCotizacion: num,
      fecha: formData.fechaEmision,
      monedaPdf: formData.monedaPdf,
      exchangeRates,
    });

    if (!pdf?.getBase64) {
      toast.error("No se pudo generar el PDF para enviar");
      return;
    }

    return new Promise<void>((resolve) => {
      pdf.getBase64(async (base64Data: string) => {
        try {
          const res = await fetch("/api/mailersend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: cotizacionActual.cliente?.email,
              subject: `Cotizacion ${num}`,
              pdfBase64: base64Data,
              numero: num,
            }),
          });
          if (!res.ok) throw new Error("Error enviando correo");
          toast.success("Correo enviado con PDF adjunto");
        } catch (err) {
          console.error(err);
          toast.error("No se pudo enviar el correo");
        }
        resolve();
      });
    });
  };

  const handleGuardarYEnviar = async () => {
    if (!cotizacionActual) {
      toast.error("Selecciona un cliente y agrega productos");
      return;
    }
    const numero = guardarCotizacion("enviada");
    await enviarEmailConPDF(numero);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Crear Cotizacion</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setShowProductos((s) => !s)}>
            {showProductos ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {showProductos ? "Ocultar productos" : "Ver productos"}
          </Button>
          <Button onClick={() => setIsPreviewOpen(true)} disabled={!cotizacionActual} variant="secondary">
            <Eye className="w-4 h-4 mr-2" /> Vista previa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Autor</Label>
            <Input
              value={formData.autor}
              onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
              placeholder="Nombre autor"
            />
          </div>
          <div>
            <Label>Referencia</Label>
            <Input
              value={formData.referencia}
              onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              placeholder="Referencia"
            />
          </div>
          <div>
            <Label>Fecha emision</Label>
            <Input
              type="date"
              value={formData.fechaEmision}
              onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
            />
          </div>
          <div>
            <Label>Numero</Label>
            <Input value={numeroCotizacion} readOnly className="bg-slate-100 font-semibold" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Selecciona cliente</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} - {c.rut}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Moneda entrada</Label>
                  <Select
                    value={formData.monedaEntrada}
                    onValueChange={(v) => setFormData({ ...formData, monedaEntrada: v as Moneda })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clp">CLP</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Moneda PDF</Label>
                  <Select
                    value={formData.monedaPdf}
                    onValueChange={(v) => setFormData({ ...formData, monedaPdf: v as Moneda })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clp">CLP</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Crear cliente rapido</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nombre"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  />
                  <Input
                    placeholder="RUT"
                    value={nuevoCliente.rut}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, rut: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  />
                  <Input
                    placeholder="Telefono"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  />
                  <Input
                    placeholder="Direccion"
                    className="md:col-span-2"
                    value={nuevoCliente.direccion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                  />
                </div>
                <div className="pt-2">
                  <Button size="sm" onClick={guardarCliente}>Guardar cliente</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>IVA (%)</Label>
                  <Input
                    type="number"
                    value={formData.iva}
                    onChange={(e) => setFormData({ ...formData, iva: toNumber(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de cambio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <Label>CLP</Label>
                <Input value={exchangeRates.clp} readOnly className="bg-slate-100" />
              </div>
              <div>
                <Label>USD</Label>
                <Input
                  type="number"
                  value={exchangeRates.usd}
                  onChange={(e) => setExchangeRates({ ...exchangeRates, usd: toNumber(e.target.value) })}
                />
              </div>
              <div>
                <Label>EUR</Label>
                <Input
                  type="number"
                  value={exchangeRates.eur}
                  onChange={(e) => setExchangeRates({ ...exchangeRates, eur: toNumber(e.target.value) })}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Si no hay internet se usan valores locales. Los totales se recalculan al cambiar moneda PDF.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Productos</CardTitle>
          <div className="flex items-center gap-2">
            <Input type="file" accept=".xlsx,.xls" onChange={handleExcelChange} className="max-w-xs" />
            <Button size="sm" onClick={() => setIsProductoModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo producto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showProductos && (
            <div className="border rounded-md p-3 max-h-80 overflow-y-auto space-y-2">
              {productos.length === 0 && (
                <p className="text-sm text-slate-500">No hay productos guardados.</p>
              )}
              {productos.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-xs text-slate-500">
                      {p.moneda.toUpperCase()} {formatPrice(p.costoCompra).replace("$", "")} · Cant: {p.cantidad}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => agregarItem(p)}>
                    Agregar
                  </Button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cant</TableHead>
                    <TableHead>Moneda entrada</TableHead>
                    <TableHead>Moneda PDF</TableHead>
                    <TableHead>Margen (%)</TableHead>
                    <TableHead>Flete %</TableHead>
                    <TableHead>Precio unit (PDF)</TableHead>
                    <TableHead>IVA</TableHead>
                    <TableHead>Flete</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const from = item.moneda || formData.monedaEntrada;
                    const costoPdf = convertCurrency(
                      Number.isFinite(item.costoCompra) ? Number(item.costoCompra) : 0,
                      from,
                      formData.monedaPdf,
                      exchangeRates
                    );
                    const margenItem = Number.isFinite(item.margenItem) ? item.margenItem! : formData.margen;
                    const precioVenta = costoPdf * (1 + margenItem / 100);
                    const cantidad = Number.isFinite(item.cantidad) ? Number(item.cantidad) : 0;
                    const netoItem = precioVenta * cantidad;
                    const defaultPct = subtotal > 0 ? (netoItem / subtotal) * 100 : 0;
                    const fletePct = Number.isFinite(item.fleteItem) ? Number(item.fleteItem) : defaultPct;
                    const fleteMonto = netoItem * (fletePct / 100);
                    const ivaItem = netoItem * (formData.iva / 100);
                    const totalItem = netoItem + ivaItem + fleteMonto;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.nombre}</div>
                          <div className="text-xs text-slate-500">{item.descripcion}</div>
                        </TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{item.moneda.toUpperCase()}</TableCell>
                        <TableCell>{formData.monedaPdf.toUpperCase()}</TableCell>
                        <TableCell className="max-w-[90px]">
                          <Input
                            type="number"
                            value={Number.isFinite(item.margenItem) ? item.margenItem : formData.margen}
                            onChange={(e) =>
                              actualizarItem(item.id, { margenItem: toNumber(e.target.value) })
                            }
                          />
                        </TableCell>
                        <TableCell className="max-w-[110px]">
                          <Input
                            type="number"
                            value={fletePct}
                            onChange={(e) =>
                              actualizarItem(item.id, { fleteItem: toNumber(e.target.value) })
                            }
                          />
                        </TableCell>
                        <TableCell>{formatPrice(precioVenta)}</TableCell>
                        <TableCell>{formatPrice(ivaItem)}</TableCell>
                        <TableCell>{formatPrice(fleteMonto)}</TableCell>
                        <TableCell>{formatPrice(totalItem)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => eliminarItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Agrega productos a la cotizacion.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notas y observaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Introduccion o notas para el cliente"
              rows={4}
              value={formData.referencia}
              onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
            />
            <Textarea placeholder="Nota interna" rows={3} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Moneda PDF</span>
              <span className="font-medium">{formData.monedaPdf.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Neto</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA ({formData.iva}%)</span>
              <span>{formatPrice(ivaMonto)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Flete</span>
              <span>{formatPrice(fleteTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-2">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="pt-2 space-y-2">
              <Button className="w-full" onClick={() => guardarCotizacion("borrador")}>Guardar</Button>
              <Button className="w-full" variant="secondary" onClick={verPDF} disabled={!cotizacionActual}>
                Descargar PDF
              </Button>
              <Button className="w-full" variant="secondary" onClick={handleGuardarYEnviar} disabled={!cotizacionActual}>
                Guardar y enviar email
              </Button>
              <Button className="w-full" variant="outline" onClick={() => guardarCotizacion("enviada", true)} disabled={!cotizacionActual}>
                Guardar y salir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isProductoModal} onOpenChange={setIsProductoModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Nombre"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
            />
            <Input
              placeholder="Codigo"
              value={nuevoProducto.codigo}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo: e.target.value })}
            />
            <Input
              placeholder="Proveedor"
              value={nuevoProducto.proveedor}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, proveedor: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Plazo dias"
              value={nuevoProducto.plazo || ""}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, plazo: toNumber(e.target.value) })}
            />
            <Textarea
              className="md:col-span-2"
              placeholder="Descripcion"
              value={nuevoProducto.descripcion}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              <div>
                <Label>Costo</Label>
                <Input
                  type="number"
                  value={nuevoProducto.costoCompra}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, costoCompra: toNumber(e.target.value) })}
                />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={nuevoProducto.cantidad}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: toNumber(e.target.value) })}
                />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select
                  value={nuevoProducto.moneda}
                  onValueChange={(v) => setNuevoProducto({ ...nuevoProducto, moneda: v as Moneda })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clp">CLP</SelectItem>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={guardarProductoNuevo}>Guardar producto</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          {cotizacionActual ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{cotizacionActual.cliente?.nombre}</div>
                  <div className="text-sm text-slate-500">{cotizacionActual.cliente?.rut}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Numero: {cotizacionActual.numero}</div>
                  <div className="text-sm">Fecha: {cotizacionActual.fecha}</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cant</TableHead>
                    <TableHead>Moneda entrada</TableHead>
                    <TableHead>Moneda PDF</TableHead>
                    <TableHead>Margen (%)</TableHead>
                    <TableHead>Flete %</TableHead>
                    <TableHead>IVA</TableHead>
                    <TableHead>Flete</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacionActual.items.map((item) => {
                    const from = item.moneda || formData.monedaEntrada;
                    const costoPdf = convertCurrency(
                      Number.isFinite(item.costoCompra) ? Number(item.costoCompra) : 0,
                      from,
                      formData.monedaPdf,
                      exchangeRates
                    );
                    const margenItem = Number.isFinite(item.margenItem) ? item.margenItem! : formData.margen;
                    const precioVenta = costoPdf * (1 + margenItem / 100);
                    const cantidad = Number.isFinite(item.cantidad) ? Number(item.cantidad) : 0;
                    const netoItem = precioVenta * cantidad;
                    const defaultPct = subtotal > 0 ? (netoItem / subtotal) * 100 : 0;
                    const fletePct = Number.isFinite(item.fleteItem) ? Number(item.fleteItem) : defaultPct;
                    const fleteMonto = netoItem * (fletePct / 100);
                    const ivaItem = netoItem * (formData.iva / 100);
                    const totalItem = netoItem + ivaItem + fleteMonto;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{item.moneda.toUpperCase()}</TableCell>
                        <TableCell>{formData.monedaPdf.toUpperCase()}</TableCell>
                        <TableCell>{Number.isFinite(item.margenItem) ? item.margenItem : formData.margen}%</TableCell>
                        <TableCell>{fletePct}%</TableCell>
                        <TableCell>{formatPrice(ivaItem)}</TableCell>
                        <TableCell>{formatPrice(fleteMonto)}</TableCell>
                        <TableCell>{formatPrice(precioVenta)}</TableCell>
                        <TableCell>{formatPrice(totalItem)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

            <div className="flex flex-col items-end space-y-1">
              <div className="flex justify-between w-64 text-sm">
                <span>Neto</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between w-64 text-sm">
                <span>IVA ({formData.iva}%)</span>
                <span>{formatPrice(ivaMonto)}</span>
              </div>
              <div className="flex justify-between w-64 text-sm">
                <span>Flete</span>
                <span>{formatPrice(fleteTotal)}</span>
              </div>
              <div className="flex justify-between w-64 text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              </div>

              <CotizacionActions cotizacion={{
                cliente: cotizacionActual.cliente?.nombre,
                rut: cotizacionActual.cliente?.rut,
                direccion: cotizacionActual.cliente?.direccion,
                email: cotizacionActual.cliente?.email,
                telefono: cotizacionActual.cliente?.telefono,
                productos: cotizacionActual.items,
                margen: formData.margen,
                flete: fleteTotal,
                incluirFlete: true,
                numeroCotizacion: cotizacionActual.numero,
                fecha: cotizacionActual.fecha,
                monedaPdf: formData.monedaPdf,
                exchangeRates,
              }} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Falta info para mostrar la vista previa.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
