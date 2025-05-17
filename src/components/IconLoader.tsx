import React, { lazy, Suspense } from 'react';

interface IconProps {
  icon: string;
  className?: string;
  onClick?: () => void;
}

// Create a loading placeholder for icons
const IconFallback: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-block ${className} bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full`}
    style={{ width: '1em', height: '1em' }}></span>
);

// Lazy load the Icon component
const IconComponent: React.FC<IconProps> = ({ icon, className = '', onClick }) => {
  const fullClassName = `${icon} ${className}`;
  
  return (
    <i className={fullClassName} onClick={onClick}></i>
  );
};

// Export a wrapped version with Suspense
export const Icon: React.FC<IconProps> = (props) => {
  return (
    <Suspense fallback={<IconFallback className={props.className} />}>
      <IconComponent {...props} />
    </Suspense>
  );
};

export default Icon;
