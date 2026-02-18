import React, { useState, useEffect } from 'react';
import {
    ClipboardList, Eye,
    Loader2, X, RefreshCw, User, Ban, Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Orders({ api }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewAll, setViewAll] = useState(false);

    const isManager = ['admin', 'manager'].includes(user?.role);

    const loadOrders = React.useCallback(async () => {
        setLoading(true);
        try {
            let url = '/sales/orders';
            const params = new URLSearchParams();

            if (activeTab !== 'all') {
                params.append('status', activeTab);
            }
            if (!viewAll && isManager) {
                params.append('owner', 'mine');
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const { data } = await api.get(url);
            setOrders(data.orders || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [api, activeTab, viewAll, isManager]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const getStatusBadge = (status) => {
        const colors = {
            'New Lead': 'bg-blue-100 text-blue-700',
            'Procurement Pending': 'bg-yellow-100 text-yellow-700',
            'Processing': 'bg-orange-100 text-orange-700',
            'QC Pending': 'bg-purple-100 text-purple-700',
            'QC Passed': 'bg-indigo-100 text-indigo-700',
            'Ready to Dispatch': 'bg-green-100 text-green-700',
            'Dispatched': 'bg-cyan-100 text-cyan-700',
            'Delivered': 'bg-emerald-100 text-emerald-700',
            'Cancelled': 'bg-rose-100 text-rose-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const tabs = [
        { key: 'all', label: 'All Orders' },
        { key: 'Procurement Pending', label: 'Procurement' },
        { key: 'QC Pending', label: 'QC Pending' },
        { key: 'QC Passed', label: 'QC Passed' },
        { key: 'Dispatched', label: 'Dispatched' },
        { key: 'Delivered', label: 'Delivered' },
        { key: 'Cancelled', label: 'Cancelled' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="text-blue-600" />
                        Orders
                    </h2>
                    <p className="text-gray-600">Track and manage all orders</p>
                </div>
                <div className="flex items-center gap-3">
                    {isManager && (
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={viewAll}
                                onChange={e => setViewAll(e.target.checked)}
                                className="rounded"
                            />
                            View All Orders
                        </label>
                    )}
                    <button onClick={loadOrders} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {tabs.slice(1).map(tab => {
                    const count = orders.filter(o => o.status === tab.key).length;
                    return (
                        <div
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${activeTab === tab.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className="text-xs text-gray-500">{tab.label}</div>
                            <div className="text-2xl font-bold">{count}</div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left p-3">Order ID</th>
                            <th className="text-left p-3">Customer</th>
                            <th className="text-center p-3">Items</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Owner</th>
                            <th className="text-left p-3">Dispatch</th>
                            <th className="text-right p-3">Value</th>
                            <th className="p-3"></th>
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
                                <td className="p-3 text-center font-bold">{order.items_count}</td>
                                <td className="p-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-600 text-xs">
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {order.owner_name || '-'}
                                    </div>
                                </td>
                                <td className="p-3 text-xs">
                                    {order.dispatched_at ? (
                                        <div>
                                            <div className="text-gray-600">{order.courier_partner}</div>
                                            <div className="text-blue-600 font-mono">{order.tracker_id}</div>
                                            {order.estimated_delivery && (
                                                <div className="text-green-600">ETA: {new Date(order.estimated_delivery).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="p-3 text-right font-bold text-gray-700">₹{parseInt(order.total_value || 0).toLocaleString()}</td>
                                <td className="p-3">
                                    <button onClick={() => setSelectedOrder(order)} className="text-blue-600 hover:text-blue-800">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && !loading && (
                            <tr><td colSpan={8} className="p-8 text-center text-gray-500">No orders found</td></tr>
                        )}
                        {loading && (
                            <tr><td colSpan={8} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} api={api} onRefresh={loadOrders} user={user} />
            )}
        </div>
    );
}

function OrderDetailsModal({ order, onClose, api, onRefresh, user }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [itemEdits, setItemEdits] = useState({});
    const [savingItemId, setSavingItemId] = useState(null);

    const canDispatchFlow =
        user?.role !== 'sales' &&
        (['admin', 'manager', 'floor_manager'].includes(user?.role) || user?.permissions?.includes('dispatch_access'));
    const canSalesEdit =
        ['sales', 'admin', 'manager'].includes(user?.role) ||
        user?.permissions?.includes('sales_access');
    const availableOfficeAddresses = React.useMemo(() => {
        const fromProfile = details?.customer_addresses || [];
        if (fromProfile.length) return fromProfile;
        const map = new Map();
        (details?.items || []).forEach((item) => {
            if (!item.customer_address_id || !item.delivery_address) return;
            const key = String(item.customer_address_id);
            if (map.has(key)) return;
            map.set(key, {
                customer_address_id: item.customer_address_id,
                concern_person: item.delivery_contact_name || 'Contact',
                address: item.delivery_address,
                pincode: item.delivery_pincode || '',
                is_head_office: false
            });
        });
        return Array.from(map.values());
    }, [details]);

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const { data } = await api.get(`/sales/orders/${order.order_id}`);
                setDetails(data);
                const initialEdits = {};
                (data.items || []).forEach((item) => {
                    initialEdits[item.item_id] = {
                        delivery_mode: item.delivery_mode || (item.is_wfh ? 'WFH' : 'Office'),
                        customer_address_id: item.customer_address_id ? String(item.customer_address_id) : '',
                        shipping_charge: item.shipping_charge || 0,
                        delivery_contact_name: item.delivery_contact_name || '',
                        delivery_contact_phone: item.delivery_contact_phone || '',
                        delivery_address: item.delivery_address || '',
                        delivery_pincode: item.delivery_pincode || ''
                    };
                });
                setItemEdits(initialEdits);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        loadDetails();
    }, [order.order_id, api]);

    const handleCancelOrder = async () => {
        const reason = window.prompt('Reason for cancellation (optional):', 'Cancelled by customer');
        if (reason === null) return;
        if (!window.confirm('Cancel this order? It will be removed from QC/Procurement/Dispatch flow.')) return;
        setProcessing(true);
        try {
            await api.put(`/sales/orders/${order.order_id}/cancel`, { reason });
            alert('Order cancelled successfully');
            onRefresh();
            onClose();
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        } finally { setProcessing(false); }
    };

    const handleSaveItemLogistics = async (itemId) => {
        const payload = itemEdits[itemId];
        if (!payload) return;
        setSavingItemId(itemId);
        try {
            await api.put(`/sales/orders/${order.order_id}/items/${itemId}/logistics`, payload);
            const { data } = await api.get(`/sales/orders/${order.order_id}`);
            setDetails(data);
            alert('Laptop details updated');
            onRefresh();
        } catch (e) {
            alert('Failed to update laptop details: ' + (e.response?.data?.message || e.message));
        } finally {
            setSavingItemId(null);
        }
    };

    const getItemStatusBadge = (status) => {
        const colors = { 'Assigned': 'bg-green-100 text-green-700', 'Procurement': 'bg-orange-100 text-orange-700' };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };
    const getTrackingStatusBadge = (status) => {
        const colors = {
            'Not Dispatched': 'bg-gray-100 text-gray-700',
            'On The Way': 'bg-blue-100 text-blue-700',
            'Delivered': 'bg-emerald-100 text-emerald-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <ClipboardList className="text-blue-600" /> Order #{order.order_id}
                        </h3>
                        <p className="text-sm text-gray-500">{order.customer_name} | Owner: {details?.order?.owner_name || order.owner_name || 'Unknown'}</p>
                    </div>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
                    ) : details ? (
                        <div className="space-y-6">
                            {/* Status & Dispatch Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Status</div>
                                    <div className="font-bold text-blue-600">{details.order.status}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Delivered Laptops</div>
                                    <div className="font-bold text-emerald-700">{details.tracking_summary?.delivered || 0}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">On The Way</div>
                                    <div className="font-bold text-blue-700">{details.tracking_summary?.on_the_way || 0}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Not Dispatched</div>
                                    <div className="font-bold text-gray-700">{details.tracking_summary?.not_dispatched || 0}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Created</div>
                                    <div className="font-bold">{new Date(details.order.created_at).toLocaleString()}</div>
                                </div>
                                {details.order.courier_partner && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-500">Courier</div>
                                        <div className="font-bold">{details.order.courier_partner}</div>
                                    </div>
                                )}
                                {details.order.tracker_id && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-500">Tracker ID</div>
                                        <div className="font-bold text-blue-600 font-mono">{details.order.tracker_id}</div>
                                    </div>
                                )}
                                {details.order.estimated_delivery && (
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                        <div className="text-xs text-green-600">ETA</div>
                                        <div className="font-bold text-green-700">{new Date(details.order.estimated_delivery).toLocaleDateString()}</div>
                                    </div>
                                )}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Order Type</div>
                                    <div className="font-bold">{details.order.order_type || '-'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Lock-in (Days)</div>
                                    <div className="font-bold">{details.order.lockin_period_days ?? 0}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Security Amount</div>
                                    <div className="font-bold">₹{parseFloat(details.order.security_amount || 0).toFixed(2)}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Estimate ID</div>
                                    <div className="font-bold">{details.order.estimate_id || '-'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">Invoice</div>
                                    <div className="font-bold">{details.order.invoice_number || '-'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500">E-way Bill</div>
                                    <div className="font-bold">{details.order.eway_bill_number || '-'}</div>
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3">Status Timeline</h4>
                                <div className="space-y-2">
                                    {(details.status_history || []).map((entry, idx) => (
                                        <div key={entry.history_id || idx} className="bg-gray-50 border rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {entry.from_status ? `${entry.from_status} → ${entry.to_status}` : entry.to_status}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(entry.changed_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                By: {entry.changed_by_name || 'System'}
                                            </div>
                                            {entry.notes && <div className="text-xs text-gray-600 mt-1">{entry.notes}</div>}
                                        </div>
                                    ))}
                                    {(!details.status_history || details.status_history.length === 0) && (
                                        <div className="text-sm text-gray-500">No status history available yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3">Order Items</h4>
                                <div className="space-y-2">
                                    {details.items.map((item, idx) => (
                                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{item.brand} {item.preferred_model}</div>
                                                    <div className="text-xs text-gray-500">{item.processor} | {item.ram} | {item.storage}</div>
                                                    {item.machine_number && <div className="text-xs text-blue-600 mt-1">Machine: {item.machine_number}</div>}
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getItemStatusBadge(item.status)}`}>{item.status}</span>
                                                    <div className="mt-1">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getTrackingStatusBadge(item.tracking_status)}`}>{item.tracking_status || 'Not Dispatched'}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">Qty: {item.quantity} | ₹{item.unit_price}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-2 text-xs">
                                                <select
                                                    className="border rounded px-2 py-1"
                                                    value={itemEdits[item.item_id]?.delivery_mode ?? item.delivery_mode ?? (item.is_wfh ? 'WFH' : 'Office')}
                                                    disabled={!canSalesEdit}
                                                    onChange={(e) => setItemEdits(prev => ({
                                                        ...prev,
                                                        [item.item_id]: {
                                                            ...(prev[item.item_id] || {}),
                                                            delivery_mode: e.target.value,
                                                            shipping_charge: e.target.value === 'WFH'
                                                                ? (prev[item.item_id]?.shipping_charge || item.shipping_charge || 0)
                                                                : 0
                                                        }
                                                    }))}
                                                >
                                                    <option value="Office">Office</option>
                                                    <option value="WFH">WFH</option>
                                                </select>
                                                {(itemEdits[item.item_id]?.delivery_mode ?? item.delivery_mode ?? (item.is_wfh ? 'WFH' : 'Office')) === 'Office' ? (
                                                    <select
                                                        className="border rounded px-2 py-1 md:col-span-4"
                                                        disabled={!canSalesEdit}
                                                        value={itemEdits[item.item_id]?.customer_address_id ?? (item.customer_address_id ? String(item.customer_address_id) : '')}
                                                        onChange={(e) => setItemEdits(prev => ({
                                                            ...prev,
                                                            [item.item_id]: { ...(prev[item.item_id] || {}), customer_address_id: e.target.value }
                                                        }))}
                                                    >
                                                        <option value="">Select office address</option>
                                                        {availableOfficeAddresses.map((row) => (
                                                            <option key={row.customer_address_id} value={row.customer_address_id}>
                                                                {row.is_head_office ? '[Head Office] ' : ''}{row.concern_person || 'Contact'} - {row.address} {row.pincode ? `(${row.pincode})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <>
                                                        <input
                                                            className="border rounded px-2 py-1"
                                                            placeholder="WFH Shipping"
                                                            type="number"
                                                            min="0"
                                                            disabled={!canSalesEdit}
                                                            value={itemEdits[item.item_id]?.shipping_charge ?? item.shipping_charge ?? 0}
                                                            onChange={(e) => setItemEdits(prev => ({
                                                                ...prev,
                                                                [item.item_id]: { ...(prev[item.item_id] || {}), shipping_charge: e.target.value }
                                                            }))}
                                                        />
                                                        <input
                                                            className="border rounded px-2 py-1"
                                                            placeholder="Name"
                                                            disabled={!canSalesEdit}
                                                            value={itemEdits[item.item_id]?.delivery_contact_name ?? item.delivery_contact_name ?? ''}
                                                            onChange={(e) => setItemEdits(prev => ({
                                                                ...prev,
                                                                [item.item_id]: { ...(prev[item.item_id] || {}), delivery_contact_name: e.target.value }
                                                            }))}
                                                        />
                                                        <input
                                                            className="border rounded px-2 py-1"
                                                            placeholder="Phone"
                                                            disabled={!canSalesEdit}
                                                            value={itemEdits[item.item_id]?.delivery_contact_phone ?? item.delivery_contact_phone ?? ''}
                                                            onChange={(e) => setItemEdits(prev => ({
                                                                ...prev,
                                                                [item.item_id]: { ...(prev[item.item_id] || {}), delivery_contact_phone: e.target.value }
                                                            }))}
                                                        />
                                                        <input
                                                            className="border rounded px-2 py-1 md:col-span-2"
                                                            placeholder="Address"
                                                            disabled={!canSalesEdit}
                                                            value={itemEdits[item.item_id]?.delivery_address ?? item.delivery_address ?? ''}
                                                            onChange={(e) => setItemEdits(prev => ({
                                                                ...prev,
                                                                [item.item_id]: { ...(prev[item.item_id] || {}), delivery_address: e.target.value }
                                                            }))}
                                                        />
                                                        <input
                                                            className="border rounded px-2 py-1"
                                                            placeholder="Pincode"
                                                            disabled={!canSalesEdit}
                                                            value={itemEdits[item.item_id]?.delivery_pincode ?? item.delivery_pincode ?? ''}
                                                            onChange={(e) => setItemEdits(prev => ({
                                                                ...prev,
                                                                [item.item_id]: { ...(prev[item.item_id] || {}), delivery_pincode: e.target.value }
                                                            }))}
                                                        />
                                                    </>
                                                )}
                                                {canSalesEdit ? (
                                                    <button
                                                        onClick={() => handleSaveItemLogistics(item.item_id)}
                                                        disabled={savingItemId === item.item_id}
                                                        className="px-2 py-1 bg-slate-800 text-white rounded hover:bg-slate-900 flex items-center justify-center gap-1 disabled:opacity-60"
                                                    >
                                                        <Save className="w-3 h-3" /> {savingItemId === item.item_id ? 'Saving...' : 'Save'}
                                                    </button>
                                                ) : (
                                                    <div className="text-gray-500">
                                                        {item.delivery_mode === 'WFH' ? 'WFH' : 'Office'} | {item.delivery_contact_name || '-'} | {item.delivery_contact_phone || '-'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-2">
                                                Delivery: {item.delivery_address || '-'} {item.delivery_pincode ? `(${item.delivery_pincode})` : ''}
                                            </div>
                                            {(item.item_courier_partner || item.item_tracker_id) && (
                                                <div className="mt-2 text-xs text-gray-600">
                                                    Courier: {item.item_courier_partner || '-'} | Tracker: {item.item_tracker_id || '-'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t flex-wrap">
                                {canSalesEdit && details.order.status !== 'Cancelled' && details.order.status !== 'Delivered' && details.order.status !== 'Dispatched' && (
                                    <button
                                        onClick={handleCancelOrder}
                                        disabled={processing}
                                        className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Ban className="w-4 h-4" /> Cancel Order
                                    </button>
                                )}
                                {!canDispatchFlow && (
                                    <div className="text-sm text-gray-500">Status actions are restricted to Dispatch team.</div>
                                )}
                            </div>
                        </div>
                    ) : <div className="text-center text-gray-500 py-8">Failed to load order details</div>}
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800">Close</button>
                </div>
            </div>
        </div>
    );
}
