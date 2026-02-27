const API_URL = 'http://localhost:5000/api';

async function testUserCreation() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'super@admin.com',
                password: 'password'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('Login successful, token received.');

        // 2. Create User
        console.log('Creating test user...');
        const newUser = {
            name: 'Test Setup User',
            email: `testsetup_${Date.now()}@example.com`, // Unique email
            password: 'password123',
            role: 'Store Manager',
            brandId: 'brand-001'
        };

        const createResponse = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newUser)
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`User creation failed: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
        }

        const createdUser = await createResponse.json();
        console.log('User created successfully:', createdUser);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testUserCreation();
