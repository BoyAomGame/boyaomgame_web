import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Skeleton from '../components/Skeleton';
import './AdminNotes.css';

import { API_URL } from '../config';

function AdminNotes() {
    const { token } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [newNoteName, setNewNoteName] = useState('');
    const [newNoteDesc, setNewNoteDesc] = useState('');
    const [newNoteEmoji, setNewNoteEmoji] = useState('🛡️');

    // User Management State
    const [editingNote, setEditingNote] = useState(null); // The note currently being edited
    const [userActionInput, setUserActionInput] = useState(''); // Input for adding user

    useEffect(() => {
        fetchNotes();
    }, [token]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/admin/notes/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch notes');
            const data = await response.json();
            setNotes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/admin/notes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    note_name: newNoteName,
                    note_description: newNoteDesc,
                    note_emoji: newNoteEmoji
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: 'Failed to create note (server error)' }));
                throw new Error(err.detail || 'Failed to create note');
            }

            setNewNoteName('');
            setNewNoteDesc('');
            setNewNoteEmoji('🛡️');
            fetchNotes(); // Reload list
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteNote = async (noteName) => {
        if (!confirm(`Are you sure you want to delete "${noteName}"?`)) return;

        try {
            const response = await fetch(`${API_URL}/admin/notes/${noteName}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete note');
            fetchNotes();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUpdateUser = async (action) => {
        if (!userActionInput.trim()) return;

        try {
            const response = await fetch(`${API_URL}/admin/notes/${editingNote.note_name}/users`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: userActionInput.trim(),
                    action: action
                })
            });

            if (!response.ok) throw new Error('Failed to update user list');

            setUserActionInput('');
            // Refresh notes to see updated list
            await fetchNotes();

            // Re-select the editing note from updated list
            // (We need to find the updated version of the note we were editing)
            // But fetchNotes updates state asynchronously... 
            // Better strategy: update local state optimistically or re-fetch.
            // Simplified: just close edit mode or rely on re-render if we found the note again.
            // Actually, let's just re-fetch and letting the UI update might close the modal if we aren't careful.
            // But 'editingNote' is a simplistic reference.
            // Let's just find it in the new list:
            // The fetchNotes triggered setNotes. We need to sync editingNote.
            // A pattern: id-based lookup.

        } catch (err) {
            alert(err.message);
        }
    };

    // Sync editingNote when notes list updates
    useEffect(() => {
        if (editingNote) {
            const updated = notes.find(n => n.note_name === editingNote.note_name);
            if (updated) setEditingNote(updated);
        }
    }, [notes]);


    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <Link to="/admin/dashboard" className="back-link">← Back to Dashboard</Link>
                    <h1>Admin Notes Manager</h1>
                    <p>Create tags and assign them to Roblox users (e.g. "Admin", "VIP", "Banned")</p>
                </div>

                {/* Create Note Form */}
                <div className="admin-card create-note-section">
                    <h3>Create New Note Type</h3>
                    <form onSubmit={handleCreateNote} className="create-note-form">
                        <div className="form-group">
                            <label>Emoji</label>
                            <input
                                type="text"
                                value={newNoteEmoji}
                                onChange={e => setNewNoteEmoji(e.target.value)}
                                placeholder="🛡️"
                                className="emoji-input"
                                maxLength="4"
                            />
                        </div>
                        <div className="form-group">
                            <label>Note Name (Unique)</label>
                            <input
                                type="text"
                                value={newNoteName}
                                onChange={e => setNewNoteName(e.target.value)}
                                placeholder="e.g. VIP, Admin"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <input
                                type="text"
                                value={newNoteDesc}
                                onChange={e => setNewNoteDesc(e.target.value)}
                                placeholder="Display text for this note"
                                required
                            />
                        </div>
                        <button type="submit" className="create-btn">Create Note</button>
                    </form>
                </div>

                {/* Notes List */}
                <div className="notes-list-section">
                    {loading ? (
                        <Skeleton height={100} count={3} />
                    ) : error ? (
                        <p className="error-text">{error}</p>
                    ) : (
                        <div className="notes-grid">
                            {notes.map(note => (
                                <div key={note.note_name} className="note-card">
                                    <div className="note-header">
                                        <h3>
                                            <span className="note-emoji-preview">{note.note_emoji}</span> {note.note_name}
                                        </h3>
                                        <button
                                            onClick={() => handleDeleteNote(note.note_name)}
                                            className="delete-btn"
                                            title="Delete Note Type"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="note-desc">{note.note_description}</p>

                                    <div className="note-users">
                                        <span className="user-count">
                                            {note.users.length} user{note.users.length !== 1 ? 's' : ''} assigned
                                        </span>
                                        <button
                                            onClick={() => setEditingNote(note)}
                                            className="manage-users-btn"
                                        >
                                            Manage Users
                                        </button>
                                    </div>

                                    {/* Mini list preview */}
                                    <div className="user-preview">
                                        {note.users.slice(0, 5).join(', ')}
                                        {note.users.length > 5 && '...'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Manage Users Model/Overlay */}
                {editingNote && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Manage Users for "{editingNote.note_name}"</h2>
                                <button onClick={() => setEditingNote(null)} className="close-modal">×</button>
                            </div>

                            <div className="modal-body">
                                <div className="add-user-row">
                                    <input
                                        type="text"
                                        placeholder="Roblox Username to Add/Remove"
                                        value={userActionInput}
                                        onChange={e => setUserActionInput(e.target.value)}
                                    />
                                    <button onClick={() => handleUpdateUser('add')} className="add-btn">Add</button>
                                    <button onClick={() => handleUpdateUser('remove')} className="remove-btn">Remove</button>
                                </div>

                                <div className="user-list-full">
                                    <h4>Assigned Users:</h4>
                                    {editingNote.users.length === 0 ? (
                                        <p className="empty-text">No users assigned yet.</p>
                                    ) : (
                                        <div className="tags-container">
                                            {editingNote.users.map(user => (
                                                <span key={user} className="user-tag">
                                                    {user}
                                                    <span
                                                        className="tag-remove"
                                                        onClick={() => {
                                                            setUserActionInput(user);
                                                            handleUpdateUser('remove');
                                                        }}
                                                    >×</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default AdminNotes;
