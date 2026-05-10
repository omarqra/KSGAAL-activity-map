'use client';

import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

export interface Tab {
  key: string;
  label: ReactNode;
  badge?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  value?: string;
  onChange?: (key: string) => void;
}

export function Tabs({ tabs, defaultTab, value, onChange }: TabsProps) {
  const [internal, setInternal] = useState(defaultTab ?? tabs[0]?.key);
  const active = value ?? internal;

  return (
    <div className="border-b border-aws-border2 px-6 bg-white">
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              if (value === undefined) setInternal(t.key);
              onChange?.(t.key);
            }}
            className={cn('tab', active === t.key && 'active')}
          >
            {t.label}
            {t.badge && <span className="ms-1">{t.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
