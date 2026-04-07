import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminHeader from '../../components/AdminHeader';
import '../user/Dashboard.css';
import './AdminPage.css';
import './EventReviewPage.css';

const GAME_TYPE_LABELS = {
    BOARD_GAME: '桌遊',
    MTG: '魔法風雲會',
    POKEMON: '寶可夢 PTCG',
    YUGIOH: '遊戲王',
    FAB: '血肉之戰 (Flesh and Blood)',
    WS: 'Weiß Schwarz (黑白雙翼)',
};

const EventReviewPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActing, setIsActing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(null); // 'APPROVE' | 'REJECT' | null

    useEffect(() => {
        fetchEvent();
    }, [eventId]);

    const fetchEvent = async () => {
        const token = localStorage.getItem('joker_token');
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/events/${eventId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setEvent(await res.json());
            } else if (res.status === 404) {
                toast.error('找不到此活動');
                navigate('/admin/reviews');
            } else {
                toast.error('載入失敗');
            }
        } catch (err) {
            console.error('Failed to fetch event:', err);
            toast.error('載入失敗，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReview = async (action) => {
        const token = localStorage.getItem('joker_token');
        setIsActing(true);
        try {
            const res = await fetch(`/api/admin/events/${eventId}/review?action=${action}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                if (action === 'APPROVE') {
                    toast.success('揪團已審核通過，系統將自動通知申請人');
                } else {
                    toast('揪團已退件，系統將自動通知申請人', { icon: '❌' });
                }
                navigate('/admin/reviews');
            } else {
                const msg = await res.text();
                toast.error(msg || '操作失敗，請稍後再試');
            }
        } catch (err) {
            console.error('Review action failed:', err);
            toast.error('操作失敗，請稍後再試');
        } finally {
            setIsActing(false);
            setShowConfirm(null);
        }
    };

    const gameTypeLabel = event
        ? (event.gameType?.displayName || GAME_TYPE_LABELS[event.gameType] || event.gameType)
        : '';
    const gameTypeColor = event?.gameType?.color || '#6366f1';

    return (
        <div className="dashboard-container">
            <AdminHeader />
            <main className="dashboard-content">
                <div className="review-page-wrapper">
                    {/* 返回按鈕 */}
                    <button className="review-back-btn" onClick={() => navigate('/admin/reviews')}>
                        ← 返回待審核列表
                    </button>

                    <h1 className="review-page-title">揪團審核</h1>

                    {isLoading ? (
                        <div className="loader-container">
                            <div className="loader-small"></div>
                            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>載入中…</p>
                        </div>
                    ) : !event ? null : (
                        <div className="review-card">
                            {/* 狀態橫幅 */}
                            {event.status === 'PENDING_REVIEW' ? (
                                <div className="review-status-banner pending">
                                    ⏳ 此揪團正等待審核
                                </div>
                            ) : event.status === 'OPEN' ? (
                                <div className="review-status-banner approved">
                                    ✅ 此揪團已通過審核（狀態：報名中）
                                </div>
                            ) : (
                                <div className="review-status-banner rejected">
                                    ❌ 此揪團已退件（狀態：{event.status}）
                                </div>
                            )}

                            {/* 標題區 */}
                            <div className="review-event-header">
                                <span
                                    className="review-game-badge"
                                    style={{ background: gameTypeColor }}
                                >
                                    {gameTypeLabel}
                                </span>
                                <h2 className="review-event-title">{event.title}</h2>
                            </div>

                            {/* 資訊網格 */}
                            <div className="review-info-grid">
                                <div className="review-info-item">
                                    <span className="review-info-label">申請人</span>
                                    <span className="review-info-value">{event.organizerName || '未知'}</span>
                                </div>
                                <div className="review-info-item">
                                    <span className="review-info-label">活動時間</span>
                                    <span className="review-info-value">
                                        {new Date(event.eventTime).toLocaleString('zh-TW', {
                                            year: 'numeric', month: '2-digit', day: '2-digit',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="review-info-item">
                                    <span className="review-info-label">人數上限</span>
                                    <span className="review-info-value">{event.maxParticipants} 人</span>
                                </div>
                                <div className="review-info-item">
                                    <span className="review-info-label">活動類型</span>
                                    <span className="review-info-value">
                                        {event.eventType === 'OFFICIAL' ? '官方活動' : '玩家揪團'}
                                    </span>
                                </div>
                            </div>

                            {/* 活動說明 */}
                            <div className="review-description">
                                <h4>活動說明</h4>
                                <p>{event.description || '（未填寫說明）'}</p>
                            </div>

                            {/* 審核操作 — 僅在 PENDING_REVIEW 時顯示 */}
                            {event.status === 'PENDING_REVIEW' && (
                                <div className="review-actions">
                                    <button
                                        className="review-btn approve"
                                        onClick={() => setShowConfirm('APPROVE')}
                                        disabled={isActing}
                                    >
                                        ✅ 審核通過
                                    </button>
                                    <button
                                        className="review-btn reject"
                                        onClick={() => setShowConfirm('REJECT')}
                                        disabled={isActing}
                                    >
                                        ❌ 退件
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* 確認對話框 */}
            {showConfirm && (
                <div className="modal-overlay">
                    <div
                        className="modal-content admin-modal animated-fade"
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        style={{ maxWidth: '420px', textAlign: 'center' }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            {showConfirm === 'APPROVE' ? '✅' : '❌'}
                        </div>
                        <h2 style={{ marginBottom: '0.75rem' }}>
                            {showConfirm === 'APPROVE' ? '確認審核通過？' : '確認退件？'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            {showConfirm === 'APPROVE'
                                ? '通過後活動將立即公開，申請人會收到通知。'
                                : '退件後申請人將收到通知，活動將被取消。'}
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button
                                className="cancel-btn"
                                onClick={() => setShowConfirm(null)}
                                disabled={isActing}
                            >
                                取消
                            </button>
                            <button
                                className={showConfirm === 'APPROVE' ? 'submit-btn' : 'review-btn reject'}
                                onClick={() => handleReview(showConfirm)}
                                disabled={isActing}
                                style={showConfirm === 'REJECT' ? { padding: '10px 24px' } : {}}
                            >
                                {isActing ? '處理中…' : '確認'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventReviewPage;
