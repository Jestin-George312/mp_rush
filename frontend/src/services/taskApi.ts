import api from '../utils/api';

export interface Task {
    id: number;
    project_id: number;
    title: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'todo' | 'inprogress' | 'done';
    deadline?: string;
    assigned_to_name?: string;
}

export const fetchTasks = async (projectId: number) => {
    const res = await api.get(`/tasks?projectId=${projectId}`);
    return res.data;
};

export const createTask = async (data: { project_id: number; title: string; priority: string; deadline?: string }) => {
    const res = await api.post('/tasks', data);
    return res.data;
};

export const updateTaskStatus = async (taskId: number, status: string) => {
    const res = await api.patch(`/tasks/${taskId}/status`, { status });
    return res.data;
};

export const updateTask = async (taskId: number, data: any) => {
    const res = await api.patch(`/tasks/${taskId}`, data);
    return res.data;
};

export const deleteTask = async (taskId: number) => {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
};
