export async function getPdfMake() {
  if (typeof window === "undefined") return null;
  return window.pdfMake; // pdfMake global cargado por el script
}
