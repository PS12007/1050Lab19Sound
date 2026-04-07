/* ============================================================
   EcoEcho — app.js
   Bootstrap, event wiring, live updates, CSV upload, WAV export
   ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
  // Dismiss splash unconditionally after animation completes (1.8s fill + 0.2s buffer)
  // This runs regardless of any errors below
  const dismissSplash = () => {
    const splash = document.getElementById('splash');
    const app    = document.getElementById('app');
    if (splash) { splash.classList.add('fade-out'); }
    setTimeout(() => {
      if (splash) splash.style.display = 'none';
      if (app)    app.classList.remove('hidden');
      try { renderNodeBar(); } catch(e) { console.error('renderNodeBar', e); }
      try { showPage('overview'); } catch(e) { console.error('showPage', e); }
      try { startLiveUpdates(); } catch(e) { console.error('startLiveUpdates', e); }
    }, 400);
  };

  // Boot app — each step wrapped so one failure can't block the splash dismiss
  try { initData(); }            catch(e) { console.error('initData failed:', e); }
  try { setupEventListeners(); } catch(e) { console.error('setupEventListeners failed:', e); }
  try { setupCsvUpload(); }      catch(e) { console.error('setupCsvUpload failed:', e); }

  // Always dismiss splash after 1.8s (matches CSS animation duration)
  setTimeout(dismissSplash, 1800);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});

// ── Live updates every 8s ─────────────────────────────────────
let syncCountdown = 30 * 60;
function startLiveUpdates() {
  setInterval(() => {
    if (AppState.currentPage === 'overview') {
      const node = NODES.find(n => n.id === AppState.selectedNodeId);
      if (node) renderOverview(node);
    }
    syncCountdown--;
    if (syncCountdown <= 0) {
      syncCountdown = 30 * 60;
      AppState.bluetooth.lastSync = new Date();
      document.getElementById('sync-label').textContent = 'Last sync: just now';
    } else {
      const m = Math.floor(syncCountdown / 60), s = syncCountdown % 60;
      document.getElementById('sync-label').textContent = `Last sync: ${m}m ${s}s ago`;
    }
  }, 8000);
}

// ── Event listeners ───────────────────────────────────────────
function setupEventListeners() {

  // Navigation
  document.querySelectorAll('.nav-item, .bnav-item').forEach(item => {
    item.addEventListener('click', () => showPage(item.dataset.page));
  });

  document.getElementById('menu-toggle').addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    sb.style.display = sb.style.display === 'flex' ? 'none' : 'flex';
  });

  // Theme
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('sett-theme')?.addEventListener('change', e => {
    document.documentElement.setAttribute('data-theme', e.target.value);
  });

  // 24h range buttons
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render24hChart(AppState.selectedNodeId, btn.dataset.range);
    });
  });

  // Bluetooth
  document.getElementById('bt-btn').addEventListener('click', openBtModal);
  document.getElementById('scan-btn')?.addEventListener('click', openBtModal);
  document.getElementById('sync-now-btn')?.addEventListener('click', () => {
    if (!AppState.bluetooth.connected) { showToast('No device connected. Scan first.', 'warn'); return; }
    showToast('Syncing…', 'info');
    setTimeout(() => {
      AppState.bluetooth.lastSync = new Date();
      syncCountdown = 30 * 60;
      showToast('Sync complete!', 'success');
      renderBtStatus();
    }, 1800);
  });

  // Node search
  document.getElementById('node-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderNodesTable(NODES.filter(n => n.name.toLowerCase().includes(q) || n.location.toLowerCase().includes(q)));
  });

  // Close modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
  });

  // Recordings filters
  ['rec-date-from', 'rec-date-to', 'rec-node-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => renderRecordingsPage());
  });

  // Import button (top of recordings)
  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseEcoCsv(ev.target.result);
      if (!rows) { showToast('Could not parse CSV', 'error'); return; }
      showToast(`Imported ${rows.length} readings`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Export
  document.getElementById('do-export-btn')?.addEventListener('click', doExport);
  document.getElementById('gen-report-btn')?.addEventListener('click', generateReport);

  // WAV export
  document.getElementById('wav-export-btn')?.addEventListener('click', handleWavExport);

  // Analytics compliance
  document.getElementById('comp-calc')?.addEventListener('click', calcCompliance);

  // Settings sliders
  [
    ['sett-gain',    'sett-gain-val',    v => v + ' dB'],
    ['sett-lowcut',  'sett-lowcut-val',  v => v + ' Hz'],
    ['sett-highcut', 'sett-highcut-val', v => v + ' Hz'],
    ['sett-warn',    'sett-warn-val',    v => v + ' dB'],
    ['sett-crit',    'sett-crit-val',    v => v + ' dB'],
  ].forEach(([id, outId, fmt]) => {
    const slider = document.getElementById(id);
    const out    = document.getElementById(outId);
    if (slider && out) slider.addEventListener('input', () => { out.textContent = fmt(slider.value); });
  });

  // Schedule mode toggle
  document.getElementById('sched-mode-group')?.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    document.querySelectorAll('#sched-mode-group .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    AppState.settings.scheduleMode = btn.dataset.mode;
    document.getElementById('quickstart-panel').classList.toggle('hidden', btn.dataset.mode !== 'quickstart');
    document.getElementById('custom-panel').classList.toggle('hidden', btn.dataset.mode !== 'custom');
  });

  // Preset buttons
  document.getElementById('preset-grid')?.addEventListener('click', e => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    AppState.settings.activePreset = btn.dataset.preset;
    document.getElementById('sched-profile').textContent = presetLabel(btn.dataset.preset);
    showToast(`Schedule: ${btn.dataset.preset} activated`, 'success');
  });

  // Custom time blocks
  document.getElementById('add-block-btn')?.addEventListener('click', addBlock);

  // Config export/import
  document.getElementById('export-config-btn')?.addEventListener('click', () => { exportConfig(); showToast('Config exported', 'success'); });
  document.getElementById('import-config-btn')?.addEventListener('click', () => document.getElementById('import-config-file').click());
  document.getElementById('import-config-file')?.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const cfg = JSON.parse(ev.target.result);
        if (cfg.settings) Object.assign(AppState.settings, cfg.settings);
        if (cfg.schedule) { AppState.settings.scheduleMode = cfg.schedule.mode; AppState.settings.activePreset = cfg.schedule.activePreset; AppState.settings.customBlocks = cfg.schedule.customBlocks || []; }
        showToast('Config loaded!', 'success');
        renderSettingsPage();
      } catch { showToast('Invalid config file', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Sensor types
  document.getElementById('add-sensor-type-btn')?.addEventListener('click', addSensorTypeRow);

  // Clear data
  document.getElementById('clear-data-btn')?.addEventListener('click', () => {
    document.getElementById('confirm-title').textContent = 'Clear All Data';
    document.getElementById('confirm-msg').textContent = 'This will reset all session data. Are you sure?';
    document.getElementById('confirm-modal').classList.remove('hidden');
    document.getElementById('confirm-ok').onclick = () => {
      initData();
      showToast('Data reset', 'warn');
      document.getElementById('confirm-modal').classList.add('hidden');
      renderRecordingsPage();
    };
  });

  // Notification bell
  document.getElementById('notif-btn')?.addEventListener('click', () => {
    const spikes = getSpikeEvents(AppState.selectedNodeId).slice(0, 3);
    showToast(spikes.length ? `${spikes.length} spike events — latest ${spikes[0].db}dB` : 'No recent alerts', spikes.length ? 'warn' : 'info', 4000);
  });
}

// ── Theme ─────────────────────────────────────────────────────
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  const sel = document.getElementById('sett-theme');
  if (sel) sel.value = next;
}

// ── Bluetooth modal ───────────────────────────────────────────
function openBtModal() {
  document.getElementById('bt-modal').classList.remove('hidden');
  const list = document.getElementById('bt-device-list');
  list.innerHTML = '';
  document.getElementById('scanning-ind').style.display = 'flex';
  const mockDevices = [
    { name: 'EcoEcho-Device1', id: '00:1A:7D:DA:71:13' },
    { name: 'EcoEcho-Device2', id: '00:1A:7D:DA:71:14' },
  ];
  setTimeout(() => {
    document.getElementById('scanning-ind').style.display = 'none';
    mockDevices.forEach(dev => {
      const item = document.createElement('div');
      item.className = 'bt-device-item';
      item.innerHTML = `<div><div class="bt-dev-name">${dev.name}</div><div class="bt-dev-id">${dev.id}</div></div>
        <button class="btn btn-primary btn-sm" onclick="connectBt('${dev.name}')">Connect</button>`;
      list.appendChild(item);
    });
  }, 1500);
}

function connectBt(name) {
  AppState.bluetooth.connected = true;
  AppState.bluetooth.deviceName = name;
  AppState.bluetooth.signalStrength = 3;
  AppState.bluetooth.lastSync = new Date();
  document.getElementById('bt-modal').classList.add('hidden');
  document.getElementById('scanning-ind').style.display = 'flex';
  document.getElementById('bt-device-list').innerHTML = '';
  showToast(`Connected to ${name}`, 'success');
  renderBtStatus();
}

// ── CSV upload section (in recordings page) ───────────────────
function setupCsvUpload() {
  const dropZone   = document.getElementById('csv-drop-zone');
  const fileInput  = document.getElementById('csv-upload-input');
  const browseLink = document.getElementById('csv-browse-link');
  if (!dropZone) return;

  browseLink.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleCsvFile(e.target.files[0]);
    e.target.value = '';
  });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleCsvFile(file);
    else showToast('Please drop a .csv file', 'error');
  });

  document.getElementById('csv-clear-btn')?.addEventListener('click', () => {
    document.getElementById('csv-results').classList.add('hidden');
    dropZone.style.display = '';
    clearCsvCharts();
  });
}

function handleCsvFile(file) {
  showToast(`Reading ${file.name}…`, 'info', 1500);
  const reader = new FileReader();
  reader.onload = e => {
    const rows = parseEcoCsv(e.target.result);
    if (!rows || !rows.length) { showToast('Could not parse CSV — check format', 'error'); return; }
    renderCsvCharts(rows, file.name);
    showToast(`Loaded ${rows.length} readings`, 'success');
  };
  reader.readAsText(file);
}

// ── WAV Export ────────────────────────────────────────────────
async function handleWavExport() {
  const nodeId = document.getElementById('wav-node-select')?.value || 'N001';
  const ms     = parseInt(document.getElementById('wav-ms')?.value || '100');
  const prog   = document.getElementById('wav-progress');
  const fill   = document.getElementById('wav-fill');
  const status = document.getElementById('wav-status');
  const btn    = document.getElementById('wav-export-btn');

  prog.classList.remove('hidden');
  btn.disabled = true;
  btn.textContent = 'Generating…';

  try {
    const wavBuffer = await exportWav(nodeId, ms, pct => {
      fill.style.width  = (pct * 100).toFixed(0) + '%';
      status.textContent = `Generating… ${(pct * 100).toFixed(0)}%`;
    });

    if (!wavBuffer) { showToast('No data to export', 'warn'); return; }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const node = NODES.find(n => n.id === nodeId);
    const filename = `ecoecho_${node?.name.replace(/\s+/g,'_')}_${Date.now()}.wav`;
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);

    const sizeKb = Math.round(wavBuffer.byteLength / 1024);
    AppState.recentExports.unshift({ filename, date: new Date(), size: `${sizeKb} KB`, url });
    renderExportTable();
    showToast(`WAV exported: ${filename} (${sizeKb} KB)`, 'success');
    status.textContent = 'Done!';
  } catch (err) {
    showToast('WAV export failed: ' + err.message, 'error');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = '⇩ Export WAV';
    setTimeout(() => { prog.classList.add('hidden'); fill.style.width = '0%'; }, 3000);
  }
}

// ── Save new node (from modal) ────────────────────────────────
function saveNewNode() {
  const name   = document.getElementById('mn-name').value.trim();
  const loc    = document.getElementById('mn-loc').value.trim();
  const lat    = parseFloat(document.getElementById('mn-lat').value);
  const lng    = parseFloat(document.getElementById('mn-lng').value);
  const sensor = document.getElementById('mn-sensor').value;
  const notes  = document.getElementById('mn-notes').value.trim();
  if (!name || isNaN(lat) || isNaN(lng)) { showToast('Fill in Name, Lat, and Lng', 'error'); return; }
  const newId = `N${String(NODES.length+1).padStart(3,'0')}`;
  NODES.push({ id:newId, name, location:loc, lat, lng, sensor, firmware:'v2.3.1', uptime:'0d 0h', battery:100, solar:0, sdUsed:0, sdTotal:32, status:'active', lastSeen:new Date(), timezone:'America/Toronto', gps:`${lat.toFixed(4)}, ${lng.toFixed(4)}`, notes });
  document.getElementById('add-node-modal').classList.add('hidden');
  ['mn-name','mn-loc','mn-lat','mn-lng','mn-notes'].forEach(id => { document.getElementById(id).value=''; });
  renderNodeBar(); renderNodesTable(NODES); renderNodeMarkers();
  showToast(`${newId} (${name}) added!`, 'success');
}
