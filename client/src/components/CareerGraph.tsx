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
import { calculateProgress, groupBySemester, cn, truncateSubjectName, formatGrade  } from '../lib/utils';

// Tipos de nodo
const nodeTypes: NodeTypes = {
  subject: SubjectNode,
};

// Variables de entorno (crear archivo .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configuración de layout mejorada
const LAYOUT_CONFIG = {
  horizontalSpacing: 300,  // Espacio entre semestres
  verticalSpacing: 160,    // Espacio entre materias
  offsetX: 50,             // Offset inicial X
  offsetY: 50,             // Offset inicial Y
};

export const CareerGraph = () => {
  // Estados de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    inProgress: 0,
    available: 0,
  });

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
        const totalInSemester = subjects.length;
        
        subjects.forEach((subject, index) => {
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

      // Calcular estadísticas
      const newStats = {
        total: data.length,
        approved: data.filter(s => s.status === SubjectStatus.APROBADA).length,
        inProgress: data.filter(s => s.status === SubjectStatus.EN_CURSO).length,
        available: data.filter(s => s.status === SubjectStatus.DISPONIBLE).length,
      };

      setNodes(newNodes);
      setEdges(newEdges);
      setStats(newStats);
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
  }, [setNodes, setEdges]);

  // Cargar datos al montar
  useEffect(() => {
    fetchCareerData();
  }, [fetchCareerData]);

  // Renderizado condicional de Loading
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-retro-dark">
        <RetroLoading message="CARGANDO CARRERITA..." />
      </div>
    );
  }

  // Renderizado condicional de Error
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-retro-dark">
        <RetroError 
          title="¡OH NO!"
          message={error}
          onRetry={fetchCareerData}
        />
      </div>
    );
  }

  // Progreso
  const progress = calculateProgress(stats.total, stats.approved);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-retro-dark to-[#1a3a1a]">
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
      >
        {/* Fondo estilo retro con puntos */}
        <Background 
          color="#306230" 
          gap={24} 
          size={2}
          variant={BackgroundVariant.Dots}
          style={{ opacity: 0.3 }}
        />

        {/* Controles personalizados */}
        <Controls 
          className="!bg-retro-dark !border-4 !border-unlam-500 !shadow-retro
                     [&>button]:!bg-unlam-500 [&>button]:!border-2 [&>button]:!border-unlam-800
                     [&>button]:hover:!bg-unlam-600
                     !font-retro"
          showInteractive={false}
        />

        {/* MiniMap con colores personalizados */}
        <MiniMap 
          className="!border-4 !border-unlam-500 !shadow-retro !rounded-lg overflow-hidden"
          nodeColor={(node) => {
            const isSubjectNode = (n: Node): n is SubjectNodeType => 
              n.type === 'subject' && 'subject' in n.data;

            if (isSubjectNode(node)) {
              const status = node.data.subject.status;
              const colorMap = {
                [SubjectStatus.APROBADA]: '#73D216',
                [SubjectStatus.REGULARIZADA]: '#8AE234', 
                [SubjectStatus.EN_CURSO]: '#729FCF',
                [SubjectStatus.DISPONIBLE]: '#FCE94F',
                [SubjectStatus.PENDIENTE]: '#6B7280',
              };
              return colorMap[status] || '#6B7280';
            }
            return '#9CA3AF';
          }}
          maskColor="rgba(15, 56, 15, 0.8)"
        />

        {/* Panel de estadísticas (arriba a la izquierda) */}
        <Panel position="top-left" className="m-4">
          <div className="bg-retro-dark border-4 border-unlam-500 p-4 rounded-lg shadow-retro
                          font-retro text-unlam-500 min-w-[280px]">
            {/* Título */}
            <h2 className="text-2xl font-bold mb-4 text-center tracking-wider
                           text-shadow-[2px_2px_0_rgba(48,98,48,1)]">
              MI CARRERITA 🎮
            </h2>

            {/* Barra de progreso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>PROGRESO</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="h-6 border-4 border-unlam-500 bg-black/50 overflow-hidden">
                <div 
                  className="h-full bg-unlam-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-sm">
              <StatRow label="Total" value={stats.total} icon="📊" />
              <StatRow label="Aprobadas" value={stats.approved} icon="🏆" />
              <StatRow label="En Curso" value={stats.inProgress} icon="📚" />
              <StatRow label="Disponibles" value={stats.available} icon="🎯" />
            </div>
          </div>
        </Panel>

        {/* Leyenda (abajo a la derecha) */}
        <Panel position="bottom-right" className="m-4">
          <div className="bg-retro-dark border-4 border-unlam-500 p-3 rounded-lg shadow-retro
                          font-retro text-xs text-unlam-500">
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
    </div>
  );
};

// Componentes auxiliares
const StatRow = ({ label, value, icon }: { label: string; value: number; icon: string }) => (
  <div className="flex justify-between items-center border-b-2 border-unlam-500/30 pb-1">
    <span className="flex items-center gap-2">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
    <span className="font-bold text-lg">{value}</span>
  </div>
);

const LegendItem = ({ emoji, label }: { emoji: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span>{emoji}</span>
    <span>{label}</span>
  </div>
);
