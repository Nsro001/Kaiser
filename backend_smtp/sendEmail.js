
import nodemailer from 'nodemailer';

export default async function sendEmail(pdfBase64, correoDestino) {

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: '"Káiser Ingeniería" <' + process.env.SMTP_USER + '>',
    to: correoDestino,
    subject: "Cotización Solicitada",
    text: "Estimado Cliente, adjuntamos la cotización solicitada.",
    attachments: [
      {
        filename: "cotizacion.pdf",
        content: pdfBase64,
        encoding: "base64"
      }
    ]
  });
}
