import React from "react";
import { generateCotizacionPDF } from "@/utils/generateCotizacionPDF";

export default function CotizacionActions({ cotizacion }) {

  const handleDescargar = async () => {
    const pdf = await generateCotizacionPDF(cotizacion);
    pdf.download(`Cotizacion_${cotizacion.numeroCotizacion}.pdf`);
  };

  const handleEnviarEmail = async () => {
    const pdf = await generateCotizacionPDF(cotizacion);

    pdf.getBase64(async (base64Data) => {
      try {
        await fetch("http://localhost:3001/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfBase64: base64Data,
            correoDestino: cotizacion.email,
          }),
        });

        alert("Correo enviado exitosamente.");
      } catch (err) {
        console.error("ERROR enviando correo:", err);
        alert("Error enviando correo.");
      }
    });
  };

  return (
    <div className="flex justify-end space-x-2 pt-4">
    <button
    onClick={handleDescargar}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
    >
    Descargar PDF
    </button>

    <button
    onClick={handleEnviarEmail}
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
    >
    Enviar por Email
    </button>
    </div>
  );
}
