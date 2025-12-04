import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export type DashboardBackButtonProps = React.ComponentProps<typeof Button>;

export function DashboardBackButton({ className, variant = 'outline', ...props }: DashboardBackButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn('gap-2', className)}
      asChild
      {...props}
    >
      <Link to="/">
        <ArrowLeft className="w-4 h-4" />
        Volver al Dashboard
      </Link>
    </Button>
  );
}

export default DashboardBackButton;