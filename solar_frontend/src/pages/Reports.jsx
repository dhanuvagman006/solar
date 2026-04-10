import React, { useEffect, useState, useRef } from 'react';
import { getReportsSummary } from '../api/reports';
import { Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatNumber } from '../utils/formatters';

const Reports = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef();

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await getReportsSummary();
                setSummary(data);
            } catch(e) {
                toast.error('Failed to load reports');
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    const handleDownloadPDF = async () => {
        const input = reportRef.current;
        if (!input) return;

        toast.loading('Generating PDF...', { id: 'pdf' });
        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('SolarPredict_Report.pdf');
            toast.success('PDF Downloaded!', { id: 'pdf' });
        } catch (e) {
            toast.error('Failed to generate PDF', { id: 'pdf' });
        }
    };

    if (loading) return <div className="p-8">Loading Reports...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System Reports</h1>
                    <p className="text-slate-500 mt-1">Exportable data summary.</p>
                </div>
                <button 
                  onClick={handleDownloadPDF}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Download size={18} /> Download PDF
                </button>
            </div>

            <div ref={reportRef} className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <FileText className="text-orange-500" size={32} />
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">SolarPredict Executive Summary</h2>
                        <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold text-slate-700 mb-3 uppercase text-sm tracking-wider">Energy Totals</h3>
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Produced:</span>
                                <span className="font-semibold text-slate-800">{formatNumber(summary?.energy_stats?.total_produced)} kWh</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Consumed:</span>
                                <span className="font-semibold text-slate-800">{formatNumber(summary?.energy_stats?.total_consumed)} kWh</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                <span className="font-medium text-slate-700">Net Exported:</span>
                                <span className="font-bold text-green-600">{formatNumber(summary?.energy_stats?.total_exported)} kWh</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-700 mb-3 uppercase text-sm tracking-wider">Prediction Engine</h3>
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Inferences:</span>
                                <span className="font-semibold text-slate-800">{formatNumber(summary?.total_predictions, 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Active Models:</span>
                                <span className="font-semibold text-slate-800">5 Deep Learning</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                <span className="text-slate-500">Avg Model R²:</span>
                                <span className="font-semibold text-slate-800">
                                   {formatNumber(summary?.model_stats?.reduce((acc, curr) => acc + curr.avg_r2, 0) / (summary?.model_stats?.length || 1), 4)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold text-slate-700 mb-4 uppercase text-sm tracking-wider">Model Performance Breakdown</h3>
                <table className="w-full text-sm text-left border border-slate-100 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3 border-b border-slate-100">Model Name</th>
                            <th className="px-4 py-3 border-b border-slate-100 text-right">Avg Predicted (kWh)</th>
                            <th className="px-4 py-3 border-b border-slate-100 text-right">Avg R²</th>
                            <th className="px-4 py-3 border-b border-slate-100 text-right">Avg MAPE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary?.model_stats?.map((m) => (
                            <tr key={m.model_name} className="border-b border-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-700">{m.model_name}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{formatNumber(m.avg_predicted)}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{formatNumber(m.avg_r2, 4)}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{formatNumber(m.avg_mape, 2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
