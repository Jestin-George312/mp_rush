import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import Select from '../../components/common/UI/Select';
import Input from '../../components/common/UI/Input';
import { 
    Search, CheckCircle, XCircle, Clock, 
    Database, BookOpen, User,
    FileSearch, AlertCircle
} from 'lucide-react';

const TopicMonitor: React.FC = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // High fidelity mock data for topic auditing
    const topics = [
        { id: 't1', title: 'Decentralized Identity using Polygon', domain: 'Blockchain', group: 'MetaTrust', guide: 'Dr. Sarah Johnson', status: 'Approved', comments: 'Promising scope.' },
        { id: 't2', title: 'Real-time Emotion Analysis', domain: 'Deep Learning', group: 'FeelAI', guide: 'Prof. Michael Chen', status: 'Pending', comments: 'Review in progress.' },
        { id: 't3', title: 'Local Service Marketplace', domain: 'Web Tech', group: 'Servicely', guide: 'Alex Rivera', status: 'Rejected', comments: 'Scope too generic.' },
        { id: 't4', title: 'Network Traffic Optimizer', domain: 'Networking', group: 'FlowMax', guide: 'Dr. Emily Williams', status: 'Approved', comments: 'Verified feasibility.' },
    ];

    const filteredTopics = topics.filter(t => {
        const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                           t.group.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const headers = ['Topic Concept & Domain', 'Entities', 'Guide Input', 'Approval Audit', 'Insight'];
    const rows = filteredTopics.map(t => [
        <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm tracking-tight leading-tight">{t.title}</span>
            <div className="flex items-center gap-2 mt-1">
                 <Badge variant="default" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] px-1.5 py-0.5 font-black uppercase tracking-widest">{t.domain}</Badge>
            </div>
        </div>,
        <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[rgb(var(--color-primary))]">
                <BookOpen size={12} className="text-gray-400" /> {t.group}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[rgb(var(--color-muted))] mt-0.5">
                <User size={10} className="text-gray-400" /> {t.guide}
            </div>
        </div>,
        <div className="max-w-[150px]">
             <p className="text-[10px] text-gray-500 italic leading-snug line-clamp-2">"{t.comments}"</p>
        </div>,
        <div className="flex items-center gap-2">
            {t.status === 'Approved' && <Badge variant="success" className="text-[9px] tracking-tight"><CheckCircle size={10} className="mr-1" /> VERIFIED</Badge>}
            {t.status === 'Pending' && <Badge variant="warning" className="text-[9px] tracking-tight"><Clock size={10} className="mr-1" /> AUDITING</Badge>}
            {t.status === 'Rejected' && <Badge variant="danger" className="text-[9px] tracking-tight"><XCircle size={10} className="mr-1" /> DECLINED</Badge>}
        </div>,
        <button className="text-[10px] font-black uppercase text-blue-600 hover:underline">Full Trace</button>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Topic Approval Hub</h1>
                    <p className="text-[rgb(var(--color-muted))]">Global visibility into research concepts and guide validation phases</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-5 border-l-4 border-l-blue-600 bg-blue-50/20">
                     <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg ring-4 ring-blue-500/10">
                         <Database size={24} />
                     </div>
                     <div>
                         <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Submissions</p>
                         <h3 className="text-2xl font-black">{topics.length}</h3>
                     </div>
                </Card>
                <Card className="flex items-center gap-5 border-l-4 border-l-orange-500 bg-orange-50/20">
                     <div className="p-3 bg-orange-600 text-white rounded-xl shadow-lg ring-4 ring-orange-500/10">
                         <FileSearch size={24} />
                     </div>
                     <div>
                         <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">In Validation</p>
                         <h3 className="text-2xl font-black">01</h3>
                     </div>
                </Card>
                <Card className="flex items-center gap-5 border-l-4 border-l-red-500 bg-red-50/20">
                     <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg ring-4 ring-red-500/10">
                         <AlertCircle size={24} />
                     </div>
                     <div>
                         <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Declined Topics</p>
                         <h3 className="text-2xl font-black">01</h3>
                     </div>
                </Card>
            </div>

            <Card>
                <div className="flex flex-col md:flex-row items-center gap-4 mb-8 pb-6 border-b border-[rgb(var(--color-border))]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Monitor specific topics, domains or student groups..."
                            className="pl-10 h-10 border-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="px-3 py-1 text-[10px] font-black">{filteredTopics.length} RESULT</Badge>
                        <Select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-40 h-10 border-gray-200"
                        >
                            <option value="All">All States</option>
                            <option>Approved</option>
                            <option>Pending</option>
                            <option>Rejected</option>
                        </Select>
                    </div>
                </div>

                <Table headers={headers} rows={rows} />
            </Card>
        </div>
    );
};

export default TopicMonitor;
