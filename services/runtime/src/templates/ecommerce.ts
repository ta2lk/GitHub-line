import { escapeHtml, generateTopBarHtml } from './shared.js';

export function generateEcommercePreview(
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
  <title>${escapeHtml(projectName)} — E-Commerce Storefront</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
  ${generateTopBarHtml(projectName, port, runtimeId, 'ecommerce', repoUrl)}

  <!-- Store Navbar -->
  <nav class="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-12 z-40 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20">
        🛍️
      </div>
      <div>
        <h1 class="font-bold text-sm sm:text-base text-white tracking-tight">${escapeHtml(projectName)} Store</h1>
        <p class="text-[11px] text-slate-400">متجر إلكتروني مباشر وتفاعلي بالكامل</p>
      </div>
    </div>

    <!-- Search & Cart -->
    <div class="flex items-center gap-3">
      <div class="relative hidden sm:block">
        <input
          id="product-search"
          type="text"
          placeholder="بحث عن منتج..."
          oninput="handleSearch(this.value)"
          class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 w-44"
        />
      </div>

      <button
        onclick="toggleCart(true)"
        class="relative px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95 transition"
      >
        <span>🛒 سلة المشتريات</span>
        <span id="cart-badge" class="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">0</span>
      </button>
    </div>
  </nav>

  <!-- Categories Filter -->
  <div class="max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6 flex flex-wrap items-center gap-2">
    <button onclick="setCategory('all')" id="cat-all" class="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer transition">الكل (All)</button>
    <button onclick="setCategory('electronics')" id="cat-electronics" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition">إلكترونيات</button>
    <button onclick="setCategory('audio')" id="cat-audio" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition">صوتيات وسماعات</button>
    <button onclick="setCategory('wearables')" id="cat-wearables" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition">ساعات وأجهزة ذكية</button>
    <button onclick="setCategory('accessories')" id="cat-accessories" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition">ملحقات تقنية</button>
  </div>

  <!-- Products Grid -->
  <main class="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
    <div id="products-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      <!-- Injected by JavaScript -->
    </div>
  </main>

  <!-- Slide-Over Shopping Cart Drawer -->
  <div id="cart-drawer" class="fixed inset-0 z-50 overflow-hidden hidden">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-xs" onclick="toggleCart(false)"></div>
    <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
      <div class="w-screen max-w-md bg-slate-900 border-l border-slate-800 flex flex-col p-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">🛍️</span>
            <h2 class="text-base font-bold text-white">سلة التسوق (Cart)</h2>
          </div>
          <button onclick="toggleCart(false)" class="text-slate-400 hover:text-white p-1 rounded-lg text-lg cursor-pointer">✕</button>
        </div>

        <!-- Cart Items List -->
        <div id="cart-items" class="flex-1 overflow-y-auto divide-y divide-slate-800/80 py-4 space-y-3">
          <!-- Injected dynamically -->
        </div>

        <!-- Summary & Checkout -->
        <div class="border-t border-slate-800 pt-4 space-y-3">
          <div class="flex justify-between text-xs text-slate-400">
            <span>المجموع الفرعي (Subtotal):</span>
            <span id="subtotal-val" class="font-mono text-slate-200 font-bold">$0.00</span>
          </div>
          <div class="flex justify-between text-xs text-slate-400">
            <span>ضريبة القيمة المضافة (Tax 5%):</span>
            <span id="tax-val" class="font-mono text-slate-200">$0.00</span>
          </div>
          <div class="flex justify-between text-sm text-white font-bold border-t border-slate-800/80 pt-2">
            <span>المجموع الكلي (Total):</span>
            <span id="total-val" class="font-mono text-emerald-400 text-base font-extrabold">$0.00</span>
          </div>

          <button
            onclick="openCheckoutModal()"
            id="checkout-btn"
            disabled
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>إتمام الطلب والشراء (Checkout)</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Order Success Modal -->
  <div id="checkout-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
      <div class="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto">
        🎉
      </div>
      <h3 class="text-lg font-bold text-white">تم تأكيد الطلب بنجاح!</h3>
      <p class="text-xs text-slate-400">
        شكراً لك! تم استلام طلبك التجريبي داخل بيئة Git2Live ورقم الشحنة:
        <span class="font-mono text-emerald-400 font-bold block mt-1">ORD-2026-LIVE</span>
      </p>
      <button
        onclick="closeCheckoutModal()"
        class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
      >
        العودة للمتجر
      </button>
    </div>
  </div>

  <script>
    const products = [
      { id: 1, name: 'سماعات رأس لاسلكية عازلة للضوضاء Pro', price: 189, category: 'audio', rating: 4.9, icon: '🎧', tag: 'الأكثر مبيعاً' },
      { id: 2, name: 'ساعة ذكية رياضية Ultra Amoled', price: 249, category: 'wearables', rating: 4.8, icon: '⌚', tag: 'جديد' },
      { id: 3, name: 'لوحة مفاتيح ميكانيكية RGB مدمجة', price: 89, category: 'accessories', rating: 4.7, icon: '⌨️', tag: 'خصم 15%' },
      { id: 4, name: 'شاحن GaN فائق السرعة بقدرة 100W', price: 45, category: 'accessories', rating: 4.9, icon: '🔌', tag: 'تقنية GaN' },
      { id: 5, name: 'مكبر صوت استوديو لاسلكي Hi-Fi', price: 129, category: 'audio', rating: 4.6, icon: '🔊', tag: 'صوت محيطي' },
      { id: 6, name: 'فأرة ألعاب لاسلكية خفيفة الوزن 8K', price: 69, category: 'accessories', rating: 4.8, icon: '🖱️', tag: 'Ultra-Light' },
      { id: 7, name: 'كاميرا ويب 4K بدقة احترافية للعمل', price: 119, category: 'electronics', rating: 4.7, icon: '📷', tag: 'HDR Studio' },
      { id: 8, name: 'منصة شحن لاسلكي مغناطيسية 3-في-1', price: 55, category: 'wearables', rating: 4.9, icon: '⚡', tag: 'MagSafe' }
    ];

    let cart = [];
    let currentCategory = 'all';
    let searchQuery = '';

    function renderProducts() {
      const grid = document.getElementById('products-grid');
      const filtered = products.filter(p => {
        const matchesCat = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500 text-sm">لا توجد منتجات مطابقة لعملية البحث.</div>';
        return;
      }

      grid.innerHTML = filtered.map(p => \`
        <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg transition duration-200 group">
          <div>
            <div class="h-36 bg-slate-950 rounded-xl flex items-center justify-center text-5xl relative overflow-hidden border border-slate-850">
              <span class="group-hover:scale-110 transition duration-300">\${p.icon}</span>
              \${p.tag ? \`<span class="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">\${p.tag}</span>\` : ''}
            </div>
            <div class="mt-3.5 space-y-1">
              <div class="flex items-center gap-1 text-amber-400 text-xs">
                <span>★</span>
                <span class="font-bold text-slate-300">\${p.rating}</span>
              </div>
              <h3 class="font-bold text-xs sm:text-sm text-white line-clamp-2">\${p.name}</h3>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span class="font-mono text-base font-extrabold text-emerald-400">$\${p.price}</span>
            <button
              onclick="addToCart(\${p.id})"
              class="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>+ إضافة</span>
            </button>
          </div>
        </div>
      \`).join('');
    }

    function setCategory(cat) {
      currentCategory = cat;
      ['all', 'electronics', 'audio', 'wearables', 'accessories'].forEach(c => {
        const btn = document.getElementById('cat-' + c);
        if (btn) {
          if (c === cat) {
            btn.className = 'px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer transition';
          } else {
            btn.className = 'px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition';
          }
        }
      });
      renderProducts();
    }

    function handleSearch(val) {
      searchQuery = val;
      renderProducts();
    }

    function addToCart(productId) {
      const prod = products.find(p => p.id === productId);
      if (!prod) return;
      const existing = cart.find(item => item.id === productId);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...prod, qty: 1 });
      }
      updateCartUI();
    }

    function updateQty(productId, delta) {
      const item = cart.find(i => i.id === productId);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== productId);
      }
      updateCartUI();
    }

    function updateCartUI() {
      const badge = document.getElementById('cart-badge');
      const list = document.getElementById('cart-items');
      const subtotalEl = document.getElementById('subtotal-val');
      const taxEl = document.getElementById('tax-val');
      const totalEl = document.getElementById('total-val');
      const checkoutBtn = document.getElementById('checkout-btn');

      const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
      badge.innerText = totalItems;

      if (cart.length === 0) {
        list.innerHTML = '<div class="text-center py-12 text-slate-500 text-xs">سلة التسوق فارغة حالياً. اضغط "إضافة" على أي منتج.</div>';
        subtotalEl.innerText = '$0.00';
        taxEl.innerText = '$0.00';
        totalEl.innerText = '$0.00';
        checkoutBtn.disabled = true;
        return;
      }

      checkoutBtn.disabled = false;
      const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      subtotalEl.innerText = \`$\${subtotal.toFixed(2)}\`;
      taxEl.innerText = \`$\${tax.toFixed(2)}\`;
      totalEl.innerText = \`$\${total.toFixed(2)}\`;

      list.innerHTML = cart.map(item => \`
        <div class="py-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">\${item.icon}</span>
            <div>
              <h4 class="text-xs font-bold text-white line-clamp-1">\${item.name}</h4>
              <span class="text-[11px] font-mono text-emerald-400 font-semibold">$\${item.price}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="updateQty(\${item.id}, -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center cursor-pointer">-</button>
            <span class="font-mono text-xs text-white px-1">\${item.qty}</span>
            <button onclick="updateQty(\${item.id}, 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center cursor-pointer">+</button>
          </div>
        </div>
      \`).join('');
    }

    function toggleCart(open) {
      const drawer = document.getElementById('cart-drawer');
      if (open) drawer.classList.remove('hidden');
      else drawer.classList.add('hidden');
    }

    function openCheckoutModal() {
      toggleCart(false);
      document.getElementById('checkout-modal').classList.remove('hidden');
    }

    function closeCheckoutModal() {
      cart = [];
      updateCartUI();
      document.getElementById('checkout-modal').classList.add('hidden');
    }

    renderProducts();
    updateCartUI();
  </script>
</body>
</html>`;
}
