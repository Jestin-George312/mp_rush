const http = require('http');
const axios = require('axios');
require('dotenv').config();

// Step 1: Get the github_repo from DB directly
const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'mp_one', password: 'root', port: 5432 });

async function run() {
    // Get project for student1
    const res = await pool.query(`
        SELECT p.*, u.uid as student_uid
        FROM projects p
        JOIN groups g ON g.id = p.group_id
        JOIN group_members gm ON gm.group_id = g.id
        JOIN users u ON u.uid = gm.student_id
        WHERE u.email = 'student1@test.apms'
        LIMIT 1
    `);

    const project = res.rows[0];
    if (!project) { console.log('No project found for student1'); await pool.end(); return; }

    console.log('Project:', project.title);
    console.log('github_repo:', project.github_repo);
    console.log('GITHUB_TOKEN set?', !!process.env.GITHUB_TOKEN);

    if (!project.github_repo) { console.log('No repo linked!'); await pool.end(); return; }

    // Test GitHub API call
    try {
        let cleaned = project.github_repo.replace('https://github.com/', '').replace(/\.git$/, '').replace(/\/$/, '');
        const [owner, repo] = cleaned.split('/');
        console.log(`\nFetching: ${owner}/${repo}`);

        const ghRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
            params: { per_page: 10 }
        });
        console.log(`\nCommits found: ${ghRes.data.length}`);
        ghRes.data.slice(0, 3).forEach(c => console.log(' -', c.commit.message.slice(0, 60)));
    } catch(e) {
        console.error('\nGitHub API Error:', e.response?.status, JSON.stringify(e.response?.data || e.message));
    }

    await pool.end();
}

run().catch(console.error);
