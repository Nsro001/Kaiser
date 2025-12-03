import emailjs from "@emailjs/browser";

export async function sendEmailCotizacion(pdfBase64, correoDestino) {
    const templateParams = {
        to_email: correoDestino,
        message:
            "Estimado Cliente, adjuntamos la cotización solicitada.\n\nAtte: Káiser Ingeniería",

        // EmailJS requiere el encabezado MIME
        my_file: `data:application/pdf;base64,${pdfBase64}`,

        // Opcional si quieres leer nombre dentro del template
        my_file_name: "cotizacion.pdf"
    };

    return emailjs.send(
        "service_iw9ptzs",
        "template_z136n79",
        templateParams,
        "XrdU-cUAGOhAEG_gt"
    );
}
