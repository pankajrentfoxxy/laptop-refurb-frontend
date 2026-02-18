import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Upload, UserPlus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['All', 'Pending', 'Cold', 'Warm', 'Hot', 'Gone', 'Hold', 'Rejected', 'Deal', 'Repeat'];
const SOURCE_OPTIONS = ['Google', 'LinkedIn', 'Team', 'References'];
const todayDate = () => new Date().toISOString().slice(0, 10);

export default function LeadList({ api }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [salesUsers, setSalesUsers] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [assignTo, setAssignTo] = useState('');
    const [assignUsers, setAssignUsers] = useState([]);
    const [assigningUnassigned, setAssigningUnassigned] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [page, setPage] = useState(1);
    const [manualLead, setManualLead] = useState({
        date: todayDate(),
        name: '',
        company_name: '',
        email: '',
        phone: '',
        city: '',
        source: 'Google'
    });
    const [creatingLead, setCreatingLead] = useState(false);
    const pageSize = 50;

    const canManage = ['admin', 'manager'].includes(user?.role);
    const canManualCreate = ['admin', 'manager', 'sales'].includes(user?.role);

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'All') params.append('status', statusFilter);
            if (search.trim()) params.append('search', search.trim());
            const { data } = await api.get(`/leads?${params.toString()}`);
            setLeads(data.leads || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [api, statusFilter, search]);

    const loadSalesUsers = useCallback(async () => {
        if (!canManage) return;
        try {
            const { data } = await api.get('/auth/users');
            const sales = (data.users || []).filter(u => u.role === 'sales');
            setSalesUsers(sales);
        } catch (err) {
            console.error(err);
        }
    }, [api, canManage]);

    useEffect(() => {
        setPage(1);
        loadLeads();
    }, [loadLeads]);

    useEffect(() => {
        loadSalesUsers();
    }, [loadSalesUsers]);

    const toggleSelect = (leadId) => {
        setSelectedLeads(prev => prev.includes(leadId)
            ? prev.filter(id => id !== leadId)
            : [...prev, leadId]
        );
    };

    const handleAssign = async () => {
        if (!assignTo || selectedLeads.length === 0) return;
        try {
            await api.post('/leads/assign', {
                lead_ids: selectedLeads,
                sales_user_id: assignTo
            });
            setMessage('Leads assigned successfully');
            setSelectedLeads([]);
            setAssignTo('');
            loadLeads();
        } catch (err) {
            setMessage('Failed to assign leads');
        }
    };

    const toggleAssignUser = (userId) => {
        setAssignUsers(prev => prev.includes(userId)
            ? prev.filter(id => id !== userId)
            : [...prev, userId]
        );
    };

    const handleAssignUnassigned = async () => {
        if (assignUsers.length === 0) return;
        setAssigningUnassigned(true);
        try {
            const { data } = await api.post('/leads/assign', {
                assign_unassigned_only: true,
                sales_user_ids: assignUsers
            });
            setMessage(data?.message ? `${data.message}. Total: ${data.total_assigned || 0}` : 'Unassigned leads distributed');
            loadLeads();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to assign unassigned leads');
        } finally {
            setAssigningUnassigned(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setMessage('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/leads/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(data.message || 'Upload complete');
            loadLeads();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDownloadSample = async () => {
        try {
            const response = await api.get('/leads/sample', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'lead_sample.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setMessage('Failed to download sample CSV');
        }
    };

    const handleManualLeadChange = (key, value) => {
        setManualLead(prev => ({ ...prev, [key]: value }));
    };

    const handleManualCreateLead = async () => {
        if (!manualLead.name.trim()) {
            setMessage('Name is required for manual lead entry');
            return;
        }
        setCreatingLead(true);
        setMessage('');
        try {
            await api.post('/leads', {
                name: manualLead.name.trim(),
                company_name: manualLead.company_name.trim() || null,
                email: manualLead.email.trim() || null,
                phone: manualLead.phone.trim() || null,
                city: manualLead.city.trim() || null,
                source: manualLead.source
            });
            setMessage('Lead created successfully');
            setManualLead({
                date: todayDate(),
                name: '',
                company_name: '',
                email: '',
                phone: '',
                city: '',
                source: 'Google'
            });
            loadLeads();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to create lead manually');
        } finally {
            setCreatingLead(false);
        }
    };

    const duplicateCount = useMemo(
        () => leads.filter(lead => lead.isDuplicate).length,
        [leads]
    );

    const totalPages = Math.max(1, Math.ceil(leads.length / pageSize));
    const pagedLeads = leads.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Leads</h2>
                    <p className="text-gray-600">Manage sales leads and assignments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadLeads}
                        className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleDownloadSample}
                        className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Sample CSV
                    </button>
                    {canManage && (
                        <label className="px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Uploading...' : 'Upload CSV'}
                            <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
                        </label>
                    )}
                </div>
            </div>

            {message && (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{message}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, company, email, phone..."
                        className="w-full pl-9 pr-3 py-2 border rounded-lg"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                    {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            {canManualCreate && (
                <div className="bg-white border rounded-xl p-4 space-y-3">
                    <div className="font-semibold text-gray-800">Manual Lead Entry</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-gray-500">Date</label>
                            <input
                                type="date"
                                value={manualLead.date}
                                readOnly
                                className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Name *</label>
                            <input
                                value={manualLead.name}
                                onChange={(e) => handleManualLeadChange('name', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Lead name"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Company</label>
                            <input
                                value={manualLead.company_name}
                                onChange={(e) => handleManualLeadChange('company_name', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Company name"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Email</label>
                            <input
                                type="email"
                                value={manualLead.email}
                                onChange={(e) => handleManualLeadChange('email', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Email"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Phone</label>
                            <input
                                value={manualLead.phone}
                                onChange={(e) => handleManualLeadChange('phone', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Phone"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">City</label>
                            <input
                                value={manualLead.city}
                                onChange={(e) => handleManualLeadChange('city', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="City"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Source</label>
                            <select
                                value={manualLead.source}
                                onChange={(e) => handleManualLeadChange('source', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                {SOURCE_OPTIONS.map((source) => (
                                    <option key={source} value={source}>{source}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleManualCreateLead}
                                disabled={creatingLead}
                                className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                            >
                                {creatingLead ? 'Saving...' : 'Create Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {canManage && (
                <div className="bg-white border rounded-xl p-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <UserPlus className="w-4 h-4" /> Assign selected leads
                        </div>
                        <select
                            value={assignTo}
                            onChange={(e) => setAssignTo(e.target.value)}
                            className="border rounded-lg px-3 py-2 flex-1"
                        >
                            <option value="">Select sales user</option>
                            {salesUsers.map(user => (
                                <option key={user.user_id} value={user.user_id}>{user.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAssign}
                            disabled={!assignTo || selectedLeads.length === 0}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            Assign
                        </button>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                        <div className="text-sm font-medium text-gray-700">Distribute all unassigned leads equally</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {salesUsers.map((salesUser) => (
                                <label key={salesUser.user_id} className="flex items-center gap-2 text-sm text-gray-700 border rounded-lg px-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={assignUsers.includes(salesUser.user_id)}
                                        onChange={() => toggleAssignUser(salesUser.user_id)}
                                    />
                                    <span>{salesUser.name}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            onClick={handleAssignUnassigned}
                            disabled={assignUsers.length === 0 || assigningUnassigned}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            {assigningUnassigned ? 'Assigning...' : 'Auto Assign Unassigned'}
                        </button>
                    </div>
                </div>
            )}

            {duplicateCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4" />
                    {duplicateCount} duplicate lead(s) detected.
                </div>
            )}

            <div className="bg-white border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            {canManage && <th className="p-3 text-left">Select</th>}
                            <th className="p-3 text-left">Lead ID</th>
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Lead</th>
                            <th className="p-3 text-left">Company</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Assignee</th>
                            <th className="p-3 text-left">Follow-up</th>
                            <th className="p-3 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedLeads.map(lead => (
                            <tr
                                key={lead.leadId}
                                className="border-t hover:bg-gray-50"
                            >
                                {canManage && (
                                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedLeads.includes(lead.leadId)}
                                            onChange={() => toggleSelect(lead.leadId)}
                                            className="rounded"
                                        />
                                    </td>
                                )}
                                <td className="p-2 font-medium">#{lead.leadId}</td>
                                <td className="p-2">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '-'}</td>
                                <td className="p-2">
                                    <div className="font-semibold">{lead.name}</div>
                                    <div className="text-xs text-gray-500">{lead.email || lead.phone || '-'}</div>
                                    {lead.isDuplicate && <span className="text-xs text-amber-600">Duplicate</span>}
                                </td>
                                <td className="p-2">{lead.companyName || '-'}</td>
                                <td className="p-2">
                                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="p-2">{lead.assignedUser?.name || '-'}</td>
                                <td className="p-2">{lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : '-'}</td>
                                <td className="p-2">
                                    <button
                                        onClick={() => navigate(`/leads/${lead.leadId}`)}
                                        className="text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && !loading && (
                            <tr>
                                <td colSpan={canManage ? 9 : 8} className="p-6 text-center text-gray-500">
                                    No leads found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                    Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, leads.length)} of {leads.length}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded border text-gray-700 disabled:opacity-50"
                    >
                        &lt;
                    </button>
                    <span className="text-gray-600">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded border text-gray-700 disabled:opacity-50"
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    );
}
