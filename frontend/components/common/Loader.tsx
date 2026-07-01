import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: number;
  text?: string;
  className?: string;
}

export function Loader({ size = 24, text = 'Loading...', className = '' }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 space-y-2 ${className}`}>
      <Loader2 className="animate-spin text-primary" size={size} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
