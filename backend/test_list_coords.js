const http = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJhZG1pbkBzamNldHBhbGFpLmFjLmluIiwicm9sZSI6ImFkbWluIiwibmFtZSI6IlN5c3RlbSBBZG1pbiIsInBpY3R1cmUiOm51bGwsImlhdCI6MTc3NzAwNzcwMywiZXhwIjoxNzc3MDk0MTAzfQ.JsrpLmlTOKGNQZKFYwMpgajkG-Rq_AzDWnzUo-GPgFw";

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/coordinators',
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
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e.message);
});

req.end();
