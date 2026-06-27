"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Chip, Spinner, TextArea } from "@heroui/react";
import { useEffect, useState } from "react";
import {
  api,
  extractCommentBody,
  extractDescription,
  formatBytes,
  formatDate,
  formatDateTime,
  formatFieldValue,
  isRichTextEmpty,
  type Attachment,
  type IssueComment,
  type IssueRemoteLink,
  type IssueTransition,
  type JiraIssue,
  type RelatedIssue,
} from "@/lib/api";
import { WorkItemTable } from "@/components/WorkItemTable";

const WORK_ITEM_TABS = [
  { id: "info", label: "Info" },
  { id: "details", label: "Details" },
  { id: "comments", label: "Comments" },
  { id: "related", label: "Related" },
  { id: "attachments", label: "Attachments" },
  { id: "links", label: "Links" },
  { id: "subtasks", label: "Subtasks" },
] as const;

type WorkItemTabId = (typeof WORK_ITEM_TABS)[number]["id"];

type IssueDetailPanelProps = {
  issueKey: string | null;
  onSelectIssue?: (issueKey: string) => void;
};

export function IssueDetailPanel({ issueKey, onSelectIssue }: IssueDetailPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<WorkItemTabId>("info");
  const [summaryDraft, setSummaryDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");

  useEffect(() => {
    setActiveTab("info");
  }, [issueKey]);

  const issueQuery = useQuery({
    queryKey: ["issue", issueKey],
    queryFn: async () => {
      if (!issueKey) return null;
      const result = await api.getIssue(issueKey);
      return result.issues[0] ?? null;
    },
    enabled: Boolean(issueKey),
  });

  const transitionsQuery = useQuery({
    queryKey: ["transitions", issueKey],
    queryFn: async () => {
      if (!issueKey) return [];
      return api.getTransitions(issueKey);
    },
    enabled: Boolean(issueKey),
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", issueKey],
    queryFn: async () => {
      if (!issueKey) return [];
      return api.getComments(issueKey);
    },
    enabled: Boolean(issueKey),
  });

  const remoteLinksQuery = useQuery({
    queryKey: ["remote-links", issueKey],
    queryFn: async () => {
      if (!issueKey) return [];
      return api.getRemoteLinks(issueKey);
    },
    enabled: Boolean(issueKey),
  });

  const subtasksQuery = useQuery({
    queryKey: ["subtasks", issueKey],
    queryFn: async () => {
      if (!issueKey) return [];
      const result = await api.getSubtasks(issueKey);
      return result.issues;
    },
    enabled: Boolean(issueKey),
  });

  const issue = issueQuery.data;

  useEffect(() => {
    if (!issue) return;
    setSummaryDraft(issue.summary);
    setDescriptionDraft(extractDescription(issue.description));
  }, [issue]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!issueKey) throw new Error("No issue selected");
      return api.updateIssue(issueKey, updates);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issue", issueKey] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async (statusId: string) => {
      if (!issueKey) throw new Error("No issue selected");
      return api.transitionIssue(issueKey, statusId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issue", issueKey] });
      await queryClient.invalidateQueries({ queryKey: ["transitions", issueKey] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!issueKey) throw new Error("No issue selected");
      return api.addComment(issueKey, message);
    },
    onSuccess: async () => {
      setCommentDraft("");
      await queryClient.invalidateQueries({ queryKey: ["comments", issueKey] });
      await queryClient.invalidateQueries({ queryKey: ["issue", issueKey] });
    },
  });

  if (!issueKey) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-300 p-4 text-xs text-zinc-500 dark:border-zinc-700">
        Select a work item from the list to view details.
      </div>
    );
  }

  if (issueQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (issueQuery.isError || !issue) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        Unable to load {issueKey}.
      </div>
    );
  }

  const comments = commentsQuery.data ?? issue.comments ?? [];
  const relatedIssues = issue.related_issues ?? [];
  const attachments = issue.attachments ?? [];
  const remoteLinks = remoteLinksQuery.data ?? [];
  const subtasks = subtasksQuery.data ?? [];

  const tabCounts: Partial<Record<WorkItemTabId, number>> = {
    comments: comments.length,
    related: relatedIssues.length,
    attachments: attachments.length,
    links: remoteLinks.length,
    subtasks: subtasks.length,
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200 px-2.5 py-1.5 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <h2 className="font-mono text-xs font-semibold">{issue.key}</h2>
          {issue.issue_type ? (
            <Chip size="sm" variant="soft">
              {issue.issue_type.name}
            </Chip>
          ) : null}
          <Chip size="sm" color="accent" variant="soft">
            {issue.status.name}
          </Chip>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <nav
          aria-label="Work item sections"
          className="shrink-0 overflow-x-auto border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          <div className="flex min-w-max px-1">
            {WORK_ITEM_TABS.map((tab) => {
              const selected = activeTab === tab.id;
              const count = tabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative shrink-0 border-b-2 px-2 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    {tab.label}
                    {count != null && count > 0 ? (
                      <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {count}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-auto p-2.5" role="tabpanel">
          {activeTab === "info" ? <InfoTab issue={issue} /> : null}
          {activeTab === "details" ? (
            <DetailsTab
              issue={issue}
              summaryDraft={summaryDraft}
              descriptionDraft={descriptionDraft}
              transitions={transitionsQuery.data ?? []}
              onSummaryChange={setSummaryDraft}
              onDescriptionChange={setDescriptionDraft}
              onSave={() =>
                updateMutation.mutate({
                  summary: summaryDraft,
                  description: descriptionDraft,
                })
              }
              onTransition={(statusId) => transitionMutation.mutate(statusId)}
              saving={updateMutation.isPending}
              transitioning={transitionMutation.isPending}
              onSelectIssue={onSelectIssue}
            />
          ) : null}
          {activeTab === "comments" ? (
            <CommentsTab
              comments={comments}
              loading={commentsQuery.isLoading}
              commentDraft={commentDraft}
              onCommentDraftChange={setCommentDraft}
              onSubmit={() => commentMutation.mutate(commentDraft)}
              submitting={commentMutation.isPending}
            />
          ) : null}
          {activeTab === "related" ? (
            <RelatedTab issues={relatedIssues} onSelectIssue={onSelectIssue} />
          ) : null}
          {activeTab === "attachments" ? (
            <AttachmentsTab attachments={attachments} />
          ) : null}
          {activeTab === "links" ? (
            <LinksTab links={remoteLinks} loading={remoteLinksQuery.isLoading} />
          ) : null}
          {activeTab === "subtasks" ? (
            <SubtasksTab
              subtasks={subtasks}
              loading={subtasksQuery.isLoading}
              onSelectIssue={onSelectIssue}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-0.5 border-b border-zinc-100 py-1.5 dark:border-zinc-900 md:grid-cols-[130px_1fr] md:gap-2">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className={`text-xs text-zinc-800 dark:text-zinc-200 ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-xs text-zinc-500">{message}</p>;
}

function InfoTab({ issue }: { issue: JiraIssue }) {
  const longSections: Array<{ title: string; content: string }> = [];
  const compactFields: Array<{ title: string; content: string }> = [];

  const addSection = (title: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length <= 120 && !trimmed.includes("\n")) {
      compactFields.push({ title, content: trimmed });
    } else {
      longSections.push({ title, content: trimmed });
    }
  };

  if (!isRichTextEmpty(issue.description)) {
    addSection("Description", extractDescription(issue.description));
  }

  if (issue.environment?.trim()) {
    addSection("Environment", issue.environment);
  }

  for (const [fieldId, value] of Object.entries(issue.custom_fields ?? {})) {
    if (typeof value === "string" && value.trim()) {
      addSection(fieldId, value);
      continue;
    }
    if (typeof value === "object" && value !== null && !isRichTextEmpty(value)) {
      const text = extractDescription(value);
      if (text.trim()) {
        addSection(fieldId, text);
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {issue.summary}
        </h3>
        <p className="shrink-0 text-[11px] text-zinc-500">
          {issue.assignee?.display_name ?? "Unassigned"}
          {issue.priority ? ` · ${issue.priority.name}` : ""}
        </p>
      </div>

      {compactFields.length > 0 ? (
        <dl className="grid grid-cols-[minmax(6rem,9rem)_minmax(0,1fr)] gap-x-3 gap-y-1 border-b border-zinc-100 pb-2 text-[11px] dark:border-zinc-900">
          {compactFields.map((field) => (
            <div key={field.title} className="contents">
              <dt className="truncate font-medium uppercase tracking-wide text-zinc-500">
                {field.title}
              </dt>
              <dd className="truncate text-zinc-800 dark:text-zinc-200">{field.content}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {longSections.length === 0 && compactFields.length === 0 ? (
        <EmptyState message='No description or text fields are set for this work item.' />
      ) : (
        <div className="space-y-2">
          {longSections.map((section) => (
            <section key={section.title}>
              <h4 className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {section.title}
              </h4>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-2 text-[11px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200">
                {section.content}
              </pre>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailsTab({
  issue,
  summaryDraft,
  descriptionDraft,
  transitions,
  onSummaryChange,
  onDescriptionChange,
  onSave,
  onTransition,
  saving,
  transitioning,
  onSelectIssue,
}: {
  issue: JiraIssue;
  summaryDraft: string;
  descriptionDraft: string;
  transitions: IssueTransition[];
  onSummaryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onTransition: (statusId: string) => void;
  saving: boolean;
  transitioning: boolean;
  onSelectIssue?: (issueKey: string) => void;
}) {
  const inputClassName =
    "h-7 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <div className="space-y-3">
      <section className="space-y-2 rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800">
        <h3 className="text-xs font-semibold">Editable fields</h3>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Summary
          </label>
          <input
            className={inputClassName}
            value={summaryDraft}
            onChange={(event) => onSummaryChange(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Description
          </label>
          <TextArea
            className="min-h-24 w-full text-xs"
            value={descriptionDraft}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </div>
        <Button size="sm" onPress={onSave} isDisabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold">Workflow transitions</h3>
        <div className="flex flex-wrap gap-1">
          {transitions.length === 0 ? (
            <EmptyState message="No transitions available." />
          ) : (
            transitions.map((transition) => (
              <Button
                key={transition.id}
                size="sm"
                variant="secondary"
                isDisabled={transitioning}
                onPress={() => onTransition(transition.to_state.id)}
              >
                {transition.name} → {transition.to_state.name}
              </Button>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-0.5 text-xs font-semibold">Work item fields</h3>
        <dl className="grid gap-x-4 md:grid-cols-2">
          <DetailField label="Key" value={issue.key} mono />
          <DetailField
            label="Type"
            value={issue.issue_type?.name ?? "—"}
          />
          <DetailField label="Status" value={issue.status.name} />
          <DetailField label="Priority" value={issue.priority?.name ?? "—"} />
          <DetailField
            label="Assignee"
            value={issue.assignee?.display_name ?? "Unassigned"}
          />
          <DetailField
            label="Reporter"
            value={issue.reporter?.display_name ?? "—"}
          />
          <DetailField
            label="Project"
            value={
              issue.project ? `${issue.project.key} · ${issue.project.name}` : "—"
            }
          />
          <DetailField
            label="Parent"
            value={
              issue.parent_issue_key ? (
                <button
                  type="button"
                  className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() => onSelectIssue?.(issue.parent_issue_key!)}
                >
                  {issue.parent_issue_key}
                </button>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label="Sprint"
            value={
              issue.sprint
                ? `${issue.sprint.name}${issue.sprint.active ? " (active)" : ""}`
                : "—"
            }
          />
          <DetailField label="Created" value={formatDateTime(issue.created)} />
          <DetailField label="Updated" value={formatDateTime(issue.updated)} />
          <DetailField label="Due date" value={formatDate(issue.due_date)} />
          <DetailField label="Resolution" value={issue.resolution ?? "—"} />
          <DetailField
            label="Resolved"
            value={formatDateTime(issue.resolution_date)}
          />
          <DetailField
            label="Labels"
            value={
              issue.labels && issue.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {issue.labels.map((label) => (
                    <Chip key={label} size="sm" variant="soft">
                      {label}
                    </Chip>
                  ))}
                </div>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label="Components"
            value={
              issue.components && issue.components.length > 0
                ? issue.components.map((component) => component.name).join(", ")
                : "—"
            }
          />
          <DetailField
            label="Original estimate"
            value={issue.time_tracking?.original_estimate ?? "—"}
          />
          <DetailField
            label="Remaining estimate"
            value={issue.time_tracking?.remaining_estimate ?? "—"}
          />
          <DetailField
            label="Time spent"
            value={issue.time_tracking?.time_spent ?? "—"}
          />
        </dl>
      </section>

      {issue.custom_fields && Object.keys(issue.custom_fields).length > 0 ? (
        <section>
          <h3 className="mb-0.5 text-xs font-semibold">Custom fields</h3>
          <dl>
            {Object.entries(issue.custom_fields).map(([key, value]) => (
              <DetailField key={key} label={key} value={formatFieldValue(value)} />
            ))}
          </dl>
        </section>
      ) : null}

      {issue.additional_fields && Object.keys(issue.additional_fields).length > 0 ? (
        <section>
          <h3 className="mb-0.5 text-xs font-semibold">Additional fields</h3>
          <dl>
            {Object.entries(issue.additional_fields).map(([key, value]) => (
              <DetailField key={key} label={key} value={formatFieldValue(value)} />
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function CommentsTab({
  comments,
  loading,
  commentDraft,
  onCommentDraftChange,
  onSubmit,
  submitting,
}: {
  comments: IssueComment[];
  loading: boolean;
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {comments.length === 0 ? (
          <EmptyState message="No comments yet." />
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
            >
              <div className="text-[11px] text-zinc-500">
                {comment.author?.display_name ?? "Unknown"} · {formatDateTime(comment.created)}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-xs">
                {extractCommentBody(comment.body)}
              </p>
            </article>
          ))
        )}
      </div>

      <div>
        <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Add comment
        </label>
        <TextArea
          className="min-h-20 w-full text-xs"
          value={commentDraft}
          onChange={(event) => onCommentDraftChange(event.target.value)}
        />
        <div className="mt-1.5">
          <Button
            size="sm"
            onPress={onSubmit}
            isDisabled={submitting || commentDraft.trim().length === 0}
          >
            {submitting ? "Posting..." : "Post comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RelatedTab({
  issues,
  onSelectIssue,
}: {
  issues: RelatedIssue[];
  onSelectIssue?: (issueKey: string) => void;
}) {
  if (issues.length === 0) {
    return <EmptyState message="No related work items." />;
  }

  return (
    <WorkItemTable
      trailingLabel="Link"
      rows={issues.map((item) => ({
        id: item.id,
        key: item.key,
        type: item.issue_type?.name ?? null,
        status: item.status?.name ?? null,
        summary: item.summary,
        trailing: item.link_type ?? null,
      }))}
      onRowClick={onSelectIssue}
    />
  );
}

function AttachmentsTab({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) {
    return <EmptyState message="No attachments." />;
  }

  return (
    <div className="divide-y divide-zinc-100 text-[11px] dark:divide-zinc-900">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 py-1"
        >
          <div className="truncate font-medium">{attachment.filename}</div>
          <div className="shrink-0 text-zinc-500">{formatBytes(attachment.size)}</div>
          <div className="shrink-0 truncate text-right text-zinc-500">
            {attachment.author?.display_name ?? "—"}
            {attachment.created ? ` · ${formatDateTime(attachment.created)}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function LinksTab({
  links,
  loading,
}: {
  links: IssueRemoteLink[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (links.length === 0) {
    return <EmptyState message="No web links." />;
  }

  return (
    <div className="divide-y divide-zinc-100 text-[11px] dark:divide-zinc-900">
      {links.map((link) => (
        <article key={link.id} className="grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)] gap-x-3 py-1">
          <div className="truncate font-medium">
            {link.title || link.summary || "Untitled"}
            {link.relationship ? (
              <span className="ml-1 font-normal text-zinc-500">({link.relationship})</span>
            ) : null}
          </div>
          {link.url ? (
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-right text-blue-600 hover:underline dark:text-blue-400"
            >
              {link.url}
            </a>
          ) : (
            <span className="text-right text-zinc-500">—</span>
          )}
        </article>
      ))}
    </div>
  );
}

function SubtasksTab({
  subtasks,
  loading,
  onSelectIssue,
}: {
  subtasks: JiraIssue[];
  loading: boolean;
  onSelectIssue?: (issueKey: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (subtasks.length === 0) {
    return <EmptyState message="No subtasks." />;
  }

  return (
    <WorkItemTable
      rows={subtasks.map((subtask) => ({
        id: subtask.id,
        key: subtask.key,
        type: subtask.issue_type?.name ?? null,
        status: subtask.status.name,
        summary: subtask.summary,
        trailing: subtask.assignee?.display_name ?? null,
      }))}
      onRowClick={onSelectIssue}
    />
  );
}
