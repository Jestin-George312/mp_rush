import api from '../utils/api';

export interface StudentStats {
  hasProject: boolean;
  isLeader: boolean;
  projectStatus: string;
  nextDeadline?: string;
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

export const studentApi = {
  // Profile & Stats
  getDashboardStats: () => api.get<StudentStats>('/student/stats'),
  
  // Project & Grouping
  getProjectDetails: () => api.get<StudentProject>('/student/project'),
  createProject: (payload: { title: string; description: string; mode: string; memberEmails?: string[] }) => 
    api.post('/student/project', payload),
    
  // Submissions
  getSubmissionStatus: () => api.get<any[]>('/student/submissions'),
  submitDocument: (deadlineId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deadlineId', deadlineId);
    return api.post('/student/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Kanban
  getTasks: () => api.get<any[]>('/student/tasks'),
  createTask: (payload: any) => api.post('/student/tasks', payload),
  updateTask: (taskId: string, payload: any) => api.patch(`/student/tasks/${taskId}`, payload),
  
  // GitHub
  linkRepository: (repoUrl: string) => api.post('/student/project/github', { repoUrl }),
  getGitCommits: () => api.get<any[]>('/student/project/git/commits'),
};
