import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  History, ShieldCheck, HelpCircle, MessageSquare, Download, Trash2,
  Eye
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import { toast } from 'react-hot-toast';

const SubmissionPortal: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [selectedDeadline, setSelectedDeadline] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [docName, setDocName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [deadlinesRes, historyRes] = await Promise.all([
          studentApi.getDeadlines(),
          studentApi.getSubmissionStatus()
        ]);
        
        const dData = (deadlinesRes.data as any).data || deadlinesRes.data;
        const hData = (historyRes.data as any).data || historyRes.data;
        
        setDeadlines(dData);
        setHistory(hData);
        if (dData.length > 0) setSelectedDeadline(String(dData[0].id));
      } catch (err) {
        console.error('Fetch submission data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) return toast.error('Please select a file to upload');
    if (!docName.trim()) return toast.error('Please provide a unique name for this document');
    
    setUploading(true);
    try {
        const projRes = await studentApi.getProjectDetails();
        const project = (projRes.data as any).data || projRes.data;
        
        await studentApi.submitDocument({
            project_id: project.id,
            deadlineId: selectedDeadline,
            documentName: docName.trim(),
            type: deadlines.find(d => String(d.id) === selectedDeadline)?.phase || 'Other',
        }, selectedFile);
        
        toast.success('File uploaded successfully!');
        setDocName(''); // Clear name after success
        setSelectedFile(null); // Clear file after success
        // Refresh history
        const historyRes = await studentApi.getSubmissionStatus();
        setHistory((historyRes.data as any).data || historyRes.data);
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Submission Portal</h1>
           <p className="text-gray-500">Securely transmit your project artifacts against batch deadlines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Upload Zone */}
         <div className="lg:col-span-2 space-y-6">
            <Card>
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <Upload size={14} /> Active Submission Zone
               </h3>
               
               <div className="space-y-6">
                  <div>
                     <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Select Targeted Deadline</label>
                     <select 
                        value={selectedDeadline}
                        onChange={(e) => setSelectedDeadline(e.target.value)}
                        className="w-full mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                     >
                        <option value="">Informal Draft for Guide Review</option>
                        {deadlines.map(d => (
                          <option key={d.id} value={d.id}>{d.title} ({d.status})</option>
                        ))}
                     </select>
                  </div>

                  <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Document Identification Name</label>
                      <input 
                         type="text"
                         value={docName}
                         onChange={(e) => setDocName(e.target.value)}
                         placeholder="e.g., Final System Architecture v1"
                         className="w-full mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                      />
                      <p className="text-[9px] font-bold text-gray-400 mt-2">This name must be unique within your project group.</p>
                   </div>

                   {deadlines.find(d => String(d.id) === selectedDeadline)?.phase === 'Proposal' ? (
                      <div className="p-12 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-3xl text-center">
                         <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-xl shadow-blue-500/5">
                            <CheckCircle2 size={32} />
                         </div>
                         <h4 className="text-lg font-black tracking-tight text-blue-900 dark:text-blue-100">Proposal Artifact Linked</h4>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-xs mx-auto">
                            The topic submission artifact is automatically linked from your <b>Project Initiation</b> form. No manual upload is required for this phase.
                         </p>
                      </div>
                   ) : (
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => { 
                           e.preventDefault(); 
                           setDragActive(false); 
                           if (e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
                        }}
                        className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
                           dragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                      >
                         <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-3xl flex items-center justify-center mb-4">
                               <Upload size={32} />
                            </div>
                            <h4 className="text-lg font-black tracking-tight">
                               {selectedFile ? selectedFile.name : 'Drop your artifact here'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-2 font-medium">Standard PDF or ZIP formats only. Maximum file size 25MB.</p>
                            <input 
                               type="file" 
                               id="file-upload" 
                               className="hidden" 
                               onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                            />
                            <div className="flex gap-4 mt-8">
                                <button 
                                   type="button"
                                   onClick={() => document.getElementById('file-upload')?.click()}
                                   className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
                                >
                                   {selectedFile ? 'CHANGE FILE' : 'BROWSE LOCAL FILES'}
                                </button>
                                <button 
                                   type="button"
                                   onClick={handleSubmit}
                                   disabled={uploading || !selectedFile}
                                   className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all disabled:opacity-50"
                                >
                                   {uploading ? 'UPLOADING...' : 'SUBMIT ARTIFACT'}
                                </button>
                            </div>
                         </div>
                      </div>
                   )}

                  <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                     <ShieldCheck size={18} className="text-green-500" />
                     <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed tracking-tight">
                        Artifacts are automatically scanned for integrity and archived with version time-stamping.
                     </p>
                  </div>
               </div>
            </Card>

            <Card>
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <History size={14} /> Global Submission History
               </h3>
               <div className="space-y-3">
                  {history.length > 0 ? history.map(item => (
                     <div key={item.id} className="flex flex-col border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden group transition-all">
                        <div 
                           className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                           onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        >
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:bg-white transition-colors shadow-sm">
                                 <FileText size={20} className="text-gray-400" />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-gray-800 dark:text-gray-100">{item.name}</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                    {item.type} • Received {new Date(item.created_at).toLocaleDateString()}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant={item.status === 'Approved' ? 'success' : item.status === 'Needs Revision' ? 'info' : 'warning'} className="text-[9px] font-black">
                                 {item.status}
                              </Badge>
                              {item.marked_file_path && (
                                 <Badge variant="success" className="text-[9px] font-black uppercase px-2 py-1">
                                    Marked Review
                                 </Badge>
                              )}
                              {(item.feedback || item.marked_file_path) && (
                                 <div className={`p-1 rounded-full ${expandedId === item.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <AlertCircle size={14} />
                                 </div>
                              )}
                              <button
                                 type="button"
                                 title="Delete submission"
                                 onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!window.confirm('Are you sure you want to delete this submission? This cannot be undone.')) return;
                                    try {
                                       await studentApi.deleteSubmission(item.id);
                                       toast.success('Submission deleted');
                                       const refreshed = await studentApi.getSubmissionStatus();
                                       setHistory((refreshed.data as any).data || refreshed.data);
                                    } catch (err: any) {
                                       toast.error(err.response?.data?.message || 'Delete failed');
                                    }
                                 }}
                                 className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                              >
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                        
                        {expandedId === item.id && (item.feedback || item.marked_file_path) && (
                           <div className="border-t border-gray-100 dark:border-gray-700">
                              {/* Marked Document Section (if available) */}
                              {item.marked_file_path && (
                                 <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-amber-100 dark:border-amber-900/30">
                                    <div className="flex items-start gap-3">
                                       <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg mt-0.5">
                                          <FileText size={16} className="text-amber-600" />
                                       </div>
                                       <div className="flex-1">
                                          <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider mb-2 flex items-center gap-1">
                                             ✓ Marked Document Available
                                          </p>
                                          <p className="text-xs text-amber-600 dark:text-amber-300 font-semibold mb-3 leading-relaxed">
                                             Your guide has reviewed your document and marked it with annotations and highlights showing the areas that need attention.
                                          </p>
                                          <div className="flex flex-wrap gap-3">
                                             <a 
                                                href={item.marked_file_path.startsWith('http') ? item.marked_file_path : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')}${item.marked_file_path.startsWith('/') ? '' : '/'}${item.marked_file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-600/30"
                                                download
                                             >
                                                <Download size={16} /> Download Marked Document
                                             </a>
                                             <a 
                                                href={item.marked_file_path.startsWith('http') ? item.marked_file_path : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')}${item.marked_file_path.startsWith('/') ? '' : '/'}${item.marked_file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-amber-600 border border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                             >
                                                <Eye size={16} /> View in New Tab
                                             </a>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}
                              
                              {/* Feedback Message Section */}
                              {item.feedback && (
                                 <div className="p-4 bg-blue-50/40 dark:bg-blue-900/15">
                                    <div className="flex items-start gap-3">
                                       <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
                                          <MessageSquare size={14} className="text-blue-600" />
                                       </div>
                                       <div className="flex-1">
                                          <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-2">Guide Message</p>
                                          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-blue-100 dark:border-blue-900/30">
                                             <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                                                {item.feedback}
                                             </p>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  )) : (
                    <p className="text-center text-xs text-gray-400 font-bold py-10">No submissions yet.</p>
                  )}
               </div>
            </Card>
         </div>

         {/* Validation Card */}
         <div className="space-y-6">
            <Card className="bg-gray-900 text-white shadow-2xl">
               <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-6">Integrity Check</h4>
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={18} className="text-green-500" />
                     <p className="text-xs font-bold">Standard Naming Format</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={18} className="text-green-500" />
                     <p className="text-xs font-bold">PDF Encryption Disabled</p>
                  </div>
                  <div className="flex items-center gap-3 opacity-30">
                     <HelpCircle size={18} />
                     <p className="text-xs font-bold">Virus Scan Passed</p>
                  </div>
               </div>
               <div className="mt-8 pt-8 border-t border-white/10">
                  <button className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest">
                     DOWNLOAD SUBMISSION GUIDE
                  </button>
               </div>
            </Card>

            <div className="p-5 border border-red-100 dark:border-red-900/20 bg-red-50/20 rounded-2xl flex items-start gap-4">
               <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
               <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                  Final submission for <b>Phase 1</b> closes in <u>48 hours</u>. Resubmissions after the deadline attract a 20% mark penalty.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SubmissionPortal;
