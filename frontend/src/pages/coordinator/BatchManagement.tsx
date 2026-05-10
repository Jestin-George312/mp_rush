import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import { 
    Plus, Search, Library, Users, 
    GraduationCap, FolderOpen, ChevronRight,
    Calendar, TrendingUp, Settings, Loader2
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';

const BatchManagement: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newBatch, setNewBatch] = useState({ 
        name: '', 
        start_year: '', 
        end_year: '',
        topic_submission_start: '',
        topic_submission_end: '',
        project_type_mode: 'mixed',
        max_group_size: 3
    });
    const [editingBatch, setEditingBatch] = useState<any>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [activeFaculty, setActiveFaculty] = useState<any[]>([]);
    const [assignedFacultyIds, setAssignedFacultyIds] = useState<number[]>([]);
    const [isFetchingFaculty, setIsFetchingFaculty] = useState(false);
    const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);

    useEffect(() => {
        coordApi.getFaculty().then(res => {
            if (res.data?.success) {
                setActiveFaculty(res.data.data.filter((f: any) => f.status === 'active'));
            }
        }).catch(console.error);
    }, []);

    const handleOpenSettings = (batch: any) => {
        setEditingBatch(batch);
        setIsSettingsModalOpen(true);
    };

    const handleOpenFacultyModal = async (batch: any) => {
        setEditingBatch(batch);
        setIsFacultyModalOpen(true);
        setIsFetchingFaculty(true);
        try {
            const res = await coordApi.getBatchFaculty(batch.id);
            if (res.data?.success) {
                setAssignedFacultyIds(res.data.data.map((f: any) => f.id));
            }
        } catch (e) {}
        setIsFetchingFaculty(false);
    };

    const handleToggleFaculty = (id: number) => {
        setAssignedFacultyIds(prev => 
            prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
        );
    };

    const fetchBatches = async () => {
        try {
            setIsLoading(true);
            const res = await coordApi.getBatches();
            if (res.data?.success) {
                setBatches(res.data.data);
            }
        } catch (error) {
            console.error('Fetch batches error', error);
            toast.error('Failed to load batches');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const handleCreateBatch = async () => {
        try {
            await coordApi.createBatch({
                ...newBatch,
                start_year: parseInt(newBatch.start_year),
                end_year: parseInt(newBatch.end_year)
            });
            toast.success('Batch created successfully');
            setIsAddModalOpen(false);
            setNewBatch({ 
                name: '', start_year: '', end_year: '', 
                topic_submission_start: '', topic_submission_end: '', 
                project_type_mode: 'mixed', max_group_size: 3 
            });
            fetchBatches();
        } catch (error) {
            toast.error('Failed to create batch');
        }
    };

    const handleUpdateBatch = async () => {
        if (!editingBatch) return;
        try {
            await coordApi.updateBatch(editingBatch.id, {
                topic_submission_start: editingBatch.topic_submission_start,
                topic_submission_end: editingBatch.topic_submission_end,
                project_type_mode: editingBatch.project_type_mode,
                is_active: editingBatch.is_active,
                max_group_size: editingBatch.max_group_size
            });
            toast.success('Batch settings updated');
            setIsSettingsModalOpen(false);
            setEditingBatch(null);
            fetchBatches();
        } catch (error) {
            toast.error('Failed to update batch');
        }
    };

    const handleSaveFaculty = async () => {
        if (!editingBatch) return;
        try {
            await coordApi.setBatchFaculty(editingBatch.id, { facultyIds: assignedFacultyIds });
            toast.success('Faculty assignments updated');
            setIsFacultyModalOpen(false);
            setEditingBatch(null);
            fetchBatches();
        } catch (error) {
            toast.error('Failed to update assignments');
        }
    };


    const filteredBatches = batches.filter(b => 
        b.name?.toLowerCase().includes(search.toLowerCase()) || 
        `${b.start_year}-${b.end_year}`.includes(search)
    );

    const headers = [
        'Batch Identity', 
        'Statistics', 
        'Allocations', 
        'Status', 
        'Manage'
    ];

    const rows = filteredBatches.map(b => [
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
                ${b.is_active ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-gray-100 text-gray-400'}`}>
                <Library size={24} />
            </div>
            <div>
                <p className="font-bold text-sm tracking-tight">{b.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--color-muted))] mt-1">
                    <Calendar size={10} /> Academic Cycle: {b.start_year}-{b.end_year}
                </div>
            </div>
        </div>,
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <Users size={12} className="text-blue-500" />
                <span className="text-xs font-bold">- Students</span>
            </div>
            <div className="flex items-center gap-2">
                <FolderOpen size={12} className="text-orange-500" />
                <span className="text-xs font-bold">- Groups</span>
            </div>
        </div>,
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <GraduationCap size={12} className="text-purple-500" />
                <span className="text-xs font-bold">- Faculty Assigned</span>
            </div>
            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-purple-500 w-[0%]"></div>
            </div>
        </div>,
        <Badge variant={b.is_active ? 'success' : 'default'}>
            {b.is_active ? 'Active' : 'Archived'}
        </Badge>,
        <div className="flex gap-2">
            <button 
                onClick={() => handleOpenFacultyModal(b)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-[11px] font-black hover:bg-blue-600 hover:text-white transition-all"
            >
                ASSIGN FACULTY <ChevronRight size={14} />
            </button>
            <button 
                onClick={() => handleOpenSettings(b)}
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
            >
                <Settings size={16} />
            </button>
        </div>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Departmental Batches</h1>
                    <p className="text-[rgb(var(--color-muted))]">Define academic cycles and manage batches within your assigned department</p>
                </div>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> Initialise New Batch
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="flex items-center gap-4 bg-blue-50/30 border-blue-100 dark:border-blue-900/20">
                     <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg">
                        <TrendingUp size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Total Batches</p>
                        <h4 className="text-xl font-bold">{batches.length}</h4>
                     </div>
                </Card>
                <Card className="flex items-center gap-4 bg-orange-50/30 border-orange-100 dark:border-orange-900/20">
                     <div className="p-3 bg-orange-600 rounded-xl text-white shadow-lg">
                        <FolderOpen size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Active Cohorts</p>
                        <h4 className="text-xl font-bold">{batches.filter(b => b.is_active).length}</h4>
                     </div>
                </Card>
                <Card className="flex items-center gap-4">
                     <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400">
                        <Library size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Archived Cycles</p>
                        <h4 className="text-xl font-bold">{batches.filter(b => !b.is_active).length}</h4>
                     </div>
                </Card>
            </div>

            <Card>
                <div className="relative w-full md:w-96 mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" size={16} />
                    <Input 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Filter by batch name or academic year..."
                        className="pl-10"
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <Table headers={headers} rows={rows} />
                )}

            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create Academic Batch"
            >
                <div className="space-y-4">
                    <div>
                        <Label>Batch Name</Label>
                        <Input value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} placeholder="e.g. MCA 2025-27 Batch A" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Start Year</Label>
                            <Input type="number" value={newBatch.start_year} onChange={e => setNewBatch({...newBatch, start_year: e.target.value})} placeholder="2025" />
                        </div>
                        <div>
                            <Label>End Year</Label>
                            <Input type="number" value={newBatch.end_year} onChange={e => setNewBatch({...newBatch, end_year: e.target.value})} placeholder="2027" />
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-[rgb(var(--color-border))]">
                        <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">Initial Topic Submission Window</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Window Start</Label>
                                <Input type="date" value={newBatch.topic_submission_start} onChange={e => setNewBatch({...newBatch, topic_submission_start: e.target.value})} />
                            </div>
                            <div>
                                <Label>Window End</Label>
                                <Input type="date" value={newBatch.topic_submission_end} onChange={e => setNewBatch({...newBatch, topic_submission_end: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Project Mode Enforcement</Label>
                            <select 
                                className="w-full h-10 px-3 rounded-lg border border-[rgb(var(--color-border))] bg-white dark:bg-gray-900 text-sm mt-1"
                                value={newBatch.project_type_mode} 
                                onChange={e => setNewBatch({...newBatch, project_type_mode: e.target.value})}
                            >
                                <option value="mixed">Mixed (Allow Individual & Group)</option>
                                <option value="individual">Individual Only</option>
                                <option value="group">Group Projects Only</option>
                            </select>
                        </div>
                        {newBatch.project_type_mode !== 'individual' && (
                        <div>
                            <Label>Maximum Group Size</Label>
                            <Input 
                                type="number" 
                                min="2" 
                                max="10" 
                                className="mt-1"
                                value={newBatch.max_group_size} 
                                onChange={e => setNewBatch({...newBatch, max_group_size: parseInt(e.target.value) || 3})} 
                            />
                        </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1" onClick={handleCreateBatch}>Create Batch</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                title={`Batch Settings: ${editingBatch?.name}`}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div>
                            <p className="text-xs font-bold">Active Status</p>
                            <p className="text-[10px] text-gray-500">Enable or disable this batch</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={editingBatch?.is_active} 
                            onChange={e => setEditingBatch({...editingBatch, is_active: e.target.checked})}
                            className="w-5 h-5 accent-blue-600"
                        />
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">Topic Submission Window</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Window Start</Label>
                                <Input 
                                    type="date" 
                                    value={editingBatch?.topic_submission_start ? new Date(editingBatch.topic_submission_start).toISOString().split('T')[0] : ''} 
                                    onChange={e => setEditingBatch({...editingBatch, topic_submission_start: e.target.value})} 
                                />
                            </div>
                            <div>
                                <Label>Window End</Label>
                                <Input 
                                    type="date" 
                                    value={editingBatch?.topic_submission_end ? new Date(editingBatch.topic_submission_end).toISOString().split('T')[0] : ''} 
                                    onChange={e => setEditingBatch({...editingBatch, topic_submission_end: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Project Mode Enforcement</Label>
                            <select 
                                className="w-full h-10 px-3 rounded-lg border border-[rgb(var(--color-border))] bg-white dark:bg-gray-900 text-sm mt-1"
                                value={editingBatch?.project_type_mode} 
                                onChange={e => setEditingBatch({...editingBatch, project_type_mode: e.target.value})}
                            >
                                <option value="mixed">Mixed (Allow Individual & Group)</option>
                                <option value="individual">Individual Only</option>
                                <option value="group">Group Projects Only</option>
                            </select>
                        </div>
                        {editingBatch?.project_type_mode !== 'individual' && (
                        <div>
                            <Label>Maximum Group Size</Label>
                            <Input 
                                type="number" 
                                min="2" 
                                max="10" 
                                className="mt-1"
                                value={editingBatch?.max_group_size || 3} 
                                onChange={e => setEditingBatch({...editingBatch, max_group_size: parseInt(e.target.value) || 3})} 
                            />
                        </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                        <Button variant="outline" className="flex-1" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1" onClick={handleUpdateBatch}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isFacultyModalOpen}
                onClose={() => setIsFacultyModalOpen(false)}
                title={`Assign Faculty: ${editingBatch?.name}`}
            >
                <div className="space-y-4">
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        <p className="text-[10px] text-gray-500 mb-4 leading-tight">
                            Only faculties designated as 'Active' are available for assignment to a batch. The auto-assign feature will strictly allocate students to the faculty members selected below.
                        </p>
                        {isFetchingFaculty ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : activeFaculty.length === 0 ? (
                            <div className="p-4 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg text-center border border-orange-100">
                                No active faculties found in your department. Go to the Faculty Hub to mark accounts as active.
                            </div>
                        ) : (
                            activeFaculty.map(f => (
                                <div key={f.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 transition-colors cursor-pointer" onClick={() => handleToggleFaculty(f.id)}>
                                    <input 
                                        type="checkbox" 
                                        checked={assignedFacultyIds.includes(f.id)}
                                        onChange={() => {}} // Handled by div onClick
                                        className="w-4 h-4 accent-blue-600 cursor-pointer pointer-events-none"
                                    />
                                    <div className="flex-1 pointer-events-none">
                                        <p className="text-sm font-bold">{f.name}</p>
                                        <p className="text-[10px] text-gray-500">{f.email}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                        <Button variant="outline" className="flex-1" onClick={() => setIsFacultyModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1" onClick={handleSaveFaculty}>Save Assignments</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BatchManagement;
