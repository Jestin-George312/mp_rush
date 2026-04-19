import api from '../utils/api';

export const getRubrics = async () => {
    const res = await api.get('/evaluations/rubrics');
    return res.data;
};

export const saveRubric = async (data: { name: string; totalScore: number; criteria: any[] }) => {
    const res = await api.post('/evaluations/rubrics', data);
    return res.data;
};

export const getScores = async (groupId: number) => {
    const res = await api.get(`/evaluations/scores?groupId=${groupId}`);
    return res.data;
};

export const submitScores = async (data: { rubric_id: number; group_id: number; scores: any; total: number }) => {
    const res = await api.post('/evaluations/scores', data);
    return res.data;
};
