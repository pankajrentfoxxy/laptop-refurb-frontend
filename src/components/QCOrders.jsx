import React, { useEffect, useState } from 'react';
import { Eye, Loader2, MessageSquare, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
        user?.permissions?.includes('qc_access');

    const loadOrders = React.useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/sales/orders');
            const qcOrders = (data.orders || []).filter(o => o.status === 'Procurement Pending' || o.status === 'QC Pending');
            setOrders(qcOrders);
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
        if (!window.confirm('Mark this order as QC Passed?')) return;
        try {
            await api.put(`/sales/orders/${orderId}/qc-pass`);
            alert('Order moved to QC Passed and now visible in Dispatch.');
            loadOrders();
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
                            <th className="text-left p-3">Customer</th>
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
                                    <div className="font-medium">{order.customer_name}</div>
                                    <div className="text-xs text-gray-400">{order.customer_email}</div>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'QC Pending' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-3 text-center font-semibold">{order.items_count}</td>
                                <td className="p-3">
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => setDetailsModal(order)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {order.status === 'QC Pending' && (
                                            <button onClick={() => handleQCPass(order.order_id)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">
                                                QC Pass
                                            </button>
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
                <OrderDetailsQuick order={detailsModal} onClose={() => setDetailsModal(null)} api={api} />
            )}
        </div>
    );
}

function OrderDetailsQuick({ order, onClose, api }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, [order.order_id, api]);

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
                            <h4 className="font-bold text-gray-800">Laptop Details</h4>
                            {items.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="font-medium">{item.brand} {item.preferred_model}</div>
                                    <div className="text-xs text-gray-500">{item.processor} | {item.ram} | {item.storage}</div>
                                    {item.machine_number && <div className="text-xs text-blue-600 mt-1">Machine: {item.machine_number}</div>}
                                    {item.serial_number && <div className="text-xs text-gray-500">Serial: {item.serial_number}</div>}
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
