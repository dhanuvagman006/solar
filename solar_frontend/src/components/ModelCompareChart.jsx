import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const colors = {
  BiLSTM: '#3b82f6', // blue
  Attention_LSTM: '#8b5cf6', // purple
  CNN_BiLSTM: '#ec4899', // pink
  GRU_Attention: '#10b981', // emerald
  Transformer: '#f59e0b', // amber
};

const ModelCompareChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
        No comparison data available
      </div>
    );
  }

  // Find all available models in the data to create lines
  const dataKeys = Object.keys(data[0]).filter(k => k !== 'date' && k !== 'location');

  return (
    <div className="h-96 w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 px-2">Model Output Comparison</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 12}} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(tick) => {
              if(!tick) return '';
              const pts = tick.split(' ');
              return pts.length > 1 ? pts[1] : tick;
            }}
          />
          <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100">
                    <p className="text-sm font-medium text-slate-800 mb-2 border-b border-slate-50 pb-2">{label}</p>
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                          <span className="text-slate-600">{entry.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {Number(entry.value).toFixed(2)} kWh
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
          
          {dataKeys.map((key) => (
             <Line 
               key={key}
               type="monotone" 
               dataKey={key} 
               stroke={colors[key] || '#94a3b8'} 
               strokeWidth={2}
               dot={false}
               activeDot={{ r: 6 }}
               name={key.replace('_', '-')}
             />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModelCompareChart;
