import api from '../utils/api';

export interface GuideStats {
  assignedBatches: number;
  totalGroups: number;
  pendingTopics: number;
  pendingReviews: number;
  upcomingDeadlines: number;
  atRiskGroups: number;
}

export interface BatchSummary {
  id: string;
  name: string;
  groupCount: number;
  studentCount: number;
  submissionProgress: number;
  pendingReviews: number;
}

export interface TopicProposal {
  id: string;
  batchName: string;
  groupName: string;
  members: string[];
  title: string;
  domain: string;
  description: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Revision Requested';
  isResubmitted?: boolean;
}

export interface ProjectGroupMeta {
  id: string;
  name: string;
  batchId: string;
  batchName: string;
  title: string;
  members: string[];
  repoUrl?: string;
  lastCommit?: {
    message: string;
    author: string;
    date: string;
  };
  status: string;
  health: 'Healthy' | 'Warning' | 'At Risk';
}

export interface UpcomingDeadline {
  id: number;
  title: string;
  due_date: string;
  batch_name: string;
  total_groups: number;
  submitted_count: number;
  pending_groups?: string[];
}

export const guideApi = {
  // Stats & Dashboard
  getDashboardStats: () => api.get<GuideStats>('/guide/stats'),
  getUpcomingDeadlines: () => api.get<UpcomingDeadline[]>('/guide/deadlines/upcoming'),
  
  // Batches
  getAssignedBatches: () => api.get<BatchSummary[]>('/guide/batches'),
  getBatchGroups: (batchId: string) => api.get<ProjectGroupMeta[]>(`/guide/batches/${batchId}/groups`),
  getBatchDeadlines: (batchId: string | number) => api.get<UpcomingDeadline[]>(`/guide/batches/${batchId}/deadlines`),
  
  // Topics
  getPendingTopics: () => api.get<TopicProposal[]>('/guide/topics/pending'),
  getTopics: (status: string) => api.get<TopicProposal[]>(`/guide/topics?status=${status}`),
  approveTopic: (id: string, comments: string) => api.post(`/guide/topics/${id}/approve`, { comments }),
  rejectTopic: (id: string, reason: string) => api.post(`/guide/topics/${id}/reject`, { reason }),
  requestRevision: (id: string, instructions: string) => api.post(`/guide/topics/${id}/revision`, { instructions }),
  
  // Project Groups
  getSupervisedGroups: () => api.get<ProjectGroupMeta[]>('/guide/groups'),
  getGroupDetails: (groupId: string) => api.get<any>(`/guide/groups/${groupId}`),
  
  // Submissions & Review
  getPendingDocuments: (status?: string) => api.get<any[]>(`/guide/documents/pending${status ? `?status=${status}` : ''}`),
  reviewDocument: (docId: string, status: 'Approved' | 'Rejected' | 'Needs Revision', feedback: string, file?: File) => {
    const formData = new FormData();
    formData.append('status', status);
    formData.append('feedback', feedback);
    if (file) formData.append('file', file);
    return api.post(`/guide/documents/${docId}/review`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
    
  // Project Completion
  markProjectCompleted: (id: number) => api.post(`/guide/projects/${id}/complete`),

  // Extension Requests
  getExtensionRequests: () => api.get<any[]>('/guide/extensions/pending'),
  handleExtensionRequest: (id: number, status: 'approved' | 'rejected', comment?: string) => 
    api.post(`/guide/extensions/${id}/review`, { status, comment }),

  // Git Activity
  getGitActivity: () => api.get<any[]>('/guide/git-monitoring'),
  getForkAnalysis: (projectId: string) => api.get<any>(`/github/analyze/${projectId}`),
  
  // Kanban Oversight
  getGroupKanban: (groupId: string) => api.get<any>(`/guide/groups/${groupId}/kanban`),

  // Commit Activity (guide view by project)
  getProjectCommits: (projectId: string | number) => api.get<any>(`/github/project/${projectId}/commits`),
  summarizeCommit: (projectId: string | number, data: {
    commitSha: string;
    commitMessage: string;
    commitAuthor: string;
    commitDate: string;
  }) => api.post<any>(`/github/project/${projectId}/summarize-commit`, data),
};
