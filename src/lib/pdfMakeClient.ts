// pdfMake cargado SOLO en el navegador usando imports dinámicos seguros
export async function getPdfMake() {
    if (typeof window === "undefined") return null;

    // Import dinámico con extensión .js (critico para Vercel)
    const pdfMakeModule = await import("pdfmake/build/pdfmake.js");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");

    const pdfMake = pdfMakeModule.default;
    pdfMake.vfs = pdfFontsModule.default.pdfMake.vfs;

    return pdfMake;
}
