import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

// DATABASE_URL comes from the repo-root .env.local created by `neon env pull`
// (or from the environment when deployed). Never commit that file.
config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)), quiet: true });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Run `neon env pull` in the repo root to create .env.local.');
}

// One shared connection pool for the whole backend.
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
});

// Parameterized query helper: always pass user input as params ($1, $2, ...).
export const query = (text, params) => pool.query(text, params);

export default pool;
