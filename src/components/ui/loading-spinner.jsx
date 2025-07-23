import React from 'react';
import { cn } from '@/lib/utils';

const LoadingSpinner = ({ 
  size = 'default', 
  variant = 'default',
  className,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const variantClasses = {
    default: 'text-red-500',
    white: 'text-white',
    muted: 'text-gray-400',
    primary: 'text-red-600'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-transparent border-t-current',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Overlay spinner for full-screen loading
const LoadingOverlay = ({ 
  isVisible = true, 
  message = 'Loading...', 
  className 
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex flex-col items-center justify-center',
      'bg-black/50 backdrop-blur-sm',
      className
    )}>
      <div className="rounded-lg bg-black/80 p-6 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="xl" variant="white" />
          <p className="text-sm text-white">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Button with loading state
const LoadingButton = ({ 
  isLoading = false, 
  children, 
  disabled,
  className,
  ...props 
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'relative inline-flex items-center justify-center',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner 
          size="sm" 
          variant="white" 
          className="absolute" 
        />
      )}
      <span className={cn(isLoading && 'invisible')}>
        {children}
      </span>
    </button>
  );
};

// Skeleton loader for content placeholders
const Skeleton = ({ 
  className,
  variant = 'default',
  ...props 
}) => {
  const variantClasses = {
    default: 'bg-gray-800',
    light: 'bg-gray-700',
    card: 'bg-gray-800/50'
  };

  return (
    <div
      className={cn(
        'animate-pulse rounded',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

// Card skeleton for loading states
const CardSkeleton = ({ className }) => {
  return (
    <div className={cn('space-y-3 p-4', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
};

// Table skeleton for loading states
const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Loading dots animation
const LoadingDots = ({ 
  size = 'default', 
  variant = 'default',
  className 
}) => {
  const sizeClasses = {
    sm: 'h-1 w-1',
    default: 'h-2 w-2',
    lg: 'h-3 w-3'
  };

  const variantClasses = {
    default: 'bg-red-500',
    white: 'bg-white',
    muted: 'bg-gray-400'
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            variantClasses[variant]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

// Pulse animation for loading states
const Pulse = ({ 
  className, 
  children,
  ...props 
}) => {
  return (
    <div
      className={cn('animate-pulse', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export {
  LoadingSpinner,
  LoadingOverlay,
  LoadingButton,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  LoadingDots,
  Pulse
};

export default LoadingSpinner;