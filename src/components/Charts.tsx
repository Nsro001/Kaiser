import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Charts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Valores Cotizaciones Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Valores Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-center space-x-8">
            <div className="flex flex-col items-center">
              <div className="w-12 bg-green-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">aceptadas</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-yellow-400 rounded-t" style={{ height: '200px' }}></div>
              <span className="text-xs mt-2 text-gray-600">revisar</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-blue-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">en proceso</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-red-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">rechazada</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-purple-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">descartada</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-gray-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">expirada</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-4">
            <span>0</span>
            <span>5.000</span>
            <span>10.000</span>
            <span>15.000</span>
            <span>20.000</span>
            <span>25.000</span>
            <span>30.000</span>
          </div>
        </CardContent>
      </Card>

      {/* Cantidades Cotizaciones Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Cantidades Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-center space-x-8">
            <div className="flex flex-col items-center">
              <div className="w-12 bg-green-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">aceptadas</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-yellow-400 rounded-t" style={{ height: '200px' }}></div>
              <span className="text-xs mt-2 text-gray-600">revisar</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-blue-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">en proceso</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-red-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">rechazada</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-purple-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">descartada</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-gray-400 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs mt-2 text-gray-600">expirada</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-4">
            <span>0.0</span>
            <span>0.2</span>
            <span>0.4</span>
            <span>0.6</span>
            <span>0.8</span>
            <span>1.0</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}