import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
    Calendar, Clock, Target, 
    FileText, ArrowLeft, Loader2, BookOpen
} from 'lucide-react';
import { guideApi } from '../../services/guideApi';
import { toast } from 'react-hot-toast';

const BatchDeadlines: React.FC = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [batchInfo, setBatchInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!batchId) return;
            try {
                setIsLoading(true);
                // Fetch deadlines
                const dRes = await guideApi.getBatchDeadlines(batchId);
                const dData = (dRes.data as any).data || dRes.data;
                setDeadlines(Array.isArray(dData) ? dData : []);

                // Fetch batch info to show name (reusing getAssignedBatches and filtering)
                const bRes = await guideApi.getAssignedBatches();
                const bData = (bRes.data as any).data || bRes.data;
                const currentBatch = bData.find((b: any) => b.id.toString() === batchId);
                if (currentBatch) setBatchInfo(currentBatch);
                
            } catch (error) {
                console.error('Error fetching batch deadlines:', error);
                toast.error('Failed to load deadlines');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [batchId]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Batch Deadlines</h1>
                        <p className="text-gray-500 flex items-center gap-2">
                           <BookOpen size={14} className="text-blue-500" /> {batchInfo?.name || 'Loading batch...'}
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Synchronizing Timeline...</p>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto space-y-8 relative pl-8 before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-4 before:w-1 before:bg-blue-100 dark:before:bg-gray-800 before:rounded-full">
                    {deadlines.length === 0 ? (
                        <div className="py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700 ml-[-2rem] pl-8">
                            <Calendar size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                            <p className="text-lg font-black text-gray-400">No deadlines defined for this batch yet.</p>
                            <p className="text-sm text-gray-400 mt-2">Check back later or contact the coordinator if you believe this is an error.</p>
                        </div>
                    ) : (
                        deadlines.map((d, index) => {
                            const isPast = new Date(d.due_date) < new Date();
                            const state = isPast ? 'Passed' : 'Upcoming';
                            
                            return (
                                <div key={d.id} className="relative group">
                                    <div className={`absolute -left-8 top-1.5 w-7 h-7 rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center text-[10px] font-black z-10
                                        ${state === 'Upcoming' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-gray-300 text-gray-600'}`}>
                                        {index + 1}
                                    </div>
                                    <Card className="hover:border-blue-400/50 hover:shadow-xl transition-all duration-300">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={state === 'Upcoming' ? 'success' : 'default'} className="uppercase tracking-tighter text-[9px] px-2 py-0.5">
                                                        {state}
                                                    </Badge>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d.phase || 'Milestone'}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black tracking-tight text-gray-800 dark:text-white">{d.title}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed italic border-l-4 border-blue-500/10 pl-4">{d.description || 'No detailed instructions provided.'}</p>
                                                </div>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black border border-blue-100 dark:border-blue-800/50">
                                                        <FileText size={14} />
                                                        <span>{d.submitted_count || 0} / {d.total_groups || 0} Submissions</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3 shrink-0">
                                                <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 rounded-xl text-sm font-black flex items-center gap-3 border border-orange-100 dark:border-orange-800/50 shadow-sm">
                                                    <Clock size={16} /> 
                                                    <div>
                                                        <p className="text-[9px] uppercase tracking-tighter opacity-70">Due Date</p>
                                                        <p>{new Date(d.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-black flex items-center gap-3 border border-purple-100 dark:border-purple-800/50 shadow-sm w-full md:w-auto">
                                                    <Target size={16} />
                                                    <div className="flex-1">
                                                        <p className="text-[9px] uppercase tracking-tighter opacity-70">Weightage</p>
                                                        <p>{d.marks || '--'} Marks</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default BatchDeadlines;
