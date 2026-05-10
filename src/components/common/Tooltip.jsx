import React, { useId, useState } from 'react';

/**
 * Lightweight, dependency-free tooltip. Pure CSS + React state so it works
 * for keyboard focus and pointer hover. Wrap any inline trigger.
 *
 * Usage:
 *   <Tooltip content="Helpful explanation">
 *     <button>Hover me</button>
 *   </Tooltip>
 */
const Tooltip = ({ content, children, side = 'top', className = '' }) => {
  const [open, setOpen] = useState(false);
  const id = useId();

  if (!content) return children;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side] ?? 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {React.cloneElement(React.Children.only(children), { 'aria-describedby': open ? id : undefined })}
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-pre-line rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg ${positionClasses}`}
          style={{ maxWidth: '16rem' }}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
};

export default Tooltip;
