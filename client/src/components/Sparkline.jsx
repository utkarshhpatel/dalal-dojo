import React from 'react';

export default function Sparkline({
  data = [],
  isPositive = true,
  width = 64,
  height = 24
}) {
  // Generate sample points if no historical array is passed
  let points = data;
  if (!points || points.length < 2) {
    // Generate deterministic 8-point smooth path based on isPositive
    const baseline = height / 2;
    if (isPositive) {
      points = [
        baseline + 4,
        baseline + 2,
        baseline + 5,
        baseline + 1,
        baseline - 2,
        baseline,
        baseline - 4,
        baseline - 7
      ];
    } else {
      points = [
        baseline - 5,
        baseline - 3,
        baseline - 6,
        baseline - 1,
        baseline + 2,
        baseline,
        baseline + 4,
        baseline + 6
      ];
    }
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const step = width / (points.length - 1);
  const pathD = points
    .map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? 'var(--color-gain)' : 'var(--color-loss)';

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible shrink-0 pointer-events-none"
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
