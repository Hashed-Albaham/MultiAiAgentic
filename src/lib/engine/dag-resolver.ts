/**
 * محلل DAG - يحلل الرسم البياني ويتحقق من وجود دورات
 * ويحدد ترتيب التنفيذ والعقد القابلة للتنفيذ المتوازي
 * يدعم الدورات المحكومة (loops) مع تحديد عدد التكرارات
 */

export interface DAGNode {
  id: string;
  agentId: string;
}

export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  condition?: {
    type: 'always' | 'conditional' | 'on_success' | 'on_error';
    expression?: string;
  };
}

export interface ExecutionLevel {
  level: number;
  nodeIds: string[]; // العقد التي يمكن تنفيذها بالتوازي
}

/** معلومات دورة مكتشفة */
export interface CycleInfo {
  /** الحواف المسببة للدورة */
  backEdges: DAGEdge[];
  /** العقد المشاركة في الدورة */
  cycleNodes: string[];
}

/** التحقق من وجود دورات في الرسم البياني */
export function hasCycle(nodes: DAGNode[], edges: DAGEdge[]): boolean {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.get(e.source)?.push(e.target));

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);
    for (const neighbor of adj.get(nodeId) || []) {
      if (!visited.has(neighbor) && dfs(neighbor)) return true;
      if (recStack.has(neighbor)) return true;
    }
    recStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) return true;
  }
  return false;
}

/** كشف الدورات وإرجاع الحواف الخلفية المسببة بالتفصيل */
export function detectCycles(nodes: DAGNode[], edges: DAGEdge[]): CycleInfo | null {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.get(e.source)?.push(e.target));

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const backEdgeTargets: Array<{ from: string; to: string }> = [];
  const cycleNodeSet = new Set<string>();

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    for (const neighbor of adj.get(nodeId) || []) {
      if (recStack.has(neighbor)) {
        // دورة مكتشفة!
        backEdgeTargets.push({ from: nodeId, to: neighbor });
        // جمع العقد في الدورة
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart >= 0) {
          for (let i = cycleStart; i < path.length; i++) {
            cycleNodeSet.add(path[i]);
          }
        }
      } else if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      }
    }
    recStack.delete(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  if (backEdgeTargets.length === 0) return null;

  // العثور على الحواف الفعلية المسببة للدورة
  const backEdges = edges.filter((e) =>
    backEdgeTargets.some((bt) => bt.from === e.source && bt.to === e.target)
  );

  return {
    backEdges,
    cycleNodes: Array.from(cycleNodeSet),
  };
}

/** إزالة الحواف الخلفية للحصول على DAG نظيف */
export function removeBackEdges(edges: DAGEdge[], backEdgeIds: string[]): DAGEdge[] {
  return edges.filter((e) => !backEdgeIds.includes(e.id));
}

/** تحديد العقد الجذرية (بدون مدخلات) */
export function findRootNodes(nodes: DAGNode[], edges: DAGEdge[]): string[] {
  const targets = new Set(edges.map((e) => e.target));
  return nodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
}

/** تحديد العقد النهائية (بدون مخرجات) */
export function findLeafNodes(nodes: DAGNode[], edges: DAGEdge[]): string[] {
  const sources = new Set(edges.map((e) => e.source));
  return nodes.filter((n) => !sources.has(n.id)).map((n) => n.id);
}

/** ترتيب طوبولوجي - يحدد مستويات التنفيذ المتوازي */
export function topologicalLevels(nodes: DAGNode[], edges: DAGEdge[]): ExecutionLevel[] {
  if (hasCycle(nodes, edges)) throw new Error('الرسم البياني يحتوي على دورة!');

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach((e) => {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const levels: ExecutionLevel[] = [];
  let queue = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
  let level = 0;

  while (queue.length > 0) {
    levels.push({ level, nodeIds: [...queue] });
    const nextQueue: string[] = [];
    for (const nodeId of queue) {
      for (const neighbor of adj.get(nodeId) || []) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if (inDegree.get(neighbor) === 0) nextQueue.push(neighbor);
      }
    }
    queue = nextQueue;
    level++;
  }

  return levels;
}

/** الحصول على العقد السابقة لعقدة معينة */
export function getPredecessors(nodeId: string, edges: DAGEdge[]): string[] {
  return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

/** الحصول على العقد اللاحقة لعقدة معينة */
export function getSuccessors(nodeId: string, edges: DAGEdge[]): string[] {
  return edges.filter((e) => e.source === nodeId).map((e) => e.target);
}
