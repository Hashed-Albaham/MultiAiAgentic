import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, useReactFlow } from '@xyflow/react';
import { memo, useState } from 'react';
import { Trash2, Settings2, RotateCw } from 'lucide-react';

const conditionLabels: Record<string, string> = {
  always: 'دائماً',
  on_success: '✓ نجاح',
  on_error: '✗ خطأ',
  conditional: '⚡ شرطي',
};

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
  const condition = (data?.condition as string) || 'always';
  const isLoop = !!(data?.isLoop);
  const loopCount = (data?.loopCount as number) || 0;
  const color = isLoop ? 'hsl(280, 80%, 60%)' : (conditionColors[condition] || conditionColors.always);

  const { setEdges } = useReactFlow();
  const [showMenu, setShowMenu] = useState(false);

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
          dir="rtl"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {/* تسمية الحالة */}
          <span
            style={{
              color,
              background: `${color}15`,
              borderColor: `${color}40`,
            }}
            className="px-2 py-0.5 rounded-full border text-[10px] font-medium cursor-pointer"
            onClick={cycleCondition}
          >
            {isLoop ? `🔄 دورة ×${loopCount}` : (conditionLabels[condition] || condition)}
          </span>

          {/* أزرار التحكم — تظهر عند hover */}
          {(showMenu || selected) && (
            <div className="flex gap-0.5 bg-background/90 backdrop-blur rounded-lg border border-border p-0.5 shadow-lg">
              {/* تبديل الشرط */}
              <button
                onClick={cycleCondition}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-secondary transition-colors"
                title="تغيير الشرط"
              >
                <Settings2 className="w-3 h-3 text-muted-foreground" />
              </button>
              {/* حذف الرابط */}
              <button
                onClick={handleDelete}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/20 transition-colors"
                title="حذف الرابط"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(CustomEdge);
