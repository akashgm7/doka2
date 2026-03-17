import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5002/api`,
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data);
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
        try {
            const user = JSON.parse(userStr);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (error) {
            console.error("Error parsing user in axios interceptor:", error);
            // Optionally clear corrupted data
            localStorage.removeItem('user');
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle 401 (Optional logout)
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
            // Dispatch logout or clear storage here if needed
            // localStorage.removeItem('user');
            // window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});

export default api;
