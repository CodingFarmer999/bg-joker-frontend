import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    // Fetch notifications and unread count
    const fetchNotifications = async () => {
        const token = localStorage.getItem('joker_token');
        if (!token) return;

        try {
            // Unread Count
            const countRes = await fetch('/api/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (countRes.ok) {
                const count = await countRes.json();
                setUnreadCount(count);
            }

            // Notification List
            const listRes = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (listRes.ok) {
                const list = await listRes.json();
                setNotifications(list);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Initial fetch and click-outside handler
    useEffect(() => {
        fetchNotifications();

        // Refresh slightly more often in case of FCM receives
        const intervalId = setInterval(fetchNotifications, 60000);

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications(); // Refresh when opening
        }
    };

    const handleReadNotification = async (notification) => {
        const token = localStorage.getItem('joker_token');
        if (!token) return;

        // 若未讀，先標記已讀
        if (!notification.isRead) {
            try {
                const res = await fetch(`/api/notifications/${notification.id}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setNotifications(prev =>
                        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        // 若有 actionUrl，跳轉至對應頁面
        if (notification.actionUrl) {
            setIsOpen(false);
            navigate(notification.actionUrl);
        }
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button className="bell-button" onClick={handleBellClick}>
                <span className="bell-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </span>
                {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h4>Notifications</h4>
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">No notifications yet.</div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''} ${notification.actionUrl ? 'has-action' : ''}`}
                                    onClick={() => handleReadNotification(notification)}
                                >
                                    <div className="notification-item-header">
                                        <strong>{notification.title}</strong>
                                        <span className="notification-time">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="notification-body">
                                        {notification.body}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
