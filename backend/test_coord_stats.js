const http = require('http');

const data = JSON.stringify({
    email: 'sarah@univ.edu',
    password: 'password123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('LOGIN STATUS:', res.statusCode);
        console.log('LOGIN BODY:', body);
        
        try {
            const parsed = JSON.parse(body);
            if (parsed.token) {
                // Now get stats
                const statsOptions = {
                    hostname: 'localhost',
                    port: 5000,
                    path: '/api/coordinator/stats',
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${parsed.token}`
                    }
                };
                
                const statsReq = http.request(statsOptions, (statsRes) => {
                    let statsBody = '';
                    statsRes.on('data', (chunk) => statsBody += chunk);
                    statsRes.on('end', () => {
                        console.log('STATS STATUS:', statsRes.statusCode);
                        console.log('STATS BODY:', statsBody);
                    });
                });
                statsReq.on('error', console.error);
                statsReq.end();
            }
        } catch(e) {}
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e.message);
});

req.write(data);
req.end();
