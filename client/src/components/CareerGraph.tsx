import { useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css'; 

// Importamos componentes y tipos propios
import { SubjectNode } from './SubjectNode';
import type { SubjectNodeType } from './SubjectNode';
import { SubjectStatus } from '../types/academic';
import type { Subject } from '../types/academic';

const nodeTypes: NodeTypes = {
  subject: SubjectNode,
};

const API_URL = 'http://localhost:3000/academic-career/graph';

export const CareerGraph = () => {
  // Estados de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Estados de Carga y Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCareerData = async () => {
      try {
        setLoading(true);
        // 1. Petición al Backend
        const response = await fetch(API_URL);
        
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.statusText}`);
        }

        const data: Subject[] = await response.json();

        // 2. Variables auxiliares para el posicionamiento automático
        // Contamos cuántas materias hay por semestre para apilarlas verticalmente
        const semesterCounts: Record<number, number> = {};

        // 3. Transformar Datos (Backend) -> Nodos (React Flow)
        const newNodes: SubjectNodeType[] = data.map((sub) => {
          // Calculamos posición
          const semesterIndex = sub.semester - 1; // Base 0
          const countInSemester = semesterCounts[sub.semester] || 0;
          semesterCounts[sub.semester] = countInSemester + 1;

          return {
            id: sub.id,
            type: 'subject',
            // X: Separación por semestre (350px)
            // Y: Separación entre materias del mismo semestre (180px)
            position: { x: semesterIndex * 350, y: countInSemester * 180 }, 
            data: { subject: sub },
          };
        });

        // 4. Transformar Correlatividades -> Aristas (Edges)
        const newEdges: Edge[] = [];
        
        data.forEach((sub) => {
            // 'sub' es la materia que se desbloquea (Destino)
            // 'reqCode' es el código de plan de la materia necesaria (Origen)
            sub.requiredSubjectIds.forEach((reqCode) => {
                // Buscamos el ID (UUID) de la materia requisito usando su planCode
                const reqSubject = data.find(s => s.planCode === reqCode);
                
                if (reqSubject) {
                    newEdges.push({
                        id: `e-${reqSubject.id}-${sub.id}`,
                        source: reqSubject.id, // Origen: La materia previa
                        target: sub.id,        // Destino: La materia actual
                        animated: true,
                        style: { stroke: '#94a3b8', strokeWidth: 2 }, // Slate-400
                        type: 'smoothstep', // Líneas con ángulos rectos (más prolijo)
                    });
                }
            });
        });

        setNodes(newNodes);
        setEdges(newEdges);
        setError(null);
      } catch (err) {
        console.error("Fallo al cargar carrera:", err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCareerData();
  }, [setNodes, setEdges]);

  // Renderizado Condicional (Loading / Error)
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-semibold text-slate-600 animate-pulse">
          Cargando tu plan de estudios...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-red-50">
        <div className="text-red-600 p-4 border border-red-200 rounded-lg bg-white shadow-lg">
          <h3 className="font-bold mb-2">Ocurrió un error</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        snapToGrid={true} 
        snapGrid={[20, 20]}
      >
        <Background color="#cbd5e1" gap={40} size={1} />
        <Controls className="!bg-white !text-slate-700 shadow-xl border border-slate-200" />
        <MiniMap 
            className="border-2 border-slate-200 shadow-xl rounded-lg overflow-hidden"
            nodeColor={(n) => {
                // Type Guard para asegurar que es nuestro tipo de nodo
                const isSubjectNode = (node: Node): node is SubjectNodeType => 
                    node.type === 'subject' && 'subject' in node.data;

                if (isSubjectNode(n)) {
                     const status = n.data.subject.status;
                     switch (status) {
                        case SubjectStatus.APROBADA: return '#22c55e'; 
                        case SubjectStatus.REGULARIZADA: return '#86efac'; 
                        case SubjectStatus.EN_CURSO: return '#3b82f6'; 
                        case SubjectStatus.DISPONIBLE: return '#fef08a'; 
                        default: return '#e2e8f0'; 
                    }
                }
                return '#eee';
            }} 
        />
      </ReactFlow>
    </div>
  );
};