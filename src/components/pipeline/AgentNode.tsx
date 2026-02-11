import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import { memo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, RefreshCw, Eye, Copy, Download, X, Printer, ExternalLink } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { useI18nStore } from '@/store/i18nStore';
import { AI_PROVIDERS } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AgentNodeData {
  label: string;
  provider: string;
  icon: string;
  agentId: string;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  nodeResult?: {
    nodeId: string;
    agentName: string;
    status: string;
    input?: string;
    output?: string;
    error?: string;
    duration?: number;
    tokens?: { prompt: number; completion: number; total: number };
    iteration?: number;
  };
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

// ============================================
//   نافذة عرض المخرجات الكاملة (Modal كبير)
// ============================================
function FullOutputModal({ result, onClose }: { result: AgentNodeData['nodeResult']; onClose: () => void }) {
  const { t } = useI18nStore();
  if (!result) return null;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(t('toast.copied'))).catch(() => toast.error(t('toast.copyFailed')));
  };

  const exportMd = () => {
    const lines = [
      `# ${result.agentName}`,
      result.duration ? `المدة: ${(result.duration / 1000).toFixed(1)}s` : '',
      result.tokens ? `التوكنات: ${result.tokens.total}` : '',
      '', '## المخرج:', result.output || 'لا يوجد',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.agentName}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('toast.exported'));
  };

  const printOutput = () => {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) { toast.error('لم نتمكن من فتح نافذة'); return; }
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${result.agentName}</title>
    <style>body{font-family:'Segoe UI',Tahoma,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#222;line-height:1.8}
    h1{font-size:22px;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:20px}
    pre{background:#f5f5f5;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px}
    code{background:#f0f0f0;padding:2px 6px;border-radius:4px}</style></head>
    <body><h1>${result.agentName}</h1><div>${(result.output || '').replace(/\n/g, '<br>')}</div></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed inset-4 md:inset-12 lg:inset-20 z-[101] flex flex-col rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/30 bg-secondary/30 shrink-0">
          <h2 className="text-sm md:text-base font-bold text-foreground truncate">{result.agentName}</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            {result.output && (
              <>
                <Button variant="ghost" size="sm" onClick={() => copyText(result.output!)} className="h-8 min-w-[44px] text-[10px] px-2 gap-1">
                  <Copy className="w-3.5 h-3.5" /> {t('exec.copyOutput')}
                </Button>
                <Button variant="ghost" size="sm" onClick={exportMd} className="h-8 min-w-[44px] text-[10px] px-2 gap-1">
                  <Download className="w-3.5 h-3.5" /> {t('exec.export')}
                </Button>
                <Button variant="ghost" size="sm" onClick={printOutput} className="h-8 min-w-[44px] text-[10px] px-2 gap-1">
                  <Printer className="w-3.5 h-3.5" /> طباعة
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4 md:p-6">
          {result.input && (
            <div className="rounded-lg bg-background/50 border border-border/30 p-4 mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t('exec.input')}</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{result.input}</pre>
            </div>
          )}
          {result.output && (
            <div className="rounded-lg bg-background/50 border border-border/30 p-4 mb-4">
              <p className="text-xs font-semibold text-foreground/70 mb-2">{t('exec.output')}</p>
              <div className="text-sm text-foreground prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{result.output}</ReactMarkdown>
              </div>
            </div>
          )}
          {result.error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
              <p className="text-sm text-destructive">❌ {result.error}</p>
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </>
  );
}

// ============================================
//   AgentNode الرئيسي
// ============================================
function AgentNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const status = nodeData.status || 'pending';
  const hasResult = !!(nodeData.nodeResult && (nodeData.nodeResult.output || nodeData.nodeResult.error));
  const { setNodes, setEdges } = useReactFlow();
  const { agents } = useAgentStore();
  const { t } = useI18nStore();
  const [showReplace, setShowReplace] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);

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
              nodeResult: undefined,
            },
          }
          : n
      )
    );
    setShowReplace(false);
  };

  // إظهار/إخفاء الأزرار على Touch
  const handleTouchToggle = useCallback(() => {
    setShowActions((prev) => !prev);
  }, []);

  return (
    <>
      <div
        className={cn(
          'glass-card px-5 py-4 min-w-[180px] border-2 transition-all duration-300 relative group',
          statusStyles[status] || statusStyles.pending,
          selected && 'ring-2 ring-primary/50'
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowReplace(false); setShowPreview(false); }}
        onTouchStart={handleTouchToggle}
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

        {/* أزرار التحكم — تظهر عند hover أو touch */}
        {(showActions || selected) && (
          <div className="absolute -top-2 -left-2 flex gap-1 z-10" dir="rtl">
            {/* حذف العقدة */}
            <button
              onClick={handleDelete}
              className="w-7 h-7 md:w-5 md:h-5 rounded-full bg-destructive/90 hover:bg-destructive active:bg-destructive flex items-center justify-center shadow-md transition-colors"
              title={t('node.delete')}
            >
              <Trash2 className="w-3 h-3 md:w-2.5 md:h-2.5 text-destructive-foreground" />
            </button>
            {/* استبدال الوكيل */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowReplace(!showReplace); }}
              className="w-7 h-7 md:w-5 md:h-5 rounded-full bg-chart-4/90 hover:bg-chart-4 active:bg-chart-4 flex items-center justify-center shadow-md transition-colors"
              title={t('node.replace')}
            >
              <RefreshCw className="w-3 h-3 md:w-2.5 md:h-2.5 text-background" />
            </button>
            {/* عرض المخرجات — يتفعل فقط بعد التنفيذ */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasResult) setShowPreview(!showPreview);
              }}
              className={cn(
                'w-7 h-7 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-md transition-colors',
                hasResult
                  ? 'bg-chart-3/90 hover:bg-chart-3 active:bg-chart-3 cursor-pointer'
                  : 'bg-muted/60 cursor-not-allowed opacity-50'
              )}
              title={hasResult ? t('node.viewOutput') : t('node.noOutput')}
            >
              <Eye className="w-3 h-3 md:w-2.5 md:h-2.5 text-white" />
            </button>
          </div>
        )}

        {/* معاينة سريعة للمخرجات — popup صغير */}
        <AnimatePresence>
          {showPreview && hasResult && nodeData.nodeResult && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 z-20 nodrag nopan"
            >
              <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-3 space-y-2 max-w-[320px] min-w-[240px]" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-foreground">{t('exec.output')}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowFullModal(true); setShowPreview(false); }}
                      className="w-6 h-6 rounded-lg bg-chart-3/20 hover:bg-chart-3/40 active:bg-chart-3/60 flex items-center justify-center transition-colors"
                      title={t('node.viewFull')}
                    >
                      <ExternalLink className="w-3 h-3 text-chart-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(nodeData.nodeResult?.output || ''); toast.success(t('toast.copied')); }}
                      className="w-6 h-6 rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/60 flex items-center justify-center transition-colors"
                    >
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Duration + Tokens */}
                {(nodeData.nodeResult.duration || nodeData.nodeResult.tokens) && (
                  <div className="flex gap-2 text-[9px] text-muted-foreground">
                    {nodeData.nodeResult.duration != null && (
                      <span>⏱ {(nodeData.nodeResult.duration / 1000).toFixed(1)}s</span>
                    )}
                    {nodeData.nodeResult.tokens && (
                      <span>🪙 {nodeData.nodeResult.tokens.total}</span>
                    )}
                  </div>
                )}

                {/* Output preview */}
                {nodeData.nodeResult.output && (
                  <div className="text-[10px] text-foreground/80 max-h-32 overflow-y-auto whitespace-pre-wrap bg-background/50 rounded p-2">
                    {nodeData.nodeResult.output.slice(0, 300)}
                    {nodeData.nodeResult.output.length > 300 && '...'}
                  </div>
                )}

                {/* Error */}
                {nodeData.nodeResult.error && (
                  <div className="text-[10px] text-destructive bg-destructive/10 rounded p-2">
                    ❌ {nodeData.nodeResult.error}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* قائمة الاستبدال */}
        {showReplace && (
          <div className="absolute top-full left-0 mt-1 z-20 min-w-[200px] nodrag nopan">
            <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-2 space-y-1 max-h-48 overflow-y-auto" dir="rtl">
              <p className="text-[10px] text-muted-foreground font-semibold px-2 py-1">{t('node.replaceWith')}</p>
              {agents
                .filter((a) => a.id !== nodeData.agentId)
                .map((agent) => {
                  const p = AI_PROVIDERS.find((pr) => pr.id === agent.modelProvider);
                  return (
                    <button
                      key={agent.id}
                      onClick={(e) => { e.stopPropagation(); handleReplace(agent.id); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-secondary active:bg-secondary/80 text-xs text-foreground transition-colors text-right min-h-[36px]"
                    >
                      <span>{p?.icon || '🤖'}</span>
                      <span className="truncate">{agent.name}</span>
                    </button>
                  );
                })}
              {agents.filter((a) => a.id !== nodeData.agentId).length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-2">{t('node.noOthers')}</p>
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

      {/* نافذة عرض المخرج الكامل (Modal) */}
      <AnimatePresence>
        {showFullModal && nodeData.nodeResult && (
          <FullOutputModal result={nodeData.nodeResult} onClose={() => setShowFullModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default memo(AgentNode);
