import api from '../utils/axiosConfig';

export const notificationService = {
    async getSettings() {
        // Since we don't have a settings model yet, we can keep it mock or implement a simple one later.
        // For now, let's keep it as is or return a default.
        return {
            pushEnabled: true,
            emailEnabled: true,
            automatedEvents: {
                orderStatus: true,
                cartAbandonment: false,
                lowStock: true
            }
        };
    },

    async updateSettings(newSettings) {
        // Mocking settings update for now as requested focus is on bulk storage
        return newSettings;
    },

    async getHistory(brandId) {
        const response = await api.get('/notifications/history', {
            params: { brandId }
        });
        return response.data;
    },

    // Get notifications relevant to a specific user
    async getNotificationsForUser() {
        const response = await api.get('/notifications');
        return response.data;
    },

    async sendBulkNotification(notification, brandId = null) {
        const response = await api.post('/notifications/bulk', {
            ...notification,
            brandId
        });
        return response.data;
    }
};
