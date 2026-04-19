import React, { useState, useMemo } from 'react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import {
    Calendar, FileSpreadsheet, Plus, Trash2, Clock, Info,
    Upload, Edit3, Target
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlobalDeadline {
    id: string;
    name: string;
    description: string;
    date: string;
    maxScore: number;
    batchId: string;
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
];

const INITIAL_DEADLINES: GlobalDeadline[] = [
    {
        id: 'd1',
        name: 'Topic Submission',
        description: 'Submission of project title and domain for approval.',
        date: '2024-06-15',
        maxScore: 10,
        batchId: 'b1'
    },
    {
        id: 'd2',
        name: 'Abstract Submission',
        description: 'Detailing project objectives and methodology.',
        date: '2024-07-20',
        maxScore: 20,
        batchId: 'b1'
    },
    {
        id: 'd3',
        name: 'Mid-Review',
        description: 'First phase implementation review.',
        date: '2024-09-10',
        maxScore: 30,
        batchId: 'b1'
    }
];

// ─── Component ────────────────────────────────────────────────────────────────
const RubricBuilder: React.FC = () => {
    const [batches] = useState<Batch[]>(BATCHES);
    const [deadlines, setDeadlines] = useState<GlobalDeadline[]>(INITIAL_DEADLINES);

    // Context & UI State
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'excel' | 'manual'>('excel');

    // Manual Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        maxScore: 0
    });

    // Excel Import State
    const [importedRows, setImportedRows] = useState<{ name: string; desc: string; date: string; score: number }[]>([]);
    const [importFileName, setImportFileName] = useState('');

    // ── Derived ────────────────────────────────────────────────────────────────
    const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId) ?? null, [selectedBatchId]);
    
    const batchDeadlines = useMemo(() => {
        return deadlines
            .filter(d => d.batchId === selectedBatchId)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [deadlines, selectedBatchId]);

    const totalAvailableScore = useMemo(() => {
        return batchDeadlines.reduce((sum, d) => sum + d.maxScore, 0);
    }, [batchDeadlines]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAddManual = () => {
        if (!formData.name || !formData.date || !selectedBatchId) return;

        const newDeadline: GlobalDeadline = {
            id: `d-${Date.now()}`,
            ...formData,
            batchId: selectedBatchId
        };

        setDeadlines(prev => [...prev, newDeadline]);
        setFormData({ name: '', description: '', date: '', maxScore: 0 });
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
                const p = line.split(',').map(s => s.trim());
                return { 
                    name: p[0] || '', 
                    desc: p[1] || '', 
                    date: p[2] || '', 
                    score: parseInt(p[3]) || 0 
                };
            }).filter(row => row.name && row.date);
            setImportedRows(parsed);
        };
        reader.readAsText(file);
    };

    const handleImportConfirm = () => {
        if (!selectedBatchId) return;
        const newDls: GlobalDeadline[] = importedRows.map(row => ({
            id: `d-imp-${Math.random().toString(36).slice(2, 7)}`,
            name: row.name,
            description: row.desc,
            date: row.date,
            maxScore: row.score,
            batchId: selectedBatchId
        }));
        
        setDeadlines(prev => [...prev, ...newDls]);
        setIsAddModalOpen(false);
        setImportedRows([]);
        setImportFileName('');
    };

    const handleDelete = (id: string) => {
        setDeadlines(prev => prev.filter(d => d.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Global Timeline</h1>
                    <p className="text-[rgb(var(--color-muted))] mt-1">Define deadlines and evaluation rubrics for each batch</p>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                {/* ── Batch Selection List ───────────────────────────────────── */}
                <div className={`flex-shrink-0 transition-all duration-300 ${selectedBatch ? 'w-80' : 'w-full'}`}>
                    <Card>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted))] mb-4 px-1">Academic Batches</h3>
                        <div className="space-y-2">
                            {batches.map(batch => {
                                const isSelected = batch.id === selectedBatchId;
                                const deadlineCount = deadlines.filter(d => d.batchId === batch.id).length;
                                return (
                                    <button
                                        key={batch.id}
                                        onClick={() => setSelectedBatchId(isSelected ? null : batch.id)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group
                                            ${isSelected 
                                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' 
                                                : 'border-[rgb(var(--color-border))] bg-white dark:bg-gray-800 hover:border-blue-400 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                                                    ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">{batch.batchName}</div>
                                                    <div className="text-[10px] text-[rgb(var(--color-muted))] mt-0.5">{batch.program} · {batch.year}</div>
                                                </div>
                                            </div>
                                            <Badge variant={deadlineCount > 0 ? 'info' : 'secondary'}>{deadlineCount}</Badge>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* ── Deadline Management Panel ──────────────────────────────── */}
                {selectedBatch && (
                    <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                        <Card className="sticky top-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgb(var(--color-border))] pb-6 mb-6">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <Clock size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedBatch.batchName}</h2>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--color-muted))]">
                                                <Target size={14} className="text-blue-500" />
                                                <span className="font-bold text-[rgb(var(--color-primary))]">{totalAvailableScore}</span> Total Marks
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span className="text-xs text-[rgb(var(--color-muted))] font-medium">{batchDeadlines.length} Milestones</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
                                    <Plus size={18} className="mr-2" />
                                    Add New Deadline
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {batchDeadlines.length > 0 ? (
                                    <div className="space-y-3">
                                        {batchDeadlines.map((dl, idx) => (
                                            <div key={dl.id} className="group flex items-center gap-5 p-4 rounded-2xl border border-[rgb(var(--color-border))] bg-gray-50/50 dark:bg-gray-800/20 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                                                <div className="flex flex-col items-center justify-center w-12 text-center border-r border-[rgb(var(--color-border))] pr-4">
                                                    <span className="text-[10px] font-bold text-[rgb(var(--color-muted))] uppercase">M-{idx + 1}</span>
                                                    <span className="text-sm font-black text-blue-600">{dl.maxScore}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-base text-[rgb(var(--color-primary))] truncate">{dl.name}</h4>
                                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md flex items-center gap-1.5">
                                                            <Calendar size={12} />
                                                            {new Date(dl.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[rgb(var(--color-muted))] mt-1 line-clamp-2">{dl.description}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDelete(dl.id)}
                                                    className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 border-2 border-dashed border-[rgb(var(--color-border))] rounded-3xl">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                            <Calendar size={32} />
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">No deadlines established</h3>
                                        <p className="text-sm text-[rgb(var(--color-muted))] max-w-xs mx-auto">Create a timeline and rubrics for students in this batch to follow.</p>
                                        <Button variant="outline" size="sm" className="mt-6" onClick={() => setIsAddModalOpen(true)}>
                                            Create First Deadline
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* ── Add Deadline Modal ─────────────────────────────────────── */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Set Milestone for ${selectedBatch?.batchName}`}
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
                            <Edit3 size={14} />
                            Manual Entry
                        </button>
                    </div>

                    {activeTab === 'excel' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-[11px] leading-relaxed">
                                <p className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-1">
                                    <Info size={14} />
                                    CSV Column Order
                                </p>
                                <p className="text-blue-600/80 dark:text-blue-400/80">
                                    <span className="font-bold">Name</span>, <span className="font-bold">Description</span>, <span className="font-bold">Date (YYYY-MM-DD)</span>, <span className="font-bold">MaxScore</span>
                                </p>
                            </div>
                            
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform text-gray-400">
                                        <Upload size={24} />
                                    </div>
                                    <p className="text-sm text-[rgb(var(--color-muted))] font-bold text-center">
                                        {importFileName || "Upload CSV Timeline"}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1 italic">Maximum file size: 2MB</p>
                                </div>
                                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                            </label>

                            {importedRows.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold px-1">
                                        <span>Ready to Import ({importedRows.length})</span>
                                        <button onClick={() => setImportedRows([])} className="text-red-500">Reset</button>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border border-[rgb(var(--color-border))] rounded-2xl divide-y">
                                        {importedRows.map((row, i) => (
                                            <div key={i} className="p-3 bg-white dark:bg-gray-900 flex justify-between items-center text-[10px]">
                                                <div>
                                                    <div className="font-black text-blue-600 uppercase">{row.name}</div>
                                                    <div className="text-gray-400 mt-0.5">{row.date}</div>
                                                </div>
                                                <Badge variant="info">{row.score} pts</Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="primary" className="w-full py-3" onClick={handleImportConfirm}>
                                        Import Entire Timeline
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <Label>Milestone Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Design Document Submission" />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detailed requirements for this deadline..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Deadline Date</Label>
                                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div>
                                    <Label>Maximum Score</Label>
                                    <Input type="number" value={formData.maxScore} onChange={e => setFormData({...formData, maxScore: parseInt(e.target.value) || 0})} placeholder="e.g. 50" />
                                </div>
                            </div>
                            <Button 
                                variant="primary" 
                                className="w-full mt-4 py-3 shadow-lg shadow-blue-500/20" 
                                onClick={handleAddManual} 
                                disabled={!formData.name || !formData.date}
                            >
                                Schedule Milestone
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default RubricBuilder;
