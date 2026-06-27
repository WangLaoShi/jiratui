"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Spinner } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { IssueDetailPanel } from "@/components/IssueDetailPanel";
import { IssueList } from "@/components/IssueList";
import { SearchFilters, type SearchFiltersValue } from "@/components/SearchFilters";
import {
  api,
  isSearchResult,
  type IssueSearchResult,
  type JiraIssuePickerSuggestion,
} from "@/lib/api";

const defaultFilters: SearchFiltersValue = {
  project_key: null,
  status: null,
  issue_type: null,
  assignee: null,
  assignee_display_name: null,
  issue_key: null,
  created_from: null,
  created_until: null,
  order_by: null,
  jql_query: null,
  search_in_active_sprint: false,
  search_term: null,
};

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFiltersValue>(defaultFilters);
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<IssueSearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<JiraIssuePickerSuggestion[]>([]);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.listProjects(),
  });

  const configQuery = useQuery({
    queryKey: ["config-summary"],
    queryFn: () => api.getConfigSummary(),
  });

  useEffect(() => {
    const defaultProject = configQuery.data?.default_project_key_or_id;
    if (typeof defaultProject === "string" && defaultProject && !filters.project_key) {
      setFilters((current) => ({
        ...current,
        project_key: defaultProject,
      }));
    }
  }, [configQuery.data, filters.project_key]);

  const statusesQuery = useQuery({
    queryKey: ["statuses", filters.project_key],
    queryFn: () => api.getProjectStatuses(filters.project_key as string),
    enabled: Boolean(filters.project_key),
  });

  const issueTypesQuery = useQuery({
    queryKey: ["issue-types", filters.project_key],
    queryFn: () => api.getProjectIssueTypes(filters.project_key as string),
    enabled: Boolean(filters.project_key),
  });

  const searchMutation = useMutation({
    mutationFn: () => {
      const { assignee_display_name: _displayName, ...payload } = filters;
      return api.searchIssues(payload);
    },
    onSuccess: (result) => {
      if (isSearchResult(result)) {
        setSearchResult(result);
        setSuggestions([]);
        const firstIssue = result.issues[0];
        setSelectedIssueKey(firstIssue?.key ?? null);
      } else {
        setSuggestions(result);
        setSearchResult(null);
        setSelectedIssueKey(result[0]?.key ?? null);
      }
    },
  });

  const issues = useMemo(() => searchResult?.issues ?? [], [searchResult]);

  const apiError =
    projectsQuery.error?.message ??
    configQuery.error?.message ??
    searchMutation.error?.message ??
    null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-black">
      <AppHeader />

      <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-1.5 px-2 py-1.5">
        {apiError ? (
          <div className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {apiError}. Make sure the FastAPI server is running on{" "}
            <code className="font-mono">127.0.0.1:8000</code> and your Jira config is valid.
          </div>
        ) : null}

        <SearchFilters
          projects={projectsQuery.data ?? []}
          statuses={statusesQuery.data ?? []}
          issueTypes={issueTypesQuery.data ?? []}
          value={filters}
          loading={searchMutation.isPending}
          projectsLoading={projectsQuery.isFetching && !projectsQuery.data}
          projectsError={projectsQuery.error?.message ?? null}
          onChange={setFilters}
          onSearch={() => searchMutation.mutate()}
        />

        <div className="grid min-h-0 flex-1 gap-1.5 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
              <div>
                <h2 className="text-xs font-semibold">Work items</h2>
                <p className="text-[11px] text-zinc-500">
                  {issues.length > 0
                    ? `${issues.length} results`
                    : suggestions.length > 0
                      ? `${suggestions.length} suggestions`
                      : "No results yet"}
                </p>
              </div>
              {searchMutation.isPending ? <Spinner size="sm" /> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <IssueList
                issues={issues}
                suggestions={suggestions}
                selectedKey={selectedIssueKey}
                onSelect={setSelectedIssueKey}
              />
            </div>
          </section>

          <IssueDetailPanel
            issueKey={selectedIssueKey}
            onSelectIssue={setSelectedIssueKey}
          />
        </div>
      </main>
    </div>
  );
}
