import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader';
import '../user/Dashboard.css';
import './EventSearchPage.css';

const EventReviewListPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPendingEvents();
    }, []);

    const fetchPendingEvents = async () => {
        const token = localStorage.getItem('joker_token');
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/events/pending', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setEvents(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch pending events:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <AdminHeader />
            <main className="dashboard-content">
                <header className="search-header">
                    <div>
                        <h1>待審核揪團</h1>
                        <p className="subtitle">以下為玩家發起、尚待審核的揪團申請。點擊「審核」進入詳情頁面。</p>
                    </div>
                    <span style={{
                        background: events.length > 0 ? '#f59e0b' : 'var(--border-subtle)',
                        color: events.length > 0 ? '#fff' : 'var(--text-muted)',
                        fontWeight: 700,
                        borderRadius: '99px',
                        padding: '6px 16px',
                        fontSize: '0.9rem',
                    }}>
                        {events.length} 筆待審核
                    </span>
                </header>

                <section className="events-table-container">
                    {isLoading ? (
                        <div className="loader-container">
                            <div className="loader-small"></div>
                            <p>載入中…</p>
                        </div>
                    ) : (
                        <table className="events-table">
                            <thead>
                                <tr>
                                    <th>申請時間</th>
                                    <th>活動標題</th>
                                    <th>申請人</th>
                                    <th>遊戲類型</th>
                                    <th>活動時間</th>
                                    <th>人數上限</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-state">目前沒有待審核的揪團申請。</td>
                                    </tr>
                                ) : (
                                    events.map(event => (
                                        <tr key={event.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                {new Date(event.eventTime).toLocaleDateString('zh-TW')}
                                            </td>
                                            <td className="font-bold">{event.title}</td>
                                            <td>{event.organizerName || '—'}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        background: event.gameType?.color || '#6366f1',
                                                        color: '#fff',
                                                        padding: '3px 10px',
                                                        borderRadius: '99px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {event.gameType?.displayName || event.gameType}
                                                </span>
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                {new Date(event.eventTime).toLocaleString('zh-TW', {
                                                    month: '2-digit', day: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td>{event.maxParticipants} 人</td>
                                            <td>
                                                <button
                                                    className="manage-btn"
                                                    onClick={() => navigate(`/admin/reviews/${event.id}`)}
                                                >
                                                    📋 審核
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        </div>
    );
};

export default EventReviewListPage;
