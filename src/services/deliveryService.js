const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock Data
let DELIVERIES = {}; // Key: orderId, Value: { trackingId, rider, status, history }

const MOCK_RIDERS = [
    { name: 'John Doe', phone: '+1 (555) 012-3456', vehicle: 'Motorbike - Yamaha', rating: 4.8 },
    { name: 'Jane Smith', phone: '+1 (555) 098-7654', vehicle: 'Scooter - Vespo', rating: 4.9 },
    { name: 'Mike Ross', phone: '+1 (555) 111-2222', vehicle: 'Van - Ford Transit', rating: 4.7 }
];

export const deliveryService = {
    async getDeliveryDetails(orderId) {
        await delay(500);
        return DELIVERIES[orderId] || null;
    },

    async assignDriver(orderId) {
        await delay(800);
        const rider = MOCK_RIDERS[Math.floor(Math.random() * MOCK_RIDERS.length)];
        const trackingId = `TRK-${Math.floor(Math.random() * 100000)}`;

        const newDelivery = {
            trackingId,
            rider,
            status: 'DELIVERY_ASSIGNED',
            history: [
                { status: 'DELIVERY_ASSIGNED', timestamp: new Date().toISOString(), note: 'Rider assigned' }
            ]
        };

        DELIVERIES[orderId] = newDelivery;
        return newDelivery;
    },

    // Simulate Webhook Callback
    async simulateWebhook(orderId, status) {
        await delay(600);
        if (!DELIVERIES[orderId]) {
            throw new Error("No delivery found for this order");
        }

        const delivery = DELIVERIES[orderId];
        let note = '';

        switch (status) {
            case 'PICKED_UP': note = 'Rider picked up the order'; break;
            case 'DELIVERED': note = 'Order delivered successfully'; break;
            case 'CANCELLED': note = 'Delivery cancelled by provider'; break;
            default: note = 'Status updated';
        }

        const updatedDelivery = {
            ...delivery,
            status,
            history: [
                ...delivery.history,
                { status, timestamp: new Date().toISOString(), note }
            ]
        };

        DELIVERIES[orderId] = updatedDelivery;
        return updatedDelivery;
    }
};
