import React from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Github, GitCommit, GitBranch, 
  Activity, Info, Code 
} from 'lucide-react';

const StudentGitActivity: React.FC = () => {
  const repoData = {
    name: 'alphatech/shm-project',
    branch: 'main',
    totalCommits: 42,
    lastPush: '2 hours ago',
    commits: [
      { id: 'c1', msg: 'Implement JWT Auth flow', author: 'You', time: '2h ago', hash: '8f2a1c' },
      { id: 'c2', msg: 'Setup docker configuration', author: 'Jane Smith', time: '5h ago', hash: '4d3b9e' },
      { id: 'c3', msg: 'Fix mobile responsiveness on dashboard', author: 'You', time: '1d ago', hash: '2a1f8c' },
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Code & Commits</h1>
           <p className="text-gray-500">Monitor your project's technical progression via GitHub Sync</p>
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-gray-900/10">
           <Github size={18} /> OPEN REPOSITORY
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Repo Stats */}
         <div className="lg:col-span-1 space-y-4">
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
               <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                     <Code size={24} />
                  </div>
                  <Badge className="bg-blue-600 text-white border-none text-[9px] font-black uppercase">LIVE SYNC</Badge>
               </div>
               <h3 className="text-lg font-black tracking-tight truncate">{repoData.name}</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Primary GitHub Target</p>
               
               <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                  <div>
                     <p className="text-[9px] font-black text-gray-500 uppercase">Commits</p>
                     <p className="text-xl font-black">{repoData.totalCommits}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-gray-500 uppercase">Last Push</p>
                     <p className="text-xl font-black">{repoData.lastPush}</p>
                  </div>
               </div>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
               <div className="flex items-center gap-3">
                  <GitBranch size={20} className="text-blue-600" />
                  <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Branch</p>
                     <p className="text-sm font-black text-gray-800 dark:text-white">{repoData.branch}</p>
                  </div>
               </div>
            </Card>

            <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl flex items-start gap-3">
               <Info size={20} className="text-blue-500 flex-shrink-0" />
               <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">
                 Syncing your repository allows your guide to monitor technical progress and provide feedback on code structure.
               </p>
            </div>
         </div>

         {/* Commit Feed */}
         <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Activity size={14} /> Recent Sync Activity
               </h3>
               <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">Refresh Logs</button>
            </div>
            <Card>
               <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {repoData.commits.map((commit) => (
                    <div key={commit.id} className="py-4 first:pt-0 last:pb-0 group">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-lg ${commit.author === 'You' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                <GitCommit size={14} />
                             </div>
                             <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{commit.msg}</span>
                          </div>
                          <code className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded uppercase">{commit.hash}</code>
                       </div>
                       <div className="flex items-center gap-3 ml-8">
                          <span className="text-[9px] font-black text-gray-400 uppercase">{commit.author}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-[9px] font-black text-gray-400 uppercase">{commit.time}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>
            
            <button className="w-full py-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase hover:bg-gray-100 transition-all">
               Load Older Activity...
            </button>
         </div>
      </div>
    </div>
  );
};

export default StudentGitActivity;
