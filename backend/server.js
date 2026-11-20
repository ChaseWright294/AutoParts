import cors from 'cors';
import express from 'express';
import { query } from './db.js';
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


const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
