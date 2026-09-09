import { escapeHtml, generateTopBarHtml } from './shared.js';

export function generateCalculatorPreview(
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
  <title>${escapeHtml(projectName)} — Interactive Calculator</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased select-none">
  ${generateTopBarHtml(projectName, port, runtimeId, 'calculator', repoUrl)}

  <main class="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      <!-- Calculator Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-rose-500"></div>
          <div class="w-3 h-3 rounded-full bg-amber-500"></div>
          <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[11px] ml-2 text-slate-300 font-semibold">${escapeHtml(projectName)}</span>
        </div>
        <button onclick="clearHistory()" class="hover:text-rose-400 transition" title="Clear History">Clear Log</button>
      </div>

      <!-- Display Screen -->
      <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 text-right space-y-1">
        <div id="calc-history" class="text-xs font-mono text-slate-500 h-5 overflow-hidden">0</div>
        <div id="calc-display" class="text-4xl font-mono font-bold text-white tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none py-1">0</div>
      </div>

      <!-- Keypad Grid -->
      <div class="grid grid-cols-4 gap-2.5">
        <!-- Row 1 -->
        <button onclick="clearAll()" class="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-base transition active:scale-95">AC</button>
        <button onclick="deleteDigit()" class="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base transition active:scale-95">⌫</button>
        <button onclick="handleOp('%')" class="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-base transition active:scale-95">%</button>
        <button onclick="handleOp('/')" class="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition active:scale-95">÷</button>

        <!-- Row 2 -->
        <button onclick="inputDigit('7')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">7</button>
        <button onclick="inputDigit('8')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">8</button>
        <button onclick="inputDigit('9')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">9</button>
        <button onclick="handleOp('*')" class="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition active:scale-95">×</button>

        <!-- Row 3 -->
        <button onclick="inputDigit('4')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">4</button>
        <button onclick="inputDigit('5')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">5</button>
        <button onclick="inputDigit('6')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">6</button>
        <button onclick="handleOp('-')" class="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition active:scale-95">−</button>

        <!-- Row 4 -->
        <button onclick="inputDigit('1')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">1</button>
        <button onclick="inputDigit('2')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">2</button>
        <button onclick="inputDigit('3')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">3</button>
        <button onclick="handleOp('+')" class="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition active:scale-95">+</button>

        <!-- Row 5 -->
        <button onclick="handleSquareRoot()" class="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-base transition active:scale-95">√</button>
        <button onclick="inputDigit('0')" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-semibold text-lg transition active:scale-95">0</button>
        <button onclick="inputDot()" class="p-3.5 rounded-xl bg-slate-850 bg-slate-800/60 hover:bg-slate-750 text-white font-bold text-lg transition active:scale-95">.</button>
        <button onclick="calculate()" class="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl transition active:scale-95 shadow-lg shadow-emerald-600/20">=</button>
      </div>

      <!-- Recent Calculations Log -->
      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/60">
        <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 flex justify-between">
          <span>سجل العمليات الحسابية (History Tape)</span>
          <span id="log-count" class="text-slate-400">0 logs</span>
        </div>
        <div id="history-log" class="text-xs font-mono space-y-1 max-h-24 overflow-y-auto text-slate-400">
          <div class="text-slate-600 text-center py-1">جاهز للعمليات الحسابية...</div>
        </div>
      </div>
    </div>
  </main>

  <script>
    let currentInput = '0';
    let previousInput = '';
    let operation = null;
    let shouldResetDisplay = false;
    let historyRecords = [];

    const display = document.getElementById('calc-display');
    const history = document.getElementById('calc-history');
    const historyLog = document.getElementById('history-log');
    const logCount = document.getElementById('log-count');

    function updateDisplay() {
      display.innerText = currentInput;
      if (operation && previousInput) {
        const opSymbol = operation === '*' ? '×' : operation === '/' ? '÷' : operation;
        history.innerText = \`\${previousInput} \${opSymbol}\`;
      } else {
        history.innerText = '';
      }
    }

    function inputDigit(digit) {
      if (currentInput === '0' || shouldResetDisplay) {
        currentInput = digit;
        shouldResetDisplay = false;
      } else {
        currentInput += digit;
      }
      updateDisplay();
    }

    function inputDot() {
      if (shouldResetDisplay) {
        currentInput = '0.';
        shouldResetDisplay = false;
      } else if (!currentInput.includes('.')) {
        currentInput += '.';
      }
      updateDisplay();
    }

    function clearAll() {
      currentInput = '0';
      previousInput = '';
      operation = null;
      shouldResetDisplay = false;
      updateDisplay();
    }

    function deleteDigit() {
      if (shouldResetDisplay) return;
      if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
      } else {
        currentInput = '0';
      }
      updateDisplay();
    }

    function handleOp(op) {
      if (operation && !shouldResetDisplay) {
        calculate();
      }
      previousInput = currentInput;
      operation = op;
      shouldResetDisplay = true;
      updateDisplay();
    }

    function handleSquareRoot() {
      const val = parseFloat(currentInput);
      if (val < 0) {
        currentInput = 'Error';
      } else {
        const res = Math.sqrt(val);
        addHistoryRecord(\`√(\${val}) = \${res}\`);
        currentInput = res.toString();
      }
      shouldResetDisplay = true;
      updateDisplay();
    }

    function calculate() {
      if (!operation || !previousInput) return;
      const prev = parseFloat(previousInput);
      const curr = parseFloat(currentInput);
      let result = 0;

      switch (operation) {
        case '+': result = prev + curr; break;
        case '-': result = prev - curr; break;
        case '*': result = prev * curr; break;
        case '/':
          if (curr === 0) {
            currentInput = 'Error: div by 0';
            updateDisplay();
            shouldResetDisplay = true;
            return;
          }
          result = prev / curr;
          break;
        case '%': result = (prev * curr) / 100; break;
        default: return;
      }

      const opSymbol = operation === '*' ? '×' : operation === '/' ? '÷' : operation;
      addHistoryRecord(\`\${prev} \${opSymbol} \${curr} = \${result}\`);

      currentInput = result.toString();
      operation = null;
      previousInput = '';
      shouldResetDisplay = true;
      updateDisplay();
    }

    function addHistoryRecord(equation) {
      historyRecords.unshift(equation);
      if (historyRecords.length > 20) historyRecords.pop();
      logCount.innerText = \`\${historyRecords.length} logs\`;
      historyLog.innerHTML = historyRecords.map(item => \`
        <div class="flex items-center justify-between hover:text-white py-0.5 border-b border-slate-900">
          <span>\${item}</span>
        </div>
      \`).join('');
    }

    function clearHistory() {
      historyRecords = [];
      logCount.innerText = '0 logs';
      historyLog.innerHTML = '<div class="text-slate-600 text-center py-1">سجل العمليات مفرغ</div>';
    }

    // Keyboard controls support
    window.addEventListener('keydown', (e) => {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
      else if (e.key === '.') inputDot();
      else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') handleOp(e.key);
      else if (e.key === 'Enter' || e.key === '=') calculate();
      else if (e.key === 'Backspace') deleteDigit();
      else if (e.key === 'Escape') clearAll();
    });
  </script>
</body>
</html>`;
}
