import api from './axios';

export const getSolarPotential = async (latitude, longitude) => {
  const response = await api.get('/solar-potential/', { params: { latitude, longitude } });
  return response.data;
};

export const getCalculatorEstimates = async (params = {}) => {
  const response = await api.get('/calculator/', { params });
  return response.data;
};
