import { escapeHtml, generateTopBarHtml } from './shared.js';

export function generateGamePreview(
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
  <title>${escapeHtml(projectName)} — Playable 2048 Game</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased select-none">
  ${generateTopBarHtml(projectName, port, runtimeId, 'game', repoUrl)}

  <main class="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center space-y-4">
    <!-- Game Header -->
    <div class="w-full flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-2">
          <span>2048</span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">لعبة مباشرة</span>
        </h1>
        <p class="text-xs text-slate-400">انضم للأرقام لتصل إلى الرقم 2048!</p>
      </div>

      <div class="flex items-center gap-2">
        <div class="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[65px]">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">النقاط</span>
          <span id="score-val" class="font-mono text-base font-bold text-white">0</span>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[65px]">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">الأفضل</span>
          <span id="best-score" class="font-mono text-base font-bold text-amber-400">1280</span>
        </div>
      </div>
    </div>

    <!-- Controls Row -->
    <div class="w-full flex items-center justify-between text-xs">
      <span class="text-slate-400">استخدم الأسهم ⬅️ ⬆️ ⬇️ ➡️</span>
      <button
        onclick="initGame()"
        class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow cursor-pointer active:scale-95 transition"
      >
        لعبة جديدة
      </button>
    </div>

    <!-- 4x4 Game Grid -->
    <div id="grid-container" class="w-full aspect-square bg-slate-900 border border-slate-800 rounded-3xl p-3 grid grid-cols-4 gap-3 shadow-2xl relative">
      <!-- 16 cells dynamically populated -->
    </div>

    <!-- Touch / Virtual Directional Keypad -->
    <div class="flex flex-col items-center gap-1.5 pt-2">
      <button onclick="move('up')" class="w-12 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg active:scale-90 flex items-center justify-center">⬆️</button>
      <div class="flex gap-4">
        <button onclick="move('left')" class="w-12 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg active:scale-90 flex items-center justify-center">⬅️</button>
        <button onclick="move('down')" class="w-12 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg active:scale-90 flex items-center justify-center">⬇️</button>
        <button onclick="move('right')" class="w-12 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg active:scale-90 flex items-center justify-center">➡️</button>
      </div>
    </div>
  </main>

  <script>
    let board = [];
    let score = 0;
    let best = 1280;

    const colors = {
      2: 'bg-slate-800 text-white',
      4: 'bg-slate-700 text-white',
      8: 'bg-amber-600 text-white',
      16: 'bg-orange-600 text-white',
      32: 'bg-rose-600 text-white',
      64: 'bg-red-600 text-white',
      128: 'bg-yellow-500 text-slate-900 font-extrabold',
      256: 'bg-yellow-400 text-slate-900 font-extrabold',
      512: 'bg-emerald-500 text-white font-extrabold',
      1024: 'bg-teal-500 text-white font-extrabold',
      2048: 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/50'
    };

    function initGame() {
      board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      score = 0;
      updateScores();
      addRandomTile();
      addRandomTile();
      renderBoard();
    }

    function addRandomTile() {
      const empty = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (board[r][c] === 0) empty.push({ r, c });
        }
      }
      if (empty.length > 0) {
        const rand = empty[Math.floor(Math.random() * empty.length)];
        board[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
      }
    }

    function renderBoard() {
      const container = document.getElementById('grid-container');
      container.innerHTML = '';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const val = board[r][c];
          const tile = document.createElement('div');
          tile.className = \`rounded-2xl flex items-center justify-center font-bold text-xl transition-all duration-150 \${
            val === 0 ? 'bg-slate-950/60 border border-slate-850' : (colors[val] || 'bg-indigo-600 text-white')
          }\`;
          tile.innerText = val === 0 ? '' : val;
          container.appendChild(tile);
        }
      }
    }

    function updateScores() {
      document.getElementById('score-val').innerText = score;
      if (score > best) {
        best = score;
        document.getElementById('best-score').innerText = best;
      }
    }

    function slide(row) {
      let arr = row.filter(val => val);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          score += arr[i];
          arr[i + 1] = 0;
        }
      }
      arr = arr.filter(val => val);
      while (arr.length < 4) {
        arr.push(0);
      }
      return arr;
    }

    function move(direction) {
      let changed = false;
      const prev = JSON.stringify(board);

      if (direction === 'left') {
        for (let r = 0; r < 4; r++) {
          board[r] = slide(board[r]);
        }
      } else if (direction === 'right') {
        for (let r = 0; r < 4; r++) {
          board[r] = slide(board[r].reverse()).reverse();
        }
      } else if (direction === 'up') {
        for (let c = 0; c < 4; c++) {
          let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
          col = slide(col);
          for (let r = 0; r < 4; r++) board[r][c] = col[r];
        }
      } else if (direction === 'down') {
        for (let c = 0; c < 4; c++) {
          let col = [board[3][c], board[2][c], board[1][c], board[0][c]];
          col = slide(col);
          for (let r = 0; r < 4; r++) board[3 - r][c] = col[r];
        }
      }

      if (JSON.stringify(board) !== prev) {
        addRandomTile();
        updateScores();
        renderBoard();
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') move('left');
      else if (e.key === 'ArrowRight' || e.key === 'd') move('right');
      else if (e.key === 'ArrowUp' || e.key === 'w') move('up');
      else if (e.key === 'ArrowDown' || e.key === 's') move('down');
    });

    initGame();
  </script>
</body>
</html>`;
}
