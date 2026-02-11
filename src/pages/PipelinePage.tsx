import { useCallback, useState, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAgentStore } from '@/store/agentStore';
import { useApiKeyStore } from '@/store/apiKeyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Play, Save, Trash2, Bot, AlertTriangle, FileText, RotateCw, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { AI_PROVIDERS, type Pipeline } from '@/types';
import { toast } from 'sonner';
import { hasCycle, detectCycles, type CycleInfo } from '@/lib/engine/dag-resolver';
import { executePipeline, type ExecutionState, type NodeResult, type LoopConfig } from '@/lib/engine/pipeline-executor';
import AgentNode from '@/components/pipeline/AgentNode';
import CustomEdge from '@/components/pipeline/CustomEdge';
import { ExecutionPanel } from '@/components/pipeline/ExecutionPanel';
import { useI18nStore } from '@/store/i18nStore';

const nodeTypes = { agentNode: AgentNode };
const edgeTypes = { custom: CustomEdge };

export default function PipelinePage() {
  const { agents, pipelines, addPipeline, updatePipeline, deletePipeline } = useAgentStore();
  const { t, locale, toggleLocale, dir } = useI18nStore();
  const { getActualKey } = useApiKeyStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pipelineInput, setPipelineInput] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: 'idle',
    currentLevel: 0,
    totalLevels: 0,
    results: new Map(),
    activeNodes: new Set(),
  });
  const [selectedEdgeCondition, setSelectedEdgeCondition] = useState<string>('always');

  // ==== حالة الدورات (loops) ====
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [detectedCycle, setDetectedCycle] = useState<CycleInfo | null>(null);
  const [loopIterations, setLoopIterations] = useState<number>(3);
  const [agentsPanelOpen, setAgentsPanelOpen] = useState(true);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);

  // تحديد ما إذا كان هناك دورة
  const dagNodes = useMemo(() => nodes.map((n) => ({ id: n.id, agentId: (n.data as any).agentId || '' })), [nodes]);
  const dagEdges = useMemo(() => edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    condition: { type: ((e.data as any)?.condition || 'always') as any },
  })), [edges]);
  const hasGraphCycle = useMemo(() => dagNodes.length > 0 && hasCycle(dagNodes, dagEdges), [dagNodes, dagEdges]);

  // كشف تفاصيل الدورة
  const cycleInfo = useMemo(() => {
    if (!hasGraphCycle) return null;
    return detectCycles(dagNodes, dagEdges);
  }, [hasGraphCycle, dagNodes, dagEdges]);

  // عدد الحواف المسببة للدورة
  const loopEdgeCount = cycleInfo?.backEdges.length || 0;

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'custom',
        animated: true,
        data: { condition: selectedEdgeCondition },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, selectedEdgeCondition]
  );

  const addNode = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const provider = AI_PROVIDERS.find((p) => p.id === agent.modelProvider);
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'agentNode',
      position: { x: 300 + Math.random() * 100, y: 80 + nodes.length * 140 },
      data: {
        label: agent.name,
        provider: provider?.name || '',
        icon: provider?.icon || '🤖',
        agentId: agent.id,
        status: 'pending',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // ======= حفظ Pipeline =======
  const handleSave = () => {
    const name = pipelineName.trim() || `Pipeline ${new Date().toLocaleString('ar')}`;
    const pipelineData = {
      name,
      description: `${nodes.length} عقدة · ${edges.length} رابط`,
      nodes: nodes.map((n) => ({
        id: n.id,
        agentId: (n.data as any).agentId,
        position: n.position,
        config: { label: (n.data as any).label, provider: (n.data as any).provider, icon: (n.data as any).icon },
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        condition: { type: ((e.data as any)?.condition || 'always') as 'always' | 'on_success' | 'on_error' | 'conditional' },
      })),
    };

    if (currentPipelineId) {
      updatePipeline(currentPipelineId, pipelineData);
      toast.success(t('toast.updated') + ' "' + name + '"');
    } else {
      const saved = addPipeline(pipelineData);
      setCurrentPipelineId(saved.id);
      toast.success(t('toast.saved') + ' "' + name + '"');
    }
  };

  // ======= تحميل Pipeline =======
  const handleLoad = (pipeline: Pipeline) => {
    setCurrentPipelineId(pipeline.id);
    setPipelineName(pipeline.name);

    const loadedNodes: Node[] = pipeline.nodes.map((n) => ({
      id: n.id,
      type: 'agentNode',
      position: n.position || { x: 300, y: 100 },
      data: {
        label: n.config?.label || agents.find((a) => a.id === n.agentId)?.name || 'وكيل',
        provider: n.config?.provider || '',
        icon: n.config?.icon || '🤖',
        agentId: n.agentId,
        status: 'pending',
      },
    }));

    const loadedEdges: Edge[] = pipeline.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'custom',
      animated: true,
      data: { condition: e.condition?.type || 'always' },
    }));

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setExecutionState({ status: 'idle', currentLevel: 0, totalLevels: 0, results: new Map(), activeNodes: new Set() });
    toast.success(t('toast.loaded') + ' "' + pipeline.name + '"');
  };

  // ======= حذف Pipeline =======
  const handleDelete = (pipelineId: string) => {
    deletePipeline(pipelineId);
    if (currentPipelineId === pipelineId) {
      setCurrentPipelineId(null);
      setPipelineName('');
    }
    toast.success(t('toast.deleted'));
  };

  // ======= تشغيل =======
  const handleRun = async (loopConfig?: LoopConfig) => {
    if (nodes.length === 0) {
      toast.error(t('toast.addNodesFirst'));
      return;
    }
    if (!pipelineInput.trim()) {
      toast.error(t('toast.addInputFirst'));
      return;
    }

    // التحقق من الدورات
    if (hasGraphCycle && !loopConfig) {
      // فتح dialog لتحديد عدد التكرارات
      setDetectedCycle(cycleInfo);
      setCycleDialogOpen(true);
      return;
    }

    // بناء خريطة الوكلاء
    const agentMap = new Map(
      agents.map((a) => [a.id, {
        id: a.id,
        name: a.name,
        systemPrompt: a.systemPrompt,
        modelProvider: a.modelProvider,
        modelId: a.modelId,
        apiKey: a.apiKeyId ? getActualKey(a.apiKeyId) : undefined,
      }])
    );

    const dagNodesForExec = nodes.map((n) => ({ id: n.id, agentId: (n.data as any).agentId }));
    const dagEdgesForExec = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      condition: { type: ((e.data as any)?.condition || 'always') as any },
    }));

    toast.info(t('toast.pipelineStarted'));

    try {
      await executePipeline(dagNodesForExec, dagEdgesForExec, agentMap, pipelineInput, (state) => {
        setExecutionState({ ...state, results: new Map(state.results) });

        // تحديث ألوان العقد حسب الحالة
        setNodes((nds) =>
          nds.map((n) => {
            // البحث عن آخر نتيجة لهذه العقدة (قد تكون في تكرار)
            let result = state.results.get(n.id);
            // البحث في التكرارات
            for (const [key, val] of state.results) {
              if (key.startsWith(n.id + '__iter')) {
                result = val;
              }
            }
            if (result) {
              return { ...n, data: { ...n.data, status: result.status, nodeResult: result } };
            }
            return n;
          })
        );
      }, loopConfig);
      toast.success(t('toast.pipelineSuccess'));
    } catch (err) {
      toast.error(t('toast.pipelineFailed'));
    }
  };

  // ======= معالجة اختيار الدورة =======
  const handleLoopConfirm = () => {
    if (!detectedCycle) return;

    const backEdgeIds = detectedCycle.backEdges.map((e) => e.id);

    // تعليم الحواف الخلفية بأنها loops
    setEdges((eds) =>
      eds.map((e) => {
        if (backEdgeIds.includes(e.id)) {
          return { ...e, data: { ...e.data, isLoop: true, loopCount: loopIterations } };
        }
        return e;
      })
    );

    setCycleDialogOpen(false);

    // تشغيل مع إعدادات الدورة
    handleRun({ backEdgeIds, iterations: loopIterations });
  };

  const handleLoopCancel = () => {
    // إلغاء الدورة: حذف الحواف الخلفية
    if (detectedCycle) {
      const backEdgeIds = detectedCycle.backEdges.map((e) => e.id);
      setEdges((eds) => eds.filter((e) => !backEdgeIds.includes(e.id)));
      toast.info(t('toast.loopRemoved'));
    }
    setCycleDialogOpen(false);
  };

  const clearAll = () => {
    setNodes([]);
    setEdges([]);
    setCurrentPipelineId(null);
    setPipelineName('');
    setExecutionState({ status: 'idle', currentLevel: 0, totalLevels: 0, results: new Map(), activeNodes: new Set() });
    toast.info(t('toast.cleared'));
  };

  return (
    <div className="flex flex-col h-screen" dir={dir()}>
      {/* Header */}
      <div className="p-3 md:p-4 lg:p-6 border-b border-border flex items-center justify-between flex-wrap gap-2 md:gap-3 pr-14 md:pr-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold text-foreground truncate">{t('pipeline.title')}</h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{t('pipeline.subtitle')}</p>
          </div>
          <Input
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder={t('pipeline.name')}
            className="w-28 md:w-40 h-7 md:h-8 text-xs md:text-sm bg-card border-border"
          />
        </div>
        <div className="flex gap-1.5 md:gap-2 items-center flex-wrap">
          {/* زر تبديل اللغة */}
          <Button variant="ghost" size="sm" onClick={toggleLocale} className="gap-1 text-xs h-7 md:h-8 px-2">
            <Languages className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden sm:inline">{t('app.language')}</span>
          </Button>
          {hasGraphCycle && (
            <span className="flex items-center gap-1 text-[10px] md:text-xs text-amber-400 bg-amber-400/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg cursor-pointer"
              onClick={() => { setDetectedCycle(cycleInfo); setCycleDialogOpen(true); }}
            >
              <RotateCw className="w-3 h-3" /> {t('loop.badge')} ({loopEdgeCount})
            </span>
          )}
          <Select value={selectedEdgeCondition} onValueChange={setSelectedEdgeCondition}>
            <SelectTrigger className="w-24 md:w-32 h-7 md:h-9 text-[10px] md:text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">{t('edge.always')}</SelectItem>
              <SelectItem value="on_success">{t('edge.onSuccess')}</SelectItem>
              <SelectItem value="on_error">{t('edge.onError')}</SelectItem>
              <SelectItem value="conditional">{t('edge.conditional')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={clearAll} className="gap-1 h-7 md:h-8 px-2 md:px-3 text-xs">
            <Trash2 className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden sm:inline">{t('pipeline.clear')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleRun()} className="gap-1 h-7 md:h-8 px-2 md:px-3 text-xs" disabled={executionState.status === 'running'}>
            <Play className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden sm:inline">{t('pipeline.run')}</span>
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1 h-7 md:h-8 px-2 md:px-3 text-xs" disabled={nodes.length === 0}>
            <Save className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden sm:inline">{t('pipeline.save')}</span>
          </Button>
        </div>
      </div>

      {/* Input bar */}
      <div className="px-4 lg:px-6 py-2 border-b border-border bg-card/50">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground shrink-0">{t('pipeline.input')}</span>
          <Input
            value={pipelineInput}
            onChange={(e) => setPipelineInput(e.target.value)}
            placeholder={t('pipeline.inputPlaceholder')}
            className="text-sm h-8 bg-background border-border"
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative" dir="ltr">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'custom' }}
          fitView
          style={{ background: 'hsl(0, 0%, 4%)' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(0, 0%, 12%)" />
          <Controls
            style={{ background: 'hsl(0, 0%, 7%)', border: '1px solid hsl(0, 0%, 14%)', borderRadius: '8px' }}
          />
          <MiniMap
            className="hidden md:block"
            style={{ background: 'hsl(0, 0%, 7%)', border: '1px solid hsl(0, 0%, 14%)' }}
            nodeColor={(n) => {
              const status = (n.data as any)?.status;
              if (status === 'running') return 'hsl(45, 90%, 55%)';
              if (status === 'completed') return 'hsl(110, 100%, 33%)';
              if (status === 'failed') return 'hsl(0, 72%, 51%)';
              return 'hsl(0, 0%, 30%)';
            }}
            maskColor="hsl(0, 0%, 4%, 0.8)"
          />

          {/* لوحة الوكلاء — قابلة للطي + scroll */}
          <Panel position="top-right">
            <div className="glass-card w-44 md:w-56" dir={dir()}>
              <button
                onClick={() => setAgentsPanelOpen(!agentsPanelOpen)}
                className="w-full flex items-center justify-between p-2.5 md:p-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{t('pipeline.agentsPanel')} ({agents.length})</span>
                {agentsPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {agentsPanelOpen && (
                <div className="px-2.5 md:px-3 pb-2.5 md:pb-3 space-y-1.5 max-h-52 md:max-h-72 overflow-y-auto">
                  {agents.map((agent) => {
                    const p = AI_PROVIDERS.find((pr) => pr.id === agent.modelProvider);
                    return (
                      <button
                        key={agent.id}
                        onClick={() => addNode(agent.id)}
                        className="w-full flex items-center gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs md:text-sm text-foreground transition-colors text-right"
                      >
                        <span className="text-sm md:text-base">{p?.icon}</span>
                        <span className="truncate">{agent.name}</span>
                      </button>
                    );
                  })}
                  {agents.length === 0 && (
                    <p className="text-[10px] md:text-xs text-muted-foreground text-center py-3">{t('pipeline.noAgents')}</p>
                  )}
                </div>
              )}
            </div>
          </Panel>

          {/* لوحة Pipelines المحفوظة — قابلة للطي */}
          {pipelines.length > 0 && (
            <Panel position="bottom-right">
              <div className="glass-card w-44 md:w-56" dir={dir()}>
                <button
                  onClick={() => setSavedPanelOpen(!savedPanelOpen)}
                  className="w-full flex items-center justify-between p-2.5 md:p-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{t('pipeline.savedPanel')} ({pipelines.length})</span>
                  {savedPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {savedPanelOpen && (
                  <div className="px-2.5 md:px-3 pb-2.5 md:pb-3 space-y-1 max-h-40 md:max-h-48 overflow-y-auto">
                    {pipelines.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-colors cursor-pointer ${currentPipelineId === p.id ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary/50 hover:bg-secondary text-foreground'
                          }`}
                      >
                        <FileText className="w-3 md:w-3.5 h-3 md:h-3.5 shrink-0" />
                        <span className="truncate flex-1" onClick={() => handleLoad(p)}>{p.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                          className="text-destructive hover:text-destructive/80 shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          )}

        </ReactFlow>

        {/* لوحة التنفيذ — قابلة للسحب */}
        {executionState.status !== 'idle' && (
          <ExecutionPanel
            status={executionState.status}
            currentLevel={executionState.currentLevel}
            totalLevels={executionState.totalLevels}
            results={executionState.results}
            finalOutput={executionState.finalOutput}
          />
        )}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-chart-3/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-chart-3" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('pipeline.emptyTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('pipeline.emptyDesc')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('pipeline.emptyHint1')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('pipeline.emptyHint2')}</p>
            </div>
          </div>
        )}
      </div>

      {/* ====== Dialog الدورة ====== */}
      <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={dir()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-amber-400" />
              {t('loop.detected')}
            </DialogTitle>
            <DialogDescription>
              {t('loop.desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* معلومات الدورة */}
            {detectedCycle && (
              <div className="p-3 rounded-lg bg-amber-400/5 border border-amber-400/20 text-sm">
                <p className="font-semibold text-amber-400 mb-2">
                  {t('loop.backEdges')}
                </p>
                {detectedCycle.backEdges.map((be) => {
                  const sourceNode = nodes.find((n) => n.id === be.source);
                  const targetNode = nodes.find((n) => n.id === be.target);
                  const sourceName = (sourceNode?.data as any)?.label || be.source;
                  const targetName = (targetNode?.data as any)?.label || be.target;
                  return (
                    <p key={be.id} className="text-xs text-muted-foreground mr-4">
                      ← {sourceName} → {targetName}
                    </p>
                  );
                })}
              </div>
            )}

            {/* اختيار عدد التكرارات */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                {t('loop.iterations')}
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={loopIterations}
                  onChange={(e) => setLoopIterations(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-24 h-9 text-center"
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 5, 10].map((n) => (
                    <Button
                      key={n}
                      variant={loopIterations === n ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => setLoopIterations(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {t('loop.iterationHint').replace('{n}', String(loopIterations))}
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleLoopCancel}>
              <Trash2 className="w-3.5 h-3.5 ml-1" /> {t('loop.cancel')}
            </Button>
            <Button size="sm" onClick={handleLoopConfirm}>
              <RotateCw className="w-3.5 h-3.5 ml-1" /> {t('loop.confirm')} {loopIterations}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
