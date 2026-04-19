import React from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, 
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Deadlines: React.FC = () => {
  const navigate = useNavigate();

  const milestones = [
    { 
      id: 'm1', 
      title: 'Topic Abstract & Formation', 
      date: 'April 15, 2026', 
      status: 'Satisfied', 
      weight: '5%',
      desc: 'Submit the project title, domain and group composition details.'
    },
    { 
      id: 'm2', 
      title: 'SRS & Initial System Design', 
      date: 'April 20, 2026', 
      status: 'Pending', 
      weight: '15%',
      desc: 'Detailed functional and non-functional requirements along with UML diagrams.'
    },
    { 
      id: 'm3', 
      title: 'Environment & Tech Stack Setup', 
      date: 'May 05, 2026', 
      status: 'Upcoming', 
      weight: '10%',
      desc: 'Setup production repository and establish the core infrastructure.'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Academic Deliverables</h1>
           <p className="text-gray-500">Track all mandatory milestones for your batch cycle</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center gap-2">
           <Calendar size={16} className="text-blue-600" />
           <span className="text-xs font-black text-blue-600">Spring Semester 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Milestone List */}
         <div className="lg:col-span-3 space-y-4">
            {milestones.map((m) => (
              <Card key={m.id} className={`group hover:shadow-lg transition-all border-l-4 ${
                m.status === 'Satisfied' ? 'border-l-green-500' : m.status === 'Pending' ? 'border-l-orange-500' : 'border-l-gray-300'
              }`}>
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.date}</p>
                          <Badge variant={m.status === 'Satisfied' ? 'success' : 'secondary'} className="text-[9px] font-black tracking-tighter uppercase px-2">
                             {m.status}
                          </Badge>
                       </div>
                       <h3 className="text-lg font-black text-gray-800 dark:text-gray-100">{m.title}</h3>
                       <p className="text-xs text-gray-500 font-medium leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Evaluation Weight</p>
                          <p className="text-lg font-black text-blue-600">{m.weight}</p>
                       </div>
                       <button 
                        onClick={() => navigate('/student/submissions')}
                        disabled={m.status === 'Satisfied'}
                        className={`p-3 rounded-xl transition-all ${
                          m.status === 'Satisfied' 
                            ? 'bg-green-50 text-green-600 cursor-default' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white hover:shadow-lg'
                        }`}
                       >
                          {m.status === 'Satisfied' ? <CheckCircle2 size={24} /> : <ArrowRight size={24} />}
                       </button>
                    </div>
                 </div>
              </Card>
            ))}
         </div>

         {/* Compliance Stats */}
         <div className="space-y-6">
            <Card className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white shadow-xl shadow-indigo-500/20">
               <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">Compliance Health</h4>
                  <div className="p-2 bg-white/10 rounded-lg">
                     <AlertCircle size={20} />
                  </div>
               </div>
               <div className="space-y-6">
                  <div>
                     <p className="text-2xl font-black">1/3</p>
                     <p className="text-[10px] font-black uppercase opacity-60 mt-1">Milestones Reached</p>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-white" style={{ width: '33%' }}></div>
                  </div>
               </div>
               <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-[9px] font-medium leading-relaxed opacity-70 italic">
                    "Consistent adherence to deadlines accounts for 15% of your total project internal marks."
                  </p>
               </div>
            </Card>

            <div className="p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                     <Clock size={20} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Next Critical</h4>
               </div>
               <p className="text-xs font-bold text-gray-800 dark:text-gray-100">SRS & Initial System Design</p>
               <p className="text-[10px] text-orange-600 font-black uppercase mt-1">2 Days Remaining</p>
               <button 
                onClick={() => navigate('/student/submissions')}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform"
               >
                  PROCEED TO UPLOAD
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Deadlines;
