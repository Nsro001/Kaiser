import { getPdfMake } from "../lib/pdfMakeClient";
import { sendEmailCotizacion } from "./sendEmailCotizacion";

// Convierte imagen a base64
async function toBase64(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
  });
}

export const generateCotizacionPDF = async (data) => {
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
  } = data;

  const logoHeader = await toBase64("/logo-header.png");
  const logoFooter = await toBase64("/logo-footer.png");

  let subtotal = 0;
  const items = [];

  productos.forEach((p, index) => {
    const costo = Number(p.costoCompra);
    const precio = costo + costo * (margen / 100);
    const total = precio * p.cantidad;
    subtotal += total;

    items.push([
      index + 1,
      p.codigo || "",
      p.nombre || "",
      p.descripcion || "",
      p.cantidad,
      `$ ${precio.toLocaleString("es-CL")}`,
      `$ ${total.toLocaleString("es-CL")}`,
    ]);
  });

  const iva = subtotal * 0.19;
  const totalGeneral = subtotal + iva + (incluirFlete ? flete : 0);

  const docDefinition = {
    pageMargins: [40, 120, 40, 80],

    header: {
      margin: [40, 30, 40, 0],
      columns: [
        {
          width: "60%",
          stack: [
            { image: logoHeader, width: 140, margin: [0, 0, 0, 10] },
            { text: "Nombre Empresa", bold: true, fontSize: 11 },
            { text: "Ejecutivo : Nombre Ejecutivo", fontSize: 10 },
            { text: `Email : ${email}`, fontSize: 10 },
            { text: `Teléfono : ${telefono}`, fontSize: 10 },
            { text: "Rubro : Tecnología", fontSize: 10 },
            { text: `Rut : ${rut}`, fontSize: 10 },
            { text: "www.cotizacion-web.com", fontSize: 10 },
          ],
        },
        {
          width: "40%",
          stack: [
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      text: "N° COTIZACIÓN\n" + numeroCotizacion,
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
        },
      ],
    },

    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 20],
      columns: [
        { image: logoFooter, width: 100 },
        {
          text: "Página " + currentPage + "/" + pageCount,
          alignment: "right",
          fontSize: 9,
        },
      ],
    }),

    content: [
      {
        margin: [0, 0, 0, 15],
        table: {
          widths: ["50%", "50%"],
          body: [
            [
              {
                stack: [
                  { text: `Nombre Empresa : ${cliente}`, fontSize: 10 },
                  { text: `RUT : ${rut}`, fontSize: 10 },
                  { text: `Correo : ${email}`, fontSize: 10 },
                ],
              },
              {
                stack: [
                  { text: `Nombre : ${cliente}`, fontSize: 10 },
                  { text: `Teléfono : ${telefono}`, fontSize: 10 },
                ],
              },
            ],
          ],
        },
      },

      { text: "Introducción predeterminada", margin: [0, 0, 0, 10] },

      {
        table: {
          headerRows: 1,
          widths: [20, 50, "*", "*", 50, 70, 70],
          body: [
            [
              { text: "#", bold: true },
              { text: "Código", bold: true },
              { text: "Servicio / Producto", bold: true },
              { text: "Descripción", bold: true },
              { text: "Cantidad", bold: true },
              { text: "Valor", bold: true },
              { text: "Total", bold: true },
            ],
            ...items,
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#f0f0f0" : null),
        },
      },

      {
        margin: [0, 20, 0, 10],
        alignment: "right",
        table: {
          widths: ["*", 100],
          body: [
            ["Moneda :", "Peso Chileno"],
            ["Neto :", `$ ${subtotal.toLocaleString("es-CL")}`],
            ["IVA (19%) :", `$ ${iva.toLocaleString("es-CL")}`],
            ["Flete :", incluirFlete ? `$ ${flete.toLocaleString("es-CL")}` : "$ 0"],
            [
              { text: "Total :", bold: true },
              { text: `$ ${totalGeneral.toLocaleString("es-CL")}`, bold: true },
            ],
          ],
        },
      },

      { text: "conclusión predeterminada", margin: [0, 40, 0, 10] },
    ],
  };

  const pdfMake = await getPdfMake();
  if (!pdfMake) return;

  const pdfDoc = pdfMake.createPdf(docDefinition);

  // Descargar PDF
  pdfDoc.download("cotizacion.pdf");

  // Enviar por correo
  pdfDoc.getBase64(async (base64) => {
    await sendEmailCotizacion(base64, email);
  });
};
