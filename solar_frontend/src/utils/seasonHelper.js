export const getSeasonOptions = () => [
  { value: 0, label: 'Summer' },
  { value: 1, label: 'Monsoon' },
  { value: 2, label: 'Winter' },
];

export const getSeasonLabel = (value) => {
  const options = getSeasonOptions();
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : 'Unknown';
};

export const getZoneOptions = () => [
  { value: 1, label: 'Zone 1 (High)' },
  { value: 2, label: 'Zone 2 (Medium)' },
  { value: 3, label: 'Zone 3 (Moderate)' },
];

export const getZoneLabel = (value) => {
  const options = getZoneOptions();
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : 'Unknown';
};
