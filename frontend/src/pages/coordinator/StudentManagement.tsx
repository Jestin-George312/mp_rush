import React, { useState, useRef } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Select from '../../components/common/UI/Select';
import { 
    Search, UserPlus, Upload,
    AtSign, Hash, Layers, CheckCircle, 
    AlertTriangle, FileSpreadsheet
} from 'lucide-react';

const StudentManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [batchFilter, setBatchFilter] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Realistic Mock Data
    const students = [
        { id: 's1', name: 'John Doe', email: 'john.d@stud.edu', roll: 'MCA2401', batch: 'MCA 2024-26 A', guide: 'Dr. Sarah Johnson', group: 'Team Alpha', status: 'Assigned' },
        { id: 's2', name: 'Jane Smith', email: 'jane.s@stud.edu', roll: 'MCA2402', batch: 'MCA 2024-26 A', guide: 'Dr. Sarah Johnson', group: 'Team Alpha', status: 'Assigned' },
        { id: 's3', name: 'Alex Rivera', email: 'alex.r@stud.edu', roll: 'MCA2403', batch: 'MCA 2024-26 A', guide: null, group: null, status: 'Unassigned' },
        { id: 's4', name: 'Michael Chen', email: 'm.chen@stud.edu', roll: 'MSC2305', batch: 'MSc CS 2023-25', guide: 'Prof. Michael Chen', group: 'CyberShield', status: 'Assigned' },
        { id: 's5', name: 'Sarah Wilson', email: 's.wilson@stud.edu', roll: 'MCA2404', batch: 'MCA 2024-26 B', guide: null, group: null, status: 'Pending Approval' },
    ];

    const filteredStudents = students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                           s.roll.toLowerCase().includes(search.toLowerCase());
        const matchBatch = batchFilter === 'All' || s.batch === batchFilter;
        return matchSearch && matchBatch;
    });

    const headers = [
        'Student Profile', 
        'Academic Info', 
        'Guide & Group', 
        'System Status', 
        'Actions'
    ];

    const rows = filteredStudents.map(s => [
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shadow-sm
                ${s.status === 'Assigned' ? 'bg-green-100 text-green-700' : s.status === 'Unassigned' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                {s.name.charAt(0)}
            </div>
            <div>
                <p className="font-bold text-sm leading-tight">{s.name}</p>
                <div className="flex items-center gap-1 text-[10px] text-[rgb(var(--color-muted))] mt-0.5">
                    <AtSign size={10} /> {s.email}
                </div>
            </div>
        </div>,
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--color-primary))]">
                 <Hash size={12} className="text-gray-400" /> {s.roll}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--color-muted))]">
                 <Layers size={11} className="text-gray-400" /> {s.batch}
            </div>
        </div>,
        <div className="flex flex-col gap-0.5 min-w-[120px]">
            {s.guide ? (
                <>
                    <p className="text-xs font-bold truncate">{s.guide}</p>
                    <p className="text-[10px] text-blue-500 font-medium italic">Group: {s.group}</p>
                </>
            ) : (
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                    <AlertTriangle size={10} /> Not Allocated
                </div>
            )}
        </div>,
        <Badge variant={s.status === 'Assigned' ? 'success' : s.status === 'Unassigned' ? 'danger' : 'warning'}>
            {s.status}
        </Badge>,
        <div className="flex items-center gap-2">
            <button className="px-2.5 py-1.5 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded transition-colors">Edit</button>
            <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
            <button className="px-2.5 py-1.5 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors">Kick</button>
        </div>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Departmental Student Roster</h1>
                    <p className="text-[rgb(var(--color-muted))]">Enrol students and manage their project lifecycle status within your department</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => {setIsAddModalOpen(true); setActiveTab('bulk');}}>
                        <Upload size={18} className="mr-2" /> Bulk Import
                    </Button>
                    <Button variant="primary" onClick={() => {setIsAddModalOpen(true); setActiveTab('manual');}}>
                        <UserPlus size={18} className="mr-2" /> Register Student
                    </Button>
                </div>
            </div>

            {/* Quick Filter Bar */}
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" size={16} />
                        <Input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or roll number..."
                            className="pl-10 h-10 shadow-none border-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filter:</span>
                             <Select 
                                value={batchFilter}
                                onChange={e => setBatchFilter(e.target.value)}
                                className="w-48 h-10 border-gray-200"
                             >
                                <option value="All">All Batches</option>
                                <option>MCA 2024-26 A</option>
                                <option>MCA 2024-26 B</option>
                                <option>MSc CS 2023-25</option>
                             </Select>
                        </div>
                        <div className="w-px h-6 bg-gray-200 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                           <Badge variant="danger">{students.filter(s => !s.guide).length} Unassigned</Badge>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden border-none shadow-xl shadow-gray-100 dark:shadow-none">
                <Table headers={headers} rows={rows} />
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={activeTab === 'manual' ? 'Register New Student' : 'Bulk Import Students'}
            >
                <div>
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
                        <button 
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <UserPlus size={14} /> Manual Entry
                        </button>
                        <button 
                            onClick={() => setActiveTab('bulk')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'bulk' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <FileSpreadsheet size={14} /> Spreadsheet Upload
                        </button>
                    </div>

                    {activeTab === 'manual' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Full Name</Label>
                                    <Input placeholder="e.g. Alice Cooper" />
                                </div>
                                <div>
                                    <Label>Roll Number</Label>
                                    <Input placeholder="MCA2501" />
                                </div>
                            </div>
                            <div>
                                <Label>Official Email</Label>
                                <Input type="email" placeholder="alice.c@student.univ.edu" />
                            </div>
                            <div>
                                <Label>Assigned Batch</Label>
                                <Select>
                                    <option>MCA 2024-26 Batch A</option>
                                    <option>MCA 2024-26 Batch B</option>
                                </Select>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                                <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button variant="primary" className="flex-1">Add Student</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600">
                                    <Upload size={32} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Drop your student list here</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">Supports .csv, .xlsx</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".csv,.xlsx" 
                                    onChange={(e) => console.log('File selected:', e.target.files?.[0])}
                                />
                                <Button variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                                    Choose File
                                </Button>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest flex items-center gap-1">
                                    <CheckCircle size={10} /> CSV Header Format
                                </p>
                                <p className="text-[11px] font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded inline-block">
                                    fullName, email, rollNumber, batchId
                                </p>
                            </div>
                            <Button variant="primary" className="w-full" disabled>Start Processing</Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default StudentManagement;
