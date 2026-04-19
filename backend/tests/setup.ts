import pool from '../src/config/db';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Force test env specific connection settings before app loads
dotenv.config();
process.env.DB_NAME = 'mp_rush_test';
process.env.JWT_SECRET = 'test_secret_123';

beforeAll(async () => {
    console.log('[Setup] Applying migrations to test database...');
    const migrationPath = path.join(__dirname, '../migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // We add users and profiles since they are listed in my previous schema response
    const initSql = `
        DROP TYPE IF EXISTS user_role CASCADE;
        CREATE TYPE user_role AS ENUM ('student', 'guide', 'coordinator', 'admin');
        CREATE TABLE IF NOT EXISTS users (
            uid SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
            role user_role NOT NULL DEFAULT 'student',
            is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS profiles (
            u_id INTEGER PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
            full_name VARCHAR(255) NOT NULL,
            profile_img VARCHAR(500),
            department VARCHAR(100),
            phone VARCHAR(20),
            bio TEXT,
            location VARCHAR(255)
        );
    `;

    // Drop schema public and rebuild it
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await pool.query(initSql);
    await pool.query(sql);
});

afterAll(async () => {
    // End the pool gracefully so tests don't hang
    await pool.end();
});
