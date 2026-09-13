import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  CheckCircle2, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  CloudLightning,
  AlertTriangle,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleTaskItem } from '../../types';

interface GoogleTasksScreenProps {
  tasks: GoogleTaskItem[];
  isConnected: boolean;
  userEmail: string;
  onConnectOAuth: () => void;
  onAddTask: (title: string, notes?: string, tier?: string) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onBatchPushChecklist: () => Promise<void>;
}

export const GoogleTasksScreen: React.FC<GoogleTasksScreenProps> = ({
  tasks,
  isConnected,
  userEmail,
  onConnectOAuth,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onBatchPushChecklist
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newTier, setNewTier] = useState('Tier 1: Post-Quantum Enclave');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchPushing, setIsBatchPushing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'COMPLETED'>('ALL');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddTask(newTitle.trim(), newNotes.trim() || undefined, newTier);
      setNewTitle('');
      setNewNotes('');
      try {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      } catch (err) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchPush = async () => {
    setIsBatchPushing(true);
    try {
      await onBatchPushChecklist();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (err) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsBatchPushing(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'OPEN') return t.status === 'needsAction';
    if (filter === 'COMPLETED') return t.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
              GOOGLE WORKSPACE INTEGRATION
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Google Tasks Security Operations Sync
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Bidirectional synchronization of zero-trust action items, threat mitigations, and AWS production deployment checklists with your Google Tasks account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchPush}
            disabled={isBatchPushing}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isBatchPushing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudLightning className="w-4 h-4" />}
            <span>Sync AEGIS Production Suite</span>
          </button>
        </div>
      </div>

      {/* Account & OAuth Connection Status */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm text-xs">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            isConnected 
              ? 'bg-blue-950/60 border-blue-500/40 text-blue-400'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Google Workspace Account:</span>
              <span className="text-blue-300 font-mono font-medium">{userEmail}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Scope: <code className="text-cyan-300">https://www.googleapis.com/auth/tasks</code> (Attested)
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={onConnectOAuth}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition text-xs font-medium cursor-pointer"
          >
            {isConnected ? 'Re-Authenticate OAuth' : 'Connect Google Tasks'}
          </button>
        </div>
      </div>

      {/* Create New Task Form */}
      <form onSubmit={handleCreateTask} className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Create Security Action Item</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title (e.g. 'Deploy Kyber-1024 Key Rotation Daemon on AWS Nitro')..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <select
              value={newTier}
              onChange={(e) => setNewTier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option>Tier 1: Post-Quantum Enclave</option>
              <option>Tier 2: Biometric Attestation</option>
              <option>Tier 3: Zero-Trust Defense</option>
              <option>Tier 4: AWS Production Deployment</option>
            </select>
          </div>
        </div>

        <div>
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Optional detailed notes, hashes, or audit requirements..."
            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newTitle.trim()}
            className="px-4 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Add to Google Tasks</span>
          </button>
        </div>
      </form>

      {/* Task List Pane */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Live Tasks List ({filteredTasks.length})</h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-slate-900 p-1 rounded border border-slate-800">
            {(['ALL', 'OPEN', 'COMPLETED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded transition cursor-pointer font-medium ${
                  filter === f ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-lg border flex items-start justify-between gap-3 transition ${
                task.status === 'completed'
                  ? 'bg-slate-900/40 border-slate-800 opacity-60'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition cursor-pointer ${
                    task.status === 'completed'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-600 hover:border-blue-400 bg-slate-900'
                  }`}
                >
                  {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </span>
                    {task.securityTier && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 text-blue-300 border border-blue-500/30">
                        {task.securityTier}
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{task.notes}</p>
                  )}
                  {task.due && (
                    <span className="text-[10px] text-slate-500 block mt-1 font-mono">Due: {task.due}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              No tasks found in current view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
