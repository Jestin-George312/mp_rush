import { 
  Github, Layout, CheckCircle2, AlertTriangle, 
  Clock, MessageSquare, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { studentApi, type StudentStats, type StudentProject, type StudentInvitation } from '../../services/studentApi';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [project, setProject] = useState<StudentProject | null>(null);
  const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectRes, invRes] = await Promise.all([
          studentApi.getDashboardStats(),
          studentApi.getProjectDetails(),
          studentApi.getInvitations()
        ]);
        setStats(statsRes.data.data);
        setProject(projectRes.data.data);
        setInvitations(invRes.data.data || []);
      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateDaysLeft = (dateStr?: string) => {
    if (!dateStr) return null;
    const deadline = new Date(dateStr);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleInvitation = async (id: number, accept: boolean) => {
    try {
      await studentApi.respondToInvitation(id, accept);
      // Refresh data
      const [statsRes, projectRes, invRes] = await Promise.all([
        studentApi.getDashboardStats(),
        studentApi.getProjectDetails(),
        studentApi.getInvitations()
      ]);
      setStats(statsRes.data.data);
      setProject(projectRes.data.data);
      setInvitations(invRes.data.data || []);
    } catch (error) {
      console.error('Error handling invitation:', error);
    }
  };

  const daysLeft = calculateDaysLeft(stats?.nextDeadline);

  return (
    <div className="space-y-6">
      {/* Header with Background Gradient */}
      <div className="relative p-8 rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20">
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
               <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase tracking-widest">
                  Academic Cycle 2024-26
               </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Project Hub</h1>
            <p className="text-blue-100 mt-2 font-medium max-w-lg">
               Welcome back, {user?.name}. {project ? (
                 <>You are currently working on <span className="font-black underline decoration-2 underline-offset-4">{project.title}</span>.</>
               ) : (
                 <>You haven't joined or created a project group yet.</>
               )}
            </p>
         </div>
         {/* Decorative background icon */}
         <Layout size={180} className="absolute top-1/2 right-0 -translate-y-1/2 opacity-10 -rotate-12 translate-x-12" />
      </div>

      {/* Invitations Section */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
             <AlertTriangle size={16} /> Pending Invitations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map(inv => (
              <Card key={inv.id} className="border-l-4 border-l-orange-500 bg-orange-50/30 dark:bg-orange-900/10">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="font-black text-sm mb-1">{inv.project_title}</h3>
                    <p className="text-xs text-gray-500 font-medium">Invited by <span className="text-orange-600 font-bold">{inv.inv_name || inv.inviter_name}</span></p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleInvitation(inv.id, true)}
                      className="flex-1 py-2 bg-orange-600 text-white text-[10px] font-black rounded-lg hover:bg-orange-700 transition-all"
                    >
                      ACCEPT
                    </button>
                    <button 
                      onClick={() => handleInvitation(inv.id, false)}
                      className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[10px] font-black rounded-lg hover:bg-gray-300 transition-all"
                    >
                      DECLINE
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left: Project Stats & Progress */}
         <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Card className="border-t-4 border-t-green-500">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Status</p>
                     <Badge variant={project?.status === 'Approved' ? 'success' : 'warning'} className="text-[10px] font-black">
                        {project?.status || 'No Project'}
                     </Badge>
                  </div>
                  <div className="flex items-end justify-between">
                     <div>
                        <h3 className="text-xl font-black">{project ? 'Active Project' : 'Get Started'}</h3>
                        <p className="text-xs text-gray-500 font-bold">{project?.mode || 'Phase 1'}</p>
                     </div>
                     <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                        <CheckCircle2 size={24} />
                     </div>
                  </div>
               </Card>

               <Card className="border-t-4 border-t-orange-500">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upcoming Deadline</p>
                     <span className="text-orange-600 animate-pulse"><AlertTriangle size={16} /></span>
                  </div>
                  <div className="flex items-end justify-between">
                     <div>
                        <h3 className="text-xl font-black text-orange-600">{daysLeft !== null ? `${daysLeft} Days Left` : 'No Deadlines'}</h3>
                        <p className="text-xs text-gray-500 font-bold">{stats?.nextDeadline ? new Date(stats.nextDeadline).toLocaleDateString() : 'Stay tuned'}</p>
                     </div>
                     <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                        <Clock size={24} />
                     </div>
                  </div>
               </Card>
            </div>

            <Card className="relative">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Project Progress (Tasks)</h2>
                  <Badge variant="secondary" className="font-black">
                     {stats ? Math.round((stats.kanbanTasks.done / (stats.kanbanTasks.todo + stats.kanbanTasks.inProgress + stats.kanbanTasks.done || 1)) * 100) : 0}% Sync
                  </Badge>
               </div>
               
               <div className="space-y-6">
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500" 
                        style={{ width: `${stats ? (stats.kanbanTasks.done / (stats.kanbanTasks.todo + stats.kanbanTasks.inProgress + stats.kanbanTasks.done || 1)) * 100 : 0}%` }}
                     ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                       { label: 'Topic audit', status: 'Completed', color: 'text-green-500' },
                       { label: 'SRS Doc', status: 'In Review', color: 'text-blue-500' },
                       { label: 'System Design', status: 'Upcoming', color: 'text-gray-300' },
                       { label: 'Frontend', status: 'Upcoming', color: 'text-gray-300' },
                     ].map(step => (
                        <div key={step.label} className="text-center">
                           <div className={`text-[9px] font-black uppercase mb-1 ${step.color}`}>{step.status}</div>
                           <p className="text-[10px] font-bold text-gray-500">{step.label}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button onClick={() => navigate('/student/tasks')} className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl hover:shadow-xl transition-all text-left flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <Layout size={24} />
                  </div>
                  <div>
                     <h3 className="text-sm font-black">Open Task Board</h3>
                     <p className="text-xs text-gray-500 mt-1">Manage sprints and kanban tasks</p>
                  </div>
               </button>
               <button onClick={() => navigate('/student/github')} className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl hover:shadow-xl transition-all text-left flex items-start gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl">
                     <Github size={24} />
                  </div>
                  <div>
                     <h3 className="text-sm font-black">Git Analytics</h3>
                     <p className="text-xs text-gray-500 mt-1">View commit history and sync repo</p>
                  </div>
               </button>
            </div>
         </div>

         {/* Right: Entities & Details */}
         <div className="space-y-6">
            <Card>
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Group Composition</h3>
               <div className="space-y-4">
                  {project?.members.map((m, i) => (
                     <div key={m.uid} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center font-black text-xs text-blue-600">
                           {m.full_name.charAt(0)}
                        </div>
                        <div>
                           <p className="text-xs font-black">{m.full_name} {m.uid === String(user?.id) ? '(You)' : ''}</p>
                           {m.is_leader && <span className="text-[8px] font-black uppercase text-blue-500 bg-blue-50 px-1 py-0.5 rounded">Group Lead</span>}
                        </div>
                     </div>
                  )) || (
                    <div className="text-xs text-gray-400 font-bold">No members yet</div>
                  )}
               </div>
               <button onClick={() => navigate('/student/chat')} className="w-full mt-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                  <MessageSquare size={16} /> Group Messaging
               </button>
            </Card>

            <Card className="bg-gray-900 text-white">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Guide Detail</h3>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                     {project?.guideName?.charAt(0) || 'G'}
                  </div>
                  <div>
                     <p className="text-sm font-black">{project?.guideName || 'Unassigned'}</p>
                     <p className="text-[10px] text-blue-400 font-bold">Assigned Mentor</p>
                  </div>
               </div>
               <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase">Batch Support</p>
                     <p className="text-xs font-bold mt-1 uppercase">{project?.batchName || 'N/A'}</p>
                  </div>
                  <button className="text-blue-400 hover:text-white transition-colors">
                     <ArrowRight size={20} />
                  </button>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
