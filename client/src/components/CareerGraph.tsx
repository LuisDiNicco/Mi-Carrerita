import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css'; // <--- ¡MUY IMPORTANTE! (Si falta, se ve blanco)
import { SubjectNode } from './SubjectNode';

// Registramos nuestros nodos personalizados
const nodeTypes = {
  subject: SubjectNode,
};

export const CareerGraph = () => {
  // Estados iniciales vacíos (en el próximo paso los llenamos con datos reales)
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  return (
    <div className="w-full h-screen bg-unlam-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        // Snap to grid para sensación de editor de niveles
        snapToGrid={true} 
        snapGrid={[20, 20]}
      >
        <Background color="#006633" gap={40} size={1} />
        <Controls className="!bg-white !border-2 !border-black !shadow-retro !text-black" />
        <MiniMap 
            className="!border-2 !border-black !shadow-retro"
            nodeColor={(n) => {
                // Colorear minimapa según estado
                if (n.data?.subject?.status === 'APROBADA') return '#006633';
                if (n.data?.subject?.status === 'DISPONIBLE') return '#fff';
                return '#ccc';
            }} 
        />
      </ReactFlow>
    </div>
  );
};