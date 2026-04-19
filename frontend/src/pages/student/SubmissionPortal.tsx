import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  History, ShieldCheck, HelpCircle
} from 'lucide-react';

const SubmissionPortal: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState('m2');

  const history = [
    { id: '1', name: 'Topic_Synopsis_Draft.pdf', deadline: 'Topic Abstract', status: 'Approved', date: 'April 14, 2026' },
    { id: '2', name: 'Group_Formation_Internal.pdf', deadline: 'Formation', status: 'Approved', date: 'April 12, 2026' },
  ];

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
                        <option value="m2">Phase 1 - SRS & Initial System Design (Open)</option>
                        <option value="m3">Phase 2 - Technical Setup (Upcoming)</option>
                     </select>
                  </div>

                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
                    className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
                       dragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                    }`}
                  >
                     <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-3xl flex items-center justify-center mb-4">
                           <Upload size={32} />
                        </div>
                        <h4 className="text-lg font-black tracking-tight">Drop your artifact here</h4>
                        <p className="text-xs text-gray-500 mt-2 font-medium">Standard PDF or ZIP formats only. Maximum file size 25MB.</p>
                        <button className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
                           BROWSE LOCAL FILES
                        </button>
                     </div>
                  </div>

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
                  {history.map(item => (
                    <div key={item.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between group hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:bg-white transition-colors shadow-sm">
                             <FileText size={20} className="text-gray-400" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-gray-800 dark:text-gray-100">{item.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{item.deadline} • Received {item.date}</p>
                          </div>
                       </div>
                       <Badge variant="success" className="text-[9px] font-black">{item.status}</Badge>
                    </div>
                  ))}
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
