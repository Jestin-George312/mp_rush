/**
 * AI Module — Database Connection
 * Re-exports the pool from the backend to avoid duplicate pg dependency.
 */
import pool from '../../../backend/src/config/db';
export default pool;
