import React, { useState, useEffect, useRef } from 'react';
import { Truck, CheckCircle, Clock, AlertCircle, ShoppingCart, Scan, X, Loader2 } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

export default function Procurement({ api }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderModal, setOrderModal] = useState(null); // { request_id, vendor: '', estimated_cost: '' }
    const [scanModal, setScanModal] = useState(null); // { request_id, order_id, brand, processor, ram, storage }
    const [receiveModal, setReceiveModal] = useState(null); // For receiving NEW item
    const [showCompleted, setShowCompleted] = useState(false);

    // Filter Stats
    const stats = {
        new: requests.filter(r => r.status === 'New').length,
        ordered: requests.filter(r => r.status === 'Ordered').length,
        total: requests.length
    };

    const loadRequests = React.useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/procurement?include_received=${showCompleted}`);
            setRequests(data.requests || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [api, showCompleted]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleConfirmOrder = async (e) => {
        e.preventDefault();
        const { request_id, vendor, estimated_cost } = orderModal;
        try {
            await api.put(`/procurement/${request_id}`, {
                status: 'Ordered',
                vendor,
                estimated_cost
            });
            setOrderModal(null);
            loadRequests();
        } catch (e) {
            alert('Failed to update');
        }
    };

    const handleReceive = async (e) => {
        e.preventDefault();
        const { machine_number, serial_number, request_id } = receiveModal;

        try {
            const { data } = await api.post('/procurement/receive', {
                request_id,
                machine_number,
                serial_number
            });
            alert(`Item received and assigned. Order #${data.order_id} moved to ${data.status || 'QC Pending'}.`);
            setReceiveModal(null);
            loadRequests();
        } catch (e) {
            console.error(e);
            alert('Failed to receive item');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Truck className="text-blue-600" />
                        Procurement
                    </h2>
                    <p className="text-gray-600">Track and fulfill missing inventory requests. Scan laptops to assign to orders.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
                    Show completed
                </label>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
                    <div className="bg-white p-3 rounded-lg"><AlertCircle className="w-6 h-6 text-red-600" /></div>
                    <div>
                        <div className="text-2xl font-bold text-red-700">{stats.new}</div>
                        <div className="text-sm text-red-600">New Requests</div>
                    </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
                    <div className="bg-white p-3 rounded-lg"><Clock className="w-6 h-6 text-amber-600" /></div>
                    <div>
                        <div className="text-2xl font-bold text-amber-700">{stats.ordered}</div>
                        <div className="text-sm text-amber-600">Awaiting Delivery</div>
                    </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                    <div className="bg-white p-3 rounded-lg"><ShoppingCart className="w-6 h-6 text-blue-600" /></div>
                    <div>
                        <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                        <div className="text-sm text-blue-600">Total Active</div>
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500 text-sm">Order ID</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-sm">Item Needed</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-sm">Customer</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-sm">Status</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-sm">Vendor Info</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.map(req => (
                            <tr key={req.request_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">#{req.order_id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{req.brand} {req.preferred_model || 'Laptop'}</div>
                                    <div className="text-sm text-gray-500">{req.processor}{req.generation ? ` / ${req.generation}` : ''} / {req.ram} / {req.storage}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium">{req.customer_name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'New' ? 'bg-red-100 text-red-600' :
                                        req.status === 'Ordered' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {req.vendor ? (
                                        <div>
                                            <div className="font-medium">{req.vendor}</div>
                                            <div className="text-gray-500">₹{req.estimated_cost}</div>
                                            <div className="text-xs text-gray-400">ETA: {req.expected_date || '-'}</div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Not ordered</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2 flex-wrap">
                                        {(req.status === 'New' || req.status === 'Ordered') && (
                                            <button
                                                onClick={() => setScanModal({
                                                    request_id: req.request_id,
                                                    order_id: req.order_id,
                                                    brand: req.brand,
                                                    processor: req.processor,
                                                    ram: req.ram,
                                                    storage: req.storage
                                                })}
                                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1"
                                            >
                                                <Scan className="w-4 h-4" /> Scan & Assign
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {requests.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">No active procurement requests.</div>
                )}
            </div>

            {/* Order Modal */}
            {orderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Mark as Ordered</h3>
                        <form onSubmit={handleConfirmOrder} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                                <input
                                    className="w-full border rounded-lg p-2"
                                    value={orderModal.vendor}
                                    onChange={e => setOrderModal({ ...orderModal, vendor: e.target.value })}
                                    placeholder="e.g. Amazon, IT Supplier"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg p-2"
                                    value={orderModal.estimated_cost}
                                    onChange={e => setOrderModal({ ...orderModal, estimated_cost: e.target.value })}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setOrderModal(null)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Scan & Assign Modal */}
            {scanModal && (
                <ScanAssignModal
                    scanModal={scanModal}
                    onClose={() => setScanModal(null)}
                    api={api}
                    onSuccess={() => { setScanModal(null); loadRequests(); }}
                />
            )}

            {/* Receive NEW Item Modal */}
            {receiveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Receive New Item</h3>
                        <p className="text-sm text-gray-500 mb-4">Use this when receiving a newly purchased laptop that is not yet in inventory.</p>
                        <form onSubmit={handleReceive} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                <input
                                    className="w-full border rounded-lg p-2"
                                    value={receiveModal.serial_number}
                                    onChange={e => setReceiveModal({ ...receiveModal, serial_number: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Machine Number (Optional)</label>
                                <input
                                    className="w-full border rounded-lg p-2"
                                    value={receiveModal.machine_number}
                                    onChange={e => setReceiveModal({ ...receiveModal, machine_number: e.target.value })}
                                    placeholder="Auto-generated if empty"
                                />
                            </div>
                            <div>
                                <div className="p-2 bg-gray-100 rounded text-sm text-gray-600">
                                    Will be marked as <strong>Reserved</strong> and assigned to Order.
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setReceiveModal(null)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">Confirm Receipt</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ScanAssignModal({ scanModal, onClose, api, onSuccess }) {
    const [machineNumber, setMachineNumber] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        // Focus input on open
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleAssign = async () => {
        if (!machineNumber.trim()) {
            alert('Please enter or scan a machine number');
            return;
        }

        setProcessing(true);
        try {
            const { data } = await api.post('/procurement/assign', {
                request_id: scanModal.request_id,
                machine_number: machineNumber.trim()
            });
            alert(`✅ ${data.message}\nMachine: ${data.machine_number}\nOrder: #${data.order_id}`);
            onSuccess();
        } catch (e) {
            console.error(e);
            alert('❌ ' + (e.response?.data?.message || 'Failed to assign'));
        } finally {
            setProcessing(false);
        }
    };

    const handleBarcodeScan = (code) => {
        setMachineNumber(code);
        setShowScanner(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Scan className="text-green-600" /> Scan & Assign Laptop
                        </h3>
                        <p className="text-sm text-gray-500">Order #{scanModal.order_id}</p>
                    </div>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Item specs */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="text-sm text-blue-600 font-medium mb-1">Item Required:</div>
                        <div className="font-bold text-blue-900">{scanModal.brand} Laptop</div>
                        <div className="text-sm text-blue-700">{scanModal.processor}{scanModal.generation ? ` | ${scanModal.generation}` : ''} | {scanModal.ram} | {scanModal.storage}</div>
                    </div>

                    {showScanner ? (
                        <div className="border rounded-lg overflow-hidden">
                            <BarcodeScanner
                                onResult={handleBarcodeScan}
                                onError={(err) => { console.error(err); setShowScanner(false); }}
                            />
                            <button onClick={() => setShowScanner(false)} className="w-full py-2 bg-gray-100 text-gray-700 text-sm">Cancel Scan</button>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Machine Number</label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={machineNumber}
                                    onChange={e => setMachineNumber(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleAssign()}
                                    placeholder="Scan barcode or type machine number"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg font-mono"
                                />
                            </div>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-full py-3 border-2 border-dashed border-green-300 text-green-600 font-medium rounded-xl hover:bg-green-50 flex items-center justify-center gap-2"
                            >
                                <Scan className="w-5 h-5" /> Use Camera Scanner
                            </button>
                        </>
                    )}
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button
                        onClick={handleAssign}
                        disabled={processing || !machineNumber.trim()}
                        className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Assign to Order
                    </button>
                </div>
            </div>
        </div>
    );
}
