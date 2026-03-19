/* ============================================================
   CampusSound — charts.js
   All Chart.js chart rendering and gauge drawing
   ============================================================ */

let chart24hInstance = null;
let fftChartInstance = null;
let trendChartInstance = null;
let compChartInstance = null;

// ── Chart defaults ────────────────────────────────────────────
function getChartDefaults() {
  const style = getComputedStyle(document.documentElement);
  return {
    textColor:   style.getPropertyValue('--text2').trim()  || '#94a3b8',
    text3Color:  style.getPropertyValue('--text3').trim()  || '#64748b',
    accent:      style.getPropertyValue('--accent').trim() || '#22d3ee',
    border:      style.getPropertyValue('--border').trim() || 'rgba(99,120,180,0.18)',
    gridColor:   'rgba(99,120,180,0.08)',
    bg:          style.getPropertyValue('--bg').trim()     || '#0a0f1e'
  };
}

Chart.defaults.font.family = "'Space Mono', monospace";
Chart.defaults.font.size = 10;
Chart.defaults.color = '#94a3b8';

// ── Gauge (Canvas 2D) ─────────────────────────────────────────
function drawGauge(canvasId, value) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H - 20;
  const r = Math.min(W, H * 1.8) * 0.42;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const clampedVal = Math.max(0, Math.min(100, value));
  const fraction = clampedVal / 100;

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(99,120,180,0.15)';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Colored zone arcs
  const zones = [
    { from: 0,    to: 0.45, color: '#22c55e' },
    { from: 0.45, to: 0.60, color: '#38bdf8' },
    { from: 0.60, to: 0.75, color: '#f59e0b' },
    { from: 0.75, to: 0.85, color: '#f97316' },
    { from: 0.85, to: 1.00, color: '#ef4444' }
  ];
  zones.forEach(zone => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle + zone.from * Math.PI, startAngle + zone.to * Math.PI);
    ctx.strokeStyle = zone.color + '55';
    ctx.lineWidth = 14;
    ctx.lineCap = 'butt';
    ctx.stroke();
  });

  // Value arc
  const valAngle = startAngle + fraction * Math.PI;
  const color = value < 45 ? '#22c55e' : value < 60 ? '#38bdf8' : value < 75 ? '#f59e0b' : value < 85 ? '#f97316' : '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, valAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Glow
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, valAngle);
  ctx.strokeStyle = color + '44';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Needle
  const needleAngle = startAngle + fraction * Math.PI;
  const nx = cx + (r - 18) * Math.cos(needleAngle);
  const ny = cy + (r - 18) * Math.sin(needleAngle);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const tickAngle = startAngle + (i / 10) * Math.PI;
    const inner = r - 22, outer = i % 5 === 0 ? r - 10 : r - 16;
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(tickAngle), cy + inner * Math.sin(tickAngle));
    ctx.lineTo(cx + outer * Math.cos(tickAngle), cy + outer * Math.sin(tickAngle));
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.stroke();
  }

  // Min/max labels
  ctx.font = '10px Space Mono, monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('0', cx - r - 4, cy + 14);
  ctx.textAlign = 'right';
  ctx.fillText('100', cx + r + 6, cy + 14);
}

// ── 24h / 7d / 30d Line Chart ─────────────────────────────────
function render24hChart(nodeId, range = '24h') {
  const canvas = document.getElementById('chart24h');
  if (!canvas) return;

  let points, labelFn;
  if (range === '24h') {
    points = get24hHistory(nodeId);
    labelFn = p => formatTime(p.t);
  } else if (range === '7d') {
    points = getNdayHistory(nodeId, 7);
    labelFn = p => formatDate(p.t);
  } else {
    points = getNdayHistory(nodeId, 30);
    labelFn = p => formatDate(p.t);
  }

  const c = getChartDefaults();
  const labels = points.map(p => labelFn(p));
  const data = points.map(p => p.db);

  if (chart24hInstance) chart24hInstance.destroy();

  chart24hInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'dB SPL',
        data,
        borderColor: c.accent,
        borderWidth: 2,
        pointRadius: range === '24h' ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: c.accent,
        fill: true,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          g.addColorStop(0, c.accent + '44');
          g.addColorStop(1, c.accent + '00');
          return g;
        },
        tension: 0.3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a2236',
          borderColor: c.accent,
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.raw.toFixed(1)} dB`
          }
        },
        annotation: {
          annotations: {
            warnLine: {
              type: 'line', yMin: AppState.settings.warnDb, yMax: AppState.settings.warnDb,
              borderColor: '#f59e0b44', borderWidth: 1, borderDash: [4, 4]
            },
            critLine: {
              type: 'line', yMin: AppState.settings.critDb, yMax: AppState.settings.critDb,
              borderColor: '#ef444444', borderWidth: 1, borderDash: [4, 4]
            },
            quietZone: {
              type: 'box', yMin: 0, yMax: 45,
              backgroundColor: '#22c55e08', borderWidth: 0
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: c.gridColor },
          ticks: { color: c.text3Color, maxTicksLimit: 8, maxRotation: 0 },
          border: { color: c.border }
        },
        y: {
          min: 20, max: 100,
          grid: { color: c.gridColor },
          ticks: {
            color: c.text3Color,
            callback: v => v + ' dB'
          },
          border: { color: c.border }
        }
      }
    }
  });
}

// ── FFT Spectrum Chart ─────────────────────────────────────────
function renderFftChart(nodeId) {
  const canvas = document.getElementById('fftChart');
  if (!canvas) return;

  const fft = getFftData(nodeId);
  const c = getChartDefaults();

  const colors = ['#22c55e','#38bdf8','#22d3ee','#818cf8','#a78bfa','#f472b6','#f59e0b'];

  if (fftChartInstance) fftChartInstance.destroy();

  fftChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: fft.labels,
      datasets: [{
        data: fft.values,
        backgroundColor: colors.map(c => c + 'bb'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw.toFixed(1)} dB`
          }
        }
      },
      scales: {
        x: {
          grid: { color: c.gridColor },
          ticks: { color: c.text3Color, font: { size: 9 } },
          border: { color: c.border }
        },
        y: {
          min: 0,
          grid: { color: c.gridColor },
          ticks: { color: c.text3Color, callback: v => v + ' dB' },
          border: { color: c.border }
        }
      }
    }
  });
}

// ── 30-Day Trend Chart ────────────────────────────────────────
const TREND_COLORS = ['#22d3ee','#f472b6','#f59e0b','#22c55e'];
let activeTrendNodes = null;

function renderTrendChart(visibleNodeIds) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  if (!visibleNodeIds) visibleNodeIds = NODES.filter(n => n.status !== 'offline').map(n => n.id);
  activeTrendNodes = visibleNodeIds;

  const trendData = getTrendData();
  const c = getChartDefaults();

  // Build unified label set from all dates
  const allDates = new Set();
  NODES.forEach(n => {
    (trendData[n.id] || []).forEach(p => allDates.add(p.t.toISOString().slice(0,10)));
  });
  const labels = [...allDates].sort();

  const datasets = NODES.map((node, i) => {
    if (!visibleNodeIds.includes(node.id)) return null;
    const byDate = {};
    (trendData[node.id] || []).forEach(p => byDate[p.t.toISOString().slice(0,10)] = p.db);
    return {
      label: node.name,
      data: labels.map(d => byDate[d] || null),
      borderColor: TREND_COLORS[i % TREND_COLORS.length],
      backgroundColor: TREND_COLORS[i % TREND_COLORS.length] + '22',
      borderWidth: 2, pointRadius: 0, tension: 0.3,
      fill: false, spanGaps: true
    };
  }).filter(Boolean);

  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index', intersect: false,
          backgroundColor: '#1a2236', borderColor: '#22d3ee44', borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: c.gridColor },
          ticks: { color: c.text3Color, maxTicksLimit: 8, maxRotation: 0 },
          border: { color: c.border }
        },
        y: {
          min: 20, max: 100,
          grid: { color: c.gridColor },
          ticks: { color: c.text3Color, callback: v => v + ' dB' },
          border: { color: c.border }
        }
      }
    }
  });
}

function renderTrendToggles() {
  const wrap = document.getElementById('trend-toggles');
  if (!wrap) return;
  wrap.innerHTML = '';
  NODES.forEach((node, i) => {
    const btn = document.createElement('button');
    btn.className = 'trend-toggle';
    btn.textContent = node.name;
    const color = TREND_COLORS[i % TREND_COLORS.length];
    btn.style.borderColor = color;
    btn.style.color = color;
    const active = !activeTrendNodes || activeTrendNodes.includes(node.id);
    if (active) btn.style.background = color + '33';
    btn.onclick = () => {
      let current = activeTrendNodes || NODES.map(n => n.id);
      if (current.includes(node.id)) {
        current = current.filter(id => id !== node.id);
      } else {
        current = [...current, node.id];
      }
      renderTrendChart(current);
      renderTrendToggles();
    };
    wrap.appendChild(btn);
  });
}

// ── Compliance Chart ──────────────────────────────────────────
function renderComplianceChart(nodeId, threshold, fromHour, toHour) {
  const canvas = document.getElementById('compChart');
  if (!canvas) return;

  const sessions = getNodeSessions(nodeId).slice(0, 30 * 16);
  const byDay = {};

  sessions.forEach(s => {
    const h = s.timestamp.getHours();
    const inQuiet = fromHour > toHour
      ? (h >= fromHour || h < toHour)
      : (h >= fromHour && h < toHour);
    if (!inQuiet) return;
    const key = s.timestamp.toISOString().slice(0,10);
    if (!byDay[key]) byDay[key] = { total: 0, compliant: 0 };
    byDay[key].total++;
    if (s.avgDb <= threshold) byDay[key].compliant++;
  });

  const days = Object.keys(byDay).sort().slice(-14);
  const scores = days.map(d => byDay[d].total > 0 ? Math.round(byDay[d].compliant / byDay[d].total * 100) : 100);
  const overall = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;

  document.getElementById('comp-score').textContent = overall + '%';
  document.getElementById('comp-score').style.color = overall >= 80 ? '#22c55e' : overall >= 60 ? '#f59e0b' : '#ef4444';

  const c = getChartDefaults();
  if (compChartInstance) compChartInstance.destroy();

  compChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: days.map(d => formatDate(new Date(d))),
      datasets: [{
        data: scores,
        backgroundColor: scores.map(s => s >= 80 ? '#22c55e99' : s >= 60 ? '#f59e0b99' : '#ef444499'),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw}%` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: c.text3Color, maxRotation: 45 }, border: { color: c.border } },
        y: { min: 0, max: 100, grid: { color: c.gridColor }, ticks: { color: c.text3Color, callback: v => v+'%' }, border: { color: c.border } }
      }
    }
  });
}

// ── Heatmap ───────────────────────────────────────────────────
function renderHeatmap(nodeId) {
  const wrap = document.getElementById('heatmap-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  const data = getHeatmapData(nodeId);

  const table = document.createElement('div');
  table.style.cssText = 'display:flex; flex-direction:column; gap:2px; min-width:700px;';

  // Hour labels
  const hourRow = document.createElement('div');
  hourRow.style.cssText = 'display:flex; gap:2px; margin-left:36px;';
  for (let h = 0; h < 24; h++) {
    const lbl = document.createElement('div');
    lbl.style.cssText = 'width:26px; text-align:center; font-family:Space Mono,monospace; font-size:9px; color:#64748b;';
    lbl.textContent = h % 3 === 0 ? h.toString().padStart(2,'0') : '';
    hourRow.appendChild(lbl);
  }
  table.appendChild(hourRow);

  data.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.style.cssText = 'display:flex; gap:2px; align-items:center;';
    const dayLbl = document.createElement('div');
    dayLbl.style.cssText = 'font-family:Space Mono,monospace; font-size:10px; color:#64748b; width:30px; flex-shrink:0;';
    dayLbl.textContent = row.day;
    rowEl.appendChild(dayLbl);

    row.values.forEach((db, h) => {
      const cell = document.createElement('div');
      cell.style.cssText = `width:26px; height:22px; border-radius:3px; background:${heatColor(db)}; cursor:default; position:relative;`;
      cell.title = `${row.day} ${String(h).padStart(2,'0')}:00 — ${db} dB`;
      rowEl.appendChild(cell);
    });
    table.appendChild(rowEl);
  });

  // Legend
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex; align-items:center; gap:6px; margin-top:8px; margin-left:36px; font-family:Space Mono,monospace; font-size:9px; color:#64748b;';
  legend.innerHTML = '<span>Quiet</span>';
  [30,40,50,60,70,80,90].forEach(db => {
    const s = document.createElement('div');
    s.style.cssText = `width:20px; height:14px; border-radius:2px; background:${heatColor(db)};`;
    legend.appendChild(s);
  });
  legend.innerHTML += '<span>Loud</span>';
  table.appendChild(legend);

  wrap.appendChild(table);
}

function heatColor(db) {
  if (db < 35) return '#0f3a2a';
  if (db < 45) return '#14532d';
  if (db < 50) return '#166534';
  if (db < 55) return '#15803d';
  if (db < 60) return '#16a34a';
  if (db < 65) return '#ca8a04';
  if (db < 70) return '#d97706';
  if (db < 75) return '#ea580c';
  if (db < 80) return '#dc2626';
  if (db < 85) return '#b91c1c';
  return '#7f1d1d';
}

// ── Stats Summary ─────────────────────────────────────────────
function renderStats(nodeId) {
  const wrap = document.getElementById('stats-grid');
  if (!wrap) return;

  const sessions = getNodeSessions(nodeId);
  const recent = getNodeSessions(nodeId, new Date(Date.now() - 7 * 86400000));
  const allDb = sessions.map(s => s.avgDb);
  const allPeak = sessions.map(s => s.peakDb);
  const avgRecent = recent.length ? (recent.reduce((a,b)=>a+b.avgDb,0)/recent.length).toFixed(1) : '—';
  const loudest = allPeak.length ? Math.max(...allPeak).toFixed(1) : '—';

  // Find quietest hour
  const byHour = {};
  sessions.forEach(s => {
    const h = s.timestamp.getHours();
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(s.avgDb);
  });
  const quietestH = Object.entries(byHour).reduce((a, b) => {
    const avgA = a[1].reduce((x,y)=>x+y,0)/a[1].length;
    const avgB = b[1].reduce((x,y)=>x+y,0)/b[1].length;
    return avgA < avgB ? a : b;
  }, ['0', [50]])[0];

  const mostActive = NODES.reduce((best, node) => {
    const ns = getNodeSessions(node.id);
    const avg = ns.length ? ns.reduce((a,b)=>a+b.avgDb,0)/ns.length : 0;
    return avg > (best.avg || 0) ? { node, avg } : best;
  }, {});

  const stats = [
    { val: avgRecent + ' dB', label: 'Avg dB this week' },
    { val: loudest + ' dB',  label: 'Loudest event' },
    { val: String(quietestH).padStart(2,'0') + ':00', label: 'Quietest hour' },
    { val: mostActive.node ? mostActive.node.name.split(' ')[0] : '—', label: 'Most active node' }
  ];

  wrap.innerHTML = stats.map(s => `
    <div class="stat-box">
      <div class="stat-box-val">${s.val}</div>
      <div class="stat-box-label">${s.label}</div>
    </div>
  `).join('');
}
