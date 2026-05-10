import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, Hourglass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/studentApi';
import ExtensionModal from '../../components/student/ExtensionModal';

interface Deadline {
  id: number;
  title: string;
  due_date: string;
  status: 'Satisfied' | 'Pending' | 'Upcoming' | 'Overdue';
  description: string;
  submission_id?: number;
}

const Deadlines: React.FC = () => {
  const navigate = useNavigate();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeadline, setSelectedDeadline] = useState<{id: number, title: string} | null>(null);

  const fetchDeadlines = async () => {
    try {
      const res = await studentApi.getDeadlines();
      setDeadlines(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch deadlines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  if (loading) {
    return <div className="p-8 text-center font-black uppercase tracking-widest animate-pulse">Loading Academic Cycle...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Academic Deliverables</h1>
           <p className="text-gray-500">Track all mandatory milestones for your batch cycle</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center gap-2 border border-blue-100 dark:border-blue-800">
           <Calendar size={16} className="text-blue-600" />
           <span className="text-xs font-black text-blue-600">Active Academic Year 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 space-y-4">
            {deadlines.length === 0 && (
              <Card className="text-center py-20 bg-gray-50 dark:bg-gray-900/50">
                 <Calendar size={48} className="mx-auto mb-4 opacity-10" />
                 <p className="text-sm font-black uppercase tracking-widest text-gray-400">No deadlines defined for this batch</p>
              </Card>
            )}
            {deadlines.map((m) => (
              <Card key={m.id} className={`group hover:shadow-xl transition-all border-l-4 ${
                m.status === 'Satisfied' ? 'border-l-green-500' : m.status === 'Pending' ? 'border-l-orange-500' : m.status === 'Overdue' ? 'border-l-red-500' : 'border-l-gray-300'
              }`}>
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {new Date(m.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                          <Badge variant={m.status === 'Satisfied' ? 'success' : m.status === 'Overdue' ? 'error' : 'secondary'} className="text-[9px] font-black tracking-tighter uppercase px-2">
                             {m.status}
                          </Badge>
                       </div>
                       <h3 className="text-lg font-black text-gray-800 dark:text-gray-100">{m.title}</h3>
                       <p className="text-xs text-gray-500 font-medium leading-relaxed">{m.description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                       {m.status !== 'Satisfied' && (
                         <button 
                            onClick={() => setSelectedDeadline({ id: m.id, title: m.title })}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-700"
                         >
                            <Hourglass size={14} />
                            Request Extension
                         </button>
                       )}
                       <button 
                        onClick={() => navigate('/student/submissions')}
                        disabled={m.status === 'Satisfied'}
                        className={`p-3 rounded-xl transition-all ${
                          m.status === 'Satisfied' 
                            ? 'bg-green-50 text-green-600 cursor-default' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white hover:shadow-xl hover:-translate-y-1'
                        }`}
                       >
                          {m.status === 'Satisfied' ? <CheckCircle2 size={24} /> : <ArrowRight size={24} />}
                       </button>
                    </div>
                 </div>
              </Card>
            ))}
         </div>

         <div className="space-y-6">
            <Card className="bg-gradient-to-br from-indigo-700 via-blue-800 to-indigo-900 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
               <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">Compliance Health</h4>
                     <div className="p-2 bg-white/10 rounded-lg">
                        <AlertCircle size={20} />
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div>
                        <p className="text-3xl font-black">
                          {deadlines.filter(d => d.status === 'Satisfied').length}/{deadlines.length}
                        </p>
                        <p className="text-[10px] font-black uppercase opacity-60 mt-1 tracking-widest">Milestones Reached</p>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                          style={{ width: `${(deadlines.filter(d => d.status === 'Satisfied').length / (deadlines.length || 1)) * 100}%` }}
                        ></div>
                     </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                     <p className="text-[9px] font-medium leading-relaxed opacity-70 italic">
                       "Consistent adherence to deadlines accounts for 15% of your total project internal marks."
                     </p>
                  </div>
               </div>
            </Card>

            <div className="p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                     <Clock size={20} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Next Action</h4>
               </div>
               {deadlines.find(d => d.status === 'Pending' || d.status === 'Overdue') ? (
                 <>
                   <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
                     {deadlines.find(d => d.status === 'Pending' || d.status === 'Overdue')?.title}
                   </p>
                   <button 
                    onClick={() => navigate('/student/submissions')}
                    className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                   >
                      PROCEED TO UPLOAD
                   </button>
                 </>
               ) : (
                 <p className="text-xs font-bold text-green-500">All caught up!</p>
               )}
            </div>
         </div>
      </div>

      {selectedDeadline && (
        <ExtensionModal
          deadlineId={selectedDeadline.id}
          deadlineTitle={selectedDeadline.title}
          onClose={() => setSelectedDeadline(null)}
          onSuccess={fetchDeadlines}
        />
      )}
    </div>
  );
};

export default Deadlines;
