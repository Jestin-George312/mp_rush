import React, { useState, useEffect } from 'react';
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
    Settings, Trash2, ArrowRight, BookOpen, Loader2
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';

const GlobalDeadlines: React.FC = () => {
    const [selectedBatch, setSelectedBatch] = useState<string>('');
    const [batches, setBatches] = useState<any[]>([]);
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
    const [isLoading, setIsLoading] = useState(true);

    const [newDeadline, setNewDeadline] = useState({ title: '', description: '', due_date: '', phase: 'Proposal' });

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const bRes = await coordApi.getBatches();
                if (bRes.data?.success && bRes.data.data.length > 0) {
                    setBatches(bRes.data.data);
                    setSelectedBatch(bRes.data.data[0].id.toString());
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

    const fetchDeadlines = async () => {
        if (!selectedBatch) return;
        try {
            setIsLoading(true);
            const res = await coordApi.getDeadlines(selectedBatch);
            if (res.data?.success) setDeadlines(res.data.data);
        } catch (error) {
            toast.error('Failed to load deadlines');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDeadlines();
    }, [selectedBatch]);

    const handleCreateDeadline = async () => {
        try {
            await coordApi.createDeadline({
                batch_id: selectedBatch,
                ...newDeadline
            });
            toast.success('Deadline created');
            setIsAddModalOpen(false);
            setNewDeadline({ title: '', description: '', due_date: '', phase: 'Proposal' });
            fetchDeadlines();
        } catch (err) {
            toast.error('Failed to create deadline');
        }
    };

    const listHeaders = ['Milestone Detail', 'Schedule', 'Weightage', 'Format', 'Action'];
    const listRows = deadlines.map(d => [
        <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight">{d.title}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] line-clamp-1">{d.description || 'No description'}</span>
        </div>,
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <Clock size={12} /> {new Date(d.due_date).toLocaleDateString()}
        </div>,
        <div className="flex items-center gap-1.5">
             <Target size={12} className="text-orange-500" />
             <span className="text-xs font-bold">- Points</span>
        </div>,
        <Badge variant="default" className="text-[9px] uppercase tracking-widest">{d.phase || 'General'}</Badge>,
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
                            disabled={batches.length === 0}
                        >
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
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

            {isLoading ? (
                <div className="flex justify-center py-12">
                     <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
            ) : viewMode === 'timeline' ? (
                <div className="relative space-y-8 pl-8 before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-4 before:w-1 before:bg-blue-100 dark:before:bg-gray-700 before:rounded-full">
                    {deadlines.length === 0 ? (
                        <div className="py-20 text-center">
                            <Calendar size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                            <p className="text-sm text-[rgb(var(--color-muted))] font-bold">No deadlines defined for this batch.</p>
                        </div>
                    ) : deadlines.map((d, index) => {
                        const isPast = new Date(d.due_date) < new Date();
                        const state = isPast ? 'Passed' : 'Active';
                        return (
                            <div key={d.id} className="relative">
                                <div className={`absolute -left-8 top-1.5 w-7 h-7 rounded-full border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center text-[10px] font-black
                                    ${state === 'Active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {index + 1}
                                </div>
                                <Card className="hover:border-blue-300 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <Badge variant={state === 'Active' ? 'success' : 'default'} className="mb-2 uppercase tracking-tighter text-[9px]">{state}</Badge>
                                        <h3 className="text-lg font-bold tracking-tight">{d.title}</h3>
                                        <p className="text-sm text-[rgb(var(--color-muted))] mt-1">{d.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <div className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/10 text-orange-600 rounded-lg text-xs font-black flex items-center gap-2">
                                            <Calendar size={14} /> {new Date(d.due_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <Target size={14} /> - Marks
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-[rgb(var(--color-border))] flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                                            <FileText size={14} className="text-gray-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-[rgb(var(--color-muted))] uppercase tracking-widest">{d.phase} submission required</span>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                                        Configuration <ArrowRight size={14} />
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )})}
                </div>
            ) : (
                <Card>
                    {deadlines.length > 0 ? (
                        <Table headers={listHeaders} rows={listRows} />
                    ) : (
                        <div className="py-20 text-center">
                            <Calendar size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                            <p className="text-sm font-bold text-[rgb(var(--color-muted))]">No academic milestones scheduled.</p>
                        </div>
                    )}
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
                        <Input value={newDeadline.title} onChange={e => setNewDeadline({...newDeadline, title: e.target.value})} placeholder="e.g. Rough Draft Submission" />
                    </div>
                    <div>
                        <Label>Detailed Description</Label>
                        <textarea value={newDeadline.description} onChange={e => setNewDeadline({...newDeadline, description: e.target.value})} className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:outline-none min-h-[80px]" placeholder="Explain what students need to include..."></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Due Date</Label>
                            <Input type="date" value={newDeadline.due_date} onChange={e => setNewDeadline({...newDeadline, due_date: e.target.value})} />
                        </div>
                        <div>
                            <Label>Evaluation Stage</Label>
                            <Select value={newDeadline.phase} onChange={e => setNewDeadline({...newDeadline, phase: e.target.value})}>
                                <option value="Proposal">Proposal</option>
                                <option value="Draft">Draft</option>
                                <option value="Mid-Term">Mid-Term</option>
                                <option value="Final">Final</option>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Marks / Weightage</Label>
                        <Input type="number" placeholder="e.g. 20" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1" onClick={handleCreateDeadline}>Publish Timeline</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GlobalDeadlines;
