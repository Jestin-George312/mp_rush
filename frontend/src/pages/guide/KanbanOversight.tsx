import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import { 
  ChevronRight, CheckCircle2
} from 'lucide-react';

const KanbanOversight: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState('All Batches');

  const groupBoards = [
    { 
      id: 'g1', 
      name: 'AlphaTech', 
      batch: 'MCA 2024-26 A',
      stats: { todo: 4, inProgress: 2, done: 12 },
      lastActivity: '3h ago',
      recentCompleted: 'Implement JWT Auth'
    },
    { 
      id: 'g2', 
      name: 'EcoNexus', 
      batch: 'MCA 2024-26 B',
      stats: { todo: 8, inProgress: 5, done: 4 },
      lastActivity: '1d ago',
      recentCompleted: 'Setup DB Schema'
    },
    { 
      id: 'g3', 
      name: 'Sentinel', 
      batch: 'MCA 2024-26 A',
      stats: { todo: 2, inProgress: 0, done: 0 },
      lastActivity: 'Just Now',
      recentCompleted: 'Project Initialized'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Kanban Oversight</h1>
           <p className="text-gray-500">Read-only monitoring of project group task boards</p>
        </div>
        <select 
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-xs font-black"
        >
           <option>All Batches</option>
           <option>MCA 2024-26 A</option>
           <option>MCA 2024-26 B</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupBoards.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-all border-t-4 border-t-purple-500">
             <div className="space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="text-lg font-black">{group.name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.batch}</p>
                   </div>
                   <div className="text-[9px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                      SYNCED: {group.lastActivity}
                   </div>
                </div>

                {/* Progress bars */}
                <div className="grid grid-cols-3 gap-2">
                   <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                      <p className="text-lg font-black text-gray-800 dark:text-gray-100">{group.stats.todo}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Todo</p>
                   </div>
                   <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400">{group.stats.inProgress}</p>
                      <p className="text-[8px] font-black text-blue-400 uppercase">Doing</p>
                   </div>
                   <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                      <p className="text-lg font-black text-green-600 dark:text-green-400">{group.stats.done}</p>
                      <p className="text-[8px] font-black text-green-400 uppercase">Done</p>
                   </div>
                </div>

                <div className="py-3 border-y border-gray-50 dark:border-gray-700">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Recently Completed</p>
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="truncate">{group.recentCompleted}</span>
                   </div>
                </div>

                <button className="w-full py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-[10px] font-black hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2">
                   INSPECT READ-ONLY BOARD <ChevronRight size={14} />
                </button>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KanbanOversight;
