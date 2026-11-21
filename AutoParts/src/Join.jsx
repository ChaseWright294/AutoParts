import { Link } from 'react-router-dom';
import Header from './Header.jsx'
import { useState } from 'react'
import { registerCustomer } from './api.js';
import './Join.css';

function BackButton() {
    return (
        <Link to="/">
            <button>Login as Existing User</button>
        </Link>
    );
}

function Join() {
    const [form, setForm] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        street: '',
        city: '',
        state: '',
        zip: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm(current => ({ ...current, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await registerCustomer(form);
            setSuccess('Account created. You can now log in.');
            setForm({
                username: '',
                password: '',
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                street: '',
                city: '',
                state: '',
                zip: '',
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="join-container">
            <Header title="Join" />

            <form onSubmit={handleSubmit} className='join-form'>
                <label>
                    First name:
                    <input name="first_name" value={form.first_name}
                        onChange={handleChange} autoComplete="given-name" required />
                </label>

                <label>
                    Last name:
                    <input name="last_name" value={form.last_name}
                        onChange={handleChange} autoComplete="family-name" required />
                </label>

                <label>
                    Email:
                    <input name="email" type="email" value={form.email}
                        onChange={handleChange} autoComplete="email" required />
                </label>

                <label>
                    Phone number:
                    <input name="phone_number" type="tel" value={form.phone_number}
                        onChange={handleChange} autoComplete="tel"
                        inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
                        title="Enter a 10-digit phone number" required />
                </label>

                <label>
                    Street address:
                    <input name="street" value={form.street}
                        onChange={handleChange} autoComplete="street-address" required />
                </label>

                <label>
                    City:
                    <input name="city" value={form.city}
                        onChange={handleChange} autoComplete="address-level2" required />
                </label>

                <label>
                    State:
                    <input name="state" value={form.state}
                        onChange={handleChange} autoComplete="address-level1"
                        maxLength={2} required />
                </label>

                <label>
                    ZIP code:
                    <input name="zip" value={form.zip}
                        onChange={handleChange} autoComplete="postal-code" required />
                </label>

                <label>
                    Username:
                    <input name="username" value={form.username}
                        onChange={handleChange} autoComplete="username" required />
                </label>

                <label>
                    Password:
                    <input name="password" type="password" value={form.password}
                        onChange={handleChange} autoComplete="new-password" required />
                </label>

                {error && <p role="alert">{error}</p>}
                {success && <p role="status">{success}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? 'Creating account...' : 'Create Account'}
                </button>
            </form>

            <p>Already have an account?</p>
            <BackButton />
        </div>
    );
}

export default Join;