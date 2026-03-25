import React, { useEffect, useState } from 'react';
import { Eye, Loader2, MessageSquare, RefreshCw, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PipelinePagination from './PipelinePagination';
import { formatOrderDate } from '../utils/formatOrderDate';

const QC_PIPELINE_STATUSES = 'Procurement Pending,Warehouse Pending,QC Pending';
const PAGE_SIZE = 50;

function LaptopDetailsCell({ items }) {
    if (!items || items.length === 0) return <span className="text-gray-400 text-[11px]">Loading...</span>;
    return (
        <div className="space-y-1 max-w-md">
            {items.map((item, idx) => (
                <div key={idx} className="text-[11px] border-l-2 border-slate-200 pl-1.5 py-0.5">
                    <div className="font-medium text-slate-800">{item.brand} {item.preferred_model || ''}</div>
                    <div className="text-gray-600 leading-tight">{item.processor}{item.generation ? ` | ${item.generation}` : ''} | {item.ram} | {item.storage}</div>
                    {item.machine_number ? (
                        <div className="text-blue-600 font-mono mt-0.5 text-[10px]">Machine: {item.machine_number}</div>
                    ) : (
                        <div className="text-amber-600 mt-0.5 text-[10px]">Pending assignment</div>
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
    const [bitlockerModal, setBitlockerModal] = useState(null); // { orderId, itemId?, isPassAll, onSuccess? }
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const isQC = user?.team_name?.includes('QC') ||
        user?.role === 'admin' ||
        user?.role === 'manager' ||
        user?.role === 'floor_manager' ||
        user?.role === 'qc' ||
        user?.permissions?.includes('qc_access');

    const loadOrders = React.useCallback(async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * PAGE_SIZE;
            const { data } = await api.get('/sales/orders', {
                params: {
                    statuses: QC_PIPELINE_STATUSES,
                    limit: PAGE_SIZE,
                    offset
                }
            });
            const ordersPage = data.orders || [];
            setTotal(typeof data.total === 'number' ? data.total : ordersPage.length);
            const withItems = await Promise.all(
                ordersPage.map(async (o) => {
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
    }, [api, page]);

    useEffect(() => {
        if (isQC) loadOrders();
    }, [isQC, loadOrders]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (total > 0 && page > totalPages) setPage(totalPages);
    }, [total, page]);

    const handleQCPassClick = (orderId, itemId = null, isPassAll = false, onSuccess = null) => {
        setBitlockerModal({ orderId, itemId, isPassAll, onSuccess });
    };

    const handleBitlockerDone = async () => {
        if (!bitlockerModal) return;
        const { orderId, itemId, isPassAll, onSuccess } = bitlockerModal;
        setBitlockerModal(null);
        try {
            if (isPassAll) {
                await api.put(`/sales/orders/${orderId}/qc-pass`);
                alert('All laptops marked QC Passed. Order visible in Dispatch.');
            } else {
                await api.put(`/sales/orders/${orderId}/items/${itemId}/qc-pass`);
                alert('Laptop marked QC Passed. Now visible in Dispatch.');
            }
            loadOrders();
            onSuccess?.();
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleQCPass = (orderId) => handleQCPassClick(orderId, null, true);
    const handleQCPassItem = (orderId, itemId, onSuccess) => handleQCPassClick(orderId, itemId, false, onSuccess);

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
            loadOrders();
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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">QC Orders</h2>
                    <p className="text-gray-600 text-sm">Review Procurement Pending, Warehouse Pending, and QC Pending orders</p>
                </div>
                <button
                    type="button"
                    onClick={loadOrders}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 rounded-md flex items-center gap-1.5 hover:bg-gray-200"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-500">Order ID</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-500 whitespace-nowrap">Order Date</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-500">Laptop Details</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-500">Items</th>
                            <th className="px-3 py-2 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map(order => (
                            <tr key={order.order_id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 align-middle font-bold text-blue-600 text-[13px]">#{order.order_id}</td>
                                <td className="px-3 py-2 align-middle text-gray-700 whitespace-nowrap tabular-nums">
                                    {formatOrderDate(order.created_at)}
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <LaptopDetailsCell items={order.items || []} />
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        order.status === 'QC Pending' ? 'bg-purple-100 text-purple-700' :
                                        order.status === 'Warehouse Pending' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-3 py-2 align-middle text-center font-semibold tabular-nums">{order.items_count}</td>
                                <td className="px-3 py-2 align-middle">
                                    <div className="flex gap-1.5 justify-center flex-wrap">
                                        <button type="button" onClick={() => setDetailsModal(order)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {((order.status === 'QC Pending') || (order.status === 'Warehouse Pending' && (order.items || []).some(i => i.status === 'Assigned'))) && (
                                            <>
                                                <button type="button" onClick={() => setDetailsModal(order)} className="px-2 py-1 bg-indigo-600 text-white rounded-md text-[10px] font-bold hover:bg-indigo-700">
                                                    QC Pass
                                                </button>
                                                {(order.items || []).filter(i => i.status === 'Assigned').length > 1 && (
                                                    <button type="button" onClick={() => handleQCPass(order.order_id)} className="px-2 py-1 bg-indigo-500 text-white rounded-md text-[10px] font-bold hover:bg-indigo-600">
                                                        Pass All
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {order.status === 'Procurement Pending' && (
                                            <button type="button" onClick={() => setNoteModal(order)} className="px-2 py-1 bg-amber-600 text-white rounded-md text-[10px] font-bold hover:bg-amber-700 flex items-center gap-0.5">
                                                <MessageSquare className="w-3 h-3" /> Add Note
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && !loading && (
                            <tr><td colSpan={6} className="p-6 text-center text-gray-500 text-sm">No QC orders found</td></tr>
                        )}
                        {loading && (
                            <tr><td colSpan={6} className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                        )}
                    </tbody>
                </table>
                {total > 0 && (
                    <PipelinePagination
                        page={page}
                        pageSize={PAGE_SIZE}
                        total={total}
                        disabled={loading}
                        onPageChange={setPage}
                    />
                )}
            </div>

            {bitlockerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="text-center mb-6">
                            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Please remove Bitlocker</h3>
                            <p className="text-gray-600 text-sm">
                                Ensure Bitlocker has been removed from the laptop before marking QC Pass. The order will move to Dispatch after you confirm.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setBitlockerModal(null)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBitlockerDone}
                                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

    const hasAssignedItems = (items || []).some(i => i.status === 'Assigned');
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
                                <div key={item.item_id || idx} className={`p-3 rounded-lg border flex justify-between items-start gap-3 ${item.status === 'Assigned' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium">{item.brand} {item.preferred_model || ''}</div>
                                        <div className="text-xs text-gray-600">{item.processor}{item.generation ? ` | ${item.generation}` : ''} | {item.ram} | {item.storage}</div>
                                        {item.status === 'Assigned' ? (
                                            <>
                                                <div className="text-sm text-blue-700 font-mono mt-1 font-semibold">Machine: {item.machine_number || '-'}</div>
                                                {item.serial_number && <div className="text-xs text-gray-600 font-mono">Serial: {item.serial_number}</div>}
                                                <span className="inline-block mt-1 text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded">Warehouse Marked Ready</span>
                                            </>
                                        ) : item.status === 'Warehouse' ? (
                                            <>
                                                <div className="text-sm text-gray-600 font-mono mt-1">Machine: {item.machine_number || '-'}</div>
                                                <span className="inline-block mt-1 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Waiting for Warehouse</span>
                                            </>
                                        ) : (
                                            <span className="inline-block mt-1 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Pending assignment</span>
                                        )}
                                        {item.qc_passed && (
                                            <span className="inline-flex items-center gap-1 mt-1 ml-1 text-xs bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">
                                                <CheckCircle className="w-3 h-3" /> QC Passed
                                            </span>
                                        )}
                                    </div>
                                    {isQCPending && item.status === 'Assigned' && !item.qc_passed && onQCPassItem && (
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
