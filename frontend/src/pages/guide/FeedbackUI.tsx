import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Send, MessageSquare, CheckCircle, 
  XSquare, History, FileText, Download
} from 'lucide-react';

const FeedbackUI: React.FC = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');

  const documentData = {
    id: docId,
    name: 'SRS_AlphaTech_v1.pdf',
    type: 'Software Requirements Specification',
    group: 'AlphaTech',
    submittedAt: '2026-04-12 14:30',
    version: '1.2'
  };

  const [comments, setComments] = useState([
    { id: 1, author: 'Guide (You)', text: 'Please refine the functional requirements in section 3.2.', time: '1h ago', context: 'Section 3.2' },
    { id: 2, author: 'Leader (John Doe)', text: 'Will update and re-submit by tomorrow.', time: '45m ago', context: 'Reply' },
  ]);

  const handleAddComment = () => {
    if (!comment) return;
    setComments([...comments, {
      id: Date.now(),
      author: 'Guide (You)',
      text: comment,
      time: 'Just now',
      context: 'General'
    }]);
    setComment('');
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/guide/documents')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black">{documentData.name}</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Reviewing Version {documentData.version} — {documentData.group}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black flex items-center gap-2 border border-gray-100 dark:border-gray-700">
             <Download size={16} /> DOWNLOAD ORIGINAL
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 overflow-hidden">
        {/* Document Viewer Area (Mock) */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-y-auto custom-scrollbar flex flex-col p-8">
           <div className="flex-1 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-gray-50/30">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
                 <FileText size={40} />
              </div>
              <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">Document Reader</h2>
              <p className="text-sm text-gray-400 max-w-sm mt-2">
                The integrated PDF viewer would render the document content here, allowing for highlight-based annotations.
              </p>
              <div className="mt-8 space-y-4 w-full max-w-md">
                 <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4"></div>
                 <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-full"></div>
                 <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-5/6"></div>
                 <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-full"></div>
              </div>
           </div>
        </div>

        {/* Feedback Thread Area */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
           <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                 <MessageSquare size={16} className="text-blue-600" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Feedback Thread</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 {comments.map((c) => (
                   <div key={c.id} className="group">
                      <div className="flex items-center justify-between mb-1">
                         <span className="text-[10px] font-black text-gray-500">{c.author}</span>
                         <span className="text-[9px] text-gray-400 font-bold">{c.time}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs font-medium leading-relaxed relative">
                         {c.context && (
                           <p className="text-[8px] font-black text-blue-500 uppercase mb-1">@{c.context}</p>
                         )}
                         {c.text}
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                 <div className="relative">
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Attach comment to section..." 
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 mb-2 resize-none h-20"
                    />
                    <button 
                      onClick={handleAddComment}
                      className="absolute right-2 bottom-4 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                       <Send size={14} />
                    </button>
                 </div>
              </div>
           </div>

           {/* Final Actions */}
           <div className="grid grid-cols-2 gap-2">
              <button className="py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
                 <XSquare size={14} /> Reject
              </button>
              <button className="py-3 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2">
                 <CheckCircle size={14} /> Approve
              </button>
              <button className="col-span-2 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                 <History size={14} /> Request Resubmission
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackUI;
