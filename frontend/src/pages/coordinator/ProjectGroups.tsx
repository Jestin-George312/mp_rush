import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import Select from '../../components/common/UI/Select';
import { 
    Search, Github, CheckCircle, 
    Clock, Users, ArrowUpRight,
    Filter, LayoutGrid, List
} from 'lucide-react';

const ProjectGroups: React.FC = () => {
    const [search, setSearch] = useState('');
    const [batchFilter, setBatchFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    // Robust Mock Data for complete visibility
    const projects = [
        { 
            id: 'g1', 
            title: 'AI Based Traffic Management', 
            mode: 'Group', 
            members: ['John Doe', 'Jane Smith'], 
            batch: 'MCA 2024-26 A',
            guide: 'Dr. Sarah Johnson',
            topicStatus: 'Approved',
            github: 'Connected',
            progress: 85,
            submissions: '4/5'
        },
        { 
            id: 'g2', 
            title: 'E-Health Care Registry', 
            mode: 'Group', 
            members: ['Michael Chen', 'Sarah Wilson'], 
            batch: 'MCA 2024-26 A',
            guide: 'Prof. Michael Chen',
            topicStatus: 'Pending',
            github: 'Not Linked',
            progress: 20,
            submissions: '1/5'
        },
        { 
            id: 'g3', 
            title: 'Portfolio Analysis Tool', 
            mode: 'Individual', 
            members: ['Alex Rivera'], 
            batch: 'MCA 2024-26 B',
            guide: 'Dr. Emily Williams',
            topicStatus: 'Approved',
            github: 'Connected',
            progress: 100,
            submissions: '5/5'
        },
    ];

    const filteredProjects = projects.filter(p => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                           p.members.some(m => m.toLowerCase().includes(search.toLowerCase()));
        const matchBatch = batchFilter === 'All' || p.batch === batchFilter;
        return matchSearch && matchBatch;
    });

    const headers = [
        'Project Identity', 
        'Team & Mentorship', 
        'Verification Status', 
        'Progress', 
        'Links'
    ];

    const rows = filteredProjects.map(p => [
        <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm tracking-tight line-clamp-1">{p.title}</span>
            <div className="flex items-center gap-2">
                 <Badge variant={p.mode === 'Group' ? 'info' : 'secondary'} className="text-[10px] scale-90 origin-left uppercase">{p.mode}</Badge>
                 <span className="text-[10px] text-[rgb(var(--color-muted))] font-bold">{p.batch}</span>
            </div>
        </div>,
        <div className="flex flex-col gap-1">
            <div className="flex -space-x-2 overflow-hidden items-center">
                {p.members.map(m => (
                    <div key={m} title={m} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                        {m.charAt(0)}
                    </div>
                ))}
                <span className="ml-3 text-[10px] font-bold text-[rgb(var(--color-muted))]">/ {p.guide}</span>
            </div>
        </div>,
        <div className="flex items-center gap-3">
             <div className="flex flex-col items-center">
                 <div className={`p-1 rounded-full ${p.topicStatus === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                     {p.topicStatus === 'Approved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                 </div>
                 <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">Topic</span>
             </div>
             <div className="flex flex-col items-center">
                 <div className={`p-1 rounded-full ${p.github === 'Connected' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                     <Github size={12} />
                 </div>
                 <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">Repo</span>
             </div>
        </div>,
        <div className="flex flex-col gap-1.5 w-24">
             <div className="flex justify-between text-[10px] font-black">
                 <span>{p.progress}%</span>
                 <span className="text-[rgb(var(--color-muted))] tracking-tighter">{p.submissions} DOCS</span>
             </div>
             <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
             </div>
        </div>,
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-blue-600 transition-colors">
            <ArrowUpRight size={18} />
        </button>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Project Explorer</h1>
                    <p className="text-[rgb(var(--color-muted))]">Complete matrix of departmental project groups and their technical health</p>
                </div>
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
                    >
                        <List size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 pb-6 border-b border-[rgb(var(--color-border))]">
                    <div className="md:col-span-8 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search projects by title, code, or member names..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/50 dark:bg-gray-800/20 border border-[rgb(var(--color-border))] rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                        />
                    </div>
                    <div className="md:col-span-4 flex gap-2">
                        <div className="flex-1">
                            <Select 
                                value={batchFilter} 
                                onChange={(e) => setBatchFilter(e.target.value)}
                                className="h-full border-gray-200"
                            >
                                <option value="All">All Batches</option>
                                <option>MCA 2024-26 A</option>
                                <option>MCA 2024-26 B</option>
                            </Select>
                        </div>
                        <button className="px-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-blue-600 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <Table headers={headers} rows={rows} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(p => (
                            <Card key={p.id} className="group hover:border-blue-500 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                     <Badge variant={p.topicStatus === 'Approved' ? 'success' : 'warning'} className="text-[9px] uppercase tracking-widest">{p.topicStatus}</Badge>
                                     <Github size={18} className={p.github === 'Connected' ? 'text-blue-600' : 'text-gray-300'} />
                                </div>
                                <h3 className="font-bold text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{p.title}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                     <Users size={14} className="text-gray-400" />
                                     <span className="text-[10px] font-black text-gray-400">TEAM SIZE: {p.members.length}</span>
                                     <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                     <span className="text-[10px] font-black text-blue-600">{p.batch}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[rgb(var(--color-border))]">
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Assigned Mentor</p>
                                    <p className="text-xs font-bold text-[rgb(var(--color-primary))]">{p.guide}</p>
                                </div>
                                <div className="mt-6 flex justify-between items-end">
                                     <div className="flex-1">
                                         <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase">
                                             <span>Success Matrix</span>
                                             <span>{p.progress}%</span>
                                         </div>
                                         <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                             <div className="h-full bg-green-500" style={{ width: `${p.progress}%` }}></div>
                                         </div>
                                     </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProjectGroups;
