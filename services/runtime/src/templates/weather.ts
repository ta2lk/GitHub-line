import { escapeHtml, generateTopBarHtml } from './shared.js';

export function generateWeatherPreview(
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
  <title>${escapeHtml(projectName)} — Live Weather Forecast</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
  ${generateTopBarHtml(projectName, port, runtimeId, 'weather', repoUrl)}

  <main class="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
    <!-- City Search & Controls -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <input
          id="city-input"
          type="text"
          placeholder="ابحث عن مدينة (مثلاً: الرياض، دبي، لندن)..."
          class="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
          onkeydown="if(event.key==='Enter') searchCity()"
        />
        <button onclick="searchCity()" class="absolute right-2 top-2 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer">بحث</button>
      </div>

      <!-- Quick City Buttons -->
      <div class="flex flex-wrap items-center gap-1.5 text-xs">
        <button onclick="loadCity('Riyadh')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer">الرياض</button>
        <button onclick="loadCity('Dubai')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer">دبي</button>
        <button onclick="loadCity('Cairo')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer">القاهرة</button>
        <button onclick="loadCity('London')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer">London</button>
        <button onclick="loadCity('Tokyo')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer">Tokyo</button>
      </div>

      <!-- Unit Toggle -->
      <div class="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
        <button id="btn-c" onclick="setUnit('C')" class="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer">°C</button>
        <button id="btn-f" onclick="setUnit('F')" class="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs font-bold cursor-pointer">°F</button>
      </div>
    </div>

    <!-- Main Current Weather Hero Card -->
    <div class="bg-gradient-to-br from-blue-900/40 via-slate-900 to-indigo-950/40 border border-blue-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">توقعات حية</span>
            <span id="current-time" class="text-xs text-slate-400">اليوم، 02:45 م</span>
          </div>
          <h2 id="city-name" class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">الرياض (Riyadh)</h2>
          <p id="weather-desc" class="text-sm text-slate-300">سماء صافية مع رياح خفيفة معتدلة</p>
        </div>

        <div class="flex items-center gap-4">
          <span id="weather-icon" class="text-6xl sm:text-7xl animate-pulse">☀️</span>
          <div>
            <div id="temp-display" class="text-5xl sm:text-6xl font-mono font-extrabold text-white tracking-tight">28°</div>
            <div id="feels-like" class="text-xs text-slate-400">يبدو وكأنه: 30°</div>
          </div>
        </div>
      </div>

      <!-- Atmospheric Metrics Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-800/80">
        <div class="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <span class="text-[11px] text-slate-400">💧 نسبة الرطوبة</span>
          <p id="humidity-val" class="text-xl font-bold font-mono text-white mt-1">22%</p>
        </div>
        <div class="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <span class="text-[11px] text-slate-400">💨 سرعة الرياح</span>
          <p id="wind-val" class="text-xl font-bold font-mono text-white mt-1">14 km/h</p>
        </div>
        <div class="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <span class="text-[11px] text-slate-400">☀️ مؤشر UV</span>
          <p id="uv-val" class="text-xl font-bold font-mono text-amber-400 mt-1">6.2 (متوسط)</p>
        </div>
        <div class="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <span class="text-[11px] text-slate-400">🌡️ جودة الهواء</span>
          <p id="aqi-val" class="text-xl font-bold font-mono text-emerald-400 mt-1">ممتازة (38 AQI)</p>
        </div>
      </div>
    </div>

    <!-- 5-Day Forecast Grid -->
    <div>
      <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <span>📅</span>
        <span>توقعات الأيام الخمسة القادمة (5-Day Outlook)</span>
      </h3>
      <div id="forecast-cards" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <!-- Injected dynamically -->
      </div>
    </div>
  </main>

  <script>
    const citiesData = {
      Riyadh: { name: 'الرياض (Riyadh)', tempC: 28, desc: 'سماء صافية ومشمسة مع طقس ربيعي لطيف', icon: '☀️', humidity: '22%', wind: '14 km/h', uv: '6 (معتدل)', aqi: 'ممتازة (35)', forecast: [
        { day: 'غداً', icon: '☀️', max: 29, min: 18 },
        { day: 'الأربعاء', icon: '🌤️', max: 31, min: 19 },
        { day: 'الخميس', icon: '☀️', max: 32, min: 20 },
        { day: 'الجمعة', icon: '🌤️', max: 30, min: 19 },
        { day: 'السبت', icon: '☀️', max: 29, min: 18 }
      ]},
      Dubai: { name: 'دبي (Dubai)', tempC: 27, desc: 'أجواء ساحلية معتدلة ورطوبة خفيفة', icon: '🌤️', humidity: '55%', wind: '18 km/h', uv: '7 (مرتفع)', aqi: 'جيدة (48)', forecast: [
        { day: 'غداً', icon: '☀️', max: 28, min: 21 },
        { day: 'الأربعاء', icon: '🌤️', max: 29, min: 22 },
        { day: 'الخميس', icon: '☀️', max: 30, min: 22 },
        { day: 'الجمعة', icon: '🌤️', max: 28, min: 21 },
        { day: 'السبت', icon: '☀️', max: 29, min: 21 }
      ]},
      Cairo: { name: 'القاهرة (Cairo)', tempC: 23, desc: 'أجواء ربيعية لطيفة وشمس دافئة', icon: '☀️', humidity: '42%', wind: '12 km/h', uv: '5 (معتدل)', aqi: 'جيدة (55)', forecast: [
        { day: 'غداً', icon: '🌤️', max: 24, min: 14 },
        { day: 'الأربعاء', icon: '☀️', max: 25, min: 15 },
        { day: 'الخميس', icon: '☀️', max: 26, min: 16 },
        { day: 'الجمعة', icon: '🌤️', max: 24, min: 14 },
        { day: 'السبت', icon: '☀️', max: 23, min: 13 }
      ]},
      London: { name: 'London (UK)', tempC: 12, desc: 'غائم جزئياً مع فرصة لزخات مطر خفيفة', icon: '🌧️', humidity: '78%', wind: '22 km/h', uv: '2 (منخفض)', aqi: 'ممتازة (24)', forecast: [
        { day: 'غداً', icon: '🌧️', max: 13, min: 7 },
        { day: 'الأربعاء', icon: '⛅', max: 14, min: 8 },
        { day: 'الخميس', icon: '🌧️', max: 12, min: 6 },
        { day: 'الجمعة', icon: '☀️', max: 15, min: 8 },
        { day: 'السبت', icon: '⛅', max: 14, min: 7 }
      ]},
      Tokyo: { name: 'Tokyo (Japan)', tempC: 17, desc: 'أجواء ربيعية مشمسة وصافية', icon: '🌸', humidity: '48%', wind: '10 km/h', uv: '4 (معتدل)', aqi: 'ممتازة (18)', forecast: [
        { day: 'غداً', icon: '☀️', max: 18, min: 9 },
        { day: 'الأربعاء', icon: '🌤️', max: 19, min: 11 },
        { day: 'الخميس', icon: '🌧️', max: 16, min: 10 },
        { day: 'الجمعة', icon: '☀️', max: 20, min: 12 },
        { day: 'السبت', icon: '☀️', max: 21, min: 13 }
      ]}
    };

    let currentCity = 'Riyadh';
    let unit = 'C';

    function formatTemp(tempC) {
      if (unit === 'F') {
        const tempF = Math.round((tempC * 9/5) + 32);
        return tempF + '°F';
      }
      return tempC + '°C';
    }

    function setUnit(u) {
      unit = u;
      document.getElementById('btn-c').className = u === 'C' ? 'px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer' : 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs font-bold cursor-pointer';
      document.getElementById('btn-f').className = u === 'F' ? 'px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer' : 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs font-bold cursor-pointer';
      renderWeatherData();
    }

    function loadCity(city) {
      if (citiesData[city]) {
        currentCity = city;
        renderWeatherData();
      }
    }

    function searchCity() {
      const val = document.getElementById('city-input').value.trim();
      if (!val) return;
      const match = Object.keys(citiesData).find(k => k.toLowerCase() === val.toLowerCase() || citiesData[k].name.toLowerCase().includes(val.toLowerCase()));
      if (match) {
        loadCity(match);
      } else {
        citiesData[val] = {
          name: val,
          tempC: 22,
          desc: 'أجواء معتدلة ومستقرة',
          icon: '🌤️',
          humidity: '40%',
          wind: '15 km/h',
          uv: '5',
          aqi: 'جيدة (40)',
          forecast: [
            { day: 'غداً', icon: '☀️', max: 24, min: 15 },
            { day: 'بعد غد', icon: '🌤️', max: 25, min: 16 },
            { day: 'اليوم 3', icon: '☀️', max: 23, min: 14 },
            { day: 'اليوم 4', icon: '🌤️', max: 22, min: 13 },
            { day: 'اليوم 5', icon: '☀️', max: 24, min: 15 }
          ]
        };
        loadCity(val);
      }
    }

    function renderWeatherData() {
      const data = citiesData[currentCity] || citiesData.Riyadh;
      document.getElementById('city-name').innerText = data.name;
      document.getElementById('weather-desc').innerText = data.desc;
      document.getElementById('weather-icon').innerText = data.icon;
      document.getElementById('temp-display').innerText = formatTemp(data.tempC);
      document.getElementById('feels-like').innerText = 'يبدو وكأنه: ' + formatTemp(data.tempC + 2);
      document.getElementById('humidity-val').innerText = data.humidity;
      document.getElementById('wind-val').innerText = data.wind;
      document.getElementById('uv-val').innerText = data.uv;
      document.getElementById('aqi-val').innerText = data.aqi;

      const forecastEl = document.getElementById('forecast-cards');
      forecastEl.innerHTML = data.forecast.map(f => \`
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center space-y-1.5 shadow-md">
          <span class="text-xs font-semibold text-slate-400 block">\${f.day}</span>
          <span class="text-2xl block py-1">\${f.icon}</span>
          <div class="text-xs font-mono font-bold text-white">\${formatTemp(f.max)}</div>
          <div class="text-[10px] font-mono text-slate-500">\${formatTemp(f.min)}</div>
        </div>
      \`).join('');
    }

    renderWeatherData();
  </script>
</body>
</html>`;
}
