export function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateTopBarHtml(
  projectName: string,
  port: number,
  runtimeId: string,
  activeAppType: string,
  repoUrl?: string
): string {
  const appTypes = [
    { id: 'ecommerce', label: '🛒 Store (متجر)', desc: 'E-Commerce App' },
    { id: 'calculator', label: '🔢 Calculator (حاسبة)', desc: 'Interactive Calculator' },
    { id: 'weather', label: '🌦️ Weather (الطقس)', desc: 'Live Weather Forecast' },
    { id: 'notes', label: '📝 Notes (ملاحظات)', desc: 'Markdown Notes Studio' },
    { id: 'kanban', label: '📋 Kanban (مهام)', desc: 'Task & Kanban Board' },
    { id: 'game', label: '🎮 2048 (لعبة)', desc: 'Playable 2048 Game' },
    { id: 'agent', label: '🤖 AI Agent (مساعد)', desc: 'Conversational Agent' },
    { id: 'saas', label: '📊 Business (لوحة)', desc: 'SaaS App & Directory' },
    { id: 'api', label: '⚡ API (برمجة)', desc: 'REST API Client' }
  ];

  return `
  <!-- Global App Mode Header -->
  <header class="bg-slate-900 border-b border-slate-800 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 shadow-md">
    <div class="flex items-center gap-2.5">
      <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Container Live"></div>
      <span class="font-bold text-white tracking-wide truncate max-w-[160px] sm:max-w-xs">${escapeHtml(projectName)}</span>
      <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">:${port} LIVE</span>
    </div>

    <!-- App Switcher Selector -->
    <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
      <span class="text-[11px] text-slate-400 pl-1.5 font-medium hidden sm:inline">📱 App Mode:</span>
      <select
        id="app-mode-select"
        onchange="switchAppMode(this.value)"
        class="bg-slate-900 text-blue-400 text-xs font-semibold rounded px-2 py-1 border border-slate-700 outline-none cursor-pointer hover:border-blue-500 transition"
      >
        ${appTypes
          .map(
            (t) =>
              `<option value="${t.id}" ${t.id === activeAppType ? 'selected' : ''}>${t.label}</option>`
          )
          .join('')}
      </select>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick="toggleAppInfo()"
        title="معلومات التطبيق"
        class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer flex items-center gap-1"
      >
        <span>💡 جرب التطبيق</span>
      </button>
      ${
        repoUrl
          ? `<a href="${repoUrl}" target="_blank" class="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-[11px] font-medium hidden md:inline">GitHub ↗</a>`
          : ''
      }
    </div>
  </header>

  <!-- Arabic/English Welcome Banner (Collapsible) -->
  <div id="app-info-banner" class="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-b border-blue-800/40 px-4 py-2 text-xs text-blue-200 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-base">✨</span>
      <span>
        <strong>تطبيق تفاعلي مباشر:</strong> يمكنك الآن استخدام وتجربة التطبيق بالكامل والتفاعل مع أزراره وبياناته، أو استخدام القائمة أعلاه لتغيير نوع التطبيق فوراً.
      </span>
    </div>
    <button onclick="toggleAppInfo()" class="text-blue-400 hover:text-white text-sm px-2 cursor-pointer">✕</button>
  </div>

  <script>
    function switchAppMode(mode) {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', mode);
      window.location.href = url.toString();
    }
    function toggleAppInfo() {
      const el = document.getElementById('app-info-banner');
      if (el) el.classList.toggle('hidden');
    }
  </script>
  `;
}
