import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Table from '../../components/common/UI/Table';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Select from '../../components/common/UI/Select';
import { 
    Users, AlertCircle, Star, LayoutGrid,
    CheckCircle2, Info
} from 'lucide-react';

const GuideAssignment: React.FC = () => {
    const [selectedBatch, setSelectedBatch] = useState('MCA 2024-26 A');

    // Mocks for assignment workflow
    const faculty = [
        { id: 'f1', name: 'Dr. Sarah Johnson', load: 8, max: 10, special: 'AI/ML' },
        { id: 'f2', name: 'Prof. Michael Chen', load: 3, max: 10, special: 'Networks' },
        { id: 'f3', name: 'Dr. Emily Williams', load: 12, max: 10, special: 'Cloud' },
        { id: 'f4', name: 'Alex Rivera', load: 0, max: 6, special: 'DevOps' },
    ];

    const groups = [
        { id: 'g1', title: 'E-Commerce using React', type: 'Group', members: 3, guide: 'Dr. Sarah Johnson', status: 'Assigned' },
        { id: 'g2', title: 'Intrusion Detection System', type: 'Group', members: 2, guide: null, status: 'Pending' },
        { id: 'g3', title: 'Personal Expense Tracker', type: 'Individual', members: 1, guide: null, status: 'Pending' },
        { id: 'g4', title: 'Smart Agriculture IoT', type: 'Group', members: 3, guide: 'Prof. Michael Chen', status: 'Assigned' },
    ];

    const unassignedCount = groups.filter(g => !g.guide).length;

    const groupHeaders = ['Project Concept', 'Type', 'Members', 'Assigned Guide', 'Quick Assign'];
    const groupRows = groups.map(g => [
        <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight">{g.title || 'Topic Not Submitted'}</span>
            <span className="text-[10px] text-[rgb(var(--color-muted))] uppercase font-black">ID: {g.id}</span>
        </div>,
        <Badge variant={g.type === 'Group' ? 'info' : 'secondary'} className="text-[10px]">{g.type}</Badge>,
        <div className="flex items-center gap-1">
             <Users size={12} className="text-gray-400" />
             <span className="text-xs font-bold">{g.members}</span>
        </div>,
        g.guide ? (
            <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                <CheckCircle2 size={14} /> {g.guide}
            </div>
        ) : (
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs animate-pulse">
                <AlertCircle size={14} /> UNALLOCATED
            </div>
        ),
        <Select className="h-8 text-[11px] font-bold border-none bg-gray-50 dark:bg-gray-800">
            <option>Select Faculty...</option>
            {faculty.map(f => (
                <option key={f.id} disabled={f.load >= f.max}>{f.name} ({f.load}/{f.max})</option>
            ))}
        </Select>
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Guide Assignment Wheel</h1>
                    <p className="text-[rgb(var(--color-muted))]">Distribute project workloads and map faculty expertise to student concepts</p>
                </div>
                <div className="flex items-center gap-3 bg-[rgb(var(--color-input))] p-2 rounded-xl border border-[rgb(var(--color-border))]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Batch:</span>
                    <Select 
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                        className="w-56 h-9 border-none bg-transparent font-black text-xs"
                    >
                        <option>MCA 2024-26 A</option>
                        <option>MCA 2024-26 B</option>
                        <option>MSc CS 2023-25</option>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Faculty Load Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-full">
                        <div className="flex items-center justify-between mb-4 border-b border-[rgb(var(--color-border))] pb-4">
                             <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <LayoutGrid size={14} /> Faculty Load
                             </h3>
                             <Badge variant="warning" className="text-[9px]">{faculty.length} Mentors</Badge>
                        </div>
                        <div className="space-y-4">
                            {faculty.map(f => {
                                const isOverloaded = f.load > f.max;
                                return (
                                    <div key={f.id} className={`p-3 rounded-xl border transition-all ${isOverloaded ? 'border-red-200 bg-red-50/30' : 'border-[rgb(var(--color-border))] bg-gray-50/30'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs font-black truncate max-w-[120px]">{f.name}</p>
                                                <p className="text-[9px] text-[rgb(var(--color-muted))] uppercase font-bold">{f.special}</p>
                                            </div>
                                            <span className={`text-[10px] font-black ${isOverloaded ? 'text-red-600' : 'text-blue-600'}`}>{f.load}/{f.max}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${isOverloaded ? 'bg-red-500' : 'bg-blue-500'}`} 
                                                style={{ width: `${Math.min((f.load / f.max) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        {isOverloaded && (
                                            <div className="flex items-center gap-1 mt-2 text-red-600 animate-pulse">
                                                <AlertCircle size={10} />
                                                <span className="text-[9px] font-black uppercase tracking-tight">Overloaded</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
                             <Info size={16} className="text-blue-600 flex-shrink-0" />
                             <p className="text-[10px] leading-relaxed text-blue-700 dark:text-blue-300 font-medium">
                                Guide load is calculated against a departmetal limit of 10 groups per mentor. Unassigned batches will show up as zero load.
                             </p>
                        </div>
                    </Card>
                </div>

                {/* Main Assignment Area */}
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-8 border-b border-[rgb(var(--color-border))] pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Star size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Unallocated Groups</h2>
                                    <p className="text-xs font-medium text-[rgb(var(--color-muted))]">Found {unassignedCount} groups needing a faculty mentor</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="text-[10px] h-8 font-black uppercase">Auto-Balance</Button>
                                <Button variant="primary" size="sm" className="text-[10px] h-8 font-black uppercase">Publish Changes</Button>
                            </div>
                        </div>

                        <Table headers={groupHeaders} rows={groupRows} />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GuideAssignment;
