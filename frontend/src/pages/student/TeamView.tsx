import React from 'react';
import Card from '../../components/common/UI/Card';
import { 
  Users, Mail, Shield,
  MessageSquare, Video,
  Activity, Star, Loader2
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import type { StudentProject } from '../../services/studentApi';

const TeamView: React.FC = () => {
  const [project, setProject] = React.useState<StudentProject | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await studentApi.getProjectDetails();
        setProject((res.data as any).data || res.data);
      } catch (err) {
        console.error('Fetch team error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const team = {
    name: project?.title || 'No Project Linked',
    mode: project?.mode || 'N/A',
    guide: project?.guideName || 'No Guide Assigned',
    members: (project?.members || []).map(m => ({
      name: m.full_name,
      role: m.is_leader ? 'Group Leader' : 'Collaborator',
      email: m.email,
      commits: 0,
      tasks: 0
    }))
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Collaboration Identity</h1>
           <p className="text-gray-500">Managing project entities and team participation metrics</p>
        </div>
        <div className="flex bg-blue-600 text-white px-6 py-2 rounded-2xl shadow-xl shadow-blue-500/10 items-center gap-2">
           <Users size={20} />
           <span className="text-xs font-black uppercase tracking-widest">{team.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Team Members List */}
         <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {team.members.map((member, i) => (
                 <Card key={i} className={`relative overflow-hidden ${member.role === 'Group Leader' ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/5' : ''}`}>
                    {member.role === 'Group Leader' && (
                       <div className="absolute top-0 right-0 p-3">
                          <Star size={18} className="text-blue-500 fill-blue-500" />
                       </div>
                    )}
                    <div className="flex flex-col h-full space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center font-black text-xl text-blue-600 shadow-sm border border-gray-100 dark:border-gray-700">
                             {member.name[0]}
                          </div>
                          <div>
                             <h3 className="text-lg font-black">{member.name}</h3>
                             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{member.role}</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50 dark:border-gray-700">
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Git Commits</p>
                             <p className="text-xl font-black">{member.commits}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tasks Resolved</p>
                             <p className="text-xl font-black">{member.tasks}</p>
                          </div>
                       </div>

                       <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                             <Mail size={14} className="text-gray-400" />
                             <span className="text-[10px] font-bold text-gray-500">{member.email}</span>
                          </div>
                          <button className="text-blue-500 hover:text-blue-600">
                             <MessageSquare size={16} />
                          </button>
                       </div>
                    </div>
                 </Card>
               ))}
            </div>
            
            <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between p-8 border-none shadow-2xl overflow-hidden relative">
               <div className="relative z-10">
                  <h4 className="text-lg font-black tracking-tight">Technical Supervisor</h4>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">{team.guide}</p>
                  <div className="flex gap-4 mt-6">
                     <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><Mail size={18} /></button>
                     <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><Video size={18} /></button>
                     <button className="px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">SCHEDULE REVIEW</button>
                  </div>
               </div>
               <Shield size={160} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 opacity-5 -rotate-12" />
            </Card>
         </div>

         {/* Entity Stats - Removed as requested */}
      </div>
    </div>
  );
};

export default TeamView;
