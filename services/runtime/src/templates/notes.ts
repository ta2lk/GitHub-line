import { escapeHtml, generateTopBarHtml } from './shared.js';

export function generateNotesPreview(
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
  <title>${escapeHtml(projectName)} — Markdown Notes Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
  ${generateTopBarHtml(projectName, port, runtimeId, 'notes', repoUrl)}

  <div class="flex-1 flex flex-col md:flex-row max-w-6xl w-full mx-auto p-4 gap-4 overflow-hidden">
    <!-- Notes Sidebar -->
    <aside class="w-full md:w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-lg">📝</span>
          <h2 class="font-bold text-sm text-white">الملاحظات (Notes)</h2>
        </div>
        <button
          onclick="createNewNote()"
          class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs active:scale-95"
        >
          + جديدة
        </button>
      </div>

      <div class="mt-3">
        <input
          id="notes-search"
          type="text"
          placeholder="بحث في الملاحظات..."
          oninput="filterNotes(this.value)"
          class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
        />
      </div>

      <!-- Notes List -->
      <div id="notes-list" class="flex-1 overflow-y-auto space-y-1.5 mt-3 pr-1">
        <!-- Injected dynamically -->
      </div>
    </aside>

    <!-- Note Editor & Markdown Live Preview -->
    <main class="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      <!-- Editor Toolbar -->
      <div class="p-3 bg-slate-850 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <input
          id="note-title"
          type="text"
          class="bg-transparent border-none outline-none text-base font-bold text-white placeholder-slate-500 flex-1 min-w-[200px]"
          placeholder="عنوان الملاحظة..."
          oninput="updateActiveTitle(this.value)"
        />

        <div class="flex items-center gap-1">
          <button onclick="insertFormat('**', '**')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold" title="عريض Bold">B</button>
          <button onclick="insertFormat('*', '*')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 italic font-serif" title="مائل Italic">I</button>
          <button onclick="insertFormat('# ', '')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300" title="عنوان H1">H1</button>
          <button onclick="insertFormat('- ', '')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300" title="قائمة List">• List</button>
          <button onclick="insertFormat('\`', '\`')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono" title="كود Code">&lt;&gt;</button>
          <button onclick="deleteActiveNote()" class="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold ml-2" title="حذف">حذف</button>
        </div>
      </div>

      <!-- Split View (Markdown / Preview) -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800 min-h-[420px]">
        <!-- Raw Text Editor -->
        <textarea
          id="note-body"
          class="w-full h-full bg-slate-950/60 p-4 font-mono text-xs sm:text-sm text-slate-200 outline-none resize-none placeholder-slate-600 leading-relaxed"
          placeholder="اكتب محتوى الملاحظة بصيغة Markdown..."
          oninput="updateActiveBody(this.value)"
        ></textarea>

        <!-- Formatted Markdown Preview -->
        <div id="note-preview" class="p-4 overflow-y-auto bg-slate-900 text-slate-300 text-xs sm:text-sm space-y-2 prose prose-invert max-w-none">
          <!-- Rendered in real-time -->
        </div>
      </div>

      <!-- Footer Stats -->
      <div class="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span id="char-count">0 حرف • 0 كلمة</span>
        <span class="text-emerald-500">● تم الحفظ تلقائياً (Auto-saved)</span>
      </div>
    </main>
  </div>

  <script>
    let notes = [
      { id: 1, title: 'أفكار تطوير المشروع (Architecture)', body: '# أفكار تطوير المشروع\\n\\n- **الأداء**: استخدام Vite مع بنية cgroup معزولة.\\n- **التخزين**: الحفظ المحلي الفوري مع مزامنة سحابية.\\n- **الأمان**: عزل العمليات بنظام الأذونات الدقيقة.\\n\\n> ملاحظة: هذا تطبيق مفكرة كامل يمكنك تعديله وإضافة ملاحظاتك.', updatedAt: 'اليوم' },
      { id: 2, title: 'قائمة مهام الأسبوع (Weekly Checklist)', body: '# مهام الأسبوع\\n\\n1. تجربة بناء المستودعات على السيرفر.\\n2. اختبار فحص الأخطاء التلقائي بمساعدة الذكاء الاصطناعي.\\n3. تجهيز التقرير النهائي.', updatedAt: 'أمس' },
      { id: 3, title: 'روابط هامة ومراجع تقنية', body: '# المراجع التقنية\\n\\n- [Vite Documentation](https://vitejs.dev)\\n- [Tailwind CSS v4](https://tailwindcss.com)\\n- [TypeScript Handbook](https://www.typescriptlang.org)', updatedAt: 'منذ يومين' }
    ];
    let activeNoteId = 1;

    function renderNotesList(query = '') {
      const list = document.getElementById('notes-list');
      const filtered = notes.filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.body.toLowerCase().includes(query.toLowerCase()));
      if (filtered.length === 0) {
        list.innerHTML = '<div class="text-slate-500 text-center py-6 text-xs">لا توجد ملاحظات.</div>';
        return;
      }
      list.innerHTML = filtered.map(n => \`
        <div
          onclick="selectNote(\${n.id})"
          class="p-2.5 rounded-xl cursor-pointer transition \${n.id === activeNoteId ? 'bg-blue-600/20 text-white border border-blue-500/30' : 'hover:bg-slate-800/60 text-slate-300'}"
        >
          <h4 class="font-bold text-xs truncate">\${n.title || 'ملاحظة بلا عنوان'}</h4>
          <p class="text-[10px] text-slate-500 mt-1 truncate">\${n.body.replace(/#/g, '').replace(/\\n/g, ' ')}</p>
        </div>
      \`).join('');
    }

    function selectNote(id) {
      activeNoteId = id;
      const note = notes.find(n => n.id === id);
      if (!note) return;
      document.getElementById('note-title').value = note.title;
      document.getElementById('note-body').value = note.body;
      renderNotesList();
      renderMarkdownPreview();
    }

    function updateActiveTitle(val) {
      const note = notes.find(n => n.id === activeNoteId);
      if (note) {
        note.title = val;
        renderNotesList();
      }
    }

    function updateActiveBody(val) {
      const note = notes.find(n => n.id === activeNoteId);
      if (note) {
        note.body = val;
        renderMarkdownPreview();
      }
    }

    function createNewNote() {
      const newNote = {
        id: Date.now(),
        title: 'ملاحظة جديدة',
        body: '# عنوان الملاحظة\\n\\nابدأ بالكتابة هنا...',
        updatedAt: 'الآن'
      };
      notes.unshift(newNote);
      selectNote(newNote.id);
    }

    function deleteActiveNote() {
      if (notes.length <= 1) {
        alert('يجب الإبقاء على ملاحظة واحدة على الأقل');
        return;
      }
      notes = notes.filter(n => n.id !== activeNoteId);
      selectNote(notes[0].id);
    }

    function insertFormat(start, end) {
      const textarea = document.getElementById('note-body');
      const s = textarea.selectionStart;
      const e = textarea.selectionEnd;
      const txt = textarea.value;
      const selected = txt.substring(s, e) || 'نص';
      textarea.value = txt.substring(0, s) + start + selected + end + txt.substring(e);
      updateActiveBody(textarea.value);
      textarea.focus();
    }

    function renderMarkdownPreview() {
      const note = notes.find(n => n.id === activeNoteId);
      const preview = document.getElementById('note-preview');
      const charCount = document.getElementById('char-count');
      if (!note) return;

      const raw = note.body;
      const chars = raw.length;
      const words = raw.trim() ? raw.trim().split(/\\s+/).length : 0;
      charCount.innerText = \`\${chars} حرف • \${words} كلمة\`;

      // Simple Markdown parser
      let html = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-white border-b border-slate-800 pb-1 mt-2">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-blue-400 mt-2">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-slate-200 mt-1">$1</h3>')
        .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-3 py-1 bg-slate-850 my-2 text-slate-300 italic rounded-r">$1</blockquote>')
        .replace(/\\*\\*(.*?)\\*\\*/gim, '<strong class="text-white font-bold">$1</strong>')
        .replace(/\\*(.*?)\\*/gim, '<em class="text-slate-300 italic">$1</em>')
        .replace(new RegExp('\\x60([^\\x60]+)\\x60', 'gim'), '<code class="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-200">$1</li>')
        .replace(/\\n/gim, '<br />');

      preview.innerHTML = html;
    }

    function filterNotes(q) {
      renderNotesList(q);
    }

    selectNote(1);
  </script>
</body>
</html>`;
}
