// ESTE ARCHIVO SOLO SE EJECUTA EN EL CLIENTE
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

export default pdfMake;
