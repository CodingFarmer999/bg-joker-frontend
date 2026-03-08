import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminHeader from '../../components/AdminHeader';
import EventCalendar from '../../components/EventCalendar';
import '../user/Dashboard.css';
import './AdminPage.css'; // I will create this for modal styles

const AdminPage = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('News Update');
    const [body, setBody] = useState('This is a group broadcast message from Admin!');
    const [status, setStatus] = useState('');
    const [isSending, setIsSending] = useState(false);

    // New Event State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        eventTime: new Date().toLocaleDateString('en-CA') + 'T19:00',
        maxParticipants: 10,
        eventType: 'OFFICIAL',
        gameType: 'BOARD_GAME'
    });
    const [gameTypes, setGameTypes] = useState([]);

    useEffect(() => {
        const fetchGameTypes = async () => {
            try {
                const response = await fetch('/api/games');
                if (response.ok) {
                    const data = await response.json();
                    setGameTypes(data);
                }
            } catch (err) {
                console.error('Failed to fetch game types', err);
            }
        };
        fetchGameTypes();
    }, []);

    const timeOptions = [];
    for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0');
        timeOptions.push(`${hh}:00`);
        timeOptions.push(`${hh}:30`);
    }
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

    const handleSubmitEvent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('joker_token');
            const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
            const method = editingEventId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
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
                toast.success(editingEventId ? '活動更新成功！' : '活動建立成功！');
            } else {
                toast.error(editingEventId ? '更新活動失敗' : '建立活動失敗');
            }
        } catch (err) {
            console.error('Error submitting event:', err);
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

    const handleAddEventClick = () => {
        setEditingEventId(null);
        setNewEvent({
            title: '',
            description: '',
            eventTime: new Date().toLocaleDateString('en-CA') + 'T19:00',
            maxParticipants: 10,
            eventType: 'OFFICIAL',
            gameType: gameTypes.length > 0 ? gameTypes[0].code : 'BOARD_GAME'
        });
        setIsModalOpen(true);
    };

    const handleEditEvent = (event) => {
        setEditingEventId(event.id);
        const dateObj = new Date(event.eventTime);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        const localDateTimeStr = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

        setNewEvent({
            title: event.title,
            description: event.description,
            eventTime: localDateTimeStr,
            maxParticipants: event.maxParticipants,
            eventType: event.eventType,
            gameType: event.gameType?.code || 'BOARD_GAME'
        });
        setIsModalOpen(true);
    };

    return (
        <div className="dashboard-container">
            <AdminHeader />

            <main className="dashboard-content">
                <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Admin Control Panel</h1>
                        <p>管理店內活動行程與發送全站推播通知。</p>
                    </div>
                    <div>
                        <button
                            className="login-btn"
                            style={{ background: 'var(--success)', border: 'none' }}
                            onClick={() => navigate('/admin/events')}
                        >
                            🔍 進階活動查詢與管理
                        </button>
                    </div>
                </header>

                <section className="admin-calendar-section">
                    <EventCalendar
                        key={refreshKey}
                        isAdmin={true}
                        onAddEvent={handleAddEventClick}
                        onEditEvent={handleEditEvent}
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
                            <div style={{
                                marginTop: '15px',
                                padding: '12px',
                                borderRadius: '8px',
                                background: status.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'var(--border-subtle)',
                                color: status.includes('Error') ? '#ef4444' : 'var(--success)',
                                fontSize: '0.9rem',
                                border: `1px solid ${status.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'var(--glass-border)'}`
                            }}>
                                {status}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Create / Edit Event Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content admin-modal">
                        <h2>{editingEventId ? '編輯活動' : '建立新活動'}</h2>
                        <form onSubmit={handleSubmitEvent}>
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
                                    <select
                                        value={newEvent.gameType}
                                        onChange={e => setNewEvent({ ...newEvent, gameType: e.target.value })}
                                        disabled={gameTypes.length === 0}
                                    >
                                        {gameTypes.length === 0 ? (
                                            <option value="">讀取中...</option>
                                        ) : (
                                            gameTypes.map(gt => (
                                                <option key={gt.code} value={gt.code}>
                                                    {gt.displayName}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>活動日期</label>
                                    <input
                                        type="date"
                                        required
                                        value={newEvent.eventTime.split('T')[0]}
                                        onChange={e => {
                                            const timePart = newEvent.eventTime.split('T')[1] || '19:00';
                                            setNewEvent({ ...newEvent, eventTime: `${e.target.value}T${timePart}` });
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>時間 (整點/半點)</label>
                                    <select
                                        value={newEvent.eventTime.split('T')[1]}
                                        onChange={e => {
                                            const datePart = newEvent.eventTime.split('T')[0];
                                            setNewEvent({ ...newEvent, eventTime: `${datePart}T${e.target.value}` });
                                        }}
                                    >
                                        {timeOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>人數上限</label>
                                <input
                                    type="number"
                                    value={newEvent.maxParticipants}
                                    onChange={e => setNewEvent({ ...newEvent, maxParticipants: e.target.value })}
                                />
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
                                <button type="submit" className="submit-btn">{editingEventId ? '儲存變更' : '建立活動'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
