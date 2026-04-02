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

// ── Add node ──────────────────────────────────────────────────
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
