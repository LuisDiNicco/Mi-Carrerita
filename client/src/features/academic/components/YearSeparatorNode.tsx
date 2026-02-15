import type { Node, NodeProps } from '@xyflow/react';

export type YearSeparatorNodeData = {
  label: string;
  width: number;
};

export type YearSeparatorNodeType = Node<YearSeparatorNodeData, 'yearSeparator'>;

export const YearSeparatorNode = ({ data }: NodeProps<YearSeparatorNodeType>) => {
  return (
    <div className="relative flex items-center justify-center pointer-events-none" style={{ width: data.width }}>
      <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-unlam-500/60" />
      <span className="relative rounded-full border-2 border-unlam-500/40 bg-app-elevated px-4 py-2 text-xs font-bold uppercase tracking-widest text-unlam-500 shadow-retro">
        AÑO {data.label}
      </span>
    </div>
  );
};
