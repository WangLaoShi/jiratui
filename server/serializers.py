"""Serialize APIController domain models to JSON-safe structures."""

from __future__ import annotations

from dataclasses import is_dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from jiratui.api_controller.controller import APIControllerResponse
from jiratui.models import BaseModel


def _serialize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, BaseModel):
        return value.as_json()
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize_value(item) for item in value]
    if is_dataclass(value):
        return _serialize_value(value.as_json() if hasattr(value, 'as_json') else value)
    return value


def serialize_response(response: APIControllerResponse) -> dict[str, Any]:
    """Convert an APIControllerResponse into a JSON-serializable dict."""

    payload: dict[str, Any] = {
        'success': response.success,
        'error': response.error,
    }
    if response.result is not None:
        payload['result'] = _serialize_value(response.result)
    else:
        payload['result'] = None
    return payload
