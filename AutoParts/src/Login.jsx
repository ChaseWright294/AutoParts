import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header.jsx'
import { useAuth } from './AuthContext.jsx';
import { loginCustomer } from './api.js';

function JoinButton() {
    return (
        <Link to="/join">
            <button>Create Account</button>
        </Link>
    );
}

function EmployeeLoginButton() {
    return (
        <Link to="/employee-login">
            <button>Employee Login</button>
        </Link>
    );
}

function Login() {
	const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();          // stop the browser's default full-page form submit
        setError(null);
        setSubmitting(true);
        try {
            const user = await loginCustomer(username, password);
            login(user);                 // save to context + localStorage
            navigate('/home');
        } catch (err) {
            setError(err.message);       // e.g. "Invalid username or password"
            setSubmitting(false);
        }
    }

    return (
        <div className="login-container">
            <Header title="Login"/>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username: <input type="text" name="username" autoComplete="username"
                        value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
                </div>
                <div>
                    <label>Password: <input type="password" name="password" autoComplete="current-password"
                        value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
                </div>
                {error && <p role="alert">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Logging in…' : 'Login'}
                </button>
            </form>

            <p>Don't have an account?</p>
            <JoinButton />

            <p>For Staff Members</p>
            <EmployeeLoginButton />
        </div>
    );
}

export default Login