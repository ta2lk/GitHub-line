# Git2Live / GitHub-Line: Architecture Audit Report

**Date:** September 2026  
**Auditor:** Senior / Principal Infrastructure & AI Systems Architect  
**Project:** Git2Live (Repository Sandbox & Universal AI Bridge Engine)

---

## 1. Current Architecture

The platform operates as a modern TypeScript/Node.js full-stack system comprising:
- **Web Frontend:** React 19 + Tailwind CSS + Lucide Icons + Motion Layouts.
- **Control Plane Server:** Express.js API server (`server.ts`) hosting REST endpoints, Server-Sent Events (SSE) log streaming, live preview proxying, and Vite middleware.
- **In-Memory State Store:** `server/db.ts` implementing `Git2LiveDatabase` with seed data for Users, Projects, Builds, Runtimes, AI Sessions, Environment Variables, and Audit Logs.
- **Modular Sub-Services:**
  - `services/analyzer`: Remote GitHub manifest scanning, heuristic framework/language detection, basic regex-based security audit.
  - `services/builder`: Stateful build worker simulating/orchestrating sequential build phases (QUEUED, CLONING, ANALYZING, PREPARING, INSTALLING, BUILDING, SUCCESS/FAILED) with log pub/sub.
  - `services/runtime`: Manages container runtime instances and hosts the rich interactive preview generator (`previewGenerator.ts` + template sandboxes).
  - `services/ai-agent`: Autonomous repair engine using Google GenAI SDK (`@google/genai`) with model failover and heuristics.
  - `services/cleanup`: Background worker for stopping idle containers after 30 minutes.
  - `services/github`: GitHub API provider with SSRF validation preventing loopback, cloud metadata (169.254.169.254), and private RFC1918 subnets.

---

## 2. Existing Services & Responsibilities

| Service Directory | Primary Responsibilities | Current Implementation State |
| :--- | :--- | :--- |
| `services/analyzer` | Detect language, framework, manifest files, security issues | Heuristic regex scoring; lacks deep AST/code scanning for AI SDKs |
| `services/builder` | Build plan execution, log streaming, failure hooks | In-memory execution; needs real containerized build pipeline |
| `services/runtime` | Manage runtime lifecycle (create, start, stop, restart, inspect) | In-memory instance tracking with embedded preview templates; lacks Docker Engine integration |
| `services/ai-agent` | Error classification, root-cause analysis, auto-patching | Supports Gemini SDK with model fallback; needs integration with AI Bridge |
| `services/cleanup` | Reap idle instances and resources | In-memory idle check interval; needs Docker volume/network reclamation |
| `services/github` | Safe GitHub repo retrieval & SSRF protection | Production-grade SSRF URL parsing, owner/repo validation |

---

## 3. Existing API Endpoints

- **Health & Info:**
  - `GET /api/health`
  - `GET /api/ready`
  - `GET /api/live`
  - `GET /api/v1/health`
- **User & Auth:**
  - `GET /api/v1/users/me`
  - `POST /api/v1/auth/role`
- **Projects & Analysis:**
  - `GET /api/v1/projects`
  - `GET /api/v1/projects/:id`
  - `POST /api/v1/projects`
  - `DELETE /api/v1/projects/:id`
  - `POST /api/v1/projects/analyze`
- **Builds & Logs:**
  - `GET /api/v1/projects/:id/builds`
  - `GET /api/v1/builds/:id`
  - `GET /api/v1/builds/:id/logs`
  - `GET /api/v1/builds/:id/logs/stream` (SSE)
  - `POST /api/v1/projects/:id/build`
- **Runtime & Live Preview:**
  - `GET /api/v1/projects/:id/runtime`
  - `POST /api/v1/projects/:id/runtime`
  - `POST /api/v1/runtime/:id/start`
  - `POST /api/v1/runtime/:id/stop`
  - `POST /api/v1/runtime/:id/restart`
  - `GET /api/v1/runtime/:id`
  - `DELETE /api/v1/runtime/:id`
  - `GET /api/v1/preview/:runtimeId`
  - `POST /api/v1/preview/:runtimeId/chat`
  - `POST /api/v1/preview/:runtimeId/execute`
  - `POST /api/v1/preview/:runtimeId/terminal`
- **AI Repair:**
  - `GET /api/v1/projects/:id/ai/sessions`
  - `POST /api/v1/projects/:id/ai/repair`
- **Workspace Files:**
  - `GET /api/v1/projects/:id/files`
  - `GET /api/v1/projects/:id/files/content`
  - `POST /api/v1/projects/:id/files/save`
- **Environment Variables:**
  - `GET /api/v1/projects/:id/env`
  - `POST /api/v1/projects/:id/env`
  - `DELETE /api/v1/projects/:id/env/:envId`

---

## 4. Existing Database Layer

- Implemented via `Git2LiveDatabase` class (`server/db.ts`).
- Fully in-memory with pre-seeded users (`adminUser`, `demoUser`), projects (Vite, Next.js, FastAPI), builds, logs, and sample file systems.
- Sufficient for development and containerized multi-tenant sessions; no unnecessary heavyweight DB overhead is imposed.

---

## 5. Existing AI Implementation

- Direct integration in `services/ai-agent/src/index.ts` with Google GenAI SDK.
- Fallback logic between models (`gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`) and fallback heuristic rule engine.
- Direct endpoint in preview chat (`POST /api/v1/preview/:runtimeId/chat`) invoking Gemini when `GEMINI_API_KEY` is present.
- **Gap:** No centralized AI Bridge or Model Router; projects needing AI credentials either require user-supplied keys or fail.

---

## 6. Existing Runtime Implementation

- `SandboxedRuntimeManager` tracks instances in a TypeScript `Map`.
- Generates rich interactive HTML previews with mock container state, memory jitter, and live JavaScript execution via Node `vm`.
- **Gap:** No Docker socket / CLI invocation layer to spin up real Linux container sandboxes when Docker is present.

---

## 7. Existing GitHub Implementation

- `GitHubProvider` features robust SSRF prevention blocking loopback (127.0.0.1, localhost, 0.0.0.0), cloud metadata (169.254.169.254, metadata.google.internal), and RFC1918 subnets.
- Validates repository URLs and fetches raw contents via GitHub REST API.

---

## 8. Missing Components (Identified for Phase Execution)

1. **Universal AI Bridge (`services/ai-bridge/`):**
   - OpenAI-compatible API Gateway (`/v1/chat/completions`, `/v1/models`, `/v1/embeddings`, `/health`).
   - Adapters for OpenAI, Gemini, Anthropic, Ollama, and generic OpenAI-compatible providers.
   - Intelligent Model Router (`AI_ROUTER_MODE=auto`) supporting capability-based and cost-based routing with automatic fallback.
2. **AI Detector & AI Requirements Schema:**
   - Deep inspection of source code and package manifests across languages (Node, Python, Go, Rust, Java, PHP, Ruby).
   - Structured `AIRequirements` schema output.
3. **AI Bridge Injector:**
   - Injects proxy environment variables (`OPENAI_BASE_URL=http://ai-bridge:8080/v1`) without copying platform API secrets into untrusted project containers.
4. **Real Docker Runtime & Security Sandbox:**
   - Docker CLI/Engine executor with graceful fallback when Docker daemon is unavailable in sandboxed parent environments.
   - Non-root user, resource limits (CPU, RAM, pids, disk), dropped capabilities (`--cap-drop=ALL`), read-only root FS where possible, no `/var/run/docker.sock` access, no host filesystem mounts.
5. **Universal Build Planner & Dynamic Dockerfile Generator:**
   - Multi-language support (Node.js, Python, Go, Rust, Java, PHP) generating safe multi-stage Dockerfiles.
6. **Log Sanitizer:**
   - Redaction of API keys, bearer tokens, passwords, and private system paths from build and runtime logs.
7. **Canonical API Endpoints:**
   - Add standard `/api/projects/*` aliases alongside `/api/v1/projects/*` to fulfill platform specifications without breaking existing frontend consumers.

---

## 9. Security Weaknesses & Mitigation Plan

| Identified Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| Untrusted code leaking AI provider API keys | **CRITICAL** | AI Bridge Proxy architecture: project container receives only local Bridge URL; never platform API keys. |
| Container breakout / Docker socket abuse | **CRITICAL** | Strict policy: never mount `/var/run/docker.sock` or host directories into project sandboxes. Run as unprivileged UID 1000. |
| Server-Side Request Forgery (SSRF) | **HIGH** | Enhanced SSRF validation on repository cloning and AI Bridge egress. |
| Malicious npm/pip postinstall scripts | **HIGH** | Resource-constrained, non-root isolated container build phase with network namespace isolation. |
| Resource exhaustion (DoS) | **MEDIUM** | Enforcement of CPU cores (e.g. 1.0), RAM (e.g. 1024MB), PIDs limit (100), and execution timeouts (600s). |

---

## 10. Required Changes Execution Roadmap

- **Phase 2:** Universal AI Bridge (`services/ai-bridge/`) with router and adapters.
- **Phase 3:** Enhanced AI Detector with `AIRequirements` schema in `services/analyzer/`.
- **Phase 4:** AI Bridge Injector.
- **Phase 5 & 6:** Real Docker Runtime & Security Sandbox in `services/runtime/`.
- **Phase 7 & 8:** Build Planner, Dynamic Dockerfile Generator, Port Detector, and Health Checks.
- **Phase 9 & 10:** AI Repair Agent Integration, Log Sanitizer, and Cleanup Worker.
- **Phase 11:** Provider Configuration & Local AI (Ollama).
- **Phase 12:** Tests (`tests/`) & Architectural Documentation.
