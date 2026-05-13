import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, MessageSquare, CheckCircle, 
  XSquare, History, FileText, Download, Paperclip
} from 'lucide-react';
import { guideApi } from '../../services/guideApi';
import { toast } from 'react-hot-toast';
import PDFAnnotationViewer from '../../components/guide/PDFAnnotationViewer';

const FeedbackUI: React.FC = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [markedFile, setMarkedFile] = useState<File | null>(null);
  
  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await guideApi.getPendingDocuments('all');
        const docs = (res.data as any).data || res.data;
        const currentDoc = docs.find((d: any) => String(d.id) === docId);
        if (currentDoc) setDocumentData(currentDoc);
        else toast.error('Document not found or not pending');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [docId]);

  const handleSubmitReview = async (status: 'Approved' | 'Rejected' | 'Needs Revision') => {
    if (!docId) return;
    if (status !== 'Approved' && !comment.trim()) {
      return toast.error('Please provide a reason for rejection/resubmission');
    }

    try {
      await guideApi.reviewDocument(docId, status, comment, markedFile || undefined);
      toast.success(`Document marked as ${status}`);
      navigate('/guide/documents');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Document...</div>;
  if (!documentData) return <div className="p-8 text-center text-red-500 font-bold">Document Unavailable</div>;

  const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
  let rawPath: string = documentData.file_path || '';
  let viewerSrc = '';

  if (rawPath.includes('drive.google.com/file/d/')) {
    // Google Drive → convert to embeddable preview URL
    viewerSrc = rawPath.replace(/\/view.*$/, '/preview');
  } else if (rawPath.startsWith('/uploads/') || rawPath.startsWith('uploads/')) {
    // Local file stored as relative path → prepend backend host
    const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    viewerSrc = `${BACKEND_URL}${normalized}`;
  } else if (rawPath.startsWith('http')) {
    // Already absolute URL
    viewerSrc = rawPath;
  }

  const downloadUrl = rawPath.startsWith('/uploads/')
    ? `${BACKEND_URL}${rawPath}`
    : rawPath;

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
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{documentData.deadline_title || 'Informal Draft'} — {documentData.group_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black flex items-center gap-2 border border-gray-100 dark:border-gray-700 hover:bg-gray-100">
             <Download size={16} /> DOWNLOAD ORIGINAL
           </a>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 overflow-hidden">
        {/* Document Viewer Area */}
        <div className="lg:col-span-3 bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden flex flex-col">
           {viewerSrc && (viewerSrc.match(/\.pdf/i) || rawPath.match(/\.pdf/i) || (documentData.name || '').match(/\.pdf$/i)) ? (
               <PDFAnnotationViewer
                 url={viewerSrc}
                 onSaveAnnotated={(file) => setMarkedFile(file)}
               />
           ) : viewerSrc ? (
               <object data={viewerSrc} type="application/pdf" className="w-full h-full border-none">
                   <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                       <FileText size={40} className="text-blue-500" />
                       <p className="text-sm font-bold text-gray-300">Browser cannot preview this file type.</p>
                       <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700">
                           Open / Download File
                       </a>
                   </div>
               </object>
           ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <FileText size={40} className="text-gray-600 mb-4" />
                  <p className="text-sm text-gray-500 font-bold">No valid file path found.</p>
               </div>
           )}
        </div>

        {/* Feedback Thread Area */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
           <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                 <MessageSquare size={16} className="text-blue-600" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Review Feedback</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs text-gray-500">
                  Provide your feedback below. If you've annotated the document locally, you can attach the marked file, and it will be returned to the student.
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                 <div className="relative mb-2">
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Attach comment to section..." 
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 resize-none h-24"
                    />
                 </div>
                 
                 <div className="flex items-center justify-between mb-2">
                    <input type="file" id="marked-file" className="hidden" onChange={e => e.target.files && setMarkedFile(e.target.files[0])} />
                    <button onClick={() => document.getElementById('marked-file')?.click()} className={`text-[10px] font-black uppercase flex items-center gap-1 ${markedFile ? 'text-green-600' : 'text-blue-600 hover:text-blue-700'}`}>
                        <Paperclip size={14} /> {markedFile ? markedFile.name : 'Attach Marked File'}
                    </button>
                    {markedFile && (
                        <button onClick={() => setMarkedFile(null)} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Remove</button>
                    )}
                 </div>
              </div>
           </div>

           {/* Final Actions */}
           <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleSubmitReview('Rejected')} className="py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
                 <XSquare size={14} /> Reject
              </button>
              <button onClick={() => handleSubmitReview('Approved')} className="py-3 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2">
                 <CheckCircle size={14} /> Approve
              </button>
              <button onClick={() => handleSubmitReview('Needs Revision')} className="col-span-2 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                 <History size={14} /> Request Resubmission
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackUI;
