import api from '../utils/api';

export const fetchMeetings = async () => {
    const res = await api.get('/meetings');
    return res.data;
};

export const createMeeting = async (data: { title: string; date: string; time: string; agenda: string; duration: string; project_id?: number; group_id?: number }) => {
    const res = await api.post('/meetings', data);
    return res.data;
};

export const updateMeeting = async (id: number, data: any) => {
    const res = await api.patch(`/meetings/${id}`, data);
    return res.data;
};

export const deleteMeeting = async (id: number) => {
    const res = await api.delete(`/meetings/${id}`);
    return res.data;
};
