import React from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  AlertCircle, Clock,
  ArrowRight
} from 'lucide-react';

const Compliance: React.FC = () => {
  const complianceData = [
    {
      batch: 'MCA 2024-26 A',
      deadline: 'Phase 1 - SRS & Design',
      date: '2026-04-20',
      totalGroups: 8,
      submitted: 6,
      pending: 2,
      atRisk: ['Sentinel', 'OmegaTech']
    },
    {
      batch: 'MCA 2024-26 B',
      deadline: 'Phase 1 - SRS & Design',
      date: '2026-04-22',
      totalGroups: 6,
      submitted: 2,
      pending: 4,
      atRisk: []
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Compliance Tracker</h1>
           <p className="text-gray-500">Monitoring deliverable hygiene and roadmap adherence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {complianceData.map((item, idx) => (
          <Card key={idx} className="relative overflow-hidden group">
             <div className="space-y-6">
                <div className="flex justify-between items-start">
                   <div>
                      <Badge variant="secondary" className="text-[10px] font-black">{item.batch}</Badge>
                      <h3 className="text-lg font-black mt-2">{item.deadline}</h3>
                   </div>
                   <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
                      <Clock size={24} />
                   </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                   <div className="text-center flex-1">
                      <p className="text-2xl font-black text-gray-800 dark:text-white">{item.submitted}/{item.totalGroups}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Submitted</p>
                   </div>
                   <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                   <div className="text-center flex-1">
                      <p className="text-2xl font-black text-orange-600">{item.pending}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Waiting</p>
                   </div>
                   <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                   <div className="text-center flex-1 text-red-600">
                       <p className="text-lg font-black flex items-center justify-center gap-1">
                         <AlertCircle size={16} /> {item.date.split('-').reverse().slice(0,2).join('/')}
                       </p>
                       <p className="text-[9px] font-black uppercase text-red-400 mt-1">Countdown</p>
                   </div>
                </div>

                {item.atRisk.length > 0 && (
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} /> Priority Intervention Required
                     </p>
                     <div className="flex flex-wrap gap-2">
                        {item.atRisk.map(g => (
                          <div key={g} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-black border border-red-100">
                             {g}
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                   <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      Target: {item.date}
                   </div>
                   <button className="text-xs font-black text-blue-600 flex items-center gap-1 hover:underline">
                      VIEW FULL ROSTER <ArrowRight size={14} />
                   </button>
                </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Compliance;
