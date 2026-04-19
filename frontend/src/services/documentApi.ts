import api from '../utils/api';

export const fetchDocuments = async (projectId: number) => {
    const res = await api.get(`/documents?projectId=${projectId}`);
    return res.data;
};

export const uploadDocument = async (projectId: number, type: string, file: File, onUploadProgress?: (progressEvent: any) => void) => {
    const formData = new FormData();
    formData.append('project_id', projectId.toString());
    formData.append('type', type);
    formData.append('file', file);

    const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
    });
    return res.data;
};

export const updateDocumentStatus = async (docId: number, status: 'Approved' | 'Rejected') => {
    const res = await api.patch(`/documents/${docId}/status`, { status });
    return res.data;
};

export const deleteDocument = async (docId: number) => {
    const res = await api.delete(`/documents/${docId}`);
    return res.data;
};
