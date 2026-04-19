import api from '../utils/api';

export const fetchMessages = async (groupId: number) => {
    const res = await api.get(`/comms/messages?groupId=${groupId}`);
    return res.data;
};

export const sendMessage = async (groupId: number, text: string) => {
    const res = await api.post('/comms/messages', { group_id: groupId, text });
    return res.data;
};
