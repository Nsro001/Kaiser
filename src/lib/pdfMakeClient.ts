// Cargar pdfMake SOLO en el navegador con ESM real
export async function getPdfMake() {
  if (typeof window === "undefined") return null;

  const pdfMakeModule: any = await import("pdfmake/build/pdfmake.js");
  const vfsModule: any = await import("pdfmake/build/vfs_fonts.js");

  const pdfMake = pdfMakeModule.default;

  pdfMake.vfs = vfsModule.default;

  return pdfMake;
}
