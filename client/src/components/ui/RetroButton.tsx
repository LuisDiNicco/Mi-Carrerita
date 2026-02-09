// client/src/components/ui/RetroButton.tsx
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  pixelated?: boolean;
}

const variantStyles = {
  primary: 'bg-[#729FCF] border-[#3465A4] text-white hover:bg-[#5B8DC7]',
  success: 'bg-[#73D216] border-[#4E9A06] text-white hover:bg-[#5FB300]',
  danger: 'bg-[#EF2929] border-[#CC0000] text-white hover:bg-[#D41919]',
  warning: 'bg-[#FCE94F] border-[#C4A000] text-[#2E3436] hover:bg-[#EDD400]',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const RetroButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  pixelated = true,
  className,
  disabled,
  ...props 
}: RetroButtonProps) => {
  return (
    <button
      className={cn(
        // Base styles
        'font-retro font-bold uppercase tracking-wider',
        'border-4 transition-all duration-100',
        'shadow-retro hover:shadow-retro-hover',
        'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        
        // Image rendering pixelado
        pixelated && 'image-rendering-pixelated',
        
        // Variants y sizes
        variantStyles[variant],
        sizeStyles[size],
        
        // Custom className
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
