import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Input from '../../components/common/UI/Input';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import { 
  Github, Activity, GitCommit, GitBranch, 
  ExternalLink, Link as LinkIcon, 
  AlertCircle, CheckCircle2 
} from 'lucide-react';

const RepositoryManager: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLinked, setIsLinked] = useState(false);

  // Mock repo data
  const repoData = {
    name: 'alphatech/health-sync',
    status: 'Connected',
    lastSync: '5 minutes ago',
    commits: 42,
    branch: 'main'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Repository Ecosystem</h1>
           <p className="text-gray-500">Sync your codebase for technical monitoring and guide auditing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Config Panel */}
         <div className="lg:col-span-2 space-y-6">
            <Card>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                  <Github size={16} /> GitHub Integration
               </h3>
               
               {!isLinked ? (
                 <div className="space-y-6">
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                       <LinkIcon size={40} className="mx-auto text-gray-300 mb-4" />
                       <h4 className="text-lg font-black tracking-tight">Connect Repository</h4>
                       <p className="text-xs text-gray-500 max-w-xs mx-auto mt-2 font-medium">Link your project's GitHub URL to enable automated task and commit tracking.</p>
                    </div>
                    <div>
                       <div className="relative">
                          <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input 
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repository" 
                            className="pl-12 h-14 text-sm font-medium"
                          />
                       </div>
                       <Button 
                        onClick={() => setIsLinked(true)}
                        className="w-full mt-4 py-4 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-900/10"
                       >
                         VERIFY & LINK REPOSITORY
                       </Button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between p-6 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-600 text-white rounded-xl shadow-lg ring-4 ring-green-500/10">
                             <CheckCircle2 size={24} />
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-green-800 dark:text-green-300">Successfully Linked</h4>
                             <p className="text-xs text-green-600 font-bold uppercase tracking-tighter">Sync Mode: Automated Webhooks</p>
                          </div>
                       </div>
                       <button onClick={() => setIsLinked(false)} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Disconnect</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                             <GitCommit size={12} className="text-blue-500" /> Commits Detected
                          </p>
                          <h5 className="text-2xl font-black tracking-tight">{repoData.commits}</h5>
                       </div>
                       <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                             <Activity size={12} className="text-orange-500" /> Last Polled
                          </p>
                          <h5 className="text-lg font-black tracking-tight text-gray-500 mt-1">{repoData.lastSync}</h5>
                       </div>
                    </div>
                 </div>
               )}
            </Card>

            <Card>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Technical Context</h3>
                  <Badge variant="secondary" className="font-black">GIT ANALYTICS</Badge>
               </div>
               <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-colors group">
                       <div className="flex items-center gap-3">
                          <GitBranch size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Refactor auth middleware for JWT sync</span>
                       </div>
                       <ExternalLink size={14} className="text-gray-300" />
                    </div>
                  ))}
               </div>
            </Card>
         </div>

         {/* Right Sidebar: Instructions */}
         <div className="space-y-6">
            <Card className="bg-blue-600 text-white shadow-xl shadow-blue-500/20">
               <h4 className="text-xs font-black uppercase tracking-widest opacity-70 mb-6">Integration Guide</h4>
               <ul className="space-y-4">
                  <li className="flex gap-3 text-xs font-medium leading-relaxed">
                     <span className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black">1</span>
                     Ensure your repository is either Public or accessible to the APMS monitoring bot.
                  </li>
                  <li className="flex gap-3 text-xs font-medium leading-relaxed">
                     <span className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black">2</span>
                     Only one repository URL can be active per project group.
                  </li>
                  <li className="flex gap-3 text-xs font-medium leading-relaxed">
                     <span className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black">3</span>
                     Commits on the "main" branch are tracked for academic progression scoring.
                  </li>
               </ul>
            </Card>

            <div className="p-5 border border-orange-100 dark:border-orange-900/10 bg-orange-50/20 rounded-2xl flex items-start gap-4">
               <AlertCircle size={24} className="text-orange-500 flex-shrink-0" />
               <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                  Project topic must be <b>Approved</b> before you can link your production repository.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RepositoryManager;
