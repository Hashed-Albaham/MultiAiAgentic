import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useAgentStore } from '@/store/agentStore';
import { useI18nStore } from '@/store/i18nStore';
import { AgentCard } from '@/components/AgentCard';
import { AgentFormDialog } from '@/components/AgentFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent } from '@/types';

export default function AgentsPage() {
  const { agents } = useAgentStore();
  const { t } = useI18nStore();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase()) ||
      a.modelProvider.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormOpen(true);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl pt-14 md:pt-6 lg:pt-8">
      <PageHeader
        title={t('agents.title')}
        description={t('agents.subtitle')}
        actions={
          <Button onClick={() => { setEditingAgent(undefined); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('agents.new')}
          </Button>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('agents.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 bg-card border-border"
        />
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onEdit={handleEdit} />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">{t('agents.empty')}</p>
          <p className="text-sm mt-1">{t('agents.emptyHint')}</p>
        </div>
      )}

      <AgentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editAgent={editingAgent}
      />
    </div>
  );
}
