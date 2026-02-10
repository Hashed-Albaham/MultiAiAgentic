import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useAgentStore } from '@/store/agentStore';
import { useApiKeyStore } from '@/store/apiKeyStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AI_PROVIDERS } from '@/types';
import { Send, Bot, Clock, Coins, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { sendMessage } from '@/lib/aiService';

interface CompareResult {
  agentId: string;
  agentName: string;
  provider: string;
  response: string;
  duration: number;
  tokens: number;
  error?: string;
}

export default function ComparePage() {
  const { agents } = useAgentStore();
  const { getActualKey } = useApiKeyStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<CompareResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleAgent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      toast.error('اختر وكيلين على الأقل');
      return;
    }
    if (!prompt.trim()) {
      toast.error('اكتب السؤال أولاً');
      return;
    }

    setIsLoading(true);
    setResults([]);

    const promises = selectedIds.map(async (id) => {
      const agent = agents.find((a) => a.id === id)!;
      const providerInfo = AI_PROVIDERS.find((p) => p.id === agent.modelProvider);
      const apiKey = agent.apiKeyId ? getActualKey(agent.apiKeyId) : undefined;

      const startTime = performance.now();

      if (!apiKey) {
        return {
          agentId: id,
          agentName: agent.name,
          provider: providerInfo?.name || '',
          response: '⚠️ لا يوجد مفتاح API لهذا الوكيل. عدّل الوكيل وحدد مفتاحاً.',
          duration: 0,
          tokens: 0,
          error: 'no-key',
        };
      }

      try {
        const result = await sendMessage(
          agent.modelProvider,
          agent.modelId,
          apiKey,
          agent.systemPrompt,
          [{ role: 'user', content: prompt }]
        );
        const duration = (performance.now() - startTime) / 1000;
        return {
          agentId: id,
          agentName: agent.name,
          provider: providerInfo?.name || '',
          response: result.content,
          duration,
          tokens: result.tokens?.total || 0,
        };
      } catch (err) {
        return {
          agentId: id,
          agentName: agent.name,
          provider: providerInfo?.name || '',
          response: `❌ خطأ: ${err instanceof Error ? err.message : 'غير معروف'}`,
          duration: (performance.now() - startTime) / 1000,
          tokens: 0,
          error: 'api-error',
        };
      }
    });

    const allResults = await Promise.all(promises);
    setResults(allResults);
    setIsLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader title="مقارنة الوكلاء" description="أرسل نفس السؤال لعدة وكلاء وقارن النتائج" />

      {/* Agent Selection */}
      <div className="glass-card p-5 mb-6">
        <p className="text-sm font-semibold text-foreground mb-3">اختر الوكلاء (2-5)</p>
        <div className="flex flex-wrap gap-3">
          {agents.map((agent) => {
            const p = AI_PROVIDERS.find((pr) => pr.id === agent.modelProvider);
            const checked = selectedIds.includes(agent.id);
            const noKey = !agent.apiKeyId || !getActualKey(agent.apiKeyId);
            return (
              <label
                key={agent.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border ${checked ? 'border-primary bg-primary/10' : 'border-border bg-secondary/50 hover:bg-secondary'
                  }`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleAgent(agent.id)} />
                <span className="text-lg">{p?.icon}</span>
                <span className="text-sm text-foreground">{agent.name}</span>
                {noKey && <AlertTriangle className="w-3 h-3 text-chart-4" />}
              </label>
            );
          })}
        </div>
      </div>

      {/* Prompt */}
      <div className="glass-card p-5 mb-6">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب سؤالك هنا..."
          rows={3}
          className="bg-secondary border-border resize-none mb-3"
        />
        <Button onClick={handleCompare} disabled={isLoading} className="gap-2">
          <Send className="w-4 h-4" />
          {isLoading ? 'جاري المقارنة...' : 'قارن'}
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {results.map((r, i) => (
              <motion.div
                key={r.agentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5"
              >
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
                  <Bot className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground text-sm">{r.agentName}</span>
                  <span className="text-xs text-muted-foreground mr-auto">{r.provider}</span>
                </div>
                <ScrollArea className="h-40 mb-3">
                  <div className="prose prose-invert prose-sm max-w-none text-sm"><ReactMarkdown>{r.response}</ReactMarkdown></div>
                </ScrollArea>
                <div className="flex gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {r.duration.toFixed(1)}s
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {r.tokens} tokens
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
