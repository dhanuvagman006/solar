import React, { useState } from 'react';
import IndiaMap from '../components/IndiaMap';
import WeatherCard from '../components/WeatherCard';
import ModelResultCard from '../components/ModelResultCard';
import { useLocationStore } from '../store/locationStore';
import { runPrediction } from '../api/predictions';
import { Zap, Settings, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ModelCompareChart from '../components/ModelCompareChart';

const Prediction = () => {
  const location = useLocationStore((state) => state.location);
  const weather = useLocationStore((state) => state.weather);
  
  const [formData, setFormData] = useState({
    size_kw: 8,
    panel_wattage: 400,
    area_m2: 40,
    efficiency: 0.20,
    performance_ratio: 0.78,
  });

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Derive panel count based on size and wattage
  const panelCount = Math.floor((formData.size_kw * 1000) / formData.panel_wattage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: parseFloat(value) || 0 };
      if (name === 'size_kw' || name === 'panel_wattage') {
        const pCount = Math.floor((updated.size_kw * 1000) / updated.panel_wattage);
        updated.area_m2 = pCount * 1.7; // default assumption
      }
      return updated;
    });
  };

  const handlePredict = async () => {
    if (!location || !weather) {
      toast.error('Please select a location on the map first.');
      return;
    }

    setIsLoading(true);
    setResults([]);
    
    // Construct payload per backend expectation
    const payload = {
      location_id: location.location_id || location.id,
      weather_id: weather.weather_id || weather.id,
      size_kw: formData.size_kw,
      panel_wattage: formData.panel_wattage,
      panel_count: panelCount,
      area_m2: formData.area_m2,
      latitude: location.latitude,
      longitude: location.longitude,
      solar_zone: location.solar_zone,
      temperature: weather.temperature,
      humidity: weather.humidity,
      solar_irradiance: weather.solar_irradiance,
      wind_speed: weather.wind_speed,
      cloud_cover: weather.cloud_cover,
      uv_index: weather.uv_index,
      season: weather.season,
      efficiency: formData.efficiency,
      performance_ratio: formData.performance_ratio,
      
      // Time features. Best effort from current time
      hour: new Date().getHours(),
      day_of_year: Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)),
      month: new Date().getMonth() + 1,
      
      granularity: 'hourly'
    };

    try {
      const predictionData = await runPrediction(payload);
      setResults(predictionData);
      toast.success('Predictions generated successfully!');
    } catch (error) {
       console.error("Predict error", error.response?.data);
       toast.error(error.response?.data?.error || 'Failed to generate predictions');
    } finally {
      setIsLoading(false);
    }
  };

  // Find max prediction to highlight
  const maxPrediction = results.length > 0 
    ? Math.max(...results.map(r => r.predicted_kwh)) 
    : 0;

  // Chart specific formatting
  const chartData = results.length > 0 ? [
    { date: 'Now', ...results.reduce((acc, curr) => ({...acc, [curr.model_name.replace(' ', '_').replace('-','_')]: curr.predicted_kwh}), {}) }
  ] : [];

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Energy Prediction</h1>
        <p className="text-slate-500 mt-1">Select location on the map and configure system parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2">
            <IndiaMap />
          </div>
          
          <WeatherCard weather={weather} />

          {/* System Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Settings className="text-slate-500" />
                System Parameters
             </h3>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">System Size (kW)</label>
                    <input type="number" name="size_kw" value={formData.size_kw} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Panel Wattage (W)</label>
                    <input type="number" name="panel_wattage" value={formData.panel_wattage} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Panel Count</label>
                    <input type="number" value={panelCount} readOnly className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 sm:text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Area (m²)</label>
                    <input type="number" name="area_m2" value={formData.area_m2} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Efficiency (0-1)</label>
                    <input type="number" step="0.01" name="efficiency" value={formData.efficiency} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Perf Ratio (0-1)</label>
                    <input type="number" step="0.01" name="performance_ratio" value={formData.performance_ratio} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                 </div>
             </div>

             <div className="mt-6 pt-6 border-t border-slate-100">
               <button
                 onClick={handlePredict}
                 disabled={!location || !weather || isLoading}
                 className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isLoading ? (
                   <RefreshCw className="animate-spin" size={20} />
                 ) : (
                   <Zap size={20} />
                 )}
                 Run All 5 Models
               </button>
             </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-7">
           {!isLoading && results.length === 0 ? (
             <div className="h-full min-h-[400px] flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 p-8 text-center flex-col gap-4">
                <Zap size={48} className="text-slate-200" />
                <p>Run prediction to see output from all 5 Deep Learning models.</p>
             </div>
           ) : isLoading ? (
             <div>
                <LoadingSkeleton count={4} />
             </div>
           ) : (
             <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                     {results.map((r, idx) => (
                         <ModelResultCard 
                           key={idx} 
                           result={r} 
                           isHighest={r.predicted_kwh === maxPrediction && maxPrediction > 0} 
                         />
                     ))}
                 </div>
                 
                 {results.length > 0 && chartData.length > 0 && (
                    <div className="mt-8">
                       <ModelCompareChart data={chartData} />
                    </div>
                 )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Prediction;
