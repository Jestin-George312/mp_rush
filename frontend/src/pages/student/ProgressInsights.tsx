import React from 'react';
import Card from '../../components/common/UI/Card';
import { 
  Activity, TrendingUp, CheckCircle2, 
  AlertCircle, Github, Calendar, ArrowUpRight
} from 'lucide-react';

const ProgressInsights: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Performance Insights</h1>
           <p className="text-gray-500">Global health score and development velocity analytics</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Calculated Heath</p>
              <p className="text-xl font-black text-green-600">92% EXCELLENT</p>
           </div>
           <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl shadow-lg ring-4 ring-green-500/10">
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
                     <p className="text-4xl font-black text-gray-800 dark:text-white">42</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Commits Logged</p>
                     <div className="mt-4 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full text-[9px] font-black">+12% vs LW</div>
                  </div>

                  <div className="relative flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl group overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={120} />
                     </div>
                     <p className="text-4xl font-black text-gray-800 dark:text-white">32</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Tasks Satisfied</p>
                     <div className="mt-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-[9px] font-black">Velocity: High</div>
                  </div>

                  <div className="relative flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl group overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Calendar size={120} />
                     </div>
                     <p className="text-4xl font-black text-gray-800 dark:text-white">01</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Open Deadlines</p>
                     <div className="mt-4 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full text-[9px] font-black">Due in 2D</div>
                  </div>
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Recent Deliverable Status</h3>
                  <div className="space-y-4">
                     {[
                       { name: 'SRS Document', status: 'Approved', score: '9/10' },
                       { name: 'System Design', status: 'Pending Review', score: '-' },
                     ].map((d, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                          <div>
                             <p className="text-xs font-black">{d.name}</p>
                             <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{d.status}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-blue-600">{d.score}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </Card>

               <Card className="bg-blue-600 text-white shadow-xl shadow-blue-500/20">
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-6">Next Academic Target</h3>
                  <div className="space-y-4">
                     <div>
                        <h4 className="text-lg font-black tracking-tight">Phase 2: Database Modeling</h4>
                        <p className="text-xs opacity-70 font-medium mt-1 uppercase tracking-tighter">Deliverable window opens in 5 days</p>
                     </div>
                     <div className="pt-8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Calendar size={16} />
                           <span className="text-[10px] font-black uppercase">May 10, 2026</span>
                        </div>
                        <ArrowUpRight size={20} />
                     </div>
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
                  <div className="flex items-start gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                     <span className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                     2 Tasks Overdue in Kanban Board
                  </div>
                  <div className="flex items-start gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                     <span className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                     Pending resubmission for Design doc
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProgressInsights;
