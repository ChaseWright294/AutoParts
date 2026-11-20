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

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
