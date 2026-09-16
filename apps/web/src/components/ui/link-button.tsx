import Link from 'next/link';
import type { ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LinkButtonProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

/**
 * Next `Link` styled as a Button. Prefer this over `<Button render={<Link/>}>`:
 * the render-prop form leaves an empty anchor in the tree for a11y lint.
 */
export function LinkButton({ className, variant, size, children, ...props }: LinkButtonProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}
