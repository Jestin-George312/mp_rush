import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Badge from '../../components/common/UI/Badge';
import { 
  FolderOpen, FileText, Download, 
  History, Search, Loader2, FileX2, ExternalLink
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

interface DocumentRecord {
  id: number;
  name: string;
  file_path: string;
  type: string;
  status: string;
  version: number;
  created_at: string;
  deadline_title?: string;
  drive_link?: string;
  uploader_name?: string;
}

const DocumentArchive: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await studentApi.getSubmissionStatus();
        const data = (res.data as any).data || res.data;
        setDocuments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Fetch documents error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // Group documents by deadline_title (or 'General Submissions' if none)
  const grouped = documents.reduce<Record<string, DocumentRecord[]>>((acc, doc) => {
    const key = doc.deadline_title || 'General Submissions';
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  // Filter by search query
  const filteredGroups = Object.entries(grouped)
    .map(([deadline, files]) => ({
      deadline,
      files: files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(g => g.files.length > 0);

  const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      case 'Needs Revision': return 'warning';
      default: return 'default';
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    if (doc.drive_link) {
      window.open(doc.drive_link, '_blank');
    } else {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      window.open(`${baseUrl}${doc.file_path}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Document Archive</h1>
           <p className="text-gray-500">Historical version repository for all project artifacts</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                {documents.length} Document{documents.length !== 1 ? 's' : ''}
              </span>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                placeholder="Search archival logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none w-48 md:w-64"
              />
           </div>
        </div>
      </div>

      {filteredGroups.length > 0 ? (
        <div className="space-y-8">
          {filteredGroups.map((section, idx) => (
            <div key={idx} className="space-y-4">
               <div className="flex items-center gap-3 px-2">
                  <FolderOpen size={18} className="text-blue-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">{section.deadline}</h3>
                  <span className="text-[9px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                    {section.files.length} file{section.files.length !== 1 ? 's' : ''}
                  </span>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {section.files.map((file) => (
                    <Card key={file.id} className={`hover:shadow-md transition-all ${file.status === 'Approved' ? 'border-l-4 border-l-green-500' : file.status === 'Rejected' ? 'border-l-4 border-l-red-400' : ''}`}>
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <FileText size={20} className="text-gray-400" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-gray-800 dark:text-gray-100">{file.name}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                   <Badge variant="secondary" className="text-[8px] font-black">v{file.version || 1}</Badge>
                                   <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                     {new Date(file.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                   </span>
                                   <span className="text-[9px] text-gray-400 font-bold">•</span>
                                   <span className="text-[9px] text-indigo-500 font-black uppercase">{file.type}</span>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-4">
                             <Badge variant={statusVariant(file.status)} className="text-[9px] font-black uppercase px-2">
                                {file.status}
                             </Badge>
                             {file.drive_link && (
                               <a 
                                 href={file.drive_link} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                                 title="Open in Google Drive"
                               >
                                  <ExternalLink size={16} />
                               </a>
                             )}
                             <button 
                               onClick={() => handleDownload(file)}
                               className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                               title="Download file"
                             >
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
      ) : (
        <Card className="py-16 text-center">
           <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
              <FileX2 size={32} className="text-gray-300" />
           </div>
           <h3 className="text-lg font-black text-gray-400">No Documents Found</h3>
           <p className="text-xs text-gray-400 font-medium mt-2 max-w-sm mx-auto">
             {searchQuery 
               ? `No documents matching "${searchQuery}". Try a different search term.`
               : 'Your project archive is empty. Submit documents through the Submission Portal to see them here.'}
           </p>
        </Card>
      )}

      <div className="p-6 border border-blue-100 dark:border-blue-900/10 bg-blue-50/20 rounded-3xl flex items-center gap-4">
         <History size={32} className="text-blue-500 flex-shrink-0" />
         <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Archival Protocol</p>
            <p className="text-xs text-gray-500 font-medium italic">
              "The document archive preserves every version of your submissions for accountability and technical auditing. All artifacts are grouped by their associated deadline."
            </p>
         </div>
      </div>
    </div>
  );
};

export default DocumentArchive;
