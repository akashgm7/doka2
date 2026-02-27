import api from '../utils/axiosConfig';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock Data
const brands = [
    {
        id: 'brand-001',
        name: 'DOKA',
        type: 'Brand',
        logo: '/doka-logo.png', // Placeholder or real asset path
        themeColor: '#000000', // Assuming black/premium for Doka
        isActive: true,
        allowsMMC: true,
        assets: {
            contract: 'doka_contract.pdf',
            guidelines: 'doka_guidelines.pdf'
        }
    }
];

let locations = [
    {
        id: 'loc-001',
        brandId: 'brand-001',
        name: 'Downtown Outlet',
        type: 'Outlet',
        address: '123 Main St, Cityville',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        status: 'Open', // Open, Closed, Disabled
        timings: { open: '09:00', close: '21:00' },
        capabilities: {
            delivery: true,
            pickup: true,
            dineIn: true
        },
        geoFence: [
            { lat: 40.71, lng: -74.00 },
            { lat: 40.72, lng: -74.01 },
            { lat: 40.73, lng: -74.00 }
        ]
    },
    {
        id: 'loc-002',
        brandId: 'brand-001',
        name: 'Central Kitchen',
        type: 'Factory',
        address: '456 Industrial Park, Cityville',
        coordinates: { lat: 40.75, lng: -74.05 },
        capabilities: {
            delivery: false,
            pickup: false,
            dineIn: false
        },
        geoFence: []
    },
    {
        id: 'loc-003',
        brandId: 'brand-001',
        name: 'Uptown Outlet',
        type: 'Outlet',
        address: '789 High St, Uptown',
        coordinates: { lat: 40.78, lng: -74.02 },
        status: 'Open',
        timings: { open: '10:00', close: '22:00' },
        capabilities: {
            delivery: true,
            pickup: true,
            dineIn: true
        },
        geoFence: []
    }
];

export const brandService = {
    // Brand Operations
    async getBrands() {
        await delay(500);
        return [...brands];
    },

    async getBrandById(id) {
        await delay(300);
        return brands.find(b => b.id === id);
    },

    async createBrand(brandData) {
        await delay(800);
        const newBrand = {
            id: `brand-${Date.now()}`,
            isActive: true, // default
            ...brandData
        };
        brands.push(newBrand);
        return newBrand;
    },

    async updateBrand(id, brandData) {
        await delay(600);
        const index = brands.findIndex(b => b.id === id);
        if (index !== -1) {
            brands[index] = { ...brands[index], ...brandData };
            return brands[index];
        }
        throw new Error('Brand not found');
    },

    async deleteBrand(id) {
        await delay(600);
        brands = brands.filter(b => b.id !== id);
        return true;
    },

    // Location Operations (Real API)
    async getLocations(brandId = null) {
        // await delay(500); // No need for fake delay
        try {
            const response = await api.get('/stores');
            let locations = response.data;
            if (brandId) {
                locations = locations.filter(l => l.brandId === brandId);
            }
            return locations;
        } catch (error) {
            console.error("Failed to fetch locations", error);
            return [];
        }
    },

    async createLocation(locationData) {
        console.log('brandService: createLocation called', locationData);
        try {
            const response = await api.post('/stores', locationData);
            console.log('brandService: createLocation response', response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to create location", error);
            throw error;
        }
    },

    async updateLocation(id, locationData) {
        try {
            const response = await api.put(`/stores/${id}`, locationData);
            return response.data;
        } catch (error) {
            console.error("Failed to update location", error);
            throw error;
        }
    },

    async deleteLocation(id) {
        try {
            const response = await api.delete(`/stores/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to delete location", error);
            throw error;
        }
    },

    async geocodeAddress(address, pincode) {
        try {
            const response = await api.post('/stores/geocode', { address, pincode });
            return response.data;
        } catch (error) {
            // Error is already logged by axios interceptor usually, but good to have here
            throw error;
        }
    }
};
