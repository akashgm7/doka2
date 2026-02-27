import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

// Safely parse JSON from localStorage
const safeJSONParse = (item) => {
    try {
        return (item && item !== 'undefined') ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
}

const user = safeJSONParse(localStorage.getItem('user'));
const token = localStorage.getItem('token') !== 'undefined' ? localStorage.getItem('token') : null;

// Helper to manually parse JWT payload
const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

let initialState = {
    user: user || null,
    token: token || null,
    isAuthenticated: !!token,
    isLoading: false,
    error: null,
};

// Check if token is expired on load
if (token) {
    const decoded = parseJwt(token);
    if (!decoded || (decoded.exp * 1000) < Date.now()) { // exp is usually in seconds
        initialState = {
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        };
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
}

export const login = createAsyncThunk('auth/login', async ({ email, password }, thunkAPI) => {
    try {
        const data = await authService.login(email, password);
        return data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
    await authService.logout();
    return;
});

export const refreshProfile = createAsyncThunk('auth/refreshProfile', async (_, thunkAPI) => {
    try {
        const data = await authService.getMe();
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.message);
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        resetError: (state) => {
            state.error = null;
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },
        sessionExpired: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Session expired. Please login again.';
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload; // Backend returns flat user object
                state.token = action.payload.token;
                localStorage.setItem('user', JSON.stringify(action.payload));
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            })
            // Refresh Profile
            .addCase(refreshProfile.fulfilled, (state, action) => {
                state.user = { ...state.user, ...action.payload };
                localStorage.setItem('user', JSON.stringify(state.user));
            })
            .addCase(refreshProfile.rejected, (state, action) => {
                // If refresh fails (401), we should probably logout to be safe
                if (action.payload?.includes('401') || action.error?.message?.includes('401')) {
                    state.user = null;
                    state.token = null;
                    state.isAuthenticated = false;
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            });
    },
});

export const { resetError, setUser, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
