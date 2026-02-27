import api from '../utils/axiosConfig';

export const loyaltyService = {
    async getConfig() {
        try {
            const { data } = await api.get('/loyalty/config');
            return data;
        } catch (error) {
            console.error('Failed to fetch loyalty config:', error);
            throw error;
        }
    },

    async updateConfig(newConfig) {
        try {
            const { data } = await api.put('/loyalty/config', newConfig);
            return data;
        } catch (error) {
            console.error('Failed to update loyalty config:', error);
            throw error;
        }
    },

    async getLoyaltyStats(brandId) {
        try {
            const endpoint = brandId ? `/loyalty/stats?brandId=${brandId}` : '/loyalty/stats';
            const { data } = await api.get(endpoint);
            return {
                totalPointsEarned: data.totalPointsEarned || 0,
                totalPointsRedeemed: data.totalPointsRedeemed || 0,
                activeMembers: data.activeMembers || 0,
                redemptionRate: data.redemptionRate || 0
            };
        } catch (error) {
            console.error('Failed to fetch real loyalty stats:', error);
            return {
                totalPointsEarned: 0,
                totalPointsRedeemed: 0,
                activeMembers: 0,
                redemptionRate: 0
            };
        }
    }
};
