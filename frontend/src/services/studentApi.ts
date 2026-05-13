import api from '../utils/api';

export type StudentStats = {
  hasProject: boolean;
  isLeader: boolean;
  projectStatus: string;
  progress: number;
  hasRepo: boolean;
  memberCount: number;
  nextDeadline?: string;
  pendingDeadlinesCount: number;
  unreadFeedbackCount: number;
  pendingInvitationsCount: number;
  kanbanTasks: {
    todo: number;
    inProgress: number;
    done: number;
  };
  unreadMessages: number;
  batchName: string;
  systemStatus: string;
}

export interface StudentProject {
  id: string;
  title: string;
  description: string;
  domain?: string;
  status: 'Pending' | 'Approved' | 'Revision Requested';
  topicFeedback?: string;
  createdAt: string;
  reviewedAt?: string;
  mode: 'Individual' | 'Group';
  batchName: string;
  guideName?: string;
  guideEmail?: string;
  members: {
    uid: string;
    full_name: string;
    email: string;
    is_leader: boolean;
    tasks_done: number;
    commits_count: number;
  }[];
  github_repo?: string;
  teamActivity?: number;
}

export interface StudentInvitation {
  id: number;
  group_id: number;
  inviter_id: number;
  inviter_name: string;
  project_title: string;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  ref_type?: string;
  ref_id?: number;
  is_read: boolean;
  created_at: string;
}

export const studentApi = {
  // Profile & Stats
  getDashboardStats: () => api.get<{ data: StudentStats }>('/student/stats'),
  
  // Project & Grouping
  getProjectDetails: () => api.get<{ data: StudentProject }>('/student/project'),
  createProject: (payload: { title: string; description: string; domain: string; mode: string; memberEmails?: string[] }) => 
    api.post('/student/project', payload),
  
  // Invitations
  getInvitations: () => api.get<{ data: StudentInvitation[] }>('/student/invitations'),
  respondToInvitation: (id: number, accept: boolean) => 
    api.post(`/student/invitations/${id}/respond`, { accept }),

  // Notifications
  getNotifications: () => api.get<{ data: Notification[] }>('/notifications'),
  markNotificationRead: (id: number) => api.patch(`/notifications/${id}/read`),

  // Submissions
  getSubmissionStatus: () => api.get<{ data: any[] }>('/student/submissions'),
  submitDocument: (payload: { project_id: number; type: string; documentName: string; deadlineId?: string }, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', payload.project_id.toString());
    formData.append('type', payload.type);
    formData.append('documentName', payload.documentName);
    if (payload.deadlineId) formData.append('deadlineId', payload.deadlineId);
    
    return api.post('/student/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteSubmission: (docId: number) => api.delete(`/student/submissions/${docId}`),
  
  // Kanban
  getTasks: () => api.get<{ data: any[] }>('/student/tasks'),
  createTask: (payload: any) => api.post('/student/tasks', payload),
  updateTask: (taskId: string, payload: any) => api.patch(`/student/tasks/${taskId}`, payload),
  
  getDeadlines: () => api.get<{ data: any[] }>('/student/deadlines'),
  getBatchMates: () => api.get<{ data: any[] }>('/student/batch-mates'),
  getFeedback: () => api.get<{ data: any[] }>('/student/feedback'),

  // GitHub
  linkRepository: (repoUrl: string) => api.post('/student/project/github', { repoUrl }),
  getGitCommits: () => api.get<{ data: any[] }>('/student/project/git/commits'),
  getGitHealth: (projectId: number | string) => api.get<{ data: any }>(`/github/project/${projectId}/health`),
  getBatchSettings: () => api.get<{ data: any }>('/student/batch-settings'),
};
