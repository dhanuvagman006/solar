import React, { useState } from 'react';
import { getCalculatorEstimates } from '../api/calculator';
import { IndianRupee, Sun, ShieldCheck } from 'lucide-react';

const Calculator = () => {
   const [size, setSize] = useState(5);
   const [wattage, setWattage] = useState(400);
   const [estimates, setEstimates] = useState(null);

   const handleCalculate = async () => {
      try {
          const data = await getCalculatorEstimates({ size_kw: size, panel_wattage: wattage });
          setEstimates(data);
      } catch (e) {
          console.error(e);
      }
   }

   return (
    <div className="p-8 max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Savings Calculator</h1>
        <p className="text-slate-500 mt-1">Estimate power generated based on common parameters.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8">
         <div className="flex-1 space-y-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">System Size: <span className="text-orange-500 font-bold">{size} kW</span></label>
                <input 
                  type="range" min="1" max="50" step="1" 
                  value={size} onChange={(e)=>setSize(e.target.value)} 
                  className="w-full accent-orange-500" 
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Panel Wattage: <span className="text-orange-500 font-bold">{wattage} W</span></label>
                <input 
                  type="range" min="300" max="600" step="10" 
                  value={wattage} onChange={(e)=>setWattage(e.target.value)} 
                  className="w-full accent-orange-500" 
                />
             </div>
             <button
                 onClick={handleCalculate}
                 className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
               >
                 Calculate Potential
              </button>
         </div>

         {estimates && (
             <div className="flex-1 bg-slate-50 p-6 rounded-xl flex flex-col justify-center">
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Total Area</span>
                        <div className="text-xl font-bold text-slate-800 mt-1">{estimates.area_m2} m²</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Panels Needed</span>
                        <div className="text-xl font-bold text-slate-800 mt-1">{estimates.panel_count}</div>
                    </div>
                 </div>

                 <h4 className="font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">Annual Generation Estimates</h4>
                 <div className="space-y-3">
                     <div className="flex justify-between items-center bg-orange-100 text-orange-800 px-4 py-2 rounded">
                        <span className="flex items-center gap-2"><Sun size={16}/> Zone 1 (High)</span>
                        <span className="font-bold">{estimates.estimates?.zone_1?.annual_kwh} kWh</span>
                     </div>
                     <div className="flex justify-between items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded">
                        <span className="flex items-center gap-2"><Sun size={16}/> Zone 2 (Medium)</span>
                        <span className="font-bold">{estimates.estimates?.zone_2?.annual_kwh} kWh</span>
                     </div>
                     <div className="flex justify-between items-center bg-blue-100 text-blue-800 px-4 py-2 rounded">
                        <span className="flex items-center gap-2"><Sun size={16}/> Zone 3 (Moderate)</span>
                        <span className="font-bold">{estimates.estimates?.zone_3?.annual_kwh} kWh</span>
                     </div>
                 </div>
             </div>
         )}
      </div>
    </div>
   );
}
export default Calculator;
