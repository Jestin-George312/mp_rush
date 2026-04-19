import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import TaskColumn from '../../components/student/tasks/TaskColumn';
import Button from '../../components/common/UI/Button';
import Card from '../../components/common/UI/Card';
import { fetchProjects } from '../../services/projectApi';
import { fetchTasks, updateTaskStatus, createTask } from '../../services/taskApi';
import toast from 'react-hot-toast';

export type Task = {
  id: string; // the backend returns number id but dnd uses strings
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
};

const initialColumns: Column[] = [
  { id: 'todo', title: 'Todo', tasks: [] },
  { id: 'inprogress', title: 'In Progress', tasks: [] },
  { id: 'done', title: 'Done', tasks: [] }
];

const TaskBoard: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [projectId, setProjectId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Get user's active project
    fetchProjects().then(res => {
      if (res.data && res.data.length > 0) {
        const pId = res.data[0].id;
        setProjectId(pId);
        loadTasks(pId);
      }
    }).catch(err => console.error(err));
  }, []);

  const loadTasks = (pid: number) => {
    fetchTasks(pid).then(res => {
      const items = res.data;
      const newCols = [
        { id: 'todo', title: 'Todo', tasks: items.filter((t: any) => t.status === 'todo').map(normalizeTask) },
        { id: 'inprogress', title: 'In Progress', tasks: items.filter((t: any) => t.status === 'inprogress').map(normalizeTask) },
        { id: 'done', title: 'Done', tasks: items.filter((t: any) => t.status === 'done').map(normalizeTask) }
      ];
      setColumns(newCols);
    });
  };

  const normalizeTask = (t: any): Task => ({
    id: String(t.id),
    title: t.title,
    priority: t.priority,
    deadline: t.deadline
  });

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic UI Update
    setColumns(prev => {
      const sourceColIdx = prev.findIndex(c => c.id === source.droppableId);
      const destColIdx = prev.findIndex(c => c.id === destination.droppableId);
      if (sourceColIdx === -1 || destColIdx === -1) return prev;

      if (sourceColIdx === destColIdx) {
        const column = { ...prev[sourceColIdx], tasks: [...prev[sourceColIdx].tasks] };
        const [moved] = column.tasks.splice(source.index, 1);
        column.tasks.splice(destination.index, 0, moved);
        const next = [...prev];
        next[sourceColIdx] = column;
        return next;
      }

      const sourceCol = { ...prev[sourceColIdx], tasks: [...prev[sourceColIdx].tasks] };
      const destCol = { ...prev[destColIdx], tasks: [...prev[destColIdx].tasks] };
      const [moved] = sourceCol.tasks.splice(source.index, 1);
      destCol.tasks.splice(destination.index, 0, moved);
      const next = [...prev];
      next[sourceColIdx] = sourceCol;
      next[destColIdx] = destCol;
      return next;
    });

    // Notify backend if moved to different column
    if (source.droppableId !== destination.droppableId) {
      try {
        await updateTaskStatus(parseInt(draggableId), destination.droppableId);
      } catch (e: any) {
        toast.error('Failed to sync task status');
        if (projectId) loadTasks(projectId); // Revert UI
      }
    }
  };

  const handleNewTask = async () => {
    if (!projectId) return alert('You must submit a project first!');
    const title = prompt('Enter Task Title:');
    if (!title) return;
    try {
      await createTask({ project_id: projectId, title, priority: 'Medium' });
      toast.success('Task Created!');
      loadTasks(projectId);
    } catch (e: any) {
      toast.error('Could not create task');
    }
  };

  return (
    <div className="h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Project Tasks</h2>
        <Button variant="primary" onClick={handleNewTask}>New Task</Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {columns.map(col => (
            <div key={col.id} className="flex flex-col h-full">
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{col.title}</div>
                  <div className="text-sm text-[rgb(var(--color-muted))]">{col.tasks.length}</div>
                </div>
                <div className="h-full">
                  <TaskColumn id={col.id} title={col.title} tasks={col.tasks} />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;
