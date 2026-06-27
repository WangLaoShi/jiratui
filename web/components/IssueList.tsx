"use client";

import type { JiraIssue, JiraIssuePickerSuggestion } from "@/lib/api";

type IssueListProps = {
  issues: JiraIssue[];
  suggestions?: JiraIssuePickerSuggestion[];
  selectedKey?: string | null;
  onSelect: (issueKey: string) => void;
};

const rowGridClass =
  "grid grid-cols-[minmax(4rem,auto)_minmax(0,1fr)] items-start gap-x-2";

export function IssueList({
  issues,
  suggestions,
  selectedKey,
  onSelect,
}: IssueListProps) {
  if (suggestions && suggestions.length > 0) {
    return (
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {suggestions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`${rowGridClass} w-full px-2 py-1 text-left text-[11px] leading-tight transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
              selectedKey === item.key ? "bg-zinc-100 dark:bg-zinc-900" : ""
            }`}
          >
            <span className="font-mono font-semibold">{item.key}</span>
            <span className="truncate text-zinc-600 dark:text-zinc-300">{item.summary}</span>
          </button>
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-xs text-zinc-500">
        Run a search to see work items here.
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {issues.map((issue) => (
        <button
          key={issue.key}
          type="button"
          onClick={() => onSelect(issue.key)}
          className={`w-full px-2 py-1 text-left text-[11px] leading-tight transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
            selectedKey === issue.key ? "bg-zinc-100 dark:bg-zinc-900" : ""
          }`}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 font-mono font-semibold">{issue.key}</span>
            {issue.issue_type ? (
              <span className="shrink-0 truncate text-zinc-500">{issue.issue_type.name}</span>
            ) : null}
            <span className="shrink-0 text-blue-600 dark:text-blue-400">{issue.status.name}</span>
          </div>
          <p className="truncate text-zinc-700 dark:text-zinc-200">{issue.summary}</p>
        </button>
      ))}
    </div>
  );
}
