import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Select from '../../components/common/UI/Select';
import { 
    Plus, Trash2, BookOpen, Loader2, 
    ClipboardCheck, ListChecks, Target,
    AlertCircle, Save
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';

interface Criterion {
    description: string;
    maxMarks: number;
}

interface Rubric {
    id: number;
    name: string;
    total_score: number;
    criteria: Criterion[];
    batch_id: number;
    deadline_id?: number;
    created_at: string;
    created_by_name?: string;
}

const RubricBuilder: React.FC = () => {
    const [selectedBatch, setSelectedBatch] = useState<string>('');
    const [batches, setBatches] = useState<any[]>([]);
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [newRubric, setNewRubric] = useState({
        name: '',
        batch_id: '',
        deadline_id: '',
        criteria: [{ description: '', maxMarks: 0 }] as Criterion[]
    });

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

    const fetchData = async () => {
        if (!selectedBatch) return;
        try {
            setIsLoading(true);
            const [rubRes, dlRes] = await Promise.all([
                coordApi.getRubrics(parseInt(selectedBatch)),
                coordApi.getDeadlines(selectedBatch)
            ]);
            if (rubRes.data?.success) setRubrics(rubRes.data.data);
            if (dlRes.data?.success) setDeadlines(dlRes.data.data);
        } catch (error) {
            toast.error('Failed to load rubrics');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setNewRubric(prev => ({ ...prev, batch_id: selectedBatch }));
    }, [selectedBatch]);

    const handleAddCriterion = () => {
        setNewRubric(prev => ({
            ...prev,
            criteria: [...prev.criteria, { description: '', maxMarks: 0 }]
        }));
    };

    const handleRemoveCriterion = (index: number) => {
        setNewRubric(prev => ({
            ...prev,
            criteria: prev.criteria.filter((_, i) => i !== index)
        }));
    };

    const handleCriterionChange = (index: number, field: keyof Criterion, value: string | number) => {
        const updated = [...newRubric.criteria];
        updated[index] = { ...updated[index], [field]: value };
        setNewRubric(prev => ({ ...prev, criteria: updated }));
    };

    const totalScore = useMemo(() => {
        return newRubric.criteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);
    }, [newRubric.criteria]);

    const handleSaveRubric = async () => {
        if (!newRubric.name || !newRubric.batch_id || newRubric.criteria.length === 0) {
            toast.error('Please fill all required fields');
            return;
        }

        if (newRubric.criteria.some(c => !c.description || c.maxMarks <= 0)) {
            toast.error('All criteria must have a description and marks > 0');
            return;
        }

        try {
            setIsSubmitting(true);
            await coordApi.createRubric({
                name: newRubric.name,
                batch_id: parseInt(newRubric.batch_id),
                deadline_id: newRubric.deadline_id ? parseInt(newRubric.deadline_id) : undefined,
                totalScore: totalScore,
                criteria: newRubric.criteria
            });
            toast.success('Evaluation Rubric published successfully');
            setIsAddModalOpen(false);
            setNewRubric({
                name: '',
                batch_id: selectedBatch,
                deadline_id: '',
                criteria: [{ description: '', maxMarks: 0 }]
            });
            fetchData();
        } catch (error) {
            toast.error('Failed to create rubric');
        } finally {
            setIsSubmitting(false);
        }
    };

    const headers = ['Rubric Name', 'Total Weightage', 'Criteria Breakdown', 'Academic Link', 'Created By', 'Actions'];
    const rows = rubrics.map(r => [
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
                <ClipboardCheck size={18} />
            </div>
            <span className="font-bold text-sm">{r.name}</span>
        </div>,
        <Badge variant="info" className="font-black">{r.total_score} Pts</Badge>,
        <div className="flex flex-col gap-1 max-w-xs">
            {r.criteria.slice(0, 2).map((c, i) => (
                <div key={i} className="flex justify-between text-[10px] bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                    <span className="truncate mr-2">{c.description}</span>
                    <span className="font-bold">{c.maxMarks}m</span>
                </div>
            ))}
            {r.criteria.length > 2 && <span className="text-[9px] text-gray-400 font-bold ml-1">+{r.criteria.length - 2} more criteria</span>}
        </div>,
        <div className="text-[10px] font-medium text-gray-500 italic">
            {r.deadline_id ? deadlines.find(d => d.id === r.deadline_id)?.title || 'Global' : 'Independent Assessment'}
        </div>,
        <span className="text-xs font-medium text-gray-400">{r.created_by_name || 'System'}</span>,
        <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400">
                <Trash2 size={16} />
            </button>
        </div>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Evaluation Rubrics</h1>
                    <p className="text-[rgb(var(--color-muted))]">Create structured grading criteria for project assessments</p>
                </div>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> Design New Rubric
                </Button>
            </div>

            {/* Batch Selector */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-[rgb(var(--color-border))] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active Batch Context</p>
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
                <div className="flex items-center gap-4 text-xs text-[rgb(var(--color-muted))]">
                   <div className="flex items-center gap-1.5 font-bold">
                        <ListChecks size={14} className="text-indigo-500" />
                        <span>{rubrics.length} Defined Rubrics</span>
                   </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                     <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
            ) : (
                <Card className="overflow-hidden border-none shadow-xl shadow-gray-100 dark:shadow-none">
                    {rubrics.length > 0 ? (
                        <Table headers={headers} rows={rows} />
                    ) : (
                        <div className="py-20 text-center">
                            <ClipboardCheck size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                            <p className="text-sm font-bold text-[rgb(var(--color-muted))] mb-4">No evaluation rubrics defined for this batch.</p>
                            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>Create First Rubric</Button>
                        </div>
                    )}
                </Card>
            )}

            {/* Rubric Creator Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Design Evaluation Rubric"
                size="lg"
            >
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Rubric Title</Label>
                            <Input 
                                value={newRubric.name} 
                                onChange={e => setNewRubric({...newRubric, name: e.target.value})} 
                                placeholder="e.g. Final Presentation Assessment" 
                            />
                        </div>
                        <div>
                            <Label>Link to Milestone (Optional)</Label>
                            <Select 
                                value={newRubric.deadline_id} 
                                onChange={e => setNewRubric({...newRubric, deadline_id: e.target.value})}
                            >
                                <option value="">Independent (No Deadline Link)</option>
                                {deadlines.map(d => (
                                    <option key={d.id} value={d.id}>{d.title}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                                <ListChecks size={14} /> Performance Criteria
                            </h3>
                            <button 
                                onClick={handleAddCriterion}
                                className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
                            >
                                <Plus size={12} /> ADD CRITERIA
                            </button>
                        </div>

                        <div className="space-y-3">
                            {newRubric.criteria.map((c, index) => (
                                <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex-1">
                                        <Input 
                                            value={c.description} 
                                            onChange={e => handleCriterionChange(index, 'description', e.target.value)} 
                                            placeholder="e.g. Quality of Documentation / Timeliness"
                                            className="h-10 text-sm"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input 
                                            type="number" 
                                            value={c.maxMarks} 
                                            onChange={e => handleCriterionChange(index, 'maxMarks', parseInt(e.target.value) || 0)} 
                                            placeholder="Marks"
                                            className="h-10 text-sm text-center"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveCriterion(index)}
                                        className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                        disabled={newRubric.criteria.length === 1}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-between border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                <Target size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculated Score</p>
                                <p className="text-lg font-black text-indigo-600">{totalScore} Total Marks</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold max-w-[150px] text-right">
                           <AlertCircle size={12} /> Rubric will be stored as an immutable JSON template
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button 
                            variant="primary" 
                            className="flex-1" 
                            onClick={handleSaveRubric}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} Publish Rubric
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RubricBuilder;
