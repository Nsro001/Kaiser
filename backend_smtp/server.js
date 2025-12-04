// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sendEmail from "./sendEmail.js";

dotenv.config();
const app = express();

app.use(express.json({ limit: "20mb" })); // permite PDF grandes
app.use(cors());

app.post("/send-email", async (req, res) => {
  const { pdfBase64, correoDestino } = req.body;

  if (!pdfBase64 || !correoDestino) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  try {
    console.log("📨 Enviando correo vía MailerSend…");
    await sendEmail(pdfBase64, correoDestino);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error enviando correo:", err);
    res.status(500).json({ error: "Error enviando correo" });
  }
});

app.listen(3001, () => {
  console.log("🚀 SMTP Backend corriendo en puerto 3001");
});
