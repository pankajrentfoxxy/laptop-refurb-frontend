import React, { useEffect, useState } from 'react';
import { Eye, Loader2, MessageSquare, RefreshCw, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function LaptopDetailsCell({ items }) {
    if (!items || items.length === 0) return <span className="text-gray-400">Loading...</span>;
    return (
        <div className="space-y-1.5 max-w-md">
            {items.map((item, idx) => (
                <div key={idx} className="text-xs border-l-2 border-slate-200 pl-2 py-0.5">
                    <div className="font-medium text-slate-800">{item.brand} {item.preferred_model || ''}</div>
                    <div className="text-gray-600">{item.processor}{item.generation ? ` | ${item.generation}` : ''} | {item.ram} | {item.storage}</div>
                    {item.machine_number ? (
                        <div className="text-blue-600 font-mono mt-0.5">Machine: {item.machine_number}</div>
                    ) : (
                        <div className="text-amber-600 mt-0.5">Pending assignment</div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function QCOrders({ api }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailsModal, setDetailsModal] = useState(null);
    const [noteModal, setNoteModal] = useState(null);
    const [noteText, setNoteText] = useState('');

    const isQC = user?.team_name?.includes('QC') ||
        user?.role === 'admin' ||
        user?.role === 'manager' ||
        user?.role === 'floor_manager' ||
        user?.role === 'qc' ||
        user?.permissions?.includes('qc_access');

    const loadOrders = React.useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/sales/orders');
            const qcOrders = (data.orders || []).filter(o => ['Procurement Pending', 'Warehouse Pending', 'QC Pending'].includes(o.status));
            const withItems = await Promise.all(
                qcOrders.map(async (o) => {
                    try {
                        const { data: detail } = await api.get(`/sales/orders/${o.order_id}`);
                        return { ...o, items: detail.items || [] };
                    } catch {
                        return { ...o, items: [] };
                    }
                })
            );
            setOrders(withItems);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        if (isQC) loadOrders();
    }, [isQC, loadOrders]);

    const handleQCPass = async (orderId) => {
        if (!window.confirm('Mark all laptops in this order as QC Passed?')) return;
        try {
            await api.put(`/sales/orders/${orderId}/qc-pass`);
            alert('All laptops marked QC Passed. Order visible in Dispatch.');
            loadOrders();
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleQCPassItem = async (orderId, itemId, onSuccess) => {
        if (!window.confirm('Mark this laptop as QC Passed? It will appear in Dispatch.')) return;
        try {
            await api.put(`/sales/orders/${orderId}/items/${itemId}/qc-pass`);
            alert('Laptop marked QC Passed. Now visible in Dispatch.');
            loadOrders();
            onSuccess?.();
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleSaveNote = async () => {
        if (!noteModal) return;
        if (!noteText.trim()) {
            alert('Please enter a note');
            return;
        }
        try {
            await api.post(`/sales/orders/${noteModal.order_id}/qc-note`, { notes: noteText.trim() });
            alert('QC note added');
            setNoteModal(null);
            setNoteText('');
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        }
    };

    if (!user) return null;
    if (!isQC) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
                <div className="text-center text-gray-500">
                    <p className="font-medium">Access Denied</p>
                    <p className="text-sm">QC access required</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">QC Orders</h2>
                    <p className="text-gray-600">Review Procurement Pending and QC Pending orders</p>
                </div>
                <button onClick={loadOrders} className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left p-3">Order ID</th>
                            <th className="text-left p-3">Laptop Details</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-center p-3">Items</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.order_id} className="border-t hover:bg-gray-50">
                                <td className="p-3 font-bold text-blue-600">#{order.order_id}</td>
                                <td className="p-3">
                                    <LaptopDetailsCell items={order.items || []} />
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        order.status === 'QC Pending' ? 'bg-purple-100 text-purple-700' :
                                        order.status === 'Warehouse Pending' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-3 text-center font-semibold">{order.items_count}</td>
                                <td className="p-3">
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => setDetailsModal(order)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {((order.status === 'QC Pending') || (order.status === 'Warehouse Pending' && (order.items || []).some(i => i.machine_number))) && (
                                            <>
                                                <button onClick={() => setDetailsModal(order)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">
                                                    QC Pass
                                                </button>
                                                {(order.items || []).filter(i => i.machine_number).length > 1 && (
                                                    <button onClick={() => handleQCPass(order.order_id)} className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600">
                                                        Pass All
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {order.status === 'Procurement Pending' && (
                                            <button onClick={() => setNoteModal(order)} className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" /> Add Note
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && !loading && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No QC orders found</td></tr>
                        )}
                        {loading && (
                            <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {noteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold">Add QC Note - Order #{noteModal.order_id}</h3>
                            <button onClick={() => setNoteModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <textarea
                                rows={4}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Example: Please update expected procurement date for QC planning."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                            />
                            <button onClick={handleSaveNote} className="w-full bg-indigo-600 text-white rounded-lg py-2">
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detailsModal && (
                <OrderDetailsQuick order={detailsModal} onClose={() => setDetailsModal(null)} api={api} onQCPassItem={handleQCPassItem} onRefresh={loadOrders} />
            )}
        </div>
    );
}

function OrderDetailsQuick({ order, onClose, api, onQCPassItem, onRefresh }) {
    const [items, setItems] = useState(order.items || []);
    const [loading, setLoading] = useState(!(order.items && order.items.length > 0));

    const refreshItems = async () => {
        try {
            const { data } = await api.get(`/sales/orders/${order.order_id}`);
            setItems(data.items || []);
            onRefresh?.();
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (order.items && order.items.length > 0) {
            setItems(order.items);
            setLoading(false);
            return;
        }
        const loadItems = async () => {
            try {
                const { data } = await api.get(`/sales/orders/${order.order_id}`);
                setItems(data.items || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, [order.order_id, order.items, api]);

    const hasAssignedItems = (items || []).some(i => i.machine_number);
    const isQCPending = order.status === 'QC Pending' || (order.status === 'Warehouse Pending' && hasAssignedItems);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold">Order #{order.order_id}</h3>
                        <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
                    ) : (
                        <div className="space-y-3">
                            <h4 className="font-bold text-gray-800">Laptop Details (Assigned by Procurement)</h4>
                            <p className="text-xs text-gray-500 mb-2">QC Pass each laptop individually. Passed laptops appear in Dispatch.</p>
                            {items.map((item, idx) => (
                                <div key={item.item_id || idx} className={`p-3 rounded-lg border flex justify-between items-start gap-3 ${item.machine_number ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium">{item.brand} {item.preferred_model || ''}</div>
                                        <div className="text-xs text-gray-600">{item.processor}{item.generation ? ` | ${item.generation}` : ''} | {item.ram} | {item.storage}</div>
                                        {item.machine_number ? (
                                            <>
                                                <div className="text-sm text-blue-700 font-mono mt-1 font-semibold">Machine: {item.machine_number}</div>
                                                {item.serial_number && <div className="text-xs text-gray-600 font-mono">Serial: {item.serial_number}</div>}
                                                <span className="inline-block mt-1 text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded">Scanned & Assigned</span>
                                            </>
                                        ) : (
                                            <span className="inline-block mt-1 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Pending scan</span>
                                        )}
                                        {item.qc_passed && (
                                            <span className="inline-flex items-center gap-1 mt-1 ml-1 text-xs bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">
                                                <CheckCircle className="w-3 h-3" /> QC Passed
                                            </span>
                                        )}
                                    </div>
                                    {isQCPending && item.machine_number && !item.qc_passed && onQCPassItem && (
                                        <button
                                            onClick={() => onQCPassItem(order.order_id, item.item_id, refreshItems)}
                                            className="shrink-0 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                                        >
                                            QC Pass
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800">Close</button>
                </div>
            </div>
        </div>
    );
}
