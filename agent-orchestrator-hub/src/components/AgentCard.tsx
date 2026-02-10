import { motion } from 'framer-motion';
import { Bot, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/store/agentStore';
import { AI_PROVIDERS } from '@/types';
import type { Agent } from '@/types';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
}

export function AgentCard({ agent, onEdit }: AgentCardProps) {
  const { deleteAgent } = useAgentStore();
  const provider = AI_PROVIDERS.find((p) => p.id === agent.modelProvider);

  const handleDelete = () => {
    deleteAgent(agent.id);
    toast.success('تم حذف الوكيل بنجاح');
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className="glass-card p-5 group hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">
            {provider?.icon || '🤖'}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{provider?.name} · {agent.modelId}</p>
          </div>
        </div>
      </div>

      {agent.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{agent.description}</p>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
        <Link to={`/chat?agent=${agent.id}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/10">
            <MessageSquare className="w-3.5 h-3.5" />
            محادثة
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => onEdit(agent)} className="gap-1 text-muted-foreground hover:text-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} className="gap-1 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
