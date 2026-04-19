import pool from '../../config/db';

export const createBatch = async (data: { name: string; start_year: number; end_year: number }) => {
    const result = await pool.query(
        `INSERT INTO batches (name, start_year, end_year)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.name, data.start_year, data.end_year]
    );
    return result.rows[0];
};

export const listBatches = async () => {
    const result = await pool.query(`SELECT * FROM batches ORDER BY start_year DESC`);
    return result.rows;
};

export const updateBatch = async (batchId: number, data: { name?: string; is_active?: boolean }) => {
    const result = await pool.query(
        `UPDATE batches 
         SET 
            name = COALESCE($1, name),
            is_active = COALESCE($2, is_active)
         WHERE id = $3
         RETURNING *`,
        [data.name ?? null, data.is_active ?? null, batchId]
    );
    if (result.rows.length === 0) throw new Error('Batch not found');
    return result.rows[0];
};
