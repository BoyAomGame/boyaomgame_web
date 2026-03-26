import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import Skeleton from './Skeleton';
import './ActivityChart.css';

import { API_URL } from '../config';

const PERIOD_OPTIONS = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' }
];

import { useAuth } from '../context/AuthContext';

function ActivityChart({ discordId }) {
    const { token } = useAuth();
    const [data, setData] = useState([]);
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalMessages, setTotalMessages] = useState(0);

    useEffect(() => {
        if (discordId) {
            fetchActivity();
        }
    }, [discordId, period, token]);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_URL}/user/discord/${discordId}/activity?period=${period}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch activity data');
            }

            const result = await response.json();

            // Format data for chart
            const chartData = result.data.map(item => ({
                date: item.date,
                count: item.count,
                displayDate: formatDate(item.date)
            }));

            setData(chartData);
            setTotalMessages(result.total_messages);
            setError(null);
        } catch (err) {
            setError(err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip">
                    <p className="tooltip-date">{label}</p>
                    <p className="tooltip-value">{payload[0].value} messages</p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="activity-chart">
                <div className="chart-header">
                    <Skeleton width={150} height={24} />
                    <Skeleton width={200} height={32} />
                </div>
                <Skeleton height={250} borderRadius={12} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="activity-chart error">
                <p>Unable to load activity data</p>
            </div>
        );
    }

    return (
        <div className="activity-chart">
            <div className="chart-header">
                <div className="chart-title">
                    <h3>Message Activity</h3>
                    <span className="total-count">{totalMessages.toLocaleString()} total</span>
                </div>

                <div className="period-selector">
                    {PERIOD_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            className={`period-btn ${period === opt.value ? 'active' : ''}`}
                            onClick={() => setPeriod(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {data.length === 0 ? (
                <div className="no-data">
                    <p>No activity data for this period</p>
                </div>
            ) : (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.1)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="displayDate"
                                stroke="rgba(255,255,255,0.5)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.5)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#667eea"
                                strokeWidth={2}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default ActivityChart;
