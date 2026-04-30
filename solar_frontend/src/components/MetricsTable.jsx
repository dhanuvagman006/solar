import React from 'react';
import { formatNumber, formatDate, formatPercentage } from '../utils/formatters';

const MetricsTable = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Loading prediction history...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
        <p className="text-slate-400">No prediction history available.</p>
      </div>
    );
  }

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const headers = ['Date', 'Location', 'Model', 'Predicted (kWh)', 'R²', 'RMSE', 'MAPE'];
    const rows = data.map(row => [
      new Date(row.timestamp).toISOString(),
      row.location_name || 'Unknown',
      row.model_name,
      row.predicted_kwh,
      row.r2_score,
      row.rmse,
      row.mape
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prediction_metrics_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">Prediction Logs</h3>
        <button 
          onClick={downloadCSV}
          className="text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3 text-right">Predicted (kWh)</th>
              <th className="px-4 py-3 text-right">R²</th>
              <th className="px-4 py-3 text-right">RMSE</th>
              <th className="px-4 py-3 text-right">MAPE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {formatDate(row.timestamp)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {row.location_name || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">{row.model_name}</span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">
                  {formatNumber(row.predicted_kwh)}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">
                  {formatNumber(row.r2_score, 4)}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">
                  {formatNumber(row.rmse, 3)}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">
                  {formatPercentage(row.mape)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricsTable;
