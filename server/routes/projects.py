from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from jiratui.api_controller.controller import APIController
from server.dependencies import get_controller
from server.serializers import serialize_response

router = APIRouter(prefix='/projects', tags=['projects'])


def _http_error(response) -> HTTPException:
    return HTTPException(status_code=400, detail=response.error or 'Request failed')


@router.get('')
async def list_projects(
    query: str | None = None,
    controller: APIController = Depends(get_controller),
):
    response = await controller.search_projects(query=query or '')
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{project_key}')
async def get_project(
    project_key: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.get_project(key=project_key)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{project_key}/statuses')
async def get_project_statuses(
    project_key: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.get_project_statuses(project_key=project_key)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/{project_key}/issue-types')
async def get_project_issue_types(
    project_key: str,
    controller: APIController = Depends(get_controller),
):
    response = await controller.get_issue_types_for_project(project_key=project_key)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)
