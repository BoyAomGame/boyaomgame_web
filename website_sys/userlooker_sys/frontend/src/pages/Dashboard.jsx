import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const Dashboard = () => {
    const { user, logout, loginWithDiscord } = useAuth();
    const [searchValue, setSearchValue] = useState('');
    const [searchType, setSearchType] = useState('roblox'); // 'roblox' or 'discord'
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch(searchValue, searchType);
    };

    const performSearch = (value, type) => {
        if (value.trim()) {
            if (type === 'roblox') {
                navigate(`/result/${value.trim()}`);
            } else {
                navigate(`/result/${value.trim()}?type=discord`);
            }
        }
    };

    const handleRecentClick = (term) => {
        // Detect if it looks like a discord ID (all numbers, > 15 chars) or Roblox name
        // This is a heuristic, best effort.
        // Or we could have stored type in backend, but for now let's guess.
        const isDiscordObj = /^\d{16,20}$/.test(term);
        performSearch(term, isDiscordObj ? 'discord' : 'roblox');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const placeholderText = searchType === 'roblox'
        ? 'Enter Roblox Username'
        : 'Enter Discord ID';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            {/* Header / Nav */}
            <div style={{
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(30, 41, 59, 0.4)'
            }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>UserLooker</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            🛡️ Admin Panel
                        </button>
                    )}
                    {user?.avatar && (
                        <img
                            src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png`}
                            alt="Avatar"
                            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                        />
                    )}
                    <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{user?.username}</span>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '6px 14px',
                            fontSize: '0.85rem',
                            background: 'rgba(100, 116, 139, 0.2)',
                            color: '#94a3b8',
                            border: '1px solid rgba(100, 116, 139, 0.3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.color = '#f87171';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)';
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)';
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 20px'
            }}>
                <h1 style={{ marginBottom: '10px', fontSize: '2rem' }}>Welcome back, {user?.username}</h1>
                <p style={{ color: '#94a3b8', marginBottom: '40px' }}>What are we looking for today?</p>

                {/* Search type toggle */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '20px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    padding: '4px',
                    borderRadius: '10px',
                }}>
                    <button
                        type="button"
                        onClick={() => setSearchType('roblox')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            background: searchType === 'roblox' ? '#646cff' : 'transparent',
                            color: searchType === 'roblox' ? 'white' : '#64748b'
                        }}
                    >
                        Roblox
                    </button>
                    <button
                        type="button"
                        onClick={() => setSearchType('discord')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            background: searchType === 'discord' ? '#5865F2' : 'transparent',
                            color: searchType === 'discord' ? 'white' : '#64748b'
                        }}
                    >
                        Discord ID
                    </button>
                </div>

                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '500px', marginBottom: '50px' }}>
                    <input
                        type="text"
                        placeholder={placeholderText}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            borderRadius: '12px',
                            border: `2px solid ${isFocused ? (searchType === 'discord' ? '#5865F2' : '#646cff') : '#334155'}`,
                            backgroundColor: '#1e293b',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '0 24px',
                            borderRadius: '12px',
                            background: searchType === 'discord' ? '#5865F2' : '#646cff',
                            border: 'none',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Search
                    </button>
                </form>

                {/* Recent Searches */}
                <div style={{ width: '100%', maxWidth: '800px' }}>
                    <h3 style={{ color: '#cbd5e1', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Recent Searches</h3>

                    {user?.recent_searches?.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                            {user.recent_searches.map((term, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleRecentClick(term)}
                                    style={{
                                        background: 'rgba(30, 41, 59, 0.4)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: /^\d{16,20}$/.test(term) ? '#5865F2' : '#646cff'
                                    }} />
                                    <span style={{ color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{term}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#64748b', fontStyle: 'italic' }}>No recent searches yet.</p>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;
