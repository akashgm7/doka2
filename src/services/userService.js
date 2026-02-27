import api from '../utils/axiosConfig';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Initial Mock Data (Same as Auth Service for consistency)
export const userService = {
    async getUsers(currentUser) {
        try {
            const response = await api.get('/users');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch users", error);
            throw error;
        }
    },

    async createUser(userData) {
        try {
            const response = await api.post('/users', userData);
            return response.data;
        } catch (error) {
            console.error("Failed to create user", error);
            throw error;
        }
    },

    async updateUser(id, updates) {
        try {
            const response = await api.put(`/users/${id}`, updates);
            return response.data;
        } catch (error) {
            console.error("Failed to update user", error);
            throw error;
        }
    },

    async deleteUser(id) {
        try {
            const response = await api.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to delete user", error);
            throw error;
        }
    }
};
