import { useState, useMemo, useEffect } from 'react';
import './EventCalendar.css';

const EventCalendar = ({ isAdmin = false, onAddEvent, onDeleteEvent }) => {
    const [filter, setFilter] = useState('ALL'); // ALL, OFFICIAL, CASUAL
    const [viewMode, setViewMode] = useState('CALENDAR'); // CALENDAR, LIST
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Fetch real data from Backend
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

    const filteredEvents = filter === 'ALL'
        ? events
        : events.filter(e => e.eventType === filter);

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

    const handleDelete = async (eventId) => {
        if (window.confirm('確定要刪除此活動嗎？')) {
            await onDeleteEvent(eventId);
            setSelectedEvent(null);
            fetchEvents();
        }
    };

    return (
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
                                                        className={`event-tag-small ${event.eventType.toLowerCase()}`}
                                                        title={event.title}
                                                        onClick={() => setSelectedEvent(event)}
                                                    >
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
                    <div className="list-title">本月精選活動</div>
                    <div className="event-grid">
                        {filteredEvents.length === 0 && !isLoading ? (
                            <div className="no-events" style={{ color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>本月暫無活動</div>
                        ) : (
                            filteredEvents.map(event => (
                                <div key={event.id} className={`event-card ${event.eventType.toLowerCase()}`}>
                                    <div className="event-type-tag">
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

            {/* Event Detail Popup */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="modal-content event-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-header">
                            <span className={`detail-type-badge ${selectedEvent.eventType.toLowerCase()}`}>
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
                                <span className="info-value">{selectedEvent.gameType}</span>
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
                                <button className="delete-btn" onClick={() => handleDelete(selectedEvent.id)}>
                                    🗑️ 刪除活動
                                </button>
                            ) : (
                                <button className="submit-btn" disabled={selectedEvent.status === 'FULL'}>
                                    {selectedEvent.status === 'FULL' ? '人數已滿' : '立即報名'}
                                </button>
                            )}
                            <button className="cancel-btn" onClick={() => setSelectedEvent(null)}>關閉</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventCalendar;
