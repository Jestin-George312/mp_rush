import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Modal from '../../components/common/UI/Modal';
import Badge from '../../components/common/UI/Badge';
import { 
  ChevronRight, CheckCircle2, Clock
} from 'lucide-react';

import { guideApi } from '../../services/guideApi';

const GroupKanbanCard = ({ group }: { group: any }) => {
  const [stats, setStats] = useState({ todo: 0, inprogress: 0, done: 0 });
  const [boardData, setBoardData] = useState<any>(null);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  
  React.useEffect(() => {
    guideApi.getGroupKanban(group.id).then(res => {
      const data = (res.data as any).data || res.data;
      setBoardData(data);
      setStats({
        todo: data.todo?.length || 0,
        inprogress: data.inprogress?.length || 0,
        done: data.done?.length || 0
      });
    }).catch(console.error);
  }, [group.id]);

  const TaskColumn = ({ title, tasks, color }: { title: string, tasks: any[], color: string }) => (
    <div className="space-y-3">
      <div className={`p-2 rounded-lg ${color} flex items-center justify-between`}>
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
        <span className="text-[10px] font-black opacity-60">{tasks.length}</span>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {tasks.length > 0 ? tasks.map((task: any) => (
          <div key={task.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
            <h4 className="text-xs font-bold mb-2">{task.title}</h4>
            <div className="flex items-center justify-between">
              <Badge variant={task.priority === 'High' ? 'danger' : 'secondary'} className="text-[8px] px-1.5 py-0">
                {task.priority}
              </Badge>
              {task.deadline && (
                <span className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                  <Clock size={10} /> {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )) : (
          <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
             <p className="text-[10px] font-bold text-gray-300 uppercase">No Tasks</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Card className="hover:shadow-lg transition-all border-t-4 border-t-purple-500">
         <div className="space-y-4">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-lg font-black">{group.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.batchName}</p>
               </div>
               <div className="text-[9px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                  SYNCED: Real-time
               </div>
            </div>

            {/* Progress bars */}
            <div className="grid grid-cols-3 gap-2">
               <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                  <p className="text-lg font-black text-gray-800 dark:text-gray-100">{stats.todo}</p>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Todo</p>
               </div>
               <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.inprogress}</p>
                  <p className="text-[8px] font-black text-blue-400 uppercase">Doing</p>
               </div>
               <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-lg font-black text-green-600 dark:text-green-400">{stats.done}</p>
                  <p className="text-[8px] font-black text-green-400 uppercase">Done</p>
               </div>
            </div>

            <div className="py-3 border-y border-gray-50 dark:border-gray-700">
               <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Project Phase</p>
               <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="truncate">{group.status || 'Active'}</span>
               </div>
            </div>

            <button 
              onClick={() => setIsBoardOpen(true)}
              className="w-full py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-[10px] font-black hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
               INSPECT READ-ONLY BOARD <ChevronRight size={14} />
            </button>
         </div>
      </Card>

      <Modal
        isOpen={isBoardOpen}
        onClose={() => setIsBoardOpen(false)}
        title={`${group.name} — Kanban Oversight`}
        maxWidth="max-w-5xl"
      >
        {boardData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1">
             <TaskColumn 
               title="To Do" 
               tasks={boardData.todo || []} 
               color="bg-gray-100 dark:bg-gray-800 text-gray-600" 
             />
             <TaskColumn 
               title="In Progress" 
               tasks={boardData.inprogress || []} 
               color="bg-blue-50 dark:bg-blue-900/30 text-blue-600" 
             />
             <TaskColumn 
               title="Completed" 
               tasks={boardData.done || []} 
               color="bg-green-50 dark:bg-green-900/30 text-green-600" 
             />
          </div>
        ) : (
          <div className="py-12 text-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
             <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Fetching Board Data...</p>
          </div>
        )}
      </Modal>
    </>
  );
};

const KanbanOversight: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [groups, setGroups] = useState<any[]>([]);

  React.useEffect(() => {
    guideApi.getSupervisedGroups().then(res => {
       const data = (res.data as any).data || res.data;
       setGroups(data);
    }).catch(console.error);
  }, []);

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
           <option value="All Batches">All Batches</option>
           {[...new Set(groups.map(g => g.batchName))].map(batch => (
             <option key={batch} value={batch}>{batch}</option>
           ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.filter(g => selectedBatch === 'All Batches' || g.batchName === selectedBatch).map((group) => (
           <GroupKanbanCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
};

export default KanbanOversight;
