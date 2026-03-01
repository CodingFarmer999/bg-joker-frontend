import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FcmTester from '../components/FcmTester';
import NotificationBell from '../components/NotificationBell';
import EventCalendar from '../components/EventCalendar';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('joker_token');
    if (token) {
      validateToken(token);
    } else {
      setIsLoadingUser(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        // Automatically try to get push token and send to backend
        registerFcmToken(token);
      } else {
        localStorage.removeItem('joker_token');
      }
    } catch (err) {
      console.error('Token validation error:', err);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const registerFcmToken = async (authToken) => {
    console.log('[Dashboard] Starting registerFcmToken flow...');
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        console.log('[Dashboard] Notification permission is:', Notification.permission);
        if (Notification.permission === 'granted') {
          console.log('[Dashboard] Permission is granted, attempting to get Firebase token...');
          import('firebase/messaging').then(async ({ getToken }) => {
            const { messaging } = await import('../firebase');
            const VAPID_KEY = 'BARtYAZpbdC3YjphAm3xkjT57oxzne4MAMkJ-dUlJxy8hBVRxyDuwpY_i8XovoFKFHvlKjJ5glK7iiFzHv6SCN4';
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            console.log('[Dashboard] Retrieved FCM token:', token ? 'Success' : 'Failed/Empty');
            if (token) {
              // Send to backend
              console.log('[Dashboard] Sending FCM token to backend...');
              fetch('/api/users/fcm-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ token: token, deviceType: 'WEB' })
              }).then(res => {
                console.log('[Dashboard] Backend FCM API response status:', res.status);
              }).catch(err => console.error('[Dashboard] Failed to send FCM token to backend', err));
            }
          }).catch(err => console.error('[Dashboard] Failed to load firebase messaging', err));
        } else {
          console.log('[Dashboard] Notification permission is not granted. Cannot auto-register FCM token.');
        }
      } else {
        console.log('[Dashboard] window or Notification not supported in browser environment');
      }
    } catch (e) {
      console.error('[Dashboard] FCM Token registration error', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('joker_token');
    setUser(null);
    navigate('/');
  };

  const mockStats = [
    { label: 'Total Reservations', value: '128', change: '+12%', icon: '📅' },
    { label: 'Active Games', value: '24', change: '+5%', icon: '🎲' },
    { label: 'Total Players', value: '1,024', change: '+18%', icon: '👥' },
    { label: 'Revenue (Mock)', value: '$12.5k', change: '+10%', icon: '💰' },
  ];

  const mockGames = [
    { id: 1, name: 'Catan', category: 'Strategy', status: 'Available' },
    { id: 2, name: 'Splendor', category: 'Family', status: 'In Use' },
    { id: 3, name: 'Pandemic', category: 'Cooperative', status: 'Available' },
    { id: 4, name: 'Ticket to Ride', category: 'Family', status: 'Maintenance' },
  ];

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="logo">BG Joker</div>
        <div className="nav-actions">
          {isLoadingUser ? (
            <div className="loader-small"></div>
          ) : user ? (
            <div className="user-profile-header">
              <NotificationBell />
              {/* 目前為了方便你測試，只要登入就會顯示 Admin 按鈕。之後可以改成 user.role === 'ROLE_ADMIN' 才顯示 */}
              <button
                className="login-btn"
                onClick={() => navigate('/admin')}
                style={{ marginRight: '1rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
              >
                Admin Panel
              </button>
              <span className="user-name">Hi, {user.displayName || user.username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="content-header">
          <h1>Welcome to BG Joker Dashboard</h1>
          <p>Real-time analytics and management overview.</p>
        </header>

        <section className="stats-grid">
          {mockStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <h3>{stat.label}</h3>
                <div className="stat-val-row">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-change">{stat.change}</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        <EventCalendar />

        <section className="fcm-test-section">
          <FcmTester />
        </section>
      </main>

      {/* Decorative elements */}
    </div>
  );
};

export default Dashboard;
