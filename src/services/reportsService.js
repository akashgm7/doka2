import api from '../utils/axiosConfig';

export const reportsService = {
    async getAnalyticsData(dateRange, customDates = {}, brandId = null, assignedOutlets = null, assignedFactory = null) {
        try {
            const params = new URLSearchParams();
            if (dateRange) params.append('dateRange', dateRange);
            if (customDates.startDate) params.append('startDate', customDates.startDate);
            if (customDates.endDate) params.append('endDate', customDates.endDate);

            const response = await api.get(`/reports/analytics?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch analytics data", error);
            // Return empty structure on failure so UI doesn't crash completely
            return {
                overview: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, growth: 0 },
                revenueTrend: [],
                popularItems: [],
                paymentMethods: []
            };
        }
    },

    async downloadReport(type, dateRange, customDates = {}) {
        try {
            const params = new URLSearchParams();
            if (type) params.append('type', type);
            if (dateRange) params.append('dateRange', dateRange);
            if (customDates.startDate) params.append('startDate', customDates.startDate);
            if (customDates.endDate) params.append('endDate', customDates.endDate);

            const response = await api.get(`/reports/download?${params.toString()}`, {
                responseType: 'blob', // Important for downloading files
            });

            // Create blob and download
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `${type}_Report_${dateRange.replace(' ', '_')}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            return true;
        } catch (error) {
            console.error("Failed to download report", error);
            throw error;
        }
    }
};
