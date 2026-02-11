import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface RetroCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'screen' | 'console';
  glow?: boolean;
}

export const RetroCard = ({
  children,
  className,
  variant = 'default',
  glow = false
}: RetroCardProps) => {
  const variants = {
    default: 'bg-surface border-app',
    screen: 'bg-surface border-app shadow-subtle',
    console: 'bg-elevated border-app',
  };

  return (
    <div
      className={cn(
        'relative border-2 p-4 rounded-lg',
        'shadow-subtle',
        glow && 'animate-pulse',
        variants[variant],
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="w-full h-full bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)]" />
      </div>

      {children}
    </div>
  );
};

export const RetroLoading = ({ message = 'CARGANDO...' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-unlam-500 border-t-transparent animate-spin"
          style={{ imageRendering: 'pixelated' }} />
        <div className="absolute inset-2 border-4 border-unlam-300 border-b-transparent animate-spin"
          style={{ animationDirection: 'reverse', imageRendering: 'pixelated' }} />
      </div>

      <p className="font-retro text-2xl text-unlam-600 tracking-widest">
        {message}
      </p>

      <div className="w-64 h-4 border-2 border-app bg-surface overflow-hidden">
        <div className="h-full bg-unlam-500 animate-[progress_2s_ease-in-out_infinite]"
          style={{
            width: '100%',
            animation: 'progress 2s ease-in-out infinite',
            imageRendering: 'pixelated'
          }} />
      </div>

      <style>{`
        @keyframes progress {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
};

interface RetroErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const RetroError = ({
  title = '¡ERROR!',
  message,
  onRetry
}: RetroErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      <div className="text-6xl text-red-500 font-retro">
        ⚠️
      </div>

      <div className="text-center space-y-2">
        <h2 className="font-retro text-3xl text-red-500 tracking-wider">
          {title}
        </h2>
        <p className="font-retro text-lg text-muted max-w-md">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="font-retro text-xl px-6 py-3
                     bg-red-500 border-2 border-red-700 text-white
                     shadow-subtle
                     transition-all duration-100"
        >
          REINTENTAR
        </button>
      )}

      <p className="font-retro text-sm text-muted tracking-widest">PRESS START</p>
    </div>
  );
};

interface RetroBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const RetroBadge = ({
  children,
  variant = 'default',
  className
}: RetroBadgeProps) => {
  const variants = {
    default: 'bg-gray-600 border-gray-800 text-white',
    success: 'bg-[#73D216] border-[#4E9A06] text-white',
    warning: 'bg-[#FCE94F] border-[#C4A000] text-[#2E3436]',
    danger: 'bg-[#EF2929] border-[#CC0000] text-white',
    info: 'bg-[#729FCF] border-[#3465A4] text-white',
  };

  return (
    <span
      className={cn(
        'inline-block px-2 py-1 text-xs font-retro font-bold',
        'border-2 uppercase tracking-wider',
        'shadow-[1px_1px_0px_rgba(0,0,0,0.4)]',
        variants[variant],
        className
      )}
      style={{ imageRendering: 'pixelated' }}
    >
      {children}
    </span>
  );
};
