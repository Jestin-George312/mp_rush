import pool from './src/config/db';

const checkSchema = async () => {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
        `);
        console.log('--- USERS TABLE COLUMNS ---');
        console.table(res.rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
};

checkSchema();
