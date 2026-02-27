const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
    const filePath = path.join(__dirname, 'test_image.txt'); // Using a dummy text file as "image" for test
    fs.writeFileSync(filePath, 'dummy image content');

    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));

    try {
        // We need a token to test, but let's see if we can at least reach the endpoint protected check
        const response = await axios.post('http://localhost:5002/api/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });
        console.log('Upload Result:', response.data);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('Verification: Endpoint reached but unauthorized (expected since no token provided).');
        } else {
            console.error('Upload Error:', error.response ? error.response.data : error.message);
        }
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}

testUpload();
