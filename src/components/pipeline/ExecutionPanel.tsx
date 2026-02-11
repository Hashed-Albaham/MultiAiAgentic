import { useState, useRef, useCallback } from 'react';
import { type NodeResult, type ExecutionState } from '@/lib/engine/pipeline-executor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Bot, Clock, Coins, CheckCircle, XCircle, Loader2,
  Copy, Download, ChevronDown, ChevronUp, Eye, EyeOff,
  FileText, GripHorizontal, Minimize2, Maximize2,
  Printer, X, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ExecutionPanelProps {
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentLevel: number;
  totalLevels: number;
  results: Map<string, NodeResult>;
  finalOutput?: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-muted-foreground', label: 'قيد الانتظار', bg: 'bg-muted/30' },
  running: { icon: Loader2, color: 'text-chart-4', label: 'جاري التنفيذ', bg: 'bg-chart-4/10' },
  completed: { icon: CheckCircle, color: 'text-primary', label: 'مكتمل', bg: 'bg-primary/10' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'فشل', bg: 'bg-destructive/10' },
  skipped: { icon: Clock, color: 'text-muted-foreground', label: 'تم تخطيه', bg: 'bg-muted/30' },
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('تم النسخ');
  }).catch(() => {
    toast.error('فشل النسخ');
  });
}

function exportResults(results: Map<string, NodeResult>, finalOutput?: string) {
  const lines: string[] = ['# نتائج تنفيذ Pipeline', `التاريخ: ${new Date().toLocaleString('ar')}`, ''];

  const arr = Array.from(results.values());
  arr.forEach((r, i) => {
    lines.push(`## ${i + 1}. ${r.agentName} (${statusConfig[r.status]?.label})`);
    if (r.duration) lines.push(`⏱ المدة: ${(r.duration / 1000).toFixed(1)}s`);
    if (r.tokens) lines.push(`🪙 التوكنات: ${r.tokens.total}`);
    lines.push('');
    if (r.input) {
      lines.push('### المدخل:');
      lines.push('```');
      lines.push(r.input);
      lines.push('```');
      lines.push('');
    }
    if (r.output) {
      lines.push('### المخرج:');
      lines.push(r.output);
      lines.push('');
    }
    if (r.error) {
      lines.push(`### ❌ خطأ: ${r.error}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  });

  if (finalOutput) {
    lines.push('## 🎯 الناتج النهائي');
    lines.push(finalOutput);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pipeline-results-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('تم تصدير النتائج');
}

function exportSingleResult(r: NodeResult) {
  const lines = [
    `# ${r.agentName}`,
    `الحالة: ${statusConfig[r.status]?.label}`,
    r.duration ? `المدة: ${(r.duration / 1000).toFixed(1)}s` : '',
    r.tokens ? `التوكنات: ${r.tokens.total}` : '',
    '',
    '## المخرج:',
    r.output || 'لا يوجد مخرج',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${r.agentName}-output-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('تم تصدير المخرج');
}

function printContent(title: string, content: string) {
  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) {
    toast.error('لم نتمكن من فتح نافذة الطباعة');
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #222; line-height: 1.8; }
        h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px; }
        pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
        p { margin: 8px 0; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div>${content.replace(/\n/g, '<br>')}</div>
    </body>
    </html>
  `);
  win.document.close();
  win.print();
}

// =========================================
//  نافذة عرض المخرج الكامل (Modal)
// =========================================
function OutputModal({ result, onClose }: { result: NodeResult; onClose: () => void }) {
  const cfg = statusConfig[result.status];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
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
          <div className="flex items-center gap-2 min-w-0">
            <cfg.icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
            <h2 className="text-sm md:text-base font-bold text-foreground truncate">{result.agentName}</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            {result.duration != null && (
              <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1">
                <Clock className="w-3 h-3" /> {(result.duration / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {result.output && (
              <>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.output!)} className="h-7 text-[10px] px-2 gap-1">
                  <Copy className="w-3 h-3" /> نسخ
                </Button>
                <Button variant="ghost" size="sm" onClick={() => exportSingleResult(result)} className="h-7 text-[10px] px-2 gap-1">
                  <Download className="w-3 h-3" /> تصدير
                </Button>
                <Button variant="ghost" size="sm" onClick={() => printContent(result.agentName, result.output!)} className="h-7 text-[10px] px-2 gap-1">
                  <Printer className="w-3 h-3" /> طباعة
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4 md:p-6">
          {result.input && (
            <div className="rounded-lg bg-background/50 border border-border/30 p-4 mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">📥 المدخل:</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{result.input}</pre>
            </div>
          )}
          {result.output && (
            <div className="rounded-lg bg-background/50 border border-border/30 p-4 mb-4">
              <p className="text-xs font-semibold text-foreground/70 mb-2">📤 المخرج:</p>
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

// =========================================
//  ExecutionPanel الرئيسي
// =========================================
export function ExecutionPanel({ status, currentLevel, totalLevels, results, finalOutput }: ExecutionPanelProps) {
  const progress = totalLevels > 0 ? ((currentLevel + 1) / totalLevels) * 100 : 0;
  const resultArray = Array.from(results.values());

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showFinal, setShowFinal] = useState(true);
  const [showInputNodes, setShowInputNodes] = useState<Set<string>>(new Set());
  const [minimized, setMinimized] = useState(false);
  const [modalResult, setModalResult] = useState<NodeResult | null>(null);

  // ======= الحجم (Resize) =======
  const [size, setSize] = useState({ w: 420, h: 500 });
  const isResizingRef = useRef(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.w;
    const startH = size.h;

    const handleResizeMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      // الحجم يتغير بالاتجاه المعاكس بسبب RTL
      const newW = Math.max(280, Math.min(750, startW - (ev.clientX - startX)));
      const newH = Math.max(200, Math.min(window.innerHeight * 0.9, startH + (ev.clientY - startY)));
      setSize({ w: newW, h: newH });
    };

    const handleResizeEnd = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [size]);

  // ======= سحب (Drag) =======
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const dragRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    const rect = dragRef.current?.parentElement?.getBoundingClientRect();
    if (rect) {
      dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const parent = dragRef.current?.parentElement?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const newX = ev.clientX - parentRect.left - dragOffsetRef.current.x;
      const newY = ev.clientY - parentRect.top - dragOffsetRef.current.y;
      setPosition({
        x: Math.max(0, Math.min(newX, parentRect.width - 100)),
        y: Math.max(0, Math.min(newY, parentRect.height - 50)),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const toggleShowInput = (nodeId: string) => {
    setShowInputNodes((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const expandAll = () => setExpandedNodes(new Set(resultArray.map((r) => r.nodeId)));
  const collapseAll = () => setExpandedNodes(new Set());

  return (
    <>
      <div
        ref={dragRef}
        className="absolute z-50"
        style={{ left: position.x, top: position.y }}
      >
        <div
          className={`glass-card border border-border/50 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden`}
          style={{
            width: minimized ? 260 : size.w,
            height: minimized ? 'auto' : size.h,
          }}
          dir="rtl"
        >
          {/* شريط السحب — Header */}
          <div
            className="flex items-center justify-between px-3 py-2 cursor-move select-none border-b border-border/30 bg-secondary/30 rounded-t-xl shrink-0"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground">📊 سجل التنفيذ</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${status === 'running' ? 'bg-chart-4/20 text-chart-4' :
                status === 'completed' ? 'bg-primary/20 text-primary' :
                  status === 'failed' ? 'bg-destructive/20 text-destructive' :
                    'bg-muted text-muted-foreground'
                }`}>
                {status === 'running' ? 'جاري...' : status === 'completed' ? 'مكتمل ✅' : status === 'failed' ? 'فشل ❌' : 'جاهز'}
              </span>
              <button onClick={() => setMinimized(!minimized)} className="p-0.5 rounded hover:bg-secondary transition-colors">
                {minimized ? <Maximize2 className="w-3 h-3 text-muted-foreground" /> : <Minimize2 className="w-3 h-3 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {!minimized && (
            <div className="p-3 space-y-3 flex flex-col flex-1 min-h-0 overflow-y-auto">
              {/* Progress */}
              {status !== 'idle' && (
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>المستوى {currentLevel + 1}/{totalLevels}</span>
                    <span>{Math.round(status === 'completed' ? 100 : progress)}%</span>
                  </div>
                  <Progress value={status === 'completed' ? 100 : progress} className="h-1.5" />
                </div>
              )}

              {/* أدوات التحكم */}
              <div className="flex gap-1 flex-wrap">
                <Button variant="ghost" size="sm" onClick={expandAll} className="h-6 text-[10px] px-2 gap-1">
                  <ChevronDown className="w-3 h-3" /> فتح الكل
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll} className="h-6 text-[10px] px-2 gap-1">
                  <ChevronUp className="w-3 h-3" /> طي الكل
                </Button>
                {status === 'completed' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => exportResults(results, finalOutput)} className="h-6 text-[10px] px-2 gap-1">
                      <Download className="w-3 h-3" /> تصدير
                    </Button>
                    {finalOutput && (
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(finalOutput)} className="h-6 text-[10px] px-2 gap-1">
                        <Copy className="w-3 h-3" /> نسخ النتيجة
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* الناتج النهائي */}
              {status === 'completed' && finalOutput && (
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      🎯 الناتج النهائي
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setShowFinal(!showFinal)} className="h-5 w-5 p-0">
                        {showFinal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(finalOutput)} className="h-5 w-5 p-0">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {showFinal && (
                    <div className="text-xs text-foreground prose prose-invert prose-xs max-w-none max-h-40 overflow-y-auto">
                      <ReactMarkdown>{finalOutput}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              {/* قائمة العقد */}
              <ScrollArea className="flex-1 min-h-0">
                <AnimatePresence>
                  {resultArray.map((r) => {
                    const cfg = statusConfig[r.status];
                    const Icon = cfg.icon;
                    const isExpanded = expandedNodes.has(r.nodeId);
                    const isInputShown = showInputNodes.has(r.nodeId);

                    return (
                      <motion.div
                        key={`${r.nodeId}-${r.iteration ?? 0}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mb-2 rounded-lg border border-border/50 overflow-hidden ${cfg.bg}`}
                      >
                        {/* رأس العقدة */}
                        <button
                          onClick={() => toggleExpand(r.nodeId)}
                          className="w-full flex items-center gap-2 p-2.5 text-right hover:bg-secondary/30 transition-colors"
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.color} ${r.status === 'running' ? 'animate-spin' : ''}`} />
                          <span className="text-xs font-semibold text-foreground truncate flex-1">
                            {r.agentName}
                            {r.iteration != null && <span className="text-muted-foreground mr-1">(#{r.iteration + 1})</span>}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {r.duration != null && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {(r.duration / 1000).toFixed(1)}s
                              </span>
                            )}
                            {r.tokens && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Coins className="w-2.5 h-2.5" /> {r.tokens.total}
                              </span>
                            )}
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        </button>

                        {/* معاينة عند الطي */}
                        {!isExpanded && r.output && (
                          <p className="text-[10px] text-muted-foreground px-2.5 pb-2 line-clamp-2">{r.output.slice(0, 120)}...</p>
                        )}

                        {/* المحتوى الكامل */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-border/30"
                            >
                              <div className="p-3 space-y-2">
                                <div className="flex gap-1 flex-wrap">
                                  {r.input && (
                                    <Button variant="ghost" size="sm" onClick={() => toggleShowInput(r.nodeId)} className="h-5 text-[9px] px-1.5 gap-0.5">
                                      <FileText className="w-2.5 h-2.5" /> {isInputShown ? 'إخفاء المدخل' : 'عرض المدخل'}
                                    </Button>
                                  )}
                                  {r.output && (
                                    <>
                                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(r.output)} className="h-5 text-[9px] px-1.5 gap-0.5">
                                        <Copy className="w-2.5 h-2.5" /> نسخ المخرج
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => setModalResult(r)} className="h-5 text-[9px] px-1.5 gap-0.5 text-chart-3">
                                        <ExternalLink className="w-2.5 h-2.5" /> عرض كامل
                                      </Button>
                                    </>
                                  )}
                                </div>
                                {isInputShown && r.input && (
                                  <div className="rounded bg-background/50 p-2">
                                    <p className="text-[9px] font-semibold text-muted-foreground mb-1">📥 المدخل:</p>
                                    <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">{r.input}</pre>
                                  </div>
                                )}
                                {r.output && (
                                  <div className="rounded bg-background/50 p-2">
                                    <p className="text-[9px] font-semibold text-foreground/70 mb-1">📤 المخرج:</p>
                                    <div className="text-[11px] text-foreground prose prose-invert prose-xs max-w-none max-h-64 overflow-y-auto">
                                      <ReactMarkdown>{r.output}</ReactMarkdown>
                                    </div>
                                  </div>
                                )}
                                {r.error && (
                                  <div className="rounded bg-destructive/10 p-2">
                                    <p className="text-[10px] text-destructive">❌ {r.error}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </ScrollArea>
            </div>
          )}

          {/* Resize handle — زاوية سفلية يسرى */}
          {!minimized && (
            <div
              onMouseDown={handleResizeStart}
              className="absolute bottom-0 left-0 w-4 h-4 cursor-nwse-resize group z-10"
              title="تغيير الحجم"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" className="absolute bottom-0.5 left-0.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                <path d="M12 2L2 12M12 6L6 12M12 10L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* نافذة عرض المخرج الكامل */}
      <AnimatePresence>
        {modalResult && (
          <OutputModal result={modalResult} onClose={() => setModalResult(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
