"""Search helpers for the Web BFF."""

from __future__ import annotations

from jiratui.api_controller.controller import APIController
from jiratui.models import JiraIssueSearchResponse, WorkItemsSearchOrderBy

from server.schemas import IssueSearchRequest


def resolve_search_defaults(
    body: IssueSearchRequest,
    config,
) -> tuple[int | None, WorkItemsSearchOrderBy | None]:
    limit = body.limit or config.search_results_per_page
    order_by = body.order_by or config.search_results_default_order
    return limit, order_by


async def search_issues_for_web(
    body: IssueSearchRequest,
    controller: APIController,
    config,
):
    if body.issue_key and body.issue_key.strip():
        response = await controller.get_issue(issue_id_or_key=body.issue_key.strip())
        return response

    if body.search_term and body.search_term.strip():
        return await controller.issue_picker(
            query=body.search_term.strip(),
            project_id=body.project_key,
        )

    limit, order_by = resolve_search_defaults(body, config)

    if config.cloud:
        return await _search_with_pagination(
            controller=controller,
            cloud=True,
            body=body,
            limit=limit,
            order_by=order_by,
        )

    return await controller.search_issues_by_page_number(
        project_key=body.project_key,
        created_from=body.created_from,
        created_until=body.created_until,
        status=body.status,
        assignee=body.assignee,
        issue_type=body.issue_type,
        search_in_active_sprint=body.search_in_active_sprint,
        jql_query=body.jql_query,
        page=body.page,
        limit=limit,
        order_by=order_by,
    )


async def _search_with_pagination(
    controller: APIController,
    cloud: bool,
    body: IssueSearchRequest,
    limit: int | None,
    order_by: WorkItemsSearchOrderBy | None,
):
    next_page_token = body.next_page_token
    collected_issues = []
    last_response = None
    max_pages = 10

    for _ in range(max_pages):
        response = await controller.search_issues(
            project_key=body.project_key,
            created_from=body.created_from,
            created_until=body.created_until,
            status=body.status,
            assignee=body.assignee,
            issue_type=body.issue_type,
            search_in_active_sprint=body.search_in_active_sprint,
            jql_query=body.jql_query,
            next_page_token=next_page_token,
            limit=limit,
            order_by=order_by,
        )

        if not response.success or not response.result:
            return response

        result: JiraIssueSearchResponse = response.result
        last_response = response
        collected_issues.extend(result.issues or [])

        if collected_issues or result.is_last or not result.next_page_token:
            break

        next_page_token = result.next_page_token

    if not last_response or not last_response.result:
        return last_response

    merged = last_response.result
    merged.issues = collected_issues
    last_response.result = merged
    return last_response
