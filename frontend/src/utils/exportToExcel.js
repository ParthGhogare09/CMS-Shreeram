/**
 * Utility to export an array of objects to a CSV Excel spreadsheet file.
 * Adds UTF-8 BOM (\uFEFF) so Excel opens it directly with correct columns.
 * 
 * @param {Array<Object>} data - The data array to export.
 * @param {String} fileName - Desired file name without extension.
 * @param {Object} [columnMap] - Optional map of object keys to human-readable header labels.
 */
export const exportToExcel = (data, fileName = 'Export_Report', columnMap = null) => {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Determine headers
  const keys = columnMap ? Object.keys(columnMap) : Object.keys(data[0]);
  const headers = columnMap ? Object.values(columnMap) : keys;

  // Build CSV rows
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Data rows
  data.forEach(row => {
    const values = keys.map(key => {
      let val = row[key];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = val.name || JSON.stringify(val);
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  // Create Blob with UTF-8 BOM (\uFEFF) for native Excel compatibility
  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  // Trigger browser file download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${fileName}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
