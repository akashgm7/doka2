import api from '../utils/axiosConfig';

export const dashboardService = {
    async getDashboardStats(role, scope, dateRange = 'Today', customDates = {}) {
        try {
            const params = { range: dateRange };
            if (dateRange === 'Custom') {
                params.startDate = customDates.startDate;
                params.endDate = customDates.endDate;
            }
            const response = await api.get('/dashboard/stats', { params });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
            throw error;
        }
    },

    async updateStoreStatus(status) {
        // Endpoint needed in backend to update store status
        // await api.put('/stores/status', { status });
        return status;
    },

    async updateStoreSettings(settings) {
        // Endpoint needed in backend
        // await api.put('/stores/settings', settings);
        return settings;
    },

    async getBrands() {
        // Endpoint needed in backend
        // const response = await api.get('/brands');
        // return response.data;
        return [
            { id: 'brand-001', name: 'Deluxe Cakes' },
            { id: 'brand-002', name: 'Sweet Treats' },
            { id: 'brand-003', name: 'Pastry Palace' }
        ];
    }
};
