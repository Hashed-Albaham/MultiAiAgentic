import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, useReactFlow } from '@xyflow/react';
import { memo, useState, useRef, useEffect } from 'react';
import { Trash2, Settings2, RotateCw, Save } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { toast } from 'sonner';

const conditionColors: Record<string, string> = {
  always: 'hsl(110, 100%, 33%)',
  on_success: 'hsl(140, 80%, 40%)',
  on_error: 'hsl(0, 72%, 51%)',
  conditional: 'hsl(45, 90%, 55%)',
};

const conditionOptions = ['always', 'on_success', 'on_error', 'conditional'] as const;

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const { t } = useI18nStore();
  const condition = (data?.condition as string) || 'always';
  const isLoop = !!(data?.isLoop);
  const loopCount = (data?.loopCount as number) || 0;
  const expression = (data?.expression as string) || '';
  const color = isLoop ? 'hsl(280, 80%, 60%)' : (conditionColors[condition] || conditionColors.always);

  const { setEdges } = useReactFlow();
  const [showMenu, setShowMenu] = useState(false);
  const [showExprInput, setShowExprInput] = useState(false);
  const [exprValue, setExprValue] = useState(expression);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showExprInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showExprInput]);

  const conditionLabels: Record<string, string> = {
    always: t('edge.always'),
    on_success: t('edge.onSuccess'),
    on_error: t('edge.onError'),
    conditional: t('edge.conditional'),
  };

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  const cycleCondition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIdx = conditionOptions.indexOf(condition as typeof conditionOptions[number]);
    const nextIdx = (currentIdx + 1) % conditionOptions.length;
    const nextCondition = conditionOptions[nextIdx];
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, condition: nextCondition } } : edge
      )
    );
    // إذا اخترنا "شرطي" نفتح منطقة الشرط
    if (nextCondition === 'conditional') {
      setShowExprInput(true);
    }
  };

  const saveExpression = () => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, expression: exprValue } } : edge
      )
    );
    setShowExprInput(false);
    toast.success(t('toast.conditionSaved'));
  };

  const openExprEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExprValue(expression);
    setShowExprInput(true);
  };

  return (
    <>
      {/* خط متوهج خلفي */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 6 : 4,
          opacity: 0.2,
          filter: 'blur(4px)',
        }}
      />
      {/* الخط الرئيسي */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: isLoop ? '4 4' : condition === 'conditional' ? '8 4' : undefined,
        }}
      />
      {/* سهم متحرك */}
      <circle r="3" fill={color}>
        <animateMotion dur={isLoop ? '1s' : '2s'} repeatCount="indefinite" path={edgePath} />
      </circle>

      {/* التسميات وأزرار التحكم */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex flex-col items-center gap-1"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => { if (!showExprInput) setShowMenu(false); }}
        >
          {/* تسمية الحالة */}
          <span
            style={{
              color,
              background: `${color}15`,
              borderColor: `${color}40`,
            }}
            className="px-2 py-0.5 rounded-full border text-[10px] font-medium cursor-pointer"
            onClick={condition === 'conditional' ? openExprEditor : cycleCondition}
          >
            {isLoop
              ? `🔄 ${t('loop.badge')} ×${loopCount}`
              : expression && condition === 'conditional'
                ? `⚡ ${expression.slice(0, 20)}${expression.length > 20 ? '...' : ''}`
                : (conditionLabels[condition] || condition)
            }
          </span>

          {/* أزرار التحكم */}
          {(showMenu || selected) && !showExprInput && (
            <div className="flex gap-0.5 bg-background/90 backdrop-blur rounded-lg border border-border p-0.5 shadow-lg">
              <button onClick={cycleCondition} className="w-5 h-5 flex items-center justify-center rounded hover:bg-secondary transition-colors" title={t('edge.changeCondition')}>
                <Settings2 className="w-3 h-3 text-muted-foreground" />
              </button>
              {condition === 'conditional' && (
                <button onClick={openExprEditor} className="w-5 h-5 flex items-center justify-center rounded hover:bg-chart-4/20 transition-colors" title={t('edge.expression')}>
                  <span className="text-[9px]">⚡</span>
                </button>
              )}
              <button onClick={handleDelete} className="w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/20 transition-colors" title={t('edge.deleteEdge')}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          )}

          {/* محرر الشرط المخصص */}
          {showExprInput && (
            <div
              className="bg-background/95 backdrop-blur-md border border-chart-4/40 rounded-xl shadow-xl p-3 min-w-[220px]"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-semibold text-chart-4 mb-1.5">⚡ {t('edge.expression')}</p>
              <input
                ref={inputRef}
                type="text"
                value={exprValue}
                onChange={(e) => setExprValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveExpression(); if (e.key === 'Escape') setShowExprInput(false); }}
                placeholder={t('edge.expressionHint')}
                className="w-full h-7 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-chart-4"
              />
              <div className="flex gap-1 mt-2">
                <button
                  onClick={saveExpression}
                  className="flex-1 h-6 rounded-lg bg-chart-4/20 text-chart-4 text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-chart-4/30 transition-colors"
                >
                  <Save className="w-2.5 h-2.5" /> {t('edge.expressionSave')}
                </button>
                <button
                  onClick={() => setShowExprInput(false)}
                  className="h-6 px-2 rounded-lg bg-secondary text-muted-foreground text-[10px] hover:bg-secondary/80 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(CustomEdge);
