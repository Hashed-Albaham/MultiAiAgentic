/**
 * محرك تنفيذ Pipeline
 * يدير تنفيذ DAG بشكل متوازي مع إدارة السياق والمحاولات المتكررة
 * يدعم الدورات (loops) المحكومة
 */

import { topologicalLevels, getPredecessors, hasCycle, removeBackEdges, type DAGNode, type DAGEdge } from './dag-resolver';
import { sendMessage } from '@/lib/aiService';

export interface NodeResult {
  nodeId: string;
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  tokens?: { prompt: number; completion: number; total: number };
  error?: string;
  level?: number;
  /** رقم التكرار (للدورات) */
  iteration?: number;
}

export interface ExecutionState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentLevel: number;
  totalLevels: number;
  results: Map<string, NodeResult>;
  activeNodes: Set<string>;
  startTime?: string;
  endTime?: string;
  finalOutput?: string;
  /** معلومات عن الدورة الحالية */
  loopInfo?: { currentIteration: number; totalIterations: number };
}

export type ExecutionCallback = (state: ExecutionState) => void;

interface AgentInfo {
  id: string;
  name: string;
  systemPrompt: string;
  modelProvider: string;
  modelId: string;
  apiKey?: string;
}

/** خيارات الدورة */
export interface LoopConfig {
  /** الحواف الخلفية التي تشكل الدورة */
  backEdgeIds: string[];
  /** عدد التكرارات (1-10) */
  iterations: number;
}

/** استدعاء AI حقيقي */
async function callAgentAI(
  agent: AgentInfo,
  input: string,
): Promise<{ output: string; tokens: { prompt: number; completion: number; total: number } }> {
  if (!agent.apiKey) {
    return {
      output: `⚠️ لا يوجد مفتاح API لـ ${agent.name}. عدّل الوكيل وحدد مفتاحاً من الإعدادات.`,
      tokens: { prompt: 0, completion: 0, total: 0 },
    };
  }

  const result = await sendMessage(
    agent.modelProvider,
    agent.modelId,
    agent.apiKey,
    agent.systemPrompt,
    [{ role: 'user', content: input }]
  );

  return {
    output: result.content,
    tokens: result.tokens || { prompt: 0, completion: 0, total: 0 },
  };
}

/**
 * بناء prompt المدخل للعقدة بسياق واضح
 */
function buildNodeInput(
  predecessors: string[],
  results: Map<string, NodeResult>,
  agents: Map<string, AgentInfo>,
  nodes: DAGNode[],
  initialInput: string,
  iteration?: number,
): string {
  if (predecessors.length === 0) {
    return initialInput;
  }

  const parts: string[] = [];

  predecessors.forEach((pid) => {
    const result = results.get(pid);
    if (!result?.output) return;

    const sourceNode = nodes.find((n) => n.id === pid);
    const sourceAgent = sourceNode ? agents.get(sourceNode.agentId) : undefined;
    const agentName = sourceAgent?.name || result.agentName || 'وكيل غير معروف';

    parts.push(
      `=== مخرجات الوكيل "${agentName}" ===\n${result.output}`
    );
  });

  if (parts.length === 0) return initialInput;

  let prompt = `${parts.join('\n\n---\n\n')}`;
  if (iteration != null && iteration > 0) {
    prompt += `\n\n(التكرار ${iteration + 1})`;
  }
  prompt += '\n\n---\nنفذ الآن مباشرة';

  return prompt;
}

/** تنفيذ مستوى واحد من العقد */
async function executeLevel(
  level: { level: number; nodeIds: string[] },
  nodes: DAGNode[],
  edges: DAGEdge[],
  agents: Map<string, AgentInfo>,
  state: ExecutionState,
  initialInput: string,
  onUpdate: ExecutionCallback,
  iteration?: number,
) {
  state.currentLevel = level.level;

  const promises = level.nodeIds.map(async (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId)!;
    const agent = agents.get(node.agentId);
    const resultKey = iteration != null && iteration > 0 ? `${nodeId}__iter${iteration}` : nodeId;

    if (!agent) {
      state.results.set(resultKey, {
        nodeId,
        agentId: node.agentId,
        agentName: 'غير موجود',
        input: '',
        output: '⚠️ [خطأ: الوكيل غير موجود — تم تخطي هذه العقدة]',
        status: 'failed',
        error: 'الوكيل غير موجود',
        iteration,
      });
      // لا نوقف التنفيذ — نمرر ملاحظة الخطأ للعقد التالية
      state.activeNodes.delete(nodeId);
      onUpdate({ ...state });
      return;
    }

    // تجميع المدخلات من العقد السابقة
    const predecessors = getPredecessors(nodeId, edges);

    // للتكرار > 0: البحث أيضاً في النتائج السابقة (التكرار السابق)
    const effectivePredecessors = predecessors.map((pid) => {
      if (iteration != null && iteration > 0) {
        const prevIterKey = `${pid}__iter${iteration - 1}`;
        if (state.results.has(prevIterKey)) return prevIterKey;
        const currentIterKey = `${pid}__iter${iteration}`;
        if (state.results.has(currentIterKey)) return currentIterKey;
      }
      return pid;
    });

    const nodeInput = buildNodeInput(effectivePredecessors, state.results, agents, nodes, initialInput, iteration);

    // تحديث الحالة: جاري التنفيذ
    state.activeNodes.add(nodeId);
    state.results.set(resultKey, {
      nodeId,
      agentId: node.agentId,
      agentName: agent.name,
      input: nodeInput,
      output: '',
      status: 'running',
      startTime: new Date().toISOString(),
      level: level.level,
      iteration,
    });
    onUpdate({ ...state });

    try {
      const result = await callAgentAI(agent, nodeInput);
      state.results.set(resultKey, {
        ...state.results.get(resultKey)!,
        output: result.output,
        tokens: result.tokens,
        status: 'completed',
        endTime: new Date().toISOString(),
        duration: Date.now() - new Date(state.results.get(resultKey)!.startTime!).getTime(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
      // مرونة: نضع ملاحظة الخطأ كمخرج حتى لا يتوقف النظام
      state.results.set(resultKey, {
        ...state.results.get(resultKey)!,
        output: `⚠️ [خطأ في الوكيل "${agent.name}"]: ${errorMsg}\n— تم تمرير هذه الملاحظة للعقدة التالية تلقائياً.`,
        status: 'failed',
        error: errorMsg,
        endTime: new Date().toISOString(),
        duration: Date.now() - new Date(state.results.get(resultKey)!.startTime!).getTime(),
      });
    }

    state.activeNodes.delete(nodeId);
    onUpdate({ ...state });
  });

  await Promise.all(promises);
}

/** تنفيذ Pipeline كامل — مع دعم الدورات */
export async function executePipeline(
  nodes: DAGNode[],
  edges: DAGEdge[],
  agents: Map<string, AgentInfo>,
  initialInput: string,
  onUpdate: ExecutionCallback,
  loopConfig?: LoopConfig,
): Promise<ExecutionState> {
  // إزالة الحواف الخلفية للحصول على DAG نظيف
  const cleanEdges = loopConfig
    ? removeBackEdges(edges, loopConfig.backEdgeIds)
    : edges;

  // تحقق من عدم وجود دورات في DAG النظيف
  if (hasCycle(nodes, cleanEdges)) {
    throw new Error('الرسم البياني لا يزال يحتوي على دورة حتى بعد إزالة الحواف الخلفية!');
  }

  const iterations = loopConfig?.iterations || 1;
  const levels = topologicalLevels(nodes, cleanEdges);

  const state: ExecutionState = {
    status: 'running',
    currentLevel: 0,
    totalLevels: levels.length * iterations,
    results: new Map(),
    activeNodes: new Set(),
    startTime: new Date().toISOString(),
    loopInfo: iterations > 1 ? { currentIteration: 0, totalIterations: iterations } : undefined,
  };

  // تهيئة النتائج
  nodes.forEach((n) => {
    const agent = agents.get(n.agentId);
    state.results.set(n.id, {
      nodeId: n.id,
      agentId: n.agentId,
      agentName: agent?.name || 'غير معروف',
      input: '',
      output: '',
      status: 'pending',
    });
  });

  onUpdate({ ...state });

  try {
    for (let iter = 0; iter < iterations; iter++) {
      if (state.loopInfo) {
        state.loopInfo.currentIteration = iter;
      }

      for (const level of levels) {
        await executeLevel(level, nodes, cleanEdges, agents, state, initialInput, onUpdate, iterations > 1 ? iter : undefined);
        state.currentLevel = level.level + iter * levels.length;
      }
    }

    // حساب الناتج النهائي
    const lastLevel = levels[levels.length - 1];
    if (lastLevel) {
      const lastIter = iterations > 1 ? iterations - 1 : undefined;
      const finalParts = lastLevel.nodeIds
        .map((nid) => {
          const key = lastIter != null ? `${nid}__iter${lastIter}` : nid;
          const r = state.results.get(key);
          if (!r?.output) return '';
          const prefix = r.status === 'failed' ? `[⚠️ ${r.agentName} — فشل]` : `[${r.agentName}]`;
          return `${prefix}: ${r.output}`;
        })
        .filter(Boolean);
      state.finalOutput = finalParts.join('\n\n---\n\n');
    }

    state.status = 'completed';
    state.endTime = new Date().toISOString();
  } catch (err) {
    state.status = 'failed';
    state.endTime = new Date().toISOString();
  }

  onUpdate({ ...state });
  return state;
}
