// Cargar pdfMake SOLO en el navegador con imports ESM válidos en Vercel
export async function getPdfMake() {
  if (typeof window === "undefined") return null;

  // Importar desde la carpeta ES (ESM real)
  const pdfMakeModule: any = await import("pdfmake/build/pdfmake.es.js");
  const vfsModule: any = await import("pdfmake/build/vfs_fonts.es.js");

  const pdfMake = pdfMakeModule.default;

  pdfMake.vfs = vfsModule.default;

  return pdfMake;
}
