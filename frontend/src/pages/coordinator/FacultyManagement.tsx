import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
    Search, UserPlus, Mail, Briefcase, Edit2, Trash2, Loader2, Upload, FileSpreadsheet, CheckCircle, AlertTriangle
} from 'lucide-react';

const FacultyManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
    const [facultyList, setFacultyList] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newFaculty, setNewFaculty] = useState({ name: '', email: '', password: '' });
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Active' | 'On Leave'>('All');
    const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
    
    // Bulk state
    const [bulkData, setBulkData] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [facultyRes, batchesRes] = await Promise.all([
                coordApi.getFaculty(),
                coordApi.getBatches()
            ]);
            if (facultyRes.data?.success) setFacultyList(facultyRes.data.data);
            if (batchesRes.data?.success) setBatches(batchesRes.data.data);
        } catch (error) {
            console.error('Fetch error', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleAddFaculty = async () => {
        try {
            await coordApi.createFaculty({
                name: newFaculty.name,
                email: newFaculty.email,
                password: newFaculty.password || undefined
            });
            toast.success('Faculty invited successfully');
            setIsAddModalOpen(false);
            setNewFaculty({ name: '', email: '', password: '' });
            fetchInitialData();
        } catch (error) {
            toast.error('Failed to create faculty');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                // Normalizing data based on user format or standard format
                const normalized = data.map((row: any) => ({
                    name: row.name || row.fullName || row.full_name || '',
                    email: row.email || '',
                    password: row.password || row.password_hash || 'pass123',
                    batch_id: row.batch_id || row.batchId || null,
                    role: 'guide'
                }));

                setBulkData(normalized);
                toast.success(`Loaded ${normalized.length} faculty from ${file.name}`);
            } catch (err) {
                console.error('File parsing error:', err);
                toast.error('Failed to parse file. Ensure it is a valid CSV or XLSX.');
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleStartProcessing = async () => {
        if (bulkData.length === 0) return;
        
        setIsProcessing(true);
        try {
            await coordApi.bulkImportFaculty({ faculty: bulkData });
            toast.success(`Successfully imported ${bulkData.length} faculty members`);
            setIsAddModalOpen(false);
            setBulkData([]);
            setFileName(null);
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to import faculty');
        } finally {
            setIsProcessing(false);
        }
    };
    

    const filteredFaculty = facultyList.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                              f.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || 
                             (statusFilter === 'Pending' && f.status === 'pending') || 
                             (statusFilter === 'Active' && f.status === 'active') ||
                             (statusFilter === 'On Leave' && f.status === 'on_leave');
        return matchesSearch && matchesStatus;
    });

    const handleUpdateFaculty = async () => {
        if (!editingFaculty) return;
        try {
            await coordApi.updateFaculty(editingFaculty.id, { 
                name: editingFaculty.name, 
                status: editingFaculty.status 
            });
            toast.success('Faculty profile updated successfully');
            setEditingFaculty(null);
            fetchInitialData();
        } catch (error) {
            toast.error('Failed to update faculty profile');
        }
    };

    const headers = [
        'Faculty Details', 
        'Specialization', 
        'Batches', 
        'Project Load', 
        'Status', 
        'Actions'
    ];

    const rows = filteredFaculty.map(f => [
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] font-bold shadow-sm border border-[rgb(var(--color-primary))]/20">
                {f.name.charAt(0)}
            </div>
            <div>
                <p className="font-bold text-sm">{f.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--color-muted))]">
                    <Mail size={10} /> {f.email}
                </div>
            </div>
        </div>,
        <span className="text-xs font-semibold">{f.special || 'General'}</span>,
        <div className="flex items-center gap-1">
             <Briefcase size={12} className="text-gray-400" />
             <span className="text-xs font-bold">-</span>
        </div>,
        <div className="flex flex-col gap-1 w-24">
             <div className="flex justify-between text-[10px] font-bold">
                 <span>{f.load} Groups</span>
                 <span>{Math.round((f.load/10)*100)}%</span>
             </div>
             <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500" style={{ width: `${(f.load/10)*100}%` }}></div>
             </div>
        </div>,
        <Badge variant={f.status === 'pending' ? 'warning' : f.status === 'active' ? 'success' : 'default'} className="text-[10px]">
            {f.status === 'pending' ? 'Pending' : f.status === 'active' ? 'Active' : 'On Leave'}
        </Badge>,
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setEditingFaculty(f)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"
            >
                <Edit2 size={16} />
            </button>
            <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors">
                <Trash2 size={16} />
            </button>
        </div>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Faculty Hub</h1>
                    <p className="text-[rgb(var(--color-muted))]">Manage departmental faculty accounts and monitoring roles</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {setIsAddModalOpen(true); setActiveTab('bulk');}}>
                        <Upload size={18} className="mr-2" /> Bulk Import
                    </Button>
                    <Button variant="primary" onClick={() => {setIsAddModalOpen(true); setActiveTab('manual');}}>
                        <UserPlus size={18} className="mr-2" /> Add Faculty Account
                    </Button>
                </div>
            </div>

            <Card>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" size={16} />
                        <Input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email or specialization..."
                            className="pl-10"
                        />
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        {['All', 'Pending', 'Active', 'On Leave'].map((statusOption) => (
                            <button
                                key={statusOption}
                                onClick={() => setStatusFilter(statusOption as any)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                    statusFilter === statusOption 
                                        ? 'bg-white dark:bg-gray-700 shadow-sm text-[rgb(var(--color-primary))]' 
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {statusOption}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <Table headers={headers} rows={rows} />
                )}

            </Card>

            {/* Create Faculty Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Register New Faculty"
            >
                <div>
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
                        <button 
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <UserPlus size={14} /> Manual Entry
                        </button>
                        <button 
                            onClick={() => setActiveTab('bulk')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'bulk' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <FileSpreadsheet size={14} /> Spreadsheet Upload
                        </button>
                    </div>

                    {activeTab === 'manual' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl mb-6">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                                    This will immediately create a faculty account. They can login using their email and the password you set (default: pass123).
                                </p>
                            </div>

                            <div>
                                <Label>Full Name</Label>
                                <Input value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} placeholder="e.g. Dr. Robert Pattinson" />
                            </div>
                            <div>
                                <Label>Official Email</Label>
                                <Input type="email" value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} placeholder="faculty.name@university.edu" />
                            </div>
                            <div>
                                <Label>Password (Optional)</Label>
                                <Input type="password" value={newFaculty.password} onChange={e => setNewFaculty({...newFaculty, password: e.target.value})} placeholder="Default: pass123" />
                            </div>
                            <div>
                                <Label>Primary Department</Label>
                                <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-[rgb(var(--color-border))] rounded-md px-3 py-2 text-sm text-[rgb(var(--color-muted))]">
                                    Automatic (Same as your department)
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                                <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button variant="primary" className="flex-1" onClick={handleAddFaculty}>Create Account</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600">
                                    <Upload size={32} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Drop your faculty list here</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">Supports .xlsx, .xls</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx,.xls" 
                                    onChange={handleFileUpload}
                                />
                                <Button variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                                    {fileName ? 'Change File' : 'Choose File'}
                                </Button>
                                {fileName && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">
                                        <CheckCircle size={14} /> {fileName} ({bulkData.length} faculty)
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest flex items-center gap-1">
                                    <CheckCircle size={10} /> Supported Format
                                </p>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                                        uid, name, email, password_hash
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="primary" 
                                className="w-full" 
                                disabled={bulkData.length === 0 || isProcessing}
                                onClick={handleStartProcessing}
                            >
                                {isProcessing ? (
                                    <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                                ) : (
                                    `Start Processing ${bulkData.length > 0 ? `(${bulkData.length} faculty)` : ''}`
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
            {/* Edit Faculty Modal */}
            <Modal
                isOpen={!!editingFaculty}
                onClose={() => setEditingFaculty(null)}
                title="Edit Faculty Profile"
            >
                {editingFaculty && (
                    <div className="space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <Input 
                                value={editingFaculty.name} 
                                onChange={e => setEditingFaculty({...editingFaculty, name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <Label>Account Status</Label>
                            <select 
                                className="w-full bg-white dark:bg-gray-800 border border-[rgb(var(--color-border))] rounded-md px-3 py-2 text-sm text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editingFaculty.status}
                                onChange={e => setEditingFaculty({...editingFaculty, status: e.target.value})}
                            >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="on_leave">On Leave</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                            <Button variant="outline" className="flex-1" onClick={() => setEditingFaculty(null)}>Cancel</Button>
                            <Button variant="primary" className="flex-1" onClick={handleUpdateFaculty}>Save Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FacultyManagement;
