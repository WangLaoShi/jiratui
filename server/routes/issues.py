from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from jiratui.api_controller.controller import APIController
from jiratui.exceptions import UpdateWorkItemException, ValidationError
from jiratui.models import JiraIssue, JiraIssueSearchResponse, WorkItemsSearchOrderBy
from server.dependencies import get_configuration, get_controller
from server.schemas import (
    CommentCreateRequest,
    IssueSearchRequest,
    IssueUpdateRequest,
    TransitionRequest,
    WorkItemCreateRequest,
)
from server.search_service import search_issues_for_web
from server.serializers import serialize_response

router = APIRouter(prefix='/issues', tags=['issues'])


def _http_error(response) -> HTTPException:
    return HTTPException(status_code=400, detail=response.error or 'Request failed')


@router.post('/search')
async def search_issues(
    body: IssueSearchRequest,
    controller: APIController = Depends(get_controller),
):
    config = get_configuration()
    response = await search_issues_for_web(body, controller, config)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/order-by-options')
async def order_by_options() -> dict[str, list[tuple[str, str]]]:
    return {'options': WorkItemsSearchOrderBy.to_choices()}


@router.get('/picker/suggestions')
async def issue_picker(
    query: str = Query(min_length=1),
    project_id: str | None = None,
    controller: APIController = Depends(get_controller),
):
    response = await controller.issue_picker(query=query, project_id=project_id)
    return serialize_response(response)


@router.post('')
async def create_issue(
    body: WorkItemCreateRequest,
    controller: APIController = Depends(get_controller),
):
    response = await controller.create_work_item(data=body.data, **body.dynamic_fields)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{issue_key}')
async def get_issue(
    issue_key: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.get_issue(issue_id_or_key=issue_key)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{issue_key}/editmeta')
async def get_issue_editmeta(
    issue_key: str,
    controller: APIController = Depends(get_controller),
):
    metadata = await controller.get_edit_metadata_for_issue(issue_key)
    return {'success': bool(metadata), 'result': metadata}


@router.patch('/{issue_key}')
async def update_issue(
    issue_key: str,
    body: IssueUpdateRequest,
    controller: APIController = Depends(get_controller),
):
    issue_response = await controller.get_issue(issue_id_or_key=issue_key)
    if not issue_response.success or not issue_response.result:
        raise _http_error(issue_response)

    search_result: JiraIssueSearchResponse = issue_response.result
    issue: JiraIssue = search_result.issues[0]

    try:
        response = await controller.update_issue(issue=issue, updates=body.updates)
    except (UpdateWorkItemException, ValidationError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.delete('/{issue_key}')
async def delete_issue(
    issue_key: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.delete_work_item(issue_id_or_key=issue_key)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{issue_key}/transitions')
async def get_transitions(
    issue_key: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.transitions(issue_id_or_key=issue_key)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.post('/{issue_key}/transitions')
async def transition_issue(
    issue_key: str,
    body: TransitionRequest,
    controller: APIController = Depends(get_controller),
):
    response = await controller.transition_issue_status(
        issue_id_or_key=issue_key,
        status_id=body.status_id,
    )
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{issue_key}/comments')
async def get_comments(
    issue_key: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.get_comments(issue_key_or_id=issue_key)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.post('/{issue_key}/comments')
async def add_comment(
    issue_key: str,
    body: CommentCreateRequest,
    controller: APIController = Depends(get_controller),
):
    response = await controller.add_comment(issue_key_or_id=issue_key, message=body.message)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.delete('/{issue_key}/comments/{comment_id}')
async def delete_comment(
    issue_key: str,
    comment_id: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.delete_comment(issue_key_or_id=issue_key, comment_id=comment_id)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{issue_key}/remote-links')
async def get_remote_links(
    issue_key: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.get_issue_remote_links(issue_key_or_id=issue_key)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{issue_key}/subtasks')
async def get_subtasks(
    issue_key: str,
    controller: APIController = Depends(get_controller),
):
    config = get_configuration()
    response = await controller.search_issues(
        jql_query=f'parent={issue_key}',
        fields=['id', 'key', 'status', 'summary', 'issuetype', 'assignee', 'parent'],
        limit=config.search_results_per_page,
    )
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)
