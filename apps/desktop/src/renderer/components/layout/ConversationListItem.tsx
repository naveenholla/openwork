'use client';

import { useNavigate, useLocation } from 'react-router-dom';
import type { Task } from '@accomplish/shared';
import { useTaskStore } from '@/stores/taskStore';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, Trash2 } from 'lucide-react';

interface ConversationListItemProps {
  task: Task;
}

export default function ConversationListItem({ task }: ConversationListItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { deleteTask } = useTaskStore();
  const isActive = location.pathname === `/execution/${task.id}`;

  const handleClick = () => {
    navigate(`/execution/${task.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteTask(task.id);
  };

  const getStatusIcon = () => {
    if (task.status === 'running') {
      return <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />;
    }
    if (task.status === 'completed') {
      return <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />;
    }
    return null;
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200',
        'text-zinc-700 hover:bg-accent hover:text-accent-foreground',
        'flex items-center gap-2 group',
        isActive && 'bg-accent text-accent-foreground'
      )}
    >
      {getStatusIcon()}
      <span className="block truncate flex-1">{task.prompt}</span>
      <Trash2
        className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
        onClick={handleDelete}
      />
    </button>
  );
}
