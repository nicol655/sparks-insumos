# syntax=docker/dockerfile:1

# deps · production env, cached on the lockfile
FROM python:3.12-slim-bookworm AS deps
COPY --from=ghcr.io/astral-sh/uv:python3.12-bookworm-slim /usr/local/bin/uv /usr/local/bin/uvx /bin/
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# dev · reload and pytest. Source arrives by bind mount; .venv stays in an
# anonymous volume so the host tree does not hide the installed env.
FROM deps AS dev
RUN uv sync --frozen --group dev
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# runner · no test tools, non-root
FROM python:3.12-slim-bookworm AS runner
WORKDIR /app
RUN useradd --create-home --uid 1001 --shell /usr/sbin/nologin app
COPY --from=deps /app/.venv /app/.venv
COPY app ./app
ENV PATH="/app/.venv/bin:$PATH"
USER app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
