// Cargar pdfMake SOLO en el navegador usando dynamic import
export async function getPdfMake() {
  if (typeof window === "undefined") return null;

  const pdfMakeModule: any = await import("pdfmake/build/pdfmake.js");
  const pdfFontsModule: any = await import("pdfmake/build/vfs_fonts.js");

  // pdfMake real
  const pdfMake = pdfMakeModule.default;

  // vfs viene directo en pdfFontsModule.pdfMake.vfs
  pdfMake.vfs = pdfFontsModule.pdfMake.vfs;

  return pdfMake;
}
