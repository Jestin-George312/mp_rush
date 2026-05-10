import api from '../utils/api';

export const fetchMessages = async (groupId: number) => {
    const res = await api.get(`/comms/messages?groupId=${groupId}`);
    return res.data;
};

export const sendMessage = async (groupId: number, text: string, file?: File) => {
    if (file) {
        const formData = new FormData();
        formData.append('group_id', groupId.toString());
        formData.append('text', text);
        formData.append('file', file);
        return api.post('/comms/messages', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return api.post('/comms/messages', { group_id: groupId, text });
};
