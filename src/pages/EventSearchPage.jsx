import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import './EventSearchPage.css';

const EventSearchPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/events');
            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            }
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('確定要刪除此活動嗎？這將會同步移除所有報名資料且無法復原。')) return;

        try {
            const token = localStorage.getItem('joker_token');
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setEvents(prev => prev.filter(e => e.id !== eventId));
            } else {
                alert('刪除失敗');
            }
        } catch (err) {
            console.error('Error deleting event:', err);
        }
    };

    // Derived states
    const filteredEvents = events.filter(e => {
        const titleMatches = e.title ? e.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || e.eventType === typeFilter;
        return titleMatches && matchesStatus && matchesType;
    });

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="logo">BG Joker - Admin</div>
                <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ThemeToggle />
                    <NotificationBell />
                    <button className="login-btn" onClick={() => navigate('/')}>
                        Home
                    </button>
                </div>
            </nav>
            <main className="dashboard-content">
                <header className="search-header">
                    <div>
                        <h1>活動查詢與管理</h1>
                        <p className="subtitle">依條件搜尋活動，並進入該活動後台進行管理。</p>
                    </div>
                    <button className="back-btn" onClick={() => navigate('/admin')}>
                        返回控制台
                    </button>
                </header>

                <section className="search-filters">
                    <input
                        type="text"
                        placeholder="搜尋活動標題..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="filter-input box-shadow"
                    />

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="filter-select box-shadow"
                    >
                        <option value="ALL">所有類型 (官方/揪團)</option>
                        <option value="OFFICIAL">官方活動</option>
                        <option value="CASUAL">玩家揪團</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select box-shadow"
                    >
                        <option value="ALL">所有狀態 (開放/額滿等)</option>
                        <option value="OPEN">報名中 (OPEN)</option>
                        <option value="FULL">已額滿 (FULL)</option>
                        <option value="CANCELLED">已取消 (CANCELLED)</option>
                    </select>
                </section>

                <section className="events-table-container">
                    {isLoading ? (
                        <div className="loader-container">
                            <div className="loader-small"></div>
                            <p>載入中...</p>
                        </div>
                    ) : (
                        <table className="events-table">
                            <thead>
                                <tr>
                                    <th>日期與時間</th>
                                    <th>活動標題</th>
                                    <th>類型</th>
                                    <th>報名人數</th>
                                    <th>狀態</th>
                                    <th>快速操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">目前沒有符合條件的活動資料。</td>
                                    </tr>
                                ) : (
                                    filteredEvents.map(event => (
                                        <tr key={event.id}>
                                            <td>{new Date(event.eventTime).toLocaleString()}</td>
                                            <td className="font-bold">{event.title}</td>
                                            <td>
                                                <span className={`event-type-badge ${event.eventType.toLowerCase()}`}>
                                                    {event.eventType === 'OFFICIAL' ? '官方' : '揪團'}
                                                </span>
                                            </td>
                                            <td>{event.currentParticipants} / {event.maxParticipants} 人</td>
                                            <td>
                                                <span className={`event-status-badge ${event.status.toLowerCase()}`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="manage-btn"
                                                    onClick={() => navigate(`/admin/events/${event.id}`)}
                                                >
                                                    ⚙️ 管理
                                                </button>
                                                <button
                                                    className="delete-icon-btn"
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                >
                                                    🗑️
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

export default EventSearchPage;
