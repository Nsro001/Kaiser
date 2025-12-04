// sendEmail.js
import nodemailer from "nodemailer";

export default async function sendEmail(pdfBase64, correoDestino) {
  const transporter = nodemailer.createTransport({
    host: "smtp.mailersend.net",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILERSEND_SMTP_LOGIN,
      pass: process.env.MAILERSEND_SMTP_PASSWORD
    }
  });

  const mailOptions = {
    from: "cotizaciones@kaiseringenieria.cl",
    to: correoDestino,
    subject: "Cotización Solicitada – Káiser Ingeniería",
    text: "Estimado cliente, adjuntamos la cotización solicitada.\n\nAtte: Káiser Ingeniería.",
    attachments: [
      {
        filename: "cotizacion.pdf",
        content: pdfBase64,
        encoding: "base64"
      }
    ]
  };

  await transporter.sendMail(mailOptions);
}
