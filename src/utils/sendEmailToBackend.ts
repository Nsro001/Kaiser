export async function sendEmailToBackend(pdfBase64: string, correoDestino: string) {
  try {
    const resp = await fetch("http://localhost:3001/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfBase64, correoDestino }),
    });

    return resp.json();
  } catch (err) {
    console.error("Error enviando al backend:", err);
    return { ok: false, error: err };
  }
}
