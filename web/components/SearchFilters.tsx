"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@heroui/react";
import { AssigneeInput } from "@/components/AssigneeInput";
import { FilterField, FILTER_INPUT_CLASS } from "@/components/FilterField";
import { FilterSelect } from "@/components/FilterSelect";
import { api, type IssueSearchBody, type IssueStatus, type IssueType, type Project } from "@/lib/api";

export type SearchFiltersValue = IssueSearchBody & {
  assignee_display_name?: string | null;
};

type SearchFiltersProps = {
  projects: Project[];
  statuses: IssueStatus[];
  issueTypes: IssueType[];
  value: SearchFiltersValue;
  loading?: boolean;
  projectsLoading?: boolean;
  projectsError?: string | null;
  onChange: (value: SearchFiltersValue) => void;
  onSearch: () => void;
};

export function SearchFilters({
  projects,
  statuses,
  issueTypes,
  value,
  loading,
  projectsLoading,
  projectsError,
  onChange,
  onSearch,
}: SearchFiltersProps) {
  const orderByQuery = useQuery({
    queryKey: ["order-by-options"],
    queryFn: () => api.getOrderByOptions(),
  });

  const orderByOptions =
    orderByQuery.data?.options.map(([label, id]) => ({ id, label })) ?? [];

  return (
    <section className="shrink-0 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-6">
        <FilterField label="Project">
          <FilterSelect
            label="Project"
            placeholder="All projects"
            options={projects.map((project) => ({
              id: project.key,
              label: `${project.key} · ${project.name}`,
            }))}
            selectedKey={value.project_key ?? null}
            isLoading={projectsLoading}
            errorMessage={projectsError}
            onChange={(projectKey) =>
              onChange({
                ...value,
                project_key: projectKey,
                status: null,
                issue_type: null,
                assignee: null,
                assignee_display_name: null,
              })
            }
          />
        </FilterField>

        <FilterField label="Issue type">
          <FilterSelect
            label="Issue type"
            placeholder="Any type"
            options={issueTypes.map((issueType) => ({
              id: issueType.id,
              label: issueType.name,
            }))}
            selectedKey={value.issue_type != null ? String(value.issue_type) : null}
            isDisabled={!value.project_key}
            onChange={(issueTypeId) =>
              onChange({
                ...value,
                issue_type: issueTypeId ? Number(issueTypeId) : null,
              })
            }
          />
        </FilterField>

        <FilterField label="Status">
          <FilterSelect
            label="Status"
            placeholder="Any status"
            options={statuses.map((status) => ({
              id: status.id,
              label: status.name,
            }))}
            selectedKey={value.status != null ? String(value.status) : null}
            isDisabled={!value.project_key}
            onChange={(statusId) =>
              onChange({
                ...value,
                status: statusId ? Number(statusId) : null,
              })
            }
          />
        </FilterField>

        <FilterField label="Assignee">
          <AssigneeInput
            projectKey={value.project_key ?? null}
            value={value.assignee ?? null}
            displayName={value.assignee_display_name ?? null}
            onChange={(accountId, displayName) =>
              onChange({
                ...value,
                assignee: accountId,
                assignee_display_name: displayName,
              })
            }
          />
        </FilterField>

        <FilterField label="Work item key">
          <input
            className={FILTER_INPUT_CLASS}
            placeholder="ALL-1234"
            value={value.issue_key ?? ""}
            onChange={(event) =>
              onChange({ ...value, issue_key: event.target.value || null })
            }
          />
        </FilterField>

        <FilterField label="Sort">
          <FilterSelect
            label="Sort"
            placeholder="Default order"
            options={orderByOptions}
            selectedKey={value.order_by ?? null}
            onChange={(orderBy) =>
              onChange({
                ...value,
                order_by: orderBy,
              })
            }
          />
        </FilterField>

        <FilterField label="Created from">
          <input
            type="date"
            className={FILTER_INPUT_CLASS}
            value={value.created_from ?? ""}
            onChange={(event) =>
              onChange({ ...value, created_from: event.target.value || null })
            }
          />
        </FilterField>

        <FilterField label="Created until">
          <input
            type="date"
            className={FILTER_INPUT_CLASS}
            value={value.created_until ?? ""}
            onChange={(event) =>
              onChange({ ...value, created_until: event.target.value || null })
            }
          />
        </FilterField>

        <FilterField label="JQL query" className="col-span-2 sm:col-span-3 lg:col-span-6">
          <input
            className={FILTER_INPUT_CLASS}
            placeholder="status != Done"
            value={value.jql_query ?? ""}
            onChange={(event) =>
              onChange({ ...value, jql_query: event.target.value || null })
            }
          />
        </FilterField>
      </div>

      <div className="mt-1.5 flex flex-wrap items-end gap-2">
        <FilterField label="Full-text search" className="min-w-[200px] flex-1">
          <input
            className={FILTER_INPUT_CLASS}
            placeholder="Search summary, description, comments..."
            value={value.search_term ?? ""}
            onChange={(event) =>
              onChange({ ...value, search_term: event.target.value || null })
            }
          />
        </FilterField>

        <label className="filter-control mb-0 flex h-[26px] shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 px-2 text-[11px] leading-none text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="size-3 shrink-0"
            checked={Boolean(value.search_in_active_sprint)}
            onChange={(event) =>
              onChange({
                ...value,
                search_in_active_sprint: event.target.checked,
              })
            }
          />
          Active sprint
        </label>

        <Button
          size="sm"
          className="filter-search-btn shrink-0"
          onPress={onSearch}
          isDisabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
    </section>
  );
}
