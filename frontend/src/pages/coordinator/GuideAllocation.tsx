import React, { useState, useMemo } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Select from '../../components/common/UI/Select';
import { 
    Users, Star, Search, Briefcase, 
    Database, Layers
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Member {
    id: string;
    name: string;
    email: string;
    isLeader: boolean;
}

interface ProjectGroup {
    id: string;
    groupName: string;
    projectTitle: string;
    domain: string;
    type: 'Individual' | 'Group';
    members: Member[];
    batchId: string;
    guideId: string | null;
    guideName: string | null;
}

interface Batch {
    id: string;
    batchName: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const BATCHES: Batch[] = [
    { id: 'b1', batchName: 'MCA 2024-26 Batch A' },
    { id: 'b2', batchName: 'MCA 2024-26 Batch B' },
    { id: 'b3', batchName: 'MCA 2023-25 Batch A' },
];

const GUIDES = [
    { id: 'g1', name: 'Dr. Sarah Johnson', specialization: 'AI/ML' },
    { id: 'g2', name: 'Prof. Michael Chen', specialization: 'Web Tech' },
    { id: 'g3', name: 'Dr. Emily Williams', specialization: 'Data Science' },
];

const INITIAL_GROUPS: ProjectGroup[] = [
    { 
        id: '1', 
        groupName: 'Team Alpha', 
        projectTitle: 'E-Commerce Platform', 
        domain: 'Web Development', 
        type: 'Group',
        batchId: 'b1',
        members: [
            { id: 's1', name: 'John Doe', email: 'john@edu.com', isLeader: true },
            { id: 's2', name: 'Jane Smith', email: 'jane@edu.com', isLeader: false }
        ],
        guideId: 'g1', 
        guideName: 'Dr. Sarah Johnson' 
    },
    { 
        id: '2', 
        groupName: 'Individual-P1', 
        projectTitle: 'Portfolio Site', 
        domain: 'Web Development', 
        type: 'Individual',
        batchId: 'b1',
        members: [{ id: 's3', name: 'Alex Lee', email: 'alex@edu.com', isLeader: true }],
        guideId: null, 
        guideName: null 
    },
    { 
        id: '3', 
        groupName: 'CyberGuard', 
        projectTitle: 'Firewall Script', 
        domain: 'Security', 
        type: 'Group',
        batchId: 'b2',
        members: [
            { id: 's4', name: 'Mike Ross', email: 'mike@edu.com', isLeader: true },
            { id: 's5', name: 'Harvey Specter', email: 'harvey@edu.com', isLeader: false }
        ],
        guideId: null, 
        guideName: null 
    },
];

const GuideAllocation: React.FC = () => {
    const [selectedBatchId, setSelectedBatchId] = useState<string>(BATCHES[0].id);
    const [groups, setGroups] = useState<ProjectGroup[]>(INITIAL_GROUPS);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Individual' | 'Group'>('All');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedGuideId, setSelectedGuideId] = useState('');

    // Derived
    const filteredGroups = useMemo(() => {
        return groups.filter(g => {
            const matchBatch = g.batchId === selectedBatchId;
            const matchSearch = g.groupName.toLowerCase().includes(search.toLowerCase()) || 
                               g.projectTitle.toLowerCase().includes(search.toLowerCase());
            const matchType = filterType === 'All' || g.type === filterType;
            return matchBatch && matchSearch && matchType;
        });
    }, [groups, selectedBatchId, search, filterType]);

    const handleAssign = (group: ProjectGroup) => {
        setSelectedGroupId(group.id);
        setSelectedGuideId(group.guideId || '');
        setIsModalOpen(true);
    };

    const confirmAllocation = () => {
        if (!selectedGroupId || !selectedGuideId) return;
        const guide = GUIDES.find(g => g.id === selectedGuideId);
        if (!guide) return;
        setGroups(prev => prev.map(g => g.id === selectedGroupId ? { ...g, guideId: guide.id, guideName: guide.name } : g));
        setIsModalOpen(false);
    };

    // Table Data
    const headers = ['Group Name', 'Members', 'Status', 'Guide', 'Action'];
    const rows = filteredGroups.map(group => [
        <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm">{group.groupName}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] line-clamp-1">{group.projectTitle}</span>
            <div className="mt-1"><Badge variant={group.type === 'Group' ? 'info' : 'secondary'}>{group.type}</Badge></div>
        </div>,
        <div className="flex -space-x-1.5 overflow-hidden">
            {group.members.map(m => (
                <div 
                    key={m.id} 
                    title={m.name + (m.isLeader ? ' (Leader)' : '')}
                    className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm
                        ${m.isLeader ? 'bg-amber-500' : 'bg-blue-500'}`}
                >
                    {m.name.charAt(0)}
                </div>
            ))}
        </div>,
        <Badge variant={group.guideId ? 'success' : 'warning'}>
            {group.guideId ? 'Allocated' : 'Pending'}
        </Badge>,
        <span className="text-xs font-semibold text-green-600 dark:text-green-400">{group.guideName || '---'}</span>,
        <Button variant="outline" size="sm" onClick={() => handleAssign(group)}>
            {group.guideId ? 'Change' : 'Assign'}
        </Button>
    ]);

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Guide Allocation</h1>
                        <p className="text-[rgb(var(--color-muted))] text-sm">Designate project guides for each group</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-[rgb(var(--color-input))] p-3 rounded-xl border border-[rgb(var(--color-border))] shadow-sm">
                    <span className="text-[10px] font-bold text-[rgb(var(--color-muted))] uppercase tracking-widest pl-1">Target Batch</span>
                    <Select 
                        value={selectedBatchId} 
                        onChange={e => setSelectedBatchId(e.target.value)}
                        className="min-w-[200px] h-9 text-xs font-semibold"
                    >
                        {BATCHES.map(b => (
                            <option key={b.id} value={b.id}>{b.batchName}</option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Main Table Card */}
            <Card>
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-[rgb(var(--color-border))] gap-4">
                    <div className="flex items-center gap-4">
                        {/* Type Filters */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            {(['All', 'Group', 'Individual'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === type ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <Badge variant="secondary" className="px-3 py-1">{filteredGroups.length} Matches</Badge>
                    </div>
                    
                    <div className="relative w-full md:w-80">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or project title..."
                            className="w-full pl-9 pr-4 py-2 text-xs bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-md focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <Table headers={headers} rows={rows} />
                
                {filteredGroups.length === 0 && (
                    <div className="py-24 text-center">
                        <Database size={44} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                        <p className="text-sm font-medium text-[rgb(var(--color-muted))]">No projects found matching your filters.</p>
                        <button onClick={() => {setSearch(''); setFilterType('All');}} className="text-xs text-blue-500 hover:underline mt-2 font-bold">Clear all filters</button>
                    </div>
                )}
            </Card>

            {/* Allocation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Manage Guide Assignment"
            >
                {(() => {
                    const group = groups.find(g => g.id === selectedGroupId);
                    if (!group) return null;
                    return (
                        <div className="space-y-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[rgb(var(--color-border))]">
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge variant={group.type === 'Group' ? 'info' : 'secondary'}>{group.type} Project</Badge>
                                    <span className="text-[10px] text-[rgb(var(--color-muted))] uppercase font-bold tracking-wider">{group.domain}</span>
                                </div>
                                <h3 className="text-base font-bold leading-tight">{group.projectTitle}</h3>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted))] mb-3 flex items-center gap-2">
                                    <Users size={14} /> Group Members
                                </h4>
                                <div className="space-y-2">
                                    {group.members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--color-border))] bg-white dark:bg-gray-900 shadow-sm">
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${member.isLeader ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-blue-500'}`}>
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="font-semibold">{member.name}</div>
                                            </div>
                                            {member.isLeader && <Badge variant="warning"><Star size={10} className="mr-1 inline fill-amber-500" /> Leader</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted))] flex items-center gap-2">
                                    <Briefcase size={14} /> Select Faculty Mentor
                                </h4>
                                <Select value={selectedGuideId} onChange={e => setSelectedGuideId(e.target.value)}>
                                    <option value="">-- Choose Guide --</option>
                                    {GUIDES.map(guide => (
                                        <option key={guide.id} value={guide.id}>{guide.name} ({guide.specialization})</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                                <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button variant="primary" className="flex-1" onClick={confirmAllocation} disabled={!selectedGuideId}>
                                    Confirm Update
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
};

export default GuideAllocation;
