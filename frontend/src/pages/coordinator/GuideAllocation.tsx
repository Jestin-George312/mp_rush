import React, { useState, useMemo } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Select from '../../components/common/UI/Select';
import { 
    Users, Star, Search, Briefcase, 
    Database, Layers, Loader2
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';

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

const GuideAllocation: React.FC = () => {
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [batches, setBatches] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [guides, setGuides] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Individual' | 'Group'>('All');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedGuideId, setSelectedGuideId] = useState('');

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const bRes = await coordApi.getBatches();
                if (bRes.data?.success && bRes.data.data.length > 0) {
                    setBatches(bRes.data.data);
                    setSelectedBatchId(bRes.data.data[0].id.toString());
                } else {
                    setIsLoading(false);
                }
            } catch (err) {
                toast.error('Failed to load batches');
                setIsLoading(false);
            }
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        if (!selectedBatchId) return;
        const fetchAllocations = async () => {
            try {
                setIsLoading(true);
                const res = await coordApi.getGuideAllocations(selectedBatchId);
                if (res.data?.success) {
                    setGuides(res.data.data.guides);
                    setGroups(res.data.data.groups);
                }
            } catch (err) {
                toast.error('Failed to load allocations');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllocations();
    }, [selectedBatchId]);

    // Derived
    const filteredGroups = useMemo(() => {
        return groups.filter(g => {
            const groupName = g.group_name || '';
            const projectTitle = g.project_title || '';
            const matchSearch = groupName.toLowerCase().includes(search.toLowerCase()) || 
                               projectTitle.toLowerCase().includes(search.toLowerCase());
            const matchType = filterType === 'All'; // Simplified filter
            return matchSearch && matchType;
        });
    }, [groups, search, filterType]);

    const handleAssign = (group: any) => {
        setSelectedGroupId(group.id.toString());
        setSelectedGuideId(group.guide_id ? group.guide_id.toString() : '');
        setIsModalOpen(true);
    };

    const confirmAllocation = async () => {
        if (!selectedGroupId || !selectedGuideId) return;
        try {
            await coordApi.assignGuide({ groupId: selectedGroupId, guideId: selectedGuideId });
            toast.success('Guide assigned successfully');
            setGroups(prev => prev.map(g => g.id.toString() === selectedGroupId ? { ...g, guide_id: selectedGuideId, guide_name: guides.find(gd => gd.id.toString() === selectedGuideId)?.name } : g));
            setIsModalOpen(false);
        } catch (error) {
            toast.error('Failed to assign guide');
        }
    };

    // Table Data
    const headers = ['Group Name', 'Members', 'Status', 'Guide', 'Action'];
    const rows = filteredGroups.map(group => [
        <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm">{group.group_name}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] line-clamp-1">{group.project_title || 'No Title Yet'}</span>
            <div className="mt-1"><Badge variant="info">Group</Badge></div>
        </div>,
        <div className="flex -space-x-1.5 overflow-hidden">
            <div className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm bg-blue-500`}>
                G
            </div>
        </div>,
        <Badge variant={group.guide_id ? 'success' : 'warning'}>
            {group.guide_id ? 'Allocated' : 'Pending'}
        </Badge>,
        <span className="text-xs font-semibold text-green-600 dark:text-green-400">{group.guide_name || '---'}</span>,
        <Button variant="outline" size="sm" onClick={() => handleAssign(group)}>
            {group.guide_id ? 'Change' : 'Assign'}
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
                        disabled={batches.length === 0}
                    >
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
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

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <Table headers={headers} rows={rows} />
                )}
                
                {!isLoading && filteredGroups.length === 0 && (
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
                                    <Badge variant="info">Group Project</Badge>
                                </div>
                                <h3 className="text-base font-bold leading-tight">{group.project_title || 'Untitled Project'}</h3>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted))] mb-3 flex items-center gap-2">
                                    <Users size={14} /> Group Members
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--color-border))] bg-white dark:bg-gray-900 shadow-sm">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white bg-blue-500">
                                                G
                                            </div>
                                            <div className="font-semibold">{group.group_name}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted))] flex items-center gap-2">
                                    <Briefcase size={14} /> Select Faculty Mentor
                                </h4>
                                <Select value={selectedGuideId} onChange={e => setSelectedGuideId(e.target.value)}>
                                    <option value="">-- Choose Guide --</option>
                                    {guides.map(guide => (
                                        <option key={guide.id} value={guide.id}>{guide.name} ({guide.special || 'Faculty'})</option>
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
