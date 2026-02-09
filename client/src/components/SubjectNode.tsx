import { Handle, Position, type NodeProps } from '@xyflow/react';import { clsx } from 'clsx'; // Utility para clases condicionales
import { type Subject } from '../store/academic-store.ts'; // Importamos la interfaz del store

// Definimos el tipo de dato que espera el nodo
type SubjectNodeData = {
  subject: Subject;
};

export const SubjectNode = ({ data, selected }: NodeProps<SubjectNodeData>) => {
  const { subject } = data;

  // Lógica de estilos según estado
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'APROBADA':
        return 'bg-unlam-500 text-white border-black';
      case 'REGULARIZADA':
        return 'bg-yellow-100 text-yellow-900 border-black';
      case 'EN_CURSO':
        return 'bg-blue-100 text-blue-900 border-black animate-pulse'; // Late suavemente
      case 'DISPONIBLE':
        return 'bg-white text-unlam-800 border-unlam-500 cursor-pointer hover:bg-unlam-50';
      default: // PENDIENTE
        return 'bg-gray-200 text-gray-500 border-gray-400 grayscale opacity-80';
    }
  };

  return (
    <div
      className={clsx(
        // Base styles (Pixel Art Box)
        'relative w-[180px] p-2 rounded-none transition-all duration-200',
        'border-2 shadow-retro', // Borde grueso y sombra dura
        getStatusStyles(subject.status),
        selected && 'ring-2 ring-retro-accent shadow-none translate-y-[4px] translate-x-[4px]', // Efecto "Presionado" al seleccionar
      )}
    >
      {/* Handles: Los puntos de conexión invisibles para las flechas */}
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0" />
      
      {/* Header: Código y Cuatrimestre */}
      <div className="flex justify-between items-center mb-1 border-b border-current pb-1 border-dashed opacity-70">
        <span className="font-retro text-xs">{subject.planCode}</span>
        <span className="font-retro text-xs">C{subject.semester}</span>
      </div>

      {/* Body: Nombre de la Materia */}
      <div className="h-12 flex items-center justify-center text-center">
        <p className="text-xs font-bold leading-tight line-clamp-3">
          {subject.name}
        </p>
      </div>

      {/* Footer: Nota o Estado */}
      {subject.grade ? (
        <div className="absolute -top-3 -right-3 bg-yellow-400 text-black border-2 border-black w-8 h-8 flex items-center justify-center rounded-full font-retro font-bold shadow-sm rotate-12 z-10">
          {subject.grade}
        </div>
      ) : null}

      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0" />
    </div>
  );
};