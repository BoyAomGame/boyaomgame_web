import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';
import Footer from '../components/Footer';
import './AdminDashboard.css';

import { API_URL } from '../config';

function AdminDashboard() {
    const { token, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, [token]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/admin/statistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard-page">
                <div className="admin-container">
                    <h1>Admin Dashboard</h1>
                    <div className="stats-grid">
                        <Skeleton height={120} />
                        <Skeleton height={120} />
                        <Skeleton height={120} />
                        <Skeleton height={120} />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard-page error">
                <div className="admin-container">
                    <h1>Admin Dashboard</h1>
                    <div className="error-message">
                        <p>Error: {error}</p>
                        <button onClick={fetchStats}>Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-page">
            <div className="admin-container">
                <div className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <div className="admin-user-info">
                        Logged in as {user?.username} (Admin)
                    </div>
                </div>

                <div className="admin-actions">
                    <Link to="/admin/audit-logs" className="action-card">
                        <span className="icon">📋</span>
                        <h3>Audit Logs</h3>
                        <p>View system events and user actions</p>
                    </Link>
                    <Link to="/admin/notes" className="action-card">
                        <span className="icon">📝</span> {/* Added an icon for Admin Notes */}
                        <h3>Admin Notes</h3>
                        <p>Manage user tags (VIP, Admin, etc)</p>
                    </Link>
                    <Link to="/dashboard" className="action-card secondary">
                        <span className="icon">🔍</span>
                        <h3>User Search</h3>
                        <p>Go to main search dashboard</p>
                    </Link>
                </div>

                <h2>System Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <p className="stat-value">{stats.total_users?.toLocaleString()}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Known Users</h3>
                        <p className="stat-value">{stats.known_users?.toLocaleString()}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Messages</h3>
                        <p className="stat-value">{stats.total_messages?.toLocaleString()}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Indexed Guilds</h3>
                        <p className="stat-value">{stats.total_guilds?.toLocaleString()}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Rank Changes</h3>
                        <p className="stat-value">{stats.rank_changes?.toLocaleString()}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Sessions</h3>
                        <p className="stat-value">{stats.active_sessions?.toLocaleString()}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Unknown Users</h3>
                        <p className="stat-value">{stats.unknown_users?.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default AdminDashboard;
