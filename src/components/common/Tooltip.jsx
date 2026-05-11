import React, { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Lightweight, dependency-free tooltip. Pure CSS + React state so it works
 * for keyboard focus and pointer hover. Wrap any inline trigger.
 *
 * Usage:
 *   <Tooltip content="Helpful explanation">
 *     <button>Hover me</button>
 *   </Tooltip>
 */
const Tooltip = ({ content, children, side = "top", className = "" }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const id = useId();

  if (!content) return children;

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const gap = 8;
    const nextPosition =
      {
        top: {
          top: rect.top - gap,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, -100%)",
        },
        bottom: {
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, 0)",
        },
        left: {
          top: rect.top + rect.height / 2,
          left: rect.left - gap,
          transform: "translate(-100%, -50%)",
        },
        right: {
          top: rect.top + rect.height / 2,
          left: rect.right + gap,
          transform: "translate(0, -50%)",
        },
      }[side] ?? {
        top: rect.top - gap,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      };

    setPosition(nextPosition);
  };

  const openTooltip = () => {
    updatePosition();
    setOpen(true);
  };

  return (
    <span
      ref={triggerRef}
      className={`inline-flex ${className}`}
      onMouseEnter={openTooltip}
      onMouseLeave={() => setOpen(false)}
      onFocus={openTooltip}
      onBlur={() => setOpen(false)}
    >
      {React.cloneElement(React.Children.only(children), {
        "aria-describedby": open ? id : undefined,
      })}
      {open && typeof document !== "undefined"
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              className="pointer-events-none fixed z-[9999] whitespace-pre-line rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
              style={{ ...position, maxWidth: "16rem" }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
};

export default Tooltip;
