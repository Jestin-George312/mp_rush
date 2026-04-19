import React from 'react';
import Card from '../../../components/common/UI/Card';
import Badge from '../../../components/common/UI/Badge';
import { Clock } from 'lucide-react';

export type Task = {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string; // ISO
};

interface TaskCardProps {
  task: Task;
}

const priorityVariant = (p: Task['priority']) => {
  switch (p) {
    case 'High':
      return 'danger';
    case 'Medium':
      return 'warning';
    default:
      return 'default';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{task.title}</div>
          <div className="flex items-center gap-2 mt-2 text-sm text-[rgb(var(--color-muted))]">
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{new Date(task.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
