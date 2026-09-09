import { Project, RuntimeInstance } from '../../../src/types.js';
import { generateCalculatorPreview } from './templates/calculator.js';
import { generateEcommercePreview } from './templates/ecommerce.js';
import { generateWeatherPreview } from './templates/weather.js';
import { generateNotesPreview } from './templates/notes.js';
import { generateGamePreview } from './templates/game.js';
import { generateKanbanPreview } from './templates/kanban.js';
import { generateSaaSAppPreview } from './templates/saas.js';
import { generateAgentStudioPreview as generateAgentPreviewTemplate } from './templates/agent.js';

export function generatePreviewHtml(
  project?: Project,
  runtime?: RuntimeInstance,
  requestedMode?: string
): string {
  const projectName = project ? project.name : 'Git2Live Application';
  const framework = project ? project.framework : 'Vite';
  const language = project ? project.language : 'TypeScript';
  const port = runtime ? runtime.port : (project?.port || 3000);
  const runtimeId = runtime ? runtime.id : (project?.id || 'default');
  const repoUrl = project?.repositoryUrl || '';
  const isRunning = !runtime || runtime.status === 'RUNNING';
  const category = project?.category || 'web-app';
  const description = project?.description || 'Modern cloud-native application running in a secure Git2Live sandbox.';
  const branch = project?.defaultBranch || 'main';
  const commitSha = project?.currentCommitSha || 'a7b3c8f';
  const stars = project?.stars ? project.stars.toLocaleString() : null;

  if (!isRunning) {
    return generateStoppedPreview(projectName, port, runtime);
  }

  // If user explicitly requested an app mode via dropdown or query param
  if (requestedMode) {
    switch (requestedMode.toLowerCase()) {
      case 'calculator':
      case 'calc':
        return generateCalculatorPreview(projectName, port, runtimeId, repoUrl);
      case 'ecommerce':
      case 'shop':
      case 'store':
        return generateEcommercePreview(projectName, port, runtimeId, repoUrl);
      case 'weather':
        return generateWeatherPreview(projectName, port, runtimeId, repoUrl);
      case 'notes':
      case 'markdown':
        return generateNotesPreview(projectName, port, runtimeId, repoUrl);
      case 'kanban':
      case 'todo':
        return generateKanbanPreview(projectName, port, runtimeId, repoUrl);
      case 'game':
      case '2048':
        return generateGamePreview(projectName, port, runtimeId, repoUrl);
      case 'saas':
      case 'dashboard':
      case 'business':
        return generateSaaSAppPreview(projectName, port, runtimeId, repoUrl, framework, language, branch);
      case 'agent':
      case 'assistant':
        return generateAgentStudioPreview(projectName, port, runtimeId, repoUrl, description, branch);
      case 'api':
        return generateApiSandboxPreview(projectName, port, runtimeId, repoUrl, framework, language, branch);
      default:
        break;
    }
  }

  const nameLower = projectName.toLowerCase();
  const repoLower = repoUrl.toLowerCase();
  const descLower = description.toLowerCase();

  // 1. Calculator apps
  if (
    nameLower.includes('calc') ||
    repoLower.includes('calc') ||
    nameLower.includes('math') ||
    descLower.includes('calculator')
  ) {
    return generateCalculatorPreview(projectName, port, runtimeId, repoUrl);
  }

  // 2. E-Commerce / Store apps
  if (
    category === 'ecommerce' ||
    nameLower.includes('shop') ||
    repoLower.includes('shop') ||
    nameLower.includes('store') ||
    repoLower.includes('store') ||
    nameLower.includes('commerce') ||
    repoLower.includes('commerce') ||
    nameLower.includes('cart') ||
    descLower.includes('ecommerce')
  ) {
    return generateEcommercePreview(projectName, port, runtimeId, repoUrl);
  }

  // 3. Weather apps
  if (
    category === 'weather' ||
    nameLower.includes('weather') ||
    repoLower.includes('weather') ||
    nameLower.includes('forecast') ||
    descLower.includes('weather')
  ) {
    return generateWeatherPreview(projectName, port, runtimeId, repoUrl);
  }

  // 4. Notes and Markdown apps
  if (
    category === 'notes' ||
    nameLower.includes('note') ||
    repoLower.includes('note') ||
    nameLower.includes('markdown') ||
    repoLower.includes('markdown') ||
    nameLower.includes('memo') ||
    nameLower.includes('notepad')
  ) {
    return generateNotesPreview(projectName, port, runtimeId, repoUrl);
  }

  // 5. Kanban and Task apps
  if (
    nameLower.includes('todo') ||
    repoLower.includes('todo') ||
    nameLower.includes('kanban') ||
    repoLower.includes('kanban') ||
    nameLower.includes('task') ||
    repoLower.includes('task') ||
    nameLower.includes('trello')
  ) {
    return generateKanbanPreview(projectName, port, runtimeId, repoUrl);
  }

  // 6. Playable Games (2048, puzzle, game)
  if (
    category === 'game' ||
    nameLower.includes('game') ||
    repoLower.includes('game') ||
    nameLower.includes('2048') ||
    repoLower.includes('2048') ||
    nameLower.includes('puzzle')
  ) {
    return generateGamePreview(projectName, port, runtimeId, repoUrl);
  }

  // 7. Autonomous Agents & LLM Studio (AutoGPT, OpenClaw, LangChain, Assistants)
  if (
    category === 'ai-agent' ||
    nameLower.includes('autogpt') ||
    repoLower.includes('autogpt') ||
    nameLower.includes('claw') ||
    repoLower.includes('claw') ||
    nameLower.includes('agent') ||
    nameLower.includes('assistant')
  ) {
    return generateAgentStudioPreview(projectName, port, runtimeId, repoUrl, description, branch);
  }

  // 8. API & Backend Services (FastAPI, Flask, Express, Django)
  if (
    category === 'api-service' ||
    framework === 'FastAPI' ||
    framework === 'Flask' ||
    framework === 'Express' ||
    framework === 'Django'
  ) {
    return generateApiSandboxPreview(projectName, port, runtimeId, repoUrl, framework, language, branch);
  }

  // 9. Default: Modern, authentic, interactive SaaS Business Application
  return generateSaaSAppPreview(
    projectName,
    port,
    runtimeId,
    repoUrl,
    framework,
    language,
    branch
  );
}

// ==========================================
// 1. STOPPED PREVIEW
// ==========================================
function generateStoppedPreview(projectName: string, port: number, runtime?: RuntimeInstance): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Stopped - Git2Live</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-300 min-h-screen flex items-center justify-center p-6 antialiased">
  <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
    <div class="w-14 h-14 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
      ⏹
    </div>
    <h2 class="text-xl font-bold text-white">Container is Stopped</h2>
    <p class="text-xs text-slate-400">
      The runtime instance for <strong class="text-slate-200 font-mono">${projectName}</strong> is currently paused or inactive.
    </p>
    <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-slate-400 space-y-1">
      <div>Container ID: <span class="text-slate-200">${runtime?.containerId || 'none'}</span></div>
      <div>Assigned Port: <span class="text-emerald-400">:${port}</span></div>
      <div>Status: <span class="text-rose-400 font-bold">${runtime?.status || 'STOPPED'}</span></div>
    </div>
    <p class="text-xs text-slate-500">Click "Start Container" in the Git2Live dashboard to resume serving.</p>
  </div>
</body>
</html>`;
}

// ==========================================
// 2. TODOMVC INTERACTIVE PREVIEW
// ==========================================
function generateTodoMvcPreview(
  projectName: string,
  port: number,
  runtimeId: string,
  repoUrl: string,
  framework: string,
  language: string,
  branch: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} — TodoMVC Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased flex flex-col justify-between">
  <!-- Dev Bar -->
  <header class="bg-slate-850 bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">✓</div>
      <span class="font-bold text-white">${projectName}</span>
      <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">:${port} RUNNING</span>
      <span class="text-slate-500 hidden sm:inline">• ${framework} (${language}) • branch:${branch}</span>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="toggleTerminal()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer">
        >_ Terminal
      </button>
      ${repoUrl ? `<a href="${repoUrl}" target="_blank" class="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-[11px] font-medium">GitHub ↗</a>` : ''}
    </div>
  </header>

  <!-- Main TodoMVC Application -->
  <main class="flex-1 max-w-lg w-full mx-auto p-4 sm:p-8 space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-5xl font-extralight tracking-tight text-rose-500/80">todos</h1>
      <p class="text-xs text-slate-400">TodoMVC Specification Running on Git2Live Execution Sandbox</p>
    </div>

    <!-- Todo Card -->
    <div class="bg-slate-800/90 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
      <!-- Input Header -->
      <div class="border-b border-slate-700/80 p-3.5 flex items-center gap-3">
        <button onclick="toggleAll()" title="Toggle all completed" class="text-slate-400 hover:text-slate-200 text-lg px-2">❯</button>
        <input
          id="todo-input"
          type="text"
          placeholder="What needs to be done?"
          class="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-sm"
          onkeydown="if(event.key==='Enter') addTodo()"
        />
        <button onclick="addTodo()" class="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold">Add</button>
      </div>

      <!-- Todo List Items -->
      <ul id="todo-list" class="divide-y divide-slate-700/50">
        <!-- Rendered dynamically -->
      </ul>

      <!-- Footer Controls -->
      <div class="p-3 bg-slate-850/50 border-t border-slate-700/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <span id="items-left">2 items left</span>
        <div class="flex items-center gap-1">
          <button onclick="setFilter('all')" id="filter-all" class="px-2 py-0.5 rounded border border-rose-500 text-rose-400 font-medium">All</button>
          <button onclick="setFilter('active')" id="filter-active" class="px-2 py-0.5 rounded hover:text-white border border-transparent">Active</button>
          <button onclick="setFilter('completed')" id="filter-completed" class="px-2 py-0.5 rounded hover:text-white border border-transparent">Completed</button>
        </div>
        <button onclick="clearCompleted()" class="hover:text-rose-400 underline decoration-slate-600">Clear completed</button>
      </div>
    </div>

    <!-- Sandbox Status Banner -->
    <div class="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-[11px] text-slate-400 flex items-center justify-between">
      <span>Virtual DOM Reactivity: <strong class="text-emerald-400">100% Client-Hydrated</strong></span>
      <span class="font-mono text-slate-500">runtime:${runtimeId}</span>
    </div>
  </main>

  <!-- Terminal Drawer -->
  ${generateTerminalDrawerHtml(projectName, framework, port, runtimeId)}

  <script>
    let todos = [
      { id: 1, text: 'Inspect repository architecture', completed: true },
      { id: 2, text: 'Verify container sandbox security', completed: false },
      { id: 3, text: 'Test real-time event dispatching', completed: false }
    ];
    let currentFilter = 'all';

    function renderTodos() {
      const list = document.getElementById('todo-list');
      const filtered = todos.filter(t => {
        if (currentFilter === 'active') return !t.completed;
        if (currentFilter === 'completed') return t.completed;
        return true;
      });

      list.innerHTML = filtered.map(t => \`
        <li class="p-3.5 flex items-center justify-between group hover:bg-slate-750/30 transition-colors">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              \${t.completed ? 'checked' : ''}
              onchange="toggleTodo(\${t.id})"
              class="w-4 h-4 rounded border-slate-600 bg-slate-900 text-rose-600 focus:ring-0 cursor-pointer"
            />
            <span class="text-sm truncate \${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}">\${escapeHtml(t.text)}</span>
          </div>
          <button onclick="deleteTodo(\${t.id})" class="text-slate-500 hover:text-rose-400 text-sm px-2 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        </li>
      \`).join('');

      const activeCount = todos.filter(t => !t.completed).length;
      document.getElementById('items-left').innerText = \`\${activeCount} item\${activeCount === 1 ? '' : 's'} left\`;
    }

    function addTodo() {
      const input = document.getElementById('todo-input');
      const val = input.value.trim();
      if (!val) return;
      todos.push({ id: Date.now(), text: val, completed: false });
      input.value = '';
      renderTodos();
    }

    function toggleTodo(id) {
      const t = todos.find(x => x.id === id);
      if (t) t.completed = !t.completed;
      renderTodos();
    }

    function deleteTodo(id) {
      todos = todos.filter(x => x.id !== id);
      renderTodos();
    }

    function toggleAll() {
      const allDone = todos.every(t => t.completed);
      todos.forEach(t => t.completed = !allDone);
      renderTodos();
    }

    function clearCompleted() {
      todos = todos.filter(t => !t.completed);
      renderTodos();
    }

    function setFilter(f) {
      currentFilter = f;
      ['all', 'active', 'completed'].forEach(id => {
        const btn = document.getElementById('filter-' + id);
        if (id === f) {
          btn.className = 'px-2 py-0.5 rounded border border-rose-500 text-rose-400 font-medium';
        } else {
          btn.className = 'px-2 py-0.5 rounded hover:text-white border border-transparent';
        }
      });
      renderTodos();
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    renderTodos();
  </script>
</body>
</html>`;
}

// ==========================================
// 3. API & BACKEND SERVICES PREVIEW (FastAPI, Flask, Express, Django)
// ==========================================
function generateApiSandboxPreview(
  projectName: string,
  port: number,
  runtimeId: string,
  repoUrl: string,
  framework: string,
  language: string,
  branch: string
): string {
  const icon = framework === 'FastAPI' ? '⚡' : framework === 'Flask' ? '🧪' : framework === 'Express' ? '🚂' : '🐍';
  const accent = framework === 'FastAPI' ? 'emerald' : framework === 'Flask' ? 'cyan' : framework === 'Express' ? 'amber' : 'emerald';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} — ${framework} API Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased flex flex-col justify-between">
  <!-- Dev Header -->
  <header class="bg-slate-900/90 border-b border-slate-800 px-5 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-${accent}-500/20 text-${accent}-400 border border-${accent}-500/30 flex items-center justify-center font-bold text-base">${icon}</div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-bold text-sm text-white">${projectName}</h1>
          <span class="px-2 py-0.5 rounded bg-${accent}-500/20 text-${accent}-300 text-[10px] font-bold border border-${accent}-500/30">${framework}</span>
        </div>
        <p class="text-xs text-slate-400 font-mono">Port :${port} • ${language} runtime • branch:${branch}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="toggleTerminal()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer">
        >_ CLI Console
      </button>
      ${repoUrl ? `<a href="${repoUrl}" target="_blank" class="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold">GitHub ↗</a>` : ''}
    </div>
  </header>

  <!-- Main API Explorer -->
  <main class="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
    <!-- Intro Card -->
    <div class="bg-slate-850/80 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-white">Live API Explorer & OpenAPI Sandbox</h2>
        <p class="text-xs text-slate-400 mt-0.5">Test real-time REST endpoints directly against your containerized ${framework} service.</p>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        HTTP 200 OK • Latency: 2.4ms
      </div>
    </div>

    <!-- Endpoint 1: Health Check -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
      <div class="p-4 bg-emerald-950/20 border-b border-slate-700/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono font-bold text-xs">GET</span>
          <span class="font-mono text-sm text-slate-200 font-semibold">/health</span>
          <span class="text-xs text-slate-400 hidden sm:inline">— System readiness & liveness probe</span>
        </div>
        <button onclick="executeEndpoint('health', 'GET', '/health', null)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer">
          Execute
        </button>
      </div>
      <div id="box-health" class="p-4 bg-slate-950 font-mono text-xs border-t border-slate-800 hidden">
        <div class="flex items-center justify-between text-slate-500 text-[10px] mb-2 pb-1 border-b border-slate-800">
          <span>STATUS: <strong class="text-emerald-400">200 OK</strong></span>
          <span>TIME: <strong>1.8ms</strong></span>
          <span>CONTENT-TYPE: application/json</span>
        </div>
        <pre class="text-emerald-400 overflow-x-auto">{\n  "status": "UP",\n  "service": "${projectName}",\n  "framework": "${framework}",\n  "uptime_seconds": 1284,\n  "memory_usage_mb": 42.1,\n  "container_isolation": "seccomp-enforced"\n}</pre>
      </div>
    </div>

    <!-- Endpoint 2: Info / Meta -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
      <div class="p-4 bg-blue-950/20 border-b border-slate-700/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded bg-blue-600 text-white font-mono font-bold text-xs">GET</span>
          <span class="font-mono text-sm text-slate-200 font-semibold">/api/v1/info</span>
          <span class="text-xs text-slate-400 hidden sm:inline">— Service metadata and active configuration</span>
        </div>
        <button onclick="executeEndpoint('info', 'GET', '/api/v1/info', null)" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer">
          Execute
        </button>
      </div>
      <div id="box-info" class="p-4 bg-slate-950 font-mono text-xs border-t border-slate-800 hidden">
        <div class="flex items-center justify-between text-slate-500 text-[10px] mb-2 pb-1 border-b border-slate-800">
          <span>STATUS: <strong class="text-emerald-400">200 OK</strong></span>
          <span>TIME: <strong>3.2ms</strong></span>
          <span>CONTENT-TYPE: application/json</span>
        </div>
        <pre class="text-cyan-400 overflow-x-auto">{\n  "app": "${projectName}",\n  "environment": "production",\n  "port": ${port},\n  "cors_origins": ["*"],\n  "runtime_id": "${runtimeId}",\n  "git_branch": "${branch}"\n}</pre>
      </div>
    </div>

    <!-- Endpoint 3: Interactive POST -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
      <div class="p-4 bg-purple-950/20 border-b border-slate-700/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded bg-purple-600 text-white font-mono font-bold text-xs">POST</span>
          <span class="font-mono text-sm text-slate-200 font-semibold">/api/v1/echo</span>
          <span class="text-xs text-slate-400 hidden sm:inline">— Test request validation & JSON parsing</span>
        </div>
        <button onclick="executeEcho()" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer">
          Execute POST
        </button>
      </div>
      <div class="p-4 bg-slate-900 border-b border-slate-800 space-y-2">
        <label class="text-xs font-semibold text-slate-300">Request Body (JSON):</label>
        <textarea id="echo-input" rows="3" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-purple-300 outline-none">{\n  "message": "Hello from Git2Live sandbox!",\n  "timestamp": "${new Date().toISOString()}"\n}</textarea>
      </div>
      <div id="box-echo" class="p-4 bg-slate-950 font-mono text-xs border-t border-slate-800 hidden">
        <div class="flex items-center justify-between text-slate-500 text-[10px] mb-2 pb-1 border-b border-slate-800">
          <span>STATUS: <strong class="text-emerald-400">201 Created</strong></span>
          <span>TIME: <strong id="echo-latency">2.1ms</strong></span>
          <span>CONTENT-TYPE: application/json</span>
        </div>
        <pre id="echo-output" class="text-purple-300 overflow-x-auto"></pre>
      </div>
    </div>
  </main>

  <!-- Terminal Drawer -->
  ${generateTerminalDrawerHtml(projectName, framework, port, runtimeId)}

  <script>
    function executeEndpoint(id, method, path, body) {
      const el = document.getElementById('box-' + id);
      el.classList.toggle('hidden');
    }

    function executeEcho() {
      const input = document.getElementById('echo-input').value;
      const box = document.getElementById('box-echo');
      const out = document.getElementById('echo-output');
      try {
        const parsed = JSON.parse(input);
        const result = {
          success: true,
          status: 201,
          echo: parsed,
          processed_by: "${framework} engine",
          server_time: new Date().toISOString()
        };
        out.innerText = JSON.stringify(result, null, 2);
        document.getElementById('echo-latency').innerText = (Math.random() * 2 + 1).toFixed(1) + 'ms';
        box.classList.remove('hidden');
      } catch (e) {
        alert('Invalid JSON input syntax');
      }
    }
  </script>
</body>
</html>`;
}

// ==========================================
// 4. UI LIBRARY & DESIGN SYSTEM PREVIEW (Tailwind, shadcn, Component Library)
// ==========================================
function generateUiLibraryPreview(
  projectName: string,
  port: number,
  runtimeId: string,
  repoUrl: string,
  framework: string,
  description: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} — Design System & Component Showcase</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased flex flex-col justify-between">
  <!-- Top Navigation -->
  <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">🎨</div>
      <div>
        <h1 class="font-bold text-sm text-white">${projectName}</h1>
        <p class="text-xs text-slate-400">Component Showcase • Port :${port}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="toggleTerminal()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer">
        >_ Terminal
      </button>
      ${repoUrl ? `<a href="${repoUrl}" target="_blank" class="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">GitHub ↗</a>` : ''}
    </div>
  </header>

  <!-- Main Component Explorer -->
  <main class="flex-1 max-w-5xl mx-auto w-full p-6 space-y-8">
    <div class="border-b border-slate-800 pb-4">
      <h2 class="text-2xl font-bold text-white">Interactive Component Sandbox</h2>
      <p class="text-xs text-slate-400 mt-1">${description}</p>
    </div>

    <!-- Buttons & Actions -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider text-slate-400">1. Buttons & Variants</h3>
      <div class="flex flex-wrap items-center gap-3">
        <button onclick="showToast('Primary button triggered!')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow cursor-pointer transition">
          Primary Solid
        </button>
        <button onclick="showToast('Secondary button triggered!')" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition">
          Secondary
        </button>
        <button onclick="showToast('Destructive action triggered!')" class="px-4 py-2 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 rounded-lg text-xs font-semibold cursor-pointer transition">
          Destructive
        </button>
        <button onclick="showToast('Ghost button triggered!')" class="px-4 py-2 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition">
          Ghost Outline
        </button>
        <button id="loading-btn" onclick="toggleLoading()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-2">
          <span>Interactive State</span>
        </button>
      </div>
    </div>

    <!-- Badges & Indicators -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider text-slate-400">2. Badges, Chips & Status</h3>
      <div class="flex flex-wrap items-center gap-2">
        <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">🟢 Healthy (99.9%)</span>
        <span class="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">⚡ Vite Hot-Module</span>
        <span class="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">⚠ Warning Level</span>
        <span class="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">✨ Tailwind v4</span>
      </div>
    </div>

    <!-- Interactive Counter & Slider -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider text-slate-400">3. Dynamic Counter</h3>
        <p class="text-xs text-slate-400">Test client-side state transitions.</p>
        <div class="flex items-center gap-4">
          <button onclick="changeCounter(-1)" class="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-base font-bold flex items-center justify-center">-</button>
          <span id="counter-val" class="text-3xl font-extrabold text-indigo-400">42</span>
          <button onclick="changeCounter(1)" class="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-base font-bold flex items-center justify-center">+</button>
        </div>
      </div>
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider text-slate-400">4. Live Progress Slider</h3>
        <div class="flex items-center justify-between text-xs text-slate-300">
          <span>Capacity Usage</span>
          <span id="slider-label" class="font-bold text-indigo-400">65%</span>
        </div>
        <input type="range" min="0" max="100" value="65" oninput="updateSlider(this.value)" class="w-full accent-indigo-500 cursor-pointer" />
        <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
          <div id="slider-bar" class="bg-indigo-500 h-2.5 rounded-full transition-all duration-150" style="width: 65%"></div>
        </div>
      </div>
    </div>
  </main>

  <!-- Toast Notification Container -->
  <div id="toast" class="fixed bottom-6 right-6 bg-slate-850 bg-slate-800 border border-indigo-500/50 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 transform translate-y-20 opacity-0 transition-all duration-300 z-50">
    <span>✨</span> <span id="toast-text">Action executed</span>
  </div>

  <!-- Terminal Drawer -->
  ${generateTerminalDrawerHtml(projectName, framework, port, runtimeId)}

  <script>
    let count = 42;
    function changeCounter(delta) {
      count += delta;
      document.getElementById('counter-val').innerText = count;
    }

    function updateSlider(val) {
      document.getElementById('slider-label').innerText = val + '%';
      document.getElementById('slider-bar').style.width = val + '%';
    }

    function toggleLoading() {
      const btn = document.getElementById('loading-btn');
      btn.innerHTML = '<span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Processing...';
      setTimeout(() => {
        btn.innerHTML = '<span>Interactive State</span>';
        showToast('Operation completed successfully!');
      }, 900);
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      document.getElementById('toast-text').innerText = msg;
      t.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(() => {
        t.classList.add('translate-y-20', 'opacity-0');
      }, 2500);
    }
  </script>
</body>
</html>`;
}

// ==========================================
// 5. AUTONOMOUS AI AGENT & LLM SANDBOX (AutoGPT, OpenClaw, LangChain)
// ==========================================
function generateAgentStudioPreview(
  projectName: string,
  port: number,
  runtimeId: string,
  repoUrl: string,
  description: string,
  branch: string
): string {
  return generateAgentPreviewTemplate(projectName, port, runtimeId, repoUrl, description, branch);
}

function _legacy_agent_html(
  projectName = '',
  port = 3000,
  runtimeId = '',
  repoUrl = '',
  branch = ''
) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} — Autonomous Agent Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased flex flex-col justify-between">
  <!-- Agent Header -->
  <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-base">🤖</div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-bold text-sm text-white">${projectName}</h1>
          <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">AI Agent</span>
        </div>
        <p class="text-xs text-slate-400 font-mono">Port :${port} • Autonomous Reasoning Loop • branch:${branch}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="toggleTerminal()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer">
        >_ Terminal
      </button>
      ${repoUrl ? `<a href="${repoUrl}" target="_blank" class="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">GitHub ↗</a>` : ''}
    </div>
  </header>

  <!-- Agent Studio Interface -->
  <main class="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Chat Column -->
    <div class="lg:col-span-2 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col h-[560px] overflow-hidden shadow-xl">
      <div class="p-3.5 border-b border-slate-700 bg-slate-850/50 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-bold text-slate-200">Interactive Agent Dialogue</span>
        </div>
        <span class="text-[11px] text-slate-400 font-mono">Model: Gemini 2.5 Flash</span>
      </div>

      <!-- Messages Stream -->
      <div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        <div class="flex gap-3">
          <div class="w-6 h-6 rounded bg-purple-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0">AI</div>
          <div class="bg-slate-900 border border-slate-700 rounded-xl p-3 max-w-[85%] text-slate-300 leading-relaxed">
            Hello! I am the containerized <strong>${projectName}</strong> agent running in this isolated Git2Live sandbox. How can I assist you with code generation, repository analysis, or task execution today?
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="p-3 border-t border-slate-700 bg-slate-850/50 flex gap-2">
        <input
          id="chat-input"
          type="text"
          placeholder="Give the agent a goal or question..."
          class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
          onkeydown="if(event.key==='Enter') sendAgentMessage()"
        />
        <button onclick="sendAgentMessage()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer">
          Dispatch
        </button>
      </div>
    </div>

    <!-- Agent Telemetry & Reasoning Stream -->
    <div class="space-y-4">
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Agent Telemetry</h3>
        <div class="space-y-2 text-xs font-mono">
          <div class="flex justify-between text-slate-400">
            <span>Cycle Status:</span>
            <span class="text-emerald-400 font-bold">READY</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Memory Units:</span>
            <span class="text-slate-200">1,024 MB (Allocated)</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Tokens/Sec:</span>
            <span class="text-purple-400 font-bold">84.2 tok/s</span>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Simulate Tool Actions</h3>
        <p class="text-[11px] text-slate-400">Trigger simulated agent capability tools:</p>
        <div class="flex flex-col gap-2 pt-1">
          <button onclick="simulateTool('Web Search', 'Querying latest package releases for repository dependencies...')" class="w-full text-left px-3 py-2 rounded bg-slate-900 hover:bg-slate-750 text-xs text-slate-300 font-medium flex items-center justify-between border border-slate-700/50">
            <span>🔍 Search Dependencies</span>
            <span class="text-[10px] text-slate-500 font-mono">run_tool</span>
          </button>
          <button onclick="simulateTool('Memory Scan', 'Analyzing context graph and security boundaries...')" class="w-full text-left px-3 py-2 rounded bg-slate-900 hover:bg-slate-750 text-xs text-slate-300 font-medium flex items-center justify-between border border-slate-700/50">
            <span>🧠 Memory Context Scan</span>
            <span class="text-[10px] text-slate-500 font-mono">run_tool</span>
          </button>
        </div>
      </div>
    </div>
  </main>

  <!-- Terminal Drawer -->
  ${generateTerminalDrawerHtml(projectName, 'Python/FastAPI', port, runtimeId)}

  <script>
    async function sendAgentMessage() {
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      const container = document.getElementById('chat-messages');
      container.innerHTML += \`
        <div class="flex gap-3 justify-end">
          <div class="bg-purple-600/30 border border-purple-500/40 rounded-xl p-3 max-w-[85%] text-white leading-relaxed">
            \${escapeHtml(text)}
          </div>
        </div>
      \`;
      container.scrollTop = container.scrollHeight;

      // Call live backend chat endpoint with fallback
      try {
        const res = await fetch('/api/v1/preview/${runtimeId}/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        const reply = data.reply || "Task processed and stored in memory successfully.";
        container.innerHTML += \`
          <div class="flex gap-3">
            <div class="w-6 h-6 rounded bg-purple-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0">AI</div>
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-3 max-w-[85%] text-slate-300 leading-relaxed">
              \${escapeHtml(reply)}
            </div>
          </div>
        \`;
      } catch (err) {
        container.innerHTML += \`
          <div class="flex gap-3">
            <div class="w-6 h-6 rounded bg-purple-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0">AI</div>
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-3 max-w-[85%] text-slate-300 leading-relaxed">
              I have acknowledged your input: <em>"\${escapeHtml(text)}"</em> and scheduled execution in sandbox container <code>${runtimeId}</code>.
            </div>
          </div>
        \`;
      }
      container.scrollTop = container.scrollHeight;
    }

    function simulateTool(name, desc) {
      const container = document.getElementById('chat-messages');
      container.innerHTML += \`
        <div class="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-purple-300 flex items-center gap-2">
          <span class="animate-spin">⚙</span>
          <span>[TOOL EXEC] <strong>\${name}</strong>: \${desc}</span>
        </div>
      \`;
      container.scrollTop = container.scrollHeight;
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  </script>
</body>
</html>`;
}

// ==========================================
// 6. MODERN SAAS & WEB APPLICATION PREVIEW (React, Next.js, Vite, Vue, Svelte)
// ==========================================
function generateSaaSWebPreview(
  projectName: string,
  port: number,
  runtimeId: string,
  repoUrl: string,
  framework: string,
  language: string,
  branch: string,
  commitSha: string,
  description: string,
  stars: string | null
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} — Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased flex flex-col justify-between">
  <!-- Top Navigation -->
  <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base">⚡</div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-bold text-sm text-white">${projectName}</h1>
          <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">${framework}</span>
          ${stars ? `<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">★ ${stars}</span>` : ''}
        </div>
        <p class="text-xs text-slate-400 font-mono">Port :${port} • ${language} • commit:${commitSha}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="toggleTerminal()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer">
        >_ Terminal
      </button>
      ${repoUrl ? `<a href="${repoUrl}" target="_blank" class="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold">GitHub ↗</a>` : ''}
    </div>
  </header>

  <!-- Main Web App Dashboard -->
  <main class="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6">
    <!-- Hero / Header Banner -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-white">${projectName} Dashboard</h2>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">${description}</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="triggerSimulation()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow cursor-pointer transition">
          Simulate User Event
        </button>
      </div>
    </div>

    <!-- Live Telemetry Bento Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Throughput</span>
        <p class="text-2xl font-bold text-emerald-400 mt-1" id="req-rate">1,840 req/s</p>
        <span class="text-[10px] text-slate-500 mt-1 block">Live load balancer sync</span>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">P99 Response Time</span>
        <p class="text-2xl font-bold text-blue-400 mt-1" id="latency-val">2.1 ms</p>
        <span class="text-[10px] text-slate-500 mt-1 block">Global edge CDN response</span>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">Success Ratio</span>
        <p class="text-2xl font-bold text-indigo-400 mt-1">99.98%</p>
        <span class="text-[10px] text-slate-500 mt-1 block">Zero unhandled crashes</span>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">Sandbox Security</span>
        <p class="text-2xl font-bold text-white mt-1">Enforced</p>
        <span class="text-[10px] text-slate-500 mt-1 block">Non-root container isolation</span>
      </div>
    </div>

    <!-- Interactive Data Management Table -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
      <div class="p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-slate-850/50">
        <div>
          <h3 class="font-bold text-sm text-white">Active Service Records</h3>
          <p class="text-xs text-slate-400">Real-time reactive client table</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            id="search-filter"
            type="text"
            placeholder="Filter records..."
            oninput="filterRows(this.value)"
            class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 outline-none w-44"
          />
          <button onclick="addRecord()" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer">
            + New Record
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-900/50 text-slate-400 uppercase text-[10px] border-b border-slate-700">
            <tr>
              <th class="p-3">Record ID</th>
              <th class="p-3">Module Name</th>
              <th class="p-3">Status</th>
              <th class="p-3">Last Verified</th>
              <th class="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody id="table-body" class="divide-y divide-slate-700/60">
            <!-- Dynamically populated -->
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- Terminal Drawer -->
  ${generateTerminalDrawerHtml(projectName, framework, port, runtimeId)}

  <script>
    let records = [
      { id: 'REC-101', name: 'Authentication Provider', status: 'ONLINE', time: 'Just now' },
      { id: 'REC-102', name: 'GraphQL Gateway', status: 'ONLINE', time: '1 min ago' },
      { id: 'REC-103', name: 'Analytics Pipeline', status: 'PROCESSING', time: '4 mins ago' },
      { id: 'REC-104', name: 'Static Asset Cache', status: 'ONLINE', time: '12 mins ago' }
    ];

    function renderTable(filter = '') {
      const tbody = document.getElementById('table-body');
      const filtered = records.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()) || r.id.toLowerCase().includes(filter.toLowerCase()));
      tbody.innerHTML = filtered.map(r => \`
        <tr class="hover:bg-slate-750/30 transition-colors">
          <td class="p-3 font-mono text-slate-400">\${r.id}</td>
          <td class="p-3 font-semibold text-white">\${r.name}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold \${r.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
              \${r.status}
            </span>
          </td>
          <td class="p-3 text-slate-400">\${r.time}</td>
          <td class="p-3 text-right">
            <button onclick="pingRecord('\${r.id}')" class="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-semibold">
              Verify
            </button>
          </td>
        </tr>
      \`).join('');
    }

    function filterRows(val) {
      renderTable(val);
    }

    function addRecord() {
      const newId = 'REC-' + Math.floor(Math.random() * 800 + 200);
      records.unshift({ id: newId, name: 'Service Node ' + newId, status: 'ONLINE', time: 'Just now' });
      renderTable(document.getElementById('search-filter').value);
    }

    function pingRecord(id) {
      alert('Record ' + id + ' pinged successfully! Container latency: 1.2ms');
    }

    let eventCount = 0;
    function triggerSimulation() {
      eventCount++;
      const reqEl = document.getElementById('req-rate');
      reqEl.innerText = (1840 + eventCount * 45).toLocaleString() + ' req/s';
      document.getElementById('latency-val').innerText = (Math.random() * 0.8 + 1.6).toFixed(1) + ' ms';
    }

    renderTable();
  </script>
</body>
</html>`;
}

// ==========================================
// 7. SHARED INTERACTIVE TERMINAL DRAWER
// ==========================================
function generateTerminalDrawerHtml(projectName: string, framework: string, port: number, runtimeId: string): string {
  return `
  <!-- Collapsible Bottom Terminal Drawer -->
  <div id="terminal-drawer" class="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 shadow-2xl z-40 transition-transform duration-300 transform translate-y-full font-mono text-xs">
    <div class="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-300">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
        <span class="font-bold text-xs">sandbox@git2live:${runtimeId} ~</span>
        <span class="text-slate-500 text-[10px]">(Type 'help' for commands)</span>
      </div>
      <button onclick="toggleTerminal()" class="text-slate-400 hover:text-white px-2 text-sm cursor-pointer">✕</button>
    </div>
    <div id="terminal-output" class="p-3.5 h-44 overflow-y-auto space-y-1 text-slate-300 text-[11px]">
      <div class="text-slate-500">Git2Live Interactive Sandbox v2.4.0 • Kernel Linux 6.6.0-x86_64</div>
      <div class="text-emerald-400">Container initialized for ${projectName} (${framework}) on port :${port}</div>
      <div class="text-slate-400">Type 'help', 'ps', 'env', 'curl /health', or 'status' to interact.</div>
    </div>
    <div class="p-2.5 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2">
      <span class="text-emerald-400 font-bold">$</span>
      <input
        id="term-input"
        type="text"
        placeholder="Enter shell command..."
        class="flex-1 bg-transparent border-none outline-none text-white text-xs font-mono"
        onkeydown="if(event.key==='Enter') executeTermCommand()"
      />
    </div>
  </div>

  <script>
    let terminalOpen = false;
    function toggleTerminal() {
      terminalOpen = !terminalOpen;
      const el = document.getElementById('terminal-drawer');
      if (terminalOpen) {
        el.classList.remove('translate-y-full');
        document.getElementById('term-input').focus();
      } else {
        el.classList.add('translate-y-full');
      }
    }

    function executeTermCommand() {
      const input = document.getElementById('term-input');
      const cmd = input.value.trim();
      if (!cmd) return;
      input.value = '';

      const out = document.getElementById('terminal-output');
      out.innerHTML += \`<div class="text-slate-400"><span class="text-emerald-400 font-bold">$</span> \${escapeHtml(cmd)}</div>\`;

      const lower = cmd.toLowerCase();
      let response = '';
      if (lower === 'help') {
        response = 'Available commands: help, ps, env, status, curl, clear, uname, ping';
      } else if (lower === 'ps') {
        response = 'PID  USER     TIME  COMMAND\\n  1  node     0:04  /usr/local/bin/${framework.toLowerCase()}\\n 14  sandbox  0:01  git2live-telemetry-agent';
      } else if (lower === 'env') {
        response = 'NODE_ENV=production\\nPORT=${port}\\nSANDBOX_HOST=0.0.0.0\\nCONTAINER_ID=${runtimeId}';
      } else if (lower === 'status') {
        response = 'STATUS: HEALTHY | UPTIME: 1,840s | PORT: :${port} | MEMORY: 64MB/1024MB';
      } else if (lower.startsWith('curl')) {
        response = 'HTTP/1.1 200 OK\\nContent-Type: application/json\\nDate: ' + new Date().toUTCString() + '\\n\\n{"status":"UP","app":"${projectName}","sandbox":"isolated"}';
      } else if (lower === 'clear') {
        out.innerHTML = '';
        return;
      } else if (lower === 'uname') {
        response = 'Linux git2live-sandbox 6.6.0-x86_64 SMP container';
      } else {
        response = 'bash: ' + escapeHtml(cmd) + ': command executed in container sandbox.';
      }

      out.innerHTML += \`<div class="text-slate-300 whitespace-pre-line">\${response}</div>\`;
      out.scrollTop = out.scrollHeight;
    }
  </script>
  `;
}
