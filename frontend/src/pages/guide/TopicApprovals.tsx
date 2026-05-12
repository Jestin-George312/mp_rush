import React, { useState, useCallback } from 'react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import { 
  CheckCircle, XCircle, Search, 
  Filter, Eye, AlertCircle, Loader2
} from 'lucide-react';
import { guideApi } from '../../services/guideApi';

const TopicApprovals: React.FC = () => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('Pending');
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = useCallback(async (status: string) => {
    try {
      setLoading(true);
      const res = await guideApi.getTopics(status);
      const data = (res.data as any).data || res.data;
      setTopics(data);
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTopics(statusFilter);
  }, [statusFilter, fetchTopics]);

  const handleOpenDetail = (topic: any) => {
    setSelectedTopic(topic);
    setIsDetailOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedTopic) return;
    try {
      setActionLoading('approve');
      await guideApi.approveTopic(String(selectedTopic.id), '');
      setIsDetailOpen(false);
      setSelectedTopic(null);
      await fetchTopics(statusFilter);
    } catch (err: any) {
      console.error('Error approving topic:', err);
      alert(err?.response?.data?.message || 'Failed to approve topic');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedTopic) return;
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return; // cancelled
    try {
      setActionLoading('reject');
      await guideApi.rejectTopic(String(selectedTopic.id), reason);
      setIsDetailOpen(false);
      setSelectedTopic(null);
      await fetchTopics(statusFilter);
    } catch (err: any) {
      console.error('Error rejecting topic:', err);
      alert(err?.response?.data?.message || 'Failed to reject topic');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevision = async () => {
    if (!selectedTopic) return;
    const instructions = prompt('Enter revision instructions:');
    if (instructions === null) return; // cancelled
    try {
      setActionLoading('revision');
      await guideApi.requestRevision(String(selectedTopic.id), instructions);
      setIsDetailOpen(false);
      setSelectedTopic(null);
      await fetchTopics(statusFilter);
    } catch (err: any) {
      console.error('Error requesting revision:', err);
      alert(err?.response?.data?.message || 'Failed to request revision');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Topic Approvals</h1>
          <p className="text-gray-500">Review and validate student project proposals</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['Pending', 'Approved', 'Rejected'].map((status) => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-black transition-all rounded-lg ${
                statusFilter === status 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-white' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input placeholder="Search proposals..." className="pl-10" />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={16} /> Filter by Batch
        </Button>
      </div>

      <div className="space-y-8">
        {loading ? (
           <div className="py-20 text-center">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Proposals...</p>
           </div>
        ) : topics.length > 0 ? (
          // Group by batchName
          Object.entries(topics.reduce((acc: any, topic) => {
            const batch = topic.batchName || 'Unassigned Batch';
            if (!acc[batch]) acc[batch] = [];
            acc[batch].push(topic);
            return acc;
          }, {})).map(([batchName, batchTopics]: [string, any]) => (
            <div key={batchName} className="space-y-4">
              <div className="flex items-center gap-4">
                 <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/50 px-4 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                    Batch: {batchName}
                 </h2>
                 <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1"></div>
                 <Badge variant="secondary" className="text-[9px]">{batchTopics.length} Total</Badge>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {batchTopics.map((topic: any) => (
                  <Card key={topic.id} className={`border-l-4 transition-all hover:shadow-md ${
                    topic.status === 'Approved' ? 'border-l-green-500' : 
                    topic.status === 'Rejected' ? 'border-l-red-500' : 
                    topic.status === 'Revision Requested' ? 'border-l-orange-500' : 'border-l-blue-500'
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{topic.domain || 'General'}</span>
                          {topic.isResubmitted && (
                            <Badge className="bg-orange-500 text-white border-none text-[8px] px-1.5 py-0 uppercase animate-pulse">
                              RE-SUBMITTED
                            </Badge>
                          )}
                          {topic.status !== 'Pending' && (
                            <Badge variant={topic.status === 'Approved' ? 'success' : 'danger'} className="text-[8px] px-1.5 py-0 uppercase">
                              {topic.status}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-gray-800 dark:text-white">{topic.title}</h3>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-bold uppercase">
                          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Group: {topic.groupName}</div>
                          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {topic.members?.length || 0} Members</div>
                          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {new Date(topic.submittedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenDetail(topic)}
                          className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-700"
                        >
                          <Eye size={16} /> {statusFilter === 'Pending' ? 'Inspect Proposal' : 'View Detail'}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
             <AlertCircle size={40} className="text-gray-300 mx-auto mb-4" />
             <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No {statusFilter} proposals found</p>
          </div>
        )}
      </div>

      {selectedTopic && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Project Proposal Detail"
        >
          <div className="space-y-6">
             <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                <h4 className="text-sm font-black text-blue-800 dark:text-blue-300 mb-2">Subject: {selectedTopic.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  {selectedTopic.description}
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Domain</p>
                   <p className="text-xs font-bold">{selectedTopic.domain}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Submission Date</p>
                   <p className="text-xs font-bold">{selectedTopic.submittedAt}</p>
                </div>
             </div>

             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Group Composition</p>
                <div className="flex flex-wrap gap-2">
                   {selectedTopic.members?.map((m: string) => (
                     <div key={m} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[11px] font-black">
                       {m}
                     </div>
                   ))}
                </div>
             </div>

             <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-3">
                   <button
                      onClick={handleReject}
                      disabled={!!actionLoading}
                      className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {actionLoading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Reject
                   </button>
                   <button
                      onClick={handleRevision}
                      disabled={!!actionLoading}
                      className="flex-1 py-3 bg-orange-50 text-orange-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {actionLoading === 'revision' ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />} Request Revision
                   </button>
                   <button
                      onClick={handleApprove}
                      disabled={!!actionLoading}
                      className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {actionLoading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve Topic
                   </button>
                </div>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TopicApprovals;
