/* ============================================================
   CampusSound — ui.js
   All DOM rendering, page updates, and UI helpers
   ============================================================ */

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3000) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', warn: '⚠', info: 'ℹ' };
  t.innerHTML = `<span style="color:${type==='success'?'#22c55e':type==='error'?'#ef4444':type==='warn'?'#f59e0b':'#38bdf8'}">${icons[type]||'ℹ'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300); }, duration);
}

// ── Node bar ──────────────────────────────────────────────────
function renderNodeBar() {
  const wrap = document.getElementById('node-tabs');
  wrap.innerHTML = '';
  NODES.forEach(node => {
    const tab = document.createElement('div');
    tab.className = `node-tab${node.id === AppState.selectedNodeId ? ' active' : ''}`;
    tab.innerHTML = `<span class="node-dot ${node.status === 'active' ? 'green' : node.status === 'warning' ? 'yellow' : 'red'}"></span>${node.name}`;
    tab.onclick = () => selectNode(node.id);
    wrap.appendChild(tab);
  });
}

function selectNode(nodeId) {
  AppState.selectedNodeId = nodeId;
  renderNodeBar();
  refreshCurrentPage();
}

// ── Page navigation ───────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item, .bnav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageId);
  });
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  AppState.currentPage = pageId;
  refreshCurrentPage();
}

function refreshCurrentPage() {
  const id = AppState.currentPage;
  const node = NODES.find(n => n.id === AppState.selectedNodeId);

  if (id === 'overview')    renderOverview(node);
  if (id === 'nodes')       renderNodesPage();
  if (id === 'recordings')  renderRecordingsPage();
  if (id === 'analytics')   renderAnalyticsPage();
  if (id === 'export')      renderExportPage();
  if (id === 'settings')    renderSettingsPage();
}

// ── Overview Page ─────────────────────────────────────────────
let gaugeAnimFrame = null;
let currentGaugeVal = 0;

function renderOverview(node) {
  if (!node) return;
  const db = getLiveDb(node.id);
  const status = dbStatus(db);

  // Animate gauge
  const target = db;
  if (gaugeAnimFrame) cancelAnimationFrame(gaugeAnimFrame);
  const animate = () => {
    currentGaugeVal += (target - currentGaugeVal) * 0.08;
    drawGauge('gaugeCanvas', currentGaugeVal);
    document.getElementById('gauge-value').textContent = Math.round(currentGaugeVal);
    if (Math.abs(currentGaugeVal - target) > 0.2) gaugeAnimFrame = requestAnimationFrame(animate);
  };
  animate();

  // Status tag
  const tag = document.getElementById('status-tag');
  tag.textContent = status.label;
  tag.style.color = status.color;
  tag.style.borderColor = status.color + '44';
  tag.style.background = status.color + '14';

  // Min/max
  const sessions = getNodeSessions(node.id, new Date(Date.now() - 86400000));
  const dbs = sessions.flatMap(s => s.samples.map(sp => sp.db));
  document.getElementById('today-min').textContent = dbs.length ? Math.min(...dbs).toFixed(0) : '—';
  document.getElementById('today-max').textContent = dbs.length ? Math.max(...dbs).toFixed(0) : '—';

  // Power
  animateBar('solar-bar', node.solar); document.getElementById('solar-pct').textContent = node.solar + '%';
  animateBar('batt-bar', node.battery); document.getElementById('batt-pct').textContent = node.battery + '%';
  animateBar('sd-bar', node.sdUsed); document.getElementById('sd-pct').textContent = node.sdUsed + '%';

  // GPS
  document.getElementById('node-gps').textContent = node.gps;
  document.getElementById('node-tz').textContent = `${node.timezone} · UTC-5`;

  // Schedule
  document.getElementById('sched-profile').textContent = presetLabel(AppState.settings.activePreset);
  document.getElementById('sched-rate').textContent = AppState.settings.sampleRate;
  document.getElementById('sched-bit').textContent = AppState.settings.bitDepth;
  document.getElementById('next-rec').textContent = nextRecordingTime();

  // Classification timeline
  renderClassifyTimeline(node.id);

  // Chart
  const activeRange = document.querySelector('.range-btn.active')?.dataset.range || '24h';
  render24hChart(node.id, activeRange);

  // BT status
  renderBtStatus();
}

function animateBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct + '%';
}

function presetLabel(preset) {
  const labels = { dawn: 'Dawn Chorus', fullday: 'Full Day', night: 'Night Only', peak: 'Peak Activity' };
  return labels[preset] || 'Custom';
}

function renderClassifyTimeline(nodeId) {
  const wrap = document.getElementById('classify-timeline');
  if (!wrap) return;
  const now = new Date();
  const cutoff = new Date(now - 2 * 3600000);
  const sessions = getNodeSessions(nodeId, cutoff, now).slice(0, 8);
  const entries = sessions.flatMap(s => s.samples).slice(-12);

  wrap.innerHTML = entries.length ? entries.map(sp => {
    const color = CLASS_COLORS[sp.classification] || '#94a3b8';
    return `
      <div class="classify-entry">
        <span class="classify-time">${formatTime(sp.timestamp)}</span>
        <span style="padding:0.15rem 0.65rem; border-radius:100px; border:1px solid ${color}44; color:${color}; font-size:0.78rem; background:${color}11;">
          ${sp.classification}
        </span>
        <span style="font-family:var(--font-mono); font-size:0.75rem; color:${dbColor(sp.db)}; margin-left:auto;">${sp.db} dB</span>
      </div>
    `;
  }).join('') : '<div style="padding:0.5rem 0; color:var(--text3); font-size:0.82rem;">No recent data</div>';
}

function renderBtStatus() {
  const bt = AppState.bluetooth;
  document.getElementById('bt-device-name').textContent = bt.connected ? bt.deviceName : 'Not Connected';
  document.getElementById('bt-device-sub').textContent = bt.connected ? 'Connected via Bluetooth' : 'Tap to scan for devices';
  document.getElementById('bt-last-sync').textContent = bt.lastSync ? timeAgo(bt.lastSync) : '—';
  document.getElementById('bt-next-sync').textContent = bt.connected ? 'in ~30m' : '—';
  document.getElementById('bt-conn-status').textContent = bt.connected ? 'Online' : 'Offline';
  const sig = document.getElementById('bt-signal');
  sig.className = `bt-signal-bars ${bt.connected ? 's' + bt.signalStrength : ''}`;
  const dot = document.querySelector('#sidebar-bt .bt-dot');
  if (dot) dot.className = `bt-dot ${bt.connected ? 'connected' : ''}`;
  const lbl = document.getElementById('sidebar-bt-label');
  if (lbl) lbl.textContent = bt.connected ? bt.deviceName : 'No Device';
}

// ── Nodes Page ────────────────────────────────────────────────
function renderNodesPage() {
  renderNodesTable(NODES);
  setTimeout(() => {
    initNodesMap();
    renderNodeMarkers();
  }, 100);
}

function renderNodesTable(nodes) {
  const tbody = document.getElementById('nodes-tbody');
  if (!tbody) return;
  tbody.innerHTML = nodes.map(node => {
    const statusClass = node.status === 'active' ? 'status-active' : node.status === 'warning' ? 'status-warning' : 'status-offline';
    return `
      <tr style="cursor:pointer;" onclick="openNodeSheet('${node.id}')">
        <td class="mono">${node.id}</td>
        <td><strong>${node.name}</strong></td>
        <td style="color:var(--text2); font-size:0.8rem;">${node.location}</td>
        <td><span class="status-badge ${statusClass}">${node.status}</span></td>
        <td class="mono" style="color:${node.battery < 25 ? 'var(--danger)' : 'var(--text2)'}">${node.battery}%</td>
        <td class="mono" style="color:${node.sdUsed > 80 ? 'var(--danger)' : 'var(--text2)'}">${node.sdUsed}%</td>
        <td style="color:var(--text3); font-size:0.78rem;">${timeAgo(node.lastSeen)}</td>
      </tr>
    `;
  }).join('');
}

// ── Recordings Page ───────────────────────────────────────────
let recPage = 1;
const REC_PER_PAGE = 15;

function renderRecordingsPage() {
  const nodeId = document.getElementById('rec-node-filter')?.value || '';
  const classFilter = document.getElementById('rec-class-filter')?.value || '';
  const fromVal = document.getElementById('rec-date-from')?.value;
  const toVal = document.getElementById('rec-date-to')?.value;

  // Populate node filter if empty
  const nf = document.getElementById('rec-node-filter');
  if (nf && nf.options.length === 1) {
    NODES.forEach(n => {
      const o = document.createElement('option');
      o.value = n.id; o.textContent = n.name;
      nf.appendChild(o);
    });
  }

  let sessions = [...ALL_SESSIONS];
  if (nodeId) sessions = sessions.filter(s => s.nodeId === nodeId);
  if (classFilter) sessions = sessions.filter(s => s.dominantClass === classFilter);
  if (fromVal) sessions = sessions.filter(s => s.timestamp >= new Date(fromVal));
  if (toVal) sessions = sessions.filter(s => s.timestamp <= new Date(toVal + 'T23:59:59'));

  document.getElementById('rec-count').textContent = `${sessions.length} sessions`;

  const start = (recPage - 1) * REC_PER_PAGE;
  const paged = sessions.slice(start, start + REC_PER_PAGE);

  const tbody = document.getElementById('rec-tbody');
  tbody.innerHTML = paged.map(s => {
    const node = NODES.find(n => n.id === s.nodeId);
    const cls = CLASS_COLORS[s.dominantClass] || '#94a3b8';
    return `
      <tr class="rec-row" data-id="${s.id}" style="cursor:pointer;">
        <td class="mono" style="font-size:0.75rem;">${formatDateTime(s.timestamp)}</td>
        <td style="font-size:0.8rem;">${node?.name || s.nodeId}</td>
        <td class="mono">${s.duration}</td>
        <td class="mono" style="color:${dbColor(s.avgDb)}">${s.avgDb}</td>
        <td class="mono" style="color:${dbColor(s.peakDb)}">${s.peakDb}</td>
        <td><span style="font-size:0.75rem; padding:0.15rem 0.55rem; border-radius:100px; border:1px solid ${cls}44; color:${cls}; background:${cls}11;">${s.dominantClass}</span></td>
        <td class="mono" style="color:var(--text3)">${s.fileSize}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="toggleRecDetail(event,'${s.id}')">▼</button></td>
      </tr>
    `;
  }).join('');

  renderPagination(sessions.length, 'rec-pagination', recPage, (p) => { recPage = p; renderRecordingsPage(); });
  renderSpikeLog(nodeId || AppState.selectedNodeId);
}

function toggleRecDetail(e, sessionId) {
  e.stopPropagation();
  const existing = document.getElementById(`detail-${sessionId}`);
  if (existing) { existing.remove(); return; }

  const session = ALL_SESSIONS.find(s => s.id === sessionId);
  if (!session) return;

  const row = document.querySelector(`[data-id="${sessionId}"]`);
  if (!row) return;

  const detail = document.createElement('tr');
  detail.id = `detail-${sessionId}`;
  detail.className = 'rec-expanded';
  detail.innerHTML = `
    <td colspan="8">
      <div class="rec-detail">
        <div class="rec-detail-inner">
          <div>
            <div style="font-size:0.78rem; font-weight:600; margin-bottom:0.5rem; color:var(--text2);">
              ${session.samples.length} samples @ 5-min intervals
            </div>
            <table class="rec-sample-table">
              <thead><tr><th>#</th><th>Timestamp</th><th>dB</th><th>Classification</th><th>Freq Peak</th></tr></thead>
              <tbody>
                ${session.samples.map(sp => `
                  <tr>
                    <td>${sp.sampleNum}</td>
                    <td style="font-family:var(--font-mono)">${formatTime(sp.timestamp)}</td>
                    <td style="font-family:var(--font-mono); color:${dbColor(sp.db)}">${sp.db}</td>
                    <td><span style="color:${CLASS_COLORS[sp.classification]||'#94a3b8'}; font-size:0.75rem;">${sp.classification}</span></td>
                    <td style="font-family:var(--font-mono); color:var(--text3)">${sp.freqPeak} Hz</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="audio-player">
              <button class="play-btn" onclick="togglePlay(this)">▶</button>
              <div class="audio-progress"><div class="audio-fill" id="ap-fill-${sessionId}"></div></div>
              <span class="audio-time">0:00 / 5:00</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:120px;">
            <div style="font-size:0.75rem; font-weight:600; color:var(--text2); margin-bottom:0.25rem;">Summary</div>
            <div style="font-size:0.78rem; display:flex; flex-direction:column; gap:0.3rem;">
              <span>Avg: <strong style="font-family:var(--font-mono)">${session.avgDb} dB</strong></span>
              <span>Peak: <strong style="font-family:var(--font-mono); color:${dbColor(session.peakDb)}">${session.peakDb} dB</strong></span>
            </div>
          </div>
        </div>
        <div class="rec-actions">
          <button class="btn btn-ghost btn-sm" onclick="downloadWav('${session.id}')">⇩ WAV</button>
          <button class="btn btn-ghost btn-sm" onclick="downloadSessionCsv('${session.id}')">⇩ CSV</button>
          <button class="btn btn-ghost btn-sm" onclick="selectNode('${session.nodeId}'); showPage('nodes')">⊕ On Map</button>
        </div>
      </div>
    </td>
  `;
  row.after(detail);
}

let playInterval = null;
function togglePlay(btn) {
  if (btn.textContent === '▶') {
    btn.textContent = '⏸';
    // Fake progress
    const fill = btn.closest('.audio-player').querySelector('.audio-fill');
    const time = btn.closest('.audio-player').querySelector('.audio-time');
    let secs = 0;
    playInterval = setInterval(() => {
      secs++;
      fill.style.width = (secs / 300 * 100) + '%';
      time.textContent = `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')} / 5:00`;
      if (secs >= 300) { clearInterval(playInterval); btn.textContent = '▶'; }
    }, 1000);
  } else {
    btn.textContent = '▶';
    clearInterval(playInterval);
  }
}

function downloadWav(sessionId) {
  showToast(`Preparing WAV for ${sessionId}…`, 'info');
  setTimeout(() => showToast('WAV downloaded (mock)', 'success'), 1200);
}
function downloadSessionCsv(sessionId) {
  const session = ALL_SESSIONS.find(s => s.id === sessionId);
  if (!session) return;
  const rows = [['SampleNum','Timestamp','DB','Classification','FreqPeak(Hz)']];
  session.samples.forEach(sp => rows.push([sp.sampleNum, sp.timestamp.toISOString(), sp.db, sp.classification, sp.freqPeak]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${sessionId}.csv`; a.click();
  showToast('CSV downloaded', 'success');
}

function renderSpikeLog(nodeId) {
  const list = document.getElementById('spike-list');
  if (!list) return;
  const spikes = getSpikeEvents(nodeId).slice(0, 10);
  list.innerHTML = spikes.length ? spikes.map(sp => `
    <div class="spike-item">
      <div class="spike-db">${sp.db} dB</div>
      <div class="spike-info">
        <div class="spike-desc">${sp.desc}</div>
        <div class="spike-meta">${formatDateTime(sp.timestamp)} · ${sp.nodeId}</div>
      </div>
    </div>
  `).join('') : '<div style="padding:0.75rem 1rem; color:var(--text3); font-size:0.82rem;">No spike events in selected range.</div>';
}

function renderPagination(total, wrapperId, currentPage, onPage) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  const pages = Math.ceil(total / REC_PER_PAGE);
  if (pages <= 1) { wrap.innerHTML = ''; return; }
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(pages, currentPage + 2);
  let html = '';
  if (start > 1) html += `<button class="page-btn" onclick="(${onPage.toString()})(1)">1</button>…`;
  for (let p = start; p <= end; p++) {
    html += `<button class="page-btn${p === currentPage ? ' active' : ''}" onclick="(${onPage.toString()})(${p})">${p}</button>`;
  }
  if (end < pages) html += `…<button class="page-btn" onclick="(${onPage.toString()})(${pages})">${pages}</button>`;
  wrap.innerHTML = html;
}

// ── Analytics Page ────────────────────────────────────────────
function renderAnalyticsPage() {
  const nodeId = AppState.selectedNodeId;
  renderHeatmap(nodeId);
  renderFftChart(nodeId);
  renderTrendChart();
  renderTrendToggles();
  renderStats(nodeId);

  // Init compliance
  const t = AppState.settings.warnDb;
  document.getElementById('comp-threshold').value = t;
  calcCompliance();
}

function calcCompliance() {
  const threshold = parseInt(document.getElementById('comp-threshold')?.value || 55);
  const fromStr = document.getElementById('comp-from')?.value || '22:00';
  const toStr = document.getElementById('comp-to')?.value || '07:00';
  const fromH = parseInt(fromStr.split(':')[0]);
  const toH = parseInt(toStr.split(':')[0]);
  renderComplianceChart(AppState.selectedNodeId, threshold, fromH, toH);
}

// ── Export Page ───────────────────────────────────────────────
function renderExportPage() {
  const wrap = document.getElementById('export-node-checks');
  if (!wrap || wrap.children.length) {
    renderExportTable();
    return;
  }
  wrap.innerHTML = '';
  NODES.forEach(node => {
    const lbl = document.createElement('label');
    lbl.innerHTML = `<input type="checkbox" value="${node.id}" checked /> ${node.name}`;
    wrap.appendChild(lbl);
  });

  // Set default dates
  const to = new Date(); const from = new Date(to - 30 * 86400000);
  document.getElementById('exp-from').value = from.toISOString().slice(0,10);
  document.getElementById('exp-to').value = to.toISOString().slice(0,10);

  renderExportTable();
}

function renderExportTable() {
  const tbody = document.getElementById('recent-exports-tbody');
  if (!tbody) return;
  tbody.innerHTML = AppState.recentExports.length ? AppState.recentExports.map(e => `
    <tr>
      <td class="mono" style="font-size:0.75rem;">${e.filename}</td>
      <td style="font-size:0.78rem; color:var(--text3);">${formatDateTime(e.date)}</td>
      <td class="mono">${e.size}</td>
      <td><a href="${e.url}" download="${e.filename}" class="btn btn-ghost btn-sm">⇩</a></td>
    </tr>
  `).join('') : '<tr><td colspan="4" style="padding:1rem; color:var(--text3); text-align:center;">No exports yet</td></tr>';
}

function doExport() {
  const nodeIds = [...document.querySelectorAll('#export-node-checks input:checked')].map(i => i.value);
  const fromDate = new Date(document.getElementById('exp-from').value);
  const toDate = new Date(document.getElementById('exp-to').value + 'T23:59:59');
  const fmt = document.querySelector('input[name="exp-fmt"]:checked')?.value || 'csv';
  const raw = document.getElementById('exp-raw')?.checked;
  const events = document.getElementById('exp-events')?.checked;
  const fft = document.getElementById('exp-fft')?.checked;
  const filename = exportData(nodeIds, fromDate, toDate, raw, events, fft, fmt);
  renderExportTable();
  showToast(`Exported: ${filename}`, 'success');
}

function generateReport() {
  const nodeId = AppState.selectedNodeId;
  const node = NODES.find(n => n.id === nodeId);
  const sessions = getNodeSessions(nodeId).slice(0, 50);
  const allDb = sessions.map(s => s.avgDb);
  const avg = allDb.length ? (allDb.reduce((a,b)=>a+b,0)/allDb.length).toFixed(1) : '—';
  const peak = allDb.length ? Math.max(...sessions.map(s=>s.peakDb)).toFixed(1) : '—';

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><title>CampusSound Report — ${node?.name}</title>
<style>
  body { font-family: Georgia, serif; max-width: 900px; margin: 2rem auto; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 1.8rem; border-bottom: 2px solid #0ea5e9; padding-bottom: 0.5rem; }
  h2 { font-size: 1.2rem; margin-top: 2rem; color: #0369a1; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.88rem; }
  th { background: #0ea5e9; color: #fff; padding: 0.5rem; text-align: left; }
  td { padding: 0.4rem; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .stat-row { display: flex; gap: 2rem; margin: 1rem 0; }
  .stat { background: #f0f9ff; border: 1px solid #bae6fd; padding: 1rem; border-radius: 8px; flex: 1; }
  .stat-val { font-size: 2rem; font-weight: bold; color: #0369a1; font-family: monospace; }
  .stat-lbl { font-size: 0.8rem; color: #64748b; }
  footer { margin-top: 3rem; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
</style>
</head><body>
<h1>CampusSound Environmental Monitoring Report</h1>
<p><strong>Node:</strong> ${node?.name} (${node?.id}) · ${node?.location}<br/>
<strong>Sensor:</strong> ${node?.sensor}<br/>
<strong>GPS:</strong> ${node?.gps}<br/>
<strong>Generated:</strong> ${new Date().toLocaleString('en-CA')}<br/>
<strong>Campus:</strong> ${AppState.settings.campusName}</p>

<h2>Summary Statistics</h2>
<div class="stat-row">
  <div class="stat"><div class="stat-val">${avg} dB</div><div class="stat-lbl">Average dB (last 30 days)</div></div>
  <div class="stat"><div class="stat-val">${peak} dB</div><div class="stat-lbl">Peak dB recorded</div></div>
  <div class="stat"><div class="stat-val">${sessions.length}</div><div class="stat-lbl">Recording sessions</div></div>
</div>

<h2>Recording Sessions (Last 50)</h2>
<table>
  <thead><tr><th>Timestamp</th><th>Avg dB</th><th>Peak dB</th><th>Dominant Class</th><th>Duration</th><th>File Size</th></tr></thead>
  <tbody>
    ${sessions.map(s => `<tr><td>${formatDateTime(s.timestamp)}</td><td>${s.avgDb}</td><td>${s.peakDb}</td><td>${s.dominantClass}</td><td>${s.duration}</td><td>${s.fileSize}</td></tr>`).join('')}
  </tbody>
</table>

<footer>
  Generated by CampusSound Monitor v1.0.0 · University of Western Ontario · 
  This report is intended for academic research purposes.
</footer>
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

// ── Settings Page ─────────────────────────────────────────────
function renderSettingsPage() {
  renderSensorTypesTable();
  renderCustomBlocks();
  // Sync apply-to-node dropdown
  const sel = document.getElementById('sched-apply-node');
  if (sel && sel.options.length === 1) {
    NODES.forEach(n => {
      const o = document.createElement('option');
      o.value = n.id; o.textContent = n.name;
      sel.appendChild(o);
    });
  }
}

function renderSensorTypesTable() {
  const tbody = document.getElementById('sensor-types-tbody');
  if (!tbody) return;
  tbody.innerHTML = SENSOR_TYPES.map((st, i) => `
    <tr>
      <td>${st.name}</td>
      <td class="mono">${st.rate}</td>
      <td class="mono">${st.bits}</td>
      <td class="mono">${st.freq}</td>
      <td style="color:var(--text3); font-size:0.78rem;">${st.notes}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="deleteSensorType(${i})">✕</button></td>
    </tr>
  `).join('');
}

function deleteSensorType(idx) {
  SENSOR_TYPES.splice(idx, 1);
  renderSensorTypesTable();
}

function addSensorTypeRow() {
  SENSOR_TYPES.push({ name: 'New Sensor', rate: '44.1 kHz', bits: '16-bit', freq: '20Hz–20kHz', notes: '' });
  renderSensorTypesTable();
  showToast('Sensor type added', 'success');
}

function renderCustomBlocks() {
  const wrap = document.getElementById('custom-blocks');
  if (!wrap) return;
  const blocks = AppState.settings.customBlocks;
  const days = ['M','T','W','T','F','S','S'];
  wrap.innerHTML = blocks.map((b, i) => `
    <div class="custom-block">
      <input type="time" value="${b.start}" onchange="updateBlock(${i},'start',this.value)" />
      <span style="color:var(--text3)">→</span>
      <input type="time" value="${b.end}" onchange="updateBlock(${i},'end',this.value)" />
      <div class="day-checks">
        ${days.map((d, di) => `<div class="day-check${b.days.includes(di)?'  on':''}" onclick="toggleBlockDay(${i},${di})">${d}</div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" onclick="removeBlock(${i})">✕</button>
    </div>
  `).join('');
}

function updateBlock(i, key, val) { AppState.settings.customBlocks[i][key] = val; }
function toggleBlockDay(i, d) {
  const b = AppState.settings.customBlocks[i];
  b.days = b.days.includes(d) ? b.days.filter(x=>x!==d) : [...b.days, d];
  renderCustomBlocks();
}
function removeBlock(i) {
  AppState.settings.customBlocks.splice(i, 1);
  renderCustomBlocks();
}
function addBlock() {
  AppState.settings.customBlocks.push({ start: '07:00', end: '09:00', days: [0,1,2,3,4] });
  renderCustomBlocks();
}
