import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Select from '../../components/common/UI/Select';
import { 
    Users, AlertCircle, Star, 
    CheckCircle2, Loader
} from 'lucide-react';
import { getFaculty, getProjectGroups, getBatches, assignGuide } from '../../services/coordinatorApi';

const GuideAssignment: React.FC = () => {
    const [selectedBatch, setSelectedBatch] = useState('');
    const [batches, setBatches] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch batches on mount
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const response = await getBatches();
                // Unwrap the response data structure: response.data is { success, data, message }
                const batchesData = response.data.data || [];
                setBatches(batchesData);
                if (batchesData.length > 0 && !selectedBatch) {
                    setSelectedBatch(batchesData[0].id);
                }
            } catch (err: any) {
                setError('Failed to fetch batches');
                console.error('Batches fetch error:', err);
                setBatches([]);
            }
        };
        fetchBatches();
    }, []);

    // Fetch faculty and groups when batch changes
    useEffect(() => {
        if (!selectedBatch) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                const [facultyRes, groupsRes] = await Promise.all([
                    getFaculty(),
                    getProjectGroups({ batch_id: selectedBatch })
                ]);
                const facultyData = facultyRes.data.data || [];
                const groupsData = groupsRes.data.data || [];
                setFaculty(facultyData);
                setGroups(groupsData);
                setError('');
            } catch (err: any) {
                setError('Failed to fetch data');
                console.error('Data fetch error:', err);
                setFaculty([]);
                setGroups([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [selectedBatch]);

    const unassignedCount = Array.isArray(groups) ? groups.filter(g => !g.guide_name).length : 0;

    const handleManualAssign = (groupId: number, guideId: string) => {
        const guide = faculty.find(f => String(f.id) === guideId);
        setGroups(prev => prev.map(g => 
            g.id === groupId ? { ...g, guide_id: parseInt(guideId), guide_name: guide?.name, _isNewAssignment: true } : g
        ));
    };

    const handleAutoBalance = () => {
        if (!faculty.length || !groups.length) return;

        // Clone state to work with
        let currentFaculty = faculty.map(f => ({ ...f, currentLoad: f.load }));
        const updatedGroups = groups.map(g => {
            if (g.guide_name) return g; // Skip already assigned

            // Find guide with minimum load who hasn't reached max
            const availableGuides = currentFaculty
                .filter(f => f.currentLoad < f.max)
                .sort((a, b) => a.currentLoad - b.currentLoad);

            if (availableGuides.length > 0) {
                const targetGuide = availableGuides[0];
                targetGuide.currentLoad += 1;
                return { ...g, guide_id: targetGuide.id, guide_name: targetGuide.name, _isNewAssignment: true };
            }
            return g;
        });

        setGroups(updatedGroups);
    };

    const handlePublishChanges = async () => {
        const newAssignments = groups.filter(g => g._isNewAssignment && g.guide_id);
        if (newAssignments.length === 0) return;

        setLoading(true);
        try {
            for (const g of newAssignments) {
                await assignGuide({ groupId: String(g.id), guideId: String(g.guide_id) });
            }
            // Refresh data
            const [facultyRes, groupsRes] = await Promise.all([
                getFaculty(),
                getProjectGroups({ batch_id: selectedBatch })
            ]);
            setFaculty(facultyRes.data.data || []);
            setGroups(groupsRes.data.data || []);
            setError('');
        } catch (err) {
            setError('Failed to publish some changes');
        } finally {
            setLoading(false);
        }
    };

    const groupHeaders = ['Project Concept', 'Members', 'Assigned Guide', 'Quick Assign'];
    const groupRows = Array.isArray(groups) ? groups.map(g => [
        <div className="flex flex-col" key={`title-${g.id}`}>
            <span className="font-bold text-sm tracking-tight">{g.title || 'Topic Not Submitted'}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] uppercase font-black">ID: {g.id}</span>
        </div>,
        <div className="flex items-center gap-1" key={`members-${g.id}`}>
             <Users size={12} className="text-gray-400" />
             <span className="text-xs font-bold">{g.member_count || 0}</span>
        </div>,
        g.guide_name ? (
            <div className="flex items-center gap-2 text-green-600 font-bold text-xs" key={`guide-${g.id}`}>
                <CheckCircle2 size={14} /> {g.guide_name}
            </div>
        ) : (
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs animate-pulse" key={`guide-${g.id}`}>
                <AlertCircle size={14} /> UNALLOCATED
            </div>
        ),
        <Select 
            key={`select-${g.id}`}
            value={g.guide_id || ''}
            onChange={(e) => handleManualAssign(g.id, e.target.value)}
            className="h-8 text-[11px] font-bold border-none bg-gray-50 dark:bg-gray-800"
        >
            <option value="">Select Faculty...</option>
            {Array.isArray(faculty) && faculty.map(f => (
                <option key={f.id} value={f.id} disabled={f.load >= f.max}>{f.name} ({f.load}/{f.max})</option>
            ))}
        </Select>
    ]) : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Guide Assignment Wheel</h1>
                    <p className="text-[rgb(var(--color-muted))]">Distribute project workloads and map faculty expertise to student concepts</p>
                </div>
                <div className="flex items-center gap-3 bg-[rgb(var(--color-input))] p-2 rounded-xl border border-[rgb(var(--color-border))]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Batch:</span>
                    <Select 
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                        className="w-56 h-9 border-none bg-transparent font-black text-xs"
                    >
                        <option value="">Select a batch...</option>
                        {Array.isArray(batches) && batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name || b.id}</option>
                        ))}
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Main Assignment Area */}
                <div className="space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-8 border-b border-[rgb(var(--color-border))] pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Star size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Unallocated Groups</h2>
                                    <p className="text-xs font-medium text-[rgb(var(--color-muted))]">
                                        {loading ? 'Loading...' : `Found ${unassignedCount} groups needing a faculty mentor`}
                                    </p>
                                </div>
                            </div>
                             <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-[10px] h-8 font-black uppercase"
                                    onClick={handleAutoBalance}
                                    disabled={loading || unassignedCount === 0}
                                >
                                    Auto-Balance
                                </Button>
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    className="text-[10px] h-8 font-black uppercase"
                                    onClick={handlePublishChanges}
                                    disabled={loading || groups.filter(g => g._isNewAssignment).length === 0}
                                >
                                    Publish Changes
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader size={24} className="animate-spin text-blue-600" />
                                <span className="ml-2 text-sm font-medium">Loading guide assignments...</span>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-[rgb(var(--color-muted))]">No groups found for this batch</p>
                            </div>
                        ) : (
                            <Table headers={groupHeaders} rows={groupRows} />
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GuideAssignment;
