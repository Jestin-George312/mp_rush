import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  History, ShieldCheck, HelpCircle
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import { toast } from 'react-hot-toast';

const SubmissionPortal: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [selectedDeadline, setSelectedDeadline] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const handleFileUpload = async (file: File) => {
    if (!selectedDeadline) return toast.error('Please select a deadline');
    
    setUploading(true);
    try {
        // Need to find project_id. We can get it from dashboard stats or just assuming the backend handles user-scoped project.
        // Actually studentApi.getProjectDetails() has the ID.
        const projRes = await studentApi.getProjectDetails();
        const project = (projRes.data as any).data || projRes.data;
        
        await studentApi.submitDocument({
            project_id: project.id,
            type: deadlines.find(d => String(d.id) === selectedDeadline)?.phase || 'Other',
            parent_doc_id: undefined // Add logic for versions if needed
        }, file);
        
        toast.success('File uploaded successfully!');
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
                        {deadlines.map(d => (
                          <option key={d.id} value={d.id}>{d.title} ({d.status})</option>
                        ))}
                     </select>
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
                           if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
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
                               {uploading ? 'Uploading...' : 'Drop your artifact here'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-2 font-medium">Standard PDF or ZIP formats only. Maximum file size 25MB.</p>
                            <input 
                               type="file" 
                               id="file-upload" 
                               className="hidden" 
                               onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                            />
                            <button 
                               type="button"
                               onClick={() => document.getElementById('file-upload')?.click()}
                               className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all"
                            >
                               BROWSE LOCAL FILES
                            </button>
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
                    <div key={item.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between group hover:bg-gray-50 transition-colors">
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
                       <Badge variant={item.status === 'Approved' ? 'success' : 'warning'} className="text-[9px] font-black">{item.status}</Badge>
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
