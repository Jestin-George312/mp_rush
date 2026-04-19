import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Github, Layout, CheckCircle2, AlertTriangle, 
  Clock, MessageSquare, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // High fidelity mock for a student with a project
  const project = {
    title: 'Smart Health Monitoring System',
    status: 'Approved',
    progress: 45,
    mode: 'Group',
    batch: 'MCA 2024-26 A',
    guide: 'Dr. Sarah Johnson',
    members: ['You (Leader)', 'Jane Smith', 'Bob Wilson'],
    repo: 'alphatech/shm-project',
    nextDeadline: {
      name: 'System Design Doc',
      date: 'April 20, 2026',
      daysLeft: 2
    }
  };

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
               Welcome back, {user?.name}. You are currently leading the <span className="font-black underline decoration-2 underline-offset-4">{project.title}</span> initiative.
            </p>
         </div>
         {/* Decorative background icon */}
         <Layout size={180} className="absolute top-1/2 right-0 -translate-y-1/2 opacity-10 -rotate-12 translate-x-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left: Project Stats & Progress */}
         <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Card className="border-t-4 border-t-green-500">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Status</p>
                     <Badge variant="success" className="text-[10px] font-black">{project.status}</Badge>
                  </div>
                  <div className="flex items-end justify-between">
                     <div>
                        <h3 className="text-xl font-black">Development</h3>
                        <p className="text-xs text-gray-500 font-bold">Phase 2 Ongoing</p>
                     </div>
                     <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                        <CheckCircle2 size={24} />
                     </div>
                  </div>
               </Card>

               <Card className="border-t-4 border-t-orange-500">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Critical Alert</p>
                     <span className="text-orange-600 animate-pulse"><AlertTriangle size={16} /></span>
                  </div>
                  <div className="flex items-end justify-between">
                     <div>
                        <h3 className="text-xl font-black text-orange-600">{project.nextDeadline.daysLeft} Days Left</h3>
                        <p className="text-xs text-gray-500 font-bold">{project.nextDeadline.name}</p>
                     </div>
                     <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                        <Clock size={24} />
                     </div>
                  </div>
               </Card>
            </div>

            <Card className="relative">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Project Completion Velocity</h2>
                  <Badge variant="secondary" className="font-black">{project.progress}% Sync</Badge>
               </div>
               
               <div className="space-y-6">
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]" style={{ width: `${project.progress}%` }}></div>
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
                  {project.members.map((m, i) => (
                     <div key={m} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center font-black text-xs text-blue-600">
                           {m.charAt(0)}
                        </div>
                        <div>
                           <p className="text-xs font-black">{m}</p>
                           {i === 0 && <span className="text-[8px] font-black uppercase text-blue-500 bg-blue-50 px-1 py-0.5 rounded">Group Lead</span>}
                        </div>
                     </div>
                  ))}
               </div>
               <button onClick={() => navigate('/student/chat')} className="w-full mt-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                  <MessageSquare size={16} /> Group Messaging
               </button>
            </Card>

            <Card className="bg-gray-900 text-white">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Guide Detail</h3>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                     SJ
                  </div>
                  <div>
                     <p className="text-sm font-black">{project.guide}</p>
                     <p className="text-[10px] text-blue-400 font-bold">Assigned Mentor</p>
                  </div>
               </div>
               <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase">Batch Support</p>
                     <p className="text-xs font-bold mt-1 uppercase">{project.batch}</p>
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
