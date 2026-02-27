const axios = require('axios');

async function testSend() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
            email: 'super@admin.com',
            password: 'password'
        });
        const token = loginRes.data.token;

        console.log("Sending test notification...");
        const sendRes = await axios.post('http://127.0.0.1:5000/api/notifications/bulk', {
            title: "Permission Test",
            message: "Testing the new notifications permission.",
            target: "All Users"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Result Status:", sendRes.status);
        console.log("Result Data:", sendRes.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.status : error.message);
        if (error.response) console.log(error.response.data);
    }
}

testSend();
