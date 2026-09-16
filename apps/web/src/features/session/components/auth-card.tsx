import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Shared frame of the auth screens. */
export function AuthCard({
  title,
  description,
  children,
  footer
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>
          <h1>{title}</h1>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {children}
        {footer && <div className='text-muted-foreground text-center text-sm'>{footer}</div>}
      </CardContent>
    </Card>
  );
}
