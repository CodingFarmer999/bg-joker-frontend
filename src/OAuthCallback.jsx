import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Store the token in localStorage
            localStorage.setItem('joker_token', token);

            // Redirect to home/dashboard
            navigate('/', { replace: true });
        } else {
            setError('Login failed. No token received from server.');
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 3000);
        }
    }, [searchParams, navigate]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--bg-gradient)',
            color: 'white'
        }}>
            {error ? (
                <div style={{ color: '#ef4444' }}>{error}</div>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h2>Authenticating...</h2>
                    <p className="text-muted mt-2">Please wait while we log you in.</p>
                </div>
            )}
        </div>
    );
};

export default OAuthCallback;
