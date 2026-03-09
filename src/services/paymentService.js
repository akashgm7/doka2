import api from '../utils/axiosConfig';

export const paymentService = {
    async getPayments(params = {}) {
        try {
            const response = await api.get('/payments', { params });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch payments", error);
            throw error;
        }
    },

    async getPaymentStats(params = {}) {
        try {
            const response = await api.get('/payments/stats', { params });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch payment stats", error);
            throw error;
        }
    }
};
