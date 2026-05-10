import React from 'react';
import Card from '../../components/common/UI/Card';
import { 
  Users, Library, FileText, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { guideApi } from '../../services/guideApi';

const BatchList: React.FC = () => {
  const navigate = useNavigate();
  const [supervisedBatches, setSupervisedBatches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await guideApi.getAssignedBatches();
        const data = (res.data as any).data || res.data;
        setSupervisedBatches(data);
      } catch (err) {
        console.error('Error fetching assigned batches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Assigned Batches</h1>
        <p className="text-gray-500">Academic cycles under your supervision</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supervisedBatches.map((batch) => (
          <Card key={batch.id} className="relative group overflow-hidden border-b-4 border-b-blue-600">
             <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-300">
                    <Library size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 tracking-[0.15em] uppercase">{batch.year}</p>
                    <p className={`text-[10px] font-black uppercase mt-1 px-2 py-0.5 rounded-full ${
                      batch.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>{batch.status}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black tracking-tight leading-tight">{batch.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{batch.mode}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-100 dark:border-gray-700">
                   <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Supervised Groups</p>
                     <p className="text-sm font-black flex items-center gap-1.5 mt-0.5"><Users size={12} /> {batch.groupCount}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Pending Tasks</p>
                     <p className="text-sm font-black flex items-center gap-1.5 mt-0.5 text-orange-600"><FileText size={12} /> {batch.pendingReviews}</p>
                   </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-gray-500 uppercase">Mean Progress</span>
                    <span className="text-[10px] font-black text-blue-600">{batch.submissionProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${batch.submissionProgress}%` }}></div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/guide/batches/${batch.id}/groups`)}
                  className="w-full mt-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-md"
                >
                  Enter Batch Ecosystem <ChevronRight size={14} />
                </button>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BatchList;
