// pdfMake cargado SOLO en el navegador usando imports dinámicos seguros
export async function getPdfMake() {
    if (typeof window === "undefined") return null;

    // Uso de rutas relativas para evitar errores del editor
    const pdfMakeModule = await import("pdfmake/build/pdfmake.js");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");

    const pdfMake = pdfMakeModule.default;

    // pdfFontsModule.default → contiene {pdfMake:{vfs:{...}}}
    pdfMake.vfs = pdfFontsModule.default.pdfMake.vfs;

    return pdfMake;
}
