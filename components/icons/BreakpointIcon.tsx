
import React from 'react';

interface BreakpointIconProps {
    active?: boolean;
}

export const BreakpointIcon: React.FC<BreakpointIconProps> = ({ active = false }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 16 16" 
        fill="currentColor" 
        className="w-4 h-4 text-red-500"
    >
        <circle cx="8" cy="8" r="6" />
        {active && <circle cx="8" cy="8" r="3" className="text-yellow-400" />}
    </svg>
);
