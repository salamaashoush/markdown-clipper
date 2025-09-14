/**
 * Button component with Tailwind styling
 */

import { Component, JSX, splitProps } from 'solid-js';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, [
    'variant',
    'size',
    'loading',
    'fullWidth',
    'children',
    'class',
    'disabled',
  ]);

  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
    secondary: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 focus:ring-gray-500 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  const classes = [
    baseClasses,
    variantClasses[local.variant || 'primary'],
    sizeClasses[local.size || 'md'],
    local.fullWidth ? 'w-full' : '',
    local.class || '',
  ].join(' ');

  return (
    <button
      class={classes}
      disabled={local.disabled || local.loading}
      {...others}
    >
      {/* Ripple effect container */}
      <span class="absolute inset-0 overflow-hidden rounded-lg">
        <span class="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300" />
      </span>

      {/* Loading spinner */}
      {local.loading && (
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4 relative z-10"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Button content */}
      <span class="relative z-10 flex items-center justify-center w-full">
        {local.children}
      </span>
    </button>
  );
};