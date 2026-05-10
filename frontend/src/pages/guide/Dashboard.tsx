import { 
  Users, BookOpen, Clock, Activity, AlertTriangle, 
  ChevronRight, Calendar, MessageSquare, FileText 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { guideApi, type GuideStats, type UpcomingDeadline, type ProjectGroupMeta } from '../../services/guideApi';
import { useEffect, useState } from 'react';
import Card from '../../components/common/UI/Card';

const GuideDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<GuideStats | null>(null);
  const [deadlines, setDeadlines] = useState<UpcomingDeadline[]>([]);
  const [atRiskGroups, setAtRiskGroups] = useState<ProjectGroupMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, deadlinesRes, groupsRes] = await Promise.all([
          guideApi.getDashboardStats(),
          guideApi.getUpcomingDeadlines(),
          guideApi.getSupervisedGroups()
        ]);
        
        setStats(statsRes.data.data);
        setDeadlines(deadlinesRes.data.data);
        setAtRiskGroups(groupsRes.data.data.filter((g: ProjectGroupMeta) => g.health !== 'Healthy'));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Assigned Batches', value: stats?.assignedBatches || 0, icon: <BookOpen className="text-blue-500" />, trend: 'Active batches' },
    { label: 'Project Groups', value: stats?.totalGroups || 0, icon: <Users className="text-purple-500" />, trend: 'Supervised groups' },
    { label: 'Topic Approvals', value: stats?.pendingTopics || 0, icon: <Clock className="text-orange-500" />, trend: 'Awaiting review' },
    { label: 'Unread Messages', value: stats?.pendingReviews || 0, icon: <MessageSquare className="text-green-500" />, trend: 'Review tasks' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Guide Dashboard</h1>
          <p className="text-gray-500">Academic supervision overview for {user?.name}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
          <Calendar size={16} /> Spring Semester 2026
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white">{stat.value}</h3>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold text-gray-500 flex items-center gap-1">
              {stat.trend}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At Risk Groups */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-500" /> Critical Attention Required
          </h3>
          <Card>
             <div className="space-y-4">
               {atRiskGroups.length > 0 ? (
                 atRiskGroups.map(group => (
                   <div key={group.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-4">
                       <div className={`w-2 h-10 rounded-full ${group.health === 'At Risk' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                       <div>
                         <h4 className="font-bold text-sm">{group.name} — {group.title}</h4>
                         <p className="text-[10px] text-gray-500 font-bold">Status: {group.status}</p>
                       </div>
                     </div>
                     <button className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg shadow-sm transition-all">
                       <ChevronRight size={18} className="text-gray-400" />
                     </button>
                   </div>
                 ))
               ) : (
                 <div className="p-8 text-center text-gray-400 font-bold text-sm">
                   All groups are currently in good standing
                 </div>
               )}
             </div>
          </Card>

          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <FileText size={14} className="text-blue-500" /> Upcoming Deadlines
          </h3>
          <Card>
             <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {deadlines.length > 0 ? (
                  deadlines.map(deadline => (
                    <div key={deadline.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div>
                        <p className="text-xs font-black">{deadline.title}</p>
                        <p className="text-[10px] text-gray-400">Batch: {deadline.batch_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-red-500">Due: {new Date(deadline.due_date).toLocaleDateString()}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{deadline.submitted_count}/{deadline.total_groups} Submitted</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 font-bold text-xs">
                    No upcoming deadlines found
                  </div>
                )}
             </div>
          </Card>
        </div>

        {/* Quick Links / Activity */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
             <button onClick={() => navigate('/guide/topics')} className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform text-left">
                <Clock size={20} />
                <div>
                   <p className="text-xs font-black">Review Topics</p>
                   <p className="text-[9px] opacity-80">{stats?.pendingTopics || 0} pending proposals</p>
                </div>
             </button>
             <button onClick={() => navigate('/guide/git')} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow text-left">
                <Activity size={20} className="text-purple-500" />
                <div>
                   <p className="text-xs font-black text-gray-700 dark:text-gray-200">Git Activity</p>
                   <p className="text-[9px] text-gray-400">Monitor commits per group</p>
                </div>
             </button>
             <button onClick={() => navigate('/guide/reviews')} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow text-left">
                <FileText size={20} className="text-orange-500" />
                <div>
                   <p className="text-xs font-black text-gray-700 dark:text-gray-200">Grade Submissions</p>
                   <p className="text-[9px] text-gray-400">{stats?.pendingReviews || 0} documents awaiting feedback</p>
                </div>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideDashboard;