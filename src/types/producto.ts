// Monedas soportadas para el costo/origen
export type Moneda = "CLP" | "USD" | "EUR";

// Datos del proveedor asociado a la línea de producto
export interface DatosProveedorProducto {
  nombreProveedor: string;
  rutProveedor: string;
  plazoDias: number; // plazo de entrega en días
}

// Datos base del producto en la cotización
export interface ProductoBase {
  id?: string;             // id local o de supabase
  nombre: string;          // nombre del producto
  cantidad: number;        // unidades
  moneda: Moneda;          // moneda del costo de origen
  valorUnitarioOrigen: number; // valor unitario en moneda origen (USD/EUR/etc)
  valorUnitarioCLP: number;    // valor unitario convertido a CLP
}

// Cálculos estándar de impuestos
export interface ProductoCostoCalculado {
  valorNeto: number;  // cantidad * valorUnitarioCLP
  valorIVA: number;   // valorNeto * 0.19 (u otro)
  valorTotal: number; // valorNeto + valorIVA
}

// Márgenes internos (solo para ti, no para el cliente)
export interface ProductoMargen {
  margenPorcentaje: number; // % de margen sobre valorNeto
  margenMonto: number;      // valorNeto * margenPorcentaje / 100
  precioVentaNeto: number;  // valorNeto + margenMonto (esto es lo que ve el cliente)
}

// Flete imputado proporcionalmente a esta línea
export interface ProductoFlete {
  fleteMonto: number;          // monto de flete asignado a este producto
  fleteProporcionalPorc: number; // % del flete total que le corresponde a esta línea
}

// Modelo final de la línea de cotización (interno)
export type LineaProductoCotizado =
  ProductoBase &
  DatosProveedorProducto &
  ProductoCostoCalculado &
  ProductoMargen &
  ProductoFlete;
