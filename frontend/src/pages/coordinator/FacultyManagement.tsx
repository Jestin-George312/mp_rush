import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import { 
    Search, UserPlus, Mail, Briefcase, Edit2, Trash2, Loader2
} from 'lucide-react';
import * as coordApi from '../../services/coordinatorApi';
import { toast } from 'react-hot-toast';

const FacultyManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [facultyList, setFacultyList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newFaculty, setNewFaculty] = useState({ name: '', email: '' });
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const [editingFaculty, setEditingFaculty] = useState<any | null>(null);

    const fetchFaculty = async () => {
        try {
            setIsLoading(true);
            const res = await coordApi.getFaculty();
            if (res.data?.success) {
                setFacultyList(res.data.data);
            }
        } catch (error) {
            console.error('Fetch faculty error', error);
            toast.error('Failed to load faculty');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFaculty();
    }, []);

    const handleAddFaculty = async () => {
        try {
            await coordApi.createFaculty(newFaculty);
            toast.success('Faculty invited successfully');
            setIsAddModalOpen(false);
            setNewFaculty({ name: '', email: '' });
            fetchFaculty();
        } catch (error) {
            toast.error('Failed to create faculty');
        }
    };
    

    const filteredFaculty = facultyList.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                              f.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || 
                             (statusFilter === 'Active' && f.load > 0) || 
                             (statusFilter === 'Inactive' && f.load === 0);
        return matchesSearch && matchesStatus;
    });

    const handleUpdateFaculty = async () => {
        if (!editingFaculty) return;
        try {
            await coordApi.updateFaculty(editingFaculty.id, { 
                name: editingFaculty.name, 
                bio: editingFaculty.special 
            });
            toast.success('Faculty profile updated successfully');
            setEditingFaculty(null);
            fetchFaculty();
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
        <Badge variant={f.load < 10 ? 'success' : 'default'} className="text-[10px]">
            {f.load < 10 ? 'Active' : 'Full'}
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
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus size={18} className="mr-2" /> Add Faculty Account
                </Button>
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
                        {['All', 'Active', 'Inactive'].map((statusOption) => (
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
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl mb-6">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                            Creating an account will send an automated invitation to the faculty's email. They will be required to set their specialization upon first login.
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
                        <Label>Primary Department</Label>
                        <select className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-md px-3 py-2 text-sm">
                            <option>Computer Applications (MCA)</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1" onClick={handleAddFaculty}>Send Invitation</Button>
                    </div>
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
                            <Label>Specialization / Bio</Label>
                            <Input 
                                value={editingFaculty.special} 
                                onChange={e => setEditingFaculty({...editingFaculty, special: e.target.value})} 
                            />
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
