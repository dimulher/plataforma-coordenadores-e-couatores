import React, { forwardRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const GlowButton = forwardRef(({ className, children, onClick, disabled, type = 'button', ...props }, ref) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = (e) => {
    if (disabled) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 600);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      data-state={clicked ? 'clicked' : undefined}
      className={cn('glow-btn', className)}
      onClick={handleClick}
      {...props}
    >
      <span className="glow-btn__content">
        {!disabled && <Sparkles className="glow-btn__icon" />}
        <span>{children}</span>
      </span>
    </button>
  );
});

GlowButton.displayName = 'GlowButton';

export { GlowButton };
