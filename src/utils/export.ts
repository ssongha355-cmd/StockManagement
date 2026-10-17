/**
 * Utility to export an array of objects to a CSV file.
 * Automatically prepends UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility (Khmer / international characters).
 */
export function downloadCSV(filename: string, data: Record<string, any>[]): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);

  const escapeCSVValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCSVValue).join(',');
  const rows = data.map((row) =>
    headers.map((header) => escapeCSVValue(row[header])).join(',')
  );

  // Prepend UTF-8 BOM so Excel opens Khmer & Unicode characters properly
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
