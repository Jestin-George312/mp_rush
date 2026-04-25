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
export const updateFaculty = (id: string, data: any) => api.patch(`/coordinator/faculty/${id}`, data);

// --- 3. Batch Management ---
export const getBatches = () => api.get('/coordinator/batches');
export const createBatch = (data: any) => api.post('/coordinator/batches', data);

// --- 4. Student Management ---
export const getStudents = (params?: any) => api.get('/coordinator/students', { params });
export const createStudent = (data: any) => api.post('/coordinator/students', data);
export const bulkImportStudents = (data: any) => api.post('/coordinator/students/import', data);

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
