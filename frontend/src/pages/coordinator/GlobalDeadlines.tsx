import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Select from '../../components/common/UI/Select';
import { 
    Calendar, Plus, Clock, Target, 
    FileText,
    Settings, Trash2, ArrowRight, BookOpen
} from 'lucide-react';

const GlobalDeadlines: React.FC = () => {
    const [selectedBatch, setSelectedBatch] = useState('MCA 2024-26 A');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

    // Robust Mock Data for real APMS workflow
    const deadlines = [
        { id: 'd1', title: 'Phase 1: Topic & Scope', description: 'Submission of project title, domain and feasibility scope.', date: '2024-06-12', type: 'Proposal', marks: 10, state: 'Active' },
        { id: 'd2', title: 'Phase 2: Abstract & SRS', description: 'Documentation of functional and non-functional requirements.', date: '2024-07-25', type: 'Documentation', marks: 15, state: 'Active' },
        { id: 'd3', title: 'Mid-Term implementation', description: 'Demonstration of core modules and database architecture.', date: '2024-09-15', type: 'Review', marks: 25, state: 'Pending' },
        { id: 'd4', title: 'Final Review & Viva', description: 'Complete project demo with final report submission.', date: '2024-11-20', type: 'Defense', marks: 50, state: 'Pending' }
    ];

    const listHeaders = ['Milestone Detail', 'Schedule', 'Weightage', 'Format', 'Action'];
    const listRows = deadlines.map(d => [
        <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight">{d.title}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] line-clamp-1">{d.description}</span>
        </div>,
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <Clock size={12} /> {d.date}
        </div>,
        <div className="flex items-center gap-1.5">
             <Target size={12} className="text-orange-500" />
             <span className="text-xs font-bold">{d.marks} Points</span>
        </div>,
        <Badge variant="default" className="text-[9px] uppercase tracking-widest">{d.type}</Badge>,
        <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
                <Settings size={16} />
            </button>
            <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors">
                <Trash2 size={16} />
            </button>
        </div>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Global Deadlines</h1>
                    <p className="text-[rgb(var(--color-muted))]">Define the academic project roadmap and grading weights</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-[rgb(var(--color-border))]">
                        <button onClick={() => setViewMode('timeline')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>Timeline</button>
                        <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>Table</button>
                    </div>
                    <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={18} className="mr-2" /> Add Milestone
                    </Button>
                </div>
            </div>

            {/* Batch Selector Header */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-[rgb(var(--color-border))] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active Batch View</p>
                        <Select 
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="h-8 border-none bg-transparent font-black text-sm p-0 focus:ring-0"
                        >
                            <option>MCA 2024-26 A</option>
                            <option>MCA 2024-26 B</option>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-6 pr-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Weightage</p>
                        <p className="font-black text-xl text-blue-600">100 Pts</p>
                    </div>
                </div>
            </div>

            {viewMode === 'timeline' ? (
                <div className="relative space-y-8 pl-8 before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-4 before:w-1 before:bg-blue-100 dark:before:bg-gray-700 before:rounded-full">
                    {deadlines.map((d, index) => (
                        <div key={d.id} className="relative">
                            <div className={`absolute -left-8 top-1.5 w-7 h-7 rounded-full border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center text-[10px] font-black
                                ${d.state === 'Active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {index + 1}
                            </div>
                            <Card className="hover:border-blue-300 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <Badge variant={d.state === 'Active' ? 'success' : 'default'} className="mb-2 uppercase tracking-tighter text-[9px]">{d.state}</Badge>
                                        <h3 className="text-lg font-bold tracking-tight">{d.title}</h3>
                                        <p className="text-sm text-[rgb(var(--color-muted))] mt-1">{d.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <div className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/10 text-orange-600 rounded-lg text-xs font-black flex items-center gap-2">
                                            <Calendar size={14} /> {d.date}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <Target size={14} /> {d.marks} Marks
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-[rgb(var(--color-border))] flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                                            <FileText size={14} className="text-gray-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-[rgb(var(--color-muted))] uppercase tracking-widest">{d.type} submission required</span>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                                        Configuration <ArrowRight size={14} />
                                    </button>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                <Card>
                    <Table headers={listHeaders} rows={listRows} />
                </Card>
            )}

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Schedule Global Deadline"
            >
                <div className="space-y-4">
                    <div>
                        <Label>Milestone Title</Label>
                        <Input placeholder="e.g. Rough Draft Submission" />
                    </div>
                    <div>
                        <Label>Detailed Description</Label>
                        <textarea className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:outline-none min-h-[80px]" placeholder="Explain what students need to include..."></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Due Date</Label>
                            <Input type="date" />
                        </div>
                        <div>
                            <Label>Evaluation Stage</Label>
                            <Select>
                                <option>Proposal</option>
                                <option>Draft</option>
                                <option>Mid-Term</option>
                                <option>Final</option>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Marks / Weightage</Label>
                        <Input type="number" placeholder="e.g. 20" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1">Publish Timeline</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GlobalDeadlines;
