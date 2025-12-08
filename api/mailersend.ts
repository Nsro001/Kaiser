import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { to, subject, pdfBase64, numero } = req.body as {
      to?: string;
      subject?: string;
      pdfBase64?: string;
      numero?: string;
    };

    if (!to || !pdfBase64) {
      return res.status(400).json({ error: "Faltan destinatario o adjunto" });
    }

    const host = process.env.SMTP_HOST || "smtp.mailersend.net";
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromEmail = process.env.SMTP_FROM || "cotizaciones@kaiseringenieria.cl";
    const fromName = process.env.SMTP_FROM_NAME || "Kaiser Ingeniería";
    const replyTo = process.env.SMTP_REPLY_TO || fromEmail;

    if (!user || !pass) {
      return res.status(500).json({ error: "SMTP no configurado (faltan SMTP_USER o SMTP_PASS)" });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const buffer = Buffer.from(pdfBase64, "base64");

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      replyTo,
      subject: subject || `Cotización ${numero || ""}`.trim(),
      text: "Adjuntamos la cotización.",
      attachments: [
        {
          filename: `cotizacion-${numero || ""}.pdf`,
          content: buffer,
          contentType: "application/pdf",
        },
      ],
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("ERROR enviando correo:", err);
    const message = err?.message || "Error enviando correo";
    return res.status(500).json({ error: message });
  }
}
