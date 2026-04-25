const http = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJjb29yZGluYXRvckBzamNldHBhbGFpLmFjLmluIiwicm9sZSI6ImNvb3JkaW5hdG9yIiwibmFtZSI6IkRyLiBDb29yZGluYXRvciIsInBpY3R1cmUiOm51bGwsImlhdCI6MTc3NzAwNjg4NSwiZXhwIjoxNzc3MDkzMjg1fQ.YAqTM9HQ7bBe9uBsOKcwgkcK5BT39xkw5lUQUKfJHVA";

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects/groups/all',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', JSON.parse(body));
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e.message);
});

req.end();
