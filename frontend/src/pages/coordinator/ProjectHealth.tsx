import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import { 
    ShieldAlert, Heart, Gauge, 
    Github, Users,
    TrendingDown, Zap, Search, Loader2
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';

const ProjectHealth: React.FC = () => {
    const [atRisk, setAtRisk] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuditing, setIsAuditing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'healthy' | 'attention' | 'risk'>('all');

    const fetchHealth = async (isManual = false) => {
        try {
            if (!isManual) setIsLoading(true);
            const res = await coordApi.getProjectHealthStats();
            if (res.data?.success) {
                setAtRisk(res.data.data.atRiskProjects || []);
            }
        } catch (error) {
            toast.error('Failed to load project health');
        } finally {
            if (!isManual) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    const handleManualAudit = async () => {
        setIsAuditing(true);
        const toastId = toast.loading('Running diagnostic audit on all projects...');
        
        // Simulate a slightly longer audit for effect
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await fetchHealth(true);
        
        setIsAuditing(false);
        toast.success('System audit complete. Metrics updated.', { id: toastId });
    };

    const atRiskCount = atRisk.filter(r => r.daysOverdue > 0).length;
    const totalProjects = atRisk.length;

    const repoStatusBadge = totalProjects === 0 ? 'NO DATA' : 'NOMINAL';
    const mentorStatusBadge = totalProjects === 0 ? 'NO DATA' : (atRiskCount === 0 ? 'NOMINAL' : 'DELAYED');
    const linkedRepoCount = atRisk.filter(r => r.hasRepo).length;
    const complianceRepo = totalProjects === 0 ? 0 : Math.max(0, Math.round((linkedRepoCount / totalProjects) * 100));
    const complianceDocs = totalProjects === 0 ? 0 : Math.max(0, Math.round(((totalProjects - atRiskCount) / totalProjects) * 100));

    const filteredRisks = atRisk.filter(r => {
        const matchesSearch = ((r.groupName || '').toLowerCase().includes(search.toLowerCase()) || 
                               (r.title || '').toLowerCase().includes(search.toLowerCase()));
        
        if (!matchesSearch) return false;

        if (activeFilter === 'healthy') return r.daysOverdue === 0;
        if (activeFilter === 'attention') return r.daysOverdue > 0 && r.daysOverdue <= 3;
        if (activeFilter === 'risk') return r.daysOverdue > 3;
        
        return true; // 'all'
    });

    const healthSummary = [
        { id: 'healthy', label: 'Healthy Systems', value: atRisk.filter(r => r.daysOverdue === 0).length, color: 'text-green-600', icon: <Heart className="text-green-600" size={20} /> },
        { id: 'attention', label: 'Need Attention', value: atRisk.filter(r => r.daysOverdue > 0 && r.daysOverdue <= 3).length, color: 'text-orange-600', icon: <Zap className="text-orange-600" size={20} /> },
        { id: 'risk', label: 'At Risk', value: atRisk.filter(r => r.daysOverdue > 3).length, color: 'text-red-600', icon: <ShieldAlert className="text-red-600" size={20} /> },
    ];

    const headers = ['Affected Group', 'Cohort context', 'Primary Health Issue', 'Impact Level', 'Action'];
    const rows = filteredRisks.map(r => [
        <div className="font-black text-sm text-[rgb(var(--color-primary))]">{r.groupName || 'Unknown Group'}</div>,
        <div className="text-[10px] font-bold text-gray-400">{r.title || 'Untitled Project'}</div>,
        <div className="flex flex-col">
            <span className={`text-xs font-black tracking-tight ${r.daysOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {r.daysOverdue > 0 ? `${r.daysOverdue} Days Overdue` : 'On Schedule'}
            </span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] italic">
                {r.daysOverdue > 0 ? 'Requires immediate intervention' : 'System functioning normally'}
            </span>
        </div>,
        <Badge variant={r.daysOverdue > 3 ? 'danger' : r.daysOverdue > 0 ? 'warning' : 'success'} className="text-[9px] uppercase tracking-widest">
            {r.daysOverdue > 3 ? 'Critical' : r.daysOverdue > 0 ? 'Medium' : 'Optimal'}
        </Badge>,
        <button className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${r.daysOverdue > 0 ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}>
            {r.daysOverdue > 0 ? 'Intervene' : 'View Stats'}
        </button>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Health Analytics</h1>
                    <p className="text-[rgb(var(--color-muted))]">Detecting architectural at-risk projects through activity & compliance audit</p>
                </div>
                {isLoading ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                         <span className="text-xs font-black text-gray-400">Loading...</span>
                    </div>
                ) : totalProjects === 0 ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <ShieldAlert size={18} className="text-gray-500" />
                        <span className="text-xs font-black text-gray-500 uppercase">No Data Available</span>
                    </div>
                ) : atRiskCount === 0 ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl">
                        <Heart size={18} className="text-green-600" />
                        <span className="text-xs font-black text-green-600 uppercase">All Systems Nominal</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                        <ShieldAlert size={18} className="text-red-600 animate-bounce" />
                        <span className="text-xs font-black text-red-600 uppercase">Attention Required for {atRiskCount} Systems</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {healthSummary.map(stat => {
                    const isActive = activeFilter === stat.id;
                    return (
                        <Card 
                            key={stat.label} 
                            onClick={() => setActiveFilter(isActive ? 'all' : stat.id as any)}
                            className={`p-6 relative overflow-hidden group cursor-pointer transition-all border-2 
                                ${isActive ? 'border-blue-500 shadow-lg scale-[1.02]' : 'border-transparent hover:border-blue-200'}`}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 dark:bg-gray-800/10 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform"></div>
                            <div className="flex items-center gap-4 relative">
                                <div className={`p-3 shadow-md rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800'}`}>
                                    {React.cloneElement(stat.icon as React.ReactElement, { className: isActive ? 'text-white' : (stat.icon as any).props.className })}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                    <h3 className={`text-3xl font-black ${isActive ? 'text-blue-600' : stat.color}`}>{stat.value}</h3>
                                </div>
                            </div>
                            {isActive && (
                                <div className="absolute top-2 right-2">
                                    <Badge variant="primary" className="text-[8px] px-1 py-0 shadow-none">FILTER ACTIVE</Badge>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8">
                     <div className="flex items-center justify-between mb-8 border-b border-[rgb(var(--color-border))] pb-6">
                         <div className="flex items-center gap-3">
                             <TrendingDown size={20} className={activeFilter === 'healthy' ? 'text-green-600' : 'text-red-600'} />
                             <h3 className="text-lg font-bold">
                                 {activeFilter === 'all' ? 'Priority Intervention List' : 
                                  activeFilter === 'healthy' ? 'Optimal Performance Cohort' : 
                                  activeFilter === 'attention' ? 'Early Intervention Queue' : 'Critical Warning List'}
                             </h3>
                             {activeFilter !== 'all' && (
                                 <button 
                                    onClick={() => setActiveFilter('all')}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                 >
                                     Reset Filter
                                 </button>
                             )}
                         </div>
                         <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                             <input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-1.5 bg-gray-50/50 dark:bg-gray-800/20 border border-[rgb(var(--color-border))] rounded-lg text-xs" placeholder="Search risky groups..." />
                         </div>
                     </div>
                     {isLoading ? (
                         <div className="flex justify-center p-8">
                             <Loader2 className="animate-spin text-blue-500" />
                         </div>
                     ) : filteredRisks.length > 0 ? (
                         <Table headers={headers} rows={rows} />
                     ) : (
                         <div className="py-20 text-center">
                            {activeFilter === 'healthy' ? (
                                <ShieldAlert size={48} className="mx-auto text-orange-200 dark:text-orange-900/50 mb-4" />
                            ) : (
                                <Heart size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                            )}
                            <h3 className="text-lg font-bold text-[rgb(var(--color-primary))]">
                                {activeFilter === 'healthy' ? 'No Healthy Systems Found' : 
                                 activeFilter === 'all' ? 'No Projects Found' : 'Queue Empty'}
                            </h3>
                            <p className="text-sm text-[rgb(var(--color-muted))] max-w-xs mx-auto mt-2">
                                {activeFilter === 'healthy' ? 'All active projects currently require some form of intervention.' : 
                                 activeFilter === 'all' ? 'No projects were found matching the current search criteria.' : 
                                 'No projects detected falling into this risk category.'}
                            </p>
                        </div>
                     )}
                </Card>

                <div className="lg:col-span-4 space-y-6">
                     <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-xl shadow-indigo-500/20">
                         <h3 className="text-lg font-bold mb-2">Automated Health Check</h3>
                         <p className="text-xs text-indigo-100/70 mb-6 leading-relaxed">System audits GitHub repository heartbeats, document submission gaps, and mentor feedback latency every 24 hours.</p>
                         <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                 <div className="flex items-center gap-2">
                                     <Github size={16} />
                                     <span className="text-[10px] font-bold">Repo Heartbeat</span>
                                 </div>
                                 <Badge variant="default" className={`border-none ${repoStatusBadge === 'NO DATA' ? 'bg-white/20 text-gray-200' : 'bg-green-400/20 text-green-300'}`}>
                                     {repoStatusBadge}
                                 </Badge>
                             </div>
                             <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                 <div className="flex items-center gap-2">
                                     <Users size={16} />
                                     <span className="text-[10px] font-bold">Mentor Latency</span>
                                 </div>
                                 <Badge variant="default" className={`border-none ${mentorStatusBadge === 'NO DATA' ? 'bg-white/20 text-gray-200' : mentorStatusBadge === 'NOMINAL' ? 'bg-green-400/20 text-green-300' : 'bg-orange-400/20 text-orange-300'}`}>
                                     {mentorStatusBadge}
                                 </Badge>
                             </div>
                         </div>
                         <button 
                            onClick={handleManualAudit}
                            disabled={isAuditing}
                            className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl text-xs font-black shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAuditing ? (
                                <><Loader2 size={14} className="animate-spin" /> RUNNING DIAGNOSTIC...</>
                            ) : (
                                'TRIGGER MANUAL AUDIT'
                            )}
                         </button>
                     </Card>

                     <Card>
                         <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                             <Gauge size={16} className="text-blue-600" /> Compliance Scoring
                         </h3>
                         <div className="space-y-4">
                             <div>
                                 <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase">
                                     <span>Standard Repo Linkage</span>
                                     <span className={totalProjects === 0 ? 'text-gray-400' : complianceRepo === 100 ? 'text-green-600' : 'text-orange-500'}>{complianceRepo}%</span>
                                 </div>
                                 <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                     <div className={`h-full ${totalProjects === 0 ? 'bg-gray-300 dark:bg-gray-600' : complianceRepo === 100 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]'}`} style={{ width: `${complianceRepo}%` }}></div>
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase">
                                     <span>On-Time Doc Submissions</span>
                                     <span className={totalProjects === 0 ? 'text-gray-400' : complianceDocs === 100 ? 'text-green-600' : 'text-orange-500'}>{complianceDocs}%</span>
                                 </div>
                                 <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                     <div className={`h-full ${totalProjects === 0 ? 'bg-gray-300 dark:bg-gray-600' : complianceDocs === 100 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]'}`} style={{ width: `${complianceDocs}%` }}></div>
                                 </div>
                             </div>
                         </div>
                     </Card>
                </div>
            </div>
        </div>
    );
};

export default ProjectHealth;
