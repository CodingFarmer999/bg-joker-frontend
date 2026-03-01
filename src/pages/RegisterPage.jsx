import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

function RegisterPage() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    displayName: displayName || username // fallback to username if empty
                }),
            })

            if (response.ok) {
                setSuccess(true)
            } else {
                const errorText = await response.text()
                setError(errorText || 'Registration failed. Please try again.')
            }
        } catch (err) {
            console.error('Registration error:', err)
            setError('Unable to connect to the server. Please try again later.')
        } finally {
            setIsLoading(false)
        }
    }

    const goToLogin = () => {
        navigate('/login')
    }

    if (success) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <div className="login-header">
                        <h2>Registration Successful!</h2>
                        <p>Welcome to BG Joker, {displayName || username}.</p>
                    </div>
                    <button onClick={goToLogin} className="login-button" style={{ width: '100%', marginTop: '20px' }}>
                        Go to Login
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
                    <h2>Create an Account</h2>
                    <p>Join BG Joker to reserve games and get push notifications!</p>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

                <form className="login-form" onSubmit={handleRegister}>
                    <div className="input-group">
                        <label htmlFor="username">Username (Account ID)</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="e.g. boardgamer99"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="hello@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="displayName">Display Name (Optional)</label>
                        <input
                            type="text"
                            id="displayName"
                            placeholder="How others see you"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
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

                    <button type="submit" className="login-button" disabled={isLoading} style={{ marginTop: '10px' }}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="login-footer" style={{ marginTop: '20px' }}>
                    <p>Already have an account? <span onClick={goToLogin} style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}>Sign In</span></p>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
        </div>
    )
}

export default RegisterPage
