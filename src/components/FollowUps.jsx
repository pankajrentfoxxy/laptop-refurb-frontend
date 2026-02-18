import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FollowUps({ api }) {
    const navigate = useNavigate();
    const [today, setToday] = useState([]);
    const [overdue, setOverdue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifiedIds, setNotifiedIds] = useState([]);

    const loadFollowUps = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/leads/follow-ups');
            setToday(data.today || []);
            setOverdue(data.overdue || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        loadFollowUps();
    }, [loadFollowUps]);

    useEffect(() => {
        const allLeads = [...today, ...overdue];
        const upcoming = allLeads.filter((lead) => getFollowUpState(lead.followUpDate) === 'upcoming_10m');
        if (!upcoming.length || typeof window === 'undefined' || !('Notification' in window)) return;

        const sendNotifications = () => {
            const newIds = [];
            upcoming.forEach((lead) => {
                if (notifiedIds.includes(lead.leadId)) return;
                new Notification(`Follow-up in 10 minutes: ${lead.name}`, {
                    body: `${lead.companyName || 'No company'} - ${new Date(lead.followUpDate).toLocaleString()}`
                });
                newIds.push(lead.leadId);
            });
            if (newIds.length) {
                setNotifiedIds((prev) => [...prev, ...newIds]);
            }
        };

        if (Notification.permission === 'granted') {
            sendNotifications();
            return;
        }
        if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') sendNotifications();
            });
        }
    }, [today, overdue, notifiedIds]);

    if (loading) return <div className="text-center py-12">Loading follow-ups...</div>;

    const getFollowUpState = (followUpDate) => {
        if (!followUpDate) return 'normal';
        const now = new Date();
        const due = new Date(followUpDate);
        const diff = due.getTime() - now.getTime();
        if (diff < 0) return 'overdue';
        if (diff <= 10 * 60 * 1000) return 'upcoming_10m';
        return 'normal';
    };

    const renderTable = (items) => (
        <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                    <tr>
                        <th className="p-3 text-left">Lead</th>
                        <th className="p-3 text-left">Company</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Assignee</th>
                        <th className="p-3 text-left">Follow-up</th>
                        <th className="p-3 text-left">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(lead => (
                        <tr
                            key={lead.leadId}
                            className={`border-t hover:bg-gray-50 ${
                                getFollowUpState(lead.followUpDate) === 'overdue'
                                    ? 'bg-red-50'
                                    : getFollowUpState(lead.followUpDate) === 'upcoming_10m'
                                        ? 'bg-green-50'
                                        : ''
                            }`}
                        >
                            <td className="p-2 font-semibold">{lead.name}</td>
                            <td className="p-2">{lead.companyName || '-'}</td>
                            <td className="p-2">
                                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                                    {lead.status}
                                </span>
                            </td>
                            <td className="p-2">{lead.assignedUser?.name || '-'}</td>
                            <td className="p-2">
                                {lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : '-'}
                                {getFollowUpState(lead.followUpDate) === 'upcoming_10m' && (
                                    <div className="text-[11px] text-green-700 font-semibold">Due in next 10 min</div>
                                )}
                                {getFollowUpState(lead.followUpDate) === 'overdue' && (
                                    <div className="text-[11px] text-red-700 font-semibold">Overdue</div>
                                )}
                            </td>
                            <td className="p-2">
                                <button
                                    onClick={() => navigate(`/leads/${lead.leadId}`)}
                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    Update
                                </button>
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan="6" className="p-6 text-center text-gray-500">
                                No follow-ups found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="text-blue-600" />
                    Follow-ups
                </h2>
                <p className="text-gray-600">Today and overdue follow-ups</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-xl p-6">
                    <h3 className="font-bold mb-4">Today</h3>
                    {renderTable(today)}
                </div>

                <div className="bg-white border rounded-xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="w-4 h-4" /> Overdue
                    </h3>
                    {renderTable(overdue)}
                </div>
            </div>
        </div>
    );
}
