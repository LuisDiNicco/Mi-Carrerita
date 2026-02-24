import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RetroCard, RetroLoading, RetroError, RetroBadge } from './RetroComponents';

describe('RetroCard', () => {
  it('renders children', () => {
    render(<RetroCard>Hello World</RetroCard>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<RetroCard className="my-custom">Content</RetroCard>);
    expect(container.firstChild).toHaveClass('my-custom');
  });

  it('applies glow animation class when glow=true', () => {
    const { container } = render(<RetroCard glow>Content</RetroCard>);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('does not apply glow class by default', () => {
    const { container } = render(<RetroCard>Content</RetroCard>);
    expect(container.firstChild).not.toHaveClass('animate-pulse');
  });

  it('applies screen variant', () => {
    const { container } = render(<RetroCard variant="screen">Content</RetroCard>);
    expect(container.firstChild).toHaveClass('shadow-subtle');
  });

  it('applies console variant', () => {
    const { container } = render(<RetroCard variant="console">Content</RetroCard>);
    expect(container.firstChild).toHaveClass('bg-elevated');
  });
});

describe('RetroLoading', () => {
  it('renders default loading message', () => {
    render(<RetroLoading />);
    expect(screen.getByText('CARGANDO...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<RetroLoading message="PROCESANDO..." />);
    expect(screen.getByText('PROCESANDO...')).toBeInTheDocument();
  });
});

describe('RetroError', () => {
  it('renders the error message', () => {
    render(<RetroError message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders the default title', () => {
    render(<RetroError message="Error" />);
    expect(screen.getByText('¡ERROR!')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(<RetroError title="FALLO" message="Error desc" />);
    expect(screen.getByText('FALLO')).toBeInTheDocument();
  });

  it('does not render retry button when onRetry not provided', () => {
    render(<RetroError message="Error" />);
    expect(screen.queryByText('REINTENTAR')).not.toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();
    render(<RetroError message="Error" onRetry={mockRetry} />);
    expect(screen.getByText('REINTENTAR')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const mockRetry = vi.fn();
    render(<RetroError message="Error" onRetry={mockRetry} />);
    fireEvent.click(screen.getByText('REINTENTAR'));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});

describe('RetroBadge', () => {
  it('renders children text', () => {
    render(<RetroBadge>BADGE</RetroBadge>);
    expect(screen.getByText('BADGE')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    const { container } = render(<RetroBadge>Text</RetroBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-gray-600');
  });

  it('applies success variant', () => {
    const { container } = render(<RetroBadge variant="success">OK</RetroBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/4E9A06/);
  });

  it('applies warning variant', () => {
    const { container } = render(<RetroBadge variant="warning">WARN</RetroBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/FCE94F/);
  });

  it('applies danger variant', () => {
    const { container } = render(<RetroBadge variant="danger">ERR</RetroBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/EF2929/);
  });

  it('applies info variant', () => {
    const { container } = render(<RetroBadge variant="info">INFO</RetroBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/729FCF/);
  });

  it('applies custom className', () => {
    const { container } = render(<RetroBadge className="extra-class">Text</RetroBadge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('extra-class');
  });
});
