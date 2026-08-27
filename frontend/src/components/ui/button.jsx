import React from 'react';

export const Button = React.forwardRef(({ className = '', variant = 'default', children, ...props }, ref) => {
  return (
      <button
          ref={ref}
          className={`custom-btn ${variant} ${className}`}
          {...props}
      >
        {children}
      </button>
  );
});

Button.displayName = 'Button';