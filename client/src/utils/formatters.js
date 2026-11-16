/**
 * Indian Number Formatting and Currency Helpers
 */

export function formatINR(val, includeSymbol = true, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const num = Number(val);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const parts = absNum.toFixed(decimals).split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = formattedInteger + decimalPart;
  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';

  return `${prefix}${symbol}${result}`;
}

export function formatCompactINR(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  const num = Number(val);
  const isNegative = num < 0;
  const abs = Math.abs(num);

  let formatted = '';
  if (abs >= 10000000) {
    formatted = (abs / 10000000).toFixed(2) + 'Cr';
  } else if (abs >= 100000) {
    formatted = (abs / 100000).toFixed(2) + 'L';
  } else if (abs >= 1000) {
    formatted = (abs / 1000).toFixed(1) + 'K';
  } else {
    formatted = abs.toFixed(2);
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatPercent(val, includeSign = true) {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  const num = Number(val);
  const sign = num > 0 ? '+' : '';
  return `${includeSign ? sign : ''}${num.toFixed(2)}%`;
}

export function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  return num.toLocaleString('en-IN');
}

export function formatDateTime(isoString) {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDateOnly(isoString) {
  if (!isoString) return '--';
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
}

export function formatTime(isoString) {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
