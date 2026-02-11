import { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useApiKeyStore } from '@/store/apiKeyStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, AlertTriangle } from 'lucide-react';
import { AI_PROVIDERS } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { sendMessage, type AIMessage } from '@/lib/aiService';
import { toast } from 'sonner';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { agents } = useAgentStore();
  const { getActualKey } = useApiKeyStore();
  const [searchParams] = useSearchParams();
  const [selectedAgentId, setSelectedAgentId] = useState(searchParams.get('agent') || agents[0]?.id || '');
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const agent = agents.find((a) => a.id === selectedAgentId);
  const provider = agent ? AI_PROVIDERS.find((p) => p.id === agent.modelProvider) : null;
  const hasKey = agent?.apiKeyId ? !!getActualKey(agent.apiKeyId) : false;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !agent) return;
    const userMsg: LocalMessage = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const apiKey = agent.apiKeyId ? getActualKey(agent.apiKeyId) : undefined;

    if (!apiKey) {
      const response: LocalMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ **لا يوجد مفتاح API لهذا الوكيل.**\n\nاذهب إلى **الإعدادات → مفاتيح API** وأضف مفتاحاً لـ ${provider?.name || agent.modelProvider}، ثم عدّل هذا الوكيل واختر المفتاح.`,
      };
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
      return;
    }

    try {
      // بناء سياق المحادثة (آخر 20 رسالة)
      const contextMessages: AIMessage[] = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      contextMessages.push({ role: 'user', content: userMsg.content });

      const result = await sendMessage(
        agent.modelProvider,
        agent.modelId,
        apiKey,
        agent.systemPrompt,
        contextMessages
      );

      const response: LocalMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content,
      };
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
      toast.error('فشل الاتصال بـ AI');
      const response: LocalMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ **خطأ في الاتصال:**\n\n\`${errorMsg}\``,
      };
      setMessages((prev) => [...prev, response]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-3 md:p-4 lg:p-6 border-b border-border pr-14 md:pr-4">
        <div className="flex items-center gap-2 md:gap-4 max-w-4xl flex-wrap">
          <Select value={selectedAgentId} onValueChange={(v) => { setSelectedAgentId(v); setMessages([]); }}>
            <SelectTrigger className="w-44 md:w-64 bg-card border-border text-xs md:text-sm h-8 md:h-9">
              <SelectValue placeholder="اختر وكيلاً" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((a) => {
                const p = AI_PROVIDERS.find((pr) => pr.id === a.modelProvider);
                return (
                  <SelectItem key={a.id} value={a.id}>
                    {p?.icon} {a.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {agent && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <span className="hidden sm:inline">{provider?.name} · {agent.modelId}</span>
              {!hasKey && (
                <span className="flex items-center gap-1 text-[10px] text-chart-4 bg-chart-4/10 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-2.5 h-2.5" /> بدون مفتاح
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3 md:p-4 lg:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {agent ? `ابدأ محادثة مع ${agent.name}` : 'اختر وكيلاً للبدء'}
              </h3>
              <p className="text-sm text-muted-foreground">اكتب رسالتك في الأسفل</p>
              {agent && !hasKey && (
                <p className="text-xs text-chart-4 mt-2">
                  ⚠️ هذا الوكيل لا يملك مفتاح API — اذهب للإعدادات وأضف مفتاحاً ثم عدّل الوكيل
                </p>
              )}
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent/15' : 'bg-primary/15'
                  }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-accent" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${msg.role === 'user'
                  ? 'bg-accent/15 text-foreground rounded-tr-sm'
                  : 'bg-card border border-border text-foreground rounded-tl-sm'
                  }`}>
                  <div className="prose prose-invert prose-sm max-w-none [&>p]:m-0 [&>blockquote]:border-primary/30">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 md:p-4 lg:p-6 border-t border-border">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك..."
            rows={1}
            className="bg-card border-border resize-none min-h-[44px] max-h-32"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !agent}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
