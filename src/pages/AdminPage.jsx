import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import './Dashboard.css';

const AdminPage = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('News Update');
    const [body, setBody] = useState('This is a group broadcast message from Admin!');
    const [status, setStatus] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleBroadcast = async () => {
        if (!title || !body) return;
        setIsSending(true);
        setStatus('Sending broadcast...');

        try {
            const response = await fetch('/api/test/fcm/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, body })
            });

            if (response.ok) {
                const resultText = await response.text();
                setStatus(`Success: ${resultText}`);
            } else {
                setStatus(`Error: Received status ${response.status} from backend.`);
            }
        } catch (error) {
            setStatus(`Error calling backend: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="logo">BG Joker - Admin</div>
                <div className="nav-actions" style={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationBell />
                    <button className="login-btn" onClick={() => navigate('/')}>
                        Back to Dashboard
                    </button>
                </div>
            </nav>

            <main className="dashboard-content">
                <header className="content-header">
                    <h1>Admin Control Panel</h1>
                    <p>Mock page for administrative actions, user management, and system settings.</p>
                </header>

                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <h3>System Load</h3>
                            <div className="stat-val-row">
                                <span className="stat-value">42%</span>
                                <span className="stat-change">Normal</span>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🔔</div>
                        <div className="stat-info">
                            <h3>Pending Alerts</h3>
                            <div className="stat-val-row">
                                <span className="stat-value">3</span>
                                <span className="stat-change" style={{ color: 'var(--primary)' }}>Attention</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="table-section">
                    <div className="section-header">
                        <h2>User Management (Mock)</h2>
                    </div>
                    <div className="table-container">
                        <table className="mock-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>#1</td>
                                    <td>guybrush</td>
                                    <td><span className="status-badge available">ADMIN</span></td>
                                    <td><button className="login-btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit</button></td>
                                </tr>
                                <tr>
                                    <td>#2</td>
                                    <td>codingfarmer999</td>
                                    <td><span className="status-badge maintenance">USER</span></td>
                                    <td><button className="login-btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit</button></td>
                                </tr>
                                <tr>
                                    <td>#3</td>
                                    <td>line_User123</td>
                                    <td><span className="status-badge maintenance">USER</span></td>
                                    <td><button className="login-btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="table-section" style={{ marginTop: '2rem' }}>
                    <div className="section-header">
                        <h2>Group Broadcast Notifications</h2>
                    </div>
                    <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <p style={{ marginBottom: '15px' }}>Send a push notification to all registered devices.</p>

                        <div className="input-group" style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white' }}
                                disabled={isSending}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Message Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', minHeight: '80px', fontFamily: 'inherit' }}
                                disabled={isSending}
                            />
                        </div>

                        <button
                            className="login-btn"
                            style={{ padding: '10px 20px', background: '#4caf50', borderColor: '#4caf50' }}
                            onClick={handleBroadcast}
                            disabled={isSending || !title || !body}
                        >
                            {isSending ? 'Sending...' : 'Broadcast to All Devices'}
                        </button>

                        {status && (
                            <div style={{ marginTop: '15px', padding: '10px', borderRadius: '4px', backgroundColor: status.startsWith('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(76, 175, 80, 0.2)', color: status.startsWith('Error') ? '#ef4444' : '#4caf50', fontSize: '0.875rem' }}>
                                {status}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Decorative elements */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
        </div>
    );
};

export default AdminPage;
