import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return { headers };
};

export const getDepartments = async () => {
    const response = await axios.get(`${API_URL}/admin/departments`, getAuthConfig());
    return response.data;
};

export const addDepartment = async (name: string) => {
    const response = await axios.post(`${API_URL}/admin/departments`, { name }, getAuthConfig());
    return response.data;
};

export const deleteDepartment = async (id: number) => {
    const response = await axios.delete(`${API_URL}/admin/departments/${id}`, getAuthConfig());
    return response.data;
};

// --- Coordinator API ---

export const getCoordinators = async () => {
    const response = await axios.get(`${API_URL}/admin/coordinators`, getAuthConfig());
    return response.data;
};

export const addCoordinator = async (data: any) => {
    const response = await axios.post(`${API_URL}/admin/coordinators`, data, getAuthConfig());
    return response.data;
};

// --- Batch Management (Operational) ---

export const getAdminBatches = async () => {
    const response = await axios.get(`${API_URL}/admin/batches`, getAuthConfig());
    return response.data;
};

export const assignCoordinatorToDepartment = async (departmentId: number, coordinatorId: number) => {
    // NOTE: This endpoint and payload structure follow the new Department-based ownership model.
    // If the backend still uses batch-based endpoints, map the departmentId to batchId here as a temporary shim.
    const response = await axios.post(`${API_URL}/admin/departments/assign`, { departmentId, coordinatorId }, getAuthConfig());
    return response.data;
};
