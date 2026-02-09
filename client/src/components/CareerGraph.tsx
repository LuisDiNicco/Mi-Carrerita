import { useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css'; 

// Importamos el componente Y el tipo que acabamos de definir
import { SubjectNode } from './SubjectNode';
import type { SubjectNodeType } from './SubjectNode';

import { SubjectStatus } from '../types/academic';
import type { Subject } from '../types/academic';

const nodeTypes: NodeTypes = {
  subject: SubjectNode,
};

const MOCK_SUBJECTS: Subject[] = [
  { id: '1', planCode: '3621', name: 'Matemática Discreta', semester: 1, credits: 4, status: SubjectStatus.APROBADA, grade: 9, requiredSubjectIds: [] },
  { id: '2', planCode: '3623', name: 'Programación Inicial', semester: 1, credits: 8, status: SubjectStatus.REGULARIZADA, grade: null, requiredSubjectIds: [] },
  { id: '3', planCode: '3629', name: 'Prog. Estructurada', semester: 2, credits: 8, status: SubjectStatus.DISPONIBLE, grade: null, requiredSubjectIds: ['3623'] },
  { id: '4', planCode: '3652', name: 'Prog. Avanzada', semester: 6, credits: 8, status: SubjectStatus.PENDIENTE, grade: null, requiredSubjectIds: ['3629'] },
];

export const CareerGraph = () => {
  // SOLUCIÓN AL ERROR DE NEVER: Agregamos el Genérico <Node>
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    // Tipamos explícitamente la creación de nodos
    const newNodes: SubjectNodeType[] = MOCK_SUBJECTS.map((sub, index) => ({
      id: sub.id,
      type: 'subject', 
      position: { x: index * 250, y: sub.semester * 100 }, 
      data: { subject: sub }, 
    }));

    const newEdges: Edge[] = [];
    MOCK_SUBJECTS.forEach((sub) => {
        sub.requiredSubjectIds.forEach((reqCode) => {
            const reqSubject = MOCK_SUBJECTS.find(s => s.planCode === reqCode);
            if (reqSubject) {
                newEdges.push({
                    id: `e${reqSubject.id}-${sub.id}`,
                    source: reqSubject.id,
                    target: sub.id,
                    animated: true,
                    style: { stroke: '#999' },
                });
            }
        });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-screen bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        snapToGrid={true} 
        snapGrid={[20, 20]}
      >
        <Background color="#ccc" gap={40} size={1} />
        <Controls className="!bg-white !text-black shadow-lg" />
        <MiniMap 
            className="border shadow-lg"
            nodeColor={(n) => {
                // Validación de tipo segura (Type Guard)
                const isSubjectNode = (node: Node): node is SubjectNodeType => 
                    node.type === 'subject' && 'subject' in node.data;

                if (isSubjectNode(n)) {
                     const status = n.data.subject.status;
                     switch (status) {
                        case SubjectStatus.APROBADA: return '#22c55e'; 
                        case SubjectStatus.REGULARIZADA: return '#86efac'; 
                        case SubjectStatus.EN_CURSO: return '#3b82f6'; 
                        case SubjectStatus.DISPONIBLE: return '#fef08a'; 
                        default: return '#e5e7eb'; 
                    }
                }
                return '#eee';
            }} 
        />
      </ReactFlow>
    </div>
  );
};