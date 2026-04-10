import api from './axios';

export const runPrediction = async (predictionData) => {
  const response = await api.post('/predict/', predictionData);
  return response.data;
};

export const getPredictionHistory = async (params = {}) => {
  const response = await api.get('/predictions/history/', { params });
  return response.data;
};

export const getPredictionCompare = async (params = {}) => {
  const response = await api.get('/predictions/compare/', { params });
  return response.data;
};
