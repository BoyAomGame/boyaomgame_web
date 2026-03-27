import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Skeleton from './Skeleton';
import './GuildActivity.css';

import { API_URL } from '../config';

const COLORS = ['#667eea', '#764ba2', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];

import { useAuth } from '../context/AuthContext';

function GuildActivity({ discordId }) {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (discordId) {
            fetchGuilds();
        }
    }, [discordId, token]);

    const fetchGuilds = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/user/discord/${discordId}/guilds`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch guild data');
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

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="guild-tooltip">
                    <p className="tooltip-name">{item.guild_name}</p>
                    <p className="tooltip-value">{item.message_count.toLocaleString()} messages</p>
                    <p className="tooltip-percent">{item.percentage}%</p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="guild-activity">
                <Skeleton width={150} height={24} />
                <div className="guild-loading">
                    <Skeleton width={200} height={200} borderRadius="50%" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return null; // Silently fail if no guild data
    }

    const chartData = data.guilds.map((guild, index) => ({
        ...guild,
        name: guild.guild_name,
        value: guild.message_count,
        color: COLORS[index % COLORS.length]
    }));

    return (
        <div className="guild-activity">
            <div className="guild-header">
                <h3>Guild Activity</h3>
                <span className="guild-count">{data.total_guilds} guilds</span>
            </div>

            <div className="guild-content">
                <div className="guild-chart">
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="guild-list">
                    {chartData.slice(0, 5).map((guild, index) => (
                        <div key={index} className="guild-item">
                            <div
                                className="guild-color"
                                style={{ background: guild.color }}
                            />
                            <div className="guild-info">
                                <span className="guild-name">{guild.guild_name}</span>
                                <span className="guild-stats">
                                    {guild.message_count.toLocaleString()} ({guild.percentage}%)
                                </span>
                            </div>
                        </div>
                    ))}
                    {data.total_guilds > 5 && (
                        <div className="guild-more">
                            +{data.total_guilds - 5} more guilds
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GuildActivity;
