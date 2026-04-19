import React from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  FolderOpen, FileText, Download, 
  History, Search
} from 'lucide-react';

const DocumentArchive: React.FC = () => {
  const archives = [
    {
      deadline: 'Topic Abstract & Formation',
      files: [
        { name: 'Topic_Synopsis_Final.pdf', version: 'v1.4 (Final)', status: 'Approved', date: '2026-04-14' },
        { name: 'Topic_Synopsis_Draft_2.pdf', version: 'v1.2', status: 'Superseded', date: '2026-04-12' },
        { name: 'Topic_Synopsis_Draft_1.pdf', version: 'v1.0', status: 'Superseded', date: '2026-04-10' },
      ]
    },
    {
       deadline: 'Initial Project Concept',
       files: [
         { name: 'Initial_Concept_Proposal.docx', version: 'v1.0', status: 'Archived', date: '2026-03-20' },
       ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Document Archive</h1>
           <p className="text-gray-500">Historical version repository for all project artifacts</p>
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
           <input 
             placeholder="Search archival logs..." 
             className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold"
           />
        </div>
      </div>

      <div className="space-y-8">
        {archives.map((section, idx) => (
          <div key={idx} className="space-y-4">
             <div className="flex items-center gap-3 px-2">
                <FolderOpen size={18} className="text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">{section.deadline}</h3>
             </div>

             <div className="grid grid-cols-1 gap-3">
                {section.files.map((file, fIdx) => (
                  <Card key={fIdx} className={`hover:shadow-md transition-all ${file.status === 'Approved' ? 'border-l-4 border-l-green-500' : 'opacity-60 grayscale-[0.5]'}`}>
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                              <FileText size={20} className="text-gray-400" />
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-800 dark:text-gray-100">{file.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <Badge variant="secondary" className="text-[8px] font-black">{file.version}</Badge>
                                 <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{file.date}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-6">
                           <Badge variant={file.status === 'Approved' ? 'success' : 'default'} className="text-[9px] font-black uppercase px-2">
                              {file.status}
                           </Badge>
                           <button className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600 rounded-lg transition-all">
                              <Download size={18} />
                           </button>
                        </div>
                     </div>
                  </Card>
                ))}
             </div>
          </div>
        ))}
      </div>

      <div className="p-6 border border-blue-100 dark:border-blue-900/10 bg-blue-50/20 rounded-3xl flex items-center gap-4">
         <History size={32} className="text-blue-500 flex-shrink-0" />
         <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Archival Protocol</p>
            <p className="text-xs text-gray-500 font-medium italic">
              "The document archive preserves every version of your submissions for accountability and technical auditing. Superseded files are kept as read-only copies."
            </p>
         </div>
      </div>
    </div>
  );
};

export default DocumentArchive;
