/* ============================================================
   EcoEcho — charts.js
   All Chart.js and gauge rendering, including Hz charts
   ============================================================ */

let chart24hInstance = null, fftChartInstance = null;
let trendChartInstance = null, compChartInstance = null;
let hzTrendChartInstance = null, hzOverviewChartInstance = null;

Chart.defaults.font.family = "'Space Mono', monospace";
Chart.defaults.font.size = 10;
Chart.defaults.color = '#a8bea8';

const GC = {
  grid:    'rgba(143,185,143,0.08)',
  text:    '#a8bea8',
  text3:   '#6e896e',
  accent:  '#8fb98f',
  accent2: '#a8c9a8',
  accent3: '#b5c9a1',
  hz:      '#b5c9a1',
  border:  'rgba(143,185,143,0.18)'
};

// ── Gauge ─────────────────────────────────────────────────────
function drawGauge(canvasId, value) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx = W/2, cy = H-20;
  const r = Math.min(W, H*1.8)*0.42;
  const start = Math.PI, clamped = Math.max(0, Math.min(100, value));
  const frac = clamped / 100;

  ctx.beginPath(); ctx.arc(cx,cy,r,start,2*Math.PI);
  ctx.strokeStyle='rgba(143,185,143,0.15)'; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();

  const zones = [
    {from:0,to:0.45,color:'#7ab87a'},{from:0.45,to:0.60,color:'#8fb98f'},
    {from:0.60,to:0.75,color:'#c9a85c'},{from:0.75,to:0.85,color:'#c98a5c'},
    {from:0.85,to:1.00,color:'#c97a6a'}
  ];
  zones.forEach(z => {
    ctx.beginPath(); ctx.arc(cx,cy,r,start+z.from*Math.PI,start+z.to*Math.PI);
    ctx.strokeStyle=z.color+'55'; ctx.lineWidth=14; ctx.lineCap='butt'; ctx.stroke();
  });

  const color = value<45?'#7ab87a':value<60?'#8fb98f':value<75?'#c9a85c':value<85?'#c98a5c':'#c97a6a';
  const valAngle = start+frac*Math.PI;
  ctx.beginPath(); ctx.arc(cx,cy,r,start,valAngle);
  ctx.strokeStyle=color+'44'; ctx.lineWidth=22; ctx.lineCap='round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,r,start,valAngle);
  ctx.strokeStyle=color; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();

  const nx=cx+(r-18)*Math.cos(valAngle), ny=cy+(r-18)*Math.sin(valAngle);
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(nx,ny);
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,5,0,2*Math.PI); ctx.fillStyle='#ffffff'; ctx.fill();

  for (let i=0;i<=10;i++) {
    const a=start+(i/10)*Math.PI;
    const inner=r-22, outer=i%5===0?r-10:r-16;
    ctx.beginPath(); ctx.moveTo(cx+inner*Math.cos(a),cy+inner*Math.sin(a));
    ctx.lineTo(cx+outer*Math.cos(a),cy+outer*Math.sin(a));
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=i%5===0?2:1; ctx.stroke();
  }

  ctx.font='10px Space Mono,monospace'; ctx.fillStyle='#6e896e';
  ctx.textAlign='left'; ctx.fillText('0',cx-r-4,cy+14);
  ctx.textAlign='right'; ctx.fillText('100',cx+r+6,cy+14);
}

// ── 24h/7d/30d Line Chart ────────────────────────────────────
function render24hChart(nodeId, range='24h') {
  const canvas = document.getElementById('chart24h');
  if (!canvas) return;
  let points, labelFn;
  if (range==='24h') { points=get24hHistory(nodeId); labelFn=p=>formatTime(p.t); }
  else if (range==='7d') { points=getNdayHistory(nodeId,7); labelFn=p=>formatDate(p.t); }
  else { points=getNdayHistory(nodeId,30); labelFn=p=>formatDate(p.t); }

  if (chart24hInstance) chart24hInstance.destroy();
  chart24hInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: points.map(p=>labelFn(p)),
      datasets: [{
        label: 'dB SPL', data: points.map(p=>p.db),
        borderColor: GC.accent, borderWidth: 2, pointRadius: 0, fill: true,
        backgroundColor: (ctx) => {
          const g=ctx.chart.ctx.createLinearGradient(0,0,0,ctx.chart.height);
          g.addColorStop(0,GC.accent+'44'); g.addColorStop(1,GC.accent+'00'); return g;
        }, tension: 0.3
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: {
        legend:{display:false},
        tooltip:{backgroundColor:'#243329',borderColor:GC.accent,borderWidth:1,callbacks:{label:ctx=>` ${ctx.raw.toFixed(1)} dB`}},
        annotation:{annotations:{
          warnLine:{type:'line',yMin:AppState.settings.warnDb,yMax:AppState.settings.warnDb,borderColor:'#c9a85c44',borderWidth:1,borderDash:[4,4]},
          critLine:{type:'line',yMin:AppState.settings.critDb,yMax:AppState.settings.critDb,borderColor:'#c97a6a44',borderWidth:1,borderDash:[4,4]}
        }}
      },
      scales:{
        x:{grid:{color:GC.grid},ticks:{color:GC.text3,maxTicksLimit:8,maxRotation:0},border:{color:GC.border}},
        y:{min:20,max:100,grid:{color:GC.grid},ticks:{color:GC.text3,callback:v=>v+' dB'},border:{color:GC.border}}
      }
    }
  });
}

// ── Hz Overview Chart (bar distribution) ──────────────────────
function renderHzOverviewChart(nodeId) {
  const canvas = document.getElementById('hzOverviewChart');
  if (!canvas) return;

  const sessions = getNodeSessions(nodeId);
  const allHz = sessions.flatMap(s => s.samples.map(sp => sp.hz || sp.freqPeak || 500));

  const bandEdges = [0,100,250,500,1000,2000,5000,10000,20001];
  const bandLabels = ['<100','100–250','250–500','500–1k','1–2k','2–5k','5–10k','10k+'];
  const counts = Array(8).fill(0);
  allHz.forEach(h => {
    for (let i=0;i<bandEdges.length-1;i++) {
      if (h>=bandEdges[i] && h<bandEdges[i+1]) { counts[i]++; break; }
    }
  });

  if (hzOverviewChartInstance) hzOverviewChartInstance.destroy();
  hzOverviewChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: bandLabels,
      datasets: [{
        data: counts,
        backgroundColor: ['#7ab87a99','#8fb98f99','#a8c9a899','#b5c9a199','#c9a85c99','#c98a5c99','#c97a6a99','#a07a7a99'],
        borderRadius: 4
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw} readings`}}},
      scales:{
        x:{grid:{color:GC.grid},ticks:{color:GC.text3,font:{size:9}},border:{color:GC.border}},
        y:{grid:{color:GC.grid},ticks:{color:GC.text3},border:{color:GC.border}}
      }
    }
  });
}

// ── FFT Chart ─────────────────────────────────────────────────
function renderFftChart(nodeId) {
  const canvas = document.getElementById('fftChart');
  if (!canvas) return;
  const fft = getFftData(nodeId);
  const colors = ['#7ab87a','#8fb98f','#a8c9a8','#b5c9a1','#c9a85c','#c98a5c','#c97a6a'];

  if (fftChartInstance) fftChartInstance.destroy();
  fftChartInstance = new Chart(canvas, {
    type:'bar',
    data:{labels:fft.labels,datasets:[{data:fft.values,backgroundColor:colors.map(c=>c+'bb'),borderColor:colors,borderWidth:1,borderRadius:4}]},
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toFixed(1)}%`}}},
      scales:{
        x:{grid:{color:GC.grid},ticks:{color:GC.text3,font:{size:9}},border:{color:GC.border}},
        y:{grid:{color:GC.grid},ticks:{color:GC.text3,callback:v=>v+'%'},border:{color:GC.border}}
      }
    }
  });
}

// ── 30-Day Trend Chart (dB) ───────────────────────────────────
const TREND_COLORS = ['#8fb98f','#c9a85c'];
let activeTrendNodes = null;

function renderTrendChart(visibleNodeIds) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  if (!visibleNodeIds) visibleNodeIds = NODES.map(n=>n.id);
  activeTrendNodes = visibleNodeIds;

  const trendData = getTrendData();
  const allDates = new Set();
  NODES.forEach(n => (trendData[n.id]||[]).forEach(p=>allDates.add(p.t.toISOString().slice(0,10))));
  const labels = [...allDates].sort();

  const datasets = NODES.map((node,i) => {
    if (!visibleNodeIds.includes(node.id)) return null;
    const byDate = {};
    (trendData[node.id]||[]).forEach(p=>byDate[p.t.toISOString().slice(0,10)]=p.db);
    return { label:node.name, data:labels.map(d=>byDate[d]||null), borderColor:TREND_COLORS[i]||'#8fb98f', backgroundColor:(TREND_COLORS[i]||'#8fb98f')+'22', borderWidth:2, pointRadius:0, tension:0.3, fill:false, spanGaps:true };
  }).filter(Boolean);

  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(canvas, {
    type:'line', data:{labels,datasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,backgroundColor:'#243329',borderColor:'#8fb98f44',borderWidth:1}},
      scales:{
        x:{grid:{color:GC.grid},ticks:{color:GC.text3,maxTicksLimit:8,maxRotation:0},border:{color:GC.border}},
        y:{min:20,max:100,grid:{color:GC.grid},ticks:{color:GC.text3,callback:v=>v+' dB'},border:{color:GC.border}}
      }
    }
  });
}

function renderTrendToggles() {
  const wrap = document.getElementById('trend-toggles');
  if (!wrap) return;
  wrap.innerHTML = '';
  NODES.forEach((node,i) => {
    const btn = document.createElement('button');
    btn.className = 'trend-toggle';
    btn.textContent = node.name;
    const color = TREND_COLORS[i]||'#8fb98f';
    btn.style.borderColor = color; btn.style.color = color;
    if (!activeTrendNodes || activeTrendNodes.includes(node.id)) btn.style.background = color+'33';
    btn.onclick = () => {
      let cur = activeTrendNodes || NODES.map(n=>n.id);
      cur = cur.includes(node.id) ? cur.filter(id=>id!==node.id) : [...cur,node.id];
      renderTrendChart(cur); renderTrendToggles();
    };
    wrap.appendChild(btn);
  });
}

// ── Hz Trend Chart ────────────────────────────────────────────
function renderHzTrendChart() {
  const canvas = document.getElementById('hzTrendChart');
  if (!canvas) return;

  const trendData = getTrendData();
  const allDates = new Set();
  NODES.forEach(n => (trendData[n.id]||[]).forEach(p=>allDates.add(p.t.toISOString().slice(0,10))));
  const labels = [...allDates].sort();

  const datasets = NODES.map((node,i) => {
    const byDate = {};
    (trendData[node.id]||[]).forEach(p=>byDate[p.t.toISOString().slice(0,10)]=p.hz||500);
    const color = i===0?'#b5c9a1':'#c9a85c';
    return { label:node.name, data:labels.map(d=>byDate[d]||null), borderColor:color, backgroundColor:color+'22', borderWidth:2, pointRadius:0, tension:0.3, fill:false, spanGaps:true };
  });

  if (hzTrendChartInstance) hzTrendChartInstance.destroy();
  hzTrendChartInstance = new Chart(canvas, {
    type:'line', data:{labels,datasets},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,backgroundColor:'#243329',callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.raw?.toFixed(0)||'—'} Hz`}}},
      scales:{
        x:{grid:{color:GC.grid},ticks:{color:GC.text3,maxTicksLimit:8,maxRotation:0},border:{color:GC.border}},
        y:{grid:{color:GC.grid},ticks:{color:GC.text3,callback:v=>v+' Hz'},border:{color:GC.border}}
      }
    }
  });
}

// ── Compliance Chart ──────────────────────────────────────────
function renderComplianceChart(nodeId, threshold, fromH, toH) {
  const canvas = document.getElementById('compChart');
  if (!canvas) return;
  const sessions = getNodeSessions(nodeId).slice(0,30*16);
  const byDay = {};
  sessions.forEach(s => {
    const h = s.timestamp.getHours();
    const inQ = fromH>toH ? (h>=fromH||h<toH) : (h>=fromH&&h<toH);
    if (!inQ) return;
    const k = s.timestamp.toISOString().slice(0,10);
    if (!byDay[k]) byDay[k]={total:0,compliant:0};
    byDay[k].total++; if(s.avgDb<=threshold) byDay[k].compliant++;
  });
  const days = Object.keys(byDay).sort().slice(-14);
  const scores = days.map(d=>byDay[d].total>0?Math.round(byDay[d].compliant/byDay[d].total*100):100);
  const overall = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  document.getElementById('comp-score').textContent = overall+'%';
  document.getElementById('comp-score').style.color = overall>=80?'#7ab87a':overall>=60?'#c9a85c':'#c97a6a';

  if (compChartInstance) compChartInstance.destroy();
  compChartInstance = new Chart(canvas,{
    type:'bar',
    data:{labels:days.map(d=>formatDate(new Date(d))),datasets:[{data:scores,backgroundColor:scores.map(s=>s>=80?'#7ab87a99':s>=60?'#c9a85c99':'#c97a6a99'),borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw}%`}}},
      scales:{x:{grid:{display:false},ticks:{color:GC.text3,maxRotation:45},border:{color:GC.border}},y:{min:0,max:100,grid:{color:GC.grid},ticks:{color:GC.text3,callback:v=>v+'%'},border:{color:GC.border}}}}
  });
}

// ── Heatmap ───────────────────────────────────────────────────
function renderHeatmap(nodeId) {
  const wrap = document.getElementById('heatmap-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  const data = getHeatmapData(nodeId);
  const table = document.createElement('div');
  table.style.cssText='display:flex;flex-direction:column;gap:2px;min-width:700px;';

  const hourRow = document.createElement('div');
  hourRow.style.cssText='display:flex;gap:2px;margin-left:36px;';
  for (let h=0;h<24;h++) {
    const lbl=document.createElement('div');
    lbl.style.cssText='width:26px;text-align:center;font-family:Space Mono,monospace;font-size:9px;color:#6e896e;';
    lbl.textContent=h%3===0?String(h).padStart(2,'0'):'';
    hourRow.appendChild(lbl);
  }
  table.appendChild(hourRow);

  data.forEach(row => {
    const rowEl=document.createElement('div'); rowEl.style.cssText='display:flex;gap:2px;align-items:center;';
    const dayLbl=document.createElement('div');
    dayLbl.style.cssText='font-family:Space Mono,monospace;font-size:10px;color:#6e896e;width:30px;flex-shrink:0;';
    dayLbl.textContent=row.day; rowEl.appendChild(dayLbl);
    row.values.forEach((db,h)=>{
      const cell=document.createElement('div');
      cell.style.cssText=`width:26px;height:22px;border-radius:3px;background:${heatColor(db)};cursor:default;`;
      cell.title=`${row.day} ${String(h).padStart(2,'0')}:00 — ${db} dB`;
      rowEl.appendChild(cell);
    });
    table.appendChild(rowEl);
  });

  const legend=document.createElement('div');
  legend.style.cssText='display:flex;align-items:center;gap:6px;margin-top:8px;margin-left:36px;font-family:Space Mono,monospace;font-size:9px;color:#6e896e;';
  legend.innerHTML='<span>Quiet</span>';
  [30,40,50,60,70,80,90].forEach(db=>{
    const s=document.createElement('div');
    s.style.cssText=`width:20px;height:14px;border-radius:2px;background:${heatColor(db)};`;
    legend.appendChild(s);
  });
  legend.innerHTML+='<span>Loud</span>';
  table.appendChild(legend);
  wrap.appendChild(table);
}

function heatColor(db) {
  if (db<35) return '#1e2d23';
  if (db<45) return '#2d4a30';
  if (db<50) return '#3a5e3a';
  if (db<55) return '#4a7a4a';
  if (db<60) return '#6a9e6a';
  if (db<65) return '#8fb98f';
  if (db<70) return '#c9a85c';
  if (db<75) return '#c98a5c';
  if (db<80) return '#b86a4a';
  if (db<85) return '#a05040';
  return '#8a3a30';
}

// ── Stats ─────────────────────────────────────────────────────
function renderStats(nodeId) {
  const wrap = document.getElementById('stats-grid');
  if (!wrap) return;
  const sessions = getNodeSessions(nodeId);
  const recent = getNodeSessions(nodeId, new Date(Date.now()-7*86400000));
  const allDb = sessions.map(s=>s.avgDb);
  const allPeak = sessions.map(s=>s.peakDb);
  const allHz = sessions.map(s=>s.avgHz||500).filter(Boolean);
  const avgDb = recent.length ? (recent.reduce((a,b)=>a+b.avgDb,0)/recent.length).toFixed(1) : '—';
  const peakDb = allPeak.length ? Math.max(...allPeak).toFixed(1) : '—';
  const avgHz = allHz.length ? Math.round(allHz.reduce((a,b)=>a+b,0)/allHz.length) : '—';
  const peakHz = sessions.length ? Math.max(...sessions.map(s=>s.peakHz||0)) : '—';

  wrap.innerHTML = [
    {val:`${avgDb} dB`,   label:'Avg dB this week'},
    {val:`${peakDb} dB`,  label:'Loudest event'},
    {val:`${avgHz} Hz`,   label:'Avg frequency'},
    {val:`${peakHz} Hz`,  label:'Peak frequency'}
  ].map(s=>`<div class="stat-box"><div class="stat-box-val">${s.val}</div><div class="stat-box-label">${s.label}</div></div>`).join('');
}

// ── CSV Charts (called from app.js) ──────────────────────────
let csvLineChart=null, csvHzLineChart=null, csvHourChart=null;
let csvHzDistChart=null, csvDistChart=null, csvDailyChart=null;

function renderCsvCharts(rows, filename) {
  document.getElementById('csv-results').classList.remove('hidden');
  document.getElementById('csv-drop-zone').style.display='none';
  document.getElementById('csv-file-label').textContent = filename;

  const dbs = rows.map(r=>r.db);
  const hzs = rows.map(r=>r.hz);
  const avg = dbs.reduce((a,b)=>a+b,0)/dbs.length;
  const avgHz = hzs.reduce((a,b)=>a+b,0)/hzs.length;
  const spanDays = Math.max(1,Math.round((rows[rows.length-1].ts-rows[0].ts)/86400000));

  document.getElementById('csv-stats-row').innerHTML = [
    {v:rows.length,         l:'Total readings'},
    {v:`${avg.toFixed(1)} dB`,  l:'Avg dB'},
    {v:`${Math.max(...dbs).toFixed(1)} dB`, l:'Peak dB'},
    {v:`${Math.min(...dbs).toFixed(1)} dB`, l:'Min dB'},
    {v:`${Math.round(avgHz)} Hz`,            l:'Avg Hz'},
    {v:`${Math.max(...hzs)} Hz`,             l:'Peak Hz'},
    {v:`${((dbs.filter(d=>d>=70).length/dbs.length)*100).toFixed(1)}%`, l:'Readings ≥ 70 dB'},
    {v:spanDays, l:'Days spanned'}
  ].map(s=>`<div class="csv-stat-box"><div class="csv-stat-val">${s.v}</div><div class="csv-stat-label">${s.l}</div></div>`).join('');

  const step = Math.max(1, Math.floor(rows.length/300));
  const sampled = rows.filter((_,i)=>i%step===0);

  // dB line
  if(csvLineChart) csvLineChart.destroy();
  csvLineChart = new Chart(document.getElementById('csvLineChart'),{type:'line',
    data:{labels:sampled.map(r=>formatDateTime(r.ts)),datasets:[{data:sampled.map(r=>r.db),borderColor:GC.accent,borderWidth:1.5,pointRadius:0,fill:true,backgroundColor:GC.accent+'22',tension:0.3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toFixed(1)} dB`}}},
      scales:{x:{grid:{color:GC.grid},ticks:{color:GC.text3,maxTicksLimit:6,maxRotation:0}},y:{grid:{color:GC.grid},ticks:{color:GC.text3,callback:v=>v+' dB'}}}}});

  // Hz line
  if(csvHzLineChart) csvHzLineChart.destroy();
  csvHzLineChart = new Chart(document.getElementById('csvHzLineChart'),{type:'line',
    data:{labels:sampled.map(r=>formatDateTime(r.ts)),datasets:[{data:sampled.map(r=>r.hz),borderColor:GC.hz,borderWidth:1.5,pointRadius:0,fill:true,backgroundColor:GC.hz+'22',tension:0.3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toFixed(0)} Hz`}}},
      scales:{x:{grid:{color:GC.grid},ticks:{color:GC.text3,maxTicksLimit:6,maxRotation:0}},y:{grid:{color:GC.grid},ticks:{color:GC.text3,callback:v=>v+' Hz'}}}}});

  // Hourly avg dB
  const hBuckets=Array.from({length:24},()=>[]);
  rows.forEach(r=>hBuckets[r.ts.getHours()].push(r.db));
  const hAvgs=hBuckets.map(b=>b.length?b.reduce((a,c)=>a+c,0)/b.length:null);
  const hColors=hAvgs.map(v=>v===null?'#2d3f32':v<50?'#7ab87a99':v<65?'#8fb98f99':v<75?'#c9a85c99':'#c97a6a99');
  if(csvHourChart) csvHourChart.destroy();
  csvHourChart = new Chart(document.getElementById('csvHourChart'),{type:'bar',
    data:{labels:Array.from({length:24},(_,i)=>`${String(i).padStart(2,'0')}:00`),datasets:[{data:hAvgs,backgroundColor:hColors,borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.raw?` ${ctx.raw.toFixed(1)} dB`:' no data'}}},
      scales:{x:{grid:{color:GC.grid},ticks:{color:GC.text3,font:{size:9},maxRotation:45}},y:{grid:{color:GC.grid},ticks:{color:GC.text3,callback:v=>v+' dB'}}}}});

  // Hz distribution
  const hzBands=[[0,100],[100,250],[250,500],[500,1000],[1000,2000],[2000,5000],[5000,10000],[10000,99999]];
  const hzLabels=['<100','100–250','250–500','500–1k','1–2k','2–5k','5–10k','10k+'];
  const hzCounts=hzBands.map(([lo,hi])=>hzs.filter(h=>h>=lo&&h<hi).length);
  if(csvHzDistChart) csvHzDistChart.destroy();
  csvHzDistChart = new Chart(document.getElementById('csvHzDistChart'),{type:'bar',
    data:{labels:hzLabels,datasets:[{data:hzCounts,backgroundColor:['#7ab87a99','#8fb98f99','#a8c9a899','#b5c9a199','#c9a85c99','#c98a5c99','#c97a6a99','#a07a7a99'],borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw} readings`}}},
      scales:{x:{grid:{color:GC.grid},ticks:{color:GC.text3,font:{size:9}}},y:{grid:{color:GC.grid},ticks:{color:GC.text3}}}}});

  // dB distribution
  const bSize=5, bkts={};
  dbs.forEach(d=>{const b=Math.floor(d/bSize)*bSize; bkts[b]=(bkts[b]||0)+1;});
  const dLabels=Object.keys(bkts).sort((a,b)=>+a-+b).map(b=>`${b}–${+b+bSize}`);
  const dVals=Object.keys(bkts).sort((a,b)=>+a-+b).map(b=>bkts[b]);
  const dColors=Object.keys(bkts).sort((a,b)=>+a-+b).map(b=>+b<50?'#7ab87a99':+b<65?'#8fb98f99':+b<75?'#c9a85c99':'#c97a6a99');
  if(csvDistChart) csvDistChart.destroy();
  csvDistChart = new Chart(document.getElementById('csvDistChart'),{type:'bar',
    data:{labels:dLabels,datasets:[{data:dVals,backgroundColor:dColors,borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw} readings`}}},
      scales:{x:{grid:{color:GC.grid},ticks:{color:GC.text3,font:{size:9},maxRotation:45}},y:{grid:{color:GC.grid},ticks:{color:GC.text3}}}}});

  // Daily dual (dB + Hz)
  const dayBkts={};
  rows.forEach(r=>{
    const k=r.ts.toISOString().slice(0,10);
    if(!dayBkts[k]) dayBkts[k]={dbs:[],hzs:[]};
    dayBkts[k].dbs.push(r.db); dayBkts[k].hzs.push(r.hz);
  });
  const dls=Object.keys(dayBkts).sort();
  const dayAvgDb=dls.map(d=>dayBkts[d].dbs.reduce((a,b)=>a+b,0)/dayBkts[d].dbs.length);
  const dayAvgHz=dls.map(d=>dayBkts[d].hzs.reduce((a,b)=>a+b,0)/dayBkts[d].hzs.length);
  if(csvDailyChart) csvDailyChart.destroy();
  csvDailyChart = new Chart(document.getElementById('csvDailyChart'),{type:'line',
    data:{labels:dls.map(d=>formatDate(new Date(d))),datasets:[
      {label:'Avg dB',data:dayAvgDb,borderColor:GC.accent,borderWidth:2,pointRadius:3,pointBackgroundColor:GC.accent,fill:false,tension:0.3,yAxisID:'y'},
      {label:'Avg Hz',data:dayAvgHz,borderColor:GC.hz,borderWidth:2,pointRadius:3,pointBackgroundColor:GC.hz,fill:false,tension:0.3,yAxisID:'y2'}
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:true,labels:{color:GC.text,boxWidth:12,font:{size:10}}},tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)}`}}},
      scales:{
        x:{grid:{color:GC.grid},ticks:{color:GC.text3,font:{size:9},maxRotation:45},border:{color:GC.border}},
        y:{position:'left',grid:{color:GC.grid},ticks:{color:GC.accent,callback:v=>v+' dB'},border:{color:GC.border}},
        y2:{position:'right',grid:{display:false},ticks:{color:GC.hz,callback:v=>v+' Hz'},border:{color:GC.border}}
      }}});

  // Preview table
  const preview = rows.slice(0,50);
  document.getElementById('csv-preview-tbody').innerHTML = preview.map((r,i)=>{
    const lvl = r.db<45?`<span style="color:#7ab87a">Quiet</span>`:r.db<60?`<span style="color:#8fb98f">Moderate</span>`:r.db<75?`<span style="color:#c9a85c">Loud</span>`:`<span style="color:#c97a6a">Very Loud</span>`;
    return `<tr><td class="mono" style="color:var(--text3)">${i+1}</td><td class="mono" style="font-size:0.75rem">${formatDateTime(r.ts)}</td><td class="mono" style="color:${r.db>=70?'var(--danger)':'var(--text)'}">${r.db.toFixed(2)}</td><td class="mono" style="color:${hzColor(r.hz)}">${r.hz}</td><td>${lvl}</td></tr>`;
  }).join('');
  document.getElementById('csv-preview-note').textContent = rows.length>50?`Showing first 50 of ${rows.length} readings`:`All ${rows.length} readings shown`;
}

function clearCsvCharts() {
  [csvLineChart,csvHzLineChart,csvHourChart,csvHzDistChart,csvDistChart,csvDailyChart].forEach(c=>{if(c)c.destroy();});
  csvLineChart=csvHzLineChart=csvHourChart=csvHzDistChart=csvDistChart=csvDailyChart=null;
}
