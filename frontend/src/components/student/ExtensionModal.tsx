import React, { useState } from 'react';
import { X, Calendar, MessageSquare, AlertCircle, Loader2, Send } from 'lucide-react';
import Card from '../common/UI/Card';
import toast from 'react-hot-toast';
import api from '../../utils/api';

interface ExtensionModalProps {
  deadlineId: number;
  deadlineTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ExtensionModal: React.FC<ExtensionModalProps> = ({ deadlineId, deadlineTitle, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !requestedDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/student/extensions/request', {
        deadline_id: deadlineId,
        reason,
        requested_date: requestedDate
      });
      toast.success('Extension request submitted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl border-none">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">Request Extension</h3>
              <p className="text-[10px] opacity-70 font-medium">Milestone: {deadlineTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3 border border-blue-100 dark:border-blue-800">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
            <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
              Extension requests are subject to Guide approval. Please provide a valid justification and a realistic target date.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Calendar size={12} />
              Requested New Deadline
            </label>
            <input
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <MessageSquare size={12} />
              Justification / Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why your group needs more time..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all resize-none"
              required
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ExtensionModal;
