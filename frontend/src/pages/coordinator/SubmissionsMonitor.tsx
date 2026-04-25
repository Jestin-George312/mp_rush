import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import Select from '../../components/common/UI/Select';
import Input from '../../components/common/UI/Input';
import { 
    Search, ClipboardList, Filter, 
    CheckCircle, XCircle, Clock, 
    RotateCcw, Download, Eye, Loader2
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';

const SubmissionsMonitor: React.FC = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const fetchAudit = async () => {
            try {
                setIsLoading(true);
                const res = await coordApi.getSubmissionAudit();
                if (res.data?.success) {
                    setSubmissions(res.data.data);
                }
            } catch (error) {
                toast.error('Failed to load submissions audit');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAudit();
    }, []);

    const filteredSubmissions = submissions.filter(s => {
        const matchSearch = (s.group_name || '').toLowerCase().includes(search.toLowerCase()) || 
                           (s.deadline_title || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase();
        return matchSearch && matchStatus;
    });

    const headers = ['Entity Detail', 'Target Deadline', 'Submission Time', 'Status Audit', 'File Context'];
    const rows = filteredSubmissions.map(s => [
        <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight">{s.group_name}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] font-bold uppercase italic">Batch: {s.batch_name}</span>
        </div>,
        <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-gray-400" />
            <span className="text-xs font-bold">{s.deadline_title}</span>
        </div>,
        <div className="text-xs font-bold text-gray-500">
            {s.created_at ? new Date(s.created_at).toLocaleDateString() : <span className="text-red-400">---</span>}
        </div>,
        <div className="flex items-center gap-2">
            {s.status === 'approved' && <Badge variant="success" className="text-[9px]"><CheckCircle size={10} className="mr-1" /> APPROVED</Badge>}
            {(s.status === 'pending' || s.status === 'submitted') && <Badge variant="warning" className="text-[9px]"><Clock size={10} className="mr-1" /> PENDING</Badge>}
            {s.status === 'rejected' && <Badge variant="danger" className="text-[9px]"><XCircle size={10} className="mr-1" /> REJECTED</Badge>}
            {s.status === 'resubmitted' && <Badge variant="info" className="text-[9px]"><RotateCcw size={10} className="mr-1" /> RESUBMITTED</Badge>}
        </div>,
        <div className="flex items-center gap-2">
            {s.name ? (
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                    <button className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors">
                        <Download size={14} />
                    </button>
                    {s.name}
                </div>
            ) : (
                <span className="text-[10px] font-black text-gray-300 uppercase italic">No File</span>
            )}
        </div>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Submissions Monitor</h1>
                    <p className="text-[rgb(var(--color-muted))]">Audit multi-batch document submissions and mentor feedback cycles</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="flex flex-col items-center justify-center py-6 border-b-4 border-b-green-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Submissions</p>
                    <h4 className="text-2xl font-black text-green-600">{submissions.length}</h4>
                </Card>
                <Card className="flex flex-col items-center justify-center py-6 border-b-4 border-b-orange-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Awaiting Review</p>
                    <h4 className="text-2xl font-black text-orange-600">{submissions.filter(s => s.status === 'pending' || s.status === 'submitted').length}</h4>
                </Card>
                <Card className="flex flex-col items-center justify-center py-6 border-b-4 border-b-red-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rejected</p>
                    <h4 className="text-2xl font-black text-red-600">{submissions.filter(s => s.status === 'rejected').length}</h4>
                </Card>
                <Card className="flex flex-col items-center justify-center py-6 border-b-4 border-b-blue-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Approved</p>
                    <h4 className="text-2xl font-black text-blue-600">{submissions.filter(s => s.status === 'approved').length}</h4>
                </Card>
            </div>

            <Card>
                <div className="flex flex-col md:flex-row items-center gap-4 mb-8 pb-6 border-b border-[rgb(var(--color-border))]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find group or document milestone..."
                            className="pl-10 shadow-none border-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                             <Filter size={14} className="text-gray-400" />
                             <Select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-44 h-10 border-gray-200"
                             >
                                <option value="All">All Statuses</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                             </Select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <Table headers={headers} rows={rows} />
                )}
            </Card>
        </div>
    );
};

export default SubmissionsMonitor;
