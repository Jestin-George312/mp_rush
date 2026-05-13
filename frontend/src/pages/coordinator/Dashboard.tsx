import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
    Users, GraduationCap, FolderOpen, 
    AlertCircle, Clock, CheckCircle, TrendingUp, Loader2, ChevronRight
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CoordinatorDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await coordApi.getDeptStats();
                if (res.data?.success) {
                    setData(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
                toast.error('Failed to load real-time data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Syncing Department status...</p>
            </div>
        );
    }

    if (!data) return null;

    // Handle unassigned coordinator
    if (data.isUnassigned) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
                <div className="text-center space-y-4">
                    <AlertCircle size={64} className="mx-auto text-orange-500" />
                    <div>
                        <h1 className="text-3xl font-bold text-[rgb(var(--color-text))]">Unassigned Coordinator</h1>
                        <p className="text-[rgb(var(--color-muted))] mt-2 max-w-md mx-auto">
                            You are currently not assigned to any department. Please contact the administrator to assign you to a department and regain access to the dashboard.
                        </p>
                    </div>
                    <div className="pt-4">
                        <button 
                            onClick={() => window.location.href = 'mailto:admin@apms.edu'}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Contact Administrator
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { stats, deadlines, faculty } = data;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Department Overview</h1>
                    <p className="text-[rgb(var(--color-muted))]">Real-time status of academic progress and allocations</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <TrendingUp size={16} /> Export Report
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                    onClick={() => navigate('/coordinator/students')}
                    className="flex items-center gap-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-100 dark:border-blue-900/30 cursor-pointer hover:shadow-lg transition-all group"
                >
                    <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Total Students</p>
                        <h3 className="text-2xl font-bold">{stats.students}</h3>
                    </div>
                </Card>
                <Card 
                    onClick={() => navigate('/coordinator/batches')}
                    className="flex items-center gap-4 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-100 dark:border-purple-900/30 cursor-pointer hover:shadow-lg transition-all group"
                >
                    <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Batches</p>
                        <h3 className="text-2xl font-bold">{stats.batches}</h3>
                    </div>
                </Card>
                <Card 
                    onClick={() => navigate('/coordinator/projects')}
                    className="flex items-center gap-4 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-100 dark:border-orange-900/30 cursor-pointer hover:shadow-lg transition-all group"
                >
                    <div className="p-3 bg-orange-600 rounded-xl text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                        <FolderOpen size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Active Projects</p>
                        <h3 className="text-2xl font-bold">{stats.activeProjects}</h3>
                    </div>
                </Card>
                <Card 
                    onClick={() => navigate('/coordinator/faculty')}
                    className="flex items-center gap-4 bg-gradient-to-br from-green-500/10 to-transparent border-green-100 dark:border-green-900/30 cursor-pointer hover:shadow-lg transition-all group"
                >
                    <div className="p-3 bg-green-600 rounded-xl text-white shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Guides Load</p>
                        <h3 className="text-2xl font-bold">{stats.guideAvailability}</h3>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Action Shortcuts */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-600" /> Critical Submissions
                            </h3>
                            <button 
                                onClick={() => navigate('/coordinator/submissions')}
                                className="text-xs text-blue-600 font-bold hover:underline"
                            >
                                View All Submissions
                            </button>
                        </div>
                        <div className="space-y-4">
                            {deadlines?.length > 0 ? deadlines.map((dl: any) => (
                                <div 
                                    key={dl.id} 
                                    onClick={() => navigate('/coordinator/submissions')}
                                    className="flex items-center justify-between p-4 rounded-xl border border-[rgb(var(--color-border))] bg-gray-50/50 dark:bg-gray-800/20 group hover:border-blue-300 cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <Clock size={20} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{dl.title}</h4>
                                            <p className="text-xs text-[rgb(var(--color-muted))]">{dl.batch} · {dl.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-orange-600">{dl.date}</div>
                                            <div className="text-[10px] text-blue-600 font-bold">Monitor Status</div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-gray-400 text-sm italic">
                                    No upcoming deadlines scheduled
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-bold mb-4">Pending Topic Approvals</h3>
                        <div className="p-8 text-center border-2 border-dashed border-[rgb(var(--color-border))] rounded-2xl bg-gray-50/30 dark:bg-gray-800/10">
                            <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-[rgb(var(--color-muted))]">{stats.pendingTopics} projects awaiting coordinator visibility</p>
                            <button 
                                onClick={() => navigate('/coordinator/topics')}
                                className="mt-4 px-6 py-2 text-xs font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Review All Topics
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold">Faculty Mentor Load</h3>
                            <button 
                                onClick={() => navigate('/coordinator/faculty')}
                                className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {faculty?.length > 0 ? faculty.map((guide: any) => (
                                <div 
                                    key={guide.id} 
                                    onClick={() => navigate('/coordinator/faculty')}
                                    className="flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            {guide.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold truncate max-w-[120px] group-hover:text-blue-600 transition-colors">{guide.name}</p>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-1">
                                                <div className="bg-blue-500 h-1 rounded-full group-hover:bg-blue-600 transition-all" style={{ width: `${(parseInt(guide.load) / 10) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={guide.status === 'Full' ? 'danger' : guide.status === 'Available' ? 'success' : 'default'} className="text-[10px]">
                                        {guide.load}
                                    </Badge>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-gray-400 text-xs italic">
                                    No faculty assigned yet
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => navigate('/coordinator/assignment')}
                            className="w-full mt-6 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-100 dark:border-blue-900/30"
                        >
                            Allocate More Guides
                        </button>
                    </Card>

                    <Card className="bg-blue-600 text-white shadow-xl shadow-blue-500/30">
                        <h3 className="text-base font-bold mb-2">Internal Audit</h3>
                        <p className="text-xs text-blue-100 mb-4 opacity-80">Sync latest project repository updates for compliance check.</p>
                        <button 
                            onClick={() => navigate('/coordinator/health')}
                            className="w-full py-2.5 bg-white text-blue-600 rounded-lg text-xs font-black shadow-lg hover:bg-blue-50 transition-colors uppercase tracking-wider"
                        >
                            RUN AUDIT NOW
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorDashboard;
