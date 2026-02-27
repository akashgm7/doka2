import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionExpired, logout, refreshProfile } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

const SessionManager = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);

    const handleLogout = useCallback(() => {
        dispatch(logout()); // Or sessionExpired() if we want a specific message state
        dispatch(sessionExpired());
        navigate('/login');
        toast.error('Session expired due to inactivity.');
    }, [dispatch, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(refreshProfile());
        }
    }, [isAuthenticated, dispatch]);

    useEffect(() => {
        if (!isAuthenticated) return;

        let timeoutId;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogout, SESSION_TIMEOUT);
        };

        // Events to monitor
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        // Attach listeners
        const handleActivity = () => {
            resetTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isAuthenticated, handleLogout]);

    return <>{children}</>;
};

export default SessionManager;
