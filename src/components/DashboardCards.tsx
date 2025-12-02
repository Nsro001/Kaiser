import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'green' | 'yellow' | 'blue' | 'red' | 'purple' | 'gray';
  percentage?: string;
}

const MetricCard = ({ title, value, subtitle, color, percentage }: MetricCardProps) => {
  const colorClasses = {
    green: 'bg-green-100 border-green-200',
    yellow: 'bg-yellow-100 border-yellow-200',
    blue: 'bg-blue-100 border-blue-200',
    red: 'bg-red-100 border-red-200',
    purple: 'bg-purple-100 border-purple-200',
    gray: 'bg-gray-100 border-gray-200',
  };

  const textColors = {
    green: 'text-green-800',
    yellow: 'text-yellow-800',
    blue: 'text-blue-800',
    red: 'text-red-800',
    purple: 'text-purple-800',
    gray: 'text-gray-800',
  };

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-medium ${textColors[color]}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className={`text-2xl font-bold ${textColors[color]}`}>
            {value}
          </div>
          <div className="text-xs text-gray-600">
            {subtitle}
          </div>
          {percentage && (
            <div className="text-xs text-gray-500">
              Razón valor: {percentage}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardCards() {
  const metrics = [
    {
      title: 'Aceptadas',
      value: '$0',
      subtitle: 'Cantidad: 0',
      color: 'green' as const,
      percentage: '0%',
    },
    {
      title: 'Revisar',
      value: '$30.000',
      subtitle: 'Cantidad: 1',
      color: 'yellow' as const,
      percentage: '100.00%',
    },
    {
      title: 'En Proceso',
      value: '$0',
      subtitle: 'Cantidad: 0',
      color: 'blue' as const,
      percentage: '0%',
    },
    {
      title: 'Rechazada',
      value: '$0',
      subtitle: 'Cantidad: 0',
      color: 'red' as const,
      percentage: '0%',
    },
    {
      title: 'Descartada',
      value: '$0',
      subtitle: 'Cantidad: 0',
      color: 'purple' as const,
      percentage: '0%',
    },
    {
      title: 'Expirada',
      value: '$0',
      subtitle: 'Cantidad: 0',
      color: 'gray' as const,
      percentage: '0%',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}