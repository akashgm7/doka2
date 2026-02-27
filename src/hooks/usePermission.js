import { useState, useCallback } from 'react';

export const usePermission = (permissionType, options = {}) => {
    const [permissionState, setPermissionState] = useState('prompt'); // prompt, granted, denied
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const checkPermission = useCallback(async () => {
        if (!navigator.permissions) return 'prompt';
        try {
            // Map types for query
            const name = permissionType === 'notifications' ? 'notifications' :
                permissionType === 'geolocation' ? 'geolocation' : permissionType;

            const status = await navigator.permissions.query({ name });
            setPermissionState(status.state);
            return status.state;
        } catch (e) {
            console.warn("Permission check failed", e);
            return 'prompt';
        }
    }, [permissionType]);

    const requestPermission = useCallback(() => {
        // If already granted, just return true (or handle externally)
        if (permissionState === 'granted') return Promise.resolve(true);
        if (permissionState === 'denied') {
            setError('Permission previously denied. Please enable it in browser settings.');
            return Promise.resolve(false);
        }

        // Show our custom modal first
        setIsModalOpen(true);

        // Return a promise that resolves when the user interacts with the modal/browser
        return new Promise((resolve) => {
            // We'll attach the resolve function to the instance momentarily
            // This is a bit tricky with hooks, so we might return the state control instead.
            // Simplified: The consumer calls requestPermission which opens modal.
            // The Modal 'Allow' button triggers the actual browser request.
        });
    }, [permissionState]);

    const handleConfirm = useCallback(async () => {
        setIsModalOpen(false);
        setIsLoading(true);
        setError(null);

        try {
            let result = false;

            if (permissionType === 'geolocation') {
                result = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        () => resolve(true),
                        () => resolve(false)
                    );
                });
            } else if (permissionType === 'notifications') {
                const res = await Notification.requestPermission();
                result = res === 'granted';
            }

            setPermissionState(result ? 'granted' : 'denied');
            if (options.onGranted && result) options.onGranted();
            if (options.onDenied && !result) options.onDenied();

            return result;

        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [permissionType, options]);

    const handleCancel = useCallback(() => {
        setIsModalOpen(false);
        if (options.onDenied) options.onDenied();
    }, [options]);

    return {
        state: permissionState,
        isModalOpen,
        isLoading,
        error,
        request: () => setIsModalOpen(true), // Just open modal
        confirm: handleConfirm, // Actual browser request
        cancel: handleCancel
    };
};
