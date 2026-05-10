import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'success' | 'warn' | 'error';

interface HealthBannerProps {
  status?: Status;
  title: string;
  detail?: string;
  link?: { href: string; label: string };
}

const config: Record<Status, { bg: string; border: string; text: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: 'bg-aws-successBg', border: 'border-green-200/70',  text: 'text-aws-success', Icon: CheckCircle2 },
  warn:    { bg: 'bg-aws-warnBg',    border: 'border-yellow-200/70', text: 'text-aws-warn',    Icon: AlertTriangle },
  error:   { bg: 'bg-aws-errorBg',   border: 'border-red-200/70',    text: 'text-aws-error',   Icon: XCircle },
};

export function HealthBanner({ status = 'success', title, detail, link }: HealthBannerProps) {
  const { bg, border, text, Icon } = config[status];
  return (
    <div className={cn('rounded-md px-4 py-2.5 flex items-center gap-3 border', bg, border)}>
      <Icon className={cn('w-4 h-4', text)} />
      <span className={cn('text-[13px] font-semibold', text)}>{title}</span>
      {detail && <span className="text-[12px] text-aws-text2">— {detail}</span>}
      {link && <a href={link.href} className="ms-auto btn-link text-[12px]">{link.label} ↗</a>}
    </div>
  );
}
