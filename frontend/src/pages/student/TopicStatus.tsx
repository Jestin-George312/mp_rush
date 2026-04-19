import React from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  FileCheck, Clock, CheckCircle2, 
  AlertCircle, Info 
} from 'lucide-react';

const TopicStatus: React.FC = () => {
  // High fidelity mock for topic status
  const topicData = {
    title: 'Smart Health Monitoring System',
    status: 'In Review',
    submittedAt: '2026-04-15 10:20',
    guideComments: 'Waiting for Department Head validation.',
    history: [
       { date: '2026-04-15', event: 'Proposal Submitted', status: 'Pending' },
       { date: '2026-04-16', event: 'Assigned to Dr. Sarah Johnson', status: 'Guide Assigned' },
       { date: '2026-04-17', event: 'Initial Feasibility Check', status: 'In Review' },
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Topic Status Tracking</h1>
           <p className="text-gray-500">Real-time status of your project validation workflow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Status Card */}
         <div className="lg:col-span-2 space-y-6">
            <Card className="border-l-4 border-l-blue-500">
               <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                     <div>
                        <Badge variant="secondary" className="px-3 py-1 font-black mb-3">CURRENT STAGE: {topicData.status.toUpperCase()}</Badge>
                        <h2 className="text-xl font-black">{topicData.title}</h2>
                     </div>
                     <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Clock size={12} /> Submitted {topicData.submittedAt}</span>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 text-right">
                     <span className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl shadow-lg ring-4 ring-blue-500/10 animate-pulse">
                        <FileCheck size={28} />
                     </span>
                  </div>
               </div>
            </Card>

            <Card>
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <Clock size={14} /> Workflow Audit Trail
               </h3>
               <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-gray-100 dark:before:bg-gray-700">
                  {topicData.history.map((h, i) => (
                    <div key={i} className="relative pl-10 flex items-center justify-between group">
                       <div className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center z-10 ${
                         i === topicData.history.length - 1 ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-gray-200 dark:bg-gray-700'
                       }`}>
                          {i === topicData.history.length - 1 ? <CheckCircle2 size={12} className="text-white" /> : <div className="w-1 h-1 bg-white rounded-full"></div>}
                       </div>
                       <div>
                          <p className="text-xs font-black group-hover:text-blue-600 transition-colors">{h.event}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{h.status}</p>
                       </div>
                       <div className="text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                          {h.date}
                       </div>
                    </div>
                  ))}
               </div>
            </Card>
         </div>

         {/* Sidebar: Mentor Input */}
         <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-500/20">
               <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-6">Latest Guide Insight</h3>
               <div className="flex items-start gap-3">
                  <Info size={24} className="opacity-70 flex-shrink-0" />
                  <p className="text-sm font-medium leading-relaxed italic">
                    "{topicData.guideComments}"
                  </p>
               </div>
               <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase opacity-60">Verified Authority</span>
                  <div className="flex items-center gap-2">
                     <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black">SJ</span>
                     <span className="text-xs font-bold">Dr. Sarah Johnson</span>
                  </div>
               </div>
            </Card>

            <div className="p-5 border border-orange-100 dark:border-orange-900/30 bg-orange-50/20 rounded-2xl">
               <div className="flex items-center gap-2 mb-2 text-orange-600">
                  <AlertCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Correction Required?</span>
               </div>
               <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                 If revisions are requested, the "Initialize Project" button in Project Setup will become active again for re-submission.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TopicStatus;
