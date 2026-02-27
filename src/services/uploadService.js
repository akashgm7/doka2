import api from '../utils/axiosConfig';

export const uploadService = {
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await api.post('/upload', formData);
            return response.data;
        } catch (error) {
            console.error('Upload failed', error);
            throw error;
        }
    },
};
