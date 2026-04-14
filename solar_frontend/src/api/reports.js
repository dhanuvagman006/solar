import api from './axios';

export const getReportsSummary = async (params = {}) => {
  const response = await api.get('/reports/summary/', {
    params: {
      ...params,
      _ts: Date.now(),
    },
  });
  return response.data;
};
