import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';
import Skeleton from './Skeleton';
import './ActivityHeatmap.css';

import { API_URL } from '../config';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 12 }, (_, i) => `${i * 2}h`); // 0, 2, 4...

function ActivityHeatmap({ discordId }) {
    const { token } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (discordId) {
            fetchData();
        }
    }, [discordId, token]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/user/discord/${discordId}/analytics/heatmap`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load heatmap');

            const result = await response.json();

            // Convert UTC data to Local Time
            const rawData = result.data || [];
            const localData = rawData.map(item => {
                // item.day (0-6 Mon-Sun), item.hour (0-23) in UTC
                // We need to shift based on local offset.
                // JS Day 0 is Sunday, 1 is Monday.
                // Our Backend Day 0 is Monday, 6 is Sunday.
                // Let's normalize backend day to JS day first (0->1, 6->0) for easier date math? 
                // OR just do pure math.

                // Construct a fake UTC date derived from the slot
                // We start with a known Monday: e.g. Jan 1 2001 was a Monday.
                // Day offset = item.day days. Hour offset = item.hour
                const base = new Date('2001-01-01T00:00:00Z'); // Monday
                base.setUTCDate(base.getUTCDate() + item.day);
                base.setUTCHours(item.hour);

                // Now read components in Local
                // JS getDay(): 0=Sun, 1=Mon...6=Sat.
                // Backend: 0=Mon...6=Sun.
                const localDayJS = base.getDay();
                // Convert JS Day back to Backend Day format (Mon=0)
                const localDayBackend = localDayJS === 0 ? 6 : localDayJS - 1;

                const localHour = base.getHours();

                return {
                    day: localDayBackend,
                    hour: localHour,
                    value: item.value
                };
            });

            setData(localData);
            setError(null);
        } catch (err) {
            console.error("Heatmap Load Error:", err);
            setError("Could not load activity heatmap");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Skeleton height={300} />;

    if (error) return null; // Hide nicely if fails

    if (data.length === 0) return (
        <div className="heatmap-empty">
            <p>Not enough activity data for heatmap</p>
        </div>
    );

    // Prepare data for ScatterChart
    // we need to map day/hour to coordinates
    // Y = Day (0-6), X = Hour (0-23)

    // Find max value for coloring
    const maxValue = Math.max(...data.map(d => d.value), 1);

    const formatHour = (hour) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h = hour % 12 || 12;
        return `${h}${ampm}`;
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="heatmap-tooltip">
                    <p className="time">{DAYS[d.day]} @ {formatHour(d.hour)}</p>
                    <p className="count">{d.value} messages</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="activity-heatmap-container">
            <h3>Weekly Activity Map</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <XAxis
                            type="number"
                            dataKey="hour"
                            name="Hour"
                            domain={[0, 23]}
                            tickCount={12}
                            tickFormatter={(unixTime) => `${unixTime}:00`}
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="day"
                            name="Day"
                            domain={[0, 6]}
                            tickCount={7}
                            tickFormatter={(index) => DAYS[index]}
                            reversed={true}
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                        />
                        <ZAxis type="number" dataKey="value" range={[20, 400]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter data={data} shape="circle">
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={`rgba(100, 108, 255, ${0.2 + (entry.value / maxValue) * 0.8})`}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default ActivityHeatmap;
