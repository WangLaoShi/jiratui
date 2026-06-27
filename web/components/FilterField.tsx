import type { ReactNode } from "react";

export const FILTER_LABEL_CLASS =
  "block h-3 shrink-0 text-[10px] leading-3 font-medium uppercase tracking-wide text-zinc-500";

export const FILTER_INPUT_CLASS =
  "filter-control box-border h-[26px] min-h-[26px] w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 text-[11px] leading-[26px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-white disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-950 dark:disabled:text-zinc-500";

type FilterFieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

export function FilterField({ label, className, children }: FilterFieldProps) {
  return (
    <div className={`filter-field min-w-0 ${className ?? ""}`}>
      <span className={FILTER_LABEL_CLASS}>{label}</span>
      <div className="filter-control-slot min-h-[26px]">{children}</div>
    </div>
  );
}
