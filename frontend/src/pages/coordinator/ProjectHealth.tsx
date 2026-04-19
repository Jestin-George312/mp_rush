import React from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import { 
    ShieldAlert, Heart, Gauge, 
    Github, Users,
    TrendingDown, Zap, Search
} from 'lucide-react';

const ProjectHealth: React.FC = () => {
    // Risk Metrics
    const risks = [
        { id: '1', group: 'Team Delta', issue: 'High Risk', reason: 'No assigned guide, missed SRS deadline', impact: 'Critical', batch: 'MCA 2024-26 A' },
        { id: '2', group: 'Project X', issue: 'Stagnant', reason: 'No GitHub commits in 14 days', impact: 'High', batch: 'MCA 2024-26 A' },
        { id: '3', group: 'Team Omega', issue: 'Deadline Warning', reason: 'Final review overdue by 2 days', impact: 'Medium', batch: 'MSc CS 2023-25' },
    ];

    const healthSummary = [
        { label: 'Healthy Systems', value: '42', color: 'text-green-600', icon: <Heart className="text-green-600" size={20} /> },
        { label: 'Need Attention', value: '12', color: 'text-orange-600', icon: <Zap className="text-orange-600" size={20} /> },
        { label: 'At Risk', value: '05', color: 'text-red-600', icon: <ShieldAlert className="text-red-600" size={20} /> },
    ];

    const headers = ['Affected Group', 'Cohort context', 'Primary Health Issue', 'Impact Level', 'Action'];
    const rows = risks.map(r => [
        <div className="font-black text-sm text-[rgb(var(--color-primary))]">{r.group}</div>,
        <div className="text-[10px] font-bold text-gray-400">{r.batch}</div>,
        <div className="flex flex-col">
            <span className="text-xs font-black text-red-600 tracking-tight">{r.issue}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] italic">{r.reason}</span>
        </div>,
        <Badge variant={r.impact === 'Critical' ? 'danger' : 'warning'} className="text-[9px] uppercase tracking-widest">{r.impact}</Badge>,
        <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all">Intervene</button>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Health Analytics</h1>
                    <p className="text-[rgb(var(--color-muted))]">Detecting architectural at-risk projects through activity & compliance audit</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                    <ShieldAlert size={18} className="text-red-600 animate-bounce" />
                    <span className="text-xs font-black text-red-600 uppercase">Attention Required for 5 Systems</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {healthSummary.map(stat => (
                    <Card key={stat.label} className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 dark:bg-gray-800/10 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform"></div>
                        <div className="flex items-center gap-4 relative">
                             <div className="p-3 bg-white dark:bg-gray-800 shadow-md rounded-xl">
                                 {stat.icon}
                             </div>
                             <div>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                 <h3 className={`text-3xl font-black ${stat.color}`}>{stat.value}</h3>
                             </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8">
                     <div className="flex items-center justify-between mb-8 border-b border-[rgb(var(--color-border))] pb-6">
                         <div className="flex items-center gap-3">
                             <TrendingDown size={20} className="text-red-600" />
                             <h3 className="text-lg font-bold">Priority Intervention List</h3>
                         </div>
                         <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                             <input className="pl-9 pr-4 py-1.5 bg-gray-50/50 dark:bg-gray-800/20 border border-[rgb(var(--color-border))] rounded-lg text-xs" placeholder="Search risky groups..." />
                         </div>
                     </div>
                     <Table headers={headers} rows={rows} />
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
                                 <Badge variant="success" className="bg-green-400/20 text-green-300 border-none">NOMINAL</Badge>
                             </div>
                             <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                 <div className="flex items-center gap-2">
                                     <Users size={16} />
                                     <span className="text-[10px] font-bold">Mentor Latency</span>
                                 </div>
                                 <Badge variant="warning" className="bg-orange-400/20 text-orange-300 border-none">DELAYED</Badge>
                             </div>
                         </div>
                         <button className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl text-xs font-black shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                             TRIGGER MANUAL AUDIT
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
                                     <span className="text-green-600">88%</span>
                                 </div>
                                 <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-green-500 w-[88%] shadow-[0_0_8px_rgba(34,197,94,0.3)]"></div>
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase">
                                     <span>On-Time Doc Submissions</span>
                                     <span className="text-orange-500">64%</span>
                                 </div>
                                 <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-orange-500 w-[64%] shadow-[0_0_8px_rgba(249,115,22,0.3)]"></div>
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
