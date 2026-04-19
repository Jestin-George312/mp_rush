import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export default async () => {
    console.log('\n[Global Teardown] Dropping test database...');
    
    const client = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || 'root',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres',
    });

    await client.connect();
    
    // Terminate other connections so we can drop the DB
    await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'mp_rush_test'
        AND pid <> pg_backend_pid();
    `);

    await client.query('DROP DATABASE IF EXISTS mp_rush_test');
    
    await client.end();
    console.log('[Global Teardown] Test database dropped successfully.\n');
};
