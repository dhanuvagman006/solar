import React, { useState, useEffect } from 'react';
import { uploadEnergyCSV } from '../api/solarSystems';
import { UploadCloud, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const DataManagement = () => {
   const [file, setFile] = useState(null);
   const [uploading, setUploading] = useState(false);
   const [systems, setSystems] = useState([]);
   const [locations, setLocations] = useState([]);
   
   const [sysId, setSysId] = useState('');
   const [locId, setLocId] = useState('');

   useEffect(() => {
      // Fetch dropdown data
      const fetchDrops = async () => {
         try {
           const sysRes = await api.get('/solar-systems/');
           const locRes = await api.get('/reports/summary/'); // locations are here
           setSystems(sysRes.data?.results || sysRes.data || []);
           if(locRes.data.locations) setLocations(locRes.data.locations);
         } catch(e) {
           console.error(e);
         }
      };
      fetchDrops();
   }, []);

   const handleUpload = async (e) => {
       e.preventDefault();
       if(!file || !sysId || !locId) {
           toast.error("Please fill all fields and select a CSV file.");
           return;
       }

       const fd = new FormData();
       fd.append('file', file);
       fd.append('solar_system_id', sysId);
       fd.append('location_id', locId);

       setUploading(true);
       toast.loading('Uploading data...', { id: 'csv' });
       try {
           const res = await uploadEnergyCSV(fd);
           toast.success(`Successfully added ${res.created} records.`, { id: 'csv' });
           setFile(null);
       } catch (err) {
           toast.error(err.response?.data?.error || 'Upload failed', { id: 'csv' });
       } finally {
           setUploading(false);
       }
   }

   return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="text-orange-500" />
            Data Management
        </h1>
        <p className="text-slate-500 mt-1">Upload actual historical energy readings via CSV.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
         <form onSubmit={handleUpload} className="space-y-6">
             <div className="grid grid-cols-2 gap-6">
                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Target Solar System</label>
                     <select 
                       value={sysId} onChange={e=>setSysId(e.target.value)}
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                     >
                         <option value="">-- Select System --</option>
                         {systems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.size_kw}kW)</option>)}
                     </select>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Target Location</label>
                     <select 
                       value={locId} onChange={e=>setLocId(e.target.value)}
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                     >
                         <option value="">-- Select Location --</option>
                         {locations.map(l => <option key={l.id} value={l.id}>{l.name}, {l.state}</option>)}
                     </select>
                 </div>
             </div>

             <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors">
                 <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
                 <p className="text-sm text-slate-600 mb-2">Upload CSV with energy data</p>
                 <p className="text-xs text-slate-400 mb-4">Required columns: timestamp, produced_kwh, consumed_kwh, net_exported_kwh</p>
                 
                 <input 
                   type="file" accept=".csv" 
                   onChange={(e) => setFile(e.target.files[0])}
                   className="hidden" id="csv-upload"
                 />
                 <label htmlFor="csv-upload" className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded shadow-sm cursor-pointer hover:bg-slate-50">
                     {file ? file.name : "Browse Files"}
                 </label>
             </div>

             <button
               type="submit" disabled={uploading}
               className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors w-full disabled:opacity-50"
             >
                 {uploading ? 'Processing...' : 'Upload Data To Database'}
             </button>
         </form>
      </div>
    </div>
   );
};

export default DataManagement;
