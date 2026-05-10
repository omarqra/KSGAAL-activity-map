import { type ReactNode } from 'react';

interface PageHeaderProps {
  meta?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ meta, title, description, actions }: PageHeaderProps) {
  return (
    <div className="px-6 pt-5 pb-3 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        {meta && <div className="text-[12px] text-aws-text3 mb-1 num">{meta}</div>}
        <h1 className="text-[24px] font-bold leading-tight">{title}</h1>
        {description && <p className="text-[13px] text-aws-text2 mt-1 max-w-3xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
