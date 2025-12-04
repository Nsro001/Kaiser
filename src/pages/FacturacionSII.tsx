import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FacturacionSII() {
  const [rutEmpresa, setRutEmpresa] = useState("");
  const [tokenSII, setTokenSII] = useState("");
  const [estado, setEstado] = useState("");

  const generarFactura = async () => {
    setEstado("Enviando factura al SII...");
    try {
      const response = await fetch("/api/sii/generar-factura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rutEmpresa,
          tokenSII
        }),
      });

      const data = await response.json();
      setEstado("Factura generada correctamente: " + data.folio);
    } catch (error) {
      setEstado("Error al emitir factura.");
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Facturación Automática SII</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="RUT Empresa"
              className="border p-2 rounded w-full"
              value={rutEmpresa}
              onChange={(e) => setRutEmpresa(e.target.value)}
            />

            <input
              type="password"
              placeholder="Token API SII"
              className="border p-2 rounded w-full"
              value={tokenSII}
              onChange={(e) => setTokenSII(e.target.value)}
            />

            <Button className="w-full" onClick={generarFactura}>
              Generar Factura
            </Button>

            {estado && <p className="text-sm text-gray-600">{estado}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
