from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from jiratui.api_controller.controller import APIController
from server.dependencies import get_configuration, get_controller
from server.serializers import serialize_response

router = APIRouter(tags=['meta'])


def _http_error(response) -> HTTPException:
    return HTTPException(status_code=400, detail=response.error or 'Request failed')


@router.get('/server/info')
async def server_info(controller: APIController = Depends(get_controller)):
    response = await controller.server_info()
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/server/settings')
async def global_settings(controller: APIController = Depends(get_controller)):
    response = await controller.global_settings()
    if not response.success:
        raise _http_error(response)
    return serialize_response(response)


@router.get('/config/summary')
async def config_summary():
    """Return non-sensitive configuration hints for the UI."""

    config = get_configuration()
    return {
        'cloud': config.cloud,
        'jira_api_version': config.jira_api_version,
        'default_project_key_or_id': config.default_project_key_or_id,
        'search_results_per_page': config.search_results_per_page,
        'search_issues_default_day_interval': config.search_issues_default_day_interval,
        'show_issue_web_links': config.show_issue_web_links,
        'enable_recent_history': config.enable_recent_history,
        'styling': config.styling.as_dict() if config.styling else None,
    }
