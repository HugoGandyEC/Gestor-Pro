import React, { useId } from 'react';

interface FireBrandIconProps {
  className?: string;
}

export const FireBrandIcon: React.FC<FireBrandIconProps> = ({ className = 'w-6 h-6' }) => {
  const uid = useId().replace(/:/g, '');
  const outerId = `fireOuter-${uid}`;
  const midId = `fireMid-${uid}`;
  const coreId = `fireCore-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={outerId} x1="32" y1="6" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="35%" stopColor="#FB923C" />
          <stop offset="72%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id={midId} x1="32" y1="18" x2="32" y2="57" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={coreId} x1="32" y1="32" x2="32" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
      </defs>
      <path
        d="M34.2 5.5C35.2 14.8 46.8 20.4 49.4 31.6C51.6 41.3 45.8 53.8 34.4 57.4C22.2 61.2 11.4 52.8 11.2 40.3C11.1 32.5 15.6 25.4 20.6 20.5C20.2 25.4 21.8 28.6 24.4 30.2C23.1 20.8 27.6 11.5 34.2 5.5Z"
        fill={`url(#${outerId})`}
      />
      <path
        d="M33.2 18.8C34.3 25.2 42.1 29.8 43.2 37.8C44.2 45.3 39.2 53.2 31.8 54.8C24.2 56.5 17.8 50.8 18.2 42.8C18.5 37.3 21.8 32.6 25.2 29.5C25.3 32.6 26.8 34.5 28.5 35.4C28.1 29.1 29.9 23.2 33.2 18.8Z"
        fill={`url(#${midId})`}
      />
      <path
        d="M31.9 33.2C33.4 37.4 37.6 40.4 37.5 45.2C37.4 49.9 33.8 53.2 29.6 53.1C25.5 53 22.8 49.6 23.4 45.3C24 41.2 28.5 37.5 31.9 33.2Z"
        fill={`url(#${coreId})`}
      />
      <circle cx="46.5" cy="14.5" r="3.2" fill="#FACC15" />
      <circle cx="17.5" cy="15.5" r="2.2" fill="#FB923C" />
    </svg>
  );
};
