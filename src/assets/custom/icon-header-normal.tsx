import { type SVGProps } from 'react'

export function IconHeaderNormal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      data-name='icon-header-normal'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 36 24'
      {...props}
    >
      {/* Header bar - faded to show movement */}
      <rect
        x={1.125}
        y={1.125}
        width={33.75}
        height={7.125}
        rx={1.125}
        ry={1.125}
        fill='currentColor'
        opacity={0.4}
      />

      {/* BIG SCROLL ARROW - clearly shows movement */}
      <g transform='translate(10.5, 2.25)' opacity={0.95}>
        {/* Arrow shaft */}
        <path
          d='M7.125 1.125l0 7.125'
          stroke='currentColor'
          strokeWidth={1.5}
          strokeLinecap='round'
        />
        {/* Arrow head - down */}
        <path
          d='M5.25 6l1.875 2.25 1.875-2.25'
          stroke='currentColor'
          strokeWidth={1.5}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        />
      </g>

      {/* Content area */}
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

      {/* Scroll bar moving down */}
      <rect
        x={32.25}
        y={14.25}
        width={1.125}
        height={6}
        rx={0.6}
        ry={0.6}
        fill='currentColor'
        opacity={0.8}
      />

      {/* Animation dots and motion lines */}
      <g opacity={0.7}>
        <circle cx={4.5} cy={14.25} r={0.9} fill='currentColor' />
        <circle cx={4.5} cy={17.25} r={0.9} fill='currentColor' />
        <circle cx={4.5} cy={20.25} r={0.9} fill='currentColor' />
        {/* Motion trail */}
        <path
          d='M3.375 13.125 Q4.5 14.625 3.375 16.125 Q4.5 17.625 3.375 19.125 Q4.5 20.625 3.375 22.125'
          stroke='currentColor'
          strokeWidth={0.6}
          strokeLinecap='round'
          fill='none'
          opacity={0.4}
        />
      </g>
    </svg>
  )
}
