import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import { 
    Search, UserPlus, Mail, Briefcase, Edit2, Trash2 
} from 'lucide-react';

const FacultyManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Mock data based on expected schema
    const facultyList = [
        { id: 'f1', name: 'Dr. Sarah Johnson', email: 'sarah.j@univ.edu', specialization: 'Machine Learning', batches: 2, groups: 12, state: 'Active' },
        { id: 'f2', name: 'Prof. Michael Chen', email: 'm.chen@univ.edu', specialization: 'Network Security', batches: 1, groups: 6, state: 'Active' },
        { id: 'f3', name: 'Dr. Emily Williams', email: 'emily.w@univ.edu', specialization: 'Cloud Computing', batches: 3, groups: 15, state: 'Active' },
        { id: 'f4', name: 'Alex Rivera', email: 'alex.r@univ.edu', specialization: 'Software Eng', batches: 0, groups: 0, state: 'Inactive' },
    ];

    const filteredFaculty = facultyList.filter(f => 
        f.name.toLowerCase().includes(search.toLowerCase()) || 
        f.email.toLowerCase().includes(search.toLowerCase())
    );

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
        <span className="text-xs font-semibold">{f.specialization}</span>,
        <div className="flex items-center gap-1">
             <Briefcase size={12} className="text-gray-400" />
             <span className="text-xs font-bold">{f.batches}</span>
        </div>,
        <div className="flex flex-col gap-1 w-24">
             <div className="flex justify-between text-[10px] font-bold">
                 <span>{f.groups} Groups</span>
                 <span>{Math.round((f.groups/15)*100)}%</span>
             </div>
             <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500" style={{ width: `${(f.groups/15)*100}%` }}></div>
             </div>
        </div>,
        <Badge variant={f.state === 'Active' ? 'success' : 'default'} className="text-[10px]">
            {f.state}
        </Badge>,
        <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
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
                        <button className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-gray-700 shadow-sm rounded-md">All</button>
                        <button className="px-4 py-1.5 text-xs font-bold text-gray-500">Active</button>
                        <button className="px-4 py-1.5 text-xs font-bold text-gray-500">Inactive</button>
                    </div>
                </div>

                <Table headers={headers} rows={rows} />
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
                        <Input placeholder="e.g. Dr. Robert Pattinson" />
                    </div>
                    <div>
                        <Label>Official Email</Label>
                        <Input type="email" placeholder="faculty.name@university.edu" />
                    </div>
                    <div>
                        <Label>Primary Department</Label>
                        <select className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-md px-3 py-2 text-sm">
                            <option>Computer Applications (MCA)</option>
                            <option>Computer Science (MSc)</option>
                            <option>Information Technology</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1">Send Invitation</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FacultyManagement;
