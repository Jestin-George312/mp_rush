import React, { useState, useMemo } from 'react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Select from '../../components/common/UI/Select';
import Label from '../../components/common/UI/Label';
import Input from '../../components/common/UI/Input';
import {
    Upload, Search, FileSpreadsheet, CheckCircle,
    ChevronRight, UserPlus, Users, Mail,
    GraduationCap, Trash2, Plus
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Faculty {
    id: string;
    name: string;
    department: string;
    specialization: string;
    email: string;
    currentLoad: number;
    maxLoad: number;
}

interface Batch {
    id: string;
    batchName: string;
    program: string;
    year: string;
    facultyIds: string[]; // Updated to support multiple faculty
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const FACULTIES: Faculty[] = [
    { id: 'f1', name: 'Dr. Sarah Johnson', department: 'Computer Science', specialization: 'AI & ML', email: 'sarah.j@college.edu', currentLoad: 1, maxLoad: 5 },
    { id: 'f2', name: 'Prof. Michael Chen', department: 'Information Technology', specialization: 'Web Technologies', email: 'michael.c@college.edu', currentLoad: 2, maxLoad: 5 },
    { id: 'f3', name: 'Dr. Emily Williams', department: 'Computer Science', specialization: 'Data Science', email: 'emily.w@college.edu', currentLoad: 0, maxLoad: 5 },
    { id: 'f4', name: 'Prof. David Brown', department: 'Information Technology', specialization: 'Cybersecurity', email: 'david.b@college.edu', currentLoad: 1, maxLoad: 5 },
    { id: 'f5', name: 'Dr. Lisa Anderson', department: 'Computer Science', specialization: 'Cloud Computing', email: 'lisa.a@college.edu', currentLoad: 0, maxLoad: 5 },
    { id: 'f6', name: 'Prof. James Wilson', department: 'Information Technology', specialization: 'Software Engineering', email: 'james.w@college.edu', currentLoad: 2, maxLoad: 5 },
];

const INITIAL_BATCHES: Batch[] = [
    { id: 'b1', batchName: 'MCA 2024-26 Batch A', program: 'MCA', year: '2024-26', facultyIds: ['f1', 'f3'] },
    { id: 'b2', batchName: 'MCA 2024-26 Batch B', program: 'MCA', year: '2024-26', facultyIds: ['f2'] },
    { id: 'b3', batchName: 'MCA 2023-25 Batch A', program: 'MCA', year: '2023-25', facultyIds: [] },
    { id: 'b4', batchName: 'MCA 2023-25 Batch B', program: 'MCA', year: '2023-25', facultyIds: ['f4', 'f5'] },
    { id: 'b5', batchName: 'MSc CS 2024-26 Batch A', program: 'MSc CS', year: '2024-26', facultyIds: [] },
    { id: 'b6', batchName: 'MSc CS 2024-26 Batch B', program: 'MSc CS', year: '2024-26', facultyIds: ['f2', 'f6'] },
];

// ─── Program colours ──────────────────────────────────────────────────────────
const PROGRAM_COLORS: Record<string, string> = {
    'MCA':    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'MSc CS': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
const programColor = (p: string) =>
    PROGRAM_COLORS[p] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

const FacultyAllocation: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
    const [faculties, setFaculties] = useState<Faculty[]>(FACULTIES);

    // Filters
    const [search, setSearch] = useState('');
    const [filterProgram, setFilterProgram] = useState('All');

    // UI State
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [isAddFacultyModalOpen, setIsAddFacultyModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Manual Entry State
    const [manualName, setManualName] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'excel' | 'manual'>('excel');

    // Excel Import State
    const [importedRows, setImportedRows] = useState<{ name: string; email: string }[]>([]);
    const [importFileName, setImportFileName] = useState('');

    // ── Derived ────────────────────────────────────────────────────────────────
    const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId) ?? null, [batches, selectedBatchId]);
    
    const assignedFaculties = useMemo(() => {
        if (!selectedBatch) return [];
        return faculties.filter(f => selectedBatch.facultyIds.includes(f.id));
    }, [selectedBatch, faculties]);

    const filteredBatches = useMemo(() => {
        return batches.filter(b => {
            const matchSearch = b.batchName.toLowerCase().includes(search.toLowerCase());
            const matchProgram = filterProgram === 'All' || b.program === filterProgram;
            return matchSearch && matchProgram;
        });
    }, [batches, search, filterProgram]);

    const programs = ['All', ...Array.from(new Set(batches.map(b => b.program)))];

    // ── Faculty Creation ──────────────────────────────────────────────────────
    const handleAddManualFaculty = () => {
        if (!manualName || !manualEmail) return;
        
        const exists = faculties.some(f => f.email.toLowerCase() === manualEmail.toLowerCase());
        if (exists) {
            alert('A faculty with this email already exists.');
            return;
        }

        const newFaculty: Faculty = {
            id: `f-man-${Date.now()}`,
            name: manualName,
            email: manualEmail,
            department: 'Comp. Sci',
            specialization: 'Faculty',
            currentLoad: 0,
            maxLoad: 5,
        };

        setFaculties(prev => [...prev, newFaculty]);
        setManualName('');
        setManualEmail('');
        setIsAddFacultyModalOpen(false);
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
                return { name: parts[0] || '', email: parts[1] || '' };
            }).filter(row => row.name && row.email);
            setImportedRows(parsed);
        };
        reader.readAsText(file);
    };

    const handleImportConfirm = () => {
        const newFaculties: Faculty[] = [];
        importedRows.forEach(({ name, email }) => {
            const exists = faculties.some(f => f.email.toLowerCase() === email.toLowerCase());
            if (!exists) {
                newFaculties.push({
                    id: `f-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name, email,
                    department: 'Comp. Sci',
                    specialization: 'Faculty',
                    currentLoad: 0,
                    maxLoad: 5,
                });
            }
        });
        setFaculties(prev => [...prev, ...newFaculties]);
        setIsAddFacultyModalOpen(false);
        setImportedRows([]);
        setImportFileName('');
    };

    // ── Allocation handlers ────────────────────────────────────────────────────
    const toggleFacultyAssignment = (facultyId: string) => {
        if (!selectedBatchId) return;

        setBatches(prev => prev.map(b => {
            if (b.id !== selectedBatchId) return b;
            
            const alreadyAssigned = b.facultyIds.includes(facultyId);
            const newIds = alreadyAssigned 
                ? b.facultyIds.filter(id => id !== facultyId)
                : [...b.facultyIds, facultyId];
            
            return { ...b, facultyIds: newIds };
        }));

        setFaculties(prev => prev.map(f => {
            if (f.id !== facultyId) return f;
            const alreadyAssigned = selectedBatch?.facultyIds.includes(facultyId);
            return { ...f, currentLoad: alreadyAssigned ? Math.max(0, f.currentLoad - 1) : f.currentLoad + 1 };
        }));
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Faculty Management</h1>
                    <p className="text-[rgb(var(--color-muted))] mt-1">
                        Manage academic batches and faculty allocations
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setIsAddFacultyModalOpen(true)}>
                        <Plus size={16} className="mr-2" />
                        Add New Faculty
                    </Button>
                </div>
            </div>

            <div className="flex gap-5 items-start">
                {/* ── Batch List Panel ────────────────────────────────────────── */}
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
                                const count = batch.facultyIds.length;

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
                                                    ${count > 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
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
                                                <Badge variant={count > 0 ? 'info' : 'secondary'}>
                                                    {count} {count === 1 ? 'Faculty' : 'Faculties'}
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

                {/* ── Batch Detail Panel ──────────────────────────────────────── */}
                {selectedBatch && (
                    <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="sticky top-6">
                            <div className="flex items-start justify-between mb-8 border-b border-[rgb(var(--color-border))] pb-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedBatch.batchName}</h2>
                                        <div className="flex items-center gap-3 mt-1.5 text-sm text-[rgb(var(--color-muted))]">
                                            <span>{selectedBatch.program}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>{selectedBatch.year} Academic Year</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                                    <UserPlus size={16} className="mr-2" />
                                    Manage Faculty
                                </Button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-muted))] mb-4">
                                        Assigned Teaching Faculty
                                    </h3>
                                    {assignedFaculties.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {assignedFaculties.map(faculty => (
                                                <div key={faculty.id} className="group p-4 rounded-xl border border-[rgb(var(--color-border))] bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                                                {faculty.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold">{faculty.name}</div>
                                                                <div className="text-[10px] text-[rgb(var(--color-muted))]">{faculty.email}</div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => toggleFacultyAssignment(faculty.id)}
                                                            className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[rgb(var(--color-border))] rounded-2xl">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                                <Users size={20} />
                                            </div>
                                            <p className="text-sm text-[rgb(var(--color-muted))] font-medium">No faculty allocated yet</p>
                                            <button 
                                                onClick={() => setIsAssignModalOpen(true)}
                                                className="text-xs text-blue-600 hover:underline mt-2"
                                            >
                                                Assign now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* ── Add Faculty Modal (Excel or Manual) ───────────────────────── */}
            <Modal
                isOpen={isAddFacultyModalOpen}
                onClose={() => setIsAddFacultyModalOpen(false)}
                title="Register New Faculty"
            >
                <div className="space-y-6">
                    {/* Tabs */}
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
                            <Mail size={14} />
                            Manual Entry
                        </button>
                    </div>

                    {activeTab === 'excel' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-[11px] leading-relaxed">
                                <p className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-1">
                                    <Upload size={14} />
                                    CSV Format Guide
                                </p>
                                <p className="text-blue-600/80 dark:text-blue-400/80">
                                    Include headers: <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Name</code> and <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Email</code>. System will ignore duplicates.
                                </p>
                            </div>
                            
                            <div>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                        <p className="mb-2 text-sm text-[rgb(var(--color-muted))] font-medium">
                                            {importFileName || "Click to upload Excel/CSV"}
                                        </p>
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            {importedRows.length > 0 && (
                                <div className="space-y-3">
                                    <div className="text-xs font-semibold flex items-center justify-between">
                                        <span>Preview: {importedRows.length} Faculty found</span>
                                        <button onClick={() => {setImportedRows([]); setImportFileName('');}} className="text-red-500">Clear</button>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border border-[rgb(var(--color-border))] rounded-xl divide-y">
                                        {importedRows.map((row, i) => (
                                            <div key={i} className="px-3 py-2 text-[10px] flex justify-between items-center bg-white dark:bg-gray-800">
                                                <div>
                                                    <div className="font-bold">{row.name}</div>
                                                    <div className="text-gray-400">{row.email}</div>
                                                </div>
                                                <CheckCircle size={14} className="text-green-500" />
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="primary" className="w-full" onClick={handleImportConfirm}>
                                        Import Faculty Members
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <Label>Full Name</Label>
                                <Input 
                                    placeholder="e.g. Dr. John Doe"
                                    value={manualName}
                                    onChange={e => setManualName(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Email Address</Label>
                                <Input 
                                    type="email"
                                    placeholder="john.doe@university.edu"
                                    value={manualEmail}
                                    onChange={e => setManualEmail(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="primary" 
                                className="w-full mt-2" 
                                onClick={handleAddManualFaculty}
                                disabled={!manualName || !manualEmail}
                            >
                                Register Faculty
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* ── Assign Faculty Modal ───────────────────────────────────────── */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title={`Manage Faculty for ${selectedBatch?.batchName}`}
            >
                <div className="space-y-4">
                    <div className="relative mb-4">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input placeholder="Filter faculty list..." className="pl-9 text-xs" />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                        {faculties.map(faculty => {
                            const isAssigned = selectedBatch?.facultyIds.includes(faculty.id);
                            
                            return (
                                <div 
                                    key={faculty.id} 
                                    onClick={() => toggleFacultyAssignment(faculty.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                                        ${isAssigned 
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                                            : 'border-[rgb(var(--color-border))] hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                                            ${isAssigned ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                            {faculty.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold">{faculty.name}</div>
                                            <div className="text-[9px] text-[rgb(var(--color-muted))]">{faculty.department}</div>
                                        </div>
                                    </div>
                                    {isAssigned ? (
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                            <CheckCircle size={12} />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border border-gray-300" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="pt-2 border-t border-[rgb(var(--color-border))]">
                        <Button variant="primary" className="w-full" onClick={() => setIsAssignModalOpen(false)}>
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FacultyAllocation;
