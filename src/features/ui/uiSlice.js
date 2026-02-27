import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    globalSearch: '',
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setGlobalSearch: (state, action) => {
            state.globalSearch = action.payload;
        },
        clearGlobalSearch: (state) => {
            state.globalSearch = '';
        }
    },
});

export const { setGlobalSearch, clearGlobalSearch } = uiSlice.actions;
export default uiSlice.reducer;
