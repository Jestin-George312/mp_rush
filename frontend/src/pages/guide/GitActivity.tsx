import React from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Github, Activity, GitCommit, 
  ExternalLink, Clock, AlertCircle
} from 'lucide-react';

import { guideApi } from '../../services/guideApi';

const GitActivity: React.FC = () => {
  const [groupActivity, setGroupActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchGitActivity = async () => {
      try {
        const res = await guideApi.getGitActivity();
        const data = (res.data as any).data || res.data;
        setGroupActivity(data);
      } catch (err) {
        console.error('Error fetching git activity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGitActivity();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Git Activity Monitoring</h1>
           <p className="text-gray-500">Real-time repository tracking and contributor analytics</p>
        </div>
        <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
           <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black shadow-lg shadow-blue-500/20">All Active</button>
           <button className="px-4 py-2 text-gray-400 text-xs font-black">Inactive Only</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {groupActivity.map(group => (
           <Card key={group.groupId} className={`border-l-4 ${group.repoUrl ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="space-y-6">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className={`p-4 rounded-xl ${group.repoUrl ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 shadow-lg shadow-red-500/10'}`}>
                          <Github size={24} />
                       </div>
                       <div>
                          <h3 className="text-lg font-black">{group.groupName}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.title}</p>
                       </div>
                    </div>
                    <Badge variant={group.repoUrl ? 'success' : 'danger'} className="text-[10px] px-3 font-black">
                       {group.repoUrl ? 'HEALTHY' : 'AT RISK'}
                    </Badge>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Activity size={12} className="text-blue-500" /> Commits (7D)
                       </p>
                       <h4 className="text-2xl font-black text-gray-800 dark:text-white">N/A</h4>
                       <p className="text-[9px] text-gray-500 font-bold mt-1">Pending Webhook Setup</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Clock size={12} className="text-orange-500" /> Last Push
                       </p>
                       <h4 className="text-2xl font-black text-gray-800 dark:text-white leading-tight">
                         {group.lastCommit ? new Date(group.lastCommit.date).toLocaleDateString() : 'N/A'}
                       </h4>
                       <p className={`text-[9px] font-bold mt-1 ${group.repoUrl ? 'text-green-500' : 'text-red-500'}`}>
                          {group.repoUrl ? 'Regular Activity' : 'Critical Inactivity'}
                       </p>
                    </div>
                 </div>

                 {group.lastCommit ? (
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Recent Artifacts</p>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                         <div className="flex items-center gap-3">
                            <GitCommit size={16} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{group.lastCommit.message}</span>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-blue-600 uppercase">{group.lastCommit.author}</p>
                            <p className="text-[9px] text-gray-400 font-bold">{new Date(group.lastCommit.date).toLocaleDateString()}</p>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="py-8 bg-red-50/20 rounded-2xl flex flex-col items-center justify-center text-center px-6">
                      <AlertCircle size={32} className="text-red-500 mb-2" />
                      <p className="text-xs font-black text-red-600">INACTIVITY ALERT</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase">No repository sync detected in the last 7 production days.</p>
                   </div>
                 )}

                 <button className="w-full py-3 bg-gray-50 dark:bg-gray-800 text-xs font-black text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-gray-100 dark:border-gray-700">
                    <ExternalLink size={16} /> FORK-LEVEL ANALYSIS ON GITHUB
                 </button>
              </div>
           </Card>
         ))}
      </div>
    </div>
  );
};

export default GitActivity;
