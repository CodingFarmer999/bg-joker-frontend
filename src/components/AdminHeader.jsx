import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import StoreSelector from './StoreSelector';
import './AdminHeader.css';

const AdminHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('joker_token');
        if (token) {
            validateToken(token);
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
            }
        } catch (err) {
            console.error('Token validation error:', err);
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const menuItems = [
        { path: '/admin', label: '🏠 控制台首頁', exact: true },
        { path: '/admin/events', label: '📅 活動查詢與管理', exact: false },
        { path: '/admin/users', label: '👥 管理員設定', exact: true },
        { path: '/', label: '⬅️ 返回前台', exact: true }
    ];

    const handleNavigation = (path) => {
        navigate(path);
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('joker_token');
        setUser(null);
        navigate('/');
    };

    const isActive = (item) => {
        if (item.exact) {
            return location.pathname === item.path;
        }
        return location.pathname.startsWith(item.path);
    };

    return (
        <>
            <nav className="dashboard-nav admin-nav">
                <div className="admin-nav-left">
                    <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle menu">
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                    </button>
                    <div className="logo" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
                        BG Joker - Admin
                    </div>
                </div>

                <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <StoreSelector />
                    <NotificationBell />
                    {user && (
                        <span className="user-name" style={{ fontWeight: '500' }}>
                            Hi, {user.displayName || user.username}
                        </span>
                    )}
                </div>
            </nav>

            {/* Overlay */}
            <div
                className={`admin-menu-overlay ${isMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMenuOpen(false)}
            ></div>

            {/* Slide-out Sidebar */}
            <aside className={`admin-sidebar ${isMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>管理選單</h2>
                    <button className="close-btn" onClick={() => setIsMenuOpen(false)}>&times;</button>
                </div>
                <ul className="sidebar-menu">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <button
                                className={`sidebar-link ${isActive(item) ? 'active' : ''}`}
                                onClick={() => handleNavigation(item.path)}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            className="sidebar-link logout-option"
                            onClick={handleLogout}
                            style={{ color: '#ef4444', marginTop: 'auto', borderTop: '1px solid var(--glass-border)' }}
                        >
                            🚪 登出系統
                        </button>
                    </li>
                </ul>
            </aside>
        </>
    );
};

export default AdminHeader;
