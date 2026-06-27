"use client";

import { useEffect, useState } from "react";
import { FILTER_INPUT_CLASS } from "@/components/FilterField";
import { api, type JiraUser } from "@/lib/api";

type AssigneeInputProps = {
  projectKey: string | null;
  value: string | null;
  displayName: string | null;
  onChange: (accountId: string | null, displayName: string | null) => void;
};

export function AssigneeInput({
  projectKey,
  value,
  displayName,
  onChange,
}: AssigneeInputProps) {
  const [query, setQuery] = useState(displayName ?? "");
  const [suggestions, setSuggestions] = useState<JiraUser[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(displayName ?? "");
  }, [displayName]);

  useEffect(() => {
    if (!open || !projectKey || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const users = await api.searchAssignableUsers(projectKey, query.trim());
        setSuggestions(users);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, projectKey, query]);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          className={`${FILTER_INPUT_CLASS} ${value ? "pe-10" : ""}`}
          placeholder={projectKey ? "Search assignee..." : "Select a project first"}
          disabled={!projectKey}
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            if (!next.trim()) {
              onChange(null, null);
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange(null, null);
              setQuery("");
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {open && projectKey && (loading || suggestions.length > 0) ? (
        <div className="absolute z-20 mt-0.5 max-h-40 w-full overflow-auto rounded-md border border-zinc-200 bg-white text-[11px] shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
          {loading ? (
            <p className="px-2 py-1.5 text-zinc-500">Searching...</p>
          ) : (
            suggestions.map((user) => (
              <button
                key={user.account_id}
                type="button"
                className="block w-full px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(user.account_id, user.display_name);
                  setQuery(user.display_name);
                  setOpen(false);
                }}
              >
                {user.display_name}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
