import React, { useState, useRef, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Select from '../../components/common/UI/Select';
import { 
    Search, UserPlus, Upload,
    AtSign, Hash, Layers, CheckCircle, 
    AlertTriangle, FileSpreadsheet, Loader2
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const StudentManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [batchFilter, setBatchFilter] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [students, setStudents] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', email: '', batch_id: '', password: '' });
    
    // Bulk state
    const [bulkData, setBulkData] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [targetBatchId, setTargetBatchId] = useState<string>('');

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [studentsRes, batchesRes] = await Promise.all([
                coordApi.getStudents(),
                coordApi.getBatches()
            ]);
            if (studentsRes.data?.success) setStudents(studentsRes.data.data);
            if (batchesRes.data?.success) setBatches(batchesRes.data.data);
        } catch (error) {
            toast.error('Failed to load students data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleCreateStudent = async () => {
        try {
            await coordApi.createStudent({
                name: newStudent.name,
                email: newStudent.email,
                password: newStudent.password || undefined,
                batch_id: parseInt(batchFilter)
            });
            toast.success('Student registered successfully');
            setIsAddModalOpen(false);
            setNewStudent({ name: '', email: '', batch_id: '', password: '' });
            fetchInitialData();
        } catch (error) {
            toast.error('Failed to create student');
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
                    auth_provider: row.auth_provider || row.authProvider || 'local',
                    role: row.role || 'student'
                }));

                setBulkData(normalized);
                toast.success(`Loaded ${normalized.length} students from ${file.name}`);
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
            // Priority: 1. Row-level batch_id from file, 2. Current page filter
            const finalData = bulkData.map(s => ({
                ...s,
                batch_id: s.batch_id || parseInt(batchFilter)
            }));

            const missingBatch = finalData.find(s => !s.batch_id);
            if (missingBatch) {
                toast.error('No target batch selected. Please select a batch where these students should be added.');
                setIsProcessing(false);
                return;
            }

            await coordApi.bulkImportStudents({ students: finalData });
            toast.success(`Successfully imported ${finalData.length} students`);
            setIsAddModalOpen(false);
            setBulkData([]);
            setFileName(null);
            setTargetBatchId('');
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to import students');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateStudent = async () => {
        if (!editingStudent) return;
        try {
            await coordApi.updateStudent(editingStudent.uid, {
                name: editingStudent.full_name,
                email: editingStudent.email,
                batch_id: editingStudent.batch_id
            });
            toast.success('Student updated successfully');
            setIsEditModalOpen(false);
            fetchInitialData();
        } catch (error) {
            toast.error('Failed to update student');
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this student account?')) return;
        try {
            await coordApi.deleteStudent(id);
            toast.success('Student account deleted');
            fetchInitialData();
        } catch (error) {
            toast.error('Failed to delete student');
        }
    };


    const filteredStudents = students.filter(s => {
        const name = s.full_name || '';
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchBatch = batchFilter === 'All' || s.batch_id === parseInt(batchFilter);
        return matchSearch && matchBatch;
    });

    const headers = [
        'Student Profile', 
        'Academic Info', 
        'Guide & Group', 
        'System Status', 
        'Actions'
    ];

    const rows = filteredStudents.map(s => [
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shadow-sm
                ${s.group_name ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {(s.full_name || '?').charAt(0)}
            </div>
            <div>
                <p className="font-bold text-sm leading-tight">{s.full_name}</p>
                <div className="flex items-center gap-1 text-[10px] text-[rgb(var(--color-muted))] mt-0.5">
                    <AtSign size={10} /> {s.email}
                </div>
            </div>
        </div>,
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--color-muted))]">
                 <Layers size={11} className="text-gray-400" /> {s.batch_name || 'No Batch'}
            </div>
            {s.is_leader && (
                <Badge variant="warning" className="text-[9px] px-1.5 py-0 items-center justify-center max-w-max">Team Leader</Badge>
            )}
        </div>,
        <div className="flex flex-col gap-0.5 min-w-[120px]">
            {s.group_name ? (
                <p className="text-[10px] text-blue-500 font-medium italic">Group: {s.group_name}</p>
            ) : (
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                    <AlertTriangle size={10} /> No Group
                </div>
            )}
            {s.temp_guide_name && (
                <p className="text-[10px] text-purple-600 font-bold mt-1">Temp Guide: {s.temp_guide_name}</p>
            )}
        </div>,
        <Badge variant={s.group_name ? 'success' : (s.temp_guide_name ? 'warning' : 'danger')}>
            {s.group_name ? 'Assigned' : (s.temp_guide_name ? 'Temp Assigned' : 'Unassigned')}
        </Badge>,
        <div className="flex items-center gap-2">
            <button 
                onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }}
                className="px-2.5 py-1.5 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded transition-colors"
            >
                Edit
            </button>
            <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
            <button 
                onClick={() => handleDeleteStudent(s.uid)}
                className="px-2.5 py-1.5 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors"
            >
                Delete
            </button>
        </div>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Departmental Student Roster</h1>
                    <p className="text-[rgb(var(--color-muted))]">Enrol students and manage their project lifecycle status within your department</p>
                </div>
                <div className="flex gap-2">
                    {batches.length === 0 ? (
                        <div className="text-sm text-orange-500 font-bold bg-orange-50 px-3 py-1.5 rounded-lg flex items-center border border-orange-100">
                            Create a batch first to add students
                        </div>
                    ) : batchFilter === 'All' ? (
                        <div className="text-sm text-blue-500 font-bold bg-blue-50 px-3 py-1.5 rounded-lg flex items-center border border-blue-100">
                            Select a batch to add students
                        </div>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => {setIsAddModalOpen(true); setActiveTab('bulk');}}>
                                <Upload size={18} className="mr-2" /> Bulk Import
                            </Button>
                            <Button variant="primary" onClick={() => {setIsAddModalOpen(true); setActiveTab('manual');}}>
                                <UserPlus size={18} className="mr-2" /> Register Student
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Filter Bar */}
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" size={16} />
                        <Input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or roll number..."
                            className="pl-10 h-10 shadow-none border-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filter:</span>
                             <Select 
                                value={batchFilter}
                                onChange={e => setBatchFilter(e.target.value)}
                                className="w-48 h-10 border-gray-200"
                             >
                                <option value="All">All Batches</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                             </Select>
                        </div>
                        
                        {batchFilter !== 'All' && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-10 text-[10px] font-black border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white"
                                onClick={async () => {
                                    if (!window.confirm('This will randomly distribute unassigned students to active faculty in this batch. Proceed?')) return;
                                    try {
                                        setIsLoading(true);
                                        await coordApi.autoAssignTempGuides(parseInt(batchFilter));
                                        toast.success('Temporary guides auto-assigned');
                                        fetchInitialData();
                                    } catch (error: any) {
                                        toast.error(error.response?.data?.message || 'Allocation failed');
                                        setIsLoading(false);
                                    }
                                }}
                            >
                                <Layers size={14} className="mr-2" /> Auto-assign Temp Guides
                            </Button>
                        )}

                        <div className="w-px h-6 bg-gray-200 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                           <Badge variant="danger">{students.filter(s => !s.guide).length} Unassigned</Badge>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden border-none shadow-xl shadow-gray-100 dark:shadow-none">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <Table headers={headers} rows={rows} />
                )}
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={activeTab === 'manual' ? 'Register New Student' : 'Bulk Import Students'}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Full Name</Label>
                                    <Input value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} placeholder="e.g. Alice Cooper" />
                                </div>
                                <div>
                                    <Label>Roll Number</Label>
                                    <Input placeholder="Not needed" disabled />
                                </div>
                            </div>
                            <div>
                                <Label>Official Email</Label>
                                <Input type="email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} placeholder="student@university.edu" />
                            </div>
                            <div>
                                <Label>Password (Optional)</Label>
                                <Input type="password" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} placeholder="Default: pass123" />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                                <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button variant="primary" className="flex-1" onClick={handleCreateStudent}>Add Student</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600">
                                    <Upload size={32} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Drop your student list here</p>
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
                                        <CheckCircle size={14} /> {fileName} ({bulkData.length} students)
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
                                    <p className="text-[10px] text-orange-500 italic">
                                        * Note: batch_id will be automatically set to the current selected batch ({batches.find(b => b.id === parseInt(batchFilter))?.name}) unless specifically overridden in the file.
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
                                    `Start Processing ${bulkData.length > 0 ? `(${bulkData.length} students)` : ''}`
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Student Profile"
            >
                {editingStudent && (
                    <div className="space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <Input 
                                value={editingStudent.full_name} 
                                onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <Label>Official Email</Label>
                            <Input 
                                type="email"
                                value={editingStudent.email} 
                                onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} 
                            />
                        </div>
                        <div>
                            <Label>Academic Batch</Label>
                            <Select 
                                value={editingStudent.batch_id} 
                                onChange={e => setEditingStudent({...editingStudent, batch_id: parseInt(e.target.value)})}
                            >
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                            <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" className="flex-1" onClick={handleUpdateStudent}>Save Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentManagement;
