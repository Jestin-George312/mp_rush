import pool from './src/config/db';
import bcrypt from 'bcrypt';

const usersToAdd = [
  { email: 'admin_new@test.apms', role: 'admin' },
  { email: 'coord_new@test.apms', role: 'coordinator' },
  { email: 'guide1_new@t.a', role: 'guide' },
  { email: 'guide2_new@t.a', role: 'guide' },
  { email: 'student1_new@t.a', role: 'student' },
  { email: 'student2_new@t.a', role: 'student' },
  { email: 'student3_new@t.a', role: 'student' },
  { email: 'student4_new@t.a', role: 'student' },
  { email: 'student5_new@t.a', role: 'student' },
  { email: 'student6_new@t.a', role: 'student' },
  { email: 'student7_new@t.a', role: 'student' },
  { email: 'student8_new@t.a', role: 'student' },
  { email: 'student9_new@t.a', role: 'student' },
  { email: 'student10_new@t.a', role: 'student' },
  { email: 'student11_new@t.a', role: 'student' },
  { email: 'student12_new@t.a', role: 'student' },
  { email: 'student13_new@t.a', role: 'student' },
  { email: 'student14_new@t.a', role: 'student' },
  { email: 'student15_new@t.a', role: 'student' }
];

const seedUsers = async () => {
    try {
        console.log('🚀 Starting to add users...');
        const saltRounds = 10;
        const defaultPassword = await bcrypt.hash('pass123', saltRounds);

        for (const u of usersToAdd) {
            // Check if user exists
            const existing = await pool.query("SELECT uid FROM users WHERE email = $1", [u.email]);
            if (existing.rows.length > 0) {
                console.log(`User ${u.email} already exists, skipping.`);
                continue;
            }

            // Insert user
            const res = await pool.query(
                "INSERT INTO users (email, password_hash, role, auth_provider) VALUES ($1, $2, $3, 'local') RETURNING uid",
                [u.email, defaultPassword, u.role]
            );
            const uid = res.rows[0].uid;

            // Generate a default name from email (e.g. "admin_new")
            const defaultName = u.email.split('@')[0];

            // Insert profile
            await pool.query(
                "INSERT INTO profiles (u_id, full_name, department) VALUES ($1, $2, 'Computer Applications')",
                [uid, defaultName]
            );
            console.log(`✅ Added user: ${u.email} as ${u.role}`);
        }
        console.log('🎉 Finished adding users successfully!');
    } catch (error) {
        console.error('❌ Failed to add users:', error);
    } finally {
        await pool.end();
        process.exit();
    }
};

seedUsers();
