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
  } = data;

  const fleteMonto = incluirFlete ? Number(flete) || 0 : 0;

  // Cargar logos
  const logoHeader = await toBase64("/logo-header.png");
  const logoFooter = await toBase64("/logo-footer.png");

  // TABLA DE PRODUCTOS
  let subtotal = 0;
  const items: any[] = [];

  productos.forEach((p: any, index: number) => {
    const costo = Number(p.costoCompra);
    const entradaRate = exchangeRates[p.moneda || "clp"] || 1;
    const pdfRate = exchangeRates[monedaPdf] || 1;
    const costoEnPDF = (costo * entradaRate) / pdfRate;
    const margenItem = Number.isFinite(p.margenItem) ? Number(p.margenItem) : margen;
    const precio = costoEnPDF * (1 + margenItem / 100);
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

  const subtotalRounded = Math.round(subtotal);
  const ivaRounded = Math.round(subtotal * 0.19);
  const fleteRounded = Math.round(fleteMonto);
  const totalGeneralRounded = subtotalRounded + ivaRounded + fleteRounded;

  const docDefinition: any = {
    pageMargins: [40, 120, 40, 80],

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
                { text: "Kaiser Ingeniería", bold: true, fontSize: 12 },
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
                          text: `N° COTIZACION\n${numeroCotizacion}`,
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

    content: [
      {
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
      },

      { text: "Introduccion predeterminada", margin: [0, 0, 0, 10] },

      {
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
      },

      {
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
      },

      {
        margin: [0, 30, 0, 10],
        stack: [
          { text: "Atentamente,", margin: [0, 0, 0, 5] },
          { text: "Héctor Dinamarca", bold: true, fontSize: 11 },
          { text: "CEO - Kaiser Ingeniería", fontSize: 10 },
          { text: "Correo: cotizaciones@kaiseringenieria.cl", fontSize: 10 },
        ],
      },

      { text: "Conclusion predeterminada", margin: [0, 20, 0, 10] },
    ],
  };

  const pdfMake = await getPdfMake();
  if (!pdfMake) {
    console.error("pdfMake no esta listo. Revisa la carga del CDN.");
    return;
  }

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return pdfDoc;
};
