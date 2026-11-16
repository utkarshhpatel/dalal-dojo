import React from 'react';
import { formatINR } from '../utils/formatters';
import { useMarket } from '../context/MarketContext';

export default function PriceText({
  symbol,
  price,
  decimals = 2,
  includeSymbol = true,
  className = ''
}) {
  const { priceFlashes } = useMarket();
  const flash = symbol ? priceFlashes[symbol] : null;

  let colorClass = '';
  if (flash === 'up') {
    colorClass = 'text-gain transition-colors duration-400 font-semibold';
  } else if (flash === 'down') {
    colorClass = 'text-loss transition-colors duration-400 font-semibold';
  }

  return (
    <span className={`tabular-nums ${colorClass} ${className}`}>
      {formatINR(price, includeSymbol, decimals)}
    </span>
  );
}
