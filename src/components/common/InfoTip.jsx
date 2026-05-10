import Tooltip from "./Tooltip";

/**
 * Small "(i)" info icon that reveals a tooltip on hover/focus.
 *
 * Usage:
 *   <span>Platform Fee <InfoTip content="A 10% platform fee applies to all transactions." /></span>
 */
const InfoTip = ({
  content,
  label = "More information",
  side = "top",
  className = "",
}) => (
  <Tooltip content={content} side={side} className={className}>
    <button
      type="button"
      aria-label={label}
      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      i
    </button>
  </Tooltip>
);

export default InfoTip;
