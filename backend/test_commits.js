const http = require('http');

// Step 1: Login as student1
const loginData = JSON.stringify({ email: 'student1@test.apms', password: 'pass123' });

const loginReq = http.request({
    hostname: 'localhost', port: 5000,
    path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const parsed = JSON.parse(body);
        const token = parsed.data?.token || parsed.token;
        if (!token) { console.error('No token:', body); return; }
        console.log('Got token. Fetching commits...\n');

        // Step 2: Fetch commits
        const commitReq = http.request({
            hostname: 'localhost', port: 5000,
            path: '/api/student/project/git/commits', method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        }, (r2) => {
            let b2 = '';
            r2.on('data', c => b2 += c);
            r2.on('end', () => {
                console.log('STATUS:', r2.statusCode);
                try {
                    const data = JSON.parse(b2);
                    console.log('Commits count:', data.data?.length ?? data.length ?? 0);
                    console.log('Response:', JSON.stringify(data, null, 2).slice(0, 1000));
                } catch(e) { console.log('RAW:', b2); }
            });
        });
        commitReq.on('error', e => console.error('Commit req error:', e.message));
        commitReq.end();
    });
});
loginReq.on('error', e => console.error('Login error:', e.message));
loginReq.write(loginData);
loginReq.end();
