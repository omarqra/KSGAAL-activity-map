interface BarItem {
  label: string;
  value: number;
  flag?: string; // emoji flag
}

interface BarChartProps {
  data: BarItem[];
  color?: string;
  maxValue?: number;
}

export function BarChart({ data, color = '#024E28', maxValue }: BarChartProps) {
  const w = 600;
  const h = 240;
  const chartTop = 20;
  const chartBottom = 200;
  const chartHeight = chartBottom - chartTop;
  const peak = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;
  const max = maxValue ?? (peak > 0 ? peak * 1.1 : 1);
  const barWidth = 38;
  const groupWidth = data.length > 0 ? (w - 80) / data.length : w - 80;
  const startX = 60;

  // gridline values
  const gridSteps = 4;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => (max * i) / gridSteps).reverse();

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56" preserveAspectRatio="none">
      <g stroke="#CECECE" strokeWidth="1">
        {gridValues.map((_, i) => {
          const y = chartTop + (chartHeight * i) / gridSteps;
          return <line key={i} x1={startX} y1={y} x2={w} y2={y} />;
        })}
      </g>

      <g style={{ fontSize: 10, fill: '#474747' }} className="num" textAnchor="end">
        {gridValues.map((v, i) => {
          const y = chartTop + (chartHeight * i) / gridSteps + 4;
          return <text key={i} x={startX - 6} y={y}>{Math.round(v)}</text>;
        })}
      </g>

      <g>
        {data.map((d, i) => {
          const barH = (d.value / max) * chartHeight;
          const x = startX + i * groupWidth + (groupWidth - barWidth) / 2;
          const y = chartBottom - barH;
          const opacity = 1 - i * 0.08;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barWidth} height={barH} fill={color} opacity={Math.max(0.38, opacity)} rx="2" />
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="num"
                    style={{ fontSize: 10, fontWeight: 600, fill: '#000000' }}>
                {d.value}
              </text>
              <text x={x + barWidth / 2} y={chartBottom + 16} textAnchor="middle"
                    style={{ fontSize: 11, fill: '#474747' }}>
                {d.label}
              </text>
              {d.flag && (
                <text x={x + barWidth / 2} y={chartBottom + 32} textAnchor="middle" style={{ fontSize: 13 }}>
                  {d.flag}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
