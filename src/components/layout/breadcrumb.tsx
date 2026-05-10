'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

const labels: Record<string, string> = {
  '': 'bcOverview',
  'dashboard': 'bcOverview',
  'activities': 'bcActivities',
  'activity-types': 'bcActivityTypes',
  'organizations': 'bcOrganizations',
  'countries': 'bcCountries',
  'globe': 'bcGlobe',
  'reports': 'bcReports',
  'audit-logs': 'bcAuditLogs',
  'settings': 'bcSettings',
  'permissions': 'bcPermissions',
};

export default function Breadcrumb() {
  const t = useTranslations('Layout');
  const pathname = usePathname() ?? '/';
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : '';
  const current =
    segments.length > 0
      ? labels[lastSegment]
        ? t(labels[lastSegment] as any)
        : lastSegment
      : t('bcOverview');

  return (
    <div className="bg-white border-b border-aws-border2 h-9 flex items-center px-5 text-[13px] fixed inset-x-0 top-10 z-30">
      <Link href={"/" as any} className="text-aws-link hover:underline">{t('bcConsole')}</Link>
      <span className="crumb-sep" />
      <Link href={"/" as any} className="text-aws-link hover:underline">{t('bcAdmin')}</Link>
      <span className="crumb-sep" />
      <span className="text-aws-text2">{current}</span>
    </div>
  );
}
