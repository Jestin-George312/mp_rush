const axios = require('axios');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:root@localhost:5432/mp_one' });
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const userRes = await pool.query("SELECT uid, email, role FROM users WHERE email = 'student1@test.apms'");
    const user = userRes.rows[0];
    const token = jwt.sign({ id: user.uid, email: user.email, role: user.role }, 'supersecretkey');
    
    console.log('Calling API...');
    const res = await axios.get('http://127.0.0.1:5000/api/student/project', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error Details:', err);
    if (err.response) {
      console.error('Response Data:', err.response.data);
    }
  } finally {
    await pool.end();
  }
}

test();
