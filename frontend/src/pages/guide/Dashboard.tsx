import { 
  Users, BookOpen, Clock, Activity, AlertTriangle, 
  ChevronRight, Calendar, MessageSquare, FileText, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { guideApi, type GuideStats, type UpcomingDeadline, type ProjectGroupMeta, type BatchSummary } from '../../services/guideApi';
import { useEffect, useState } from 'react';
import Card from '../../components/common/UI/Card';

const GuideDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<GuideStats | null>(null);
  const [deadlines, setDeadlines] = useState<UpcomingDeadline[]>([]);
  const [atRiskGroups, setAtRiskGroups] = useState<ProjectGroupMeta[]>([]);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, deadlinesRes, groupsRes, batchesRes] = await Promise.all([
          guideApi.getDashboardStats(),
          guideApi.getUpcomingDeadlines(),
          guideApi.getSupervisedGroups(),
          guideApi.getAssignedBatches()
        ]);
        
        setStats((statsRes.data as any).data || statsRes.data);
        setDeadlines((deadlinesRes.data as any).data || deadlinesRes.data);
        const groups = (groupsRes.data as any).data || groupsRes.data;
        setAtRiskGroups(Array.isArray(groups) ? groups.filter((g: ProjectGroupMeta) => g.health !== 'Healthy') : []);
        
        const fetchedBatches = (batchesRes.data as any).data || batchesRes.data;
        setBatches(fetchedBatches);
        if (fetchedBatches.length > 0) {
          setSelectedBatchId(fetchedBatches[0].id);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchBatchDeadlines = async () => {
      if (!selectedBatchId) return;
      setBatchLoading(true);
      try {
        const res = await guideApi.getBatchDeadlines(selectedBatchId);
        setDeadlines((res.data as any).data || res.data);
      } catch (error) {
        console.error('Error fetching batch deadlines:', error);
      } finally {
        setBatchLoading(false);
      }
    };

    fetchBatchDeadlines();
  }, [selectedBatchId]);

  const statCards = [
    { label: 'Assigned Batches', value: stats?.assignedBatches || 0, icon: <BookOpen className="text-blue-500" />, trend: 'Active batches', route: '/guide/batches' },
    { label: 'Project Groups', value: stats?.totalGroups || 0, icon: <Users className="text-purple-500" />, trend: 'Supervised groups', route: '/guide/groups' },
    { label: 'Topic Approvals', value: stats?.pendingTopics || 0, icon: <Clock className="text-orange-500" />, trend: 'Awaiting review', route: '/guide/topics' },
    { label: 'Unread Messages', value: stats?.pendingReviews || 0, icon: <MessageSquare className="text-green-500" />, trend: 'Review tasks', route: '/guide/chat' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Guide Dashboard</h1>
          <p className="text-gray-500">Academic supervision overview for {user?.name}</p>
        </div>
        <button 
          className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl transition-colors group cursor-default"
        >
          <Calendar size={16} /> Academic Year 2025-26
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:ring-2 hover:ring-blue-400/40"
            onClick={() => navigate(stat.route)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:scale-110 transition-all">
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white">{stat.value}</h3>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold text-gray-500 flex items-center gap-1">
              {stat.trend}
              <ArrowRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </p>
          </Card>
        ))}
      </div>

      {/* Batch Selection & Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <BookOpen size={14} className="text-blue-500" /> Your Assigned Batches
          </h3>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
            {batches.length} Active {batches.length === 1 ? 'Batch' : 'Batches'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(batch => (
            <Card 
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
              className={`relative overflow-hidden transition-all duration-300 cursor-pointer border-2 ${
                selectedBatchId === batch.id 
                  ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-xl' 
                  : 'border-transparent hover:border-blue-200 dark:hover:border-blue-800'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-lg text-gray-800 dark:text-white uppercase tracking-tight">{batch.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                      {batch.groupCount} Groups
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                      {batch.studentCount} Students
                    </span>
                  </div>
                </div>
                {selectedBatchId === batch.id && (
                  <div className="p-1.5 bg-blue-600 rounded-full shadow-lg shadow-blue-500/40">
                    <Activity size={12} className="text-white animate-pulse" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</span>
                    <span className="text-[10px] font-bold text-blue-600">{batch.submissionProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${batch.submissionProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card selection click
                    navigate(`/guide/batches/${batch.id}/deadlines`);
                  }}
                  className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50 group/arrow cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 -mx-2 px-2 rounded-b-xl transition-colors"
                >
                   <div className="flex items-center gap-1.5">
                     <Clock size={12} className="text-orange-500" />
                     <span className="text-[10px] font-bold text-gray-500">{batch.pendingReviews} Pending Reviews</span>
                   </div>
                   <div className="flex items-center gap-1 text-blue-600 font-bold">
                     <span className="text-[9px] uppercase tracking-tighter opacity-0 group-hover/arrow:opacity-100 transition-opacity">Deadlines</span>
                     <ArrowRight size={14} className={`transition-transform ${selectedBatchId === batch.id ? 'translate-x-1' : ''}`} />
                   </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area disabled */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
             <Activity size={40} className="mx-auto text-gray-200 mb-4" />
             <p className="text-gray-400 font-bold">Select a batch to view specific group details and deadlines in the sidebar modules.</p>
          </div>
        </div>

        {/* Sidebar Actions Area */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
             <button onClick={() => navigate('/guide/topics')} className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.03] hover:bg-blue-700 transition-all text-left group">
                <Clock size={20} className="group-hover:rotate-12 transition-transform" />
                <div>
                   <p className="text-xs font-black">Review Topics</p>
                   <p className="text-[9px] opacity-80">{stats?.pendingTopics || 0} pending proposals</p>
                </div>
                <ChevronRight size={14} className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
             </button>
             <button onClick={() => navigate('/guide/git-activity')} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left group">
                <Activity size={20} className="text-purple-500 group-hover:scale-110 transition-transform" />
                <div>
                   <p className="text-xs font-black text-gray-700 dark:text-gray-200">Git Activity</p>
                   <p className="text-[9px] text-gray-400">Monitor commits per group</p>
                </div>
                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
             </button>
             <button onClick={() => navigate('/guide/documents')} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left group">
                <FileText size={20} className="text-orange-500 group-hover:scale-110 transition-transform" />
                <div>
                   <p className="text-xs font-black text-gray-700 dark:text-gray-200">Grade Submissions</p>
                   <p className="text-[9px] text-gray-400">{stats?.pendingReviews || 0} documents awaiting feedback</p>
                </div>
                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
             </button>
             <button onClick={() => navigate('/guide/kanban')} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left group">
                <Users size={20} className="text-green-500 group-hover:scale-110 transition-transform" />
                <div>
                   <p className="text-xs font-black text-gray-700 dark:text-gray-200">Kanban Oversight</p>
                   <p className="text-[9px] text-gray-400">View group task boards</p>
                </div>
                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GuideDashboard;