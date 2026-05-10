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
}

export interface StudentProject {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Approved' | 'Revision Requested';
  mode: 'Individual' | 'Group';
  batchName: string;
  guideName?: string;
  members: {
    uid: string;
    full_name: string;
    email: string;
    is_leader: boolean;
  }[];
  github_repo?: string;
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
  getDashboardStats: () => api.get<StudentStats>('/student/stats'),
  
  // Project & Grouping
  getProjectDetails: () => api.get<StudentProject>('/student/project'),
  createProject: (payload: { title: string; description: string; mode: string; memberEmails?: string[] }) => 
    api.post('/student/project', payload),
  
  // Invitations
  getInvitations: () => api.get<StudentInvitation[]>('/student/invitations'),
  respondToInvitation: (id: number, accept: boolean) => 
    api.post(`/student/invitations/${id}/respond`, { accept }),

  // Notifications
  getNotifications: () => api.get<Notification[]>('/notifications'),
  markNotificationRead: (id: number) => api.patch(`/notifications/${id}/read`),

  // Submissions
  getSubmissionStatus: () => api.get<any[]>('/student/submissions'),
  submitDocument: (payload: { project_id: number; type: string; parent_doc_id?: number }, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', payload.project_id.toString());
    formData.append('type', payload.type);
    if (payload.parent_doc_id) formData.append('parent_doc_id', payload.parent_doc_id.toString());
    
    return api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Kanban
  getTasks: () => api.get<any[]>('/student/tasks'),
  createTask: (payload: any) => api.post('/student/tasks', payload),
  updateTask: (taskId: string, payload: any) => api.patch(`/student/tasks/${taskId}`, payload),
  
  getDeadlines: () => api.get<any[]>('/student/deadlines'),
  getBatchMates: () => api.get<any[]>('/student/batch-mates'),
  getFeedback: () => api.get<any[]>('/student/feedback'),

  // GitHub
  linkRepository: (repoUrl: string) => api.post('/student/project/github', { repoUrl }),
  getGitCommits: () => api.get<any[]>('/student/project/git/commits'),
  getBatchSettings: () => api.get<any>('/student/batch-settings'),
};
