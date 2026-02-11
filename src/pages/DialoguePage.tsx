import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useAgentStore } from '@/store/agentStore';
import { useApiKeyStore } from '@/store/apiKeyStore';
import { useI18nStore } from '@/store/i18nStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Bot, Download } from 'lucide-react';
import { AI_PROVIDERS } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { sendMessage, type AIMessage } from '@/lib/aiService';

interface DialogueMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentIcon: string;
  content: string;
  timestamp: string;
}

export default function DialoguePage() {
  const { agents } = useAgentStore();
  const { getActualKey } = useApiKeyStore();
  const { t } = useI18nStore();
  const [agent1Id, setAgent1Id] = useState(agents[0]?.id || '');
  const [agent2Id, setAgent2Id] = useState(agents[1]?.id || '');
  const [initialMessage, setInitialMessage] = useState('');
  const [maxTurns, setMaxTurns] = useState(5);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const pauseRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const getAgentInfo = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    const provider = agent ? AI_PROVIDERS.find((p) => p.id === agent.modelProvider) : null;
    return { agent, provider };
  };

  const callAgent = async (
    agentId: string,
    conversationHistory: AIMessage[]
  ): Promise<string> => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    const apiKey = agent.apiKeyId ? getActualKey(agent.apiKeyId) : undefined;

    if (!apiKey) {
      return `⚠️ ${t('form.noKeys')} (${agent.name})`;
    }

    try {
      const result = await sendMessage(
        agent.modelProvider,
        agent.modelId,
        apiKey,
        agent.systemPrompt + '\n\nYou are in a dialogue with another agent. Continue naturally.',
        conversationHistory
      );
      return result.content;
    } catch (err) {
      return `❌ Error: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
  };

  const startDialogue = async () => {
    if (!agent1Id || !agent2Id) {
      toast.error(t('dialogue.selectTwo'));
      return;
    }
    if (agent1Id === agent2Id) {
      toast.error(t('dialogue.selectDifferent'));
      return;
    }
    if (!initialMessage.trim()) {
      toast.error(t('dialogue.enterInitial'));
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    abortRef.current = false;
    pauseRef.current = false;
    setMessages([]);
    setCurrentTurn(0);

    const { agent: a1, provider: p1 } = getAgentInfo(agent1Id);
    const { agent: a2, provider: p2 } = getAgentInfo(agent2Id);
    if (!a1 || !a2) return;

    const agent1History: AIMessage[] = [];
    const agent2History: AIMessage[] = [];
    let lastMessage = initialMessage;

    const initMsg: DialogueMessage = {
      id: crypto.randomUUID(),
      agentId: 'system',
      agentName: t('dialogue.system'),
      agentIcon: '🎯',
      content: `**${t('dialogue.initialMsgLabel')}** ${initialMessage}`,
      timestamp: new Date().toISOString(),
    };
    setMessages([initMsg]);

    for (let turn = 0; turn < maxTurns; turn++) {
      if (abortRef.current) break;

      while (pauseRef.current) {
        await new Promise((r) => setTimeout(r, 200));
        if (abortRef.current) break;
      }
      if (abortRef.current) break;

      setCurrentTurn(turn + 1);

      // Agent 1 speaks
      agent1History.push({ role: 'user', content: lastMessage });
      const response1 = await callAgent(agent1Id, agent1History);
      agent1History.push({ role: 'assistant', content: response1 });

      const msg1: DialogueMessage = {
        id: crypto.randomUUID(),
        agentId: agent1Id,
        agentName: a1.name,
        agentIcon: p1?.icon || '🤖',
        content: response1,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg1]);
      lastMessage = response1;

      if (abortRef.current) break;
      while (pauseRef.current) {
        await new Promise((r) => setTimeout(r, 200));
        if (abortRef.current) break;
      }
      if (abortRef.current) break;

      // Agent 2 replies
      agent2History.push({ role: 'user', content: lastMessage });
      const response2 = await callAgent(agent2Id, agent2History);
      agent2History.push({ role: 'assistant', content: response2 });

      const msg2: DialogueMessage = {
        id: crypto.randomUUID(),
        agentId: agent2Id,
        agentName: a2.name,
        agentIcon: p2?.icon || '🤖',
        content: response2,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg2]);
      lastMessage = response2;
    }

    setIsRunning(false);
    if (!abortRef.current) toast.success(t('dialogue.done'));
  };

  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const stopDialogue = () => {
    abortRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
  };

  const exportDialogue = () => {
    const md = messages.map((m) => `### ${m.agentName}\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dialogue-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('dialogue.exported'));
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-3 md:p-4 lg:p-6 border-b border-border pt-14 md:pt-4 lg:pt-6">
        <PageHeader title={t('dialogue.title')} description={t('dialogue.subtitle')} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <Select value={agent1Id} onValueChange={setAgent1Id}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder={t('dialogue.agent1')} />
            </SelectTrigger>
            <SelectContent>
              {agents.map((a) => {
                const p = AI_PROVIDERS.find((pr) => pr.id === a.modelProvider);
                return <SelectItem key={a.id} value={a.id}>{p?.icon} {a.name}</SelectItem>;
              })}
            </SelectContent>
          </Select>

          <Select value={agent2Id} onValueChange={setAgent2Id}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder={t('dialogue.agent2')} />
            </SelectTrigger>
            <SelectContent>
              {agents.map((a) => {
                const p = AI_PROVIDERS.find((pr) => pr.id === a.modelProvider);
                return <SelectItem key={a.id} value={a.id}>{p?.icon} {a.name}</SelectItem>;
              })}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">{t('dialogue.rounds')}: {maxTurns}</span>
            <Slider value={[maxTurns]} onValueChange={(v) => setMaxTurns(v[0])} min={1} max={20} step={1} />
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={startDialogue} className="gap-1.5 flex-1">
                <Play className="w-4 h-4" /> {t('dialogue.start')}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={togglePause} className="gap-1.5 flex-1">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? t('dialogue.resume') : t('dialogue.pause')}
                </Button>
                <Button variant="destructive" onClick={stopDialogue} size="icon">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </>
            )}
            {messages.length > 0 && (
              <Button variant="outline" size="icon" onClick={exportDialogue}>
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <Input
          value={initialMessage}
          onChange={(e) => setInitialMessage(e.target.value)}
          placeholder={t('dialogue.initialPlaceholder')}
          className="mt-3 bg-card border-border"
          disabled={isRunning}
        />

        {isRunning && (
          <div className="mt-2 text-xs text-chart-4">
            ⚡ {t('dialogue.round')} {currentTurn} {t('dialogue.roundOf')} {maxTurns}
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4 lg:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !isRunning && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('dialogue.emptyTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('dialogue.emptyDesc')}</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => {
              const isAgent1 = msg.agentId === agent1Id;
              const isSystem = msg.agentId === 'system';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${isAgent1 ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${isSystem ? 'bg-chart-3/15' : isAgent1 ? 'bg-accent/15' : 'bg-primary/15'
                    }`}>
                    {msg.agentIcon}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isSystem ? 'bg-chart-3/10 border border-chart-3/20' :
                    isAgent1 ? 'bg-accent/10 border border-accent/20 rounded-tr-sm' :
                      'bg-primary/10 border border-primary/20 rounded-tl-sm'
                    }`}>
                    <p className={`text-[10px] font-semibold mb-1 ${isSystem ? 'text-chart-3' : isAgent1 ? 'text-accent' : 'text-primary'
                      }`}>{msg.agentName}</p>
                    <div className="prose prose-invert prose-sm max-w-none [&>p]:m-0 text-sm text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isRunning && !isPaused && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-chart-4/15 flex items-center justify-center">
                <Bot className="w-4 h-4 text-chart-4 animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-chart-4 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-chart-4 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-chart-4 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
