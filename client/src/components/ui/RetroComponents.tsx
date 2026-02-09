// client/src/components/ui/RetroCard.tsx
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

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
    default: 'bg-retro-dark border-unlam-500',
    screen: 'bg-[#0F380F] border-[#306230] shadow-[0_0_20px_rgba(155,188,15,0.3)]',
    console: 'bg-gray-800 border-gray-600',
  };

  return (
    <div
      className={cn(
        'border-4 p-4 rounded-lg',
        'shadow-retro',
        glow && 'animate-pulse',
        variants[variant],
        className
      )}
    >
      {/* Scanlines effect overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="w-full h-full bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)]" />
      </div>
      
      {children}
    </div>
  );
};

// Componente de Loading Retro
export const RetroLoading = ({ message = 'CARGANDO...' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Pixel Art Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-unlam-500 border-t-transparent animate-spin" 
             style={{ imageRendering: 'pixelated' }} />
        <div className="absolute inset-2 border-4 border-unlam-300 border-b-transparent animate-spin" 
             style={{ animationDirection: 'reverse', imageRendering: 'pixelated' }} />
      </div>

      {/* Texto parpadeante */}
      <p className="font-retro text-2xl text-unlam-500 animate-pulse tracking-widest">
        {message}
      </p>

      {/* Barra de progreso pixelada */}
      <div className="w-64 h-4 border-4 border-unlam-500 bg-retro-dark overflow-hidden">
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

// Componente de Error Retro
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
      {/* Ícono de error pixelado */}
      <div className="text-6xl text-red-500 font-retro animate-bounce">
        ⚠️
      </div>

      <div className="text-center space-y-2">
        <h2 className="font-retro text-3xl text-red-500 tracking-wider animate-pulse">
          {title}
        </h2>
        <p className="font-retro text-lg text-retro-light max-w-md">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="font-retro text-xl px-6 py-3 
                     bg-red-500 border-4 border-red-700 text-white
                     shadow-retro hover:shadow-retro-hover
                     active:translate-x-1 active:translate-y-1
                     transition-all duration-100"
        >
          REINTENTAR
        </button>
      )}

      <p className="font-retro text-sm text-gray-400 tracking-widest animate-blink">
        PRESS START
      </p>
    </div>
  );
};

// Componente de Badge/Etiqueta Retro
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
        'shadow-[2px_2px_0px_rgba(0,0,0,0.8)]',
        variants[variant],
        className
      )}
      style={{ imageRendering: 'pixelated' }}
    >
      {children}
    </span>
  );
};

