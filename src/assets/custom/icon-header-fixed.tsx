import { type SVGProps } from 'react'

export function IconHeaderFixed(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      data-name='icon-header-fixed'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 36 24'
      {...props}
    >
      {/* Header bar - solid and fixed */}
      <rect
        x={1.125}
        y={1.125}
        width={33.75}
        height={7.125}
        rx={1.125}
        ry={1.125}
        fill='currentColor'
        opacity={0.9}
      />

      {/* LOCK ICON - clearly shows "fixed/locked" */}
      <g transform='translate(13.5, 2.25)'>
        {/* Lock shackle - perfect U shape */}
        <path
          d='M2.25 1.125c0-0.9 1.5-1.65 2.625-1.65s2.625 0.75 2.625 1.65v1.35'
          fill='none'
          stroke='currentColor'
          strokeWidth={1.125}
          strokeLinecap='round'
          strokeLinejoin='round'
          opacity={0.9}
        />
        {/* Lock body - perfect rectangle */}
        <rect
          x={2.625}
          y={2.475}
          width={2.25}
          height={2.625}
          rx={0.375}
          ry={0.375}
          fill='currentColor'
          opacity={0.85}
        />
        {/* Keyhole - perfectly centered */}
        <circle
          cx={3.75}
          cy={3.75}
          r={0.3}
          fill='none'
          stroke='currentColor'
          strokeWidth={0.6}
          opacity={0.95}
        />
        <rect
          x={3.6}
          y={3.15}
          width={0.3}
          height={0.6}
          rx={0.075}
          ry={0.075}
          fill='none'
          stroke='currentColor'
          strokeWidth={0.6}
          opacity={0.95}
        />
      </g>

      {/* Content area - shows it's attached */}
      <rect
        x={1.125}
        y={10.5}
        width={33.75}
        height={12}
        rx={0.6}
        ry={0.6}
        fill='none'
        stroke='currentColor'
        strokeWidth={0.3}
        opacity={0.3}
      />

      {/* Connection line showing fixed attachment */}
      <line
        x1={18}
        y1={8.25}
        x2={18}
        y2={10.5}
        stroke='currentColor'
        strokeWidth={0.6}
        opacity={0.6}
      />
    </svg>
  )
}
