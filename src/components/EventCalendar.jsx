import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './EventCalendar.css';
import '../pages/admin/AdminPage.css';

const EventCalendar = ({ isAdmin = false, onAddEvent, onEditEvent, onDeleteEvent }) => {
    const [filter, setFilter] = useState('ALL'); // ALL, OFFICIAL, CASUAL
    const [viewMode, setViewMode] = useState('CALENDAR'); // CALENDAR, LIST
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const [isJoiningLoading, setIsJoiningLoading] = useState(false);
    const navigate = useNavigate();

    // Fetch real data from Backend
    useEffect(() => {
        fetchEvents();
        fetchCurrentUser();
    }, []);

    // 當 modal 開啟或 currentUserId 取得後，檢查是否已報名
    useEffect(() => {
        if (!selectedEvent || !currentUserId) {
            setIsJoined(false);
            return;
        }
        checkJoinStatus(selectedEvent.id);
    }, [selectedEvent?.id, currentUserId]);

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

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('joker_token');
        if (!token) return;
        try {
            const res = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentUserId(data.id);
            }
        } catch (err) {
            console.error('Failed to fetch current user:', err);
        }
    };

    const checkJoinStatus = async (eventId) => {
        try {
            const res = await fetch(`/api/events/${eventId}/participants`);
            if (res.ok) {
                const participants = await res.json();
                const joined = participants.some(
                    p => p.userId === currentUserId && p.joinStatus === 'JOINED'
                );
                setIsJoined(joined);
            }
        } catch (err) {
            console.error('Failed to check join status:', err);
        }
    };

    const handleJoin = async () => {
        const token = localStorage.getItem('joker_token');
        if (!token) {
            toast.error('請先登入才能報名');
            return;
        }
        setIsJoiningLoading(true);
        try {
            const res = await fetch(`/api/events/${selectedEvent.id}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const updatedEvent = await res.json();
                toast.success('報名成功！');
                setIsJoined(true);
                setSelectedEvent(updatedEvent);
                fetchEvents();
            } else {
                const msg = await res.text();
                toast.error(msg || '報名失敗，請稍後再試');
            }
        } catch (err) {
            console.error('Join failed:', err);
            toast.error('報名失敗，請稍後再試');
        } finally {
            setIsJoiningLoading(false);
        }
    };

    const handleCancelJoin = async () => {
        const token = localStorage.getItem('joker_token');
        setIsJoiningLoading(true);
        try {
            const res = await fetch(`/api/events/${selectedEvent.id}/join`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const updatedEvent = await res.json();
                toast.success('已取消報名');
                setIsJoined(false);
                setSelectedEvent(updatedEvent);
                fetchEvents();
            } else {
                const msg = await res.text();
                toast.error(msg || '取消失敗，請稍後再試');
            }
        } catch (err) {
            console.error('Cancel join failed:', err);
            toast.error('取消失敗，請稍後再試');
        } finally {
            setIsJoiningLoading(false);
        }
    };

    // Calendar Logic
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysCount = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        const days = [];
        // Padding
        for (let i = 0; i < startDay; i++) {
            days.push({ isEmpty: true, dayNumber: null, date: null, events: [] });
        }
        // Days
        for (let i = 1; i <= daysCount; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.eventTime.startsWith(dateStr));
            days.push({
                isEmpty: false,
                dayNumber: i,
                date: dateStr,
                events: dayEvents
            });
        }
        return days;
    }, [currentDate, events]);

    const now = new Date();
    const viewYear = currentDate.getFullYear();
    const viewMonth = currentDate.getMonth();
    const isViewingCurrentMonth =
        viewYear === now.getFullYear() && viewMonth === now.getMonth();

    const filteredEvents = events.filter(e => {
        const eventDate = new Date(e.eventTime);
        // 必須符合目前瀏覽的月份
        const inViewedMonth =
            eventDate.getFullYear() === viewYear && eventDate.getMonth() === viewMonth;
        // 類型篩選
        const matchesType = filter === 'ALL' || e.eventType === filter;

        if (!inViewedMonth || !matchesType) return false;
        // 瀏覽當月時，過濾掉已結束（時間已過）的活動
        if (isViewingCurrentMonth) return eventDate >= now;
        return true;
    });

    const getStatusLabel = (status) => {
        switch (status) {
            case 'FULL': return '已額滿';
            case 'CANCELLED': return '已取消';
            default: return '報名中';
        }
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = async () => {
        await onDeleteEvent(selectedEvent.id);
        setShowDeleteConfirm(false);
        setSelectedEvent(null);
        fetchEvents();
    };

    return (
        <>
        <div className="calendar-section">
            <div className="section-header">
                <div className="header-left">
                    <h2>{isAdmin ? '活動管理行事曆' : '活動行事曆'}</h2>
                    <p>{currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月</p>
                </div>

                <div className="header-right">
                    {isAdmin && (
                        <button
                            className="login-btn add-event-btn"
                            onClick={onAddEvent}
                            style={{ marginRight: '1rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span>+</span> 新增事件
                        </button>
                    )}
                    <div className="view-tabs">
                        <button
                            className={`tab-btn ${viewMode === 'CALENDAR' ? 'active' : ''}`}
                            onClick={() => setViewMode('CALENDAR')}
                        >行事曆</button>
                        <button
                            className={`tab-btn ${viewMode === 'LIST' ? 'active' : ''}`}
                            onClick={() => setViewMode('LIST')}
                        >列表</button>
                    </div>
                    <div className="filter-group">
                        <button
                            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setFilter('ALL')}
                        >全部</button>
                        <button
                            className={`filter-btn ${filter === 'OFFICIAL' ? 'active' : ''}`}
                            onClick={() => setFilter('OFFICIAL')}
                        >官方</button>
                        <button
                            className={`filter-btn ${filter === 'CASUAL' ? 'active' : ''}`}
                            onClick={() => setFilter('CASUAL')}
                        >揪團</button>
                    </div>
                </div>
            </div>

            {viewMode === 'CALENDAR' ? (
                <div className="calendar-container">
                    <div className="calendar-header-nav">
                        <div className="current-month-display">
                            {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月
                        </div>
                        <div className="month-nav">
                            <button onClick={() => changeMonth(-1)}>&lt;</button>
                            <button onClick={() => changeMonth(1)}>&gt;</button>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="loader-small" style={{ margin: '2rem auto' }}></div>
                    ) : (
                        <div className="calendar-grid">
                            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                                <div key={d} className="calendar-weekday">{d}</div>
                            ))}
                            {calendarDays.map((day, idx) => (
                                <div
                                    key={day.date || idx}
                                    className={`calendar-day ${day.isEmpty ? 'empty' : ''} ${day.events.length > 0 ? 'has-events' : ''}`}
                                >
                                    {!day.isEmpty && (
                                        <>
                                            <span className="day-number">{day.dayNumber}</span>
                                            <div className="day-events">
                                                {day.events.map((event, eventIdx) => (
                                                    <div
                                                        key={eventIdx}
                                                        className="event-tag-small"
                                                        style={{
                                                            backgroundColor: event.gameType?.color || 'var(--primary)'
                                                        }}
                                                        title={event.title}
                                                        onClick={() => setSelectedEvent(event)}
                                                    >
                                                        <span style={{ opacity: 0.8, marginRight: '4px' }}>
                                                            {event.gameType?.displayName?.split(' ')[0]} {/* 擷取縮寫，例如 '寶可夢' */}
                                                        </span>
                                                        {event.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="event-list-view animated-fade">
                    <div className="list-title">
                        {viewYear} 年 {viewMonth + 1} 月精選活動
                    </div>
                    <div className="event-grid">
                        {filteredEvents.length === 0 && !isLoading ? (
                            <div className="no-events" style={{ color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>本月暫無活動</div>
                        ) : (
                            filteredEvents.map(event => (
                                <div key={event.id} className="event-card" style={{ borderLeft: `4px solid ${event.gameType?.color || 'var(--primary)'}` }}>
                                    <div className="event-type-tag" style={{ background: event.gameType?.color || 'var(--primary)', color: '#fff' }}>
                                        {event.eventType === 'OFFICIAL' ? '官方' : '揪團'}
                                    </div>
                                    <div className="event-card-content">
                                        <div className="event-date">
                                            <span className="month">{new Date(event.eventTime).getMonth() + 1}月</span>
                                            <span className="day">{new Date(event.eventTime).getDate()}</span>
                                        </div>
                                        <div className="event-info">
                                            <h3>{event.title}</h3>
                                            <div className="event-meta">
                                                <span>📅 {new Date(event.eventTime).toLocaleString()}</span>
                                                <span>👥 {event.currentParticipants}/{event.maxParticipants} 人</span>
                                            </div>
                                            <p className="event-desc">{event.description}</p>
                                            <div className="event-footer">
                                                <span className={`status-tag ${event.status.toLowerCase()}`}>
                                                    {getStatusLabel(event.status)}
                                                </span>
                                                <button className="join-btn" onClick={() => setSelectedEvent(event)}>
                                                    查看詳情
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

        </div>

        {/* Event Detail Popup — portal 到 body，避免 backdrop-filter 影響 fixed 定位 */}
        {selectedEvent && createPortal(
            <div className="modal-overlay">
                <div className="modal-content event-detail-modal" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                    <div className="detail-header">
                        <span className="detail-type-badge" style={{ background: selectedEvent.gameType?.color || 'var(--primary)', color: '#fff' }}>
                            {selectedEvent.gameType?.displayName}
                        </span>
                        <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${selectedEvent.gameType?.color || 'var(--primary)'}`, color: selectedEvent.gameType?.color || 'var(--primary)' }}>
                            {selectedEvent.eventType === 'OFFICIAL' ? '官方活動' : '玩家揪團'}
                        </span>
                        <button className="close-modal-btn" onClick={() => setSelectedEvent(null)}>&times;</button>
                    </div>

                    <h2 className="detail-title">{selectedEvent.title}</h2>
                    <div className="detail-info-grid">
                        <div className="info-item">
                            <span className="info-label">時間</span>
                            <span className="info-value">{new Date(selectedEvent.eventTime).toLocaleString()}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">遊戲類型</span>
                            <span className="info-value">
                                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedEvent.gameType?.color, marginRight: '8px' }}></span>
                                {selectedEvent.gameType?.displayName}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">人數狀態</span>
                            <span className="info-value">{selectedEvent.currentParticipants} / {selectedEvent.maxParticipants} 人</span>
                        </div>
                    </div>

                    <div className="detail-description">
                        <h4>活動詳情</h4>
                        <p>{selectedEvent.description || '暫無描述'}</p>
                    </div>

                    <div className="detail-actions">
                        {isAdmin ? (
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                {/* 查看報名 ~45% */}
                                <button
                                    className="view-participants-btn"
                                    onClick={() => navigate(`/admin/events/${selectedEvent.id}`)}
                                    style={{ flex: 4.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--success)' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                    查看報名
                                </button>
                                {/* 編輯活動 ~30% */}
                                <button
                                    className="submit-btn"
                                    onClick={() => { onEditEvent(selectedEvent); setSelectedEvent(null); }}
                                    style={{ flex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    編輯
                                </button>
                                {/* 刪除，僅圖示 */}
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    title="刪除活動"
                                    style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '10px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                        <path d="M10 11v6M14 11v6"/>
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {isJoined ? (
                                    <button
                                        className="cancel-btn"
                                        onClick={handleCancelJoin}
                                        disabled={isJoiningLoading}
                                        style={{ flex: 1, color: '#ef4444', fontWeight: 700 }}
                                    >
                                        {isJoiningLoading ? '處理中…' : '取消報名'}
                                    </button>
                                ) : selectedEvent.status === 'FULL' ? (
                                    <button className="submit-btn" disabled style={{ flex: 1, opacity: 0.5 }}>
                                        人數已滿
                                    </button>
                                ) : (
                                    <button
                                        className="submit-btn"
                                        onClick={handleJoin}
                                        disabled={isJoiningLoading}
                                        style={{ flex: 1 }}
                                    >
                                        {isJoiningLoading ? '報名中…' : currentUserId ? '立即報名' : '登入後報名'}
                                    </button>
                                )}
                                <button className="cancel-btn" onClick={() => setSelectedEvent(null)} style={{ flex: 1 }}>關閉</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Delete Confirmation Overlay — portal 到 body */}
        {showDeleteConfirm && createPortal(
            <div className="modal-overlay" style={{ zIndex: 3000 }}>
                <div className="modal-content admin-modal confirm-modal animated-fade" onMouseDown={e => e.stopPropagation()}>
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ marginBottom: '1rem' }}>確認刪除？</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            此操作無法復原，您確定要刪除活動 「{selectedEvent?.title}」 嗎？
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                                取消
                            </button>
                            <button
                                className="submit-btn"
                                style={{ background: '#ef4444' }}
                                onClick={handleDelete}
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>
    );
};

export default EventCalendar;
