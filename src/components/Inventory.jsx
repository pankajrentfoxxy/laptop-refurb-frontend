import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Archive,
    Filter, RefreshCw, X, Upload, Download
} from 'lucide-react';
import Barcode from 'react-barcode';

import { useAuth } from '../context/AuthContext';

export default function Inventory({ api }) {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [inventoryType, setInventoryType] = useState('all'); // 'all', 'Cooling Period', 'Ready'
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        stock_type: 'Cooling Period',
        device_type: 'Laptop',
        machine_number: '',
        serial_number: '',
        brand: '',
        model: '',
        processor: '',
        generation: '',
        ram: '',
        storage: '',
        gpu: '',
        screen_size: '',
        status: 'In Stock'
    });

    const isWarehouse = user?.team_name?.includes('Warehouse') || user?.role === 'admin' || user?.role === 'manager';
    const canRead = isWarehouse || user?.permissions?.includes('inventory_read') || user?.role === 'floor_manager';
    const canWrite = isWarehouse || user?.permissions?.includes('inventory_write');

    const loadInventory = useCallback(async () => {
        if (!canRead) return;
        setLoading(true);
        try {
            let url = '/inventory';
            if (inventoryType !== 'all') {
                url += `?stock_type=${inventoryType}`;
            }
            const { data } = await api.get(url);
            setItems(data.items || []);
        } catch (error) {
            console.error('Load inventory error:', error);
            // alert('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }, [api, inventoryType, canRead]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            loadInventory();
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get(`/inventory/search?term=${searchTerm}`);
            const results = data.items || (data.item ? [data.item] : []);
            setItems(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!canRead) return;
        const term = searchTerm.trim();
        if (!term) {
            loadInventory();
            return;
        }
        const timer = setTimeout(() => {
            api.get(`/inventory/search?term=${term}`)
                .then(({ data }) => {
                    const results = data.items || (data.item ? [data.item] : []);
                    setItems(results);
                })
                .catch((error) => {
                    console.error('Search error:', error);
                    setItems([]);
                });
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm, canRead, loadInventory, api]);

    useEffect(() => {
        if (canRead) loadInventory();
        else setLoading(false);
    }, [loadInventory, canRead]);

    // Access Denied UI
    if (!user) return null;
    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow border">
                <Archive className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Access Denied</h3>
                <p className="text-gray-500">You do not have permission to view Inventory.</p>
            </div>
        );
    }

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory', newItem);
            alert('Item added to inventory');
            setShowAddModal(false);
            setNewItem({
                stock_type: 'Cooling Period',
                device_type: 'Laptop',
                machine_number: '',
                serial_number: '',
                brand: '',
                model: '',
                processor: '',
                generation: '',
                ram: '',
                storage: '',
                gpu: '',
                screen_size: '',
                status: 'In Stock'
            });
            loadInventory();
        } catch (error) {
            console.error('Add item error:', error);
            alert(error.response?.data?.message || 'Failed to add item');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const { data } = await api.post('/inventory/upload', formData);
            alert(data.message);
            if (data.errors) {
                console.table(data.errors);
                alert('check console for errors');
            }
            loadInventory();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleDownloadSample = () => {
        const headers = ['machine_number', 'serial_number', 'brand', 'model', 'processor', 'generation', 'ram', 'storage', 'gpu', 'screen_size', 'stock_type', 'device_type', 'grade'];
        const sampleRow = ['M-1001', 'SN12345678', 'Dell', 'Latitude 5490', 'i5-8350U', '8th', '8GB', '256GB SSD', 'Intel UHD', '14-inch', 'Cooling Period', 'Laptop', 'A'];

        const csvContent = [
            headers.join(','),
            sampleRow.join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                        <Archive className="w-4 h-4 text-indigo-600" />
                        Inventory Management
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage laptops, desktops, and stock levels</p>
                </div>
                {canWrite && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Stock
                        </button>
                        <button
                            onClick={handleDownloadSample}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Sample CSV
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                id="csv-upload"
                                onChange={handleFileUpload}
                            />
                            <label
                                htmlFor="csv-upload"
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 cursor-pointer"
                            >
                                <Upload className="w-5 h-5" />
                                Bulk Upload
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search Machine #, Serial, Brand..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                </form>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                        value={inventoryType}
                        onChange={(e) => setInventoryType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">All Types</option>
                        <option value="Cooling Period">Cooling Period</option>
                        <option value="Ready">Ready</option>
                    </select>
                </div>
                <button
                    onClick={loadInventory}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="Refresh"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Machine #</th>
                                <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Serial / Details</th>
                                <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Device</th>
                                <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Specs</th>
                                <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Stage</th>
                                <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Grade</th>
                                <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Stock Type</th>
                                <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-6 text-center text-slate-500 text-sm">Loading inventory...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-6 text-center text-slate-500 text-sm">No items found</td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.inventory_id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <div className="font-mono text-sm font-medium text-blue-600 mb-1">{item.machine_number}</div>
                                            <Barcode value={item.machine_number} width={1} height={30} fontSize={10} displayValue={false} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-800">{item.brand} {item.model}</div>
                                            <div className="text-xs text-slate-500 font-mono">{item.serial_number}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{item.device_type}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {item.processor || '-'}, {item.generation || '-'}, {item.ram || '-'}, {item.storage || '-'}
                                            <div className="text-xs text-slate-500 mt-1">
                                                GPU: {item.gpu || '-'} | Screen: {item.screen_size || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-800">
                                                {item.stage || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.grade ? (
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium
                                                    ${item.grade.startsWith('A') ? 'bg-green-100 text-green-700' :
                                                        item.grade.startsWith('B') ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.grade}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${item.stock_type === 'Cooling Period' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {item.stock_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Add New Inventory</h3>
                            <button onClick={() => setShowAddModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Machine Number</label>
                                    <input type="text" required className="w-full border rounded-lg p-2"
                                        value={newItem.machine_number}
                                        onChange={e => setNewItem({ ...newItem, machine_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                                    <input type="text" required className="w-full border rounded-lg p-2"
                                        value={newItem.serial_number}
                                        onChange={e => setNewItem({ ...newItem, serial_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Stock Type</label>
                                    <select className="w-full border rounded-lg p-2"
                                        value={newItem.stock_type}
                                        onChange={e => setNewItem({ ...newItem, stock_type: e.target.value })}
                                    >
                                        <option value="Cooling Period">Cooling Period</option>
                                        <option value="Ready">Ready</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Device Type</label>
                                    <select className="w-full border rounded-lg p-2"
                                        value={newItem.device_type}
                                        onChange={e => setNewItem({ ...newItem, device_type: e.target.value })}
                                    >
                                        <option value="Laptop">Laptop</option>
                                        <option value="Desktop">Desktop</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Brand</label>
                                    <input type="text" required className="w-full border rounded-lg p-2"
                                        value={newItem.brand}
                                        onChange={e => setNewItem({ ...newItem, brand: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Model</label>
                                    <input type="text" required className="w-full border rounded-lg p-2"
                                        value={newItem.model}
                                        onChange={e => setNewItem({ ...newItem, model: e.target.value })}
                                    />
                                </div>
                                {/* Specs */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Processor</label>
                                    <input type="text" className="w-full border rounded-lg p-2"
                                        value={newItem.processor}
                                        onChange={e => setNewItem({ ...newItem, processor: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Generation</label>
                                    <input type="text" className="w-full border rounded-lg p-2"
                                        value={newItem.generation}
                                        onChange={e => setNewItem({ ...newItem, generation: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RAM</label>
                                    <input type="text" className="w-full border rounded-lg p-2"
                                        value={newItem.ram}
                                        onChange={e => setNewItem({ ...newItem, ram: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Storage</label>
                                    <input type="text" className="w-full border rounded-lg p-2"
                                        value={newItem.storage}
                                        onChange={e => setNewItem({ ...newItem, storage: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">GPU</label>
                                    <input type="text" className="w-full border rounded-lg p-2"
                                        value={newItem.gpu}
                                        onChange={e => setNewItem({ ...newItem, gpu: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Screen Size</label>
                                    <input type="text" className="w-full border rounded-lg p-2"
                                        value={newItem.screen_size}
                                        onChange={e => setNewItem({ ...newItem, screen_size: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Grade (Optional)</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        value={newItem.grade || ''}
                                        onChange={e => setNewItem({ ...newItem, grade: e.target.value })}
                                    >
                                        <option value="">None</option>
                                        <option value="A+">A+</option>
                                        <option value="A">A</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
