.PHONY: help
help:
	@echo "Available targets:"
	@echo "  env                        - Synchronize the uv environment"
	@echo "  install_pre_commit_hooks   - Install pre-commit hooks"
	@echo "  update_pre_commit_hooks    - Upgrade pre-commit hooks"
	@echo "  lint                       - Lint the code"
	@echo "  lint-fix                   - Lint the code and apply fixes"
	@echo "  test                       - Run tests"
	@echo "  docs-live                  - Generate documentation with live reload"
	@echo "  docs-markdown              - Generate documentation in Markdown format"
	@echo "  docs-html                  - Generate documentation in HTML format"
	@echo "  web-env                    - Install Python web (FastAPI) dependencies"
	@echo "  web-server                 - Start the FastAPI BFF server"
	@echo "  web-client-install         - Install Next.js + HeroUI dependencies"
	@echo "  web-client                 - Start the HeroUI web dev server"

PYTHON ?= python3
VENV ?= .venv
UV := $(shell command -v uv 2>/dev/null)
WEB_PIP_PACKAGES := fastapi 'uvicorn[standard]' python-multipart

ifeq ($(UV),)
WEB_PYTHON := $(if $(wildcard $(VENV)/bin/python),$(VENV)/bin/python,$(PYTHON))
WEB_UVICORN := $(if $(wildcard $(VENV)/bin/uvicorn),$(VENV)/bin/uvicorn,uvicorn)
else
WEB_PYTHON := uv run --group web python
WEB_UVICORN := uv run --group web uvicorn
endif

.PHONY: env
env:
	uv sync --all-groups

.PHONY: install_pre_commit_hooks
install_pre_commit_hooks:
	pre-commit install -t pre-commit
	pre-commit install -t pre-push

.PHONY: update_pre_commit_hooks
update_pre_commit_hooks:
	pre-commit autoupdate

.PHONY: lint
lint:
	mkdir -p /tmp/artifacts
	ruff format . --diff
	ruff check .
	uv run mypy --version
	uv run mypy --cache-dir /dev/null --junit-xml /tmp/artifacts/mypy.xml src

.PHONY: lint-fix
lint-fix:
	ruff format .
	ruff check . --fix

.PHONY: test
test:
	uv run --no-sync pytest src/jiratui

.PHONY: docs-live
docs-live:
	@echo 'Generating documentation with live reload'
	sphinx-autobuild docs _build/html

.PHONY: docs-markdown
docs-markdown:
	@echo 'Generating documentation in Markdown format'
	sphinx-build -M markdown docs /tmp/markdown

.PHONY: docs-html
docs-html:
ifeq ($(strip $(OUTPUT_DIR)),)
	@echo 'Generating documentation in HTML format into docs/_build/html'
	sphinx-build docs docs/_build/html --doctree-dir /tmp
	rm -rf /tmp/index.doctree
else
	@echo 'Generating documentation in HTML format into $(OUTPUT_DIR)'
	sphinx-build docs ${OUTPUT_DIR} --doctree-dir /tmp
	rm -rf /tmp/index.doctree
endif

.PHONY: web-env
web-env:
ifeq ($(UV),)
	@test -x $(VENV)/bin/python || $(PYTHON) -m venv $(VENV)
	$(VENV)/bin/pip install -U pip
	$(VENV)/bin/pip install -e .
	$(VENV)/bin/pip install $(WEB_PIP_PACKAGES)
else
	uv sync --group web
endif

.PHONY: web-server
web-server:
	JIRA_TUI_CONFIG_FILE=$(CURDIR)/jiratui.yaml $(WEB_UVICORN) server.main:app --reload --host 127.0.0.1 --port 8000

.PHONY: web-client-install
web-client-install:
	cd web && npm install

.PHONY: web-client
web-client:
	cd web && npm run dev
