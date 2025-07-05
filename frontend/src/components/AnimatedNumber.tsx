import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  format = (val) => val.toString(), 
  duration = 800,
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (prevValueRef.current !== value) {
      const startValue = prevValueRef.current;
      const endValue = value;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        const currentValue = startValue + (endValue - startValue) * easeOutQuart;
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
        }
      };
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
      
      prevValueRef.current = value;
    }
  }, [value, duration]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <span className={`transition-all duration-200 ${className}`}>
      {format(displayValue)}
    </span>
  );
};

export default AnimatedNumber; 