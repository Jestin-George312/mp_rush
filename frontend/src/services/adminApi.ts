import api from '../utils/api';

export const getDepartments = async () => {
    const res = await api.get('/admin/departments');
    return res.data.data;
};

export const addDepartment = async (name: string) => {
    const res = await api.post('/admin/departments', { name });
    return res.data.data;
};

export const deleteDepartment = async (id: number) => {
    const res = await api.delete(`/admin/departments/${id}`);
    return res.data.data;
};

// --- Coordinator API ---

export const getCoordinators = async () => {
    const res = await api.get('/admin/coordinators');
    return res.data.data;
};

export const addCoordinator = async (data: any) => {
    const res = await api.post('/admin/coordinators', data);
    return res.data.data;
};

// --- Batch Management (Operational) ---

export const getAdminBatches = async () => {
    const res = await api.get('/admin/batches');
    return res.data.data;
};

export const assignCoordinatorToDepartment = async (departmentId: number, coordinatorId: number) => {
    const res = await api.post('/admin/departments/assign', { departmentId, coordinatorId });
    return res.data.data;
};
