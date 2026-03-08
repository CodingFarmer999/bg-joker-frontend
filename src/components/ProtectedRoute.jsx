import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem('joker_token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/auth/validate', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsAuthenticated(true);
                    if (data.role === 'ROLE_ADMIN') {
                        setIsAdmin(true);
                    }
                } else {
                    localStorage.removeItem('joker_token');
                }
            } catch (err) {
                console.error('Token validation error in ProtectedRoute:', err);
            } finally {
                setIsLoading(false);
            }
        };

        validateToken();
    }, []);

    if (isLoading) {
        return (
            <div className="loader-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)' }}>
                <div className="loader"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
