// Este archivo entrega pdfMake SOLO en el navegador usando dynamic import.
export async function getPdfMake() {
    if (typeof window === "undefined") return null;

    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    const pdfFonts = (await import("pdfmake/build/vfs_fonts")).default;

    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    return pdfMake;
}
