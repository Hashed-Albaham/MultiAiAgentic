import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { AI_PROVIDERS } from '@/types';

interface AgentNodeData {
  label: string;
  provider: string;
  icon: string;
  agentId: string;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

const statusStyles: Record<string, string> = {
  pending: 'border-border',
  running: 'border-chart-4 shadow-[0_0_15px_hsl(45,90%,55%,0.3)]',
  completed: 'border-primary shadow-[0_0_15px_hsl(110,100%,33%,0.3)]',
  failed: 'border-destructive shadow-[0_0_15px_hsl(0,72%,51%,0.3)]',
  skipped: 'border-muted-foreground opacity-50',
};

const statusIcons: Record<string, string> = {
  pending: '⏳',
  running: '⚡',
  completed: '✓',
  failed: '✗',
};

function AgentNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const status = nodeData.status || 'pending';
  const { setNodes, setEdges } = useReactFlow();
  const { agents } = useAgentStore();
  const [showReplace, setShowReplace] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // حذف العقدة + كل الروابط المتصلة
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setNodes((nds) => nds.filter((n) => n.id !== id));
  };

  // استبدال الوكيل
  const handleReplace = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const provider = AI_PROVIDERS.find((p) => p.id === agent.modelProvider);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
            ...n,
            data: {
              ...n.data,
              label: agent.name,
              provider: provider?.name || '',
              icon: provider?.icon || '🤖',
              agentId: agent.id,
              status: 'pending',
            },
          }
          : n
      )
    );
    setShowReplace(false);
  };

  return (
    <div
      className={cn(
        'glass-card px-5 py-4 min-w-[180px] border-2 transition-all duration-300 relative group',
        statusStyles[status] || statusStyles.pending,
        selected && 'ring-2 ring-primary/50'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReplace(false); }}
    >
      {/* مقبض الإدخال */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-lg',
          status === 'running' ? 'bg-chart-4/20 animate-pulse' : 'bg-primary/10'
        )}>
          {status === 'running' ? '⚡' : nodeData.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{nodeData.label}</p>
          <p className="text-[10px] text-muted-foreground">{nodeData.provider}</p>
        </div>
        {status !== 'pending' && (
          <span className={cn(
            'text-xs font-bold',
            status === 'completed' && 'text-primary',
            status === 'failed' && 'text-destructive',
            status === 'running' && 'text-chart-4',
          )}>
            {statusIcons[status]}
          </span>
        )}
      </div>

      {/* أزرار التحكم — تظهر عند hover */}
      {(showActions || selected) && (
        <div className="absolute -top-2 -left-2 flex gap-0.5 z-10" dir="rtl">
          {/* حذف العقدة */}
          <button
            onClick={handleDelete}
            className="w-5 h-5 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center shadow-md transition-colors"
            title="حذف العقدة"
          >
            <Trash2 className="w-2.5 h-2.5 text-destructive-foreground" />
          </button>
          {/* استبدال الوكيل */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowReplace(!showReplace); }}
            className="w-5 h-5 rounded-full bg-chart-4/90 hover:bg-chart-4 flex items-center justify-center shadow-md transition-colors"
            title="استبدال الوكيل"
          >
            <RefreshCw className="w-2.5 h-2.5 text-background" />
          </button>
        </div>
      )}

      {/* قائمة الاستبدال */}
      {showReplace && (
        <div className="absolute top-full left-0 mt-1 z-20 min-w-[200px] nodrag nopan">
          <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-2 space-y-1 max-h-48 overflow-y-auto" dir="rtl">
            <p className="text-[10px] text-muted-foreground font-semibold px-2 py-1">استبدال بـ:</p>
            {agents
              .filter((a) => a.id !== nodeData.agentId)
              .map((agent) => {
                const p = AI_PROVIDERS.find((pr) => pr.id === agent.modelProvider);
                return (
                  <button
                    key={agent.id}
                    onClick={(e) => { e.stopPropagation(); handleReplace(agent.id); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary text-xs text-foreground transition-colors text-right"
                  >
                    <span>{p?.icon || '🤖'}</span>
                    <span className="truncate">{agent.name}</span>
                  </button>
                );
              })}
            {agents.filter((a) => a.id !== nodeData.agentId).length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2">لا يوجد وكلاء آخرين</p>
            )}
          </div>
        </div>
      )}

      {/* مقبض الإخراج */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-accent !border-2 !border-background"
      />
    </div>
  );
}

export default memo(AgentNode);
