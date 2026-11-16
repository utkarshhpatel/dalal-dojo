import React, { useState } from 'react';
import { formatINR, formatPercent } from '../utils/formatters';

const PALETTE = [
  '#00B386', // Groww Green
  '#1A73E8', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#7C7E8C'  // Slate / Cash
];

export default function AllocationDonut({ allocation = [] }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  if (!allocation || allocation.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-muted">
        No holdings to display
      </div>
    );
  }

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const slices = allocation.map((item, idx) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += item.percentage;
    const color = item.symbol === 'CASH' ? '#7C7E8C' : PALETTE[idx % PALETTE.length];

    return {
      ...item,
      color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Donut */}
        <div className="relative shrink-0 w-[160px] h-[160px]">
          <svg width={size} height={size} className="transform -rotate-90">
            {slices.map((slice, i) => (
              <circle
                key={slice.symbol || i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={hoveredSlice?.symbol === slice.symbol ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredSlice(slice)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            ))}
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            <span className="text-2xs text-muted truncate max-w-[90px]">
              {hoveredSlice ? hoveredSlice.symbol.replace('.NS', '') : 'Portfolio'}
            </span>
            <span className="text-xs font-semibold text-heading tabular-nums">
              {hoveredSlice ? formatPercent(hoveredSlice.percentage, false) : `${allocation.length} Assets`}
            </span>
          </div>
        </div>

        {/* Clean Legend */}
        <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-1">
          {slices.map(slice => (
            <div
              key={slice.symbol}
              onMouseEnter={() => setHoveredSlice(slice)}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer transition-colors ${
                hoveredSlice?.symbol === slice.symbol ? 'bg-bg-subtle' : 'hover:bg-bg-subtle'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="font-medium text-heading truncate">
                  {slice.symbol.replace('.NS', '')}
                </span>
              </div>
              <div className="text-right shrink-0 tabular-nums">
                <span className="font-semibold text-heading text-2xs">
                  {slice.percentage.toFixed(1)}%
                </span>
                <span className="text-2xs text-muted block">
                  {formatINR(slice.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
