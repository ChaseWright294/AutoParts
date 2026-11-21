import cors from 'cors';
import express from 'express';
import pool, { query } from './db.js';
import authRoutes from './routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
// Confirms the API can reach the Neon database.
app.get('/api/health', async (_req, res) => {
    try {
        await query('SELECT 1');
        res.json({ ok: true, database: 'connected' });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(503).json({ ok: false, database: 'disconnected' });
    }
});

// Catalog: every part with its total stock across all stores.
app.get('/api/parts', async (_req, res) => {
    try {
        const { rows } = await query(`
            SELECT p.part_id, p.name, p.description, p.price, p.part_condition,
                   COALESCE(SUM(i.quantity), 0)::INT AS in_stock
            FROM part p
            LEFT JOIN inventory i ON i.part_id = p.part_id
            GROUP BY p.part_id
            ORDER BY p.part_id`);
        res.json(rows);
    } catch (error) {
        console.error('Failed to load parts:', error);
        res.status(500).json({ error: 'Failed to load parts' });
    }
});


app.get('/api/parts/:id', async (_req, res) => {
    const partID = Number(_req.params.id);

    if (!Number.isInteger(partID)) {
        return res.status(400).json({ error: 'Invalid part ID'});
    }

    try {
        const { rows } = await query(`
            SELECT p.part_id, p.name, p.description, p.price, p.part_condition,
                   COALESCE(SUM(i.quantity), 0)::INT AS in_stock
            FROM part p
            LEFT JOIN inventory i ON i.part_id = p.part_id
            WHERE p.part_id = $1
            GROUP BY p.part_id
        `, [partID]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Part not found'})
        }

        res.json(rows[0])
    } catch (error) {
        console.error('Failed to load part:,', error);
        res.status(500).json({ error: 'Failed to load part'});
    }
})

 

app.get('/api/inventory', async (_req, res) => {
    try {
        const { rows } = await query(`
            SELECT i.store_number, i.part_id, p.name,
                   i.quantity, p.price,
                   s.street, s.city, s.state, s.zip
            FROM inventory i
            JOIN part p ON i.part_id = p.part_id
            JOIN store s ON i.store_number = s.store_number
            ORDER BY i.store_number, i.part_id
        `);
        res.json(rows);
    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).json({ error: 'Failed to retrieve inventory' });
    }
});


// Get all orders
app.get('/api/orders', async (_req, res) => {
    try {
        const { rows } = await query(`
            SELECT order_id, customer_username, store_number,
                   order_date, status, is_online
            FROM orders
            ORDER BY order_date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Orders error:', error);
        res.status(500).json({ error: 'Failed to retrieve orders' });
    }
});

// Get one order and its items
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT * FROM orders WHERE order_id = $1',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const items = await query(`
            SELECT oi.part_id, p.name, oi.quantity, oi.unit_price
            FROM order_item oi
            JOIN part p ON oi.part_id = p.part_id
            WHERE oi.order_id = $1
            ORDER BY oi.part_id
        `, [req.params.id]);

        res.json({
            ...rows[0],
            items: items.rows
        });
    } catch (error) {
        console.error('Order details error:', error);
        res.status(500).json({ error: 'Failed to retrieve order details' });
    }
});

// Create order / checkout for online/in-store orders and optional reorders
app.post('/api/orders', async (req, res) => {
    const {
        order_id,
        customer_username,
        store_number,
        employee_id = null,
        is_online = false,
        reorder_of = null,
        payment_method = 'card',
        card_num = null,
        items = [],
    } = req.body;

    if (!customer_username || !store_number || (!is_online && !employee_id) || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing required order fields or items' });
    }

    const finalOrderId = String(order_id || `ord_${Date.now()}`).slice(0, 32);
    const normalizedCardNum =
        payment_method === 'cash' || !card_num ? null : String(card_num).slice(-12);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let resolvedEmployeeId = employee_id ? Number(employee_id) : null;
        if (!resolvedEmployeeId) {
            const empRes = await client.query(
                `SELECT COALESCE(s.manager_id, e.employee_id) AS emp_id
                 FROM store s
                 LEFT JOIN employee e ON e.store_number = s.store_number
                 WHERE s.store_number = $1
                 ORDER BY e.employee_id ASC
                 LIMIT 1`,
                [store_number]
            );
            if (empRes.rowCount === 0 || !empRes.rows[0].emp_id) {
                throw new Error('NO_EMPLOYEE_AVAILABLE');
            }
            resolvedEmployeeId = Number(empRes.rows[0].emp_id);
        }

        let totalAmount = 0;
        const resolvedItems = [];

        for (const item of items) {
            const partId = Number(item.part_id);
            const qty = Number(item.quantity);
            if (!Number.isInteger(partId) || !Number.isInteger(qty) || qty <= 0) {
                throw new Error('INVALID_ITEM');
            }

            const partRes = await client.query(
                'SELECT part_id, price FROM part WHERE part_id = $1',
                [partId]
            );
            if (partRes.rowCount === 0) {
                throw new Error('PART_NOT_FOUND');
            }

            const unitPrice = Number(partRes.rows[0].price);
            totalAmount += unitPrice * qty;
            resolvedItems.push({ partId, qty, unitPrice });

            const invRes = await client.query(
                `UPDATE inventory
                 SET quantity = quantity - $1
                 WHERE store_number = $2 AND part_id = $3 AND quantity >= $1`,
                [qty, store_number, partId]
            );
            if (invRes.rowCount === 0) {
                throw new Error('INSUFFICIENT_STOCK');
            }
        }

        await client.query(
            `INSERT INTO orders (order_id, reorder_of, customer_username, store_number, is_online, status, employee_id)
             VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
            [finalOrderId, reorder_of, customer_username, store_number, Boolean(is_online), resolvedEmployeeId]
        );

        for (const rItem of resolvedItems) {
            await client.query(
                `INSERT INTO order_item (order_id, part_id, quantity, unit_price)
                 VALUES ($1, $2, $3, $4)`,
                [finalOrderId, rItem.partId, rItem.qty, rItem.unitPrice]
            );
        }

        const paymentId = `pay_${finalOrderId}`.slice(0, 32);
        await client.query(
            `INSERT INTO payment (payment_id, order_id, method, amount, card_num, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [paymentId, finalOrderId, payment_method, totalAmount.toFixed(2), normalizedCardNum]
        );

        await client.query('COMMIT');
        res.status(201).json({ order_id: finalOrderId, total: totalAmount.toFixed(2), status: 'pending' });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.message === 'INSUFFICIENT_STOCK') {
            return res.status(409).json({ error: 'Insufficient store inventory for one or more items' });
        }
        if (error.message === 'PART_NOT_FOUND' || error.message === 'INVALID_ITEM') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'NO_EMPLOYEE_AVAILABLE') {
            return res.status(400).json({ error: 'No employee found for store to assign order' });
        }
        console.error('Checkout failed:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        client.release();
    }
});

// Cancel an order and restore store inventory
app.patch('/api/orders/:id/cancel', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderRes = await client.query(
            'SELECT order_id, store_number, status FROM orders WHERE order_id = $1 FOR UPDATE',
            [req.params.id]
        );
        if (orderRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderRes.rows[0];
        if (order.status === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Order is already cancelled' });
        }
        if (['completed', 'shipped', 'returned'].includes(order.status)) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: `Cannot cancel an order with status '${order.status}'` });
        }

        const itemsRes = await client.query(
            'SELECT part_id, quantity FROM order_item WHERE order_id = $1',
            [order.order_id]
        );

        for (const item of itemsRes.rows) {
            await client.query(
                `UPDATE inventory
                 SET quantity = quantity + $1
                 WHERE store_number = $2 AND part_id = $3`,
                [item.quantity, order.store_number, item.part_id]
            );
        }

        await client.query(
            `UPDATE orders SET status = 'cancelled' WHERE order_id = $1`,
            [order.order_id]
        );
        await client.query(
            `UPDATE payment SET status = 'cancelled' WHERE order_id = $1`,
            [order.order_id]
        );

        await client.query('COMMIT');
        res.json({ order_id: order.order_id, status: 'cancelled' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to cancel order:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    } finally {
        client.release();
    }
});

// Reporting: realized sales summary (excludes pending & cancelled) + low-stock inventory
app.get('/api/reports/summary', async (_req, res) => {
    try {
        const salesRes = await query(`
            SELECT COUNT(DISTINCT o.order_id)::INT AS total_orders,
                   COALESCE(SUM(oi.quantity * oi.unit_price), 0)::NUMERIC(10,2) AS total_revenue
            FROM orders o
            LEFT JOIN order_item oi ON oi.order_id = o.order_id
            WHERE o.status IN ('paid', 'processing', 'shipped', 'completed')
        `);
        const lowStockRes = await query(`
            SELECT i.store_number, p.part_id, p.name, i.quantity
            FROM inventory i
            JOIN part p ON p.part_id = i.part_id
            WHERE i.quantity <= 5
            ORDER BY i.quantity ASC, i.store_number ASC
        `);
        res.json({
            sales: salesRes.rows[0],
            low_stock: lowStockRes.rows,
        });
    } catch (error) {
        console.error('Failed to generate report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Manager view: list employees
app.get('/api/employees', async (req, res) => {
    try {
        const { store_number } = req.query;
        const sql = store_number
            ? `SELECT employee_id, username, first_name, last_name, work_email, phone_number, store_number
               FROM employee WHERE store_number = $1 ORDER BY employee_id ASC`
            : `SELECT employee_id, username, first_name, last_name, work_email, phone_number, store_number
               FROM employee ORDER BY employee_id ASC`;
        const params = store_number ? [Number(store_number)] : [];
        const { rows } = await query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Manager view: add employee
app.post('/api/employees', async (req, res) => {
    const {
        employee_id,
        username,
        password,
        password_hash,
        first_name,
        last_name,
        work_email,
        phone_number,
        store_number = null,
    } = req.body;

    const hashValue = password_hash || password;
    if (!username || !hashValue || !first_name || !last_name || !work_email || !phone_number) {
        return res.status(400).json({ error: 'Missing required employee fields' });
    }

    try {
        const nextIdRes = employee_id
            ? { rows: [{ next_id: Number(employee_id) }] }
            : await query('SELECT COALESCE(MAX(employee_id), 0) + 1 AS next_id FROM employee');
        const newEmpId = Number(nextIdRes.rows[0].next_id);

        const { rows } = await query(
            `INSERT INTO employee (employee_id, username, password_hash, first_name, last_name, work_email, phone_number, store_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING employee_id, username, first_name, last_name, work_email, phone_number, store_number`,
            [
                newEmpId,
                String(username).trim(),
                String(hashValue),
                String(first_name).trim(),
                String(last_name).trim(),
                String(work_email).trim(),
                String(phone_number).trim(),
                store_number ? Number(store_number) : null,
            ]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Employee ID, username, or work email already exists' });
        }
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid store_number' });
        }
        console.error('Failed to add employee:', error);
        res.status(500).json({ error: 'Failed to add employee' });
    }
});

// Manager view: remove employee
app.delete('/api/employees/:id', async (req, res) => {
    const empId = Number(req.params.id);
    if (!Number.isInteger(empId)) {
        return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'UPDATE store SET manager_id = NULL WHERE manager_id = $1',
            [empId]
        );

        const delRes = await client.query(
            `DELETE FROM employee
             WHERE employee_id = $1
             RETURNING employee_id, username`,
            [empId]
        );

        if (delRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found' });
        }

        await client.query('COMMIT');
        res.json({ deleted: true, employee: delRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Cannot delete employee referenced by existing orders' });
        }
        console.error('Failed to delete employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    } finally {
        client.release();
    }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});