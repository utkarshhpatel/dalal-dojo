import React from 'react';
import { getAvatarColor, getSymbolInitials } from '../utils/avatarColor';
import { useTheme } from '../context/ThemeContext';

export default function CompanyAvatar({ symbol = '', name = '', size = 'md' }) {
  const { isDark } = useTheme();
  const colors = getAvatarColor(symbol || name);
  const initials = getSymbolInitials(symbol, name);

  let sizeClass = 'w-9 h-9 text-xs';
  if (size === 'sm') sizeClass = 'w-7 h-7 text-2xs';
  if (size === 'lg') sizeClass = 'w-11 h-11 text-sm';
  if (size === 'xl') sizeClass = 'w-14 h-14 text-base';

  const bg = isDark ? colors.darkBg : colors.bg;
  const textColor = isDark ? colors.darkText : colors.text;

  return (
    <div
      style={{ backgroundColor: bg, color: textColor }}
      className={`${sizeClass} rounded-[8px] flex items-center justify-center font-semibold shrink-0 select-none tracking-tight transition-colors duration-150`}
    >
      {initials}
    </div>
  );
}
