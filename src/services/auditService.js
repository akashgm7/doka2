import api from '../utils/axiosConfig';

export const auditService = {
    async getLogs(filters = {}) {
        try {
            const response = await api.get('/audit', { params: filters });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
            throw error;
        }
    },

    async logAction(action, resource, details) {
        // This helper can be used globally in the frontend
        // Note: Real security usually logs in the backend based on API calls
        try {
            await api.post('/audit/log', { action, resource, details });
        } catch (error) {
            console.error("Failed to log action", error);
        }
    }
};
