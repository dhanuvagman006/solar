import React from 'react';
import { formatNumber, formatPercentage } from '../utils/formatters';
import { Zap, Activity } from 'lucide-react';

const ModelResultCard = ({ result, isHighest }) => {
  return (
    <div className={`p-6 rounded-xl shadow-sm border ${isHighest ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-slate-800">{result.model_name}</h4>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <Activity size={14} /> Metrics
          </p>
        </div>
        <div className={`p-2 rounded-lg ${isHighest ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
          <Zap size={24} />
        </div>
      </div>
      
      <div className="mb-6">
        <span className="text-3xl font-bold text-slate-900">{formatNumber(result.predicted_kwh)}</span>
        <span className="text-slate-500 font-medium ml-1">kWh</span>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm bg-white p-3 rounded-lg border border-slate-100">
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="text-slate-500">R² Score:</span>
          <span className="font-semibold text-slate-700">{formatNumber(result.r2_score, 4)}</span>
        </div>
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="text-slate-500">RMSE:</span>
          <span className="font-semibold text-slate-700">{formatNumber(result.rmse, 4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">MAE:</span>
          <span className="font-semibold text-slate-700">{formatNumber(result.mae, 4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">MAPE:</span>
          <span className="font-semibold text-slate-700">{formatPercentage(result.mape)}</span>
        </div>
      </div>
    </div>
  );
};

export default ModelResultCard;
