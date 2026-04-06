/* ============================================================
   CampusSound — app.js
   Main app bootstrap, event wiring, live updates
   ============================================================ */

// ── Boot ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initData();
  setupEventListeners();

  // Splash → app
  setTimeout(() => {
    document.getElementById('splash').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').classList.remove('hidden');
      renderNodeBar();
      showPage('overview');
      startLiveUpdates();
      setupCsvUpload();
    }, 500);
  }, 2000);

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});

// ── Live Updates ──────────────────────────────────────────────
let liveInterval = null;
let syncCountdown = 30 * 60; // 30 min in seconds

function startLiveUpdates() {
  // Update overview gauge every 8 seconds (simulates 5-min sampling)
  liveInterval = setInterval(() => {
    if (AppState.currentPage === 'overview') {
      const node = NODES.find(n => n.id === AppState.selectedNodeId);
      if (node) renderOverview(node);
    }
    // Update sync label
    syncCountdown--;
    if (syncCountdown <= 0) {
      syncCountdown = 30 * 60;
      AppState.bluetooth.lastSync = new Date();
      document.getElementById('sync-label').textContent = 'Last sync: just now';
    } else {
      const mins = Math.floor(syncCountdown / 60);
      const secs = syncCountdown % 60;
      document.getElementById('sync-label').textContent = `Last sync: ${mins}m ${secs}s ago`;
    }
  }, 8000);
}

// ── Event Listeners ───────────────────────────────────────────
function setupEventListeners() {

  // ── Navigation ──────────────────────────────────────────────
  document.querySelectorAll('.nav-item, .bnav-item').forEach(item => {
    item.addEventListener('click', () => showPage(item.dataset.page));
  });

  document.getElementById('menu-toggle').addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    sb.style.display = sb.style.display === 'flex' ? 'none' : 'flex';
  });

  // ── Theme ───────────────────────────────────────────────────
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('sett-theme')?.addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
    AppState.theme = e.target.value;
    document.getElementById('sett-theme').value = e.target.value;
  });

  // ── 24h range buttons ────────────────────────────────────────
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render24hChart(AppState.selectedNodeId, btn.dataset.range);
    });
  });

  // ── Bluetooth ────────────────────────────────────────────────
  document.getElementById('bt-btn').addEventListener('click', openBtModal);
  document.getElementById('scan-btn')?.addEventListener('click', openBtModal);
  document.getElementById('sync-now-btn')?.addEventListener('click', () => {
    if (!AppState.bluetooth.connected) {
      showToast('No device connected. Scan first.', 'warn');
      return;
    }
    showToast('Syncing…', 'info');
    setTimeout(() => {
      AppState.bluetooth.lastSync = new Date();
      syncCountdown = 30 * 60;
      showToast('Sync complete!', 'success');
      renderBtStatus();
    }, 1800);
  });

  // ── Node search ──────────────────────────────────────────────
  document.getElementById('node-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = NODES.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.location.toLowerCase().includes(q) ||
      n.id.toLowerCase().includes(q)
    );
    renderNodesTable(filtered);
  });

  // ── Add node ─────────────────────────────────────────────────
  document.getElementById('add-node-btn')?.addEventListener('click', () => {
    document.getElementById('add-node-modal').classList.remove('hidden');
  });
  document.getElementById('save-node-btn')?.addEventListener('click', saveNewNode);

  // ── Close modals ─────────────────────────────────────────────
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  });

  // ── Recordings filters ────────────────────────────────────────
  ['rec-date-from','rec-date-to','rec-node-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => { recPage = 1; renderRecordingsPage(); });
  });

  // ── Import ───────────────────────────────────────────────────
  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast('Importing data…', 'info');
    importData(file, (err, added) => {
      if (err) { showToast('Import failed: ' + err.message, 'error'); return; }
      showToast(`Import complete: ${added} sessions added.`, 'success');
      renderRecordingsPage();
    });
    e.target.value = '';
  });

  // ── Export ────────────────────────────────────────────────────
  document.getElementById('do-export-btn')?.addEventListener('click', doExport);
  document.getElementById('gen-report-btn')?.addEventListener('click', generateReport);

  // ── Analytics compliance ──────────────────────────────────────
  document.getElementById('comp-calc')?.addEventListener('click', calcCompliance);

  // ── Settings sliders ─────────────────────────────────────────
  const sliders = [
    ['sett-gain', 'sett-gain-val', v => v + ' dB'],
    ['sett-lowcut', 'sett-lowcut-val', v => v + ' Hz'],
    ['sett-highcut', 'sett-highcut-val', v => v + ' Hz'],
    ['sett-warn', 'sett-warn-val', v => v + ' dB'],
    ['sett-crit', 'sett-crit-val', v => v + ' dB']
  ];
  sliders.forEach(([id, outId, fmt]) => {
    const slider = document.getElementById(id);
    const out = document.getElementById(outId);
    if (slider && out) {
      slider.addEventListener('input', () => {
        out.textContent = fmt(slider.value);
      });
    }
  });

  // ── Schedule mode ─────────────────────────────────────────────
  document.getElementById('sched-mode-group')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    document.querySelectorAll('#sched-mode-group .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    AppState.settings.scheduleMode = btn.dataset.mode;
    document.getElementById('quickstart-panel').classList.toggle('hidden', btn.dataset.mode !== 'quickstart');
    document.getElementById('custom-panel').classList.toggle('hidden', btn.dataset.mode !== 'custom');
  });

  // ── Preset buttons ────────────────────────────────────────────
  document.getElementById('preset-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    AppState.settings.activePreset = btn.dataset.preset;
    document.getElementById('sched-profile').textContent = presetLabel(btn.dataset.preset);
    showToast(`Schedule: ${btn.textContent.trim().split('\n')[0]} activated`, 'success');
  });

  // ── Custom blocks ─────────────────────────────────────────────
  document.getElementById('add-block-btn')?.addEventListener('click', addBlock);

  // ── Config export/import ──────────────────────────────────────
  document.getElementById('export-config-btn')?.addEventListener('click', () => {
    exportConfig();
    showToast('Config file exported', 'success');
  });
  document.getElementById('import-config-btn')?.addEventListener('click', () => {
    document.getElementById('import-config-file').click();
  });
  document.getElementById('import-config-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const cfg = JSON.parse(ev.target.result);
        if (cfg.settings) Object.assign(AppState.settings, cfg.settings);
        if (cfg.schedule) {
          AppState.settings.scheduleMode = cfg.schedule.mode;
          AppState.settings.activePreset = cfg.schedule.activePreset;
          AppState.settings.customBlocks = cfg.schedule.customBlocks || [];
        }
        if (cfg.alerts) {
          AppState.settings.warnDb = cfg.alerts.warnDb;
          AppState.settings.critDb = cfg.alerts.critDb;
        }
        showToast('Config loaded! Applied to all nodes.', 'success');
        renderSettingsPage();
      } catch { showToast('Invalid config file', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ── Sensor types ──────────────────────────────────────────────
  document.getElementById('add-sensor-type-btn')?.addEventListener('click', addSensorTypeRow);

  // ── Clear data ────────────────────────────────────────────────
  document.getElementById('clear-data-btn')?.addEventListener('click', () => {
    document.getElementById('confirm-title').textContent = 'Clear All Data';
    document.getElementById('confirm-msg').textContent = 'This will delete all recording data. This cannot be undone. Are you sure?';
    document.getElementById('confirm-modal').classList.remove('hidden');
    document.getElementById('confirm-ok').onclick = () => {
      ALL_SESSIONS = [];
      AppState.recentExports = [];
      showToast('All data cleared', 'warn');
      document.getElementById('confirm-modal').classList.add('hidden');
      renderRecordingsPage();
    };
  });

  // ── Notification bell ─────────────────────────────────────────
  document.getElementById('notif-btn')?.addEventListener('click', () => {
    const spikes = getSpikeEvents(AppState.selectedNodeId).slice(0, 3);
    const msg = spikes.length
      ? `${spikes.length} recent spike events: latest ${spikes[0]?.db}dB at ${formatTime(spikes[0]?.timestamp)}`
      : 'No recent alerts';
    showToast(msg, spikes.length ? 'warn' : 'info', 4000);
  });
}

// ── Theme toggle ──────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  AppState.theme = next;
  const sel = document.getElementById('sett-theme');
  if (sel) sel.value = next;
}

// ── Bluetooth modal ───────────────────────────────────────────
function openBtModal() {
  document.getElementById('bt-modal').classList.remove('hidden');
  const list = document.getElementById('bt-device-list');
  list.innerHTML = '';

  const mockDevices = [
    { name: 'CampusSound-N001', id: '00:1A:7D:DA:71:13' },
    { name: 'CampusSound-N002', id: '00:1A:7D:DA:71:14' },
    { name: 'ESP32-AudioSensor', id: 'AA:BB:CC:DD:EE:01' }
  ];

  // Simulate scan delay
  setTimeout(() => {
    document.getElementById('scanning-ind').style.display = 'none';
    mockDevices.forEach(dev => {
      const item = document.createElement('div');
      item.className = 'bt-device-item';
      item.innerHTML = `
        <div>
          <div class="bt-dev-name">${dev.name}</div>
          <div class="bt-dev-id">${dev.id}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="connectBt('${dev.name}','${dev.id}')">Connect</button>
      `;
      list.appendChild(item);
    });
  }, 1500);
}

function connectBt(name, id) {
  AppState.bluetooth.connected = true;
  AppState.bluetooth.deviceName = name;
  AppState.bluetooth.signalStrength = Math.ceil(Math.random() * 3) + 1;
  AppState.bluetooth.lastSync = new Date();
  syncCountdown = 30 * 60;
  document.getElementById('bt-modal').classList.add('hidden');
  document.getElementById('scanning-ind').style.display = 'flex';
  document.getElementById('bt-device-list').innerHTML = '';
  showToast(`Connected to ${name}`, 'success');
  renderBtStatus();
}

// ── CSV Upload & Analysis ─────────────────────────────────────
let csvLineChart = null, csvHourChart = null, csvDistChart = null, csvDailyChart = null;

function setupCsvUpload() {
  const dropZone  = document.getElementById('csv-drop-zone');
  const fileInput = document.getElementById('csv-upload-input');
  const browseLink = document.getElementById('csv-browse-link');

  if (!dropZone) return;

  browseLink.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleCsvFile(e.target.files[0]);
    e.target.value = '';
  });

  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleCsvFile(file);
    else showToast('Please drop a .csv file', 'error');
  });

  document.getElementById('csv-clear-btn')?.addEventListener('click', clearCsvResults);
}

function handleCsvFile(file) {
  showToast(`Reading ${file.name}…`, 'info', 1500);
  const reader = new FileReader();
  reader.onload = (e) => {
    const rows = parseCsv(e.target.result);
    if (!rows || rows.length === 0) {
      showToast('Could not parse CSV — check the format', 'error'); return;
    }
    renderCsvResults(rows, file.name);
    showToast(`Loaded ${rows.length} readings from ${file.name}`, 'success');
  };
  reader.readAsText(file);
}

function parseCsv(text) {
  // Split lines, skip empty
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;

  // Skip header row (row 0 = "Time, Environment" or similar)
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 2) continue;

    // Column A: date/time like "4/2/2026 10:15:12 AM"
    const rawTime = parts[0].trim().replace(/^"|"$/g, '');
    // Column B: dB value like "23.42"
    const rawDb = parts[1].trim().replace(/^"|"$/g, '');

    const ts = new Date(rawTime);
    const db = parseFloat(rawDb);

    if (isNaN(ts.getTime()) || isNaN(db)) continue;
    rows.push({ ts, db });
  }
  return rows.sort((a, b) => a.ts - b.ts);
}

function renderCsvResults(rows, filename) {
  document.getElementById('csv-results').classList.remove('hidden');
  document.getElementById('csv-drop-zone').style.display = 'none';
  document.getElementById('csv-file-label').textContent = filename;

  // ── Stats ───────────────────────────────────────────────────
  const dbs = rows.map(r => r.db);
  const avg  = dbs.reduce((a,b)=>a+b,0) / dbs.length;
  const peak = Math.max(...dbs);
  const low  = Math.min(...dbs);
  const above70 = dbs.filter(d => d >= 70).length;
  const pctLoud = ((above70 / dbs.length) * 100).toFixed(1);
  const spanDays = Math.max(1, Math.round((rows[rows.length-1].ts - rows[0].ts) / 86400000));

  document.getElementById('csv-stats-row').innerHTML = `
    <div class="csv-stat-box"><div class="csv-stat-val">${rows.length}</div><div class="csv-stat-label">Total readings</div></div>
    <div class="csv-stat-box"><div class="csv-stat-val">${avg.toFixed(1)} dB</div><div class="csv-stat-label">Average level</div></div>
    <div class="csv-stat-box"><div class="csv-stat-val" style="color:var(--danger)">${peak.toFixed(1)} dB</div><div class="csv-stat-label">Peak level</div></div>
    <div class="csv-stat-box"><div class="csv-stat-val" style="color:var(--success)">${low.toFixed(1)} dB</div><div class="csv-stat-label">Lowest level</div></div>
    <div class="csv-stat-box"><div class="csv-stat-val">${pctLoud}%</div><div class="csv-stat-label">Readings ≥ 70 dB</div></div>
    <div class="csv-stat-box"><div class="csv-stat-val">${spanDays}</div><div class="csv-stat-label">Days spanned</div></div>
  `;

  // ── Chart defaults ──────────────────────────────────────────
  const gridColor = 'rgba(143,185,143,0.08)';
  const textColor = '#a8bea8';
  const accent    = '#8fb98f';

  // ── Line chart: dB over time ────────────────────────────────
  // Downsample to max 300 points for performance
  const step = Math.max(1, Math.floor(rows.length / 300));
  const sampled = rows.filter((_, i) => i % step === 0);

  if (csvLineChart) csvLineChart.destroy();
  csvLineChart = new Chart(document.getElementById('csvLineChart'), {
    type: 'line',
    data: {
      labels: sampled.map(r => formatDateTime(r.ts)),
      datasets: [{
        data: sampled.map(r => r.db),
        borderColor: accent,
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        backgroundColor: accent + '22',
        tension: 0.3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toFixed(1)} dB` } } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 6, maxRotation: 0 } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, callback: v => v + ' dB' } }
      }
    }
  });

  // ── Hourly average chart ────────────────────────────────────
  const hourBuckets = Array.from({length: 24}, () => []);
  rows.forEach(r => hourBuckets[r.ts.getHours()].push(r.db));
  const hourAvgs = hourBuckets.map(b => b.length ? b.reduce((a,c)=>a+c,0)/b.length : null);
  const hourColors = hourAvgs.map(v => v === null ? '#2d3f32' : v < 50 ? '#7ab87a99' : v < 65 ? '#8fb98f99' : v < 75 ? '#c9a85c99' : '#c97a6a99');

  if (csvHourChart) csvHourChart.destroy();
  csvHourChart = new Chart(document.getElementById('csvHourChart'), {
    type: 'bar',
    data: {
      labels: Array.from({length:24}, (_,i) => `${String(i).padStart(2,'0')}:00`),
      datasets: [{ data: hourAvgs, backgroundColor: hourColors, borderRadius: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.raw ? ` ${ctx.raw.toFixed(1)} dB` : ' no data' } } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, maxRotation: 45, font: { size: 9 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, callback: v => v + ' dB' } }
      }
    }
  });

  // ── Distribution histogram ──────────────────────────────────
  const buckets = {};
  const bSize = 5;
  dbs.forEach(d => {
    const b = Math.floor(d / bSize) * bSize;
    buckets[b] = (buckets[b] || 0) + 1;
  });
  const distLabels = Object.keys(buckets).sort((a,b)=>+a-+b).map(b => `${b}–${+b+bSize}`);
  const distVals   = Object.keys(buckets).sort((a,b)=>+a-+b).map(b => buckets[b]);
  const distColors = Object.keys(buckets).sort((a,b)=>+a-+b).map(b => +b < 50 ? '#7ab87a99' : +b < 65 ? '#8fb98f99' : +b < 75 ? '#c9a85c99' : '#c97a6a99');

  if (csvDistChart) csvDistChart.destroy();
  csvDistChart = new Chart(document.getElementById('csvDistChart'), {
    type: 'bar',
    data: {
      labels: distLabels,
      datasets: [{ data: distVals, backgroundColor: distColors, borderRadius: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} readings` } } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, maxRotation: 45, font: { size: 9 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  });

  // ── Daily average trend ─────────────────────────────────────
  const dayBuckets = {};
  rows.forEach(r => {
    const key = r.ts.toISOString().slice(0,10);
    if (!dayBuckets[key]) dayBuckets[key] = [];
    dayBuckets[key].push(r.db);
  });
  const dayLabels = Object.keys(dayBuckets).sort();
  const dayAvgs   = dayLabels.map(d => dayBuckets[d].reduce((a,b)=>a+b,0)/dayBuckets[d].length);

  if (csvDailyChart) csvDailyChart.destroy();
  csvDailyChart = new Chart(document.getElementById('csvDailyChart'), {
    type: 'line',
    data: {
      labels: dayLabels.map(d => formatDate(new Date(d))),
      datasets: [{
        data: dayAvgs,
        borderColor: '#b5c9a1',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#b5c9a1',
        fill: true,
        backgroundColor: '#b5c9a122',
        tension: 0.3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toFixed(1)} dB avg` } } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, maxRotation: 45, font: { size: 9 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, callback: v => v + ' dB' } }
      }
    }
  });

  // ── Preview table (first 50 rows) ───────────────────────────
  const preview = rows.slice(0, 50);
  document.getElementById('csv-preview-tbody').innerHTML = preview.map((r, i) => {
    const lvl = r.db < 45 ? '<span style="color:#7ab87a">Quiet</span>' :
                r.db < 60 ? '<span style="color:#8fb98f">Moderate</span>' :
                r.db < 75 ? '<span style="color:#c9a85c">Loud</span>' :
                            '<span style="color:#c97a6a">Very Loud</span>';
    return `<tr>
      <td class="mono" style="color:var(--text3)">${i+1}</td>
      <td class="mono" style="font-size:0.75rem">${formatDateTime(r.ts)}</td>
      <td class="mono" style="color:${r.db>=70?'var(--danger)':'var(--text)'}">${r.db.toFixed(2)}</td>
      <td>${lvl}</td>
    </tr>`;
  }).join('');
  document.getElementById('csv-preview-note').textContent =
    rows.length > 50 ? `Showing first 50 of ${rows.length} readings` : `All ${rows.length} readings shown`;
}

function clearCsvResults() {
  document.getElementById('csv-results').classList.add('hidden');
  document.getElementById('csv-drop-zone').style.display = '';
  [csvLineChart, csvHourChart, csvDistChart, csvDailyChart].forEach(c => { if (c) c.destroy(); });
  csvLineChart = csvHourChart = csvDistChart = csvDailyChart = null;
  document.getElementById('csv-upload-input').value = '';
}
function saveNewNode() {
  const name = document.getElementById('mn-name').value.trim();
  const loc  = document.getElementById('mn-loc').value.trim();
  const lat  = parseFloat(document.getElementById('mn-lat').value);
  const lng  = parseFloat(document.getElementById('mn-lng').value);
  const sensor = document.getElementById('mn-sensor').value;
  const notes = document.getElementById('mn-notes').value.trim();

  if (!name || isNaN(lat) || isNaN(lng)) {
    showToast('Please fill in Name, Latitude, and Longitude', 'error');
    return;
  }

  const newId = `N${String(NODES.length + 1).padStart(3,'0')}`;
  NODES.push({
    id: newId, name, location: loc, lat, lng,
    sensor, firmware: 'v2.3.1', uptime: '0d 0h',
    battery: 100, solar: 0, sdUsed: 0, sdTotal: 32,
    status: 'active', lastSeen: new Date(),
    timezone: 'America/Toronto', gps: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    notes
  });

  document.getElementById('add-node-modal').classList.add('hidden');
  ['mn-name','mn-loc','mn-lat','mn-lng','mn-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });

  renderNodeBar();
  renderNodesTable(NODES);
  renderNodeMarkers();
  showToast(`Node ${newId} (${name}) added!`, 'success');
}
