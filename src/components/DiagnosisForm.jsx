import React, { useState, useEffect } from 'react';
import {
    CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp,
    Cpu, Monitor, Keyboard, Battery, HardDrive, MemoryStick,
    Wifi, Usb, Fan, CircuitBoard, Lock,
    Loader2, Package, Wrench, Upload, MapPin, Scan
} from 'lucide-react';

const SECTION_ICONS = {
    'Power & Boot': Cpu,
    'Display': Monitor,
    'Keyboard & Touchpad': Keyboard,
    'Battery & Charging': Battery,
    'Storage': HardDrive,
    'RAM': MemoryStick,
    'Network': Wifi,
    'Ports': Usb,
    'Thermal': Fan,
    'Motherboard': CircuitBoard,
    'Security & Locks': Lock
};

// Checkbox component
function DiagnosisCheckbox({ label, value, onChange, disabled }) {
    const getIcon = () => {
        if (value === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (value === false) return <XCircle className="w-5 h-5 text-red-500" />;
        return <MinusCircle className="w-5 h-5 text-gray-300" />;
    };

    const cycleValue = () => {
        if (disabled) return;
        if (value === null || value === undefined) onChange(true); // Neutral -> Good
        else if (value === true) onChange(false); // Good -> Bad
        else onChange(null); // Bad -> Neutral
    };

    return (
        <div
            onClick={cycleValue}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${disabled ? 'opacity-80 cursor-default bg-gray-50' :
                'cursor-pointer ' + (value === true ? 'bg-green-50 border border-green-200' :
                    value === false ? 'bg-red-50 border border-red-200' :
                        'bg-gray-50 border border-gray-200 hover:bg-gray-100')
                }`}
        >
            {getIcon()}
            <span className={`font-medium ${value === false ? 'text-red-700' : 'text-gray-700'}`}>
                {label}
            </span>
        </div>
    );
}

// Collapsible Section with Part Selection
function DiagnosisSection({ name, fields, labels, data, onChange, disabled, groupedParts, selectedParts, onTogglePart }) {
    const [expanded, setExpanded] = useState(true);
    const Icon = SECTION_ICONS[name] || Cpu;

    // Determine failures
    const failures = fields.filter(f => data[f] === false);
    const hasFailures = failures.length > 0;

    // Filter parts relevant to this section
    const SECTION_TO_CATEGORIES = {
        'Display': ['Display', 'Camera', 'Cables'],
        'Battery & Charging': ['Power', 'Core', 'Cables'],
        'Keyboard & Touchpad': ['Input', 'Cables'],
        'Storage': ['Storage'],
        'RAM': ['Memory'],
        'Thermal': ['Cooling', 'Accessories'],
        'Network': ['Networking'],
        'Ports': ['Ports', 'Audio', 'Legacy', 'Indicators'],
        'Motherboard': ['Core', 'Chassis', 'Indicators'],
        'Security & Locks': ['Security'],
        'Power & Boot': ['Core', 'Power']
    };

    const targetCategories = SECTION_TO_CATEGORIES[name] || ['Core', 'Accessories'];
    const availableParts = targetCategories.flatMap(cat => groupedParts[cat] || []);

    return (
        <div className={`rounded-xl border ${hasFailures ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'} overflow-hidden`}>
            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                className={`flex items-center gap-3 p-4 cursor-pointer ${hasFailures ? 'bg-red-100/50' : 'bg-gray-50'}`}
            >
                <Icon className={`w-5 h-5 ${hasFailures ? 'text-red-500' : 'text-blue-600'}`} />
                <span className="font-bold text-gray-800">{name}</span>
                <div className="ml-auto flex items-center gap-3">
                    {hasFailures && <span className="text-red-600 text-xs font-bold">{failures.length} Issue(s)</span>}
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {expanded && (
                <div className="p-4">
                    {/* Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {fields.map(field => (
                            <DiagnosisCheckbox
                                key={field}
                                label={labels[field]}
                                value={data[field]}
                                onChange={(val) => onChange(field, val)}
                                disabled={disabled}
                            />
                        ))}
                    </div>

                    {/* Part Selector - Show if failures exist and not ReadOnly */}
                    {hasFailures && !disabled && (
                        <div className="mt-4 p-4 bg-white border border-red-200 rounded-lg shadow-sm">
                            <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                                <Wrench className="w-4 h-4" />
                                Select Required Parts (Optional)
                            </h4>
                            {availableParts.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No parts found. Searched: {targetCategories.join(', ')}</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {availableParts.map(part => {
                                        const isSelected = selectedParts.some(p => p.part_id === part.part_id);
                                        return (
                                            <div
                                                key={part.part_id}
                                                onClick={() => onTogglePart(part)}
                                                className={`p-2 border rounded-md text-sm cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 border-blue-300 text-blue-700' : 'hover:bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <span>{part.part_name}</span>
                                                {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Parts Assignment (Procurement View) & Summary
function PartsManager({ parts, readOnly, isProcurementStage, onAssign, ticketId }) {
    const [scanValues, setScanValues] = useState({});

    // If no parts
    if (!parts || parts.length === 0) return null;

    const handleAssignClick = (partId) => {
        const val = scanValues[partId];
        if (!val) return alert('Please enter Barcode or Location');
        onAssign(partId, val);
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-800">Parts Required ({parts.length})</h3>
            </div>

            <div className="space-y-3">
                {parts.map((part, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Part Info */}
                            <div className="flex items-center gap-3">
                                <Wrench className="w-5 h-5 text-amber-600" />
                                <div>
                                    <div className="font-bold text-gray-800">{part.catalog_part_name || part.part_name}</div>
                                    <div className="text-xs text-gray-500">Category: {part.part_category}</div>
                                </div>
                            </div>

                            {/* Actions / Status */}
                            <div className="flex items-center gap-3">
                                {/* Status Badge */}
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${part.status === 'Assigned' ? 'bg-green-100 text-green-700' :
                                    part.status === 'Pending Assignment' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {part.status}
                                </span>

                                {/* Assigned Location Display */}
                                {part.location_scan_value && (
                                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-700">
                                        <MapPin className="w-3 h-3 text-gray-500" />
                                        {part.location_scan_value}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Procurement Action: Scan/Assign */}
                        {isProcurementStage && part.status !== 'Assigned' && (
                            <div className="mt-4 pt-4 border-t flex gap-2">
                                <div className="relative flex-1">
                                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Scan Barcode / Enter Location ID"
                                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        value={scanValues[part.id] || ''}
                                        onChange={e => setScanValues({ ...scanValues, [part.id]: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={() => handleAssignClick(part.id)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                                >
                                    Assign Part
                                </button>
                            </div>
                        )}

                        {/* Assembly View: Picked Confirmation? (Maybe later) */}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main Diagnosis Form
export default function DiagnosisForm({ api, ticket, onClose, onComplete, readOnly = false }) {
    const [sections, setSections] = useState({});
    const [data, setData] = useState({});
    const [groupedParts, setGroupedParts] = useState({});
    const [selectedParts, setSelectedParts] = useState([]); // Array of part objects
    const [existingParts, setExistingParts] = useState([]); // Fetched from backend

    // Images & Remarks
    const [images, setImages] = useState([]);
    const [remarks, setRemarks] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadData = React.useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Sections & Diagnosis
            const { data: diagRes } = await api.get(`/diagnosis/ticket/${ticket.ticket_id}`);
            setSections(diagRes.sections || {});

            if (diagRes.diagnosis) {
                const existingData = {};
                Object.keys(diagRes.sections).forEach(sectionKey => {
                    diagRes.sections[sectionKey].fields.forEach(field => {
                        existingData[field] = diagRes.diagnosis[field];
                    });
                });
                setData(existingData);
                setRemarks(diagRes.diagnosis.remarks || '');
            }
            if (diagRes.parts) setExistingParts(diagRes.parts);
            if (diagRes.images) setImages(diagRes.images);

            // Fetch Grouped Parts (only if editable)
            if (!readOnly) {
                const { data: partRes } = await api.get('/parts/grouped');
                setGroupedParts(partRes.parts || {});
            }

        } catch (e) {
            console.error('Failed to load:', e);
            alert('Error loading data: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    }, [api, ticket.ticket_id, readOnly]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFieldChange = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleTogglePart = (part) => {
        setSelectedParts(prev => {
            const exists = prev.find(p => p.part_id === part.part_id);
            if (exists) return prev.filter(p => p.part_id !== part.part_id);
            return [...prev, part];
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/diagnosis/ticket/${ticket.ticket_id}`, { ...data, remarks });
            alert('Saved Draft!');
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleSubmit = async () => {
        if (!window.confirm('Submit Diagnosis? This will route to Procurement if parts are selected.')) return;
        setSubmitting(true);
        try {
            const payload = {
                diagnosisData: data,
                remarks,
                selectedParts: selectedParts.map(p => ({
                    part_id: p.part_id,
                    part_name: p.part_name,
                    part_type: p.part_type
                }))
            };

            await api.post(`/diagnosis/ticket/${ticket.ticket_id}/submit`, payload);
            alert('Diagnosis Submitted!');
            if (onComplete) onComplete();
        } catch (e) {
            alert('Error: ' + (e.response?.data?.message || e.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Procurement Assign
    const handleProcurementAssign = async (diagPartId, scanValue) => {
        if (!window.confirm(`Confirm assignment: ${scanValue}?`)) return;
        try {
            await api.post(`/diagnosis/ticket/${ticket.ticket_id}/parts/assign-procurement`, {
                diagnosis_part_id: diagPartId,
                barcode_or_location: scanValue
            });
            // alert('Part Assigned!'); // Removed to prevent focus jump
            loadData(); // Reload to see status update

            // Note: If all assigned, maybe auto-refresh ticket details to show stage change?
            // The user must manually refresh or we trigger onComplete in parent.
            if (onComplete) onComplete();
        } catch (e) {
            alert('Failed to assign: ' + e.message);
        }
    };

    const isProcurementStage = ticket.stage_name === 'Procurement';

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6">
                <div>
                    <h2 className="text-2xl font-bold">Laptop Diagnosis</h2>
                    <p className="text-blue-100">{ticket.brand} {ticket.model} | {ticket.serial_number}</p>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {Object.entries(sections).map(([key, section]) => (
                    <DiagnosisSection
                        key={key}
                        name={section.name}
                        fields={section.fields}
                        labels={section.labels}
                        data={data}
                        onChange={handleFieldChange}
                        disabled={readOnly}
                        groupedParts={groupedParts}
                        selectedParts={selectedParts}
                        onTogglePart={handleTogglePart}
                    />
                ))}
            </div>

            {/* Display Selected Parts for Review (Draft Mode) */}
            {!readOnly && selectedParts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <h3 className="font-bold text-blue-800 mb-2">Parts to Request ({selectedParts.length})</h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedParts.map(p => (
                            <span key={p.part_id} className="bg-white border px-2 py-1 rounded text-sm font-medium text-gray-700">
                                {p.part_name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Existing Parts (Already Submitted) */}
            <PartsManager
                parts={existingParts}
                readOnly={readOnly}
                isProcurementStage={isProcurementStage}
                onAssign={handleProcurementAssign}
                ticketId={ticket.ticket_id}
            />

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Remarks</label>
                <textarea
                    className="w-full border rounded-lg p-3"
                    rows="3"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    disabled={readOnly}
                />

                {/* Image Upload (Optional) */}
                <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Reference Images (Optional)</label>
                    {/* Simplified Image Uploader reusing prev logic logic or just basic input */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {images.map((img, i) => (
                            <img key={i} src={`${process.env.REACT_APP_API_URL}/${img.image_path}`} alt={`Diagnosis ref ${i}`} className="h-20 w-20 object-cover rounded border" />
                        ))}
                        {!readOnly && (
                            <label className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
                                <Upload className="w-6 h-6 text-gray-400" />
                                <input type="file" className="hidden" onChange={async (e) => {
                                    if (e.target.files[0]) {
                                        const fd = new FormData(); fd.append('image', e.target.files[0]);
                                        await api.post(`/diagnosis/ticket/${ticket.ticket_id}/images`, fd);
                                        loadData();
                                    }
                                }} />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {!readOnly && (
                <div className="flex gap-3 sticky bottom-0 bg-white/90 backdrop-blur-sm p-4 border-t z-10">
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-3 border rounded-xl font-bold">Save Draft</button>
                    <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Submit</button>
                </div>
            )}
        </div>
    );
}
