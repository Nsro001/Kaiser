// ==========================
//  ServiciosProductos.tsx
// ==========================
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ServiciosProductos() {
  const [productos, setProductos] = useState([]);

  // ==========================
  // CARGAR PRODUCTOS DESDE SUPABASE (después lo activamos)
  // ==========================
  useEffect(() => {
    // Aquí luego conectamos la carga desde Supabase
  }, []);

  // ==========================
  // FUNCIÓN SUBIR EXCEL
  // ==========================
  const handleExcelUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Procesando archivo Excel...");

      const reader = new FileReader();

      reader.onload = async () => {
        const base64File = (reader.result as string).split(",")[1];

        const resp = await fetch("/api/cargar-excel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ archivo: base64File }),
        });

        if (!resp.ok) {
          throw new Error(`Error ${resp.status} al cargar Excel`);
        }

        const data = await resp.json().catch(() => ({})); // protege ante cuerpos vacíos

        if (data && (data.ok || resp.ok)) {
          toast.success("Excel cargado correctamente 🎉");
        } else {
          throw new Error("Error al cargar Excel");
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error cargando Excel:", error);
      toast.error("Error cargando archivo");
    }
  };

  return (
    <div className="p-6">

      {/* TÍTULO */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Servicios y Productos
        </h1>

        {/* BOTÓN CARGAR EXCEL */}
        <div>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => document.getElementById("excelUpload")?.click()}
          >
            📁 Cargar Excel de Productos
          </Button>

          <input
            id="excelUpload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleExcelUpload}
          />
        </div>
      </div>

      {/* CARD DE LISTADO */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Productos</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-gray-500">
            (Aquí mostraremos los productos cargados desde Supabase)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
