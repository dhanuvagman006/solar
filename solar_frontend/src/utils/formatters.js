export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

export const formatPercentage = (num) => {
  if (num === null || num === undefined) return '-';
  return `${Number(num).toFixed(2)}%`;
};
