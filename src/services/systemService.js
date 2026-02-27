const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data
let featureToggles = {
    loyaltyProgram: true,
    advancedReporting: true,
    betaDashboard: false,
    maintenanceMode: false,
    seasonalMenu: true
};

let integrationHealth = {
    pos: { status: 'Operational', lastCheck: new Date().toISOString(), latency: '45ms' },
    delivery: { status: 'Operational', lastCheck: new Date().toISOString(), latency: '120ms' },
    payment: { status: 'Operational', lastCheck: new Date().toISOString(), latency: '85ms' },
    smsGateway: { status: 'Degraded', lastCheck: new Date().toISOString(), latency: '1500ms' }
};

export const systemService = {
    async getFeatureToggles() {
        await delay(400);
        return { ...featureToggles };
    },

    async updateFeatureToggle(key, value) {
        await delay(600);
        featureToggles = { ...featureToggles, [key]: value };
        return { ...featureToggles };
    },

    async getSystemHealth() {
        await delay(800);
        // Simulate real-time check updating timestamps
        const now = new Date().toISOString();
        return {
            pos: { ...integrationHealth.pos, lastCheck: now },
            delivery: { ...integrationHealth.delivery, lastCheck: now },
            payment: { ...integrationHealth.payment, lastCheck: now },
            smsGateway: { ...integrationHealth.smsGateway, lastCheck: now }
        };
    },

    // Simulate a refresh action
    async checkIntegrations() {
        await delay(1500);
        // Randomly change status for demo
        const statuses = ['Operational', 'Operational', 'Operational', 'Degraded', 'Down'];
        const randomStatus = () => statuses[Math.floor(Math.random() * statuses.length)];

        integrationHealth = {
            pos: { status: 'Operational', lastCheck: new Date().toISOString(), latency: Math.floor(Math.random() * 50 + 20) + 'ms' },
            delivery: { status: randomStatus(), lastCheck: new Date().toISOString(), latency: Math.floor(Math.random() * 200 + 50) + 'ms' },
            payment: { status: 'Operational', lastCheck: new Date().toISOString(), latency: Math.floor(Math.random() * 100 + 30) + 'ms' },
            smsGateway: { status: randomStatus(), lastCheck: new Date().toISOString(), latency: Math.floor(Math.random() * 2000 + 100) + 'ms' }
        };
        return integrationHealth;
    },

    // Brand Specific Settings
    async getBrandSettings(brandId) {
        await delay(500);
        return {
            onlineOrdering: true,
            loyaltyProgram: true,
            emailNotifications: true,
            smsNotifications: false
        };
    },

    async updateBrandSettings(brandId, settings) {
        await delay(800);
        return settings;
    }
};
