import React, { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const EnergyChart = ({ data }) => {
  const chartData = useMemo(() => {
     if(!data || !data.predictions || !data.energy) return [];
     
     // Complex mapping logic for a combined chart if needed, 
     // For now, let's assume `data` is an array of objects straight into the chart
     return data;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
        No chart data available
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProduced" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
          <Area type="monotone" dataKey="produced" stroke="#f97316" fillOpacity={1} fill="url(#colorProduced)" name="Produced (kWh)" />
          <Area type="monotone" dataKey="consumed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorConsumed)" name="Consumed (kWh)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyChart;
