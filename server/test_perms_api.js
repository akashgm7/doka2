const axios = require('axios');

async function testPermissions() {
    try {
        const response = await axios.get('http://127.0.0.1:5000/api/roles/permissions');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testPermissions();
