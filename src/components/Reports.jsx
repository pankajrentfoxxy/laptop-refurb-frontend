import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, User } from 'lucide-react';

export default function Reports({ api }) {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'technician', direction: 'asc' });

    const loadReport = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reports/technician-performance');
            setReportData(data.report);
        } catch (error) {
            console.error('Report load error:', error);
            // alert('Failed to load performance report'); 
        }
    }, [api]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        // Sort Data
        const sorted = [...reportData].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setReportData(sorted);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="text-indigo-600" />
                        Technician Performance
                    </h2>
                    <p className="text-gray-600">Track time spent and ticket volume by technician</p>
                </div>
                <button
                    onClick={loadReport}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 font-medium"
                >
                    <RefreshCw className="w-5 h-5" /> Refresh
                </button>
            </div>

            {/* Overview Stats (Optional Future Enhancement) */}

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th
                                    className="px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('technician')}
                                >
                                    Technician
                                </th>
                                <th
                                    className="px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('team')}
                                >
                                    Team
                                </th>
                                <th
                                    className="px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('machine_number')}
                                >
                                    Machine # / Ticket
                                </th>
                                <th
                                    className="px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('times_picked')}
                                >
                                    Sessions
                                </th>
                                <th
                                    className="px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('total_duration')}
                                >
                                    Time Taken
                                </th>
                                <th
                                    className="px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('status')}
                                >
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading Report...</td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No activity logs found.</td>
                                </tr>
                            ) : (
                                reportData.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                {row.technician}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{row.team}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-sm font-medium text-blue-600">{row.machine_number}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {row.times_picked}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-700">
                                            {row.total_duration}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                             `}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
