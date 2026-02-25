import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { YearSeparatorNode } from './YearSeparatorNode';

// Mock @xyflow/react internals - we only need the NodeProps shape
const makeNodeProps = (label: string, width: number) => ({
  id: `sep-1`,
  type: 'yearSeparator' as const,
  data: { label, width },
  selected: false,
  isConnectable: false,
  xPos: 0,
  yPos: 0,
  dragging: false,
  zIndex: 0,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
} as unknown as Parameters<typeof YearSeparatorNode>[0]);

describe('YearSeparatorNode', () => {
  it('renders the year label', () => {
    render(<YearSeparatorNode {...makeNodeProps('AÑO 1', 800)} />);
    expect(screen.getByText('AÑO 1')).toBeInTheDocument();
  });

  it('renders TRANSVERSAL label', () => {
    render(<YearSeparatorNode {...makeNodeProps('TRANSVERSAL', 800)} />);
    expect(screen.getByText('TRANSVERSAL')).toBeInTheDocument();
  });

  it('applies width to the container', () => {
    const { container } = render(<YearSeparatorNode {...makeNodeProps('AÑO 2', 1200)} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('1200px');
  });
});
