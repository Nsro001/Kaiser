import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { to, subject, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mailersend.net",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILERSEND_USER,
        pass: process.env.MAILERSEND_PASS
      }
    });

    await transporter.sendMail({
      from: "cotizaciones@kaiseringenieria.cl",
      to,
      subject,
      text: message
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ error: "Error enviando email" });
  }
}
