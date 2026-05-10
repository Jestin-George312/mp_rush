import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';

// Context
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './hooks/SocketProvider';

// Layout
import MainLayout from './components/common/Layout/MainLayout';

// Pages (eager load common ones)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Landing from './pages/Landing';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import ProjectSetup from './pages/student/ProjectSetup';
import TopicStatus from './pages/student/TopicStatus';
import RepositoryManager from './pages/student/RepositoryManager';
import StudentTaskBoard from './pages/student/TaskBoard';
import StudentDeadlines from './pages/student/Deadlines';
import SubmissionPortal from './pages/student/SubmissionPortal';
import FeedbackReview from './pages/student/FeedbackReview';
import TeamView from './pages/student/TeamView';
import ProgressInsights from './pages/student/ProgressInsights';
import DocumentArchive from './pages/student/DocumentArchive';
import StudentChat from './pages/student/Chat';
import StudentMeetings from './pages/student/Meetings';

// Guide pages
import GuideDashboard from './pages/guide/Dashboard';
import TopicApprovals from './pages/guide/TopicApprovals';
import BatchList from './pages/guide/BatchList';
import ProjectGroupsGuide from './pages/guide/ProjectGroups';
import GroupDetailsGuide from './pages/guide/GroupDetails';
import DocumentReview from './pages/guide/DocumentReview';
import FeedbackUI from './pages/guide/FeedbackUI';
import KanbanOversight from './pages/guide/KanbanOversight';
import GitActivityIndicator from './pages/guide/GitActivity';
import ComplianceTracker from './pages/guide/Compliance';
import GuideChat from './pages/guide/Chat';
import GuideMeetings from './pages/guide/Meetings';
import GuideExtensions from './pages/guide/Extensions';

// Coordinator pages
import CoordinatorDashboard from './pages/coordinator/Dashboard';
import FacultyManagement from './pages/coordinator/FacultyManagement';
import BatchManagement from './pages/coordinator/BatchManagement';
import StudentManagement from './pages/coordinator/StudentManagement';
import GuideAssignment from './pages/coordinator/GuideAssignment';
import ProjectGroups from './pages/coordinator/ProjectGroups';
import GlobalDeadlines from './pages/coordinator/GlobalDeadlines';
import SubmissionsMonitor from './pages/coordinator/SubmissionsMonitor';
import TopicMonitor from './pages/coordinator/TopicMonitor';
import ProjectHealth from './pages/coordinator/ProjectHealth';
import RubricBuilder from './pages/coordinator/RubricBuilder';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Shared pages
import Profile from './pages/shared/Profile';

// Loading fallback
const PageLoader = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Landing />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* App Routes (wrapped in layout) */}
                            <Route element={<MainLayout />}>
                                {/* Dashboard - default after login */}
                                <Route path="/dashboard" element={<StudentDashboard />} />

                                {/* Coordinator Routes (Prioritized) */}
                                <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
                                <Route path="/coordinator/faculty" element={<FacultyManagement />} />
                                <Route path="/coordinator/batches" element={<BatchManagement />} />
                                <Route path="/coordinator/students" element={<StudentManagement />} />
                                <Route path="/coordinator/assignment" element={<GuideAssignment />} />
                                <Route path="/coordinator/projects" element={<ProjectGroups />} />
                                <Route path="/coordinator/deadlines" element={<GlobalDeadlines />} />
                                <Route path="/coordinator/submissions" element={<SubmissionsMonitor />} />
                                <Route path="/coordinator/topics" element={<TopicMonitor />} />
                                <Route path="/coordinator/health" element={<ProjectHealth />} />
                                <Route path="/coordinator/rubrics" element={<RubricBuilder />} />
                                <Route path="/coordinator/profile" element={<Profile />} />
                                <Route path="/coordinator" element={<Navigate to="/coordinator/dashboard" replace />} />

                                {/* Student Routes */}
                                <Route path="/student/dashboard" element={<StudentDashboard />} />
                                <Route path="/student/setup" element={<ProjectSetup />} />
                                <Route path="/student/topic-status" element={<TopicStatus />} />
                                <Route path="/student/repository" element={<RepositoryManager />} />
                                <Route path="/student/tasks" element={<StudentTaskBoard />} />
                                <Route path="/student/deadlines" element={<StudentDeadlines />} />
                                <Route path="/student/submissions" element={<SubmissionPortal />} />
                                <Route path="/student/feedback" element={<FeedbackReview />} />
                                <Route path="/student/team" element={<TeamView />} />
                                <Route path="/student/progress" element={<ProgressInsights />} />
                                <Route path="/student/archive" element={<DocumentArchive />} />
                                <Route path="/student/chat" element={<StudentChat />} />
                                <Route path="/student/meetings" element={<StudentMeetings />} />
                                <Route path="/student/profile" element={<Profile />} />
                                <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

                                {/* Guide Routes */}
                                <Route path="/guide/dashboard" element={<GuideDashboard />} />
                                <Route path="/guide/topics" element={<TopicApprovals />} />
                                <Route path="/guide/batches" element={<BatchList />} />
                                <Route path="/guide/batches/:batchId/groups" element={<ProjectGroupsGuide />} />
                                <Route path="/guide/groups" element={<ProjectGroupsGuide />} />
                                <Route path="/guide/groups/:groupId" element={<GroupDetailsGuide />} />
                                <Route path="/guide/documents" element={<DocumentReview />} />
                                <Route path="/guide/documents/:docId" element={<FeedbackUI />} />
                                <Route path="/guide/kanban" element={<KanbanOversight />} />
                                <Route path="/guide/git-activity" element={<GitActivityIndicator />} />
                                <Route path="/guide/compliance" element={<ComplianceTracker />} />
                                <Route path="/guide/chat" element={<GuideChat />} />
                                <Route path="/guide/meetings" element={<GuideMeetings />} />
                                <Route path="/guide/extensions" element={<GuideExtensions />} />
                                <Route path="/guide/profile" element={<Profile />} />
                                <Route path="/guide" element={<Navigate to="/guide/dashboard" replace />} />

                                {/* Admin Routes */}
                                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                <Route path="/admin/profile" element={<Profile />} />
                                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                    <Toaster position="top-right" />
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
