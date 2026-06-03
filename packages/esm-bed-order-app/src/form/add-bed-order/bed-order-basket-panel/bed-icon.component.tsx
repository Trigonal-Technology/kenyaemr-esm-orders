import React from 'react';

interface BedIconProps {
  isTablet: boolean;
}

export default function BedIcon({ isTablet }: BedIconProps) {
  const size = isTablet ? 40 : 24;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Square */}
      <rect width="24" height="24" rx="4" fill="#FFD9BE" />
      
      {/* Bed Frame and Pillows */}
      <path 
        d="M5 10V17M5 17H19M5 17V19M19 17V10M19 17V19M5 10C5 8.89543 5.89543 8 7 8H17C18.1046 8 19 8.89543 19 10V13H5V10Z" 
        stroke="#8A3800" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M7 11H10V13H7V11Z" 
        stroke="#8A3800" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M14 11H17V13H14V11Z" 
        stroke="#8A3800" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}