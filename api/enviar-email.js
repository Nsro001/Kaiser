import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { to, subject, message } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Falta destinatario" });
    }

    const client = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || "",
    });

    const from = new Sender("cotizaciones@kaiseringenieria.cl", "Kaiser Ingeniería");
    const recipients = [new Recipient(to, "")];

    const params = new EmailParams()
      .setFrom(from)
      .setTo(recipients)
      .setSubject(subject || "Cotización Kaiser Ingeniería")
      .setHtml(message || "<p>Mensaje vacío</p>");

    const result = await client.email.send(params);

    return res.status(200).json({ ok: true, result });

  } catch (error: any) {
    console.error("MAILERSEND ERROR:", error?.response?.body || error);
    return res.status(500).json({ error: "Error enviando correo" });
  }
}
