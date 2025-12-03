import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sendEmail from './sendEmail.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(cors());

app.post("/send-email", async (req, res) => {
  const { pdfBase64, correoDestino } = req.body;

  try {
    await sendEmail(pdfBase64, correoDestino);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error enviando correo:", error);
    res.status(500).json({ error: "Error enviando correo" });
  }
});

app.listen(process.env.PORT || 3001, () =>
  console.log("SMTP Backend running on port", process.env.PORT || 3001)
);
