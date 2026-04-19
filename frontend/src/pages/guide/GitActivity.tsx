import React from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Github, Activity, GitCommit, 
  ExternalLink, Clock, AlertCircle
} from 'lucide-react';

const GitActivity: React.FC = () => {
  const groupActivity = [
    {
      id: 'g1',
      name: 'AlphaTech',
      batch: 'MCA 2024-26 A',
      repo: 'github.com/alphatech/shm',
      lastPush: 'Just Now',
      commitsWeek: 14,
      health: 'Healthy',
      contributors: [
        { name: 'John', commits: 22 },
        { name: 'Jane', commits: 15 },
        { name: 'Bob', commits: 5 }
      ],
      recentCommits: [
        { msg: 'Setup docker configuration', time: '2h ago', author: 'John' },
        { msg: 'Finalize API documentation', time: '5h ago', author: 'Jane' }
      ]
    },
    {
      id: 'g2',
      name: 'Sentinel',
      batch: 'MCA 2024-26 A',
      repo: 'github.com/sentinel/fraud-detect',
      lastPush: '8 days ago',
      commitsWeek: 0,
      health: 'At Risk',
      contributors: [],
      recentCommits: []
    }
  ];

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
           <Card key={group.id} className={`border-l-4 ${group.health === 'Healthy' ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="space-y-6">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className={`p-4 rounded-xl ${group.health === 'Healthy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 shadow-lg shadow-red-500/10'}`}>
                          <Github size={24} />
                       </div>
                       <div>
                          <h3 className="text-lg font-black">{group.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.batch}</p>
                       </div>
                    </div>
                    <Badge variant={group.health === 'Healthy' ? 'success' : 'danger'} className="text-[10px] px-3 font-black">
                       {group.health.toUpperCase()}
                    </Badge>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Activity size={12} className="text-blue-500" /> Commits (7D)
                       </p>
                       <h4 className="text-2xl font-black text-gray-800 dark:text-white">{group.commitsWeek}</h4>
                       <p className="text-[9px] text-gray-500 font-bold mt-1">Total: {group.commitsWeek * 4} this month</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Clock size={12} className="text-orange-500" /> Last Push
                       </p>
                       <h4 className="text-2xl font-black text-gray-800 dark:text-white leading-tight">{group.lastPush}</h4>
                       <p className={`text-[9px] font-bold mt-1 ${group.health === 'Healthy' ? 'text-green-500' : 'text-red-500'}`}>
                          {group.health === 'Healthy' ? 'Regular Activity' : 'Critical Inactivity'}
                       </p>
                    </div>
                 </div>

                 {group.recentCommits.length > 0 ? (
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Recent Artifacts</p>
                      {group.recentCommits.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                           <div className="flex items-center gap-3">
                              <GitCommit size={16} className="text-gray-400" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{c.msg}</span>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-blue-600 uppercase">{c.author}</p>
                              <p className="text-[9px] text-gray-400 font-bold">{c.time}</p>
                           </div>
                        </div>
                      ))}
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
