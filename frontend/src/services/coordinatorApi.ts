import api from '../utils/api';

/**
 * COORDINATOR MODULE API
 * These endpoints represent the contract between the frontend 
 * and the expected backend implementation for the Coordinator module.
 */

// --- 1. Department Overview ---
export const getDeptStats = () => api.get('/coordinator/stats');

// --- 2. Faculty Management ---
export const getFaculty = () => api.get('/coordinator/faculty');
export const createFaculty = (data: any) => api.post('/coordinator/faculty', data);
export const bulkImportFaculty = (data: any) => api.post('/coordinator/faculty/import', data);
export const updateFaculty = (id: string, data: any) => api.patch(`/coordinator/faculty/${id}`, data);

// --- 3. Batch Management ---
export const getBatches = () => api.get('/coordinator/batches');
export const createBatch = (data: any) => api.post('/coordinator/batches', data);
export const updateBatch = (id: number, data: any) => api.patch(`/coordinator/batches/${id}`, data);
export const getBatchFaculty = (batchId: number) => api.get(`/coordinator/batches/${batchId}/faculty`);
export const setBatchFaculty = (batchId: number, data: { facultyIds: number[] }) => api.post(`/coordinator/batches/${batchId}/faculty`, data);
export const autoAssignTempGuides = (batchId: number) => api.post('/coordinator/allocation/auto-temp-assign', { batchId });
export const closeBatch = (batchId: number) => api.post(`/coordinator/batches/${batchId}/close`);
export const resetBatch = (batchId: number) => api.post(`/coordinator/batches/${batchId}/reset`);

// --- 4. Student Management ---
export const getStudents = (params?: any) => api.get('/coordinator/students', { params });
export const createStudent = (data: any) => api.post('/coordinator/students', data);
export const bulkImportStudents = (data: any) => api.post('/coordinator/students/import', data);
export const updateStudent = (id: string, data: any) => api.patch(`/coordinator/students/${id}`, data);
export const deleteStudent = (id: string) => api.delete(`/coordinator/students/${id}`);

// --- 5. Guide Assignment ---
export const getGuideAllocations = (batchId: string) => api.get(`/coordinator/allocation/guides/${batchId}`);
export const assignGuide = (data: { groupId: string, guideId: string }) => api.post('/coordinator/allocation/assign', data);

// --- 6. Project Groups ---
export const getProjectGroups = (params?: any) => api.get('/coordinator/projects', { params });

// --- 7. Global Deadlines ---
export const getDeadlines = (batchId: string) => api.get(`/coordinator/deadlines/${batchId}`);
export const createDeadline = (data: any) => api.post('/coordinator/deadlines', data);
export const updateDeadline = (id: string, data: any) => api.patch(`/coordinator/deadlines/${id}`, data);
export const deleteDeadline = (id: string) => api.delete(`/coordinator/deadlines/${id}`);

// --- 8. Submissions Monitor ---
export const getSubmissionAudit = (params?: any) => api.get('/coordinator/audit/submissions', { params });

// --- 9. Topic Approval Monitor ---
export const getTopicAudit = (params?: any) => api.get('/coordinator/audit/topics', { params });

// --- 10. Project Health ---
export const getProjectHealthStats = () => api.get('/coordinator/audit/health');

// --- 11. Rubric Management ---
export const getRubrics = (batchId?: number) => api.get('/evaluations/rubrics', { params: { batchId } });
export const createRubric = (data: { name: string; totalScore: number; criteria: any[]; batch_id: number; deadline_id?: number }) => 
    api.post('/evaluations/rubrics', data);
