import api from '../utils/axiosConfig';

export const orderService = {
    async getOrders(role, scope = {}, filters = {}) {
        try {
            const response = await api.get('/orders', {
                params: {
                    status: filters.status,
                    type: filters.type, // 'MMC' or 'Standard'
                    dateRange: filters.dateRange,
                    locationId: filters.locationId,
                    paymentMethod: filters.paymentMethod
                }
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch orders", error);
            throw error;
        }
    },

    async createOrder(orderData) {
        try {
            const response = await api.post('/orders', orderData);
            return response.data;
        } catch (error) {
            console.error("Failed to create order", error);
            throw error;
        }
    },

    async updateOrderStatus(orderId, newStatus) {
        try {
            const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            return response.data;
        } catch (error) {
            console.error("Failed to update order status", error);
            throw error;
        }
    },

    async cancelOrder(orderId, reason) {
        try {
            const response = await api.put(`/orders/${orderId}/status`, {
                status: 'Cancelled',
                escalationReason: reason
            });
            return response.data;
        } catch (error) {
            console.error("Failed to cancel order", error);
            throw error;
        }
    },

    async updateOrderInternalNotes(orderId, notes) {
        try {
            const response = await api.put(`/orders/${orderId}/status`, { internalNotes: notes });
            return response.data;
        } catch (error) {
            console.error("Failed to update internal notes", error);
            throw error;
        }
    }
};
