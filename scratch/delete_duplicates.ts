import pool from '../backend/src/config/db';

async function deleteDuplicates() {
    try {
        console.log('Connecting to db...');
        
        // Find duplicate extension requests first since they reference deadlines
        console.log('Deleting duplicate extension requests...');
        await pool.query(`
            DELETE FROM extension_requests 
            WHERE id NOT IN (
                SELECT MAX(id) 
                FROM extension_requests 
                GROUP BY group_id, deadline_id
            )
        `);

        // Now delete duplicate deadlines
        console.log('Deleting duplicate deadlines...');
        await pool.query(`
            DELETE FROM deadlines 
            WHERE id NOT IN (
                SELECT MAX(id) 
                FROM deadlines 
                GROUP BY batch_id, title
            )
        `);
        
        console.log('Duplicates successfully deleted');
    } catch (err) {
        console.error('Error deleting duplicates:', err);
    } finally {
        process.exit(0);
    }
}

deleteDuplicates();
