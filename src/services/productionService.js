const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Generate mock data relative to current date
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

let SLOTS = [];
let BLOCKED_DATES = [];
let GLOBAL_SETTINGS = {
    acceptingMMCOrders: true,
    maxDailyCapacity: 50,
    leadTimeDays: 3
};

// Generate slots for current month and next month
for (let i = 0; i < 60; i++) {
    const date = new Date(currentYear, currentMonth, i + 1);
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();

    // Skip Sundays
    if (dayOfWeek === 0) continue;

    // Block some random dates (e.g., every 10th day)
    if (i % 15 === 0) {
        BLOCKED_DATES.push(dateStr);
        continue;
    }

    // Create slots
    // Morning slot
    SLOTS.push({
        id: `slot-${dateStr}-1`,
        date: dateStr,
        time: '09:00',
        capacity: 10,
        used: Math.floor(Math.random() * 11), // 0-10 used
        status: 'Open'
    });

    // Afternoon slot (sometimes closed)
    SLOTS.push({
        id: `slot-${dateStr}-2`,
        date: dateStr,
        time: '14:00',
        capacity: 10,
        used: Math.floor(Math.random() * 5),
        status: Math.random() > 0.8 ? 'Closed' : 'Open'
    });
}

export const productionService = {
    // --- Slots ---
    async getProductionSlots(factoryId, month) {
        await delay(600);
        return [...SLOTS];
    },

    async createSlot(slotData) {
        await delay(400);
        const newSlot = {
            id: Date.now(),
            ...slotData,
            used: 0,
            status: 'Open'
        };
        SLOTS.push(newSlot);
        return newSlot;
    },

    async updateSlot(slotId, updates) {
        await delay(400);
        const index = SLOTS.findIndex(s => s.id === slotId);
        if (index === -1) throw new Error('Slot not found');

        SLOTS[index] = { ...SLOTS[index], ...updates };
        return SLOTS[index];
    },

    async deleteSlot(slotId) {
        await delay(400);
        SLOTS = SLOTS.filter(s => s.id !== slotId);
    },

    // --- Global Governance ---
    async getGlobalSettings() {
        await delay(300);
        return { ...GLOBAL_SETTINGS };
    },

    async updateGlobalSettings(settings) {
        await delay(300);
        GLOBAL_SETTINGS = { ...GLOBAL_SETTINGS, ...settings };
        return { ...GLOBAL_SETTINGS };
    },

    // --- Date Blocking ---
    async getBlockedDates() {
        await delay(300);
        return [...BLOCKED_DATES];
    },

    async toggleDateBlock(dateStr) {
        await delay(300);
        if (BLOCKED_DATES.includes(dateStr)) {
            BLOCKED_DATES = BLOCKED_DATES.filter(d => d !== dateStr);
            return false; // Unblocked
        } else {
            BLOCKED_DATES.push(dateStr);
            return true; // Blocked
        }
    },

    // Helper to check if a date has any slots
    hasSlots(dateStr) {
        return SLOTS.some(s => s.date === dateStr);
    }
};
