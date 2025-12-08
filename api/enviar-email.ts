import type { VercelRequest, VercelResponse } from "vercel";
import nodemailer from "nodemailer";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { to, subject, html, attachments } = req.body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT), // 587
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
      to,
      replyTo: process.env.SMTP_REPLY_TO,
      subject,
      html,
      attachments,
    });

    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return res.status(500).json({ error: "Error enviando correo" });
  }
}
