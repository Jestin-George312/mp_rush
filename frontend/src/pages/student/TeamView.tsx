import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import { 
  Users, Mail, Shield,
  MessageSquare, Video,
  Activity, Star, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/studentApi';
import type { StudentProject } from '../../services/studentApi';

const TeamView: React.FC = () => {
  const navigate = useNavigate();
  const [project, setProject] = useState<StudentProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await studentApi.getProjectDetails();
        setProject(projRes.data.data);
      } catch (err) {
        console.error('Fetch team error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const teamMembers = (project?.members || []).map(m => ({
    uid: m.uid,
    name: m.full_name,
    role: m.is_leader ? 'Group Leader' : 'Collaborator',
    email: m.email,
    commits: m.commits_count || 0,
    tasks: m.tasks_done || 0
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black tracking-tight text-gray-800 dark:text-white">Collaboration Identity</h1>
           <p className="text-gray-500 font-medium">Managing project entities and team participation metrics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
           <div className="flex bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-500/20 items-center gap-3">
              <Users size={20} />
              <span className="text-xs font-black uppercase tracking-widest">{project?.title || 'No Active Project'}</span>
           </div>
           {project?.mode && (
             <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl shadow-sm ${
               project.mode === 'Group' 
                 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                 : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
             }`}>
               {project.mode} Project
             </span>
           )}
           {project?.domain && (
             <span className="text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shadow-sm">
               {project.domain}
             </span>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Team Members List */}
         <div className="lg:col-span-3 space-y-8">
            <div>
               <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  Active Project Members
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teamMembers.length > 0 ? teamMembers.map((member, i) => (
                    <Card key={i} className={`relative overflow-hidden group transition-all hover:scale-[1.02] ${member.role === 'Group Leader' ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/5' : ''}`}>
                       {member.role === 'Group Leader' && (
                          <div className="absolute top-0 right-0 p-4">
                             <div className="bg-amber-100 text-amber-600 p-1.5 rounded-full shadow-sm">
                                <Star size={16} className="fill-amber-600" />
                             </div>
                          </div>
                       )}
                       <div className="flex flex-col h-full space-y-6">
                          <div className="flex items-center gap-5">
                             <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center font-black text-2xl text-blue-600 shadow-sm border border-blue-100/50 dark:border-gray-600">
                                {member.name[0]}
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white">{member.name}</h3>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{member.role}</p>
                             </div>
                          </div>
   
                          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                             <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Git Commits</p>
                                <p className="text-xl font-black">{member.commits}</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tasks Resolved</p>
                                <p className="text-xl font-black">{member.tasks}</p>
                             </div>
                          </div>
   
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl flex items-center justify-between mt-auto group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                             <div className="flex items-center gap-2">
                                <Mail size={14} className="text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500 truncate max-w-[120px]">{member.email}</span>
                             </div>
                             <button 
                               onClick={() => navigate('/student/chat')}
                               className="p-2 bg-white dark:bg-gray-800 text-blue-500 hover:text-white hover:bg-blue-500 rounded-xl transition-all shadow-sm"
                             >
                                <MessageSquare size={18} />
                             </button>
                          </div>
                       </div>
                    </Card>
                  )) : (
                    <Card className="md:col-span-2 py-12 text-center border-dashed border-2">
                       <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                          <Users size={32} className="text-gray-300" />
                       </div>
                       <p className="text-sm font-bold text-gray-500">No team members found. Start by setting up your project.</p>
                       <button 
                        onClick={() => navigate('/student/setup')}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all"
                       >
                          SETUP PROJECT
                       </button>
                    </Card>
                  )}
               </div>
            </div>
         </div>

         {/* Sidebar Stats */}
         <div className="space-y-6">
            
            <Card className="border-t-4 border-t-indigo-500">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Group Metadata</h4>
               <div className="space-y-6">
                  <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Collaboration Mode</p>
                     <p className="text-sm font-black">{project?.mode || 'Phase 1 - Initial'}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Associated Batch</p>
                     <p className="text-sm font-black text-indigo-600">{project?.batchName || 'N/A'}</p>
                  </div>
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                     <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Team Activity</p>
                        <span className="text-[10px] font-black text-indigo-500">{project?.teamActivity || 0}%</span>
                     </div>
                     <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                           style={{ width: `${project?.teamActivity || 0}%` }}
                        ></div>
                     </div>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default TeamView;

