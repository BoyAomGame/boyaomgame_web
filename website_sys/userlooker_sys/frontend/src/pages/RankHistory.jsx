import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RankTimeline from '../components/RankTimeline';
import Skeleton from '../components/Skeleton';
import Footer from '../components/Footer';
import './RankHistory.css';

import { API_URL } from '../config';

import { useAuth } from '../context/AuthContext';

function RankHistory() {
    const { username } = useParams();
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRankHistory();
    }, [username, token]);

    const fetchRankHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/user/roblox/${username}/rank-history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('No rank history found for this user');
                }
                throw new Error('Failed to fetch rank history');
            }

            const result = await response.json();
            setData(result);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rank-history-page">
            <div className="rank-history-container">
                <div className="rank-history-header">
                    <Link to={`/result/${username}`} className="back-link">
                        ← Back to Profile
                    </Link>
                    <h1>Rank History</h1>
                    <p className="username">{username}</p>
                </div>

                {loading ? (
                    <div className="skeleton-container">
                        <Skeleton height={60} />
                        <Skeleton height={80} />
                        <Skeleton height={80} />
                        <Skeleton height={80} />
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <span className="error-icon">⚠️</span>
                        <h2>No Rank History</h2>
                        <p>{error}</p>
                        <Link to={`/result/${username}`} className="back-button">
                            Back to Profile
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="current-rank-card">
                            <div className="current-rank-label">Current Rank</div>
                            <div className="current-rank-value">{data.current_rank || 'Unknown'}</div>
                            <div className="total-changes">{data.total_changes} rank changes recorded</div>
                        </div>

                        <RankTimeline history={data.history} />
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default RankHistory;
