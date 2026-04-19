import api from '../utils/api';

export const fetchProfile = async () => {
    const res = await api.get('/users/profile');
    return res.data;
};

export const updateProfile = async (data: any) => {
    const res = await api.patch('/users/profile', data);
    return res.data;
};

export const uploadProfilePhoto = async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await api.post('/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};
