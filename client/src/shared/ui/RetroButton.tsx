import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/utils';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  pixelated?: boolean;
}

import { RETRO_UI_VARIANTS } from '../../styles/design-constants';

const variantStyles = {
  primary: `${RETRO_UI_VARIANTS.primary.base} ${RETRO_UI_VARIANTS.primary.hover}`,
  success: `${RETRO_UI_VARIANTS.success.base} ${RETRO_UI_VARIANTS.success.hover}`,
  danger: `${RETRO_UI_VARIANTS.danger.base} ${RETRO_UI_VARIANTS.danger.hover}`,
  warning: `${RETRO_UI_VARIANTS.warning.base} ${RETRO_UI_VARIANTS.warning.hover}`,
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
        'font-retro font-bold uppercase tracking-wider',
        'border-2 transition-all duration-100',
        'shadow-subtle',
        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        pixelated && 'image-rendering-pixelated',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

