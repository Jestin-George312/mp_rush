import React from 'react';
import Card from '../../components/common/UI/Card';
import { 
  Activity, TrendingUp, CheckCircle2, 
  AlertCircle, Github, Calendar, ArrowUpRight, Loader2
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import type { StudentStats } from '../../services/studentApi';

const ProgressInsights: React.FC = () => {
  const [stats, setStats] = React.useState<StudentStats | null>(null);
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [commits, setCommits] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, subRes, commitRes] = await Promise.all([
          studentApi.getDashboardStats(),
          studentApi.getSubmissionStatus(),
          studentApi.getGitCommits()
        ]);
        setStats((statsRes.data as any).data || statsRes.data);
        setSubmissions((subRes.data as any).data || subRes.data);
        setCommits((commitRes.data as any).data || commitRes.data);
      } catch (err) {
        console.error('Fetch insights error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const healthScore = stats?.progress || 0;
  const healthLabel = healthScore >= 80 ? 'EXCELLENT' : healthScore >= 50 ? 'GOOD' : 'NEEDS ATTENTION';
  const healthColor = healthScore >= 80 ? 'text-green-600' : healthScore >= 50 ? 'text-blue-600' : 'text-orange-600';
  const healthBg = healthScore >= 80 ? 'bg-green-50' : healthScore >= 50 ? 'bg-blue-50' : 'bg-orange-50';
  const healthRing = healthScore >= 80 ? 'ring-green-500/10' : healthScore >= 50 ? 'ring-blue-500/10' : 'ring-orange-500/10';

  const nextTarget = stats?.nextDeadline ? new Date(stats.nextDeadline) : null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Performance Insights</h1>
           <p className="text-gray-500">Global health score and development velocity analytics</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Calculated Health</p>
               <p className={`text-xl font-black ${healthColor}`}>{healthScore}% {healthLabel}</p>
            </div>
            <div className={`p-3 ${healthBg} dark:bg-gray-900/20 ${healthColor.replace('text-', 'text-')} rounded-2xl shadow-lg ring-4 ${healthRing}`}>
               <TrendingUp size={24} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Milestone Progress */}
         <div className="lg:col-span-3 space-y-6">
            <Card>
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                  <Activity size={16} className="text-blue-500" /> Overall Completion Helix
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="relative flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl group overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Github size={120} />
                     </div>
                     <p className="text-4xl font-black text-gray-800 dark:text-white">{commits.length}</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Commits Logged</p>
                     <div className="mt-4 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full text-[9px] font-black">Sync: Active</div>
                  </div>

                  <div className="relative flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl group overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={120} />
                     </div>
                     <p className="text-4xl font-black text-gray-800 dark:text-white">{stats?.kanbanTasks?.done || 0}</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Tasks Satisfied</p>
                     <div className="mt-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-[9px] font-black">Velocity: Healthy</div>
                  </div>

                  <div className="relative flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl group overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Calendar size={120} />
                     </div>
                     <p className="text-4xl font-black text-gray-800 dark:text-white">{String(stats?.pendingDeadlinesCount || 0).padStart(2, '0')}</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Open Deadlines</p>
                     <div className="mt-4 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full text-[9px] font-black">Tracked</div>
                  </div>
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Recent Deliverable Status</h3>
                  <div className="space-y-4">
                     {submissions.length > 0 ? submissions.slice(0, 2).map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                           <div>
                              <p className="text-xs font-black">{d.deadline_title || d.name}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{d.status}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-black text-blue-600">--</p>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center p-6 text-gray-400 text-[10px] font-bold">No recent submissions.</div>
                     )}
                  </div>
               </Card>

               <Card className="bg-blue-600 text-white shadow-xl shadow-blue-500/20">
                   <div className="space-y-4">
                      {nextTarget ? (
                        <>
                           <div>
                              <h4 className="text-lg font-black tracking-tight">Upcoming Milestone</h4>
                              <p className="text-xs opacity-70 font-medium mt-1 uppercase tracking-tighter">Deliverable window active</p>
                           </div>
                           <div className="pt-8 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <Calendar size={16} />
                                 <span className="text-[10px] font-black uppercase">{nextTarget.toLocaleDateString()}</span>
                              </div>
                              <ArrowUpRight size={20} />
                           </div>
                        </>
                      ) : (
                         <div className="p-8 text-center opacity-50 text-[10px] font-black">ALL TARGETS SATISFIED</div>
                      )}
                   </div>
               </Card>
            </div>
         </div>

         {/* Health Indicators */}
         <div className="space-y-6">
            <Card>
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Participation Health</h3>
               <div className="space-y-6 text-center">
                  <div className="inline-flex p-6 bg-green-50 rounded-full text-green-500 mb-4">
                     <CheckCircle2 size={48} />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest">Balanced Sync</h4>
                  <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase">The collective is maintaining a balanced task-to-member participation ratio.</p>
               </div>
            </Card>

            <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl">
               <div className="flex items-center gap-2 mb-4 text-orange-500">
                  <AlertCircle size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Attention Items</span>
               </div>
                <div className="space-y-3">
                   {stats && stats.kanbanTasks.todo > 0 && (
                      <div className="flex items-start gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                         <span className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                         {stats.kanbanTasks.todo} Tasks pending in Kanban Board
                      </div>
                   )}
                   {submissions.some(s => s.status === 'Revision Requested') && (
                      <div className="flex items-start gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                         <span className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                         Revision requested for recent submission
                      </div>
                   )}
                   {!stats?.kanbanTasks?.todo && !submissions.some(s => s.status === 'Revision Requested') && (
                      <div className="text-center py-4 text-[10px] font-black text-green-500">SYSTEM HEALTH: NOMINAL</div>
                   )}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProgressInsights;
