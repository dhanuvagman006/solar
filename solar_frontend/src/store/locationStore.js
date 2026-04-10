import { create } from 'zustand';

export const useLocationStore = create((set) => ({
  location: null, // { location_id, city, state, latitude, longitude, solar_zone }
  weather: null,  // { weather_id, temperature, humidity, solar_irradiance, wind_speed, cloud_cover, uv_index, season }
  setLocation: (locData) => set({ location: locData }),
  setWeather: (weatherData) => set({ weather: weatherData }),
  resetLocation: () => set({ location: null, weather: null }),
}));
