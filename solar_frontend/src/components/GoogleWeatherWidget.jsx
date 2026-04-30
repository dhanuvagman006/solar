import React, { useEffect, useState } from 'react';
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain,
  CloudSnow, CloudSun, Droplets, Sun, Wind, Umbrella
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Map WMO weather codes to Lucide icons and descriptions
const getWeatherInfo = (code) => {
  if (code === 0) return { icon: Sun, text: 'Clear sky', color: 'text-orange-400' };
  if (code === 1 || code === 2) return { icon: CloudSun, text: 'Partly cloudy', color: 'text-orange-300' };
  if (code === 3) return { icon: Cloud, text: 'Overcast', color: 'text-slate-400' };
  if (code === 45 || code === 48) return { icon: CloudFog, text: 'Fog', color: 'text-slate-400' };
  if (code >= 51 && code <= 55) return { icon: CloudDrizzle, text: 'Drizzle', color: 'text-blue-400' };
  if (code >= 61 && code <= 65) return { icon: CloudRain, text: 'Rain', color: 'text-blue-500' };
  if (code >= 71 && code <= 77) return { icon: CloudSnow, text: 'Snow', color: 'text-sky-300' };
  if (code >= 80 && code <= 82) return { icon: CloudRain, text: 'Showers', color: 'text-blue-600' };
  if (code >= 95) return { icon: CloudLightning, text: 'Thunderstorm', color: 'text-purple-500' };
  return { icon: Sun, text: 'Unknown', color: 'text-orange-400' };
};

const GoogleWeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Temperature'); // Temperature, Precipitation, Wind
  const [locationName, setLocationName] = useState('Fetching location...');

  useEffect(() => {
    const fetchLocationAndWeather = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await loadData(latitude, longitude, true);
          },
          (error) => {
            console.warn('Geolocation error/denied, using fallback location:', error);
            // Fallback to Davangere, India
            loadData(14.4673, 75.9252, false);
          }
        );
      } else {
        // Geolocation not supported
        loadData(14.4673, 75.9252, false);
      }
    };

    const loadData = async (lat, lon, useGeocoding) => {
      try {
        if (useGeocoding) {
          // Fetch city name from coordinates using free Nominatim API
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.state_district;
            const country = geoData.address?.country;
            if (city && country) {
              setLocationName(`${city}, ${country}`);
            } else if (geoData.display_name) {
              // Extract the first two parts of the display name for a clean title
              const parts = geoData.display_name.split(',').slice(0, 2);
              setLocationName(parts.join(', '));
            } else {
              setLocationName('Your Location');
            }
          }
        } else {
          setLocationName('Davangere, India');
        }

        // Fetch Weather
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const response = await fetch(url);
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLocationName('Failed to load location');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationAndWeather();
  }, []);

  if (loading || !weatherData) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[500px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const current = weatherData.current;
  const currentInfo = getWeatherInfo(current.weather_code);
  const CurrentIcon = currentInfo.icon;

  // Format current date/time
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // High/low for today
  const todayMax = Math.round(weatherData.daily.temperature_2m_max[0]);
  const todayMin = Math.round(weatherData.daily.temperature_2m_min[0]);

  // Prepare chart data for the next 24 hours
  const currentHourIndex = weatherData.hourly.time.findIndex(t => new Date(t).getHours() === now.getHours() && new Date(t).getDate() === now.getDate());
  const startIndex = currentHourIndex > -1 ? currentHourIndex : 0;

  const chartData = weatherData.hourly.time.slice(startIndex, startIndex + 24).map((time, idx) => {
    const date = new Date(time);
    const hour = date.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const label = idx === 0 ? 'Now' : `${hour12} ${ampm}`;

    return {
      time: label,
      Temperature: weatherData.hourly.temperature_2m[startIndex + idx],
      Precipitation: weatherData.hourly.precipitation_probability[startIndex + idx],
      Wind: weatherData.hourly.wind_speed_10m[startIndex + idx],
    };
  });

  // Prepare 7-day forecast
  const dailyData = weatherData.daily.time.map((time, idx) => {
    const date = new Date(time);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const info = getWeatherInfo(weatherData.daily.weather_code[idx]);
    return {
      day: idx === 0 ? 'Today' : dayName,
      max: Math.round(weatherData.daily.temperature_2m_max[idx]),
      min: Math.round(weatherData.daily.temperature_2m_min[idx]),
      icon: info.icon,
      color: info.color
    };
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 text-slate-800 font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-normal mb-1">{locationName}</h2>
        <p className="text-slate-500 text-sm">
          {currentInfo.text} • {dateString}, {timeString}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">

        {/* Left Side: Current Weather */}
        <div className="col-span-1 lg:col-span-4 flex flex-col">
          <div className="flex items-center mb-6">
            <CurrentIcon className={`w-20 h-20 ${currentInfo.color} mr-4 drop-shadow-sm`} />
            <div>
              <div className="flex items-start">
                <span className="text-6xl font-medium tracking-tighter">{Math.round(current.temperature_2m)}</span>
                <span className="text-2xl font-normal mt-1 ml-1 text-slate-600">°C</span>
              </div>
            </div>
          </div>

          <div className="text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">
            High {todayMax}° • Low {todayMin}°
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Humidity</span>
              <span className="font-medium text-slate-800">{current.relative_humidity_2m}%</span>
            </div>
            <div className="flex justify-between">
              <span>Precipitation</span>
              <span className="font-medium text-slate-800">{current.precipitation} mm</span>
            </div>
            <div className="flex justify-between">
              <span>Wind</span>
              <span className="font-medium text-slate-800">{current.wind_speed_10m} km/h</span>
            </div>
          </div>
        </div>

        {/* Right Side: Graph */}
        <div className="col-span-1 lg:col-span-8 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
          <div className="flex gap-6 mb-6 px-2">
            {['Temperature', 'Precipitation', 'Wind'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === tab
                    ? 'border-blue-500 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeTab === 'Temperature' ? "#fbbf24" : activeTab === 'Precipitation' ? "#60a5fa" : "#94a3b8"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={activeTab === 'Temperature' ? "#fbbf24" : activeTab === 'Precipitation' ? "#60a5fa" : "#94a3b8"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                  interval={3}
                />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey={activeTab}
                  stroke={activeTab === 'Temperature' ? "#f59e0b" : activeTab === 'Precipitation' ? "#3b82f6" : "#64748b"}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTemp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom: 7-Day Forecast */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 pt-6 border-t border-slate-100">
        {dailyData.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
            <span className="text-sm font-medium text-slate-600 mb-3">{day.day}</span>
            <day.icon className={`w-8 h-8 mb-3 ${day.color}`} />
            <div className="text-sm flex gap-2">
              <span className="font-medium text-slate-800">{day.max}°</span>
              <span className="text-slate-500">{day.min}°</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-right text-xs text-slate-400 flex items-center justify-end gap-1">
      </div>
    </div>
  );
};

export default GoogleWeatherWidget;
