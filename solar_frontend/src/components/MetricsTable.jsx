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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
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
