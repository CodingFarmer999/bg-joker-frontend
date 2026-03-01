import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import EventCalendar from '../components/EventCalendar';
import './Dashboard.css';
import './AdminPage.css'; // I will create this for modal styles

const AdminPage = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('News Update');
    const [body, setBody] = useState('This is a group broadcast message from Admin!');
    const [status, setStatus] = useState('');
    const [isSending, setIsSending] = useState(false);

    // New Event State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        eventTime: '',
        maxParticipants: 10,
        eventType: 'OFFICIAL',
        gameType: 'Board Game'
    });
    const [refreshKey, setRefreshKey] = useState(0);

    const handleBroadcast = async () => {
        if (!title || !body) return;
        setIsSending(true);
        setStatus('Sending broadcast...');

        try {
            const response = await fetch('/api/test/fcm/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, body })
            });

            if (response.ok) {
                const resultText = await response.text();
                setStatus(`Success: ${resultText}`);
            } else {
                setStatus(`Error: Received status ${response.status} from backend.`);
            }
        } catch (error) {
            setStatus(`Error calling backend: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('joker_token');
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newEvent,
                    eventTime: new Date(newEvent.eventTime).toISOString(),
                    shopId: 1, // Default
                    organizerId: 1 // Default or from current user
                })
            });

            if (response.ok) {
                setIsModalOpen(false);
                setRefreshKey(prev => prev + 1); // Trigger calendar refresh
                toast.success('活動建立成功！');
            } else {
                toast.error('建立活動失敗');
            }
        } catch (err) {
            console.error('Error creating event:', err);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            const token = localStorage.getItem('joker_token');
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('活動已刪除');
                setRefreshKey(prev => prev + 1);
            } else {
                toast.error('刪除失敗');
            }
        } catch (err) {
            console.error('Error deleting event:', err);
            toast.error('刪除時發生錯誤');
        }
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="logo">BG Joker - Admin</div>
                <div className="nav-actions" style={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationBell />
                    <button className="login-btn" onClick={() => navigate('/')}>
                        Back to Dashboard
                    </button>
                </div>
            </nav>

            <main className="dashboard-content">
                <header className="content-header">
                    <h1>Admin Control Panel</h1>
                    <p>Mock page for administrative actions, user management, and system settings.</p>
                </header>

                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <h3>System Load</h3>
                            <div className="stat-val-row">
                                <span className="stat-value">42%</span>
                                <span className="stat-change">Normal</span>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🔔</div>
                        <div className="stat-info">
                            <h3>Pending Alerts</h3>
                            <div className="stat-val-row">
                                <span className="stat-value">3</span>
                                <span className="stat-change" style={{ color: 'var(--primary)' }}>Attention</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="table-section">
                    <div className="section-header">
                        <h2>User Management (Mock)</h2>
                    </div>
                    <div className="table-container">
                        <table className="mock-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>#1</td>
                                    <td>guybrush</td>
                                    <td><span className="status-badge available">ADMIN</span></td>
                                    <td><button className="login-btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit</button></td>
                                </tr>
                                <tr>
                                    <td>#2</td>
                                    <td>codingfarmer999</td>
                                    <td><span className="status-badge maintenance">USER</span></td>
                                    <td><button className="login-btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit</button></td>
                                </tr>
                                <tr>
                                    <td>#3</td>
                                    <td>line_User123</td>
                                    <td><span className="status-badge maintenance">USER</span></td>
                                    <td><button className="login-btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="admin-calendar-section">
                    <EventCalendar
                        key={refreshKey}
                        isAdmin={true}
                        onAddEvent={() => setIsModalOpen(true)}
                        onDeleteEvent={handleDeleteEvent}
                    />
                </section>

                <section className="table-section" style={{ marginTop: '2rem' }}>
                    <div className="section-header">
                        <h2>Group Broadcast Notifications</h2>
                    </div>
                    <div style={{ padding: '20px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <p style={{ marginBottom: '15px', color: 'var(--text-muted)' }}>Send a push notification to all registered devices.</p>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ color: 'var(--text-main)' }}>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-main)' }}
                                disabled={isSending}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ color: 'var(--text-main)' }}>Message Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-main)', minHeight: '80px' }}
                                disabled={isSending}
                            />
                        </div>

                        <button
                            className="login-btn"
                            style={{ padding: '12px 24px', background: 'var(--primary)', border: 'none' }}
                            onClick={handleBroadcast}
                            disabled={isSending || !title || !body}
                        >
                            {isSending ? 'Sending...' : 'Broadcast to All'}
                        </button>

                        {status && (
                            <div style={{ marginTop: '15px', padding: '12px', borderRadius: '8px', background: status.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 185, 0, 0.1)', color: status.includes('Error') ? '#ef4444' : 'var(--primary)', fontSize: '0.9rem' }}>
                                {status}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Create Event Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content admin-modal">
                        <h2>建立新活動</h2>
                        <form onSubmit={handleCreateEvent}>
                            <div className="form-group">
                                <label>活動標題</label>
                                <input
                                    type="text"
                                    required
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>活動類型</label>
                                    <select
                                        value={newEvent.eventType}
                                        onChange={e => setNewEvent({ ...newEvent, eventType: e.target.value })}
                                    >
                                        <option value="OFFICIAL">官方活動</option>
                                        <option value="CASUAL">玩家揪團</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>遊戲種類</label>
                                    <input
                                        type="text"
                                        value={newEvent.gameType}
                                        onChange={e => setNewEvent({ ...newEvent, gameType: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>時間</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={newEvent.eventTime}
                                        onChange={e => setNewEvent({ ...newEvent, eventTime: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>人數上限</label>
                                    <input
                                        type="number"
                                        value={newEvent.maxParticipants}
                                        onChange={e => setNewEvent({ ...newEvent, maxParticipants: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>活動描述</label>
                                <textarea
                                    rows="3"
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>取消</button>
                                <button type="submit" className="submit-btn">建立活動</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
