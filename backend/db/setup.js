// Builds the AutoParts database from scratch: schema.sql, views.sql, seed.sql.
//
// Usage (from backend/):  npm run db:setup
//
// Meant for an EMPTY database, such as a personal Neon branch
// (`neon checkout <name>` then `neon env pull`). It refuses to run if the
// tables already exist, so it can never overwrite the shared data.
import { readFile } from 'node:fs/promises';
import pool from '../db.js';

const files = ['schema.sql', 'views.sql', 'seed.sql'];

const client = await pool.connect();
try {
    const { rows } = await client.query(`SELECT to_regclass('public.part') AS existing`);
    if (rows[0].existing) {
        console.error('Tables already exist in this database. Nothing was changed.');
        console.error('To start fresh, point .env.local at a new, empty Neon branch.');
        process.exitCode = 1;
    } else {
        await client.query('BEGIN');
        for (const file of files) {
            const sql = await readFile(new URL(file, import.meta.url), 'utf8');
            await client.query(sql);
            console.log(`Ran ${file}`);
        }
        await client.query('COMMIT');
        console.log('Database is ready.');
    }
} catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Setup failed, all changes were rolled back:', error.message);
    process.exitCode = 1;
} finally {
    client.release();
    await pool.end();
}
