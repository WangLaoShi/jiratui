"use client";

type WorkItemTableProps = {
  rows: Array<{
    id: string;
    key: string;
    type?: string | null;
    status?: string | null;
    summary: string;
    trailing?: string | null;
  }>;
  trailingLabel?: string;
  onRowClick?: (key: string) => void;
};

const rowGridClass =
  "grid grid-cols-[minmax(4.5rem,auto)_minmax(3.5rem,5rem)_minmax(4rem,5.5rem)_minmax(0,1fr)_minmax(3.5rem,5rem)] items-center gap-x-2";

export function WorkItemTable({
  rows,
  trailingLabel = "Assignee",
  onRowClick,
}: WorkItemTableProps) {
  return (
    <div className="w-full text-[11px] leading-tight">
      <div
        className={`${rowGridClass} sticky top-0 z-10 border-b border-zinc-200 bg-white px-0.5 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950`}
      >
        <div>Key</div>
        <div>Type</div>
        <div>Status</div>
        <div>Summary</div>
        <div className="truncate text-right">{trailingLabel}</div>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {rows.map((row) => {
          const content = (
            <>
              <div className="truncate font-mono font-semibold">{row.key}</div>
              <div className="truncate text-zinc-500">{row.type ?? "—"}</div>
              <div className="truncate text-blue-600 dark:text-blue-400">{row.status ?? "—"}</div>
              <div className="truncate">{row.summary}</div>
              <div className="truncate text-right text-zinc-500">{row.trailing ?? "—"}</div>
            </>
          );

          if (!onRowClick) {
            return (
              <div key={row.id} className={`${rowGridClass} px-0.5 py-1`}>
                {content}
              </div>
            );
          }

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onRowClick(row.key)}
              className={`${rowGridClass} w-full px-0.5 py-1 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
