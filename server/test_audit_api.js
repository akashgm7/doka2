const http = require('http');

const loginData = JSON.stringify({
    email: 'super@admin.com',
    password: 'password123'
});

const loginOptions = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

console.log('Attempting login...');
const req = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            const token = JSON.parse(data).token;
            console.log('Login successful! Token:', token.substring(0, 10) + '...');

            // Now test Audit Logs
            const auditOptions = {
                hostname: '127.0.0.1',
                port: 5000,
                path: '/api/audit',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            console.log('Requesting Audit Logs...');
            const auditReq = http.request(auditOptions, (auditRes) => {
                let auditData = '';
                auditRes.on('data', (chunk) => { auditData += chunk; });
                auditRes.on('end', () => {
                    console.log(`Audit Log Status: ${auditRes.statusCode}`);
                    console.log('Audit Log Response:', auditData.substring(0, 200));
                });
            });

            auditReq.on('error', (e) => {
                console.error(`Audit request error: ${e.message}`);
            });
            auditReq.end();

        } else {
            console.log('Login failed:', res.statusCode, data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Login request error: ${e.message}`);
});

req.write(loginData);
req.end();
