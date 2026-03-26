import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';
import ThemeToggle from './ThemeToggle';
import Skeleton, { ProfileSkeleton, CardSkeleton } from './Skeleton';
import ActivityChart from './ActivityChart';
import GuildActivity from './GuildActivity';
import MessageViewer from './MessageViewer';
import ActivityHeatmap from './ActivityHeatmap';
import { API_URL } from '../config';
import './Result.css';

const Result = () => {
    const { userId } = useParams();
    const { token } = useAuth();
    const [searchParams] = useSearchParams();
    const searchType = searchParams.get('type') || 'roblox';

    const [userData, setUserData] = useState(null);
    const [userType, setUserType] = useState(null); // 'known' or 'unknown'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [primaryDiscordId, setPrimaryDiscordId] = useState(null);
    const [adminNotes, setAdminNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);

    const fetchData = useCallback(async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
            }

            // Choose endpoint based on search type
            const endpoint = searchType === 'discord'
                ? `${API_URL}/user/discord/${userId}`
                : `${API_URL}/user/roblox/${userId}`;

            const response = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Handle response structure
            if (response.data.type) {
                setUserType(response.data.type);
                setUserData(response.data.data);
            } else {
                setUserData(response.data);
            }

            // Get primary Discord ID for charts
            if (searchType === 'discord') {
                setPrimaryDiscordId(userId);
            } else if (response.data.DiscordAccounts?.length > 0) {
                setPrimaryDiscordId(response.data.DiscordAccounts[0].DiscordUserId);
            } else if (response.data.data?.DiscordAccounts?.length > 0) {
                setPrimaryDiscordId(response.data.data.DiscordAccounts[0].DiscordUserId);
            }

            // Fetch Admin Notes (Tags)
            try {
                const rUsername = response.data.RobloxUsername || response.data.roblox_username || (response.data.data && response.data.data.RobloxUsername);
                if (rUsername) {
                    const notesRes = await axios.get(`${API_URL}/admin/notes/user/${rUsername}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setAdminNotes(notesRes.data);
                }
            } catch (ignore) {
                // Ignore errors here, notes are optional
                console.log("Failed to fetch notes", ignore);
            }

            setLastUpdated(new Date());
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch user data:", err);
            setError("User not found or unavailable.");
            setLoading(false);
        } finally {
            setIsRefreshing(false);
        }
    }, [userId, searchType, token]);

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [userId, fetchData]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (userId && !loading && !error) {
                fetchData();
            }
        }, 30000);
        return () => clearInterval(intervalId);
    }, [userId, loading, error, fetchData]);

    const handleRefresh = () => {
        fetchData(true);
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        // Ensure string is treated as UTC if valid ISO but missing timezone
        const dateStr = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
        const date = new Date(dateStr);
        return date.toLocaleString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Loading state with skeletons
    if (loading) return (
        <div className="result-page">
            <div className="result-container">
                <div className="result-header">
                    <Skeleton width={200} height={32} />
                    <Skeleton width={100} height={40} />
                </div>
                <div className="result-card">
                    <ProfileSkeleton />
                    <div className="stats-grid">
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                    </div>
                </div>
                <div className="result-card">
                    <CardSkeleton />
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="result-page">
            <div className="error-container">
                <h2 className="error-title">{error}</h2>
                <Link to="/" className="back-link">← Go Back</Link>
            </div>
        </div>
    );

    const robloxUsername = userData?.RobloxUsername || userData?.roblox_username || userId;

    return (
        <div className="result-page">
            {/* Top controls */}
            <div className="top-controls">
                <ThemeToggle />
            </div>

            <div className="result-container">
                {/* Header */}
                <div className="result-header">
                    <h1>User Details</h1>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="refresh-btn"
                    >
                        <span className={isRefreshing ? 'spinning' : ''}>⟳</span>
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {lastUpdated && (
                    <p className="last-updated">
                        Last updated: {lastUpdated.toLocaleTimeString()} (auto-refreshes every 30s)
                    </p>
                )}

                {/* User Type Badge */}
                {userType && (
                    <div className={`user-type-badge ${userType}`}>
                        {userType === 'known' ? '✓ Known User' : '? Unknown User'}
                    </div>
                )}

                {/* Main Card */}
                <div className="result-card">
                    <div className="username-section">
                        <label>Roblox Username</label>
                        <p className="username">{robloxUsername}</p>

                        {/* Admin Notes / Tags */}
                        {adminNotes.length > 0 && (
                            <div className="admin-notes-section">
                                {adminNotes.map(note => (
                                    <div
                                        key={note.note_name}
                                        className={`admin-note-badge ${selectedNote?.note_name === note.note_name ? 'active' : ''}`}
                                        onClick={() => setSelectedNote(selectedNote === note ? null : note)}
                                    >
                                        <span className="note-icon">{note.note_emoji || '🛡️'}</span>
                                        <span className="note-name">{note.note_name}</span>

                                        {/* Click Popover */}
                                        {selectedNote?.note_name === note.note_name && (
                                            <div className="note-popover">
                                                {note.note_description}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Associated Roblox Accounts (For Discord Search) */}
                    {userData.associated_roblox_users && userData.associated_roblox_users.length > 0 && (
                        <div className="associated-accounts-section">
                            <label className="section-label">Associated Roblox Accounts</label>
                            <div className="accounts-grid">
                                {userData.associated_roblox_users.map((account, index) => (
                                    <div key={index} className="account-mini-card">
                                        <div className="mini-card-header">
                                            <span className="mini-username">{account.username}</span>
                                            <Link
                                                to={`/result/${account.username}`}
                                                className="view-link"
                                            >
                                                View →
                                            </Link>
                                        </div>
                                        <div className="mini-stats">
                                            <span>msg: {account.data.TotalMsg || 0}</span>
                                            <span>guilds: {account.data.GuildCount || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="stats-grid">
                        <div className="stat-item">
                            <label>First Message</label>
                            <p>{formatDate(userData.FirstMsgFound)}</p>
                        </div>
                        <div className="stat-item">
                            <label>Last Message</label>
                            <p>{formatDate(userData.LastMsgFound)}</p>
                        </div>
                        <div className="stat-item">
                            <label>Total Messages</label>
                            <p className="stat-value blue">
                                {userData.TotalMsg?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div className="stat-item">
                            <label>Guild Count</label>
                            <p className="stat-value purple">
                                {userData.GuildCount || 0}
                            </p>
                        </div>
                    </div>



                </div>

                {/* Discord Accounts Card */}
                <div className="result-card">
                    <label className="section-label">
                        Discord Accounts ({userData.DiscordAccounts?.length || 0})
                    </label>

                    {userData.DiscordAccounts && userData.DiscordAccounts.length > 0 ? (
                        <ul className="discord-list">
                            {userData.DiscordAccounts.map((account, index) => (
                                <li key={index} className="discord-item">
                                    <span className="discord-username">
                                        {account.DiscordUsername}
                                    </span>
                                    <span className="discord-id">
                                        {account.DiscordUserId}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-data">No Discord accounts linked</p>
                    )}
                </div>

                {/* Activity Charts Section */}
                {primaryDiscordId && (
                    <div className="charts-section">
                        <div className="charts-grid">
                            <ActivityChart discordId={primaryDiscordId} />
                            <GuildActivity discordId={primaryDiscordId} />
                        </div>

                        {/* Heatmap Row */}
                        <ActivityHeatmap discordId={primaryDiscordId} />

                        <MessageViewer discordId={primaryDiscordId} limit={25} />
                    </div>
                )}

                {/* Back Button */}
                <div className="back-section">
                    <Link to="/dashboard">
                        <button className="back-btn">← Search Another User</button>
                    </Link>
                </div>
            </div>
            <Footer />
        </div >
    );
};

export default Result;
