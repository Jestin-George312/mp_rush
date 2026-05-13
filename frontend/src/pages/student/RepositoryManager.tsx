import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Input from '../../components/common/UI/Input';
import Button from '../../components/common/UI/Button';

import { 
  Github, Activity, GitCommit, GitBranch, 
  ExternalLink, Link as LinkIcon, 
  AlertCircle, CheckCircle2, Loader2 
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import type { StudentProject } from '../../services/studentApi';
import { toast } from 'react-hot-toast';

const RepositoryManager: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [project, setProject] = useState<StudentProject | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projectRes, commitsRes, statsRes] = await Promise.all([
        studentApi.getProjectDetails(),
        studentApi.getGitCommits(),
        studentApi.getDashboardStats()
      ]);
      setProject(projectRes.data.data);
      setCommits(commitsRes.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleFetchHealth = async () => {
    if (!project?.id) return;
    setIsAnalyzing(true);
    setHealthReport(null);
    try {
      const res = await studentApi.getGitHealth(project.id);
      setHealthReport((res.data as any).data || res.data);
    } catch (err) {
      toast.error('Failed to generate health analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLinkRepo = async () => {
    // Basic Validation
    if (!repoUrl) {
      toast.error('Please enter a repository URL');
      return;
    }

    if (!repoUrl.toLowerCase().includes('github.com')) {
      toast.error('Please provide a valid GitHub repository URL');
      return;
    }

    if (project?.status !== 'Approved') {
      toast.error('Your project topic must be approved before linking a repository.');
      return;
    }

    setIsLinking(true);
    try {
      await studentApi.linkRepository(repoUrl);
      toast.success('Repository linked successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to link repository');
    } finally {
      setIsLinking(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this repository?')) return;
    try {
      await studentApi.linkRepository(''); // Pass empty string to unlink
      toast.success('Repository disconnected');
      setRepoUrl('');
      fetchData();
    } catch (err) {
      toast.error('Failed to disconnect repository');
    }
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
               
               {isLoading ? (
                  <div className="flex justify-center p-12">
                     <Loader2 className="animate-spin text-blue-500" size={32} />
                  </div>
               ) : !project?.github_repo ? (
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
                             disabled={project?.status !== 'Approved'}
                           />
                        </div>
                        <Button 
                         onClick={handleLinkRepo}
                         disabled={isLinking || project?.status !== 'Approved'}
                         className="w-full mt-4 py-4 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-900/10 disabled:opacity-50"
                        >
                          {isLinking ? 'Verifying...' : 'VERIFY & LINK REPOSITORY'}
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
                              <h4 className="text-lg font-black text-green-800 dark:text-green-300 truncate max-w-[200px]">{project.github_repo.split('/').slice(-1)[0]}</h4>
                              <p className="text-xs text-green-600 font-bold uppercase tracking-tighter">Sync Mode: Automated Tracking</p>
                           </div>
                        </div>
                        <button onClick={handleDisconnect} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Disconnect</button>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <GitCommit size={12} className="text-blue-500" /> Commits Detected
                           </p>
                           <h5 className="text-2xl font-black tracking-tight">{commits.length}</h5>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
                           <h5 className={`text-lg font-black tracking-tight mt-1 ${stats?.systemStatus === 'Active Sync' ? 'text-green-600' : 'text-gray-500'}`}>
                             {stats?.systemStatus || 'Pending'}
                           </h5>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Activity size={12} className="text-orange-500" /> Infrastructure
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </Card>

            <Card>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Technical Context</h3>
                  <button 
                    onClick={handleFetchHealth}
                    disabled={isAnalyzing || !project?.github_repo}
                    className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                     {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                     GIT ANALYTICS
                  </button>
               </div>

               {/* AI Assistance Analysis Report */}
               {healthReport && (
                 <div className="mb-6 rounded-2xl overflow-hidden shadow-xl border border-white/10 animate-in slide-in-from-top-4 duration-500">
                    {/* Header bar */}
                    <div className={`px-6 py-4 flex items-center justify-between
                      ${healthReport.aiAssistanceLevel === 'Minimal' ? 'bg-emerald-900' :
                        healthReport.aiAssistanceLevel === 'Moderate' ? 'bg-blue-900' :
                        healthReport.aiAssistanceLevel === 'Significant' ? 'bg-orange-900' : 'bg-red-900'}`}>
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50 mb-0.5">AI Assistance Estimation</p>
                          <h4 className="text-lg font-black text-white flex items-center gap-2">
                             {healthReport.aiAssistanceLevel}
                             <span className="text-xs font-bold text-white/60">· {healthReport.confidenceScore}% confidence</span>
                          </h4>
                       </div>
                       <button onClick={() => setHealthReport(null)} className="text-white/40 hover:text-white transition-colors">
                          <AlertCircle size={18} />
                       </button>
                    </div>

                    <div className="bg-gray-900 p-6 space-y-5">
                       {/* Technical Reasons */}
                       <div>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Technical Assessment</p>
                          <p className="text-xs text-gray-300 leading-relaxed font-medium">{healthReport.technicalReasons}</p>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Human Indicators */}
                          <div>
                             <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                               <CheckCircle2 size={11} /> Human-Driven Indicators
                             </p>
                             <ul className="space-y-1.5">
                               {healthReport.humanDrivenIndicators?.map((ind: string, i: number) => (
                                 <li key={i} className="flex items-start gap-2 text-[10px] text-gray-400 font-medium bg-green-900/20 border border-green-900/30 px-3 py-2 rounded-lg">
                                   <span className="text-green-500 flex-shrink-0 mt-0.5">↑</span> {ind}
                                 </li>
                               ))}
                             </ul>
                          </div>

                          {/* AI Indicators */}
                          <div>
                             <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                               <Activity size={11} /> AI-Assisted Indicators
                             </p>
                             <ul className="space-y-1.5">
                               {healthReport.aiAssistedIndicators?.map((ind: string, i: number) => (
                                 <li key={i} className="flex items-start gap-2 text-[10px] text-gray-400 font-medium bg-orange-900/20 border border-orange-900/30 px-3 py-2 rounded-lg">
                                   <span className="text-orange-400 flex-shrink-0 mt-0.5">◆</span> {ind}
                                 </li>
                               ))}
                             </ul>
                          </div>
                       </div>

                       <p className="text-[9px] text-gray-600 font-medium italic border-t border-white/5 pt-4">
                          ⚠ This is a probabilistic estimate based on commit patterns only. It does not constitute evidence of academic misconduct.
                       </p>
                    </div>
                 </div>
               )}

                <div className="space-y-4">
                  {commits.length > 0 ? commits.map((commit, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-colors group">
                       <div className="flex items-center gap-3">
                          <GitBranch size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{commit.message}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-bold">{commit.author} • {new Date(commit.date).toLocaleDateString()}</span>
                          </div>
                       </div>
                       <a href={commit.url || commit.repoUrl} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} className="text-gray-300 hover:text-blue-500" />
                       </a>
                    </div>
                  )) : (
                    <div className="text-center p-8 text-gray-400">
                       <p className="text-xs font-bold italic">No commit history found.</p>
                    </div>
                  )}
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
