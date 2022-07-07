import React from 'react';

export const Camera = ({ className, primary, secondary }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path className={secondary} d="M13.59 12l6.7-6.7A1 1 0 0 1 22 6v12a1 1 0 0 1-1.7.7L13.58 12z"/>
    <rect width="14" height="14" x="2" y="5" className={primary} rx="2"/>
  </svg>
)