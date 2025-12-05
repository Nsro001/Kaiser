import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("ordenes_compra") || "[]");
    setOrdenes(data);
  }, []);

  const eliminarOrden = (id: string) => {
    const nuevas = ordenes.filter((o) => o.id !== id);
    setOrdenes(nuevas);
    localStorage.setItem("ordenes_compra", JSON.stringify(nuevas));
    toast.success("Orden eliminada");
  };

  return (
    <div className="p-6">

      {/* Botón volver */}
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-4">Órdenes de Compra</h1>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Órdenes ({ordenes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {ordenes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay órdenes creadas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell>{orden.numero}</TableCell>
                    <TableCell>{orden.cliente?.nombre || "Sin cliente"}</TableCell>
                    <TableCell>{new Date(orden.fechaCreacion).toLocaleDateString("es-CL")}</TableCell>
                    <TableCell>${orden.total}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link to={`/ordenes-compra/${orden.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => eliminarOrden(orden.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
