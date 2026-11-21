import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// One message for both "no such user" and "wrong password",
// so nobody can use the login form to find out which usernames exist.
const INVALID_LOGIN = { error: 'Invalid username or password' };

// Pulls username/password out of the request body.
// Sends a 400 and returns null if either is missing.
function readCredentials(req, res) {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return null;
    }
    return { username, password };
}

// POST /api/auth/customer/login
router.post('/customer/login', async (req, res) => {
    const creds = readCredentials(req, res);
    if (!creds) return;

    try {
        const { rows } = await query(
            `SELECT username, first_name, last_name, email, phone_number, street, city, state, zip
             FROM customer
             WHERE username = $1 AND password_hash = $2`,
            [creds.username, creds.password]
        );
        if (rows.length === 0) return res.status(401).json(INVALID_LOGIN);
        res.json({ role: 'customer', ...rows[0] });
    } catch (error) {
        console.error('Customer login failed:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/employee/login
router.post('/employee/login', async (req, res) => {
    const creds = readCredentials(req, res);
    if (!creds) return;

    try {
        const { rows } = await query(
            `SELECT e.employee_id, e.username, e.first_name, e.last_name, e.work_email, e.store_number,
                    EXISTS (SELECT 1 FROM store s WHERE s.manager_id = e.employee_id) AS is_manager
             FROM employee e
             WHERE e.username = $1 AND e.password_hash = $2`,
            [creds.username, creds.password]
        );
        if (rows.length === 0) return res.status(401).json(INVALID_LOGIN);
        res.json({ role: 'employee', ...rows[0] });
    } catch (error) {
        console.error('Employee login failed:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// register a new customer
router.post('/customer/register', async (req, res) => {
    const { username, password, first_name, last_name, email, phone_number, street, city, state, zip } = req.body ?? {};

    if (![username, password, first_name, last_name, email, phone_number, street, city, state, zip]
        .every(value => typeof value === 'string' && value.trim())) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!/^\d{10}$/.test(phone_number.trim())) {
        return res.status(400).json({ error: 'Phone number must contain 10 digits' });
    }

    try {
        const { rows } = await query(
            `INSERT INTO customer (username, password_hash, first_name, last_name, email, phone_number, street, city, state, zip)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING username, first_name, last_name, email, phone_number, street, city, state, zip`,
            [username.trim(), password, first_name.trim(), last_name.trim(), email.trim(), phone_number.trim(), street.trim(), city.trim(), state.trim(), zip.trim()]
        );

        return res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Username, email, or phone number is already in use' });
        }
        console.error('Customer registration failed:', error);
        return res.status(500).json({ error: 'Failed to create customer' });
    }
});

export default router;
