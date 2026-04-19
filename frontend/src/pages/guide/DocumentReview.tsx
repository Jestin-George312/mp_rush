import React from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import { 
  FileText, Search,
  ChevronRight, Calendar, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DocumentReview: React.FC = () => {
  const navigate = useNavigate();

  const submissions = [
    { id: 'd1', group: 'AlphaTech', batch: 'MCA 2024-26 A', type: 'Design Doc', deadline: 'Phase 1 - Design', submittedBy: 'John Doe', time: '2h ago', status: 'Pending' },
    { id: 'd2', group: 'EcoSync', batch: 'MCA 2024-26 A', type: 'SRS', deadline: 'Phase 1 - SRS', submittedBy: 'Jane Smith', time: '5h ago', status: 'Completed' },
    { id: 'd3', group: 'Nexus', batch: 'MSc CS 2023-25', type: 'Synopsis', deadline: 'Concept Validation', submittedBy: 'Alice Brown', time: '1d ago', status: 'Pending' },
    { id: 'd4', group: 'Sentinel', batch: 'MCA 2024-26 B', type: 'Database Schema', deadline: 'Phase 2 - DB', submittedBy: 'Bob Wilson', time: '3d ago', status: 'In Review' },
  ];

  const headers = ['Identity & Group', 'Document Artifact', 'Context', 'Review Audit', 'Workflow'];

  const rows = submissions.map(s => [
    <div className="flex flex-col">
       <span className="text-xs font-black">{s.group}</span>
       <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{s.batch}</span>
    </div>,
    <div className="flex items-center gap-2">
       <FileText size={16} className="text-blue-500" />
       <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{s.type}</span>
    </div>,
    <div className="flex flex-col">
       <span className="text-[10px] font-black text-gray-500">{s.deadline}</span>
       <div className="flex items-center gap-1 mt-0.5">
          <User size={10} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400">{s.submittedBy}</span>
       </div>
    </div>,
    <Badge variant={s.status === 'Completed' ? 'success' : s.status === 'In Review' ? 'warning' : 'default'} className="text-[9px] font-black tracking-widest">
       {s.status.toUpperCase()}
    </Badge>,
    <button 
      onClick={() => navigate(`/guide/documents/${s.id}`)}
      className="p-2 bg-gray-50 dark:bg-gray-800 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black"
    >
       EVALUATE <ChevronRight size={14} />
    </button>
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Document Review Portal</h1>
           <p className="text-gray-500">Academic document auditing and inline feedback workflow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="md:col-span-3">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by group, artifact name or batch..." 
                    className="w-full pl-10 h-10 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                  />
               </div>
               <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20">All Submissions</button>
                  <button className="px-4 py-2 text-gray-400 text-xs font-black hover:bg-gray-50 rounded-xl">Pending Only</button>
               </div>
            </div>

            <Table headers={headers} rows={rows} />
         </Card>

         <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Audit Statistics</h3>
            <Card className="bg-blue-500 text-white shadow-xl shadow-blue-500/20">
               <p className="text-[10px] font-black uppercase opacity-70">Total Pending</p>
               <h4 className="text-3xl font-black mt-1">12</h4>
               <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                  <Calendar size={14} />
                  <span className="text-[10px] font-bold">4 Due today</span>
               </div>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
               <p className="text-[10px] font-black text-gray-400 uppercase">Review Velocity</p>
               <h4 className="text-xl font-black text-gray-800 dark:text-gray-100 mt-1">85%</h4>
               <p className="text-[9px] text-gray-400 font-bold mt-1">22 docs reviewed this week</p>
               <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-green-500 w-[85%]"></div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default DocumentReview;
