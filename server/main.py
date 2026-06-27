"""JiraTUI Web BFF entry point."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from jiratui.config import CONFIGURATION
from server.dependencies import get_configuration
from server.routes import health, issues, meta, projects, users

app = FastAPI(
    title='JiraTUI Web API',
    description='HTTP BFF for the JiraTUI HeroUI web client. Wraps the existing APIController.',
    version='0.1.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r'https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.middleware('http')
async def bind_configuration_context(request: Request, call_next):
    token = CONFIGURATION.set(get_configuration())
    try:
        return await call_next(request)
    finally:
        CONFIGURATION.reset(token)

app.include_router(health.router, prefix='/api/v1')
app.include_router(meta.router, prefix='/api/v1')
app.include_router(projects.router, prefix='/api/v1')
app.include_router(users.router, prefix='/api/v1')
app.include_router(issues.router, prefix='/api/v1')


@app.get('/')
async def root() -> dict[str, str]:
    return {
        'name': 'JiraTUI Web API',
        'docs': '/docs',
        'health': '/api/v1/health',
    }
