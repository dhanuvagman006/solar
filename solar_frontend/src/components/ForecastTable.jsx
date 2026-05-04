import React from 'react';
import { formatNumber } from '../utils/formatters';

const ForecastTable = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Loading 7-day forecast...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
        <p className="text-slate-400">No forecast data available.</p>
      </div>
    );
  }

  const downloadCSV = () => {
    const headers = [
      'Date',
      'Radiation (kWh/m²)',
      'Solar Irradiance (W/m²)',
      'Temperature (°C)',
      'Humidity (%)',
      'Wind Speed (m/s)',
      'Cloud Cover (%)',
      'UV Index',
      'Predicted (kWh)',
    ];
    const rows = data.map((row) => [
      row.date,
      row.radiation_kwh_m2,
      row.solar_irradiance,
      row.temperature,
      row.humidity,
      row.wind_speed,
      row.cloud_cover,
      row.uv_index,
      row.predicted_kwh,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `forecast_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">7-Day Forecast</h3>
        <button
          onClick={downloadCSV}
          className="text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Radiation (kWh/m²)</th>
              <th className="px-4 py-3 text-right">Solar Irradiance (W/m²)</th>
              <th className="px-4 py-3 text-right">Temp (°C)</th>
              <th className="px-4 py-3 text-right">Humidity (%)</th>
              <th className="px-4 py-3 text-right">Wind (m/s)</th>
              <th className="px-4 py-3 text-right">Cloud (%)</th>
              <th className="px-4 py-3 text-right">UV</th>
              <th className="px-4 py-3 text-right">Predicted (kWh)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.date} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {new Date(row.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatNumber(row.radiation_kwh_m2, 3)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatNumber(row.solar_irradiance)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatNumber(row.temperature)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatNumber(row.humidity)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatNumber(row.wind_speed)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatNumber(row.cloud_cover)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatNumber(row.uv_index)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  {formatNumber(row.predicted_kwh)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastTable;
