import api from '../utils/axiosConfig';

export const paymentService = {
    async getPayments() {
        try {
            const response = await api.get('/payments');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch payments", error);
            throw error;
        }
    },

    async getPaymentStats() {
        try {
            const response = await api.get('/payments/stats');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch payment stats", error);
            throw error;
        }
    }
};
