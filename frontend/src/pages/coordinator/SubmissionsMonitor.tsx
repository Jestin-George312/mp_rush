import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import Select from '../../components/common/UI/Select';
import Input from '../../components/common/UI/Input';
import { 
    Search, ClipboardList, Filter, 
    CheckCircle, XCircle, Clock, 
    RotateCcw, Download, Eye
} from 'lucide-react';

const SubmissionsMonitor: React.FC = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Robust Mock Data for auditing submissions
    const submissions = [
        { id: 's1', group: 'Team Alpha', deadline: 'SRS Submission', date: '2024-05-12', status: 'Approved', file: 'srs_v1.pdf', guide: 'Dr. Sarah Johnson' },
        { id: 's2', group: 'CyberShield', deadline: 'SRS Submission', date: '2024-05-13', status: 'Pending Review', file: 'cyber_report.zip', guide: 'Prof. Michael Chen' },
        { id: 's3', group: 'Individual-P1', deadline: 'Design Mockups', date: '2024-05-14', status: 'Rejected', file: 'designs.pdf', guide: 'Dr. Emily Williams' },
        { id: 's4', group: 'Team Gamma', deadline: 'Topic Proposal', date: '2024-05-10', status: 'Resubmitted', file: 'topic_final.pdf', guide: 'Alex Rivera' },
        { id: 's5', group: 'DeepSearch', deadline: 'SRS Submission', date: '---', status: 'Missing', file: null, guide: 'Dr. Sarah Johnson' },
    ];

    const filteredSubmissions = submissions.filter(s => {
        const matchSearch = s.group.toLowerCase().includes(search.toLowerCase()) || 
                           s.deadline.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const headers = ['Entity Detail', 'Target Deadline', 'Submission Time', 'Status Audit', 'File Context'];
    const rows = filteredSubmissions.map(s => [
        <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight">{s.group}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] font-bold uppercase italic">Guide: {s.guide}</span>
        </div>,
        <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-gray-400" />
            <span className="text-xs font-bold">{s.deadline}</span>
        </div>,
        <div className="text-xs font-bold text-gray-500">
            {s.date === '---' ? <span className="text-red-400">---</span> : s.date}
        </div>,
        <div className="flex items-center gap-2">
            {s.status === 'Approved' && <Badge variant="success" className="text-[9px]"><CheckCircle size={10} className="mr-1" /> APPROVED</Badge>}
            {s.status === 'Pending Review' && <Badge variant="warning" className="text-[9px]"><Clock size={10} className="mr-1" /> PENDING</Badge>}
            {s.status === 'Rejected' && <Badge variant="danger" className="text-[9px]"><XCircle size={10} className="mr-1" /> REJECTED</Badge>}
            {s.status === 'Resubmitted' && <Badge variant="info" className="text-[9px]"><RotateCcw size={10} className="mr-1" /> RESUBMITTED</Badge>}
            {s.status === 'Missing' && <Badge variant="secondary" className="text-[9px]"><XCircle size={10} className="mr-1" /> MISSING</Badge>}
        </div>,
        <div className="flex items-center gap-2">
            {s.file ? (
                <>
                    <button className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors">
                        <Download size={14} />
                    </button>
                    <button className="p-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-600 hover:text-white transition-colors">
                        <Eye size={14} />
                    </button>
                </>
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pass Rate</p>
                    <h4 className="text-2xl font-black text-green-600">76%</h4>
                </Card>
                <Card className="flex flex-col items-center justify-center py-6 border-b-4 border-b-orange-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Awaiting Review</p>
                    <h4 className="text-2xl font-black text-orange-600">14</h4>
                </Card>
                <Card className="flex flex-col items-center justify-center py-6 border-b-4 border-b-red-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Overdue Docs</p>
                    <h4 className="text-2xl font-black text-red-600">08</h4>
                </Card>
                <Card className="flex flex-col items-center justify-center py-6 border-b-4 border-b-blue-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resubmissions</p>
                    <h4 className="text-2xl font-black text-blue-600">03</h4>
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
                                <option>Approved</option>
                                <option>Pending Review</option>
                                <option>Rejected</option>
                                <option>Missing</option>
                             </Select>
                        </div>
                    </div>
                </div>

                <Table headers={headers} rows={rows} />
            </Card>
        </div>
    );
};

export default SubmissionsMonitor;
