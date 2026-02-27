const axios = require('axios');

const test = async () => {
    try {
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'factory@cake.com',
            password: 'password'
        });

        const token = loginRes.data.token;

        const req1 = await axios.get('http://localhost:5002/api/payments', {
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log('Factory payments array length:', req1.data?.length);

        const req2 = await axios.get('http://localhost:5002/api/payments/stats', {
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log('Factory stats data:', req2.data);

        process.exit(0);
    } catch (e) {
        console.error('Failed:', e.response?.data || e.message);
        process.exit(1);
    }
};

test();
