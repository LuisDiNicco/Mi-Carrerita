import { useState, memo } from 'react';
import { Lock, BookOpen, PenTool, CheckCircle, GraduationCap, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  NODE_LAYOUT,
  NODE_TYPOGRAPHY,
  NODE_EFFECTS,
  STATUS_UI_STYLES,
  TOOLTIP_STYLES
} from '../../../styles/design-constants';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { SubjectStatus } from '../../../shared/types/academic';
import type { Subject } from '../../../shared/types/academic';
import { cn, truncateSubjectName, formatGrade } from '../../../shared/lib/utils';

type SubjectNodeData = {
  subject: Subject;
  isCritical?: boolean;
  isRecentlyUpdated?: boolean;
  isFocused?: boolean;
  // Hover highlighting flags
  isPrerequisite?: boolean;   // ancestor of hovered node — orange
  isFullUnlock?: boolean;     // this node fully unlocked by hovered — green
  isPartialUnlock?: boolean;  // partially unlocked by hovered — yellow
  isHoveredNode?: boolean;    // the node being hovered — white/bright ring
};

export type SubjectNodeType = Node<SubjectNodeData, 'subject'>;

const STATUS_STYLES_WITH_ICONS = {
  [SubjectStatus.EQUIVALENCIA]: {
    ...STATUS_UI_STYLES[SubjectStatus.EQUIVALENCIA],
    icon: <ShieldCheck size={36} strokeWidth={2.5} />,
  },
  [SubjectStatus.PENDIENTE]: {
    ...STATUS_UI_STYLES[SubjectStatus.PENDIENTE],
    icon: <Lock size={36} strokeWidth={2.5} />,
  },
  [SubjectStatus.DISPONIBLE]: {
    ...STATUS_UI_STYLES[SubjectStatus.DISPONIBLE],
    icon: <BookOpen size={36} strokeWidth={2.5} />,
  },
  [SubjectStatus.EN_CURSO]: {
    ...STATUS_UI_STYLES[SubjectStatus.EN_CURSO],
    icon: <PenTool size={36} strokeWidth={2.5} />,
  },
  [SubjectStatus.REGULARIZADA]: {
    ...STATUS_UI_STYLES[SubjectStatus.REGULARIZADA],
    icon: <CheckCircle size={36} strokeWidth={2.5} />,
  },
  [SubjectStatus.APROBADA]: {
    ...STATUS_UI_STYLES[SubjectStatus.APROBADA],
    icon: <GraduationCap size={36} strokeWidth={2.5} />,
  },
  [SubjectStatus.RECURSADA]: {
    ...STATUS_UI_STYLES[SubjectStatus.RECURSADA],
    icon: <AlertTriangle size={36} strokeWidth={2.5} />,
  },
};

const SubjectNodeComponent = ({ data, selected }: NodeProps<SubjectNodeType>) => {
  const subject = data.subject;
  const [isHovered, setIsHovered] = useState(false);

  if (!subject) {
    return <div className="p-4 bg-destructive text-white">ERROR: Materia no encontrada</div>;
  }

  const statusConfig = STATUS_STYLES_WITH_ICONS[subject.status];
  const renderedIcon = statusConfig.icon;
  const isCritical = Boolean(data.isCritical);
  const isRecentlyUpdated = Boolean(data.isRecentlyUpdated);
  const isFocused = Boolean(data.isFocused);
  const isPrerequisite = Boolean((data as Record<string, unknown>).isPrerequisite);
  const isFullUnlock = Boolean((data as Record<string, unknown>).isFullUnlock);
  const isPartialUnlock = Boolean((data as Record<string, unknown>).isPartialUnlock);
  const isHoveredNode = Boolean((data as Record<string, unknown>).isHoveredNode);
  const isHighlighted = isPrerequisite || isFullUnlock || isPartialUnlock || isHoveredNode;

  // The tooltip scale scales naturally with the node.

  return (
    <div
      className={cn(
        'relative group transition-all duration-200',
        selected && 'scale-105 z-50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ imageRendering: 'pixelated', width: NODE_LAYOUT.WIDTH_PX }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-unlam-500 !border-2 !border-unlam-800 !w-3 !h-3"
        style={{ imageRendering: 'pixelated' }}
      />

      <div
        className={cn(
          'relative p-5 rounded-lg border-4',
          'font-retro text-center',
          'transition-all duration-200',
          'shadow-subtle',
          isHovered && 'shadow-soft translate-x-[2px] translate-y-[2px]',
          statusConfig.container,
          statusConfig.border,
          isCritical && 'border-destructive critical-glow',
          isFocused && 'ring-4 ring-destructive/60',
          subject.status === SubjectStatus.PENDIENTE && !isHighlighted && 'opacity-60',
          subject.status === SubjectStatus.DISPONIBLE && 'ring-2 ring-yellow-300/40',
          subject.status === SubjectStatus.APROBADA && 'ring-2 ring-green-300/40',
          subject.status === SubjectStatus.EQUIVALENCIA && 'ring-2 ring-purple-300/40',
          isRecentlyUpdated && 'subject-update-flash subject-update-fill',
          // Hover highlights override all other rings
          isHoveredNode && NODE_EFFECTS.HOVERED_NODE,
          isPrerequisite && NODE_EFFECTS.PREREQUISITE,
          isFullUnlock && NODE_EFFECTS.FULL_UNLOCK,
          isPartialUnlock && NODE_EFFECTS.PARTIAL_UNLOCK,
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            NODE_TYPOGRAPHY.BADGE_CLASS,
            'font-bold uppercase tracking-wider px-2 py-1 rounded',
            'border-2',
            statusConfig.badge
          )}>
            {subject.planCode}
          </span>

          <div className="text-4xl" role="img" aria-label={subject.status}>
            {renderedIcon}
          </div>
        </div>

        <h3 className={cn(
          NODE_TYPOGRAPHY.TITLE_CLASS,
          'mb-3 min-h-[56px]',
          'flex items-center justify-center',
          subject.status === SubjectStatus.APROBADA && 'text-[#0B2A14]',
          subject.status === SubjectStatus.EQUIVALENCIA && 'text-[#291736]'
        )}>
          {truncateSubjectName(subject.name, NODE_LAYOUT.SUBJECT_NAME_MAX)}
        </h3>

        <div className={cn('flex items-center justify-between mt-3 pt-2 border-t-2 border-current/30', NODE_TYPOGRAPHY.META_CLASS)}>
          <div className="flex items-center gap-1">
            <span>Hs</span>
            <span>{subject.hours || 0}</span>
          </div>

          {subject.grade !== null && (
            <div className={cn(
              'px-2 py-1 rounded border-2',
              'bg-white/30 border-current',
              'font-bold'
            )}>
              {formatGrade(subject.grade)}
            </div>
          )}
        </div>

        {isHovered && (
          <div className={`absolute -top-14 left-1/2 -translate-x-1/2 z-50 origin-bottom
                          ${TOOLTIP_STYLES.BACKGROUND} ${TOOLTIP_STYLES.TEXT} px-4 py-2 rounded-lg
                          border-2 ${TOOLTIP_STYLES.BORDER}
                          whitespace-nowrap font-bold
                          shadow-lg tracking-wide
                          animate-[fadeIn_0.2s_ease-out]`}
            style={{ transform: `translateX(-50%)` }}>
            {getTooltipText(subject)}
            <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2
                            w-3 h-3 ${TOOLTIP_STYLES.BACKGROUND} border-r-2 border-b-2 ${TOOLTIP_STYLES.BORDER}
                            rotate-45`} />
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-unlam-500 !border-2 !border-unlam-800 !w-3 !h-3"
        style={{ imageRendering: 'pixelated' }}
      />

      {subject.status === SubjectStatus.APROBADA && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-float" style={{ left: '20%', animationDelay: '0s', animationDuration: '2s' }} />
          <div className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-float" style={{ left: '50%', animationDelay: '0.5s', animationDuration: '2s' }} />
          <div className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-float" style={{ left: '80%', animationDelay: '1s', animationDuration: '2s' }} />
        </div>
      )}

    </div>
  );
};

export const SubjectNode = memo(SubjectNodeComponent, (prevProps, nextProps) => {
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.data.isCritical === nextProps.data.isCritical &&
    prevProps.data.isRecentlyUpdated === nextProps.data.isRecentlyUpdated &&
    prevProps.data.isFocused === nextProps.data.isFocused &&
    prevProps.data.subject.status === nextProps.data.subject.status &&
    prevProps.data.subject.grade === nextProps.data.subject.grade &&
    (prevProps.data as Record<string, unknown>).isPrerequisite === (nextProps.data as Record<string, unknown>).isPrerequisite &&
    (prevProps.data as Record<string, unknown>).isFullUnlock === (nextProps.data as Record<string, unknown>).isFullUnlock &&
    (prevProps.data as Record<string, unknown>).isPartialUnlock === (nextProps.data as Record<string, unknown>).isPartialUnlock &&
    (prevProps.data as Record<string, unknown>).isHoveredNode === (nextProps.data as Record<string, unknown>).isHoveredNode
  );
});

function getTooltipText(subject: Subject): string {
  const statusMessages = {
    [SubjectStatus.PENDIENTE]: 'Bloqueada por correlativas',
    [SubjectStatus.DISPONIBLE]: '¡Podes cursar esta materia!',
    [SubjectStatus.EN_CURSO]: 'Cursando actualmente',
    [SubjectStatus.REGULARIZADA]: 'Materia regularizada',
    [SubjectStatus.APROBADA]: '¡Materia aprobada!',
    [SubjectStatus.RECURSADA]: 'Tendrás que recursar esta materia',
    [SubjectStatus.EQUIVALENCIA]: 'Materia concedida por equivalencia',
  };

  return statusMessages[subject.status as keyof typeof statusMessages] || subject.name;
}

