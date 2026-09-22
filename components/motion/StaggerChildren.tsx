'use client';

import { type ReactNode } from 'react';
import FadeIn from './FadeIn';

interface StaggerChildrenProps {
  children: ReactNode[];
  baseDelay?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export default function StaggerChildren({
  children,
  baseDelay = 0,
  staggerDelay = 80,
  direction = 'up',
  className = '',
}: StaggerChildrenProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn
          key={index}
          delay={baseDelay + index * staggerDelay}
          direction={direction}
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
}
