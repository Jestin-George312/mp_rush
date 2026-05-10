import React, { useEffect, useState } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  MessageSquare, Download, 
  History, AlertCircle, Inbox
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import toast from 'react-hot-toast';

const FeedbackReview: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await studentApi.getFeedback();
        setReviews(response.data.data || []);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        toast.error('Failed to load feedback insights');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Mentor Feedback & Audits</h1>
           <p className="text-gray-500">Review guide suggestions and required deliverable corrections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reviews.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Inbox size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Feedback Yet</h3>
            <p className="text-gray-500 max-w-xs mt-2 text-sm">
              Your submissions haven't received any feedback from your guide yet. Check back after your next milestone!
            </p>
          </Card>
        ) : (
          reviews.map(review => (
            <Card key={review.id} className={`border-l-4 ${review.status === 'Approved' ? 'border-l-green-500' : (review.status === 'Action Required' ? 'border-l-orange-500 shadow-xl shadow-orange-500/5' : 'border-l-blue-500')}`}>
               <div className="flex flex-col lg:flex-row gap-8">
                  {/* Review Header */}
                  <div className="lg:w-1/3 space-y-4">
                     <div className="flex items-center gap-3">
                        <Badge variant={review.status === 'Approved' ? 'success' : (review.status === 'Action Required' ? 'warning' : 'info')} className="text-[10px] font-black uppercase px-3">
                           {review.status}
                        </Badge>
                     </div>
                     <div>
                        <h3 className="text-lg font-black tracking-tight">{review.artifact}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{review.deadline}</p>
                     </div>
                     
                     <div className="space-y-3 pt-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-xs text-blue-600 uppercase">
                             {review.guide.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase">Reviewing Guide</p>
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{review.guide}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                             <History size={16} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase">Latest review</p>
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{review.date}</p>
                           </div>
                        </div>
                     </div>

                     <button className="w-full mt-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2">
                         <Download size={14} /> VIEW EVALUATED RAW FILE
                     </button>
                  </div>

                  {/* Comments Stream */}
                  <div className="lg:w-2/3 space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                        <MessageSquare size={14} /> Critical Review Insights
                     </h4>
                     <div className="space-y-4">
                        {review.comments.length === 0 ? (
                           <p className="text-sm text-gray-400 italic py-4">No specific comments provided.</p>
                        ) : (
                          review.comments.map((comment: any, idx: number) => (
                            <div key={idx} className="relative pl-6">
                               <div className="absolute left-0 top-1 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                               <p className="text-sm font-medium leading-relaxed bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                  {comment.text}
                                  <span className="block mt-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">{comment.time}</span>
                               </p>
                            </div>
                          ))
                        )}
                        
                        {review.status === 'Action Required' && (
                          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl flex items-start gap-3">
                             <AlertCircle size={20} className="text-orange-500" />
                             <div>
                                <p className="text-xs font-black text-orange-600 uppercase mb-1">Resubmission Active</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Please address the above items and upload a revised version to the portal.</p>
                             </div>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackReview;
