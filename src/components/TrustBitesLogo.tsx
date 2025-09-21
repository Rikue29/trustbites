import React from 'react';

interface TrustBitesLogoProps {
  size?: number;
  className?: string;
}

export const TrustBitesLogo: React.FC<TrustBitesLogoProps> = ({ 
  size = 32, 
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Main green circle */}
      <div 
        className="bg-gradient-to-br from-green-500 to-green-600 rounded-full relative"
        style={{ width: size, height: size }}
      >
        {/* Bite mark cutouts */}
        <div 
          className="absolute bg-white rounded-full"
          style={{ 
            width: size * 0.375, 
            height: size * 0.375,
            top: -size * 0.03125,
            right: -size * 0.03125
          }}
        ></div>
        <div 
          className="absolute bg-white rounded-full"
          style={{ 
            width: size * 0.25, 
            height: size * 0.25,
            top: 0,
            right: 0
          }}
        ></div>
        
        {/* Checkmark */}
        <svg 
          className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ width: size * 0.5, height: size * 0.5 }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="3" 
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
  );
};

export default TrustBitesLogo;