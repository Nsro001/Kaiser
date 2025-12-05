import { useParams, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function OrdenDetalle() {
  const { tipo, id } = useParams();

  const dataKey = tipo === "compra" ? "ordenes_compra" : "ordenes_trabajo";
  const lista = JSON.parse(localStorage.getItem(dataKey) || "[]");
  const orden = lista.find((o: any) => o.id === id);

  if (!orden) {
    return (
      <div className="p-6">
        <p>Orden no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="p-6">

      <Link to={`/ordenes-${tipo}`} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Link>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Orden {orden.numero}</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Cliente:</strong> {orden.cliente?.nombre}</p>
          <p><strong>Fecha:</strong> {orden.fechaCreacion}</p>
          <p><strong>Total:</strong> ${orden.total}</p>

          <h3 className="font-semibold mt-4">Items</h3>

          {orden.items?.map((item: any) => (
            <div key={item.id} className="border-b py-2">
              {item.nombre} — {item.cantidad} x ${item.precio}
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
