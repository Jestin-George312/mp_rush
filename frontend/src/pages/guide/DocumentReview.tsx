import React from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Badge from '../../components/common/UI/Badge';
import { 
  FileText, Search,
  ChevronRight, Calendar, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { guideApi } from '../../services/guideApi';

const DocumentReview: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'Pending'>('all');
  const [search, setSearch] = React.useState('');

  const fetchDocuments = React.useCallback(async (statusFilter: 'all' | 'Pending') => {
    setLoading(true);
    try {
      const res = await guideApi.getPendingDocuments(statusFilter === 'all' ? 'all' : undefined);
      const data = (res.data as any).data || res.data;
      setSubmissions(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments(filter);
  }, [filter, fetchDocuments]);

  const filtered = search.trim()
    ? submissions.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.group_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.batch_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : submissions;

  const pendingCount = submissions.filter(s => s.status === 'Pending').length;

  const getBadgeVariant = (status: string) => {
    if (status === 'Approved') return 'success';
    if (status === 'Pending') return 'warning';
    if (status === 'Rejected') return 'danger';
    if (status === 'Needs Revision') return 'info';
    return 'default';
  };

  const headers = ['Identity & Group', 'Document Artifact', 'Context', 'Review Audit', 'Workflow'];

  const rows = filtered.map(s => [
    <div className="flex flex-col">
       <span className="text-xs font-black">{s.group_name || s.group}</span>
       <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{s.batch_name || s.batch}</span>
    </div>,
    <div className="flex items-center gap-2">
       <FileText size={16} className="text-blue-500" />
       <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{s.name || s.type}</span>
    </div>,
    <div className="flex flex-col">
       <span className="text-[10px] font-black text-gray-500">{s.deadline_title || 'Informal Draft'}</span>
       <div className="flex items-center gap-1 mt-0.5">
          <User size={10} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400">
             {s.created_at ? new Date(s.created_at).toLocaleDateString() : s.submittedBy}
          </span>
       </div>
    </div>,
    <Badge variant={getBadgeVariant(s.status)} className="text-[9px] font-black tracking-widest">
       {s.status.toUpperCase()}
    </Badge>,
    <button 
      onClick={() => navigate(`/guide/documents/${s.id}`)}
      className="p-2 bg-gray-50 dark:bg-gray-800 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black"
    >
       {s.status === 'Pending' ? 'EVALUATE' : 'VIEW'} <ChevronRight size={14} />
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
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by group, artifact name or batch..." 
                    className="w-full pl-10 h-10 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                  />
               </div>
               <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    All Submissions
                  </button>
                  <button
                    onClick={() => setFilter('Pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'Pending' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    Pending Only
                  </button>
               </div>
            </div>

            <Table headers={headers} rows={rows} />
         </Card>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Audit Statistics</h3>
            <Card className="bg-blue-500 text-white shadow-xl shadow-blue-500/20">
               <p className="text-[10px] font-black uppercase opacity-70">Total Pending</p>
               <h4 className="text-3xl font-black mt-1">{pendingCount}</h4>
               <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                  <Calendar size={14} />
                  <span className="text-[10px] font-bold">Awaiting evaluation</span>
               </div>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
               <p className="text-[10px] font-black text-gray-400 uppercase">Total Reviewed</p>
               <h4 className="text-xl font-black text-gray-800 dark:text-gray-100 mt-1">{submissions.length - pendingCount}</h4>
               <p className="text-[9px] text-gray-400 font-bold mt-1">Documents processed</p>
               <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${submissions.length ? Math.round(((submissions.length - pendingCount) / submissions.length) * 100) : 0}%` }}></div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default DocumentReview;

