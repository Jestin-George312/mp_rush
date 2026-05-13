const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:root@localhost:5432/mp_one'
});

async function check() {
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE uid = 4122");
    if (userRes.rows.length === 0) {
        console.log('No user with UID 4122');
    } else {
        const user = userRes.rows[0];
        console.log('User 4122:', user.email);
    }

    const taskRes = await pool.query("SELECT * FROM tasks WHERE assigned_to = $1 OR created_by = $1", [uid]);
    console.log('Tasks for UID:', taskRes.rows.map(r => ({ id: r.id, status: r.status, assigned: r.assigned_to, creator: r.created_by, project_id: r.project_id })));

    const projectRes = await pool.query("SELECT * FROM projects p JOIN group_members gm ON gm.group_id = p.group_id WHERE gm.student_id = $1", [uid]);
    console.log('Projects for UID:', projectRes.rows.map(r => ({ id: r.id, github: r.github_repo })));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
