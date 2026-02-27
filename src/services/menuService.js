import api from '../utils/axiosConfig';

export const menuService = {
    async getItems(brandId = null) {
        try {
            const response = await api.get('/products', { params: { brandId } });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch menu items", error);
            throw error;
        }
    },

    async getItemById(id) {
        try {
            const response = await api.get(`/products/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch menu item", error);
            throw error;
        }
    },

    async updateItem(id, updates) {
        try {
            const response = await api.put(`/products/${id}`, updates);
            return response.data;
        } catch (error) {
            console.error("Failed to update menu item", error);
            throw error;
        }
    },

    async createItem(itemData) {
        try {
            const response = await api.post('/products', itemData);
            return response.data;
        } catch (error) {
            console.error("Failed to create menu item", error);
            throw error;
        }
    },

    async deleteItem(id) {
        try {
            const response = await api.delete(`/products/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to delete menu item", error);
            throw error;
        }
    },

    async toggleStoreAvailability(itemId, locationId, isAvailable) {
        // Backend should handle this as a patch or specific endpoint
        // For now simulating a patch
        try {
            const response = await api.patch(`/products/${itemId}/availability`, {
                locationId,
                isAvailable
            });
            return response.data;
        } catch (error) {
            console.error("Failed to toggle availability", error);
            throw error;
        }
    },

    async toggleVariantAvailability(itemId, variantId, locationId, isAvailable) {
        try {
            const response = await api.patch(`/products/${itemId}/variants/${variantId}/availability`, {
                locationId,
                isAvailable
            });
            return response.data;
        } catch (error) {
            console.error("Failed to toggle variant availability", error);
            throw error;
        }
    }
};
