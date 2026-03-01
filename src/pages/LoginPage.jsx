import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import lineLogo from '../assets/line-login.png'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    // Check for token on mount
    useEffect(() => {
        const token = localStorage.getItem('joker_token')
        if (token) {
            setIsLoggedIn(true)
        }
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username: email,
                    password: password,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                localStorage.setItem('joker_token', data.token)
                setIsLoggedIn(true)
            } else {
                const errorText = await response.text()
                setError(errorText || 'Invalid email or password')
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('Unable to connect to the server. Please try again later.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLineLogin = () => {
        window.location.href = '/oauth2/authorization/line';
    };

    const handleLogout = () => {
        localStorage.removeItem('joker_token')
        setIsLoggedIn(false)
    }

    const goToDashboard = () => {
        navigate('/')
    }

    if (isLoggedIn) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <div className="login-header">
                        <h1>BG Joker</h1>
                        <p>You are successfully logged in!</p>
                    </div>
                    <button onClick={goToDashboard} className="login-button" style={{ width: '100%', marginBottom: '12px', background: 'var(--text-muted)' }}>
                        Back to Dashboard
                    </button>
                    <button onClick={handleLogout} className="login-button" style={{ width: '100%' }}>
                        Log Out
                    </button>
                </div>
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>
        )
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div onClick={goToDashboard} style={{ cursor: 'pointer' }}>
                        <h1>BG Joker</h1>
                    </div>
                    <p>Welcome back! Please login to your account.</p>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="text"
                            id="email"
                            placeholder="請輸入信箱 或 帳號"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="divider">
                    <span>or continue with</span>
                </div>

                <div className="social-login">
                    <button type="button" className="line-login-button" onClick={handleLineLogin}>
                        <img src={lineLogo} alt="LINE Login" />
                        <span>Login with LINE</span>
                    </button>
                </div>

                <div className="login-footer">
                    <p>Don't have an account? <span onClick={() => navigate('/register')} style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}>Sign up</span></p>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
        </div>
    )
}

export default LoginPage
