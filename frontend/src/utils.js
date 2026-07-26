export const formatDate = (dateString) => {
  if (!dateString) return '';
  if (dateString.includes('-')) {
    const [y, m, d] = dateString.split('-');
    if (y && m && d) return `${d}/${m}/${y.slice(-2)}`;
  }
  return dateString;
};

/**
 * Generate batch labels for all batches of a material using date:rate format.
 * If multiple batches share the same date+rate, an index suffix is appended.
 * Example: "26/07/26:120" or "26/07/26:120:1", "26/07/26:120:2"
 * @param {Array} batches - array of batch objects with purchaseDate and purchaseRate
 * @returns {Array<string>} - array of labels, one per batch
 */
export const getBatchLabels = (batches) => {
  if (!batches || batches.length === 0) return [];
  
  // Build base label for each batch
  const baseLabels = batches.map(b => {
    const dateStr = formatDate(b.purchaseDate || '');
    const rate = b.purchaseRate ?? 0;
    return `${dateStr}:${rate}`;
  });
  
  // Count occurrences of each base label
  const counts = {};
  baseLabels.forEach(label => {
    counts[label] = (counts[label] || 0) + 1;
  });
  
  // For labels that appear more than once, append an index
  const seen = {};
  return baseLabels.map(label => {
    if (counts[label] > 1) {
      seen[label] = (seen[label] || 0) + 1;
      return `${label}:${seen[label]}`;
    }
    return label;
  });
};
