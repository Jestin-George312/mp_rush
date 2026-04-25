import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import Select from '../../components/common/UI/Select';
import { 
    Search, Github, CheckCircle, 
    Clock, Users, ArrowUpRight,
    Filter, LayoutGrid, List, Loader2
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';

const ProjectGroups: React.FC = () => {
    const [search, setSearch] = useState('');
    const [batchFilter, setBatchFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const [projects, setProjects] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const [projRes, batchesRes] = await Promise.all([
                    coordApi.getProjectGroups(),
                    coordApi.getBatches()
                ]);
                if (projRes.data?.success) setProjects(projRes.data.data);
                if (batchesRes.data?.success) setBatches(batchesRes.data.data);
            } catch (error) {
                toast.error('Failed to load project groups');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const filteredProjects = projects.filter(p => {
        const groupSearch = (p.group_name || '').toLowerCase().includes(search.toLowerCase());
        const titleSearch = (p.title || '').toLowerCase().includes(search.toLowerCase());
        const matchSearch = groupSearch || titleSearch;
        const matchBatch = batchFilter === 'All' || p.batch_id === parseInt(batchFilter);
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
            <span className="font-bold text-sm tracking-tight line-clamp-1">{p.title || 'Untitled Project'}</span>
            <div className="flex items-center gap-2">
                 <Badge variant={p.member_count > 1 ? 'info' : 'secondary'} className="text-[10px] scale-90 origin-left uppercase">{p.group_name}</Badge>
                 <span className="text-[10px] text-[rgb(var(--color-muted))] font-bold">{p.batch_name}</span>
            </div>
        </div>,
        <div className="flex flex-col gap-1">
            <div className="flex -space-x-2 overflow-hidden items-center">
                <div title={`${p.member_count} members`} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    <Users size={12} />
                </div>
                <span className="ml-3 text-[10px] font-bold text-[rgb(var(--color-muted))]">/ {p.guide_name || 'No Mentor'}</span>
            </div>
        </div>,
        <div className="flex items-center gap-3">
             <div className="flex flex-col items-center">
                 <div className={`p-1 rounded-full ${p.review_state === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                     {p.review_state === 'Approved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                 </div>
                 <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">Topic</span>
             </div>
             <div className="flex flex-col items-center">
                 <div className={`p-1 rounded-full ${p.github_repo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                     <Github size={12} />
                 </div>
                 <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">Repo</span>
             </div>
        </div>,
        <div className="flex flex-col gap-1.5 w-24">
             <div className="flex justify-between text-[10px] font-black">
                 <span>{p.progress || 0}%</span>
                 <span className="text-[rgb(var(--color-muted))] tracking-tighter">- DOCS</span>
             </div>
             <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress || 0}%` }}></div>
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
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </Select>
                        </div>
                        <button className="px-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-blue-600 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : (filteredProjects.length > 0) ? (
                    viewMode === 'table' ? (
                        <Table headers={headers} rows={rows} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map(p => (
                                <Card key={p.id} className="group hover:border-blue-500 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                         <Badge variant={p.review_state === 'Approved' ? 'success' : 'warning'} className="text-[9px] uppercase tracking-widest">{p.review_state || 'Pending'}</Badge>
                                         <Github size={18} className={p.github_repo ? 'text-blue-600' : 'text-gray-300'} />
                                    </div>
                                    <h3 className="font-bold text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{p.title || 'Untitled Project'}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                         <Users size={14} className="text-gray-400" />
                                         <span className="text-[10px] font-black text-gray-400">TEAM SIZE: {p.member_count}</span>
                                         <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                         <span className="text-[10px] font-black text-blue-600">{p.batch_name}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[rgb(var(--color-border))]">
                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Assigned Mentor</p>
                                        <p className="text-xs font-bold text-[rgb(var(--color-primary))]">{p.guide_name || 'Unassigned'}</p>
                                    </div>
                                    <div className="mt-6 flex justify-between items-end">
                                         <div className="flex-1">
                                             <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase">
                                                 <span>Success Matrix</span>
                                                 <span>{p.progress || 0}%</span>
                                             </div>
                                             <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                 <div className="h-full bg-green-500" style={{ width: `${p.progress || 0}%` }}></div>
                                             </div>
                                         </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                        <h3 className="text-lg font-bold text-[rgb(var(--color-primary))]">No Projects Found</h3>
                        <p className="text-sm text-[rgb(var(--color-muted))] max-w-xs mx-auto mt-2">
                            We couldn't find any projects matching your current filters or search criteria.
                        </p>
                        <button onClick={() => {setSearch(''); setBatchFilter('All');}} className="mt-4 text-xs font-black uppercase tracking-widest text-blue-600 hover:underline">Reset Filters</button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProjectGroups;
