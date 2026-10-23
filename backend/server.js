import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import { Pool } from 'pg';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)) });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required. Run `neon env pull` from the project root.');
}

const pool = new Pool({ connectionString });
pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, database: 'connected' });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(503).json({ ok: false, database: 'disconnected' });
    }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
