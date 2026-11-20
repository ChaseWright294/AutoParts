import cors from 'cors';
import express from 'express';
import pool, { query } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

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

// Get inventory for every store
app.get('/api/inventory', async (_req, res) => {
    try {
        const { rows } = await query(`
            SELECT i.store_number, i.part_id, p.name,
                   i.quantity, p.price
            FROM inventory i
            JOIN part p ON i.part_id = p.part_id
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

// Create order / checkout (supports online/in-store orders and optional reorders)
app.post('/api/orders', async (req, res) => {
    const {
        order_id,
        customer_username,
        store_number,
        employee_id,
        is_online = false,
        reorder_of = null,
        payment_method = 'card',
        card_num = null,
        items = [],
    } = req.body;

    if (!customer_username || !store_number || !employee_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing required order fields or items' });
    }

    const finalOrderId = String(order_id || `ord_${Date.now()}`).slice(0, 32);
    const normalizedCardNum =
        payment_method === 'cash' || !card_num ? null : String(card_num).slice(-12);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

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
            [finalOrderId, reorder_of, customer_username, store_number, Boolean(is_online), employee_id]
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

// Reporting: sales summary + low-stock inventory
app.get('/api/reports/summary', async (_req, res) => {
    try {
        const salesRes = await query(`
            SELECT COUNT(DISTINCT o.order_id)::INT AS total_orders,
                   COALESCE(SUM(oi.quantity * oi.unit_price), 0)::NUMERIC(10,2) AS total_revenue
            FROM orders o
            LEFT JOIN order_item oi ON oi.order_id = o.order_id
            WHERE o.status <> 'cancelled'
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

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});