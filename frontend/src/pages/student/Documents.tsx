import React, { useMemo, useState, useRef, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Tabs from '../../components/common/UI/Tabs';
import Modal from '../../components/common/UI/Modal';
import ProgressBar from '../../components/common/UI/ProgressBar';
import { FileText, Download } from 'lucide-react';
import { fetchDocuments, uploadDocument } from '../../services/documentApi';
import { fetchProjects } from '../../services/projectApi';
import toast from 'react-hot-toast';

type Doc = {
  id: string;
  name: string;
  date: string;
  type: 'SRS' | 'Reports' | 'Diagrams' | 'Other';
  status: 'Approved' | 'Pending' | 'Rejected';
  file_path: string;
};

const CATEGORIES = ['All', 'SRS', 'Reports', 'Diagrams'];

const Documents: React.FC = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [active, setActive] = useState<string>('All');
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [type, setType] = useState<'SRS' | 'Reports' | 'Diagrams' | 'Other'>('SRS');

  useEffect(() => {
    fetchProjects().then(res => {
      if (res.data && res.data.length > 0) {
        const pId = res.data[0].id;
        setProjectId(pId);
        loadDocs(pId);
      }
    }).catch(err => console.error(err));
  }, []);

  const loadDocs = (pId: number) => {
    fetchDocuments(pId).then(res => {
      const formatted = res.data.map((d: any) => ({
        id: String(d.id),
        name: d.name,
        date: d.created_at,
        type: d.type,
        status: d.status,
        file_path: d.file_path
      }));
      setDocs(formatted);
    });
  };

  const filtered = useMemo(() => {
    if (active === 'All') return docs;
    return docs.filter(d => d.type === active);
  }, [docs, active]);

  const openModal = () => { 
    if(!projectId) return toast.error('Submit a project first!');
    setOpen(true); 
    setProgress(0); 
  };
  
  const closeModal = () => { setOpen(false); setUploading(false); setProgress(0); };

  const onUpload = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!projectId) return;

    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Please select a file');

    setUploading(true);
    try {
      await uploadDocument(projectId, type, file, (progressEvent) => {
         const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
         setProgress(pct);
      });
      toast.success('Document uploaded!');
      closeModal();
      loadDocs(projectId);
    } catch (e: any) {
      toast.error('Failed to upload document');
      setUploading(false);
    }
  };

  const handleDownload = (docId: string) => {
      window.open(`http://localhost:5000/api/documents/${docId}/download`, '_blank');
  };

  const badgeVariant = (s: Doc['status']) => {
    if (s === 'Approved') return 'success';
    if (s === 'Pending') return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-[rgb(var(--color-muted))]">Manage and upload project documents</p>
        </div>
        <div>
          <Button variant="primary" onClick={openModal}>Upload Document</Button>
        </div>
      </div>

      <Card>
        <Tabs labels={CATEGORIES} active={active} onChange={setActive} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 && <div className="p-4 text-[rgb(var(--color-muted))]">No documents found.</div>}
          {filtered.map(d => (
            <Card key={d.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-[rgb(var(--color-primary))]"><FileText size={28} /></div>
                  <div>
                    <div className="font-medium truncate max-w-[200px]">{d.name}</div>
                    <div className="text-[rgb(var(--color-muted))] text-sm">{new Date(d.date).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={badgeVariant(d.status)}>{d.status}</Badge>
                  <button onClick={() => handleDownload(d.id)} className="p-2 rounded hover:bg-[rgb(var(--color-input))]" aria-label="Download">
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Modal isOpen={open} title="Upload Document" onClose={closeModal}>
        <form onSubmit={onUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">File</label>
            <input ref={fileRef} type="file" className="w-full" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Type</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-[rgb(var(--color-input))] border-[rgb(var(--color-border))] rounded-md px-3 py-2">
              <option value="SRS">SRS</option>
              <option value="Reports">Reports</option>
              <option value="Diagrams">Diagrams</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {uploading && (
            <div>
              <ProgressBar value={progress} />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" type="submit" loading={uploading}>Upload</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Documents;
