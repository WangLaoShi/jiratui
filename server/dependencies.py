"""FastAPI dependencies."""

from __future__ import annotations

from functools import lru_cache

from jiratui.api_controller.controller import APIController
from jiratui.config import ApplicationConfiguration


@lru_cache
def get_configuration() -> ApplicationConfiguration:
    return ApplicationConfiguration()


def get_controller() -> APIController:
    return APIController(configuration=get_configuration())
