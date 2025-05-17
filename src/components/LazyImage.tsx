import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  width?: number;
  height?: number;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholderColor = '#f3f4f6',
  width,
  height
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading when within 200px of viewport
        threshold: 0.01 // Trigger when 1% visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle image load complete
  const handleLoad = () => {
    setIsLoaded(true);
    
    // Report performance metrics
    if (window.performance && window.performance.mark) {
      window.performance.mark(`image-loaded-${src.split('/').pop()}`);
    }
  };

  const styleProps = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto'
  };

  // LQIP (Low Quality Image Placeholder) - show colored background until image loads
  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={styleProps}
    >
      <div 
        className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundColor: placeholderColor }}
      />
      
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={handleLoad}
        />
      )}
    </div>
  );
};

export default LazyImage;
