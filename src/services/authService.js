import api from '../utils/axiosConfig';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout log failed", error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    getCurrentUser: () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr || userStr === 'undefined') return null;
            return JSON.parse(userStr);
        } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            localStorage.removeItem('user');
            return null;
        }
    },

    verifyToken: async (token) => {
        // Optional: Call backend to verify token validity if needed
        // For now, we rely on Axios interceptors availability
        return true;
    }
};
