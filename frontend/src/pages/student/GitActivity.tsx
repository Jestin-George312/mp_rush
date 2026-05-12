import React, { useEffect, useState } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Github, GitCommit, GitBranch, 
  Activity, Info, Code, Loader2
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const StudentGitActivity: React.FC = () => {
  const [data, setData] = useState<{repoUrl: string | null, commits: any[]}>({ repoUrl: null, commits: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGitData = async () => {
      try {
        const res = await studentApi.getGitCommits();
        setData(res.data.data);
      } catch (err) {
        console.error('Error fetching git activity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGitData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  const repoName = data.repoUrl ? data.repoUrl.replace('https://github.com/', '') : 'No Repository Linked';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Code & Commits</h1>
           <p className="text-gray-500">Monitor your project's technical progression via GitHub Sync</p>
        </div>
        {data.repoUrl && (
          <button 
            onClick={() => window.open(data.repoUrl!, '_blank')}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-gray-900/10"
          >
             <Github size={18} /> OPEN REPOSITORY
          </button>
        )}
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
               <h3 className="text-lg font-black tracking-tight truncate">{repoName}</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Primary GitHub Target</p>
               
               <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                  <div>
                     <p className="text-[9px] font-black text-gray-500 uppercase">Latest Feed</p>
                     <p className="text-xl font-black">{data.commits.length} Recent</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-gray-500 uppercase">Status</p>
                     <p className="text-xl font-black">{data.repoUrl ? 'Active' : 'Missing'}</p>
                  </div>
               </div>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
               <div className="flex items-center gap-3">
                  <GitBranch size={20} className="text-blue-600" />
                  <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Branch</p>
                     <p className="text-sm font-black text-gray-800 dark:text-white">main</p>
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
               <button 
                onClick={() => window.location.reload()}
                className="text-[10px] font-black text-blue-600 uppercase hover:underline"
               >
                 Refresh Logs
               </button>
            </div>
            <Card>
               <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.commits.length > 0 ? data.commits.map((commit: any) => (
                    <div key={commit.sha} className="py-4 first:pt-0 last:pb-0 group">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-lg bg-blue-50 text-blue-600`}>
                                <GitCommit size={14} />
                             </div>
                             <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{commit.message}</span>
                          </div>
                          <code className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded uppercase">{commit.sha.substring(0, 7)}</code>
                       </div>
                       <div className="flex items-center gap-3 ml-8">
                          <span className="text-[9px] font-black text-gray-400 uppercase">{commit.author}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(commit.date).toLocaleString()}</span>
                       </div>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-gray-400 italic text-sm">
                      No commits found. Make sure your repository is public or your token has access.
                    </div>
                  )}
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
