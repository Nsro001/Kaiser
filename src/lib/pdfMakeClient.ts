// ARCHIVO SOLO PARA CLIENTE
if (typeof window !== "undefined") {
  // @ts-ignore
  window.Buffer = window.Buffer || require("buffer").Buffer;
}

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

export default pdfMake;
