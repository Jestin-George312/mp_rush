import React, { useState, useEffect } from 'react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Table from '../../components/common/UI/Table';
import Select from '../../components/common/UI/Select';
import { 
    Plus, Trash2, Building2, LayoutDashboard, 
    UserPlus, Users, Briefcase, CheckCircle2, 
    AlertCircle, Link as LinkIcon 
} from 'lucide-react';
import * as adminApi from '../../services/adminApi';
import { toast } from 'react-hot-toast';

interface Department {
    id: number;
    name: string;
    coordinator_id: number | null;
    coordinator_name: string | null;
    created_at: string;
}

interface Coordinator {
    uid: number;
    name: string;
    email: string;
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'departments' | 'coordinators' | 'assignments'>('departments');
    
    // Departments state
    const [departments, setDepartments] = useState<Department[]>([
        { id: 1, name: 'Computer Science', coordinator_id: 101, coordinator_name: 'Dr. Sarah Johnson', created_at: '2024-01-01' },
        { id: 2, name: 'Information Technology', coordinator_id: null, coordinator_name: null, created_at: '2024-01-01' },
    ]);
    const [newDeptName, setNewDeptName] = useState('');
    
    // Coordinators state
    const [coordinators, setCoordinators] = useState<Coordinator[]>([
        { uid: 101, name: 'Dr. Sarah Johnson', email: 'sarah@univ.edu' },
        { uid: 102, name: 'Prof. Michael Chen', email: 'michael@univ.edu' },
    ]);
    const [newCoord, setNewCoord] = useState({ name: '', email: '', password: '' });
    
    // Assignments state
    const [assignment, setAssignment] = useState({ departmentId: '', coordinatorId: '' });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'departments') {
                const data = await adminApi.getDepartments();
                if (data && Array.isArray(data)) setDepartments(data);
            } else if (activeTab === 'coordinators') {
                const data = await adminApi.getCoordinators();
                if (data && Array.isArray(data)) setCoordinators(data);
            } else if (activeTab === 'assignments') {
                const resDepts = await adminApi.getDepartments();
                const resCoords = await adminApi.getCoordinators();
                if (resDepts && Array.isArray(resDepts)) setDepartments(resDepts);
                if (resCoords && Array.isArray(resCoords)) setCoordinators(resCoords);
            }
        } catch (error) {
            console.error('Failed to load real data, falling back to mocks:', error);
            // On error, we silently preserve the existing mock state
        } finally {
            setIsLoading(false);
        }
    };

    // --- Department Actions ---
    const handleAddDept = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.addDepartment(newDeptName);
            toast.success('Department added');
            setNewDeptName('');
            loadData();
        } catch (error) {
            toast.error('Failed to add department');
        }
    };

    const handleDeleteDept = async (id: number) => {
        if (!window.confirm('Delete this department?')) return;
        try {
            await adminApi.deleteDepartment(id);
            toast.success('Department deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete department');
        }
    };

    // --- Coordinator Actions ---
    const handleAddCoord = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.addCoordinator(newCoord);
            toast.success('Coordinator created');
            setNewCoord({ name: '', email: '', password: '' });
            loadData();
        } catch (error) {
            toast.error('Failed to create coordinator');
        }
    };

    // --- Assignment Actions ---
    const handleAssignCoord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment.departmentId || !assignment.coordinatorId) return;
        try {
            await adminApi.assignCoordinatorToDepartment(
                parseInt(assignment.departmentId), 
                parseInt(assignment.coordinatorId)
            );
            toast.success('Coordinator assigned to department');
            loadData();
        } catch (error) {
            toast.error('Assignment failed');
        }
    };

    // --- Render Helpers ---
    const renderDepartments = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="h-fit">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-green-600" /> Add Department
                </h3>
                <form onSubmit={handleAddDept} className="space-y-4">
                    <div>
                        <Label>Name</Label>
                        <Input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} required />
                    </div>
                    <Button variant="primary" type="submit" className="w-full">Add</Button>
                </form>
            </Card>
            <Card className="lg:col-span-2">
                <Table 
                    headers={['ID', 'Name', 'Actions']}
                    rows={departments.map(d => [
                        d.id.toString(),
                        <span className="font-medium">{d.name}</span>,
                        <button onClick={() => handleDeleteDept(d.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                        </button>
                    ])}
                />
            </Card>
        </div>
    );

    const renderCoordinators = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="h-fit">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <UserPlus size={18} className="text-blue-600" /> Create Coordinator
                </h3>
                <form onSubmit={handleAddCoord} className="space-y-4">
                    <div>
                        <Label>Full Name</Label>
                        <Input value={newCoord.name} onChange={e => setNewCoord({...newCoord, name: e.target.value})} required />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input type="email" value={newCoord.email} onChange={e => setNewCoord({...newCoord, email: e.target.value})} required />
                    </div>
                    <div>
                        <Label>Password</Label>
                        <Input type="password" value={newCoord.password} onChange={e => setNewCoord({...newCoord, password: e.target.value})} required />
                    </div>
                    <Button variant="primary" type="submit" className="w-full">Create</Button>
                </form>
            </Card>
            <Card className="lg:col-span-2">
                <Table 
                    headers={['Name', 'Email', 'Role']}
                    rows={coordinators.map(c => [
                        <div className="font-medium">{c.name}</div>,
                        c.email,
                        <Badge variant="default">Coordinator</Badge>
                    ])}
                />
            </Card>
        </div>
    );

    const renderAssignments = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="h-fit">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <LinkIcon size={18} className="text-purple-600" /> Department Assignment
                </h3>
                <form onSubmit={handleAssignCoord} className="space-y-4">
                    <div>
                        <Label>Select Department</Label>
                        <Select value={assignment.departmentId} onChange={e => setAssignment({...assignment, departmentId: e.target.value})}>
                            <option value="">-- Choose Department --</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label>Select Coordinator</Label>
                        <Select value={assignment.coordinatorId} onChange={e => setAssignment({...assignment, coordinatorId: e.target.value})}>
                            <option value="">-- Choose Coordinator --</option>
                            {coordinators.map(c => (
                                <option key={c.uid} value={c.uid}>{c.name}</option>
                            ))}
                        </Select>
                    </div>
                    <Button variant="primary" type="submit" className="w-full" disabled={!assignment.departmentId || !assignment.coordinatorId}>
                        Assign
                    </Button>
                </form>
            </Card>
            <Card className="lg:col-span-2">
                <Table 
                    headers={['Department Name', 'Assigned Coordinator', 'Status']}
                    rows={departments.map(d => [
                        <div className="font-bold">{d.name}</div>,
                        d.coordinator_name ? (
                            <div className="flex items-center gap-2 text-green-600 font-medium">
                                <CheckCircle2 size={16} /> {d.coordinator_name}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-orange-500 italic">
                                <AlertCircle size={16} /> Unassigned
                            </div>
                        ),
                        d.coordinator_id ? (
                            <Badge variant="success">Active</Badge>
                        ) : (
                            <Badge variant="warning">Pending</Badge>
                        )
                    ])}
                />
            </Card>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <LayoutDashboard className="text-blue-600" size={24} />
                        </div>
                        Admin Dashboard
                    </h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[rgb(var(--color-border))]">
                <button
                    onClick={() => setActiveTab('departments')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'departments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2"><Building2 size={16} /> Departments</div>
                </button>
                <button
                    onClick={() => setActiveTab('coordinators')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'coordinators' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2"><Users size={16} /> Coordinators</div>
                </button>
                <button
                    onClick={() => setActiveTab('assignments')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'assignments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2"><Briefcase size={16} /> Department Assignment</div>
                </button>
            </div>

            {/* Content */}
            <div className="mt-6">
                {isLoading && (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                )}
                {!isLoading && activeTab === 'departments' && renderDepartments()}
                {!isLoading && activeTab === 'coordinators' && renderCoordinators()}
                {!isLoading && activeTab === 'assignments' && renderAssignments()}
            </div>
        </div>
    );
};

// Re-importing Badge specifically since it was used
const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' }> = ({ children, variant = 'default' }) => {
    const styles = {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>{children}</span>;
}

export default AdminDashboard;
