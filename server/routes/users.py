from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from jiratui.api_controller.controller import APIController
from server.dependencies import get_controller
from server.serializers import serialize_response

router = APIRouter(prefix='/users', tags=['users'])


def _http_error(response) -> HTTPException:
    return HTTPException(status_code=400, detail=response.error or 'Request failed')


@router.get('/search')
async def search_users(
    q: str = Query(min_length=1),
    controller: APIController = Depends(get_controller),
):
    response = await controller.search_users(email_or_name=q)
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/assignable')
async def search_assignable_users(
    issue_key: str | None = None,
    project_keys: str | None = None,
    q: str = '',
    controller: APIController = Depends(get_controller),
):
    if issue_key:
        response = await controller.search_users_assignable_to_issue(
            issue_key_or_id=issue_key,
            query=q,
        )
    elif project_keys:
        keys = [key.strip() for key in project_keys.split(',') if key.strip()]
        response = await controller.search_users_assignable_to_projects(project_keys=keys, query=q)
    else:
        raise HTTPException(
            status_code=422,
            detail='Provide either issue_key or project_keys query parameter.',
        )

    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/me')
async def get_current_user(controller: APIController = Depends(get_controller)):
    response = await controller.myself()
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)
