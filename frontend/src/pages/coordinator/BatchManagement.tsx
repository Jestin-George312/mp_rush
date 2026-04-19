import React, { useState } from 'react';
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
    Calendar, TrendingUp, Settings
} from 'lucide-react';

const BatchManagement: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const batches = [
        { id: 'b1', name: 'MCA 2024-26 Batch A', year: '2024-2026', department: 'Computer Science', students: 60, faculty: 12, projects: 20, status: 'Active' },
        { id: 'b2', name: 'MCA 2024-26 Batch B', year: '2024-2026', department: 'Computer Science', students: 58, faculty: 10, projects: 19, status: 'Active' },
        { id: 'b3', name: 'MSc CS 2023-25', year: '2023-2025', department: 'Computer Science', students: 45, faculty: 8, projects: 15, status: 'Active' },
        { id: 'b4', name: 'MCA 2022-24', year: '2022-2024', department: 'Computer Science', students: 62, faculty: 15, projects: 31, status: 'Archived' },
    ];

    const filteredBatches = batches.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase()) || 
        b.year.includes(search)
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
                ${b.status === 'Active' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-gray-100 text-gray-400'}`}>
                <Library size={24} />
            </div>
            <div>
                <p className="font-bold text-sm tracking-tight">{b.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--color-muted))] mt-1">
                    <Calendar size={10} /> Academic Cycle: {b.year}
                </div>
            </div>
        </div>,
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <Users size={12} className="text-blue-500" />
                <span className="text-xs font-bold">{b.students} Students</span>
            </div>
            <div className="flex items-center gap-2">
                <FolderOpen size={12} className="text-orange-500" />
                <span className="text-xs font-bold">{b.projects} Groups</span>
            </div>
        </div>,
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <GraduationCap size={12} className="text-purple-500" />
                <span className="text-xs font-bold">{b.faculty} Faculty Assigned</span>
            </div>
            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-purple-500 w-[70%]"></div>
            </div>
        </div>,
        <Badge variant={b.status === 'Active' ? 'success' : 'default'}>
            {b.status}
        </Badge>,
        <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-[11px] font-black hover:bg-blue-600 hover:text-white transition-all">
                VIEW DETAILS <ChevronRight size={14} />
            </button>
            <button className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-blue-600 transition-colors">
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
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Cohorts</p>
                        <h4 className="text-xl font-bold">06</h4>
                     </div>
                </Card>
                <Card className="flex items-center gap-4 bg-orange-50/30 border-orange-100 dark:border-orange-900/20">
                     <div className="p-3 bg-orange-600 rounded-xl text-white shadow-lg">
                        <FolderOpen size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Ongoing Projects</p>
                        <h4 className="text-xl font-bold">142</h4>
                     </div>
                </Card>
                <Card className="flex items-center gap-4">
                     <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400">
                        <Library size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Archived Cycles</p>
                        <h4 className="text-xl font-bold">12</h4>
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

                <Table headers={headers} rows={rows} />
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create Academic Batch"
            >
                <div className="space-y-4">
                    <div>
                        <Label>Batch Name</Label>
                        <Input placeholder="e.g. MCA 2025-27 Batch A" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Start Year</Label>
                            <Input type="number" placeholder="2025" />
                        </div>
                        <div>
                            <Label>End Year</Label>
                            <Input type="number" placeholder="2027" />
                        </div>
                    </div>
                    <div>
                        <Label>Department</Label>
                        <Input value="Computer Science" disabled className="bg-gray-100" />
                        <p className="text-[10px] text-gray-500 mt-1 italic">Batches are automatically associated with your managed department.</p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1">Create Batch</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BatchManagement;
