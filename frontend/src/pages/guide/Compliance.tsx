import React from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  AlertCircle, Clock,
  ArrowRight, CheckCircle2, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { guideApi, type UpcomingDeadline } from '../../services/guideApi';

const Compliance: React.FC = () => {
  const navigate = useNavigate();
  const [complianceData, setComplianceData] = React.useState<UpcomingDeadline[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const res = await guideApi.getUpcomingDeadlines();
        const data = (res.data as any).data || res.data;
        setComplianceData(data);
      } catch (err) {
        console.error('Error fetching deadlines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeadlines();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Analyzing deliverable hygiene...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white uppercase">Compliance Tracker</h1>
           <p className="text-gray-500 font-medium">Monitoring deliverable hygiene and roadmap adherence across batches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {complianceData.length > 0 ? complianceData.map((item, idx) => {
          const progress = Math.round((item.submitted_count / (item.total_groups || 1)) * 100);
          
          return (
            <Card key={idx} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                   <div>
                      <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest">{item.batch_name}</Badge>
                      <h3 className="text-lg font-black mt-2 text-gray-800 dark:text-white">{item.title}</h3>
                   </div>
                   <div className={`p-3 rounded-xl ${progress === 100 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} dark:bg-opacity-20`}>
                      {progress === 100 ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                   </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Submission Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                   <div className="text-center flex-1">
                      <p className="text-2xl font-black text-gray-800 dark:text-white">{item.submitted_count}/{item.total_groups}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Submitted</p>
                   </div>
                   <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                   <div className="text-center flex-1">
                      <p className="text-2xl font-black text-orange-600">{item.total_groups - item.submitted_count}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Waiting</p>
                   </div>
                   <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                   <div className="text-center flex-1 text-red-600">
                       <p className="text-lg font-black flex items-center justify-center gap-1">
                         <AlertCircle size={16} /> {new Date(item.due_date).toLocaleDateString()}
                       </p>
                       <p className="text-[9px] font-black uppercase text-red-400 mt-1">Due Date</p>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                      <Users size={12} />
                      {item.total_groups} Total Groups
                   </div>
                   <button 
                    onClick={() => navigate('/guide/documents')}
                    className="text-xs font-black text-blue-600 flex items-center gap-1 hover:underline group"
                   >
                      VIEW SUBMISSIONS <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            </Card>
          );
        }) : (
          <div className="lg:col-span-2 py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4 opacity-20" />
            <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Everything is on track</h3>
            <p className="text-gray-400 text-sm mt-2 font-medium">No upcoming deadlines detected for your batches.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compliance;
