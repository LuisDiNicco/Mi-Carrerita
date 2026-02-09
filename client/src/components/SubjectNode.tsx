// client/src/components/SubjectNode.tsx (VERSIÓN MEJORADA)
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { SubjectStatus } from '../types/academic';
import type { Subject } from '../types/academic';
import { cn, truncateSubjectName, formatGrade } from '../lib/utils';
import { useState } from 'react';

// Tipo de nodo específico
export type SubjectNodeType = Node<{ subject: Subject }, 'subject'>;

// Configuración de estilos por estado (temática retro/8-bits)
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
};

// Componente de nodo mejorado
export const SubjectNode = ({ data, selected }: NodeProps<SubjectNodeType>) => {
  const subject = data.subject;
  const [isHovered, setIsHovered] = useState(false);
  
  if (!subject) {
    return <div className="p-4 bg-red-500 text-white">ERROR: Materia no encontrada</div>;
  }

  const statusConfig = STATUS_STYLES[subject.status];
  const emoji = statusConfig.emoji;
  const canInteract = subject.status !== SubjectStatus.PENDIENTE;

  return (
    <div
      className={cn(
        // Container base
        'relative group transition-all duration-200',
        'w-56',
        
        // Efecto de selección
        selected && 'scale-105 z-50'
      )}
      onMouseEnter={() => canInteract && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Handles de conexión */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-unlam-500 !border-2 !border-unlam-800 !w-3 !h-3"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Cuerpo principal del nodo */}
      <div
        className={cn(
          // Estilos base
          'p-4 rounded-lg border-4',
          'font-retro text-center',
          'transition-all duration-200',
          
          // Sombra retro
          'shadow-subtle',
          isHovered && canInteract && 'shadow-soft translate-x-[2px] translate-y-[2px]',
          
          // Estilos según estado
          statusConfig.container,
          statusConfig.border,
          
          // Opacidad si está bloqueada
          subject.status === SubjectStatus.PENDIENTE && 'opacity-60',
          
          // Glow effect para disponibles
          subject.status === SubjectStatus.DISPONIBLE && 'ring-2 ring-yellow-300/40',
          
          // Efecto de aprobada
          subject.status === SubjectStatus.APROBADA && 'ring-2 ring-green-300/40'
        )}
      >
        {/* Header: Código de plan + Emoji */}
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            'text-xs font-bold uppercase tracking-wider px-2 py-1 rounded',
            'border-2',
            statusConfig.badge
          )}>
            {subject.planCode}
          </span>
          
          <span className="text-2xl" role="img" aria-label={subject.status}>
            {emoji}
          </span>
        </div>

        {/* Nombre de la materia */}
        <h3 className={cn(
          'text-sm leading-tight mb-2 min-h-[40px]',
          'flex items-center justify-center',
          subject.status === SubjectStatus.APROBADA && 'text-[#0B2A14]'
        )}>
          {truncateSubjectName(subject.name, 40)}
        </h3>

        {/* Info adicional: Créditos y Nota */}
        <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t-2 border-current/30">
          {/* Créditos */}
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>{subject.credits || 0}</span>
          </div>

          {/* Nota (si existe) */}
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

        {/* Tooltip en hover (solo si puede interactuar) */}
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

      {/* Efecto de partículas para materias aprobadas */}
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-20px); opacity: 0; }
        }

        .text-shadow-retro {
          text-shadow: none;
        }
      `}</style>
    </div>
  );
};

// Helper para texto del tooltip
function getTooltipText(subject: Subject): string {
  const statusMessages = {
    [SubjectStatus.DISPONIBLE]: '¡Podés cursar esta materia!',
    [SubjectStatus.EN_CURSO]: 'Cursando actualmente',
    [SubjectStatus.REGULARIZADA]: 'Materia regularizada',
    [SubjectStatus.APROBADA]: '¡Materia aprobada!',
  };

  return statusMessages[subject.status as keyof typeof statusMessages] || subject.name;
}
