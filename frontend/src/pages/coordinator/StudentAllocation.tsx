import React, { useState, useMemo } from 'react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Select from '../../components/common/UI/Select';
import Label from '../../components/common/UI/Label';
import Input from '../../components/common/UI/Input';
import {
    Upload, Search, FileSpreadsheet,
    ChevronRight, UserPlus, Users, GraduationCap,
    Trash2, Plus, UserCircle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
    id: string;
    rollNo: string;
    name: string;
    email: string;
    program: string;
    batchId: string;
    groupName: string | null;
}

interface Batch {
    id: string;
    batchName: string;
    program: string;
    year: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const BATCHES: Batch[] = [
    { id: 'b1', batchName: 'MCA 2024-26 Batch A', program: 'MCA', year: '2024-26' },
    { id: 'b2', batchName: 'MCA 2024-26 Batch B', program: 'MCA', year: '2024-26' },
    { id: 'b3', batchName: 'MCA 2023-25 Batch A', program: 'MCA', year: '2023-25' },
    { id: 'b4', batchName: 'MCA 2023-25 Batch B', program: 'MCA', year: '2023-25' },
    { id: 'b5', batchName: 'MSc CS 2024-26 Batch A', program: 'MSc CS', year: '2024-26' },
    { id: 'b6', batchName: 'MSc CS 2024-26 Batch B', program: 'MSc CS', year: '2024-26' },
];

const INITIAL_STUDENTS: Student[] = [
    { id: 's1', rollNo: 'MCA2401', name: 'John Doe', email: 'john@student.edu', program: 'MCA', batchId: 'b1', groupName: 'Team Alpha' },
    { id: 's2', rollNo: 'MCA2402', name: 'Jane Smith', email: 'jane@student.edu', program: 'MCA', batchId: 'b1', groupName: 'Team Alpha' },
    { id: 's3', rollNo: 'MCA2403', name: 'Alex Johnson', email: 'alex@student.edu', program: 'MCA', batchId: 'b1', groupName: null },
    { id: 's4', rollNo: 'MCA2404', name: 'Michael Brown', email: 'mike@student.edu', program: 'MCA', batchId: 'b2', groupName: 'Team Beta' },
    { id: 's5', rollNo: 'MSC2401', name: 'Sarah Wilson', email: 'sarah@student.edu', program: 'MSc CS', batchId: 'b5', groupName: null },
];

// ─── Program colours ──────────────────────────────────────────────────────────
const PROGRAM_COLORS: Record<string, string> = {
    'MCA':    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'MSc CS': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
const programColor = (p: string) =>
    PROGRAM_COLORS[p] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

const StudentAllocation: React.FC = () => {
    const [batches] = useState<Batch[]>(BATCHES);
    const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);

    // Filter Logic
    const [search, setSearch] = useState('');
    const [filterProgram, setFilterProgram] = useState('All');

    // UI state
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'excel' | 'manual'>('excel');

    // Manual Form
    const [manualName, setManualName] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [manualRoll, setManualRoll] = useState('');

    // Excel Import
    const [importedRows, setImportedRows] = useState<{ name: string; email: string; roll: string }[]>([]);
    const [importFileName, setImportFileName] = useState('');

    // ── Derived ────────────────────────────────────────────────────────────────
    const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId) ?? null, [selectedBatchId]);
    
    const studentsInSelectedBatch = useMemo(() => {
        if (!selectedBatchId) return [];
        return students.filter(s => s.batchId === selectedBatchId);
    }, [students, selectedBatchId]);

    const filteredBatches = useMemo(() => {
        return batches.filter(b => {
            const matchSearch = b.batchName.toLowerCase().includes(search.toLowerCase());
            const matchProgram = filterProgram === 'All' || b.program === filterProgram;
            return matchSearch && matchProgram;
        });
    }, [search, filterProgram]);

    const programs = ['All', ...Array.from(new Set(batches.map(b => b.program)))];

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAddManualStudent = () => {
        if (!manualName || !manualEmail || !selectedBatchId) return;

        const newStudent: Student = {
            id: `s-${Date.now()}`,
            name: manualName,
            email: manualEmail,
            rollNo: manualRoll || `STU-${Date.now().toString().slice(-4)}`,
            program: selectedBatch?.program || 'MCA',
            batchId: selectedBatchId,
            groupName: null,
        };

        setStudents(prev => [...prev, newStudent]);
        setManualName('');
        setManualEmail('');
        setManualRoll('');
        setIsAddModalOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.split('\n').filter(Boolean);
            const parsed = lines.slice(1).map(line => {
                const parts = line.split(',').map(s => s.trim());
                return { name: parts[0] || '', email: parts[1] || '', roll: parts[2] || '' };
            }).filter(row => row.name && row.email);
            setImportedRows(parsed);
        };
        reader.readAsText(file);
    };

    const handleImportConfirm = () => {
        if (!selectedBatchId) return;
        const newStudents: Student[] = importedRows.map(row => ({
            id: `s-imp-${Math.random().toString(36).slice(2, 7)}`,
            name: row.name,
            email: row.email,
            rollNo: row.roll || `STU-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
            program: selectedBatch?.program || 'MCA',
            batchId: selectedBatchId,
            groupName: null,
        }));
        
        setStudents(prev => [...prev, ...newStudents]);
        setIsAddModalOpen(false);
        setImportedRows([]);
        setImportFileName('');
    };

    const handleRemoveStudent = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Student Allocation</h1>
                    <p className="text-[rgb(var(--color-muted))] mt-1">Manage academic batches and allocate students</p>
                </div>
            </div>

            <div className="flex gap-5 items-start">
                {/* ── Batch List ───────────────────────────────────────────── */}
                <div className={`flex-1 min-w-0 transition-all duration-300 ${selectedBatch ? 'lg:max-w-md' : 'w-full'}`}>
                    <Card>
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search batches..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                                />
                            </div>
                            <Select
                                value={filterProgram}
                                onChange={e => setFilterProgram(e.target.value)}
                                className="sm:w-40"
                            >
                                {programs.map(p => (
                                    <option key={p} value={p}>{p === 'All' ? 'All Programs' : p}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="space-y-3">
                            {filteredBatches.map(batch => {
                                const isSelected = batch.id === selectedBatchId;
                                const studentCount = students.filter(s => s.batchId === batch.id).length;

                                return (
                                    <button
                                        key={batch.id}
                                        onClick={() => setSelectedBatchId(isSelected ? null : batch.id)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200
                                            ${isSelected
                                                ? 'border-[rgb(var(--color-primary))] bg-blue-50/50 dark:bg-blue-900/10 shadow-sm'
                                                : 'border-[rgb(var(--color-border))] bg-white dark:bg-gray-800 hover:border-[rgb(var(--color-primary))]/40 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center 
                                                    ${studentCount > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">{batch.batchName}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${programColor(batch.program)}`}>
                                                            {batch.program}
                                                        </span>
                                                        <span className="text-[10px] text-[rgb(var(--color-muted))]">{batch.year}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant={studentCount > 0 ? 'default' : 'secondary'}>
                                                    {studentCount} Students
                                                </Badge>
                                                <ChevronRight size={16} className={`text-gray-300 transition-transform ${isSelected ? 'rotate-90 text-blue-500' : ''}`} />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* ── Detail Panel ─────────────────────────────────────────── */}
                {selectedBatch && (
                    <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="sticky top-6">
                            <div className="flex items-start justify-between mb-8 border-b border-[rgb(var(--color-border))] pb-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-600">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedBatch.batchName}</h2>
                                        <p className="text-sm text-[rgb(var(--color-muted))] mt-1">{selectedBatch.program} · {selectedBatch.year}</p>
                                    </div>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                                    <Plus size={16} className="mr-2" />
                                    Add Student
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-muted))] mb-4">
                                    Full List of Students
                                </h3>
                                
                                {studentsInSelectedBatch.length > 0 ? (
                                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2">
                                        {studentsInSelectedBatch.map(student => (
                                            <div key={student.id} className="group p-4 rounded-xl border border-[rgb(var(--color-border))] bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm">{student.name}</div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] font-mono text-[rgb(var(--color-muted))]">{student.rollNo}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                <span className="text-[10px] text-[rgb(var(--color-muted))]">{student.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {student.groupName ? (
                                                            <Badge variant="success">{student.groupName}</Badge>
                                                        ) : (
                                                            <Badge variant="warning">No Group</Badge>
                                                        )}
                                                        <button 
                                                            onClick={() => handleRemoveStudent(student.id)}
                                                            className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 border-2 border-dashed border-[rgb(var(--color-border))] rounded-2xl">
                                        <UserCircle size={40} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm text-[rgb(var(--color-muted))]">No students added to this batch yet.</p>
                                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                                            Get Started
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* ── Add Student Modal ────────────────────────────────────────── */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Add Student to ${selectedBatch?.batchName}`}
            >
                <div className="space-y-6">
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                            onClick={() => setActiveTab('excel')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'excel' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <FileSpreadsheet size={14} />
                            Excel Import
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <UserPlus size={14} />
                            Manual Entry
                        </button>
                    </div>

                    {activeTab === 'excel' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl text-[11px] leading-relaxed">
                                <p className="font-bold text-orange-700 dark:text-orange-300 flex items-center gap-2 mb-1">
                                    <Upload size={14} />
                                    Import Instructions
                                </p>
                                <p className="text-orange-600/80 dark:text-orange-400/80">
                                    Headers: <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Name</code>, <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Email</code>, <code className="bg-white/50 dark:bg-black/20 px-1 rounded">RollNo</code>.
                                </p>
                            </div>
                            
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-[rgb(var(--color-muted))] font-medium">
                                        {importFileName || "Upload CSV student list"}
                                    </p>
                                </div>
                                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                            </label>

                            {importedRows.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold">{importedRows.length} Students Ready</span>
                                        <button onClick={() => setImportedRows([])} className="text-red-500">Reset</button>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border border-[rgb(var(--color-border))] rounded-xl">
                                        {importedRows.map((row, i) => (
                                            <div key={i} className="p-3 border-b border-[rgb(var(--color-border))] last:border-0 flex justify-between text-[10px]">
                                                <span>{row.name} ({row.roll})</span>
                                                <span className="text-gray-400">{row.email}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="primary" className="w-full" onClick={handleImportConfirm}>
                                        Confirm Bulk Add
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <Label>Full Name</Label>
                                <Input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Jane Smith" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Roll Number</Label>
                                    <Input value={manualRoll} onChange={e => setManualRoll(e.target.value)} placeholder="MCA2401" />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="jane@student.edu" />
                                </div>
                            </div>
                            <Button variant="primary" className="w-full mt-4" onClick={handleAddManualStudent} disabled={!manualName || !manualEmail}>
                                Add Student to Batch
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default StudentAllocation;
