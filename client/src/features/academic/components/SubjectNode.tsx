import { useState } from 'react';
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
};

export type SubjectNodeType = Node<SubjectNodeData, 'subject'>;

const STATUS_STYLES: Record<SubjectStatus, {
  container: string;
  badge: string;
  emoji: string;
  border: string;
}> = {
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

export const SubjectNode = ({ data, selected }: NodeProps<SubjectNodeType>) => {
  const subject = data.subject;
  const [isHovered, setIsHovered] = useState(false);

  if (!subject) {
    return <div className="p-4 bg-red-500 text-white">ERROR: Materia no encontrada</div>;
  }

  const statusConfig = STATUS_STYLES[subject.status];
  const emoji = statusConfig.emoji;
  const canInteract = subject.status !== SubjectStatus.PENDIENTE;
  const isCritical = Boolean(data.isCritical);
  const isRecentlyUpdated = Boolean(data.isRecentlyUpdated);
  const isFocused = Boolean(data.isFocused);

  return (
    <div
      className={cn(
        'relative group transition-all duration-200',
        selected && 'scale-105 z-50'
      )}
      onMouseEnter={() => canInteract && setIsHovered(true)}
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
          isHovered && canInteract && 'shadow-soft translate-x-[2px] translate-y-[2px]',
          statusConfig.container,
          statusConfig.border,
          isCritical && 'border-red-400 critical-glow',
          isFocused && 'ring-4 ring-red-400/60',
          subject.status === SubjectStatus.PENDIENTE && 'opacity-60',
          subject.status === SubjectStatus.DISPONIBLE && 'ring-2 ring-yellow-300/40',
          subject.status === SubjectStatus.APROBADA && 'ring-2 ring-green-300/40',
          isRecentlyUpdated && 'subject-update-flash subject-update-fill'
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
          subject.status === SubjectStatus.APROBADA && 'text-[#0B2A14]'
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

        {isHovered && canInteract && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-50
                          bg-[#1C2B1F] text-white text-xs px-3 py-2 rounded
                          border border-app
                          whitespace-nowrap
                          shadow-subtle
                          animate-[fadeIn_0.2s_ease-in]">
            {getTooltipText(subject)}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2
                            w-2 h-2 bg-[#1C2B1F] border-r border-b border-app
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
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-float"
              style={{
                left: `${20 + i * 30}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s',
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
};

function getTooltipText(subject: Subject): string {
  const statusMessages = {
    [SubjectStatus.DISPONIBLE]: '¡Podes cursar esta materia!',
    [SubjectStatus.EN_CURSO]: 'Cursando actualmente',
    [SubjectStatus.REGULARIZADA]: 'Materia regularizada',
    [SubjectStatus.APROBADA]: '¡Materia aprobada!',
    [SubjectStatus.RECURSADA]: 'Tendrás que recursar esta materia',
  };

  return statusMessages[subject.status as keyof typeof statusMessages] || subject.name;
}
