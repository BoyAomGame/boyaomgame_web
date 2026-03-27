import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';
import Footer from '../components/Footer';
import './AuditLogs.css';

import { API_URL } from '../config';

const EVENT_TYPES = [
    { value: '', label: 'All Events' },
    { value: 'auth', label: 'Authentication' },
    { value: 'access', label: 'Data Access' },
    { value: 'modify', label: 'Modifications' },
    { value: 'system', label: 'System' }
];

function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    // Force UTC parsing
    const dateStr = timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`;
    const date = new Date(dateStr);
    return date.toLocaleString();
}

function getEventTypeColor(type) {
    switch (type) {
        case 'auth': return '#22c55e';
        case 'access': return '#3b82f6';
        case 'modify': return '#f59e0b';
        case 'system': return '#ef4444';
        default: return '#6b7280';
    }
}

function AuditLogs() {
    const { token } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    // Filters
    const [eventType, setEventType] = useState('');
    const [actor, setActor] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [token, eventType, actor, page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', 25);
            if (eventType) params.append('event_type', eventType);
            if (actor) params.append('actor', actor);

            const response = await fetch(`${API_URL}/admin/audit-logs?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch audit logs');

            const data = await response.json();
            setLogs(data.data || []);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = () => {
        setPage(1);
    };

    return (
        <div className="audit-logs-page">
            <div className="audit-logs-container">
                <div className="audit-header">
                    <div className="header-top">
                        <Link to="/admin/dashboard" className="back-btn">← Back to Dashboard</Link>
                        <h1>Audit Logs</h1>
                    </div>
                </div>

                {/* Filters */}
                <div className="audit-filters">
                    <select
                        value={eventType}
                        onChange={(e) => { setEventType(e.target.value); handleFilterChange(); }}
                        className="filter-select"
                    >
                        {EVENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Filter by actor..."
                        value={actor}
                        onChange={(e) => setActor(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                        className="filter-input"
                    />

                    <button onClick={fetchLogs} className="filter-btn">
                        🔄 Refresh
                    </button>
                </div>

                {/* Logs Table */}
                {loading ? (
                    <div className="logs-loading">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} height={60} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="logs-error">
                        <p>{error}</p>
                        <button onClick={fetchLogs}>Retry</button>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="logs-empty">
                        <p>No audit logs found</p>
                    </div>
                ) : (
                    <div className="logs-table">
                        <div className="logs-header-row">
                            <div className="col-type">Type</div>
                            <div className="col-action">Action</div>
                            <div className="col-actor">Actor</div>
                            <div className="col-timestamp">Timestamp</div>
                            <div className="col-status">Status</div>
                        </div>

                        {logs.map((log, index) => (
                            <div key={log._id || index} className="log-row">
                                <div className="col-type">
                                    <span
                                        className="event-badge"
                                        style={{ background: getEventTypeColor(log.event_type) }}
                                    >
                                        {log.event_type}
                                    </span>
                                </div>
                                <div className="col-action">
                                    <span className="action-text">{log.action}</span>
                                    {log.target && (
                                        <span className="target-text">{log.target}</span>
                                    )}
                                </div>
                                <div className="col-actor">
                                    <span className="actor-text">{log.actor}</span>
                                    {log.ip_address && (
                                        <span className="ip-text">{log.ip_address}</span>
                                    )}
                                </div>
                                <div className="col-timestamp">
                                    {formatTimestamp(log.timestamp)}
                                </div>
                                <div className="col-status">
                                    <span className={`status-badge ${log.success ? 'success' : 'error'}`}>
                                        {log.success ? '✓' : '✗'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                    <div className="pagination">
                        <button
                            disabled={!pagination.has_prev}
                            onClick={() => setPage(p => p - 1)}
                        >
                            ← Previous
                        </button>
                        <span className="page-info">
                            Page {pagination.page} of {pagination.total_pages}
                        </span>
                        <button
                            disabled={!pagination.has_next}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default AuditLogs;
