import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export default async () => {
    console.log('\n[Global Setup] Creating test database...');
    
    // Connect to the default 'postgres' database to create the test DB
    const client = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || 'root',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres',
    });

    await client.connect();
    
    // Drop test database if exists to ensure clean state
    await client.query('DROP DATABASE IF EXISTS mp_rush_test');
    await client.query('CREATE DATABASE mp_rush_test');
    
    await client.end();
    console.log('[Global Setup] Test database created successfully.\n');
};
