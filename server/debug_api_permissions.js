const axios = require('axios');

async function debugApi() {
    try {
        console.log("Attempting login...");
        const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
            email: 'super@admin.com',
            password: 'password'
        });

        const token = loginRes.data.token;
        console.log("Login successful. Token acquired.");

        console.log("Fetching permissions...");
        const permRes = await axios.get('http://127.0.0.1:5000/api/roles/permissions', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Status:", permRes.status);
        console.log("Data Type:", typeof permRes.data);
        console.log("Is Array:", Array.isArray(permRes.data));
        console.log("First item:", permRes.data[0]);
        console.log("Total items:", permRes.data.length);

    } catch (error) {
        console.error("API Error:", error.response ? error.response.status : error.message);
        if (error.response) console.log(error.response.data);
    }
}

debugApi();
