import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Github, Trello, ClipboardList, 
  MessageSquare, Layout, Activity, ChevronLeft,
  Calendar, Info, ExternalLink, Mail, Loader2
} from 'lucide-react';
import { guideApi } from '../../services/guideApi';

const GroupDetails: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!groupId) return;
        const res = await guideApi.getGroupDetails(groupId);
        setGroup(res.data.data);
      } catch (err) {
        console.error('Error fetching group details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-500">Group not found or not authorized.</h2>
      </div>
    );
  }

  // Calculate stats from tasks
  const kanban = {
    todo: group.tasks?.filter((t: any) => t.status === 'todo').length || 0,
    doing: group.tasks?.filter((t: any) => t.status === 'inprogress').length || 0,
    done: group.tasks?.filter((t: any) => t.status === 'done').length || 0
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
              <Badge variant="secondary" className="text-[9px] font-black">{group.batch_name}</Badge>
              <Badge variant="default" className="text-[9px] font-black bg-blue-50 text-blue-600">{group.domain || 'General'}</Badge>
           </div>
           <h1 className="text-2xl font-black tracking-tight">{group.group_name} — Supervised Entity</h1>
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
                <h3 className="text-lg font-black">{group.title || 'Untitled Project'}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {group.description || 'No project description provided yet.'}
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                      <Calendar size={14} /> Created {new Date(group.created_at).toLocaleDateString()}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                      <Activity size={14} /> {group.review_state || 'Pending'} Status
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
                   <div className="overflow-hidden">
                      <p className="text-sm font-black truncate">{group.github_repo || 'Not Linked'}</p>
                      <p className="text-[10px] text-gray-500 font-bold">Latest: Auto-sync active</p>
                   </div>
                   <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs font-black text-blue-600">--</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Commits</p>
                   </div>
                </div>
                <button 
                  onClick={() => group.github_repo && window.open(group.github_repo, '_blank')}
                  disabled={!group.github_repo}
                  className="w-full mt-4 py-2 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                >
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
                      <p className="text-lg font-black text-orange-600">{kanban.todo}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Todo</p>
                   </div>
                   <div className="text-center">
                      <p className="text-lg font-black text-blue-600">{kanban.doing}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Doing</p>
                   </div>
                   <div className="text-center">
                      <p className="text-lg font-black text-green-600">{kanban.done}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Done</p>
                   </div>
                </div>
                <button 
                  onClick={() => navigate(`/guide/groups/${groupId}/kanban`)}
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
                {group.documents?.length > 0 ? group.documents.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                           <ClipboardList size={16} className="text-gray-400" />
                        </div>
                        <div>
                           <p className="text-xs font-bold">{s.name}</p>
                           <p className="text-[9px] text-gray-400 font-bold">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <Badge variant={s.status === 'Approved' ? 'success' : 'warning'} className="text-[9px] font-black">
                        {s.status}
                     </Badge>
                  </div>
                )) : (
                  <p className="text-center py-6 text-xs text-gray-400 font-bold italic">No documents submitted yet</p>
                )}
             </div>
          </Card>
        </div>

        {/* Right Column: Members & Quick Navigation */}
        <div className="space-y-6">
           <Card>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Project Entities</h3>
              <div className="space-y-4">
                 {group.members?.map((m: any) => (
                   <div key={m.email} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center font-black text-sm text-blue-600">
                            {m.full_name?.[0] || 'S'}
                         </div>
                         <div>
                            <p className="text-xs font-black">{m.full_name || 'Unnamed Student'}</p>
                            <p className="text-[9px] text-gray-400 font-bold">{m.is_leader ? 'Leader' : 'Member'}</p>
                         </div>
                      </div>
                      <a href={`mailto:${m.email}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                         <Mail size={16} />
                      </a>
                   </div>
                 ))}
              </div>
              <button 
                onClick={() => navigate(`/guide/chat?groupId=${groupId}`)}
                className="w-full mt-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
              >
                 <MessageSquare size={16} /> Direct Group Chat
              </button>
           </Card>

           <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl flex items-start gap-3">
              <Info size={20} className="text-orange-500 flex-shrink-0" />
              <div>
                 <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Guide Insight</p>
                 <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                   {group.review_state === 'Approved' 
                    ? `${group.group_name} is currently active. Ensure they are following the proposed architecture.`
                    : `${group.group_name} topic is currently ${group.review_state || 'Pending'}. Review their abstract soon.`}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
