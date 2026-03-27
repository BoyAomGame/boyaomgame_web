import { useState, useEffect } from 'react';
import { MessageSkeleton } from './Skeleton';
import './MessageViewer.css';

import { API_URL } from '../config';

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const dateStr = timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
        const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
        return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24) {
        const hours = Math.floor(diffHours);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    if (diffHours < 48) {
        return 'Yesterday';
    }

    return date.toLocaleString();
}

import { useAuth } from '../context/AuthContext';

function MessageViewer({ discordId, limit = 50 }) {
    const { token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        if (discordId) {
            fetchMessages();
        }
    }, [discordId, limit, token]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_URL}/user/discord/${discordId}/messages?limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    setMessages([]);
                    setError(null);
                    return;
                }
                throw new Error('Failed to fetch messages');
            }

            const result = await response.json();
            setMessages(result.messages || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) {
        return (
            <div className="message-viewer">
                <h3>Recent Messages</h3>
                <div className="message-list">
                    {[1, 2, 3, 4, 5].map(i => (
                        <MessageSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="message-viewer error">
                <h3>Recent Messages</h3>
                <p className="error-text">{error}</p>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="message-viewer empty">
                <h3>Recent Messages</h3>
                <p>No messages found</p>
            </div>
        );
    }

    return (
        <div className="message-viewer">
            <div className="viewer-header">
                <h3>Recent Messages</h3>
                <span className="message-count">{messages.length} messages</span>
            </div>

            <div className="message-list">
                {messages.map((msg, index) => {
                    const isLong = msg.content && msg.content.length > 200;
                    const isExpanded = expanded[msg._id];
                    const displayContent = isLong && !isExpanded
                        ? msg.content.substring(0, 200) + '...'
                        : msg.content;

                    return (
                        <div key={msg._id || index} className="message-card">
                            <div className="message-header">
                                <div className="message-meta">
                                    {msg.guild?.name && (
                                        <span className="guild-tag">{msg.guild.name}</span>
                                    )}
                                    {msg.channel?.name && (
                                        <span className="channel-tag">#{msg.channel.name}</span>
                                    )}
                                </div>
                                <span className="message-time">
                                    {formatTimestamp(msg.timestamp)}
                                </span>
                            </div>

                            <div className="message-content">
                                {displayContent || <em className="no-content">No text content</em>}
                            </div>

                            {isLong && (
                                <button
                                    className="expand-btn"
                                    onClick={() => toggleExpand(msg._id)}
                                >
                                    {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                            )}

                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="message-attachments">
                                    📎 {msg.attachments.length} attachment{msg.attachments.length > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MessageViewer;
