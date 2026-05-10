interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel?: string;
  centerSubLabel?: string;
}

export function DonutChart({ segments, centerLabel, centerSubLabel }: DonutChartProps) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 46;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
      <svg viewBox="0 0 120 120" className="w-full">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#CECECE" strokeWidth="18" opacity="0.4" />
        {segments.map((seg) => {
          const dash = (seg.value / total) * circumference;
          const dashoffset = -offset;
          offset += dash;
          return (
            <circle
              key={seg.label}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash.toFixed(2)} ${circumference.toFixed(2)}`}
              strokeDashoffset={dashoffset.toFixed(2)}
              transform="rotate(-90 60 60)"
            />
          );
        })}
        {centerLabel && (
          <>
            <text x="60" y="58" textAnchor="middle" className="num" style={{ fontSize: 18, fontWeight: 600, fill: '#000000' }}>
              {centerLabel}
            </text>
            {centerSubLabel && (
              <text x="60" y="73" textAnchor="middle" style={{ fontSize: 9, fill: '#474747' }}>
                {centerSubLabel}
              </text>
            )}
          </>
        )}
      </svg>

      <ul className="space-y-2 text-[13px]">
        {segments.map((seg) => {
          const pct = ((seg.value / total) * 100).toFixed(0);
          return (
            <li key={seg.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color }} />
              <span>{seg.label}</span>
              <span className="ms-auto num font-semibold">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
