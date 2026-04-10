import api from './axios';

export const resolveLocation = async (latitude, longitude) => {
  const response = await api.post('/location/resolve/', { latitude, longitude });
  return response.data;
};

export const fetchWeather = async (latitude, longitude, location_id) => {
  const response = await api.post('/weather/fetch/', { latitude, longitude, location_id });
  return response.data;
};
