import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Github, Trello, ClipboardList, 
  MessageSquare, Layout, Activity, ChevronLeft,
  Calendar, Info, ExternalLink, Mail
} from 'lucide-react';

const GroupDetails: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  // Mock detailed data
  const group = {
    id: groupId,
    name: 'AlphaTech',
    batch: 'MCA 2024-26 A',
    title: 'Smart Health Monitoring System',
    description: 'A comprehensive IoT based health tracking system using machine learning for anomaly detection in vital signs.',
    domain: 'IoT & Machine Learning',
    members: [
      { name: 'John Doe', role: 'Leader', email: 'john@univ.edu' },
      { name: 'Jane Smith', role: 'Member', email: 'jane@univ.edu' },
      { name: 'Bob Wilson', role: 'Member', email: 'bob@univ.edu' },
    ],
    github: {
      repo: 'alphatech/shm-project',
      lastUpdate: '2h ago',
      commits: 42,
      contributors: 3
    },
    kanban: {
      todo: 5,
      doing: 2,
      done: 18
    },
    submissions: [
      { id: 's1', name: 'Topic Abstract', status: 'Approved', date: '2026-03-01' },
      { id: 's2', name: 'System Design', status: 'Pending Review', date: '2026-04-10' },
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/guide/groups')}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-gray-50 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[9px] font-black">{group.batch}</Badge>
              <Badge variant="default" className="text-[9px] font-black bg-blue-50 text-blue-600">{group.domain}</Badge>
           </div>
           <h1 className="text-2xl font-black tracking-tight">{group.name} — Supervised Entity</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Project Identity & Members */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <Layout size={40} className="text-gray-100 dark:text-gray-800" />
             </div>
             <div className="space-y-4 relative z-10">
                <h3 className="text-lg font-black">{group.title}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{group.description}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                      <Calendar size={14} /> Created Mar 2026
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                      <Activity size={14} /> Active Activity
                   </div>
                </div>
             </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Git Activity */}
             <Card>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                     <Github size={14} /> Repository Sync
                   </h3>
                   <ExternalLink size={14} className="text-gray-400" />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-between">
                   <div>
                      <p className="text-sm font-black">{group.github.repo}</p>
                      <p className="text-[10px] text-gray-500 font-bold">Latest: Fix modal responsiveness</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-blue-600">{group.github.commits}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Commits</p>
                   </div>
                </div>
                <button className="w-full mt-4 py-2 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all">
                   VISIT PROJECT GITHUB
                </button>
             </Card>

             {/* Kanban Summary */}
             <Card>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                     <Trello size={14} /> Task Board Ecosystem
                   </h3>
                </div>
                <div className="flex justify-between items-center px-2">
                   <div className="text-center">
                      <p className="text-lg font-black text-orange-600">{group.kanban.todo}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Todo</p>
                   </div>
                   <div className="text-center">
                      <p className="text-lg font-black text-blue-600">{group.kanban.doing}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Doing</p>
                   </div>
                   <div className="text-center">
                      <p className="text-lg font-black text-green-600">{group.kanban.done}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Done</p>
                   </div>
                </div>
                <button 
                  onClick={() => navigate('/guide/kanban')}
                  className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10"
                >
                   ENTER BOARD OVERSIGHT
                </button>
             </Card>
          </div>

          {/* Submissions List */}
          <Card>
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
               <ClipboardList size={14} /> Documentation Audit Trail
             </h3>
             <div className="space-y-3">
                {group.submissions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                           <ClipboardList size={16} className="text-gray-400" />
                        </div>
                        <div>
                           <p className="text-xs font-bold">{s.name}</p>
                           <p className="text-[9px] text-gray-400 font-bold">{s.date}</p>
                        </div>
                     </div>
                     <Badge variant={s.status === 'Approved' ? 'success' : 'warning'} className="text-[9px] font-black">
                        {s.status} Badge
                     </Badge>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Right Column: Members & Quick Navigation */}
        <div className="space-y-6">
           <Card>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Project Entities</h3>
              <div className="space-y-4">
                 {group.members.map((m) => (
                   <div key={m.email} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center font-black text-sm text-[rgb(var(--color-primary))]">
                            {m.name[0]}
                         </div>
                         <div>
                            <p className="text-xs font-black">{m.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold">{m.role}</p>
                         </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                         <Mail size={16} />
                      </button>
                   </div>
                 ))}
              </div>
              <button className="w-full mt-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                 <MessageSquare size={16} /> Direct Group Chat
              </button>
           </Card>

           <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl flex items-start gap-3">
              <Info size={20} className="text-orange-500 flex-shrink-0" />
              <div>
                 <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Guide Insight</p>
                 <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                   AlphaTech is currently ahead of schedule for the Designing Phase. Recommend focusing on backend security next week.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
