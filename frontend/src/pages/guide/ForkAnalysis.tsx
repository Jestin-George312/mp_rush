import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guideApi } from '../../services/guideApi';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  GitFork, Activity, ShieldCheck, 
  ChevronLeft, AlertCircle, TrendingUp,
  FileCode, ArrowUpRight, ArrowDownRight,
  Loader2
} from 'lucide-react';

const ForkAnalysis: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        if (!projectId) return;
        const res = await guideApi.getForkAnalysis(projectId);
        setAnalysis(res.data.data);
      } catch (err) {
        console.error('Error fetching fork analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!analysis || !analysis.isFork) {
    const errorMsg = analysis?.reason === 'not_a_fork' 
        ? "This is an original repository. Since it wasn't forked from a template, there is no 'upstream' to compare it against."
        : analysis?.reason === 'no_parent_access'
        ? "We detected this is a fork, but the system doesn't have permission to access the parent repository."
        : "The analysis could not be performed at this time. Please check the repository URL and try again.";

    return (
      <div className="text-center py-20 space-y-4">
        <div className="flex justify-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <AlertCircle size={48} className="text-gray-400" />
            </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {analysis?.reason === 'not_a_fork' ? "Original Repository" : "Analysis Unavailable"}
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          {errorMsg}
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-xs"
        >
          GO BACK
        </button>
      </div>
    );
  }

  // Simple originality heuristic: (commits ahead / total) * 100
  // In a real app, this would be based on line diffs
  const originalityScore = Math.min(100, Math.round((analysis.aheadBy / (analysis.aheadBy + 5)) * 100));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-gray-50 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">
                <GitFork size={10} className="mr-1" /> Fork Analysis
              </Badge>
              <Badge className="bg-blue-50 text-blue-600 text-[9px] font-black border-none uppercase">
                Upstream: {analysis.parentName}
              </Badge>
           </div>
           <h1 className="text-2xl font-black tracking-tight">Technical Originality Report</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Originality Score</p>
                   <h2 className="text-4xl font-black mt-2">{originalityScore}%</h2>
                   <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white" style={{ width: `${originalityScore}%` }}></div>
                   </div>
                   <p className="text-[9px] mt-2 font-bold opacity-80">Based on divergence from upstream template</p>
                </div>
                <ShieldCheck size={80} className="absolute -bottom-4 -right-4 opacity-10" />
             </Card>

             <Card>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Velocity</p>
                <div className="flex items-center gap-2 mt-2">
                   <h2 className="text-2xl font-black text-gray-800 dark:text-white">+{analysis.aheadBy}</h2>
                   <TrendingUp size={20} className="text-green-500" />
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Commits ahead of parent</p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="text-gray-400">SYNC STATUS</span>
                      <span className={analysis.behindBy === 0 ? "text-green-500" : "text-orange-500"}>
                        {analysis.behindBy === 0 ? "UP TO DATE" : `${analysis.behindBy} BEHIND`}
                      </span>
                   </div>
                </div>
             </Card>

             <Card>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modified Files</p>
                <div className="flex items-center gap-2 mt-2">
                   <h2 className="text-2xl font-black text-gray-800 dark:text-white">{analysis.filesChanged}</h2>
                   <FileCode size={20} className="text-blue-500" />
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Files unique to student fork</p>
                <div className="flex items-center gap-4 mt-6">
                   <div className="flex items-center gap-1">
                      <ArrowUpRight size={12} className="text-green-500" />
                      <span className="text-[10px] font-black text-green-600">{analysis.stats.additions}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <ArrowDownRight size={12} className="text-red-500" />
                      <span className="text-[10px] font-black text-red-600">{analysis.stats.deletions}</span>
                   </div>
                </div>
             </Card>
          </div>

          <Card>
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                   <Activity size={14} /> New Contributions (Not in Upstream)
                </h3>
                <Badge variant="secondary" className="text-[10px]">{analysis.commits.length} Total</Badge>
             </div>
             
             <div className="space-y-4">
                {analysis.commits.map((c: any) => (
                  <div key={c.sha} className="flex items-start gap-4 p-4 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                     <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                        <GitFork size={16} />
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-black text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">
                          {c.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="text-[10px] font-black text-gray-400 uppercase">{c.author}</span>
                           <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                           <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(c.date).toLocaleDateString()}</span>
                           <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                           <code className="text-[9px] font-mono text-blue-500 font-bold uppercase">{c.sha.substring(0, 7)}</code>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* AI Insight / Guide Commentary */}
        <div className="space-y-6">
           <Card className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
              <div className="flex items-center gap-2 mb-4">
                 <ShieldCheck className="text-orange-500" size={20} />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600">Integrity Insight</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                {originalityScore > 70 
                  ? "High Originality. The student group has significantly modified the upstream code and added substantial new features."
                  : originalityScore > 30 
                  ? "Moderate Originality. The project follows the upstream template closely with some custom logic added."
                  : "Low Originality alert. Most of the code matches the upstream repository. Verify if the students are just tweaking variables."}
              </p>
           </Card>

           <Card>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Quick Links</h3>
              <div className="space-y-2">
                 <button className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] font-black text-gray-600 dark:text-gray-400 flex items-center justify-between hover:bg-gray-100 transition-all">
                    VIEW UPSTREAM SOURCE <ArrowUpRight size={14} />
                 </button>
                 <button className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] font-black text-gray-600 dark:text-gray-400 flex items-center justify-between hover:bg-gray-100 transition-all">
                    DOWNLOAD DIFF REPORT <ArrowUpRight size={14} />
                 </button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default ForkAnalysis;
