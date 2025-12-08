import { createClient } from "@supabase/supabase-js";
import * as xlsx from "xlsx";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { archivo } = req.body;

    if (!archivo) {
      return res.status(400).json({ error: "Archivo no recibido" });
    }

    // =====================================
    // BASE64 → BUFFER → EXCEL
    // =====================================
    const buffer = Buffer.from(archivo, "base64");
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    // =====================================
    // SUPABASE CLIENT (CON SERVICE ROLE)
    // =====================================
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let proveedores = [];
    let productos = [];

    // =====================================
    // SEPARAR DATOS DESDE EL EXCEL
    // =====================================
    rows.forEach((row) => {
      proveedores.push({
        nombre: row["Nombre Proveedor"],
        rut: row["Rut Proveedor"],
        plazo_dias: row["Plazo Días"],
      });

      productos.push({
        nombre: row["Producto"],
        proveedor_rut: row["Rut Proveedor"],
        cantidad: row["Cantidad"],
        moneda: row["Moneda"],
        valor_unitario_origen: row["Valor Unitario ORIGEN"],
        valor_unitario_clp: row["Valor Unitario CLP"],
        valor_neto: row["Valor Neto"],
        valor_iva: row["Valor IVA"],
        valor_total: row["Valor Total"],
      });
    });

    // =====================================
    // INSERT PROVEEDORES
    // =====================================
    const prov = await supabase.from("proveedores").insert(proveedores);
    if (prov.error) return res.status(500).json({ error: prov.error.message });

    // =====================================
    // INSERT PRODUCTOS
    // =====================================
    const prod = await supabase.from("productos").insert(productos);
    if (prod.error) return res.status(500).json({ error: prod.error.message });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("ERROR CARGA EXCEL:", err);
    return res.status(500).json({ error: "Error procesando archivo" });
  }
}
