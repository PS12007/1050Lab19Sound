/* ============================================================
   EcoEcho — ui.js
   All page rendering with Hz integration throughout
   ============================================================ */

function showToast(msg, type='info', duration=3000) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons={success:'✓',error:'✕',warn:'⚠',info:'ℹ'};
  const colors={success:'#7ab87a',error:'#c97a6a',warn:'#c9a85c',info:'#8fb98f'};
  t.innerHTML = `<span style="color:${colors[type]||colors.info}">${icons[type]||'ℹ'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(20px)';t.style.transition='all 0.3s';setTimeout(()=>t.remove(),300);}, duration);
}

function renderNodeBar() {
  const wrap = document.getElementById('node-tabs');
  wrap.innerHTML = '';
  NODES.forEach(node => {
    const tab = document.createElement('div');
    tab.className = `node-tab${node.id===AppState.selectedNodeId?' active':''}`;
    tab.innerHTML = `<span class="node-dot ${node.status==='active'?'green':node.status==='warning'?'yellow':'red'}"></span>${node.name}`;
    tab.onclick = () => selectNode(node.id);
    wrap.appendChild(tab);
  });
}

function selectNode(nodeId) {
  AppState.selectedNodeId = nodeId;
  renderNodeBar();
  refreshCurrentPage();
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item,.bnav-item').forEach(n=>n.classList.toggle('active',n.dataset.page===pageId));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  AppState.currentPage = pageId;
  refreshCurrentPage();
}

function refreshCurrentPage() {
  const id = AppState.currentPage;
  const node = NODES.find(n=>n.id===AppState.selectedNodeId);
  if (id==='overview')   renderOverview(node);
  if (id==='nodes')      renderNodesPage();
  if (id==='recordings') renderRecordingsPage();
  if (id==='analytics')  renderAnalyticsPage();
  if (id==='export')     renderExportPage();
  if (id==='settings')   renderSettingsPage();
}

// ── Overview ──────────────────────────────────────────────────
let gaugeAnimFrame=null, currentGaugeVal=0;

function renderOverview(node) {
  if (!node) return;
  const db = getLiveDb(node.id);
  const hz = getLiveHz(node.id);
  const status = dbStatus(db);

  // Gauge animation
  const target = db;
  if (gaugeAnimFrame) cancelAnimationFrame(gaugeAnimFrame);
  const animate = () => {
    currentGaugeVal += (target-currentGaugeVal)*0.08;
    drawGauge('gaugeCanvas', currentGaugeVal);
    document.getElementById('gauge-value').textContent = Math.round(currentGaugeVal);
    if (Math.abs(currentGaugeVal-target)>0.2) gaugeAnimFrame=requestAnimationFrame(animate);
  };
  animate();

  const tag = document.getElementById('status-tag');
  tag.textContent=status.label; tag.style.color=status.color;
  tag.style.borderColor=status.color+'44'; tag.style.background=status.color+'14';

  // Min/max/hz from sessions
  const sessions = getNodeSessions(node.id, new Date(Date.now()-86400000));
  const dbs = sessions.flatMap(s=>s.samples.map(sp=>sp.db));
  const hzs = sessions.flatMap(s=>s.samples.map(sp=>sp.hz||sp.freqPeak||500));
  document.getElementById('today-min').textContent = dbs.length?Math.min(...dbs).toFixed(0):'—';
  document.getElementById('today-max').textContent = dbs.length?Math.max(...dbs).toFixed(0):'—';
  document.getElementById('today-avghz').textContent = hzs.length?Math.round(hzs.reduce((a,b)=>a+b,0)/hzs.length):'—';

  // Power
  animateBar('solar-bar',node.solar); document.getElementById('solar-pct').textContent=node.solar+'%';
  animateBar('batt-bar',node.battery); document.getElementById('batt-pct').textContent=node.battery+'%';
  animateBar('sd-bar',node.sdUsed); document.getElementById('sd-pct').textContent=node.sdUsed+'%';

  // GPS
  document.getElementById('node-gps').textContent = node.gps;
  document.getElementById('node-tz').textContent = `${node.timezone} · UTC-5`;

  // Schedule
  document.getElementById('sched-profile').textContent = presetLabel(AppState.settings.activePreset);
  document.getElementById('sched-rate').textContent = AppState.settings.sampleRate;
  document.getElementById('sched-bit').textContent = AppState.settings.bitDepth;
  document.getElementById('next-rec').textContent = nextRecordingTime();

  // Hz summary
  const hzSum = getHzSummary(node.id);
  document.getElementById('hz-avg').textContent  = hzSum.avg  ? hzSum.avg+'Hz'  : '—';
  document.getElementById('hz-peak').textContent = hzSum.peak ? hzSum.peak+'Hz' : '—';
  document.getElementById('hz-low').textContent  = hzSum.low  ? hzSum.low+'Hz'  : '—';

  // Charts
  const activeRange = document.querySelector('.range-btn.active')?.dataset.range || '24h';
  render24hChart(node.id, activeRange);
  renderHzOverviewChart(node.id);
  renderBtStatus();
}

function animateBar(id, pct) { const el=document.getElementById(id); if(el) el.style.width=pct+'%'; }

function renderBtStatus() {
  const bt = AppState.bluetooth;
  document.getElementById('bt-device-name').textContent = bt.connected?bt.deviceName:'Not Connected';
  document.getElementById('bt-device-sub').textContent = bt.connected?'Connected via Bluetooth':'Tap to scan for devices';
  document.getElementById('bt-last-sync').textContent = bt.lastSync?timeAgo(bt.lastSync):'—';
  document.getElementById('bt-next-sync').textContent = bt.connected?'in ~30m':'—';
  document.getElementById('bt-conn-status').textContent = bt.connected?'Online':'Offline';
  document.getElementById('bt-signal').className=`bt-signal-bars ${bt.connected?'s'+bt.signalStrength:''}`;
  const dot=document.querySelector('#sidebar-bt .bt-dot');
  if (dot) dot.className=`bt-dot ${bt.connected?'connected':''}`;
  const lbl=document.getElementById('sidebar-bt-label');
  if (lbl) lbl.textContent=bt.connected?bt.deviceName:'No Device';
}

// ── Nodes ─────────────────────────────────────────────────────
function renderNodesPage() {
  renderNodesTable(NODES);
  setTimeout(()=>{ initNodesMap(); renderNodeMarkers(); }, 100);
}

function renderNodesTable(nodes) {
  const tbody=document.getElementById('nodes-tbody');
  if (!tbody) return;
  tbody.innerHTML = nodes.map(n=>{
    const sc=n.status==='active'?'status-active':n.status==='warning'?'status-warning':'status-offline';
    return `<tr style="cursor:pointer" onclick="openNodeSheet('${n.id}')">
      <td class="mono">${n.id}</td>
      <td><strong>${n.name}</strong></td>
      <td style="color:var(--text2);font-size:0.8rem;">${n.location}</td>
      <td><span class="status-badge ${sc}">${n.status}</span></td>
      <td class="mono" style="color:${n.battery<25?'var(--danger)':'var(--text2)'}">${n.battery}%</td>
      <td class="mono" style="color:${n.sdUsed>80?'var(--danger)':'var(--text2)'}">${n.sdUsed}%</td>
      <td style="color:var(--text3);font-size:0.78rem;">${timeAgo(n.lastSeen)}</td>
    </tr>`;
  }).join('');
}

// ── Recordings ────────────────────────────────────────────────
let recPage = 1;
const REC_PER_PAGE = 15;

function renderRecordingsPage() {
  const nodeId   = document.getElementById('rec-node-filter')?.value || '';
  const fromVal  = document.getElementById('rec-date-from')?.value;
  const toVal    = document.getElementById('rec-date-to')?.value;

  const nf = document.getElementById('rec-node-filter');
  if (nf && nf.options.length===1) {
    NODES.forEach(n=>{ const o=document.createElement('option'); o.value=n.id; o.textContent=n.name; nf.appendChild(o); });
  }

  let sessions = [...ALL_SESSIONS];
  if (nodeId)  sessions = sessions.filter(s=>s.nodeId===nodeId);
  if (fromVal) sessions = sessions.filter(s=>s.timestamp>=new Date(fromVal));
  if (toVal)   sessions = sessions.filter(s=>s.timestamp<=new Date(toVal+'T23:59:59'));

  // One per node (most recent)
  const seen = new Set();
  sessions = sessions.filter(s=>{ if(seen.has(s.nodeId)) return false; seen.add(s.nodeId); return true; });

  document.getElementById('rec-count').textContent = `${sessions.length} sessions`;

  document.getElementById('rec-tbody').innerHTML = sessions.map(s=>{
    const node = NODES.find(n=>n.id===s.nodeId);
    return `<tr class="rec-row" data-id="${s.id}" style="cursor:pointer;">
      <td class="mono" style="font-size:0.75rem;">${formatDateTime(s.timestamp)}</td>
      <td style="font-size:0.82rem;">${node?.name||s.nodeId}</td>
      <td class="mono">${s.duration}</td>
      <td class="mono" style="color:${dbColor(s.avgDb)}">${s.avgDb}</td>
      <td class="mono" style="color:${dbColor(s.peakDb)}">${s.peakDb}</td>
      <td class="mono" style="color:${hzColor(s.avgHz||0)}">${s.avgHz||'—'}</td>
      <td class="mono" style="color:${hzColor(s.peakHz||0)}">${s.peakHz||'—'}</td>
      <td class="mono" style="color:var(--text3)">${s.fileSize}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="toggleRecDetail(event,'${s.id}')">▼</button></td>
    </tr>`;
  }).join('');

  renderSpikeLog(nodeId||AppState.selectedNodeId);
}

function toggleRecDetail(e, sessionId) {
  e.stopPropagation();
  const existing = document.getElementById(`detail-${sessionId}`);
  if (existing) { existing.remove(); return; }
  const session = ALL_SESSIONS.find(s=>s.id===sessionId);
  if (!session) return;
  const row = document.querySelector(`[data-id="${sessionId}"]`);
  if (!row) return;

  const detail = document.createElement('tr');
  detail.id = `detail-${sessionId}`;
  detail.className = 'rec-expanded';
  detail.innerHTML = `
    <td colspan="9">
      <div class="rec-detail">
        <div class="rec-detail-inner">
          <div>
            <div style="font-size:0.78rem;font-weight:600;margin-bottom:0.5rem;color:var(--text2);">${session.samples.length} samples @ 5-min intervals</div>
            <table class="rec-sample-table">
              <thead><tr><th>#</th><th>Time</th><th>dB</th><th>Hz</th></tr></thead>
              <tbody>${session.samples.map(sp=>`
                <tr>
                  <td>${sp.sampleNum}</td>
                  <td style="font-family:var(--font-mono)">${formatTime(sp.timestamp)}</td>
                  <td style="font-family:var(--font-mono);color:${dbColor(sp.db)}">${sp.db}</td>
                  <td style="font-family:var(--font-mono);color:${hzColor(sp.hz||sp.freqPeak||0)}">${sp.hz||sp.freqPeak||'—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
            <div class="audio-player">
              <button class="play-btn" onclick="togglePlay(this)">▶</button>
              <div class="audio-progress"><div class="audio-fill"></div></div>
              <span class="audio-time">0:00 / 5:00</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.4rem;min-width:130px;">
            <div style="font-size:0.75rem;font-weight:600;color:var(--text2);margin-bottom:0.2rem;">Summary</div>
            <span style="font-size:0.78rem;">Avg dB: <strong style="font-family:var(--font-mono)">${session.avgDb}</strong></span>
            <span style="font-size:0.78rem;">Peak dB: <strong style="font-family:var(--font-mono);color:${dbColor(session.peakDb)}">${session.peakDb}</strong></span>
            <span style="font-size:0.78rem;">Avg Hz: <strong style="font-family:var(--font-mono);color:var(--accent3)">${session.avgHz||'—'}</strong></span>
            <span style="font-size:0.78rem;">Peak Hz: <strong style="font-family:var(--font-mono);color:var(--accent3)">${session.peakHz||'—'}</strong></span>
          </div>
        </div>
        <div class="rec-actions">
          <button class="btn btn-ghost btn-sm" onclick="downloadWav('${session.id}')">⇩ WAV</button>
          <button class="btn btn-ghost btn-sm" onclick="downloadSessionCsv('${session.id}')">⇩ CSV</button>
          <button class="btn btn-ghost btn-sm" onclick="selectNode('${session.nodeId}');showPage('nodes')">⊕ Map</button>
        </div>
      </div>
    </td>`;
  row.after(detail);
}

let playInterval=null;
function togglePlay(btn) {
  if (btn.textContent==='▶') {
    btn.textContent='⏸';
    const fill=btn.closest('.audio-player').querySelector('.audio-fill');
    const time=btn.closest('.audio-player').querySelector('.audio-time');
    let secs=0;
    playInterval=setInterval(()=>{ secs++; fill.style.width=(secs/300*100)+'%'; time.textContent=`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')} / 5:00`; if(secs>=300){clearInterval(playInterval);btn.textContent='▶';} }, 1000);
  } else { btn.textContent='▶'; clearInterval(playInterval); }
}

function downloadWav(sid) { showToast(`WAV preview — use Export tab for full WAV with Hz data`, 'info', 4000); }
function downloadSessionCsv(sessionId) {
  const s = ALL_SESSIONS.find(s=>s.id===sessionId);
  if (!s) return;
  const rows=[['SampleNum','Timestamp','dB','Hz']];
  s.samples.forEach(sp=>rows.push([sp.sampleNum,sp.timestamp.toISOString(),sp.db,sp.hz||sp.freqPeak||'']));
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${sessionId}.csv`; a.click();
  showToast('CSV downloaded','success');
}

function renderSpikeLog(nodeId) {
  const list=document.getElementById('spike-list');
  if (!list) return;
  const spikes=getSpikeEvents(nodeId).slice(0,10);
  list.innerHTML=spikes.length?spikes.map(sp=>`
    <div class="spike-item">
      <div class="spike-db">${sp.db} dB</div>
      <div class="spike-info">
        <div class="spike-desc">${sp.desc}</div>
        <div class="spike-meta">${formatDateTime(sp.timestamp)} · ${sp.nodeId}</div>
      </div>
    </div>`).join(''):'<div style="padding:0.75rem 1rem;color:var(--text3);font-size:0.82rem;">No spike events in range.</div>';
}

// ── Analytics ─────────────────────────────────────────────────
function renderAnalyticsPage() {
  const nodeId = AppState.selectedNodeId;
  renderHeatmap(nodeId);
  renderFftChart(nodeId);
  renderTrendChart();
  renderTrendToggles();
  renderHzTrendChart();
  renderStats(nodeId);
  document.getElementById('comp-threshold').value = AppState.settings.warnDb;
  calcCompliance();
}

function calcCompliance() {
  const threshold=parseInt(document.getElementById('comp-threshold')?.value||55);
  const fh=parseInt((document.getElementById('comp-from')?.value||'22:00').split(':')[0]);
  const th=parseInt((document.getElementById('comp-to')?.value||'07:00').split(':')[0]);
  renderComplianceChart(AppState.selectedNodeId,threshold,fh,th);
}

// ── Export ────────────────────────────────────────────────────
function renderExportPage() {
  const wrap=document.getElementById('export-node-checks');
  if (!wrap||wrap.children.length) { renderExportTable(); populateWavNodeSelect(); return; }
  wrap.innerHTML='';
  NODES.forEach(n=>{ const lbl=document.createElement('label'); lbl.innerHTML=`<input type="checkbox" value="${n.id}" checked /> ${n.name}`; wrap.appendChild(lbl); });
  const to=new Date(), from=new Date(to-30*86400000);
  document.getElementById('exp-from').value=from.toISOString().slice(0,10);
  document.getElementById('exp-to').value=to.toISOString().slice(0,10);
  populateWavNodeSelect();
  renderExportTable();
}

function populateWavNodeSelect() {
  const sel=document.getElementById('wav-node-select');
  if (!sel||sel.options.length) return;
  NODES.forEach(n=>{ const o=document.createElement('option'); o.value=n.id; o.textContent=n.name; sel.appendChild(o); });
}

function renderExportTable() {
  const tbody=document.getElementById('recent-exports-tbody');
  if (!tbody) return;
  tbody.innerHTML=AppState.recentExports.length?AppState.recentExports.map(e=>`
    <tr>
      <td class="mono" style="font-size:0.75rem;">${e.filename}</td>
      <td style="font-size:0.78rem;color:var(--text3);">${formatDateTime(e.date)}</td>
      <td class="mono">${e.size}</td>
      <td><a href="${e.url}" download="${e.filename}" class="btn btn-ghost btn-sm">⇩</a></td>
    </tr>`).join(''):'<tr><td colspan="4" style="padding:1rem;color:var(--text3);text-align:center;">No exports yet</td></tr>';
}

function doExport() {
  const nodeIds=[...document.querySelectorAll('#export-node-checks input:checked')].map(i=>i.value);
  const fromDate=new Date(document.getElementById('exp-from').value);
  const toDate=new Date(document.getElementById('exp-to').value+'T23:59:59');
  const fmt=document.querySelector('input[name="exp-fmt"]:checked')?.value||'csv';
  const raw=document.getElementById('exp-raw')?.checked;
  const events=document.getElementById('exp-events')?.checked;
  const filename=exportData(nodeIds,fromDate,toDate,raw,events,fmt);
  renderExportTable();
  showToast(`Exported: ${filename}`,'success');
}

function generateReport() {
  const nodeId=AppState.selectedNodeId;
  const node=NODES.find(n=>n.id===nodeId);
  const sessions=getNodeSessions(nodeId).slice(0,50);
  const allDb=sessions.map(s=>s.avgDb);
  const allHz=sessions.map(s=>s.avgHz||0).filter(Boolean);
  const avg=allDb.length?(allDb.reduce((a,b)=>a+b,0)/allDb.length).toFixed(1):'—';
  const peak=allDb.length?Math.max(...sessions.map(s=>s.peakDb)).toFixed(1):'—';
  const avgHz=allHz.length?Math.round(allHz.reduce((a,b)=>a+b,0)/allHz.length):'—';
  const win=window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>EcoEcho Report — ${node?.name}</title>
<style>body{font-family:Georgia,serif;max-width:900px;margin:2rem auto;color:#1a1a1a;line-height:1.6;}
h1{font-size:1.8rem;border-bottom:2px solid #4a7c59;padding-bottom:0.5rem;}
h2{font-size:1.2rem;margin-top:2rem;color:#4a7c59;}
table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.88rem;}
th{background:#4a7c59;color:#fff;padding:0.5rem;text-align:left;}
td{padding:0.4rem;border-bottom:1px solid #e2e8f0;}
tr:nth-child(even) td{background:#f5f9f5;}
.stat-row{display:flex;gap:2rem;margin:1rem 0;}
.stat{background:#f0f9f0;border:1px solid #a8c9a8;padding:1rem;border-radius:8px;flex:1;}
.stat-val{font-size:2rem;font-weight:bold;color:#4a7c59;font-family:monospace;}
.stat-lbl{font-size:0.8rem;color:#64748b;}
footer{margin-top:3rem;font-size:0.75rem;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:1rem;}</style>
</head><body>
<h1>EcoEcho Environmental Monitoring Report</h1>
<p><strong>Device:</strong> ${node?.name} (${node?.id})<br/><strong>Location:</strong> ${node?.location}<br/>
<strong>Sensor:</strong> ${node?.sensor}<br/><strong>GPS:</strong> ${node?.gps}<br/>
<strong>Generated:</strong> ${new Date().toLocaleString('en-CA')}</p>
<h2>Summary Statistics</h2>
<div class="stat-row">
  <div class="stat"><div class="stat-val">${avg} dB</div><div class="stat-lbl">Average dB</div></div>
  <div class="stat"><div class="stat-val">${peak} dB</div><div class="stat-lbl">Peak dB</div></div>
  <div class="stat"><div class="stat-val">${avgHz} Hz</div><div class="stat-lbl">Avg Frequency</div></div>
  <div class="stat"><div class="stat-val">${sessions.length}</div><div class="stat-lbl">Sessions</div></div>
</div>
<h2>Recording Sessions</h2>
<table><thead><tr><th>Timestamp</th><th>Avg dB</th><th>Peak dB</th><th>Avg Hz</th><th>Peak Hz</th><th>Duration</th></tr></thead>
<tbody>${sessions.map(s=>`<tr><td>${formatDateTime(s.timestamp)}</td><td>${s.avgDb}</td><td>${s.peakDb}</td><td>${s.avgHz||'—'}</td><td>${s.peakHz||'—'}</td><td>${s.duration}</td></tr>`).join('')}</tbody>
</table>
<footer>Generated by EcoEcho Monitor v1.0.0 · Environmental Sound Research</footer>
</body></html>`);
  win.document.close();
}

// ── Settings ──────────────────────────────────────────────────
function renderSettingsPage() {
  renderSensorTypesTable(); renderCustomBlocks();
  const sel=document.getElementById('sched-apply-node');
  if (sel&&sel.options.length===1) NODES.forEach(n=>{ const o=document.createElement('option'); o.value=n.id; o.textContent=n.name; sel.appendChild(o); });
}

function renderSensorTypesTable() {
  const tbody=document.getElementById('sensor-types-tbody');
  if (!tbody) return;
  tbody.innerHTML=SENSOR_TYPES.map((st,i)=>`
    <tr><td>${st.name}</td><td class="mono">${st.rate}</td><td class="mono">${st.bits}</td><td class="mono">${st.freq}</td>
    <td style="color:var(--text3);font-size:0.78rem;">${st.notes}</td>
    <td><button class="btn btn-ghost btn-sm" onclick="deleteSensorType(${i})">✕</button></td></tr>`).join('');
}
function deleteSensorType(i) { SENSOR_TYPES.splice(i,1); renderSensorTypesTable(); }
function addSensorTypeRow() { SENSOR_TYPES.push({name:'New Sensor',rate:'44.1 kHz',bits:'16-bit',freq:'20Hz–20kHz',notes:''}); renderSensorTypesTable(); showToast('Sensor type added','success'); }

function renderCustomBlocks() {
  const wrap=document.getElementById('custom-blocks');
  if (!wrap) return;
  const days=['M','T','W','T','F','S','S'];
  wrap.innerHTML=AppState.settings.customBlocks.map((b,i)=>`
    <div class="custom-block">
      <input type="time" value="${b.start}" onchange="updateBlock(${i},'start',this.value)" />
      <span style="color:var(--text3)">→</span>
      <input type="time" value="${b.end}" onchange="updateBlock(${i},'end',this.value)" />
      <div class="day-checks">${days.map((d,di)=>`<div class="day-check${b.days.includes(di)?' on':''}" onclick="toggleBlockDay(${i},${di})">${d}</div>`).join('')}</div>
      <button class="btn btn-ghost btn-sm" onclick="removeBlock(${i})">✕</button>
    </div>`).join('');
}
function updateBlock(i,k,v) { AppState.settings.customBlocks[i][k]=v; }
function toggleBlockDay(i,d) { const b=AppState.settings.customBlocks[i]; b.days=b.days.includes(d)?b.days.filter(x=>x!==d):[...b.days,d]; renderCustomBlocks(); }
function removeBlock(i) { AppState.settings.customBlocks.splice(i,1); renderCustomBlocks(); }
function addBlock() { AppState.settings.customBlocks.push({start:'07:00',end:'09:00',days:[0,1,2,3,4]}); renderCustomBlocks(); }
