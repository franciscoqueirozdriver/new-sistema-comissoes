export function normalizeMes(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  let match = trimmed.match(/^([0-9]{1,2})[\/|-]([0-9]{4})$/); // M/YYYY or MM/YYYY
  if (match) {
    const month = match[1].padStart(2, '0');
    const year = match[2];
    return `${month}/${year}`;
  }
  match = trimmed.match(/^([0-9]{4})[\/|-]([0-9]{1,2})$/); // YYYY-MM or YYYY/M
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    return `${month}/${year}`;
  }
  return trimmed;
}
