import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { SubjectStatus } from '../types/academic';
import type { Subject } from '../types/academic';

// 1. Definimos nuestro tipo de Nodo específico
// Node<Data, TypeString>
export type SubjectNodeType = Node<{ subject: Subject }, 'subject'>;

const STATUS_STYLES: Record<SubjectStatus, string> = {
  [SubjectStatus.PENDIENTE]: 'bg-gray-200 border-gray-400 text-gray-500 opacity-80',
  [SubjectStatus.DISPONIBLE]: 'bg-white border-yellow-500 text-gray-800 shadow-md ring-2 ring-yellow-200',
  [SubjectStatus.EN_CURSO]: 'bg-blue-100 border-blue-600 text-blue-900 shadow-lg',
  [SubjectStatus.REGULARIZADA]: 'bg-green-100 border-green-500 text-green-800',
  [SubjectStatus.APROBADA]: 'bg-green-500 border-green-700 text-white shadow-lg font-bold',
};

// 2. Usamos el tipo específico en las Props
export const SubjectNode = ({ data }: NodeProps<SubjectNodeType>) => {
  // Ahora TypeScript sabe que 'data' tiene una propiedad 'subject'
  const subject = data.subject;
  
  const statusClass = subject ? STATUS_STYLES[subject.status] : STATUS_STYLES[SubjectStatus.PENDIENTE];

  return (
    <div className={`px-4 py-2 rounded-lg border-2 w-48 text-center transition-all duration-300 ${statusClass}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      
      <div className="text-xs font-bold uppercase tracking-wider mb-1">
        {subject?.planCode || '???'}
      </div>
      
      <div className="text-sm leading-tight">
        {subject?.name || 'Materia Desconocida'}
      </div>

      {subject?.grade && (
        <div className="mt-2 text-xs bg-black/20 rounded px-1 inline-block">
            Nota: {subject.grade}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
};