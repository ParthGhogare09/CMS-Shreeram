export const formatDate = (dateString) => {
  if (!dateString) return '';
  if (dateString.includes('-')) {
    const [y, m, d] = dateString.split('-');
    if (y && m && d) return `${d}/${m}/${y.slice(-2)}`;
  }
  return dateString;
};
