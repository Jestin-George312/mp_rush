import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Calendar, Clock, CheckCircle2, XCircle, 
  User, MessageSquare, Loader2, AlertCircle
} from 'lucide-react';
import { guideApi } from '../../services/guideApi';
import toast from 'react-hot-toast';

const Extensions: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await guideApi.getExtensionRequests();
      setRequests(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch extension requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await guideApi.handleExtensionRequest(id, status);
      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-black uppercase tracking-widest animate-pulse">Scanning for pending extensions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white uppercase italic">Extension Oversight</h1>
           <p className="text-gray-500 font-medium">Review and moderate deadline extension requests from your supervised groups</p>
        </div>
        <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center gap-2 border border-orange-100 dark:border-orange-800">
           <Clock size={16} className="text-orange-600" />
           <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{requests.length} PENDING REQUESTS</span>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 border-dashed">
           <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200/50 dark:shadow-none">
             <CheckCircle2 size={40} className="text-green-500 opacity-20" />
           </div>
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">All groups are on track</h3>
           <p className="text-xs text-gray-400 mt-2">No pending extension requests found in your queue.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="hover:shadow-xl transition-all border-l-4 border-l-blue-600">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="warning" className="text-[9px] font-black tracking-widest uppercase">
                      Extension Request
                    </Badge>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Submitted on {new Date(req.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <User size={12} />
                        Requesting Group
                      </div>
                      <p className="font-black text-gray-800 dark:text-gray-100">{req.group_name}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Calendar size={12} />
                        Target Milestone
                      </div>
                      <p className="font-black text-gray-800 dark:text-gray-100">{req.deadline_title}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      <MessageSquare size={12} />
                      Justification
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed italic">
                      "{req.reason}"
                    </p>
                  </div>
                </div>

                <div className="lg:w-72 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-6 lg:pt-0 lg:pl-6">
                  <div className="space-y-2 mb-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Original Deadline</p>
                    <p className="text-sm font-black text-red-500 line-through opacity-50">{new Date(req.current_deadline).toLocaleDateString()}</p>
                    
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Requested Extension</p>
                      <p className="text-lg font-black text-blue-600">{new Date(req.requested_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, 'rejected')}
                      disabled={processingId === req.id}
                      className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approved')}
                      disabled={processingId === req.id}
                      className="flex-1 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Extensions;
