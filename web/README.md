# JiraTUI Web (HeroUI)

Human-friendly web client for JiraTUI, built with **Next.js + HeroUI**.  
The Python FastAPI server in `../server/` wraps the existing `APIController` — no Jira REST logic is duplicated here.

## Prerequisites

- Node.js 20+
- Python 3.12+ with [uv](https://docs.astral.sh/uv/)
- A working `jiratui.yaml` in the repo root (copy from `config.yaml` on `main`, or use `jiratui.example.yaml` as a template)

The FastAPI server reads config via `JIRA_TUI_CONFIG_FILE=./jiratui.yaml` (set automatically by `make web-server`).

## Development

Terminal 1 — FastAPI BFF:

```bash
make web-env
make web-server
```

Terminal 2 — HeroUI frontend:

```bash
make web-client-install   # first time only
make web-client
```

Open [http://localhost:3000](http://localhost:3000).

API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Environment

Optional override for the API base URL:

```bash
export NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Architecture

```
Browser (Next.js + HeroUI)
    ↓  /api/v1/*
server/main.py (FastAPI)
    ↓
jiratui.api_controller.APIController  (existing Python core)
    ↓
Atlassian Jira REST API
```

The TUI and CLI on `main` continue to work unchanged. This branch adds the web stack alongside them.
