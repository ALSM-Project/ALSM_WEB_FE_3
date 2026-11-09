import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  /**
   * Layout sizing variant:
   * Standardized to 100% full-width across Web 3 with uniform padding and spacing.
   */
  variant?: 'full' | 'narrow' | 'catalog';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  variant = 'full',
  className = '',
}) => {
  const variantClass = {
    full: 'w-full space-y-6 min-w-0',
    narrow: 'w-full space-y-6 min-w-0',
    catalog: 'w-full space-y-6 min-w-0',
  }[variant];

  return (
    <div className={`${variantClass} ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
