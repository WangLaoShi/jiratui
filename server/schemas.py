"""Pydantic schemas for the Web BFF API."""

from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field

from jiratui.models import WorkItemsSearchOrderBy


class IssueSearchRequest(BaseModel):
    project_key: str | None = None
    created_from: date | None = None
    created_until: date | None = None
    status: int | None = None
    assignee: str | None = None
    issue_type: int | None = None
    issue_key: str | None = None
    search_in_active_sprint: bool = False
    jql_query: str | None = None
    next_page_token: str | None = None
    page: int | None = None
    limit: int | None = None
    order_by: WorkItemsSearchOrderBy | None = None
    search_term: str | None = Field(
        default=None,
        description='Full-text search term (maps to issue_picker when set).',
    )


class IssueUpdateRequest(BaseModel):
    updates: dict[str, Any]


class CommentCreateRequest(BaseModel):
    message: str


class TransitionRequest(BaseModel):
    status_id: str


class WorkItemCreateRequest(BaseModel):
    data: dict[str, Any]
    dynamic_fields: dict[str, Any] = Field(default_factory=dict)
