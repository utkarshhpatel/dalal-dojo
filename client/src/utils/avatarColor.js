/**
 * Deterministic color tint generator for company and user avatars
 */

const TINTS = [
  { bg: '#E6F4EA', text: '#137333', darkBg: '#132E20', darkText: '#81C995' }, // Soft Green
  { bg: '#E8F0FE', text: '#1A73E8', darkBg: '#172B4D', darkText: '#8AB4F8' }, // Soft Blue
  { bg: '#FCE8E6', text: '#C5221F', darkBg: '#371B19', darkText: '#F28B82' }, // Soft Red
  { bg: '#FEF7E0', text: '#B06000', darkBg: '#362B12', darkText: '#FDD663' }, // Soft Amber
  { bg: '#F3E8FD', text: '#8430CE', darkBg: '#2C1D3E', darkText: '#C58AF9' }, // Soft Purple
  { bg: '#E0F2F1', text: '#00796B', darkBg: '#112C28', darkText: '#80CBC4' }, // Soft Teal
  { bg: '#FCE4EC', text: '#C2185B', darkBg: '#351824', darkText: '#F48FB1' }, // Soft Pink
  { bg: '#ECEFF1', text: '#455A64', darkBg: '#1E282D', darkText: '#B0BEC5' }, // Soft Slate
];

export function getAvatarColor(identifier = '') {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TINTS.length;
  return TINTS[index];
}

export function getSymbolInitials(symbol = '', name = '') {
  const clean = symbol.replace('.NS', '').trim();
  if (clean.length <= 2) return clean.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}
