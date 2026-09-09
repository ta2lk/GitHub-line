import { escapeHtml, generateTopBarHtml } from './shared.js';

export function generateSaaSAppPreview(
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
  <title>${escapeHtml(projectName)} — Business Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
  ${generateTopBarHtml(projectName, port, runtimeId, 'saas', repoUrl)}

  <!-- Dashboard Navbar -->
  <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-600/20">
        ⚡
      </div>
      <div>
        <h1 class="text-base font-bold text-white">${escapeHtml(projectName)}</h1>
        <p class="text-xs text-slate-400">منصة إدارة الأعمال والعملاء التفاعلية (${framework})</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick="openAddCustomerModal()"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
      >
        <span>+ إضافة عميل جديد</span>
      </button>
      <button
        onclick="exportData()"
        class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
      >
        تصدير CSV
      </button>
    </div>
  </header>

  <main class="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
    <!-- Key Performance Indicator Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>إجمالي الإيرادات الشهرية</span>
          <span class="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">+14.2%</span>
        </div>
        <p class="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight">$48,250</p>
        <p class="text-[11px] text-slate-500">مقارنة بالشهر الماضي ($42,100)</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>العملاء النشطين</span>
          <span class="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">+8.1%</span>
        </div>
        <p id="total-customers-val" class="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight">1,248</p>
        <p class="text-[11px] text-slate-500">حسابات نشطة تتفاعل هذا الأسبوع</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>معدل التحويل (Conversion)</span>
          <span class="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">+2.4%</span>
        </div>
        <p class="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight">4.85%</p>
        <p class="text-[11px] text-slate-500">من الزوار إلى مشتركين فعليين</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>رضا العملاء (CSAT)</span>
          <span class="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">99.2%</span>
        </div>
        <p class="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-400 tracking-tight">4.9 / 5.0</p>
        <p class="text-[11px] text-slate-500">بناءً على 840 تقييم مباشر</p>
      </div>
    </div>

    <!-- Customer Directory Management Section -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <!-- Search & Filters -->
      <div class="p-4 bg-slate-850 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-bold text-white">دليل العملاء والشركاء (Customer Directory)</h2>
          <p class="text-xs text-slate-400">إدارة المشتركين، الخطط، والبيانات التفاعلية الحية</p>
        </div>

        <div class="flex items-center gap-2">
          <input
            id="cust-search"
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            oninput="renderCustomers(this.value)"
            class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Customers Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-mono border-b border-slate-800">
            <tr>
              <th class="p-3.5">العميل / المؤسسة</th>
              <th class="p-3.5">الخطة (Plan)</th>
              <th class="p-3.5">الحالة</th>
              <th class="p-3.5">قيمة الاشتراك</th>
              <th class="p-3.5">تاريخ الانضمام</th>
              <th class="p-3.5 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody id="customers-table-body" class="divide-y divide-slate-800/60 text-slate-200">
            <!-- Injected dynamically -->
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- Add Customer Modal -->
  <div id="add-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-bold text-sm text-white">إضافة عميل جديد للنظام</h3>
        <button onclick="closeAddCustomerModal()" class="text-slate-400 hover:text-white cursor-pointer">✕</button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1">اسم العميل أو الشركة</label>
          <input id="input-name" type="text" placeholder="مثلاً: شركة سحاب للتقنية" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-slate-400 mb-1">البريد الإلكتروني</label>
          <input id="input-email" type="email" placeholder="contact@example.com" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1">نوع الخطة</label>
            <select id="input-plan" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none">
              <option value="Enterprise ($499/mo)">Enterprise ($499)</option>
              <option value="Pro ($199/mo)">Pro ($199)</option>
              <option value="Starter ($49/mo)">Starter ($49)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1">الحالة</label>
            <select id="input-status" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none">
              <option value="نشط (Active)">نشط (Active)</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
        <button onclick="closeAddCustomerModal()" class="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs">إلغاء</button>
        <button onclick="saveNewCustomer()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer">حفظ العميل</button>
      </div>
    </div>
  </div>

  <script>
    let customers = [
      { id: 1, name: 'شركة أفق الحلول السحابية', email: 'billing@ofok.sa', plan: 'Enterprise ($499/mo)', status: 'نشط (Active)', value: '$499/mo', joined: '12 يناير 2026' },
      { id: 2, name: 'مختبرات الابتكار الرقمي', email: 'tech@innovate.io', plan: 'Pro ($199/mo)', status: 'نشط (Active)', value: '$199/mo', joined: '04 فبراير 2026' },
      { id: 3, name: 'متجر وتطبيق نكست لاين', email: 'support@nextline.com', plan: 'Pro ($199/mo)', status: 'نشط (Active)', value: '$199/mo', joined: '18 فبراير 2026' },
      { id: 4, name: 'منصة تعلم المهارات', email: 'admin@skills-hub.org', plan: 'Starter ($49/mo)', status: 'قيد المراجعة', value: '$49/mo', joined: '01 مارس 2026' },
      { id: 5, name: 'استوديو الألعاب التفاعلية', email: 'hi@gamecrafters.dev', plan: 'Enterprise ($499/mo)', status: 'نشط (Active)', value: '$499/mo', joined: '05 مارس 2026' }
    ];

    function renderCustomers(filter = '') {
      const tbody = document.getElementById('customers-table-body');
      const filtered = customers.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.email.toLowerCase().includes(filter.toLowerCase()));

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-500">لا توجد نتائج مطابقة لعملية البحث.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(c => \`
        <tr class="hover:bg-slate-800/40 transition">
          <td class="p-3.5">
            <div class="font-bold text-white">\${c.name}</div>
            <div class="text-[11px] text-slate-400 font-mono">\${c.email}</div>
          </td>
          <td class="p-3.5 font-semibold text-blue-400">\${c.plan}</td>
          <td class="p-3.5">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold \${c.status.includes('Active') || c.status.includes('نشط') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
              ● \${c.status}
            </span>
          </td>
          <td class="p-3.5 font-mono text-emerald-400 font-bold">\${c.value}</td>
          <td class="p-3.5 text-slate-400 text-[11px]">\${c.joined}</td>
          <td class="p-3.5 text-right">
            <button onclick="deleteCustomer(\${c.id})" class="px-2 py-1 rounded bg-slate-800 hover:bg-rose-600/30 text-rose-400 text-xs transition cursor-pointer">حذف</button>
          </td>
        </tr>
      \`).join('');

      document.getElementById('total-customers-val').innerText = (1240 + customers.length).toLocaleString();
    }

    function openAddCustomerModal() {
      document.getElementById('add-modal').classList.remove('hidden');
    }
    function closeAddCustomerModal() {
      document.getElementById('add-modal').classList.add('hidden');
    }

    function saveNewCustomer() {
      const name = document.getElementById('input-name').value.trim();
      const email = document.getElementById('input-email').value.trim();
      const plan = document.getElementById('input-plan').value;
      const status = document.getElementById('input-status').value;
      if (!name || !email) {
        alert('الرجاء إدخال الاسم والبريد الإلكتروني');
        return;
      }
      customers.unshift({
        id: Date.now(),
        name,
        email,
        plan,
        status,
        value: plan.includes('499') ? '$499/mo' : plan.includes('199') ? '$199/mo' : '$49/mo',
        joined: 'اليوم'
      });
      closeAddCustomerModal();
      document.getElementById('input-name').value = '';
      document.getElementById('input-email').value = '';
      renderCustomers();
    }

    function deleteCustomer(id) {
      customers = customers.filter(c => c.id !== id);
      renderCustomers();
    }

    function exportData() {
      alert('تم تجهيز وتصدير سجلات العملاء بصيغة CSV بنجاح!');
    }

    renderCustomers();
  </script>
</body>
</html>`;
}
