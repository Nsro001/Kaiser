
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sendEmail from './sendEmail.js';

dotenv.config();
const app = express();
app.use(express.json({limit: '10mb'}));
app.use(cors());

app.post('/send-email', async (req, res) => {
  const { pdfBase64, correoDestino } = req.body;
  try {
    await sendEmail(pdfBase64, correoDestino);
    res.json({ok:true});
  } catch (err) {
    console.error(err);
    res.status(500).json({error:'Error enviando correo'});
  }
});

app.listen(3001, () => console.log("SMTP Backend running on port 3001"));
