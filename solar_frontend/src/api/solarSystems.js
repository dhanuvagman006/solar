import api from './axios';

export const getSolarSystems = async () => {
  const response = await api.get('/solar-systems/');
  return response.data;
};

export const createSolarSystem = async (systemData) => {
  const response = await api.post('/solar-systems/', systemData);
  return response.data;
};

export const uploadEnergyCSV = async (formData) => {
  const response = await api.post('/energy-readings/upload-csv/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
