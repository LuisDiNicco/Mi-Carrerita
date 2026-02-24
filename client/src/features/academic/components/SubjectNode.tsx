import { useState, memo } from 'react';
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

const STATUS_STYLES: Record<SubjectStatus, {
  container: string;
  badge: string;
  emoji: string;
  border: string;
}> = {
  [SubjectStatus.EQUIVALENCIA]: {
    container: 'bg-[#B084CC] text-[#291736]',
    badge: 'bg-[#8F66A8] border-[#6D4284] text-white',
    emoji: '🤝',
    border: 'border-[#6D4284]',
  },
  [SubjectStatus.PENDIENTE]: {
    container: 'bg-[#353C35] text-[#C5D2C5]',
    badge: 'bg-[#3E4A3E] border-[#2A342A] text-[#E8F2E8]',
    emoji: '🔒',
    border: 'border-[#2A342A]',
  },
  [SubjectStatus.DISPONIBLE]: {
    container: 'bg-[#F7E8A3] text-[#2E3436]',
    badge: 'bg-[#E4C96A] border-[#C4A85B] text-[#2E3436]',
    emoji: '🎯',
    border: 'border-[#C4A85B]',
  },
  [SubjectStatus.EN_CURSO]: {
    container: 'bg-[#8FB5DD] text-[#1C2B3A]',
    badge: 'bg-[#5F89BF] border-[#3F6FA2] text-white',
    emoji: '📚',
    border: 'border-[#3F6FA2]',
  },
  [SubjectStatus.REGULARIZADA]: {
    container: 'bg-[#B4E6A6] text-[#1F2A1F]',
    badge: 'bg-[#6BBE6E] border-[#4F9C52] text-white',
    emoji: '✅',
    border: 'border-[#4F9C52]',
  },
  [SubjectStatus.APROBADA]: {
    container: 'bg-[#7BCB7A] text-[#0B2A14] font-bold',
    badge: 'bg-[#4FAE59] border-[#2E7D4D] text-[#0B2A14]',
    emoji: '🏆',
    border: 'border-[#2E7D4D]',
  },
  [SubjectStatus.RECURSADA]: {
    container: 'bg-[#E57373] text-[#2C0B0E]',
    badge: 'bg-[#EF5350] border-[#B71C1C] text-[#2C0B0E]',
    emoji: '⚠️',
    border: 'border-[#B71C1C]',
  },
};

const NODE_WIDTH_PX = 280;
const SUBJECT_NAME_MAX = 48;
const TITLE_CLASS = 'text-xl leading-tight';
const META_CLASS = 'text-lg';
const BADGE_CLASS = 'text-base';

const SubjectNodeComponent = ({ data, selected }: NodeProps<SubjectNodeType>) => {
  const subject = data.subject;
  const [isHovered, setIsHovered] = useState(false);

  if (!subject) {
    return <div className="p-4 bg-red-500 text-white">ERROR: Materia no encontrada</div>;
  }

  const statusConfig = STATUS_STYLES[subject.status];
  const emoji = statusConfig.emoji;
  const isCritical = Boolean(data.isCritical);
  const isRecentlyUpdated = Boolean(data.isRecentlyUpdated);
  const isFocused = Boolean(data.isFocused);
  const isPrerequisite = Boolean((data as any).isPrerequisite);
  const isFullUnlock = Boolean((data as any).isFullUnlock);
  const isPartialUnlock = Boolean((data as any).isPartialUnlock);
  const isHoveredNode = Boolean((data as any).isHoveredNode);
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
      style={{ imageRendering: 'pixelated', width: NODE_WIDTH_PX }}
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
          isCritical && 'border-red-400 critical-glow',
          isFocused && 'ring-4 ring-red-400/60',
          subject.status === SubjectStatus.PENDIENTE && !isHighlighted && 'opacity-60',
          subject.status === SubjectStatus.DISPONIBLE && 'ring-2 ring-yellow-300/40',
          subject.status === SubjectStatus.APROBADA && 'ring-2 ring-green-300/40',
          subject.status === SubjectStatus.EQUIVALENCIA && 'ring-2 ring-purple-300/40',
          isRecentlyUpdated && 'subject-update-flash subject-update-fill',
          // Hover highlights override all other rings
          isHoveredNode && 'ring-4 ring-white/80 scale-105 z-50 shadow-lg',
          isPrerequisite && '!ring-4 !ring-orange-400/90 opacity-100',
          isFullUnlock && '!ring-4 !ring-green-400/90 opacity-100',
          isPartialUnlock && '!ring-4 !ring-yellow-300/90 opacity-90',
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            BADGE_CLASS,
            'font-bold uppercase tracking-wider px-2 py-1 rounded',
            'border-2',
            statusConfig.badge
          )}>
            {subject.planCode}
          </span>

          <span className="text-4xl" role="img" aria-label={subject.status}>
            {emoji}
          </span>
        </div>

        <h3 className={cn(
          TITLE_CLASS,
          'mb-3 min-h-[56px]',
          'flex items-center justify-center',
          subject.status === SubjectStatus.APROBADA && 'text-[#0B2A14]',
          subject.status === SubjectStatus.EQUIVALENCIA && 'text-[#291736]'
        )}>
          {truncateSubjectName(subject.name, SUBJECT_NAME_MAX)}
        </h3>

        <div className={cn('flex items-center justify-between mt-3 pt-2 border-t-2 border-current/30', META_CLASS)}>
          <div className="flex items-center gap-1">
            <span>⭐</span>
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
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 origin-bottom
                          bg-[#1C2B1F] text-white px-4 py-2 rounded-lg
                          border-2 border-app
                          whitespace-nowrap font-bold
                          shadow-lg tracking-wide
                          animate-[fadeIn_0.2s_ease-out]"
            style={{ transform: `translateX(-50%)` }}>
            {getTooltipText(subject)}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2
                            w-3 h-3 bg-[#1C2B1F] border-r-2 border-b-2 border-app
                            rotate-45" />
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
    (prevProps.data as any).isPrerequisite === (nextProps.data as any).isPrerequisite &&
    (prevProps.data as any).isFullUnlock === (nextProps.data as any).isFullUnlock &&
    (prevProps.data as any).isPartialUnlock === (nextProps.data as any).isPartialUnlock &&
    (prevProps.data as any).isHoveredNode === (nextProps.data as any).isHoveredNode
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
