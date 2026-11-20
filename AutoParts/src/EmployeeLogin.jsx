import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header.jsx'
import { useAuth } from './AuthContext.jsx';
import { loginEmployee } from './api.js';

function BackButton() {
    return (
        <Link to="/">
            <button>Login as Existing User</button>
        </Link>
    );
}

function EmployeeLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const user = await loginEmployee(username, password);
            login(user);                  // user.role is 'employee', with employee_id, store_number, is_manager
            navigate('/inventory');
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    }

    return (
        <div className="employee-login-container">
            <Header title="Employee Login"/>
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

            <p>Not an employee?</p>
            <BackButton />
        </div>
    );
}

export default EmployeeLogin
