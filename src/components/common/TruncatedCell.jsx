import React from 'react';
import Tooltip from './Tooltip';

/**
 * Truncates long cell text to a single line and shows the full value in a
 * tooltip on hover. Use inside table cells where the content can overflow.
 *
 * Usage:
 *   <TruncatedCell value={user.email} maxWidth="14rem" />
 */
const TruncatedCell = ({ value, maxWidth = '12rem', className = '', emptyPlaceholder = '—' }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">{emptyPlaceholder}</span>;
  }
  const display = String(value);
  return (
    <Tooltip content={display}>
      <span
        className={`block truncate align-middle ${className}`}
        style={{ maxWidth }}
        title=""
      >
        {display}
      </span>
    </Tooltip>
  );
};

export default TruncatedCell;
