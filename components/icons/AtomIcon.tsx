
import React from 'react';

/**
 * @component AtomIcon
 * @description Renders an SVG icon representing an atom, representing NanoCore AI.
 */
// FIX: Using explicit interface for props instead of React.FC to avoid IntrinsicAttributes errors when passing className.
interface AtomIconProps {
  className?: string;
}

export const AtomIcon = ({ className }: AtomIconProps) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className={className || "w-4 h-4"}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5A7.5 7.5 0 0 1 18.75 12a7.5 7.5 0 0 1-7.5 7.5A7.5 7.5 0 0 1 3.75 12a7.5 7.5 0 0 1 7.5-7.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c-3 0-5.25 2.25-5.25 5.25s2.25 5.25 5.25 5.25 5.25-2.25 5.25-5.25S15 12 12 12Z" transform="rotate(45 12 12)" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c-3 0-5.25 2.25-5.25 5.25s2.25 5.25 5.25 5.25 5.25-2.25 5.25-5.25S15 12 12 12Z" transform="rotate(-45 12 12)" />
    </svg>
);
