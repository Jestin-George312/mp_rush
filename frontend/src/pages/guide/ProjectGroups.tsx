import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import { 
  Users, Github, Search, 
  Filter, ChevronRight, Activity,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/common/UI/Badge';
import Input from '../../components/common/UI/Input';
import { guideApi, type ProjectGroupMeta } from '../../services/guideApi';

const ProjectGroups: React.FC = () => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState<ProjectGroupMeta[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const res = batchId 
          ? await guideApi.getBatchGroups(batchId)
          : await guideApi.getSupervisedGroups();
        const data = (res.data as any).data || res.data;
        setGroups(data);
      } catch (err) {
        console.error('Error fetching supervised groups:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [batchId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Supervised Groups</h1>
          <p className="text-gray-500">Managing all project entities across assigned batches</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="secondary" className="px-3 py-1 font-black">{groups.filter(g => g.health === 'Healthy').length} HEALTHY</Badge>
           <Badge variant="warning" className="px-3 py-1 font-black">{groups.filter(g => g.health === 'Warning').length} ISSUES</Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by group name, project title or batch..." 
            className="pl-10 h-11"
          />
        </div>
        <button className="px-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center gap-2 text-xs font-black shadow-sm">
           <Filter size={16} /> Advanced Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="hover:border-blue-500 transition-all">
            <div
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer hover:translate-x-1 transition-transform"
              onClick={() => navigate(`/guide/groups/${group.id}`)}
            >
               <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">{group.batchName}</span>
                     <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                       group.health === 'Healthy' ? 'bg-green-50 text-green-600' : 
                       group.health === 'Warning' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                     }`}>
                       {group.health === 'Healthy' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                       {group.health}
                     </div>
                  </div>
                  
                  <h3 className="text-lg font-black">{group.name} — <span className="font-bold text-gray-500">{group.title}</span></h3>
                  
                  <div className="flex flex-wrap items-center gap-6">
                     <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                        <Users size={14} className="text-gray-400" /> {group.members?.join(', ') || 'No members'}
                     </div>
                     <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                        <Github size={14} /> {group.repoUrl ? group.repoUrl.replace('github.com/', '') : 'Not Connected'}
                     </div>
                  </div>

                  {group.lastCommit && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2 text-[10px] font-medium text-gray-400 border border-gray-100 dark:border-gray-700">
                      <Activity size={12} className="text-blue-500" />
                      <span className="font-bold text-gray-600 dark:text-gray-300">Activity:</span> {typeof group.lastCommit === 'string' ? group.lastCommit : group.lastCommit.message}
                    </div>
                  )}
               </div>

               <div className="flex lg:flex-col items-center gap-3 lg:items-end">
                  <div className="text-right hidden lg:block">
                     <p className="text-[9px] font-black text-gray-400 uppercase">Current Phase</p>
                     <p className="text-xs font-black text-blue-600">{group.status}</p>
                  </div>
                  <button className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                     <ChevronRight size={20} />
                  </button>
               </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectGroups;
