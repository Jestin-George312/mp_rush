import api from '../utils/api';

export interface ProjectData {
    title: string;
    domain: string;
    description: string;
    teamMembers?: string;
}

export const submitProject = async (data: ProjectData) => {
    const res = await api.post('/projects', data);
    return res.data;
};

export const fetchProjects = async () => {
    const res = await api.get('/projects');
    return res.data;
};

export const fetchGroups = async () => {
    const res = await api.get('/projects/groups/all');
    return res.data;
};

export const fetchMyGroups = async () => {
    const res = await api.get('/projects/groups/mine');
    return res.data;
};

export const updateProjectStatus = async (id: number, status: 'approved' | 'rejected') => {
    const res = await api.patch(`/projects/${id}/status`, { status });
    return res.data;
};

export const assignGuide = async (groupId: number, guideId: number | null) => {
    const res = await api.patch(`/projects/groups/${groupId}/guide`, { guideId });
    return res.data;
};

export const getCoordinatorStats = async () => {
    const res = await api.get('/projects/stats/coordinator');
    return res.data;
};
