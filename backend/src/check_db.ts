import pool from './config/db';

async function checkMessagesTable() {
    try {
        const res = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'messages'
            );
        `);
        console.log('Messages table exists:', res.rows[0].exists);
        
        if (res.rows[0].exists) {
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'messages';
            `);
            console.log('Columns:', columns.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkMessagesTable();
