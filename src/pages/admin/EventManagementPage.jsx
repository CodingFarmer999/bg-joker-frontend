import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader';
import './EventManagementPage.css';

const EventManagementPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [eventDetails, setEventDetails] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Fetch Event Details
                const eventRes = await fetch(`/api/events`); // Ideally a GET by ID exists, assuming we filter for now, or you can implement one.
                if (eventRes.ok) {
                    const allEvents = await eventRes.json();
                    const evt = allEvents.find(e => e.id === Number(eventId));
                    setEventDetails(evt);
                }

                // Fetch Participants
                const partRes = await fetch(`/api/events/${eventId}/participants`);
                if (partRes.ok) {
                    const data = await partRes.json();
                    setParticipants(data);
                }
            } catch (err) {
                console.error("Failed to load page data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [eventId]);

    const handleUpdateParticipantStatus = async (participantId, newStatus) => {
        try {
            const response = await fetch(`/api/events/participants/${participantId}?status=${newStatus}`, {
                method: 'PATCH'
            });
            if (response.ok) {
                setParticipants(prev =>
                    prev.map(p => p.id === participantId ? { ...p, joinStatus: newStatus } : p)
                );
            }
        } catch (err) {
            console.error('Failed to update participant status:', err);
        }
    };

    // Calculate Dashboard Stats
    const stats = {
        total: participants.length,
        joined: participants.filter(p => p.joinStatus === 'JOINED').length,
        confirmed: participants.filter(p => p.joinStatus === 'CONFIRMED').length,
        waiting: participants.filter(p => p.joinStatus === 'WAITING').length,
        cancelled: participants.filter(p => p.joinStatus === 'CANCELLED').length,
    };

    // Filter Logic
    const filteredParticipants = participants.filter(p => {
        const matchesSearch = p.userName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.joinStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="dashboard-container">
                <AdminHeader />
                <div className="management-page-loader">
                    <div className="loader-small"></div>
                    <p>載入資料中...</p>
                </div>
            </div>
        );
    }

    if (!eventDetails) {
        return (
            <div className="dashboard-container">
                <AdminHeader />
                <main className="dashboard-content">
                    <div className="error-message">找不到該活動資料。</div>
                    <button className="back-btn" onClick={() => navigate('/admin')}>返回行事曆</button>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <AdminHeader />
            <main className="dashboard-content">
                <header className="management-header">
                    <div className="header-info">
                        <button className="back-btn" onClick={() => navigate('/admin')}>
                            &larr; 返回
                        </button>
                        <h1>{eventDetails.title}</h1>
                        <span className="event-time">
                            {new Date(eventDetails.eventTime).toLocaleString()}
                        </span>
                        <span className={`status-badge ${eventDetails.status.toLowerCase()}`}>
                            {eventDetails.status}
                        </span>
                    </div>
                    <div className="header-actions">
                        <button className="export-btn">📄 匯出名單</button>
                        <button className="print-btn">🖨️ 列印報到表</button>
                    </div>
                </header>

                <section className="dashboard-stats">
                    <div className="stat-card">
                        <h3>總報名人數</h3>
                        <p className="stat-value">{stats.total} <span className="stat-limit">/ {eventDetails.maxParticipants}</span></p>
                    </div>
                    <div className="stat-card">
                        <h3>已報名</h3>
                        <p className="stat-value text-blue">{stats.joined}</p>
                    </div>
                    <div className="stat-card">
                        <h3>已確認 (報到)</h3>
                        <p className="stat-value text-success">{stats.confirmed}</p>
                    </div>
                    <div className="stat-card">
                        <h3>候補中</h3>
                        <p className="stat-value text-warning">{stats.waiting}</p>
                    </div>
                </section>

                <section className="management-content">
                    <div className="table-controls">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="搜尋玩家暱稱..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-box">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">顯示全部狀態</option>
                                <option value="JOINED">已報名</option>
                                <option value="CONFIRMED">已確認</option>
                                <option value="WAITING">候補中</option>
                                <option value="CANCELLED">已取消</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="participants-table">
                            <thead>
                                <tr>
                                    <th>序號</th>
                                    <th>玩家暱稱</th>
                                    <th>報名時間</th>
                                    <th>目前狀態</th>
                                    <th>操作與變更</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-state">目前沒有符合條件的報名資料。</td>
                                    </tr>
                                ) : (
                                    filteredParticipants.map((p, index) => (
                                        <tr key={p.id}>
                                            <td>{index + 1}</td>
                                            <td className="font-bold">{p.userName}</td>
                                            <td>{new Date(p.joinedAt).toLocaleString()}</td>
                                            <td>
                                                <span className={`join-status-badge ${p.joinStatus.toLowerCase()}`}>
                                                    {p.joinStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    className="status-dropdown"
                                                    value={p.joinStatus}
                                                    onChange={(e) => handleUpdateParticipantStatus(p.id, e.target.value)}
                                                >
                                                    <option value="JOINED">已報名</option>
                                                    <option value="CONFIRMED">已確認</option>
                                                    <option value="WAITING">候補中</option>
                                                    <option value="CANCELLED">已取消</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default EventManagementPage;
