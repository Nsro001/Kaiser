import { getPdfMake } from "../lib/pdfMakeClient";
import { sendEmailToBackend } from "./sendEmailToBackend";

// Convierte imagen del public/ a base64
async function toBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
  });
}

export const generateCotizacionPDF = async (data: any) => {
  const {
    cliente,
    rut,
    direccion,
    email,
    telefono,
    productos,
    margen,
    flete,
    incluirFlete,
    numeroCotizacion,
    fecha,
    monedaPdf = "clp",
    exchangeRates = { clp: 1, usd: 900, eur: 1000 },
    resumenNacional = [],
    resumenNacionalTotales = null,
    soloNacional = false,
  } = data;

  const fleteMonto = incluirFlete ? Number(flete) || 0 : 0;

  // Cargar logos
  const logoHeader = await toBase64("/logo-header.png");
  const logoFooter = await toBase64("/logo-footer.png");

  // TABLA DE PRODUCTOS
  let subtotal = 0;
  const items: any[] = [];

  if (!soloNacional) {
    productos.forEach((p: any, index: number) => {
      const costo = Number(p.costoCompra);
      const entradaRate = exchangeRates[p.moneda || "clp"] || 1;
      const pdfRate = exchangeRates[monedaPdf] || 1;
      const costoEnPDF = (costo * entradaRate) / pdfRate;
      const margenItem = Number.isFinite(p.margenItem) ? Number(p.margenItem) : margen;
      const ctoFin = Number.isFinite(p.ctoFinanciero) ? Number(p.ctoFinanciero) : 0;
      const totalPct = margenItem + ctoFin;
      const denom = 1 - totalPct / 100;
      const precio = denom <= 0 ? costoEnPDF : costoEnPDF / denom;
      const total = precio * p.cantidad;
      subtotal += total;

      items.push([
        index + 1,
        p.codigo || "",
        p.nombre || "",
        p.descripcion || "",
        p.cantidad,
        `$ ${Math.round(precio).toLocaleString("es-CL")}`,
        `$ ${Math.round(total).toLocaleString("es-CL")}`,
      ]);
    });
  }

  const subtotalRounded = Math.round(subtotal);
  const ivaRounded = Math.round(subtotal * 0.19);
  const fleteRounded = Math.round(fleteMonto);
  const totalGeneralRounded = subtotalRounded + ivaRounded + fleteRounded;

  const resumenNacionalTable =
    Array.isArray(resumenNacional) && resumenNacional.length > 0
      ? {
          margin: [0, 20, 0, 0],
          fontSize: 9,
          table: {
            headerRows: 1,
            widths: [25, "*", "*", 45, 35, 45, 55, 55, 55, 55],
            body: [
              [
                { text: "#", bold: true },
                { text: "Producto", bold: true },
                { text: "Proveedor", bold: true },
                { text: "Dias", bold: true },
                { text: "Cant", bold: true },
                { text: "Moneda", bold: true },
                { text: "Valor unitario", bold: true },
                { text: "Valor neto", bold: true },
                { text: "IVA", bold: true },
                { text: "Total bruto", bold: true },
              ],
              ...resumenNacional.map((p: any, idx: number) => {
                const fmt = (v: number) => `$ ${Math.round(v || 0).toLocaleString("es-CL")}`;
                return [
                  idx + 1,
                  `${p.nombre || ""}\n${p.descripcion || ""}`,
                  p.proveedorNombre || "",
                  p.plazo || 0,
                  p.cantidad || 0,
                  (monedaPdf || "CLP").toUpperCase(),
                  fmt(p.valorUnitario),
                  fmt(p.netoNacional),
                  fmt(p.ivaNacional),
                  fmt(p.totalBruto),
                ];
              }),
            ],
          },
          layout: "lightHorizontalLines",
        }
      : null;

  const content: any[] = [];

  content.push({
    margin: [0, 0, 0, 15],
    table: {
      widths: ["50%", "50%"],
      body: [
        [
          {
            stack: [
              { text: `Nombre Empresa : ${cliente || ""}`, fontSize: 10 },
              { text: `RUT : ${rut || ""}`, fontSize: 10 },
              { text: `Correo : ${email || ""}`, fontSize: 10 },
            ],
          },
          {
            stack: [
              { text: `Direccion : ${direccion || ""}`, fontSize: 10 },
              { text: `Telefono : ${telefono || ""}`, fontSize: 10 },
            ],
          },
        ],
      ],
    },
  });

  if (!soloNacional) {
    content.push({ text: "Introduccion predeterminada", margin: [0, 0, 0, 10] });

    content.push({
      table: {
        headerRows: 1,
        widths: [20, 50, "*", "*", 50, 70, 70],
        body: [
          [
            { text: "#", bold: true },
            { text: "Codigo", bold: true },
            { text: "Servicio / Producto", bold: true },
            { text: "Descripcion", bold: true },
            { text: "Cantidad", bold: true },
            { text: "Valor", bold: true },
            { text: "Total", bold: true },
          ],
          ...items,
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? "#f0f0f0" : null),
      },
    });

    content.push({
      margin: [0, 20, 0, 10],
      alignment: "right",
      table: {
        widths: ["*", 120],
        body: [
          ["Moneda :", "Peso Chileno"],
          ["Neto :", `$ ${subtotalRounded.toLocaleString("es-CL")}`],
          ["IVA (19%) :", `$ ${ivaRounded.toLocaleString("es-CL")}`],
          ["Flete :", `$ ${fleteRounded.toLocaleString("es-CL")}`],
          [
            { text: "Total :", bold: true },
            { text: `$ ${totalGeneralRounded.toLocaleString("es-CL")}`, bold: true },
          ],
        ],
      },
    });
  }

  if (resumenNacionalTable) {
    content.push({
      text: "Resumen Cliente Nacional",
      style: "sectionHeader",
      margin: [0, 10, 0, 4],
    });
    content.push(resumenNacionalTable);
    if (resumenNacionalTotales) {
      content.push({
        margin: [0, 6, 0, 10],
        table: {
          widths: ["*", 100, 100, 100],
          body: [
            ["", "Valor neto", "IVA", "Total bruto"],
            [
              { text: "Totales", bold: true },
              { text: `$ ${Math.round(resumenNacionalTotales.neto || 0).toLocaleString("es-CL")}`, bold: true },
              { text: `$ ${Math.round(resumenNacionalTotales.iva || 0).toLocaleString("es-CL")}`, bold: true },
              { text: `$ ${Math.round(resumenNacionalTotales.total || 0).toLocaleString("es-CL")}`, bold: true },
            ],
          ],
        },
        layout: "lightHorizontalLines",
      });
    }
  }

  content.push({
    margin: [0, 30, 0, 10],
    stack: [
      { text: "Atentamente,", margin: [0, 0, 0, 5] },
      { text: "Hector Dinamarca", bold: true, fontSize: 11 },
      { text: "CEO - Kaiser Ingenieria", fontSize: 10 },
      { text: "Correo: cotizaciones@kaiseringenieria.cl", fontSize: 10 },
    ],
  });

  content.push({ text: "Conclusion predeterminada", margin: [0, 20, 0, 10] });

  const docDefinition: any = {
    pageMargins: [40, 120, 40, 80],
    defaultStyle: soloNacional ? { fontSize: 9 } : { fontSize: 10 },

    header: {
      margin: [40, 30, 40, 0],
      table: {
        widths: [80, "*", 220],
        body: [
          [
            {
              image: logoHeader,
              width: 80,
              alignment: "left",
              border: [false, false, false, false],
            },
            {
              stack: [
                { text: "Kaiser Ingenieria", bold: true, fontSize: 12 },
                { text: "www.kaiseringenieria.cl", fontSize: 10 },
              ],
              border: [false, false, false, false],
            },
            {
              stack: [
                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          text: `NRO COTIZACION\n${numeroCotizacion}`,
                          bold: true,
                          alignment: "center",
                          fontSize: 14,
                          margin: [0, 10],
                        },
                      ],
                    ],
                  },
                  layout: "lightHorizontalLines",
                },
                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          text: "Fecha: " + fecha,
                          alignment: "right",
                          margin: [0, 5],
                        },
                      ],
                    ],
                  },
                  layout: "noBorders",
                },
              ],
              border: [false, false, false, false],
            },
          ],
        ],
      },
      layout: "noBorders",
    },

    footer: function (currentPage: number, pageCount: number) {
      return {
        margin: [40, 0, 40, 20],
        columns: [
          { image: logoFooter, width: 100 },
          {
            text: "Pagina " + currentPage + "/" + pageCount,
            alignment: "right",
            fontSize: 9,
          },
        ],
      };
    },

    content,
    styles: {
      sectionHeader: {
        fontSize: soloNacional ? 11 : 12,
        bold: true,
      },
    },
  };

  const pdfMake = await getPdfMake();
  if (!pdfMake) {
    console.error("pdfMake no esta listo. Revisa la carga del CDN.");
    return;
  }

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return pdfDoc;
};
