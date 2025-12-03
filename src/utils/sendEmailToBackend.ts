export async function sendEmailToBackend(pdfBase64: string, correoDestino: string) {
  try {
    const resp = await fetch("https://kaiser-backend.onrender.com/send-email", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pdfBase64,
        correoDestino,
      }),
    });

    if (!resp.ok) {
      console.error("Error desde backend:", await resp.text());
      return { ok: false };
    }

    return await resp.json();

  } catch (err) {
    console.error("Error enviando al backend:", err);
    return { ok: false };
  }
}
