import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

interface ProductPhotoThumbProps {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  iconClassName?: string;
  emptyLabel?: string;
}

export const ProductPhotoThumb: React.FC<ProductPhotoThumbProps> = ({
  src,
  alt,
  className = 'w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden',
  imgClassName = 'w-full h-full object-cover',
  iconClassName = 'w-4 h-4 text-slate-400',
  emptyLabel
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanSrc = typeof src === 'string' ? src.trim() : '';

  return (
    <div className={className}>
      {cleanSrc && !hasError ? (
        <img
          src={cleanSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={imgClassName}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 p-1 text-slate-400 select-none">
          <Package className={iconClassName} />
          {emptyLabel && (
            <span className="text-[10px] font-medium text-slate-400 leading-none">{emptyLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};
