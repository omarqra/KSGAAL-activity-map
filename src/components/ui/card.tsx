import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Card({ title, description, action, className, bodyClassName, children }: CardProps) {
  const isLegacy =
    title !== undefined ||
    description !== undefined ||
    action !== undefined ||
    bodyClassName !== undefined;

  if (isLegacy) {
    return (
      <div className={cn('bg-white border border-aws-border2 rounded-md shadow-aws-card', className)}>
        {(title || action) && (
          <div className="px-4 py-3 border-b border-aws-border2 flex items-center justify-between gap-3">
            <div>
              {title && <h3 className="text-[14px] font-bold">{title}</h3>}
              {description && <p className="text-[12px] text-aws-text3 mt-0.5">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        <div className={cn('p-4', bodyClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white border border-aws-border2 rounded-md shadow-aws-card', className)}>
      {children}
    </div>
  );
}

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('px-4 py-3 border-b border-aws-border2', className)} {...rest} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...rest }, ref) => (
    <h3 ref={ref} className={cn('text-[14px] font-bold text-aws-text', className)} {...rest} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...rest }, ref) => (
    <p ref={ref} className={cn('text-[12px] text-aws-text3 mt-0.5', className)} {...rest} />
  ),
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...rest} />
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('px-4 py-3 border-t border-aws-border2', className)} {...rest} />
  ),
);
CardFooter.displayName = 'CardFooter';
