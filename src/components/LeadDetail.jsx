import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, RefreshCw, AlertTriangle, ChevronDown, ChevronRight, MessageSquarePlus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Pending', 'Cold', 'Warm', 'Hot', 'Gone', 'Hold', 'Rejected', 'Call Back', 'Deal'];
const toDateTimeLocalValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const INITIAL_RESEARCH_FORM = {
    industry: '',
    pincode: '',
    cin: '',
    entity_type: '',
    roc: '',
    revenue: '',
    employees: '',
    gst: '',
    address: '',
    city: '',
    state: '',
    departments: '',
    website: '',
    linkedin_url: '',
    facebook_url: '',
    twitter_url: '',
    technologies: '',
    annual_revenue: '',
    total_funding: '',
    latest_funding: '',
    latest_funding_amount: '',
    subsidiary_of: '',
    summary: ''
};

const mapResearchToForm = (research) => {
    const raw = (research && typeof research.rawResponse === 'object' && research.rawResponse) ? research.rawResponse : {};
    return {
        cin: research?.cin || raw.cin || '',
        industry: raw.industry || research?.industry || '',
        pincode: raw.pincode || research?.pincode || '',
        entity_type: research?.entityType || raw.entity_type || raw.entityType || '',
        roc: research?.roc || raw.roc || '',
        revenue: research?.revenue || raw.revenue || '',
        employees: research?.employees || raw.employees || '',
        gst: research?.gst || raw.gst || '',
        address: research?.address || raw.address || '',
        city: research?.city || raw.city || '',
        state: research?.state || raw.state || '',
        departments: Array.isArray(raw.departments) ? raw.departments.join(', ') : (raw.departments || ''),
        website: raw.website || '',
        linkedin_url: raw.linkedin_url || '',
        facebook_url: raw.facebook_url || '',
        twitter_url: raw.twitter_url || '',
        technologies: Array.isArray(raw.technologies) ? raw.technologies.join(', ') : (raw.technologies || ''),
        annual_revenue: raw.annual_revenue || '',
        total_funding: raw.total_funding || '',
        latest_funding: raw.latest_funding || '',
        latest_funding_amount: raw.latest_funding_amount || '',
        subsidiary_of: raw.subsidiary_of || '',
        summary: raw.summary || ''
    };
};

export default function LeadDetail({ api }) {
    const { user } = useAuth();
    const { id } = useParams();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Cold');
    const [rejectionReason, setRejectionReason] = useState('');
    const [notes, setNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [researchForm, setResearchForm] = useState(INITIAL_RESEARCH_FORM);
    const [editingResearch, setEditingResearch] = useState(false);
    const [savingResearch, setSavingResearch] = useState(false);
    const [editingBasic, setEditingBasic] = useState(false);
    const [savingBasic, setSavingBasic] = useState(false);
    const [basicForm, setBasicForm] = useState({
        name: '',
        brand: '',
        company_name: '',
        email: '',
        phone: '',
        city: ''
    });
    const [addressForm, setAddressForm] = useState({ concern_person: '', mobile_no: '', address: '', pincode: '', address_type: 'Shipping' });
    const [savingAddress, setSavingAddress] = useState(false);
    const [remarksOpen, setRemarksOpen] = useState(false);
    const [remarkText, setRemarkText] = useState('');
    const [savingRemark, setSavingRemark] = useState(false);
    const [deletingRemarkId, setDeletingRemarkId] = useState(null);
    const [expandedSections, setExpandedSections] = useState({ status: true, followup: false, addresses: false, remarks: true });
    const navigate = useNavigate();

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const loadLead = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/leads/${id}`);
            setLead(data.lead);
            setStatus(data.lead.status);
            setFollowUpDate(toDateTimeLocalValue(data.lead.followUpDate));
            setResearchForm(mapResearchToForm(data.lead.research));
            setBasicForm({
                name: data.lead.name || '',
                brand: data.lead.brand || '',
                company_name: data.lead.companyName || '',
                email: data.lead.email || '',
                phone: data.lead.phone || '',
                city: data.lead.city || ''
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [api, id]);

    useEffect(() => {
        loadLead();
    }, [loadLead]);

    const handleStatusUpdate = async () => {
        try {
            await api.put(`/leads/${id}/status`, {
                status,
                rejection_reason: rejectionReason,
                notes
            });
            setNotes('');
            setRejectionReason('');
            loadLead();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleFollowUp = async () => {
        try {
            await api.put(`/leads/${id}/follow-up`, {
                follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null,
                notes
            });
            setNotes('');
            loadLead();
        } catch (err) {
            alert('Failed to update follow-up');
        }
    };

    const handleResearch = async () => {
        try {
            await api.post(`/leads/${id}/research`);
            loadLead();
        } catch (err) {
            alert('Failed to run research');
        }
    };

    const handleResearchField = (key, value) => {
        setResearchForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveResearch = async () => {
        setSavingResearch(true);
        try {
            await api.put(`/leads/${id}/research`, {
                ...researchForm,
                departments: researchForm.departments
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                technologies: researchForm.technologies
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean)
            });
            setEditingResearch(false);
            loadLead();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save company research');
        } finally {
            setSavingResearch(false);
        }
    };

    const handleGoToSales = () => {
        navigate(`/sales?leadId=${id}`);
    };

    const handleSaveBasic = async () => {
        setSavingBasic(true);
        try {
            await api.put(`/leads/${id}/basic`, {
                name: basicForm.name,
                brand: basicForm.brand,
                company_name: basicForm.company_name,
                email: basicForm.email,
                phone: basicForm.phone,
                city: basicForm.city
            });
            setEditingBasic(false);
            loadLead();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update lead details');
        } finally {
            setSavingBasic(false);
        }
    };

    const handleAddAddress = async () => {
        if (!addressForm.address.trim()) {
            alert('Address is required');
            return;
        }
        setSavingAddress(true);
        try {
            await api.post(`/leads/${id}/addresses`, addressForm);
            setAddressForm({ concern_person: '', mobile_no: '', address: '', pincode: '', address_type: 'Shipping' });
            loadLead();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add address');
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        const confirmDelete = window.confirm('Delete this address?');
        if (!confirmDelete) return;
        try {
            await api.delete(`/leads/${id}/addresses/${addressId}`);
            loadLead();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete address');
        }
    };

    const handleAddRemark = async () => {
        if (!remarkText.trim()) return;
        setSavingRemark(true);
        try {
            const { data } = await api.post(`/leads/${id}/remarks`, { note: remarkText.trim() });
            setLead(prev => ({ ...prev, remarks: [data.remark, ...(prev.remarks || [])] }));
            setRemarkText('');
            setRemarksOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add remark');
        } finally {
            setSavingRemark(false);
        }
    };

    const handleDeleteRemark = async (remarkId) => {
        setDeletingRemarkId(remarkId);
        try {
            await api.delete(`/leads/${id}/remarks/${remarkId}`);
            setLead(prev => ({ ...prev, remarks: (prev.remarks || []).filter(r => r.remarkId !== remarkId) }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete remark');
        } finally {
            setDeletingRemarkId(null);
        }
    };

    if (loading) return <div className="text-center py-12">Loading lead...</div>;
    if (!lead) return <div className="text-center py-12">Lead not found</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{lead.name}</h2>
                        <p className="text-gray-600">{lead.companyName || 'No company name'}</p>
                    </div>
                    <div className="flex gap-2">
                        {['admin', 'manager', 'sales'].includes(user?.role) && (
                            <button
                                onClick={() => setEditingBasic(prev => !prev)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg"
                            >
                                {editingBasic ? 'Cancel Edit' : 'Edit Lead'}
                            </button>
                        )}
                        <button onClick={loadLead} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
                {['admin', 'manager', 'sales'].includes(user?.role) && editingBasic && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div>
                            <label className="text-xs text-gray-500">Name</label>
                            <input
                                value={basicForm.name}
                                onChange={(e) => setBasicForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Brand</label>
                            <input
                                value={basicForm.brand}
                                onChange={(e) => setBasicForm(prev => ({ ...prev, brand: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Company Name</label>
                            <input
                                value={basicForm.company_name}
                                onChange={(e) => setBasicForm(prev => ({ ...prev, company_name: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Email</label>
                            <input
                                value={basicForm.email}
                                onChange={(e) => setBasicForm(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Phone</label>
                            <input
                                value={basicForm.phone}
                                onChange={(e) => setBasicForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">City</label>
                            <input
                                value={basicForm.city}
                                onChange={(e) => setBasicForm(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                onClick={handleSaveBasic}
                                disabled={savingBasic}
                                className="bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"
                            >
                                {savingBasic ? 'Saving...' : 'Save Lead Details'}
                            </button>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                        <div className="text-gray-500">Brand</div>
                        <div className="font-semibold">{lead.brand || '-'}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Email</div>
                        <div className="font-semibold">{lead.email || '-'}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Phone</div>
                        <div className="font-semibold">{lead.phone || '-'}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Assigned To</div>
                        <div className="font-semibold">{lead.assignedUser?.name || '-'}</div>
                    </div>
                </div>
                {lead.isDuplicate && (
                    <div className="mt-3 text-sm text-amber-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Marked as duplicate lead.
                    </div>
                )}
            </div>

            {/* Collapsible: Status Update, Follow-up, Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('status')}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                        <span className="font-semibold">Status Update</span>
                        {expandedSections.status ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </button>
                    {expandedSections.status && (
                        <div className="px-4 pb-4 space-y-3 border-t">
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {status === 'Rejected' && (
                                <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Rejection reason" className="w-full border rounded-lg px-3 py-2 text-sm" />
                            )}
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" />
                            <button onClick={handleStatusUpdate} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Update Status
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white border rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('followup')}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                        <span className="font-semibold">Follow-up</span>
                        {expandedSections.followup ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </button>
                    {expandedSections.followup && (
                        <div className="px-4 pb-4 space-y-3 border-t">
                            <input type="datetime-local" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                            <button onClick={handleFollowUp} className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-2">
                                <Calendar className="w-4 h-4" /> Set Follow-up
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white border rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('addresses')}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                        <span className="font-semibold">Addresses</span>
                        <span className="flex items-center gap-1">
                            {(lead.addresses || []).length > 0 && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{(lead.addresses || []).length}</span>}
                            {expandedSections.addresses ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                        </span>
                    </button>
                    {expandedSections.addresses && (
                        <div className="px-4 pb-4 space-y-3 border-t">
                            <div className="grid grid-cols-2 gap-2">
                                <input value={addressForm.concern_person} onChange={(e) => setAddressForm(prev => ({ ...prev, concern_person: e.target.value }))} placeholder="Concern Person" className="border rounded-lg px-3 py-2 text-sm" />
                                <input value={addressForm.mobile_no} onChange={(e) => setAddressForm(prev => ({ ...prev, mobile_no: e.target.value }))} placeholder="Mobile No" className="border rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <textarea value={addressForm.address} onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Address" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
                            <div className="flex gap-2">
                                <input value={addressForm.pincode} onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))} placeholder="Pincode" className="border rounded-lg px-3 py-2 text-sm flex-1" />
                                <select value={addressForm.address_type} onChange={(e) => setAddressForm(prev => ({ ...prev, address_type: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
                                    <option value="Billing">Billing</option>
                                    <option value="Shipping">Shipping</option>
                                </select>
                                <button onClick={handleAddAddress} disabled={savingAddress} className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">
                                    {savingAddress ? '...' : 'Add'}
                                </button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {(lead.addresses || []).map((row) => (
                                    <div key={row.address_id} className="border rounded-lg p-2 text-sm flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">{row.concern_person || 'Contact'}</div>
                                            <div className="text-gray-600 text-xs truncate">{row.address}</div>
                                        </div>
                                        <button onClick={() => handleDeleteAddress(row.address_id)} className="text-red-600 text-xs shrink-0">Delete</button>
                                    </div>
                                ))}
                                {(!lead.addresses || lead.addresses.length === 0) && <div className="text-sm text-gray-500">No addresses yet.</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Remarks section - always visible list */}
            <div className="bg-white border rounded-xl overflow-hidden">
                <button
                    onClick={() => toggleSection('remarks')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                    <span className="font-semibold">Remarks</span>
                    <span className="flex items-center gap-1">
                        {(lead.remarks || []).length > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{(lead.remarks || []).length}</span>}
                        {expandedSections.remarks ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </span>
                </button>
                {expandedSections.remarks && (
                    <div className="px-4 pb-4 border-t">
                        <div className="flex items-center justify-between mt-3 mb-2">
                            <span className="text-sm text-gray-500">Customer queries & notes</span>
                            <button onClick={() => setRemarksOpen(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                <MessageSquarePlus className="w-4 h-4" /> Add Remark
                            </button>
                        </div>
                        {(lead.remarks || []).length === 0 ? (
                            <div className="text-sm text-gray-500 py-2">No remarks yet. Click &quot;Add Remark&quot; to note customer queries.</div>
                        ) : (
                            <div className="space-y-2">
                                {(lead.remarks || []).map((r) => (
                                    <div key={r.remarkId} className="border rounded-lg p-3 text-sm flex justify-between gap-3 bg-amber-50/50">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-gray-800">{r.note}</div>
                                            <div className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleString()} {r.userName && `· ${r.userName}`}</div>
                                        </div>
                                        <button onClick={() => handleDeleteRemark(r.remarkId)} disabled={deletingRemarkId === r.remarkId} className="text-red-600 hover:text-red-700 shrink-0 p-1" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Remarks side panel - for adding new */}
            {remarksOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setRemarksOpen(false)} />
                    <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold">Add Remark</h3>
                            <button onClick={() => { setRemarksOpen(false); setRemarkText(''); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 flex-1 flex flex-col gap-3">
                            <textarea
                                value={remarkText}
                                onChange={(e) => setRemarkText(e.target.value)}
                                placeholder="Customer query or note..."
                                className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
                                rows={4}
                            />
                            <button
                                onClick={handleAddRemark}
                                disabled={savingRemark || !remarkText.trim()}
                                className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                {savingRemark ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                        <div className="p-4 border-t max-h-48 overflow-y-auto">
                            <div className="text-xs font-semibold text-gray-500 mb-2">Existing remarks</div>
                            {(lead.remarks || []).length === 0 ? (
                                <div className="text-sm text-gray-500">No remarks yet.</div>
                            ) : (
                                <div className="space-y-2">
                                    {(lead.remarks || []).map((r) => (
                                        <div key={r.remarkId} className="border rounded-lg p-2 text-sm flex justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-gray-700">{r.note}</div>
                                                <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()} {r.userName && `· ${r.userName}`}</div>
                                            </div>
                                            <button onClick={() => handleDeleteRemark(r.remarkId)} disabled={deletingRemarkId === r.remarkId} className="text-red-600 hover:text-red-700 shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold">Company Research</h3>
                    <div className="flex gap-2">
                        <button onClick={handleResearch} className="text-sm bg-gray-100 px-3 py-2 rounded-lg">
                            Run Research
                        </button>
                        <button
                            onClick={() => setEditingResearch(prev => !prev)}
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-lg"
                        >
                            {editingResearch ? 'Cancel Edit' : 'Edit Info'}
                        </button>
                    </div>
                </div>
                {editingResearch ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {Object.entries(researchForm).map(([key, value]) => (
                                <div key={key} className={key === 'summary' || key === 'address' ? 'md:col-span-2' : ''}>
                                    <label className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</label>
                                    {key === 'summary' || key === 'address' ? (
                                        <textarea
                                            value={value}
                                            onChange={(e) => handleResearchField(key, e.target.value)}
                                            rows={3}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    ) : (
                                        <input
                                            value={value}
                                            onChange={(e) => handleResearchField(key, e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleSaveResearch}
                            disabled={savingResearch}
                            className="bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"
                        >
                            {savingResearch ? 'Saving...' : 'Save Company Info'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-500">CIN:</span> {researchForm.cin || '-'}</div>
                        <div><span className="text-gray-500">Industry:</span> {researchForm.industry || '-'}</div>
                        <div><span className="text-gray-500">Pincode:</span> {researchForm.pincode || '-'}</div>
                        <div><span className="text-gray-500">Entity:</span> {researchForm.entity_type || '-'}</div>
                        <div><span className="text-gray-500">ROC:</span> {researchForm.roc || '-'}</div>
                        <div><span className="text-gray-500">Revenue:</span> {researchForm.revenue || '-'}</div>
                        <div><span className="text-gray-500">Employees:</span> {researchForm.employees || '-'}</div>
                        <div><span className="text-gray-500">GST:</span> {researchForm.gst || '-'}</div>
                        <div><span className="text-gray-500">Departments:</span> {researchForm.departments || '-'}</div>
                        <div><span className="text-gray-500">Website:</span> {researchForm.website || '-'}</div>
                        <div><span className="text-gray-500">LinkedIn:</span> {researchForm.linkedin_url || '-'}</div>
                        <div><span className="text-gray-500">Facebook:</span> {researchForm.facebook_url || '-'}</div>
                        <div><span className="text-gray-500">Twitter:</span> {researchForm.twitter_url || '-'}</div>
                        <div><span className="text-gray-500">Technologies:</span> {researchForm.technologies || '-'}</div>
                        <div><span className="text-gray-500">Annual Revenue:</span> {researchForm.annual_revenue || '-'}</div>
                        <div><span className="text-gray-500">Total Funding:</span> {researchForm.total_funding || '-'}</div>
                        <div><span className="text-gray-500">Latest Funding:</span> {researchForm.latest_funding || '-'}</div>
                        <div><span className="text-gray-500">Latest Funding Amount:</span> {researchForm.latest_funding_amount || '-'}</div>
                        <div><span className="text-gray-500">Subsidiary Of:</span> {researchForm.subsidiary_of || '-'}</div>
                        <div className="md:col-span-2"><span className="text-gray-500">Address:</span> {researchForm.address || '-'}</div>
                        <div><span className="text-gray-500">City:</span> {researchForm.city || '-'}</div>
                        <div><span className="text-gray-500">State:</span> {researchForm.state || '-'}</div>
                        <div className="md:col-span-2"><span className="text-gray-500">Summary:</span> {researchForm.summary || '-'}</div>
                    </div>
                )}
            </div>

            {lead.status === 'Deal' && (
                <div className="bg-white border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold">Create Order</h3>
                            <p className="text-sm text-gray-500">Proceed to Sales Order page to select inventory or create procurement.</p>
                        </div>
                        <button
                            onClick={handleGoToSales}
                            className="bg-green-600 text-white rounded-lg px-4 py-2 font-semibold"
                        >
                            Go to Sales
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold mb-3">Activities</h3>
                <div className="space-y-3">
                    {lead.activities?.map(activity => (
                        <div key={activity.activityId} className="border rounded-lg p-3 text-sm">
                            <div className="font-semibold">
                                {activity.action === 'status_updated'
                                    ? `Status_Updated : ${activity.statusTo || '-'}`
                                    : activity.action}
                            </div>
                            {activity.action === 'status_updated' && (
                                <>
                                    <div className="text-gray-600">Notes: {activity.notes || '-'}</div>
                                    <div className="text-gray-600">Updated by name: {activity.user?.name || '-'}</div>
                                </>
                            )}
                            {activity.action !== 'status_updated' && activity.notes && (
                                <div className="text-gray-600">{activity.notes}</div>
                            )}
                            <div className="text-xs text-gray-400">{new Date(activity.createdAt).toLocaleString()}</div>
                        </div>
                    ))}
                    {(!lead.activities || lead.activities.length === 0) && (
                        <div className="text-sm text-gray-500">No activity yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
