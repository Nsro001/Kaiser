import nodemailer from "nodemailer";

export default async function sendEmail(pdfBase64, correoDestino) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: '"Kaiser Ingeniería" <cotizaciones@kaiseringenieria.cl>',
    to: correoDestino,
    subject: "Cotización Kaiser Ingeniería",
    text: "Estimado Cliente, adjuntamos la cotización solicitada.\n\nAtte: Káiser Ingeniería",
    attachments: [
      {
        filename: "cotizacion.pdf",
        content: Buffer.from(pdfBase64, "base64"),
        contentType: "application/pdf",
      },
    ],
  });
}
