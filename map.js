/* ============================================================
   EcoEcho — map.js  (2 devices)
   ============================================================ */

let nodesMap = null;
let nodeMarkers = {};

function initNodesMap() {
  if (nodesMap) return;
  nodesMap = L.map('nodesMap', { center: [AppState.settings.mapLat, AppState.settings.mapLng], zoom: 15, zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(nodesMap);
  renderNodeMarkers();
}

function renderNodeMarkers() {
  if (!nodesMap) return;
  Object.values(nodeMarkers).forEach(m => m.remove());
  nodeMarkers = {};

  NODES.forEach(node => {
    const color = node.status==='active'?'#7ab87a':node.status==='warning'?'#c9a85c':'#c97a6a';
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.5);animation:map-pulse-${node.id} 2s infinite;position:relative;">
        <style>@keyframes map-pulse-${node.id}{0%{box-shadow:0 0 0 0 ${color}88;}70%{box-shadow:0 0 0 10px ${color}00;}100%{box-shadow:0 0 0 0 ${color}00;}}</style>
      </div>`,
      iconSize: [16,16], iconAnchor: [8,8]
    });
    const marker = L.marker([node.lat, node.lng], {icon})
      .addTo(nodesMap)
      .bindTooltip(`<b>${node.name}</b><br/>${node.location}`, {direction:'top'});
    marker.on('click', () => openNodeSheet(node.id));
    nodeMarkers[node.id] = marker;
  });
}

function openNodeSheet(nodeId) {
  const node = NODES.find(n => n.id === nodeId);
  if (!node) return;
  const sheet = document.getElementById('node-sheet');
  const content = document.getElementById('node-sheet-content');
  const sc = node.status==='active'?'status-active':node.status==='warning'?'status-warning':'status-offline';

  const sessions = getNodeSessions(nodeId);
  const hzSum = getHzSummary(nodeId);

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
      <div>
        <div style="font-family:var(--font-head);font-weight:800;font-size:1.1rem;">${node.name}</div>
        <div style="font-size:0.8rem;color:var(--text3);">${node.location}</div>
      </div>
      <span class="status-badge ${sc}">${node.status}</span>
    </div>
    <div class="node-detail-grid">
      <div><div class="nd-label">NODE ID</div><div class="nd-val" style="font-family:var(--font-mono)">${node.id}</div></div>
      <div><div class="nd-label">SENSOR</div><div class="nd-val">${node.sensor}</div></div>
      <div><div class="nd-label">FIRMWARE</div><div class="nd-val" style="font-family:var(--font-mono)">${node.firmware}</div></div>
      <div><div class="nd-label">UPTIME</div><div class="nd-val">${node.uptime}</div></div>
      <div><div class="nd-label">GPS</div><div class="nd-val" style="font-family:var(--font-mono);font-size:0.8rem;">${node.gps}</div></div>
      <div><div class="nd-label">TIMEZONE</div><div class="nd-val">${node.timezone}</div></div>
      <div><div class="nd-label">LAST SEEN</div><div class="nd-val">${timeAgo(node.lastSeen)}</div></div>
      <div><div class="nd-label">SESSIONS</div><div class="nd-val">${sessions.length}</div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:0.75rem;">
      ${['Solar','Battery','SD Card'].map((lbl,i)=>{
        const v=[node.solar,node.battery,node.sdUsed][i];
        const cls=['solar-bar','batt-bar','sd-bar'][i];
        const warn=i===1&&v<25||i===2&&v>80;
        return `<div style="display:flex;align-items:center;gap:0.75rem;">
          <span style="font-size:0.8rem;color:var(--text3);width:60px;">${lbl}</span>
          <div class="power-bar-wrap" style="flex:1"><div class="power-bar ${cls}" style="width:${v}%"></div></div>
          <span style="font-family:var(--font-mono);font-size:0.8rem;width:35px;text-align:right;color:${warn?'var(--danger)':'var(--text2)'};">${v}%</span>
        </div>`;
      }).join('')}
    </div>
    ${hzSum.avg?`<div style="background:var(--bg3);border-radius:8px;padding:0.6rem 0.85rem;margin-bottom:0.75rem;display:flex;gap:1.5rem;">
      <div><div class="nd-label">AVG Hz</div><div style="font-family:var(--font-mono);font-weight:700;color:var(--accent3)">${hzSum.avg}</div></div>
      <div><div class="nd-label">PEAK Hz</div><div style="font-family:var(--font-mono);font-weight:700;color:var(--accent3)">${hzSum.peak}</div></div>
      <div><div class="nd-label">LOW Hz</div><div style="font-family:var(--font-mono);font-weight:700;color:var(--accent3)">${hzSum.low}</div></div>
    </div>`:''}
    ${node.notes?`<div style="background:var(--bg3);border-radius:8px;padding:0.65rem 0.85rem;font-size:0.8rem;color:var(--text2);margin-bottom:0.75rem;">📝 ${node.notes}</div>`:''}
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="selectNode('${node.id}');showPage('overview');">View Data</button>
      <button class="btn btn-ghost btn-sm" onclick="pingNode('${node.id}')">⟳ Status Ping</button>
      <button class="btn btn-ghost btn-sm" onclick="closeNodeSheet()">Close</button>
    </div>`;

  sheet.classList.add('open');
}

function closeNodeSheet() { document.getElementById('node-sheet').classList.remove('open'); }
function pingNode(id) { showToast(`Pinging ${id}… Status OK. No disruption to recorder.`, 'success'); }

document.addEventListener('click', (e) => {
  const sheet = document.getElementById('node-sheet');
  if (sheet?.classList.contains('open') && !sheet.contains(e.target) && !e.target.closest('.leaflet-marker-icon')) closeNodeSheet();
});
