
import React from 'react';
import { WandIcon } from './WandIcon';

interface SentinelIconProps {
    severity: 'performance' | 'logic' | 'memory' | 'intent' | string;
    onClick?: () => void;
}

export const SentinelIcon: React.FC<SentinelIconProps> = ({ severity, onClick }) => {
    
    const iconMap = {
        performance: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-yellow-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
        ),
        logic: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-sky-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-1.125 6.01 6.01 0 0 0 1.125-1.5 6.01 6.01 0 0 0-1.125-1.5A6.01 6.01 0 0 0 12 6.75m0 0a6.01 6.01 0 0 1-1.5-1.125A6.01 6.01 0 0 1 9.375 9a6.01 6.01 0 0 1-1.125 1.5A6.01 6.01 0 0 1 6.75 12m0 0a6.01 6.01 0 0 0 1.5 1.125A6.01 6.01 0 0 0 9.375 15m0 0v2.25m0 0a2.25 2.25 0 0 1-2.25 2.25m0 0a2.25 2.25 0 0 0 2.25 2.25m2.25 2.25a2.25 2.25 0 0 1 2.25-2.25m0 0a2.25 2.25 0 0 0-2.25-2.25m0 0V15m0 0a6.01 6.01 0 0 0-1.5-1.125A6.01 6.01 0 0 0 9.375 12.75m0 0A6.01 6.01 0 0 1 12 6.75m0 0a6.01 6.01 0 0 1 1.5 1.125A6.01 6.01 0 0 1 15.625 9m0 0a6.01 6.01 0 0 1-1.5 1.125A6.01 6.01 0 0 1 12.375 12.75m0 0A6.01 6.01 0 0 0 12 15m0 0v-2.25" />
            </svg>
        ),
        memory: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
        ),
        intent: <WandIcon />
    };

    const icon = iconMap[severity as keyof typeof iconMap] || null;

    if (onClick) {
        return (
            <button onClick={onClick} className="cursor-pointer hover:scale-125 transition-transform">
                {icon}
            </button>
        );
    }
    
    return icon;
};
