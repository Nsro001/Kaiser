import emailjs from "@emailjs/browser";

export async function sendCotizacionEmail(pdfBase64, correoDestino) {
    const templateParams = {
        to_email: correoDestino,
        message:
        "Estimado Cliente en base a lo solicitado adjunto envío cotización solicitada. Quedamos atentos ante cualquier duda o consulta.\n\nAtte: Káiser Ingeniería",

        // IMPORTANTE: este nombre debe coincidir con EmailJS
        _pdf: pdfBase64,
    };

    return emailjs.send(
        "service_iw9ptzs",
        "template_z136n79",
        templateParams,
        "XrdU-cUAGOhAEG_gt"
    );
}
