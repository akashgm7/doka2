import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

const useAutoLogout = (timeoutMs = 15 * 60 * 1000) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector(state => state.auth);

    const handleLogout = useCallback(() => {
        if (isAuthenticated) {
            dispatch(logout());
            navigate('/login');
            toast("Session timed out due to inactivity", { icon: '⏳' });
        }
    }, [dispatch, navigate, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;

        let timer;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(handleLogout, timeoutMs);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        resetTimer();

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [isAuthenticated, handleLogout, timeoutMs]);
};

export default useAutoLogout;
