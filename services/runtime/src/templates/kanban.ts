import { escapeHtml, generateTopBarHtml } from './shared.js';

export function generateKanbanPreview(
  projectName: string,
  port: number,
  runtimeId: string,
  repoUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName)} — Task & Kanban Board</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased select-none">
  ${generateTopBarHtml(projectName, port, runtimeId, 'kanban', repoUrl)}

  <header class="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
    <div>
      <h1 class="font-bold text-sm text-white flex items-center gap-2">
        <span>📋</span>
        <span>${escapeHtml(projectName)} — لوحة المهام (Kanban)</span>
      </h1>
      <p class="text-[11px] text-slate-400">تطبيق تفاعلي لإدارة المهام وتتبع مراحل العمل</p>
    </div>
    <button
      onclick="openNewTaskModal()"
      class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow cursor-pointer active:scale-95 transition"
    >
      + مهمة جديدة
    </button>
  </header>

  <!-- Kanban Board Columns -->
  <main class="flex-1 p-4 sm:p-6 overflow-x-auto">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[760px]">
      <!-- Column 1: Backlog / To Do -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-[600px] shadow-lg">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <h2 class="font-bold text-xs text-white uppercase">قيد الانتظار (To Do)</h2>
          </div>
          <span id="count-todo" class="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>
        </div>
        <div id="col-todo" class="flex-1 overflow-y-auto py-3 space-y-3"></div>
      </div>

      <!-- Column 2: In Progress -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-[600px] shadow-lg">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h2 class="font-bold text-xs text-white uppercase">قيد التنفيذ (In Progress)</h2>
          </div>
          <span id="count-inprogress" class="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>
        </div>
        <div id="col-inprogress" class="flex-1 overflow-y-auto py-3 space-y-3"></div>
      </div>

      <!-- Column 3: Review -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-[600px] shadow-lg">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h2 class="font-bold text-xs text-white uppercase">مراجعة واختبار (Review)</h2>
          </div>
          <span id="count-review" class="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>
        </div>
        <div id="col-review" class="flex-1 overflow-y-auto py-3 space-y-3"></div>
      </div>

      <!-- Column 4: Completed -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-[600px] shadow-lg">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 class="font-bold text-xs text-white uppercase">مكتملة (Done)</h2>
          </div>
          <span id="count-done" class="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>
        </div>
        <div id="col-done" class="flex-1 overflow-y-auto py-3 space-y-3"></div>
      </div>
    </div>
  </main>

  <!-- Modal Add Task -->
  <div id="task-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-xs">
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <h3 class="font-bold text-white text-sm">إنشاء مهمة جديدة</h3>
        <button onclick="closeNewTaskModal()" class="text-slate-400 hover:text-white cursor-pointer">✕</button>
      </div>
      <div>
        <label class="block text-slate-400 mb-1">عنوان المهمة</label>
        <input id="task-title-input" type="text" placeholder="مثلاً: تحسين أداء الواجهة..." class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white outline-none" />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-slate-400 mb-1">الأولوية</label>
          <select id="task-priority-input" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white outline-none">
            <option value="عالية">عالية (High)</option>
            <option value="متوسطة">متوسطة (Med)</option>
            <option value="منخفضة">منخفضة (Low)</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1">القسم</label>
          <select id="task-column-input" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white outline-none">
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
        <button onclick="closeNewTaskModal()" class="px-3 py-1.5 rounded-lg text-slate-400">إلغاء</button>
        <button onclick="saveNewTask()" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer">حفظ المهمة</button>
      </div>
    </div>
  </div>

  <script>
    let tasks = [
      { id: 1, title: 'ربط واجهة المستخدم مع محرك الحاويات', priority: 'عالية', column: 'done', tag: 'DevOps' },
      { id: 2, title: 'تحسين تجربة استعراض المستودعات كتطبيقات حية', priority: 'عالية', column: 'inprogress', tag: 'UI/UX' },
      { id: 3, title: 'إضافة أنماط المتجر والحاسبة والطقس للتجربة المباشرة', priority: 'عالية', column: 'inprogress', tag: 'Feature' },
      { id: 4, title: 'اختبار محاكاة أخطاء البناء الذاتي AI Repair', priority: 'متوسطة', column: 'review', tag: 'Testing' },
      { id: 5, title: 'توثيق واجهات برمجة التطبيقات وسجلات النظام', priority: 'منخفضة', column: 'todo', tag: 'Docs' }
    ];

    function renderTasks() {
      const cols = ['todo', 'inprogress', 'review', 'done'];
      cols.forEach(col => {
        const colEl = document.getElementById('col-' + col);
        const countEl = document.getElementById('count-' + col);
        const colTasks = tasks.filter(t => t.column === col);
        countEl.innerText = colTasks.length;

        colEl.innerHTML = colTasks.map(t => \`
          <div class="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 shadow space-y-2 group transition">
            <div class="flex items-center justify-between text-[10px]">
              <span class="px-2 py-0.5 rounded-md font-semibold \${
                t.priority === 'عالية' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                t.priority === 'متوسطة' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
              }">\${t.priority}</span>
              <span class="text-slate-500 font-mono">\${t.tag}</span>
            </div>

            <p class="text-xs font-semibold text-white leading-relaxed">\${t.title}</p>

            <div class="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
              <button onclick="moveTask(\${t.id}, 'prev')" class="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800" title="تحريك للخلف">◀</button>
              <button onclick="deleteTask(\${t.id})" class="text-slate-600 hover:text-rose-400 px-1" title="حذف">✕</button>
              <button onclick="moveTask(\${t.id}, 'next')" class="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800" title="تحريك للأمام">▶</button>
            </div>
          </div>
        \`).join('');
      });
    }

    function moveTask(id, dir) {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      const order = ['todo', 'inprogress', 'review', 'done'];
      const currentIndex = order.indexOf(task.column);
      if (dir === 'next' && currentIndex < order.length - 1) {
        task.column = order[currentIndex + 1];
      } else if (dir === 'prev' && currentIndex > 0) {
        task.column = order[currentIndex - 1];
      }
      renderTasks();
    }

    function deleteTask(id) {
      tasks = tasks.filter(t => t.id !== id);
      renderTasks();
    }

    function openNewTaskModal() {
      document.getElementById('task-modal').classList.remove('hidden');
    }
    function closeNewTaskModal() {
      document.getElementById('task-modal').classList.add('hidden');
    }

    function saveNewTask() {
      const title = document.getElementById('task-title-input').value.trim();
      const priority = document.getElementById('task-priority-input').value;
      const column = document.getElementById('task-column-input').value;
      if (!title) return;
      tasks.push({ id: Date.now(), title, priority, column, tag: 'App' });
      closeNewTaskModal();
      document.getElementById('task-title-input').value = '';
      renderTasks();
    }

    renderTasks();
  </script>
</body>
</html>`;
}
