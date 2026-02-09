// client/src/components/CareerGraph.tsx (VERSIÓN MEJORADA)
import { useEffect, useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import type { Node, Edge, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css'; 

import { SubjectNode } from './SubjectNode';
import type { SubjectNodeType } from './SubjectNode';
import { SubjectStatus } from '../types/academic';
import type { Subject } from '../types/academic';
import { RetroLoading, RetroError } from './ui/RetroComponents';
import { groupBySemester } from '../lib/utils';
import { SubjectUpdatePanel } from './SubjectUpdatePanel';
import { useAcademicStore } from '../store/academic-store';

// Tipos de nodo
const nodeTypes: NodeTypes = {
  subject: SubjectNode,
};

// Variables de entorno (crear archivo .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configuración de layout mejorada
const LAYOUT_CONFIG = {
  horizontalSpacing: 320,
  verticalSpacing: 150,
  offsetX: 40,
  offsetY: 40,
};

export const CareerGraph = () => {
  // Estados de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const setSubjects = useAcademicStore((state) => state.setSubjects);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  /**
   * Calcula posición mejorada evitando overlapping
   */
  const calculateNodePosition = (
    semester: number,
    indexInSemester: number,
    totalInSemester: number
  ): { x: number; y: number } => {
    const x = LAYOUT_CONFIG.offsetX + (semester - 1) * LAYOUT_CONFIG.horizontalSpacing;
    
    // Centrar verticalmente las materias de cada semestre
    const totalHeight = (totalInSemester - 1) * LAYOUT_CONFIG.verticalSpacing;
    const startY = LAYOUT_CONFIG.offsetY - (totalHeight / 2);
    const y = startY + indexInSemester * LAYOUT_CONFIG.verticalSpacing;
    
    return { x, y };
  };

  /**
   * Fetch de datos del backend
   */
  const fetchCareerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/academic-career/graph`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
        
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: Subject[] = await response.json();

      // Validación básica
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No se recibieron materias del servidor');
      }

      // Agrupar por semestre para mejor layout
      const bySemester = groupBySemester(data);

      // Generar nodos con posicionamiento mejorado
      const newNodes: SubjectNodeType[] = [];
      
      bySemester.forEach((subjects, semester) => {
        const sorted = [...subjects].sort((a, b) => a.planCode.localeCompare(b.planCode));
        const totalInSemester = sorted.length;
        
        sorted.forEach((subject, index) => {
          const position = calculateNodePosition(semester, index, totalInSemester);
          
          newNodes.push({
            id: subject.id,
            type: 'subject',
            position,
            data: { subject },
            // Configuraciones adicionales
            draggable: true,
            selectable: true,
          });
        });
      });

      // Generar edges (correlatividades)
      const newEdges: Edge[] = [];
      
      data.forEach((subject) => {
        subject.requiredSubjectIds.forEach((reqCode) => {
          const reqSubject = data.find(s => s.planCode === reqCode);
          
          if (reqSubject) {
            // Color basado en estado
            const isBlocked = subject.status === SubjectStatus.PENDIENTE;
            const edgeColor = isBlocked ? '#6B7280' : '#10B981';
            
            newEdges.push({
              id: `e-${reqSubject.id}-${subject.id}`,
              source: reqSubject.id,
              target: subject.id,
              animated: !isBlocked,
              style: { 
                stroke: edgeColor, 
                strokeWidth: 3,
              },
              type: 'smoothstep',
            });
          }
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setSubjects(data);
      setError(null);

    } catch (err) {
      console.error('Error al cargar la carrera:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error desconocido al cargar los datos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges, setSubjects]);

  // Cargar datos al montar
  useEffect(() => {
    fetchCareerData();
  }, [fetchCareerData]);

  // Renderizado condicional de Loading
  if (loading) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-surface">
        <RetroLoading message="CARGANDO CARRERITA..." />
      </div>
    );
  }

  // Renderizado condicional de Error
  if (error) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-surface">
        <RetroError 
          title="¡OH NO!"
          message={error}
          onRetry={fetchCareerData}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-[70vh] bg-app rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.2,
          maxZoom: 1.2,
        }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        // Configuraciones de accesibilidad
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        onNodeDoubleClick={(_, node) => {
          const subject = (node.data as { subject?: Subject }).subject;
          if (subject) {
            setActiveSubject(subject);
            setIsPanelOpen(true);
          }
        }}
      >
        {/* Fondo estilo retro con puntos */}
        <Background 
          color="#7BCB7A" 
          gap={28} 
          size={2}
          variant={BackgroundVariant.Dots}
          style={{ opacity: 0.3 }}
        />

        {/* Controles personalizados */}
        <Controls 
          className="!bg-surface !border-2 !border-app !shadow-subtle
                     [&>button]:!bg-unlam-500 [&>button]:!border-0
                     [&>button]:hover:!bg-unlam-600
                     !font-retro"
          showInteractive={false}
        />

        {/* MiniMap con colores personalizados */}
        <MiniMap 
          className="!border-2 !border-app !shadow-subtle !rounded-lg overflow-hidden"
          nodeColor={(node) => {
            const isSubjectNode = (n: Node): n is SubjectNodeType => 
              n.type === 'subject' && 'subject' in n.data;

            if (isSubjectNode(node)) {
              const status = node.data.subject.status;
              const colorMap = {
                [SubjectStatus.APROBADA]: '#7BCB7A',
                [SubjectStatus.REGULARIZADA]: '#B4E6A6', 
                [SubjectStatus.EN_CURSO]: '#8FB5DD',
                [SubjectStatus.DISPONIBLE]: '#F7E8A3',
                [SubjectStatus.PENDIENTE]: '#8A9B8A',
              };
              return colorMap[status] || '#6B7280';
            }
            return '#9CA3AF';
          }}
          maskColor="rgba(10, 20, 12, 0.65)"
        />

        <Panel position="top-left" className="m-4">
          <div className="bg-surface border border-app rounded-lg px-3 py-2 text-xs text-muted shadow-subtle">
            Doble clic en una materia para actualizar el estado.
          </div>
        </Panel>

        {/* Leyenda (abajo a la derecha) */}
        <Panel position="bottom-right" className="m-4">
          <div className="bg-surface border-2 border-app p-3 rounded-lg shadow-subtle
                          font-retro text-xs text-app">
            <div className="font-bold mb-2 text-center">LEYENDA</div>
            <div className="space-y-1">
              <LegendItem emoji="🔒" label="Bloqueada" />
              <LegendItem emoji="🎯" label="Disponible" />
              <LegendItem emoji="📚" label="En Curso" />
              <LegendItem emoji="✅" label="Regular" />
              <LegendItem emoji="🏆" label="Aprobada" />
            </div>
          </div>
        </Panel>
      </ReactFlow>

      <SubjectUpdatePanel
        subject={activeSubject}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setActiveSubject(null);
        }}
        onSave={async (payload) => {
          if (!activeSubject) return;
          const response = await fetch(`${API_URL}/academic-career/subjects/${activeSubject.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error('No se pudo actualizar la materia.');
          }
          await fetchCareerData();
        }}
      />
    </div>
  );
};

// Componentes auxiliares
const LegendItem = ({ emoji, label }: { emoji: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span>{emoji}</span>
    <span>{label}</span>
  </div>
);
