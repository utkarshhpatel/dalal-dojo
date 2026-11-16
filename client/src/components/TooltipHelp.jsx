import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export const TOOLTIP_DEFINITIONS = {
  LTP: {
    title: 'Last Traded Price (LTP)',
    text: 'The most recent price at which a trade was executed for this stock on the exchange.'
  },
  PNL: {
    title: 'Profit & Loss (P&L)',
    text: 'Your current financial return. Green indicates an unrealized profit, while red indicates an unrealized loss.'
  },
  MARKET_ORDER: {
    title: 'Market Order',
    text: 'Executes instantly at the current best market price. Guarantees speed of execution over specific price.'
  },
  LIMIT_ORDER: {
    title: 'Limit Order',
    text: 'Executes only when the market price reaches your specified target price or better. Unfilled orders wait until matched or cancelled.'
  },
  AVG_PRICE: {
    title: 'Average Buy Price',
    text: 'The volume-weighted average price you paid per share across all purchase transactions.'
  },
  HOLDINGS: {
    title: 'Holdings',
    text: 'Shares that you currently own in your virtual demat account.'
  },
  BROKERAGE: {
    title: 'Brokerage & Charges',
    text: 'Realistic transaction fees calculated as ₹20 or 0.03% of trade turnover, whichever is lower.'
  },
  CONCENTRATION_RISK: {
    title: 'Diversification & Concentration',
    text: 'Investing more than 40% of your total capital into a single company leaves you exposed to sector-specific downturns.'
  }
};

export default function TooltipHelp({ termKey, customText, customTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const info = TOOLTIP_DEFINITIONS[termKey] || {
    title: customTitle || 'Trading Term',
    text: customText || ''
  };

  return (
    <span className="relative inline-flex items-center ml-1 group">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-muted hover:text-heading focus:outline-none transition-colors"
        aria-label={info.title}
      >
        <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-2.5 rounded-btn bg-bg-card border border-border shadow-card text-left pointer-events-none"
        >
          <div className="text-xs font-semibold text-heading mb-1 flex items-center justify-between">
            <span>{info.title}</span>
          </div>
          <p className="text-2xs text-muted leading-relaxed font-sans font-normal">
            {info.text}
          </p>
        </div>
      )}
    </span>
  );
}
