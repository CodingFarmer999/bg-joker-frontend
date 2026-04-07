import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminHeader from '../../components/AdminHeader';
import './EventSearchPage.css';
import './AdminPage.css';

const EventSearchPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, title } | null
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('joker_token');
            // 使用管理員端點，可取得包含 PENDING_REVIEW 的所有活動
            const [publicRes, pendingRes] = await Promise.all([
                fetch('/api/events'),
                fetch('/api/admin/events/pending', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const publicEvents = publicRes.ok ? await publicRes.json() : [];
            const pendingEvents = pendingRes.ok ? await pendingRes.json() : [];

            // 合併，避免重複 ID
            const merged = [...publicEvents];
            pendingEvents.forEach(pe => {
                if (!merged.find(e => e.id === pe.id)) merged.push(pe);
            });
            setEvents(merged);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('joker_token');
            const response = await fetch(`/api/events/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
                toast.success('活動已刪除');
            } else {
                toast.error('刪除失敗，請稍後再試');
            }
        } catch (err) {
            console.error('Error deleting event:', err);
            toast.error('刪除時發生錯誤');
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
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
            <AdminHeader />
            <main className="dashboard-content">
                <header className="search-header">
                    <div>
                        <h1>活動查詢與管理</h1>
                        <p className="subtitle">依條件搜尋活動，並進入該活動後台進行管理。</p>
                    </div>
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
                        <option value="PENDING_REVIEW">待審核 (PENDING_REVIEW)</option>
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
                                                    onClick={() => setDeleteTarget({ id: event.id, title: event.title })}
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

            {/* 刪除確認對話框 */}
            {deleteTarget && (
                <div className="modal-overlay">
                    <div
                        className="modal-content admin-modal animated-fade"
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        style={{ maxWidth: '420px', textAlign: 'center' }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ marginBottom: '0.75rem' }}>確認刪除？</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            即將刪除活動：
                        </p>
                        <p style={{ fontWeight: 700, marginBottom: '1.5rem' }}>
                            「{deleteTarget.title}」
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                            此操作將同步移除所有報名資料，且無法復原。
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button
                                className="cancel-btn"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                            >
                                取消
                            </button>
                            <button
                                className="submit-btn"
                                style={{ background: '#ef4444' }}
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? '刪除中…' : '確認刪除'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventSearchPage;
