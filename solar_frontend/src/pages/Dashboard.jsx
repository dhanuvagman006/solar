import React, { useEffect, useState } from 'react';
import { getReportsSummary } from '../api/reports';
import { getPredictionCompare, getPredictionHistory } from '../api/predictions';
import { Activity, Sun, Zap, TrendingUp } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import ModelCompareChart from '../components/ModelCompareChart';
import MetricsTable from '../components/MetricsTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';

const DashboardCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
    <div className={`p-4 rounded-xl ${colorClass}`}>
      <Icon size={28} />
    </div>
    <div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {subtitle && <span className="text-sm font-medium text-slate-500">{subtitle}</span>}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [compareData, setCompareData] = useState([]);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumData, compData, histData] = await Promise.all([
          getReportsSummary(),
          getPredictionCompare(),
          getPredictionHistory({ limit: 5 })
        ]);
        setSummary(sumData);
        setCompareData(compData);
        setRecentPredictions(histData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Overview</h1>
        <LoadingSkeleton count={4} />
        <div className="mt-8"><LoadingSkeleton type="table" /></div>
      </div>
    );
  }

  const { energy_stats, total_predictions } = summary || {};
  const totalProduced = energy_stats?.total_produced || 0;
  const totalConsumed = energy_stats?.total_consumed || 0;
  const netExported = energy_stats?.total_exported || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">High-level insights across all predictions and systems.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard 
          title="Total Produced" 
          value={formatNumber(totalProduced)} 
          subtitle="kWh"
          icon={Sun} 
          colorClass="bg-orange-100 text-orange-600" 
        />
        <DashboardCard 
          title="Total Consumed" 
          value={formatNumber(totalConsumed)} 
          subtitle="kWh"
          icon={Activity} 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <DashboardCard 
          title="Net Exported" 
          value={formatNumber(netExported)} 
          subtitle="kWh"
          icon={TrendingUp} 
          colorClass="bg-green-100 text-green-600" 
        />
        <DashboardCard 
          title="Total Predictions" 
          value={formatNumber(total_predictions, 0)} 
          icon={Zap} 
          colorClass="bg-purple-100 text-purple-600" 
        />
      </div>

      <div className="mb-8">
        <ModelCompareChart data={compareData} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 px-2">Recent Predictions</h2>
        <MetricsTable data={recentPredictions} isLoading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;
