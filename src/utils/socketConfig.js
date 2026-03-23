import { io } from 'socket.io-client';

export const getSocketURL = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (apiUrl) {
        // Remove /api from the end to get the base URL
        return apiUrl.replace(/\/api\/?$/, '');
    }
    // Fallback for local dev
    return `http://${window.location.hostname}:5002`;
};

let socketInstance = null;

export const getSocket = () => {
    if (!socketInstance) {
        socketInstance = io(getSocketURL());
        
        socketInstance.on('connect', () => {
            console.log('[Socket] Global connection established');
        });

        socketInstance.on('connect_error', (err) => {
            console.error('[Socket] Global connection error:', err);
        });
    }
    return socketInstance;
};

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};
