import React from 'react';
import { Thermometer, Droplets, Wind, Cloud, Sun, SunDim } from 'lucide-react';
import { getSeasonLabel } from '../utils/seasonHelper';

const WeatherCard = ({ weather }) => {
  if (!weather) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex items-center justify-center text-slate-400">
        <p>No weather data available. Please select a location on the map.</p>
      </div>
    );
  }

  const items = [
    { label: 'Temperature', value: `${weather.temperature}°C`, icon: Thermometer, color: 'text-red-500' },
    { label: 'Humidity', value: `${weather.humidity}%`, icon: Droplets, color: 'text-blue-500' },
    { label: 'Solar Irradiance', value: `${weather.solar_irradiance} W/m²`, icon: Sun, color: 'text-orange-500' },
    { label: 'Wind Speed', value: `${weather.wind_speed} m/s`, icon: Wind, color: 'text-teal-500' },
    { label: 'Cloud Cover', value: `${weather.cloud_cover}%`, icon: Cloud, color: 'text-slate-500' },
    { label: 'UV Index', value: weather.uv_index, icon: SunDim, color: 'text-purple-500' },
    { label: 'Season', value: getSeasonLabel(weather.season), icon: Thermometer, color: 'text-green-500' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Sun className="text-orange-500" />
        Live Weather Data
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`p-2 bg-slate-50 rounded-lg ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherCard;
